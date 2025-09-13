import asyncHandler from 'express-async-handler';
import { Check, verify } from '../utils/checker.js';
import { logger } from '../utils/logger.js';
import { Account } from '../models/account.js';
import * as Auth from '../services/auth.js';

// POST /account/register
export const postAccountRegister = asyncHandler(async (req, res, next) => {
    if (!req.body || !Account.validateFieldsRegister(req.body)) {
        return res.status(400).json({ reason: "Invalid registration body" });
    }
    
    const result = await Account.registerInDb(req.body);
    if (result.err) {
        return res.status(500).send();
    }
    if (result.emailAlreadyTaken) {
        return res.status(400).json({ reason: "Email address already in use" });
    }
    
    res.status(200).send();
});

// POST /account/login
export const postAccountLogin = asyncHandler(async (req, res, next) => {
    if (!req.body || !Account.validateFieldsLogin(req.body)) {
        return res.status(400).json({ reason: "Invalid login body" });
    }

    const result = await Account.login(req.body);
    if (result.err) {
        return res.status(500).send();
    }
    if (!result.userId) {
        return res.status(401).send();
    }

    const token = Auth.createJWT(result.userId, req.body.email);

    res.status(200).json({ token: token });
})

// POST /account/change-password
export const postAccountChangePassword = asyncHandler(async (req, res, next) => {    
    const authCheck = await Auth.extractVerifyJWT(req, false);
    if (authCheck.failHttpCode !== null) {
        logger.debug(`change password authCheck.failHttpCode ${authCheck.failHttpCode}`);
        return res.status(authCheck.failHttpCode).json({ reason: authCheck.failReason });
    }
    
    if (!req.body || !Account.validateFieldsChangePassword(req.body)) {
        return res.status(400).json({ reason: "Invalid change password body" });
    }

    // Try change password
    const result = await Account.changePassword(authCheck.userId, req.body);
    if (result.err) {
        logger.debug(`change password err: ${result.err}`);
        return res.status(500).send();
    }
    if (!result.correctOld) {
        return res.status(401).send();
    }
    if (!result.changed) {
        return res.status(400).json({ reason: "Invalid userId in token" });
    }
    res.status(200).send();
})

// GET /account/{account_id}
export const adminGetAccountById = asyncHandler(async (req, res, next) => {
    // Auth
    const adminCheck = await Auth.extractVerifyJWT(req, true);
    if (adminCheck.failHttpCode !== null) {
        return res.status(adminCheck.failHttpCode).send();
    }
    if (!adminCheck.isAdmin) {
        return res.status(403).send();
    }

    const queryAccountId = req.params.account_id;
    if (!verify(queryAccountId, [Check.IS_INTEGER])) {
        return res.status(400).json({ reason: "account_id is not an integer" });
    }
    
    const result = await Account.findById(queryAccountId);

    if (result.err) {
        if (result.err === "No result") {
            return res.status(400).json({ reason: "No account with account_id" });
        } else {
            return res.status(500).send();
        }
    }
    res.status(200).json(result.info);
});

// GET /account?name={name}&email={email}
export const adminGetAccountQuery = asyncHandler(async (req, res, next) => {
    // Auth
    const adminCheck = await Auth.extractVerifyJWT(req, true);
    if (adminCheck.failHttpCode !== null) {
        return res.status(adminCheck.failHttpCode).send();
    }
    if (!adminCheck.isAdmin) {
        return res.status(403).send();
    }

    // Input validation
    const queryName  = req.query.name  !== undefined ? req.query.name  : "";
    const queryEmail = req.query.email !== undefined ? req.query.email : "";

    if (queryName.length === 0 && queryEmail.length === 0) {
        return res.status(400).json({ reason: "No valid query parameters specified" });
    }

    const nameValidLen  = (queryName.length  === 0 || queryName.length  >= 3);
    const emailValidLen = (queryEmail.length === 0 || queryEmail.length >= 3);

    if (!nameValidLen || !emailValidLen) {
        return res.status(400).json({ reason: "One or both query parameters are too short" });
    }
    if (queryEmail.length !== 0 && !verify(queryEmail, [Check.IS_EMAIL, Check.NO_SEMICOLON])) {
        console.log(queryEmail);
        return res.status(400).json({ reason: "Bad email query parameter" });
    }
    if (!verify(queryName, [Check.IS_ALPHABETICAL, Check.NO_SEMICOLON])) {
        return res.status(400).json({ reason: "Bad name query parameter" });
    }

    // DB query
    const result = await Account.findByPartialInfo(queryName, queryEmail);
    logger.debug(result);
    if (result.err) {
        return res.status(500).send();
    }

    res.status(200).json(result.info);
});

// POST /admin/account/promote-to-admin
export const adminPromoteToAdmin = asyncHandler(async (req, res, next) => {
    // Authorisation
    const adminCheck = await Auth.extractVerifyJWT(req, true);
    if (adminCheck.failHttpCode !== null) {
        return res.status(adminCheck.failHttpCode).send();
    }
    if (!adminCheck.isAdmin) {
        return res.status(403).send();
    }

    if (!req.body || !Account.validateFieldsChangeKind(req.body)) {
        return res.status(400).json({ reason: "Invalid body" });
    }

    const status = await Account.changeKind(req.body, 'admin');
    if (status.err) {
        return res.status(500).send();
    }
    if (status.changed) {
        res.status(200).send();
    } else {
        res.status(400).json({ reason: "Incorrect account_id" });
    }
});
