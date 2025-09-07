import jwt from "jsonwebtoken";
import { Check, verify } from "../utils/checker.js";
import { logger } from '../utils/logger.js';
import { dbConnPool } from "../services/database.js"; 

const JWT_EXPIRY = process.env.JWT_EXPIRE_TIME;

/**
 * Create a new JWT for a user.
 * 
 * @param {number} userId 
 * @param {string} email 
 * @returns A new JWT
 */
export const createJWT = (userId, email) => {
    return jwt.sign(
        { userId: userId, email: email },
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
}

/**
 * Extract and verify the JWT from a HTTP request.
 * 
 * Optionally (with `checkIfAdmin`) checks if the request is made by an admin.
 * 
 * Returns data from the JWT (see Auth.createJWT)
 * 
 * @param {*} req Http Request
 * @param {boolean} checkIfAdmin 
 * @returns 
 */
export const extractVerifyJWT = async (req, checkIfAdmin) => {
    const result = {
        valid: false,
        userId: null,
        email: null,
        isAdmin: false,
        failHttpCode: null,
        failReason: null
    };

    if (req.headers['authorization'] === undefined) {
        result.failHttpCode = 401;
        result.failReason = "Missing token";
        return result;
    }
    if (!req.headers['authorization'].startsWith('Bearer ')) {
        result.failHttpCode = 401;
        result.failReason = "Invalid token";
        return result;
    }
    const token = req.headers['authorization'].split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
        if (!err) {
            result.valid = verify(data.userId, [Check.IS_INTEGER])
            && verify(data.email, [Check.IS_EMAIL]);
            result.userId = data.userId;
            result.email = data.email;
        }
    });
    if (!result.valid) {
        result.failHttpCode = 401;
        result.failReason = "Invalid token";
        return result;
    }
    if (checkIfAdmin) {
        const check = await isAdmin(result.userId);
        if (check.err) {
            result.valid = false;
            result.failHttpCode = 500;
            logger.debug(`checkIfAdmin err: ${check.err}`);
        } else {
            result.isAdmin = check.isAdmin;
        }
    }
    return result;
}

/**
 * Check if a userId is of the 'admin' type.
 * 
 * @param {number} userId 
 * @returns {Object} { isAdmin, err }
 */
const isAdmin = async (userId) => {
    const status = {
        isAdmin: false,
        err: null
    };

    try {
        const [result, _] = await dbConnPool.execute(
            `SELECT kind = 'admin' as 'admin'
            FROM User
            WHERE id = ?
            LIMIT 1`,
            [userId]
        );
        if (result.length === 0) {
            result.err = "No DB result";
        } else {
            status.isAdmin = result[0].admin === 1;
        }
    } catch (err) {
        logger.error(`isAdmin(${userId}): ${err}`);
        status.err = err;
    }

    return status;
}
