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
     * Validates a qrequest body for use with Account.changeKind()
     * 
     * @param {Object} body 
     * @returns {boolean} true if valid, false otherwise
     */
    static validateFieldsChangeKind(body) {
        if (!verify(body.account_id, [Check.IS_ONLY_DIGITS])) {
            console.log("account_id fail");
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

    /**
     * ADMIN
     * 
     * Set user kind to 'admin' or 'customer'.
     * 
     * @param {Object} validatedBody See Account.validateFieldsChangeKind()
     * @param {string} kind 'admin' | 'customer'
     */
    static async changeKind(validatedBody, kind) {
        const status = {
            changed: false,
            err: null
        };

        try {
            const [result, _] = await dbConnPool.execute(
                `UPDATE User
                SET kind = ?
                WHERE id = ?`,
                [kind, validatedBody.account_id]
            );
            status.changed = result.affectedRows === 1;
        } catch (err) {
            status.err = err;
        }

        return status;
    }

    /**
     * ADMIN
     * 
     * Find user information by partial name and/or email matches.
     * 
     * @param {string} name 
     * @param {string} email 
     * @returns Object { info: [], err }
     */
    static async findByPartialInfo(name, email) {
        const status = {
            info: null,
            err: null
        };

        try {
            const [rows, _] = await dbConnPool.execute(
                // LIKE wildcards must be String interpolated into the query
                `SELECT 
                    id,
                    given_name as 'given',
                    last_name as 'last',
                    email_addr as 'email'
                FROM User
                WHERE (given_name LIKE ? OR last_name LIKE ?)
                AND email_addr LIKE ?`,
                [`%${name}%`, `%${name}%`, `%${email}%`]
            );

            console.log(rows);
            status.info = rows;
        } catch (err) {
            status.err = err;
        }

        return status;
    }

    static async findById(id) {
        const status = {
            info: null,
            err: null
        };

        try {
            const [row, _] = await dbConnPool.execute(
                `SELECT 
                    id,
                    given_name as 'given',
                    last_name as 'last',
                    email_addr as 'email'
                FROM User
                WHERE id = ?
                LIMIT 1`,
                [id]
            );
            if (row.length === 0) {
                status.err = "No result";
            } else {
                status.info = row[0];
            }
        } catch (err) {
            status.err = err;
        }

        return status;
    }
}
