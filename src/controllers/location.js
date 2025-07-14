import asyncHandler from 'express-async-handler';

// GET /location
export const getLocationList = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: getLocationList");
    console.log("location controller invoked");
});
