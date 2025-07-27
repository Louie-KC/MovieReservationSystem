import bcrypt from "bcrypt";
import { dbConnPool } from "../services/database.js"; 
import { Check, verify } from "../utils/checker.js";

const SALT_ROUNDS = 10;

export class Account {

    /**
     * Validates a request body for use with Account.registerInDb()
     * 
     * @param {Object} body 
     * @returns {boolean} true if valid, false otherwise
     */
    static validateFieldsRegister(body) {
        if (!verify(body.given_name, [Check.IS_ALPHABETICAL])) {
            console.log("given_name fail");
            return false;
        }
        if (!verify(body.last_name, [Check.IS_ALPHABETICAL])) {
            console.log("last_name fail");
            return false;
        }
        if (!verify(body.email, [Check.IS_EMAIL])) {
            console.log("email fail");
            return false;
        }
        if (!verify(body.password, [Check.IS_VALID_PASSWORD])) {
            console.log("password fail");
            return false;
        }
        
        return true;
    }
    
    /**
     * Validates a request body for use with Account.login()
     * 
     * @param {Object} body 
     * @returns {boolean} true if valid, false otherwise
     */
    static validateFieldsLogin(body) {
        if (!verify(body.email, [Check.IS_EMAIL])) {
            console.log("email fail");
            return false;
        }
        if (!verify(body.password, [Check.IS_VALID_PASSWORD])) {
            console.log("password fail");
            return false;
        }
        return true;
    }
    
    /**
     * Validates a request body for user with Account.changePassword()
     * 
     * @param {Object} body 
     * @returns {boolean} true if valid, false otherwise
     */
    static validateFieldsChangePassword(body) {
        if (!verify(body.old, [Check.IS_VALID_PASSWORD])) {
            console.log("old fail");
            return false;
        }
        if (!verify(body.new, [Check.IS_VALID_PASSWORD])) {
            console.log("new fail");
            return false;
        }
        return true;
    }

    /**
     * Register user in database if the email address is not in use.
     * 
     * @param {Object} validatedBody See Account.validateFieldsRegister()
     * @returns {Object} { emailAlreadyTaken, err }
     */
    static async registerInDb(validatedBody) {
        const status = {
            emailAlreadyTaken: false,
            err: undefined
        };
        try {
            await bcrypt.hash(validatedBody.password, SALT_ROUNDS).then(async function (hash) {
                const [result, _] = await dbConnPool.execute(
                    `INSERT IGNORE INTO User (given_name, last_name, email_addr, password_hash, kind)
                    VALUES (?, ?, ?, ?, 'customer')`,
                    [validatedBody.given_name, validatedBody.last_name, validatedBody.email, hash]
                );
                status.emailAlreadyTaken = result.affectedRows === 0;
            })
        } catch (err) {
            status.err = err;
        }
        return status;
    }

    /**
     * Verify the login request body against stored data, returning the logged
     * userId mapped to the requested user if valid.
     * 
     * @param {Object} validatedBody See Account.validateFieldsLogin()
     * @returns {Object} { userId, err }
     */
    static async login(validatedBody) {
        const status = {
            userId: null,
            err: null
        }
        var userId = null;
        var storedHash = null;

        try {
            const [result, _] = await dbConnPool.execute(
                `SELECT id, password_hash
                FROM User
                WHERE email_addr = ?
                LIMIT 1;`,
                [validatedBody.email]
            );

            if (result.length === 1) {
                userId = result[0].id;
                storedHash = result[0].password_hash;
            }
        } catch (err) {
            status.err = err;
        }
        
        if (storedHash && await bcrypt.compare(validatedBody.password, storedHash)) {
            status.userId = userId;
        }

        return status;
    }

    /**
     * Change the password for a userId with a change password request body.
     * 
     * Checks the old password is correct prior to calculating and updating the
     * stored hash.
     * 
     * @param {number} userId 
     * @param {Object} validatedBody See Account. validateFieldsChangePassword()
     * @returns {Object} { correctOld, changed, err }
     */
    static async changePassword(userId, validatedBody) {
        const status = {
            correctOld: false,
            changed: false,
            err: null
        };

        // Test 'old' password is correct before generating & updating hash
        try {
            const [result, _] = await dbConnPool.execute(
                `SELECT password_hash as 'oldHash'
                FROM User
                WHERE id = ?`,
                [userId]
            );

            if (await bcrypt.compare(validatedBody.old, result[0].oldHash)) {
                status.correctOld = true;
            }
        } catch (err) {
            status.err = err;
        }

        if (!status.correctOld) {
            return status;
        }

        // Calculate and update stored hash
        try {
            await bcrypt.hash(validatedBody.new, SALT_ROUNDS).then(async function (hash) {
                const [result, _] = await dbConnPool.execute(
                    `UPDATE User
                    SET password_hash = ?
                    WHERE id = ?`,
                    [hash, userId]
                );
                status.changed = result.affectedRows === 1;
            });
        } catch (err) {
            status.err = err;
        }
        return status;
    }
}
