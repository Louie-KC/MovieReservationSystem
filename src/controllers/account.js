import asyncHandler from 'express-async-handler';
import { Check, verify } from '../utils/checker.js';
import { Account } from '../models/account.js';
import * as Auth from '../services/auth.js';

// POST /account/register
export const postAccountRegister = asyncHandler(async (req, res, next) => {
    if (!req.body || !Account.validateFieldsRegister(req.body)) {
        res.status(400).json({ reason: "Invalid registration body" })
        return;
    }
    
    const result = await Account.registerInDb(req.body);
    if (result.err) {
        res.status(500).send();
        return;
    }
    if (result.emailAlreadyTaken) {
        res.status(400).json({ reason: "Email address already in use" });
        return;
    }
    
    res.status(200).send();
});

// POST /account/login
export const postAccountLogin = asyncHandler(async (req, res, next) => {
    if (!req.body || !Account.validateFieldsLogin(req.body)) {
        res.status(400).json({ reason: "Invalid login body" });
        return;
    }

    const result = await Account.login(req.body);
    if (result.err) {
        res.status(500).send();
        return;
    }
    if (!result.userId) {
        res.status(401).send();
        return;
    }

    const token = Auth.createJWT(result.userId, req.body.email);

    res.status(200).json({ token: token });
})

// POST /account/change-password
export const postAccountChangePassword = asyncHandler(async (req, res, next) => {
    if (!req.body || !Account.validateFieldsChangePassword(req.body)) {
        res.status(400).json({ reason: "Invalid change password body" });
        return;
    }

    // Extract and check JWT token from header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.status(400).json({ reason: "Missing token" });
        return;
    }
    const token = authHeader.split(' ')[1];
    const tokenData = Auth.verifyExtractJWT(token);
    if (!tokenData.valid) {
        res.status(401).send();
        return;
    }

    // Try change password
    const result = await Account.changePassword(tokenData.userId, req.body);
    if (result.err) {
        res.status(500).send();
        return;
    }
    if (!result.correctOld) {
        res.status(401).send();
        return;
    }
    if (!result.changed) {
        res.status(400).json({ reason: "Invalid userId in token" });
        return;
    }
    res.status(200).send();
})

// GET /account/{account_id}
export const adminGetAccountById = asyncHandler(async (req, res, next) => {
    const queryAccountId = req.params.account_id;
    if (!verify(queryAccountId, [Check.IS_ONLY_DIGITS])) {
        res.status(400).json({ reason: "account_id is not an integer" });
        return;
    }

    const adminCheck = await Auth.tokenAdminCheck(req);
    if (adminCheck !== null) {
        res.status(adminCheck).send();
        return;
    }
    
    const result = await Account.findById(queryAccountId);

    if (result.err) {
        console.log(result.err);
        if (result.err === "No result") {
            res.status(400).json({ reason: "No account with account_id" });
        } else {
            res.status(500).send();
        }
        return;
    }
    res.status(200).json(result.info);
});

// GET /account?name={name}&email={email}
export const adminGetAccountQuery = asyncHandler(async (req, res, next) => {
    const queryName  = req.query.name  !== undefined ? req.query.name  : "";
    const queryEmail = req.query.email !== undefined ? req.query.email : "";

    // Input validation
    if (queryName.length === 0 && queryEmail.length === 0) {
        res.status(400).json({ reason: "No valid query parameters specified" });
        return;
    }

    const nameValidLen  = (queryName.length  === 0 || queryName.length  >= 3);
    const emailValidLen = (queryEmail.length === 0 || queryEmail.length >= 3);

    if (!nameValidLen || !emailValidLen) {
        res.status(400).json({ reason: "One or both query parameters are too short" });
        return;
    }
    if (queryEmail.length !== 0 && !verify(queryEmail, [Check.IS_EMAIL, Check.NO_SEMICOLON])) {
        res.status(400).json({ reason: "Bad email query parameter" });
        return;
    }
    if (!verify(queryName, [Check.IS_ALPHABETICAL, Check.NO_SEMICOLON])) {
        res.status(400).json({ reason: "Bad name query parameter" });
        return;
    }

    // Auth
    const adminCheck = await Auth.tokenAdminCheck(req);
    if (adminCheck !== null) {
        res.status(adminCheck).send();
        return;
    }

    // DB query
    const result = await Account.findByPartialInfo(queryName, queryEmail);
    console.log(result);
    if (result.err) {
        console.log(result.err);
        res.status(500).send();
        return;
    }

    res.status(200).json(result.info);
});

// POST /admin/account/promote-to-admin
export const adminPromoteToAdmin = asyncHandler(async (req, res, next) => {
    if (!req.body || !Account.validateFieldsChangeKind(req.body)) {
        res.status(400).json({ reason: "Invalid body" });
        return;
    }

    // Authorisation
    const adminCheck = await Auth.tokenAdminCheck(req);
    if (adminCheck !== null) {
        res.status(adminCheck).send();
        return;
    }

    const status = await Account.changeKind(req.body, 'admin');
    if (status.err) {
        console.log(status.err);
        res.status(500).send();
        return;
    }
    if (status.changed) {
        res.status(200).send();
    } else {
        res.status(400).json({ reason: "Incorrect account_id" });
    }
});
