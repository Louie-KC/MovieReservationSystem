import asyncHandler from 'express-async-handler';

// GET /account/{account_id}
export const admin_get_account_by_id = asyncHandler(async (req, res, next) => {
    const query_account_id = req.params.account_id;
    res.send(`NOT IMPLEMENTED: admin_get_account_by_id. location ${query_account_id}`);
})

// GET /account?name={name}&email={email}
export const admin_get_account_query = asyncHandler(async (req, res, next) => {
    const query_name_part = req.query.name;
    const query_email_part = req.query.email;
    res.send(`NOT IMPLEMENTED: admin_get_account_query. 
        name ${query_name_part}, email ${query_email_part}`);
});