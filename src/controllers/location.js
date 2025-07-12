import asyncHandler from 'express-async-handler';

// GET /location
export const location_list = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Location list");
    console.log("location controller invoked");
});
