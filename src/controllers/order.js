import asyncHandler from 'express-async-handler';

// GET /order/history
export const getOrderHistory = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: getOrderHistory");
})

// POST /order/reserve
export const postOrderReserve = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: postOrderReserve");
});

// POST /order/confirm
export const postOrderConfirm = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: postOrderConfirm");
});

// POST /order/cancel
export const postOrderCancel = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: postOrderCancel");
});
