import asyncHandler from 'express-async-handler';
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
    res.send(`NOT IMPLEMENTED: adminGetAccountById. location ${queryAccountId}`);
})

// GET /account?name={name}&email={email}
export const adminGetAccountQuery = asyncHandler(async (req, res, next) => {
    const { name, email } = req.query;
    res.send(`NOT IMPLEMENTED: adminGetAccountQuery. name ${name}, email ${email}`);
});