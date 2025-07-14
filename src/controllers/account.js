import asyncHandler from 'express-async-handler';

// POST /account/register
export const postAccountRegister = asyncHandler(async (req, res, next) => {
    const email = req.params.email;
    res.send(`NOT IMPLEMENTED: postAccountRegister. email ${email}`);
});

// POST /account/login
export const postAccountLogin = asyncHandler(async (req, res, next) => {
    const email = req.params.email;
    res.send(`NOT IMPLEMENTED: postAccountLogin. email ${email}`);
})

// POST /account/change-password
export const postAccountChangePassword = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: postAccountChangePassword");
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