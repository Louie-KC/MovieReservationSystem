import asyncHandler from 'express-async-handler';

import { Location } from '../models/location.js'

// GET /location
export const getLocationList = asyncHandler(async (req, res, next) => {
    const locations = await Location.findAll();
    
    if (!locations) {
        console.log("getLocationList: Query error");
        return res.status(500).send();
    }
    res.status(200).json(locations);
});
