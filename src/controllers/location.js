import asyncHandler from 'express-async-handler';

import { Location } from '../models/location.js'

// GET /location
export const getLocationList = asyncHandler(async (req, res, next) => {
    try {
        const locations = await Location.findAll();
        console.log(locations);
        if (!locations) {
            console.log("getLocationList: Query error");
            res.status(500);
            next();
            return;
        }
        res.status(200).json(locations);
    } catch (err) {
        console.log(err);
        next(err);
    }
});
