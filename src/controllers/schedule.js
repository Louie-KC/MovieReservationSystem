import asyncHandler from 'express-async-handler';
import { Check, verify } from '../utils/checker.js';
import { Schedule } from '../models/schedule.js';

// GET /schedule?location={location id}&date={YYYY-MM-DD}
export const getScheduleQuery = asyncHandler(async (req, res, next) => {
    const { location, date } = req.query;
    res.send(`NOT IMPLEMENTED: getScheduleQuery. location ${location}, date ${date}`);
})

// GET /schedule/{schedule_id}
export const getScheduleById = asyncHandler(async (req, res, next) => {
    const scheduleId = req.params.schedule_id;
    if (!verify(scheduleId, [Check.IS_ONLY_DIGITS])) {
        res.status(400).json({ reason: "Invalid schedule id value" });
        next();
        return;
    }

    const scheduleIdNumber = +scheduleId;

    try {
        const schedule = await Schedule.findById(scheduleIdNumber);
        if (!schedule) {
            res.status(500).send();
            return;
        }
        if (schedule === "No result") {
            res.status(404).send();
            return;
        }

        delete schedule.id;  // id known by client in request
        res.status(200).json(schedule);

    } catch (err) {
        console.log(err);
        next(err);
    }
});

// GET /schedule/{schedule_id}/seats
export const getScheduleSeatsById = asyncHandler(async (req, res, next) => {
    const scheduleId = req.params.schedule_id;
    if (!verify(scheduleId, [Check.IS_ONLY_DIGITS])) {
        res.status(400).json({ reason: "Invalid schedule id value" }).send();
        return;
    }

    const scheduleIdNumber = +scheduleId;

    try {
        const seatingInfo = await Schedule.findSeatingAvailabilityById(scheduleIdNumber);
        if (!seatingInfo) {
            res.status(500).send();
            return;
        }

        if (seatingInfo.length === 0) {
            res.status(404).send();
            return;
        }

        res.status(200).json(seatingInfo);
    } catch (err) {
        console.log(err);
        next(err);
    }
});

// GET /schedule/{location_id}/{cinema_id}
export const adminGetCinemaSchedule = asyncHandler(async (req, res, next) => {
    const { location_id, cinema_id } = req.params;
    const queryDate = req.query.date;
    res.send(`NOT IMPLEMENTED: adminGetCinemaSchedule. loc ${location_id}, cinema ${cinema_id}, date ${queryDate}`);
});

// PUT /schedule
export const adminPutNewSchedule = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: adminPutNewSchedule");
});

// POST /schedule/{schedule_id}
export const adminPostUpdateSchedule = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: adminPostUpdateSchedule");
});

// DELETE /schedule/{schedule_id}
export const adminDeleteSchedule = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: adminDeleteSchedule");
});
