import asyncHandler from 'express-async-handler';

// GET /order/history
export const get_order_history = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: get_order_history");
})

// POST /order/reserve
export const post_order_reserve = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: post_order_reserve");
});

// POST /order/confirm
export const post_order_confirm = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: post_order_confirm");
});

// POST /order/cancel
export const post_order_cancel = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: post_order_cancel");
});
