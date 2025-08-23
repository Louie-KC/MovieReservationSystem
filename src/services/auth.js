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
 * Verify a JWT is valid, and if so, extract the data held by the JWT.
 * 
 * @param {string} token 
 */
export const verifyExtractJWT = (token) => {
    const status = {
        valid: false,
        userId: null,
        email: null,
    };

    if (token === undefined || token === null) {
        return status;
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
        if (!err) {
            status.valid = verify(data.userId, [Check.IS_ONLY_DIGITS])
                        && verify(data.email, [Check.IS_EMAIL]);
            status.userId = data.userId;
            status.email = data.email;
        }
    });

    return status;
}

/**
 * Utility/helper function check if a requester is an admin, performing:
 * 1. Authorization header extraction
 * 2. JWT verification
 * 3. Query if JWT userId is of an admin
 * 
 * @param {*} req a HTTP request
 * @returns null if request is from an admin, otherwise a HTTP response code.
 */
export const tokenAdminCheck = async (req) => {
    if (req.headers['authorization'] === undefined) {
        return 400;
    }
    const authHeader = req.headers['authorization'];
    if (!authHeader.startsWith("Bearer ")) {
        return 400;
    }
    const token = req.headers['authorization'].split(' ')[1];
    const jwt = verifyExtractJWT(token);
    if (!jwt.valid) {
        return 401;
    }
    const admin = await isAdmin(jwt.userId);
    if (admin.err) {
        return 500;
    }
    if (!admin.isAdmin) {
        return 401;
    }

    return null;
}

/**
 * Check if a userId is of the 'admin' type.
 * 
 * @param {number} userId 
 * @returns {Object} { isAdmin, err }
 */
export const isAdmin = async (userId) => {
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
