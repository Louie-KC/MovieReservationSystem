import asyncHandler from 'express-async-handler';
import { Check, verify } from '../utils/checker.js';
import * as Auth  from '../services/auth.js';
import { Schedule } from '../models/schedule.js';

// GET /schedule?location={location_id}&date={YYYY-MM-DD}
export const getScheduleQuery = asyncHandler(async (req, res, next) => {
    // Validation
    const locationId = req.query.location;
    var date = null;

    if (!verify(locationId, [Check.IS_INTEGER])) {
        console.log(locationId);
        return res.status(400).json({ reason: "Invalid location_id" });
    }
    if (req.query.date !== undefined) {
        // Check specified date
        if (!verify(req.query.date, [Check.IS_DATE])) {
            return res.status(400).json({ reason: "Invalid date" });
        }
        date = req.query.date;
    } else {
        // Assume current date
        date = new Date().roundOutMs().toISODateOnly();
    }

    // Operation
    const schedules = await Schedule.findAvailableByLocationDate(locationId, date);
    if (schedules === null) {
        return res.status(500).send();
    }
    res.status(200).json(schedules)
});

// GET /schedule/{schedule_id}
export const getScheduleById = asyncHandler(async (req, res, next) => {
    // Authorisation
    const tokenCheck = await Auth.extractVerifyJWT(req, true);
    if (tokenCheck.failHttpCode !== null) {
        return res.status(tokenCheck.failHttpCode).send();
    }

    const scheduleId = req.params.schedule_id;
    if (!verify(scheduleId, [Check.IS_INTEGER])) {
        return res.status(400).json({ reason: "Invalid schedule id value" });
    }

    const schedule = await Schedule.findById(+scheduleId, tokenCheck.userId);
    if (!schedule) {
        return res.status(500).send();
    }
    if (schedule === "No result") {
        return res.status(404).send();
    }
    if (!tokenCheck.isAdmin && !schedule.requesterHasReservation) {
        return res.status(403).send();
    }
    
    delete schedule.id;  // id known by client in request
    delete schedule.requesterHasReservation;  // not needed by client
    res.status(200).json(schedule);
});

// GET /schedule/{schedule_id}/seats
export const getScheduleSeatsById = asyncHandler(async (req, res, next) => {
    const scheduleId = req.params.schedule_id;
    if (!verify(scheduleId, [Check.IS_INTEGER])) {
        return res.status(400).json({ reason: "Invalid schedule id value" });
    }

    const scheduleIdNumber = +scheduleId;

    const seatingInfo = await Schedule.findSeatingAvailabilityById(scheduleIdNumber);
    if (!seatingInfo) {
        return res.status(500).send();
    }

    if (seatingInfo.length === 0) {
        return res.status(404).send();
    }

    res.status(200).json(seatingInfo);
});

// GET /schedule/{location_id}/{cinema_id}?date={YYYY-MM-DD}
export const adminGetCinemaSchedule = asyncHandler(async (req, res, next) => {
    const { location_id, cinema_id } = req.params;
    const date = req.query.date;

    // Authorisation
    const adminCheck = await Auth.extractVerifyJWT(req, true);
    if (adminCheck.failHttpCode !== null) {
        return res.status(adminCheck.failHttpCode).send();
    }
    if (!adminCheck.isAdmin) {
        return res.status(403).send();
    }

    if (!verify(location_id, [Check.IS_INTEGER])) {
        return res.status(400).json({ reason: `location_id (${locationId}) is non-numeric` });
    }

    if (!verify(cinema_id, [Check.IS_INTEGER])) {
        return res.status(400).json({ reason: `cinema_id (${cinemaId}) is non-numeric` });
    }

    if (!verify(date, [Check.IS_DATE])) {
        return res.status(400).json({ reason: "Invalid or missing date query parameter" });
    }

    const locationIdNumber = +location_id;
    const cinemaIdNumber = +cinema_id;

    const cinemaSchedule = await Schedule.findCinemaSchedule(locationIdNumber, cinemaIdNumber, date);
    if (!cinemaSchedule) {
        return res.status(500).send();
    }
    if (cinemaSchedule.length === 0) {
        return res.status(404).send();
    }

    res.status(200).json(cinemaSchedule);
});

// POST /schedule
export const adminPostNewSchedule = asyncHandler(async (req, res, next) => {
    // Authorisation
    const adminCheck = await Auth.extractVerifyJWT(req, true);
    if (adminCheck.failHttpCode !== null) {
        return res.status(adminCheck.failHttpCode).send();
    }
    if (!adminCheck.isAdmin) {
        return res.status(403).send();
    }

    // Validation
    if (!req.body || !Schedule.validateFields(req.body)) {
        return res.status(400).json({ reason: "Invalid body" });
    }

    // Operation
    const schedule = new Schedule(req.body);
    const proposedTime = Date.parse(schedule.time);
    if (proposedTime < Date.now()) {
        return res.status(400).json({ reason: "Time value is in the past" });
    }

    const status = await schedule.saveNewInDb();
    if (status.err === "Movie ID does not exist" || status.err === "Schedule clash") {
        return res.status(400).json({ reason: status.err });
    }
    if (status.err) {
        return res.status(500).send();
    }
    if (status.schedule_id === null) {
        return res.status(400).send();
    }
    res.status(201).json({ id: status.schedule_id });
});

// PUT /schedule/{schedule_id}
export const adminPutUpdateSchedule = asyncHandler(async (req, res, next) => {
    // Authorisation
    const adminCheck = await Auth.extractVerifyJWT(req, true);
    if (adminCheck.failHttpCode !== null) {
        return res.status(adminCheck.failHttpCode).send();
    }
    if (!adminCheck.isAdmin) {
        return res.status(403).send();
    }
    
    // Validation
    const scheduleId = req.params.schedule_id;
    if (!verify(scheduleId, [Check.IS_INTEGER])) {
        return res.status(400).json({ reason: "Invalid schedule_id" });
    }
    const force = req.params.force !== undefined;
    if (!req.body || !Schedule.validateFields(req.body)) {
        return res.status(400).json({ reason: "Invalid body" });
    }

    // Operation
    const updatedSchedule = new Schedule(req.body);
    const result = await updatedSchedule.updateInDB(scheduleId, force);

    if (result.exception) {
        return res.status(500).send();
    }
    if (!result.scheduleIdExists) {
        return res.status(404).send();
    }
    if (result.blockedByReservation) {
        return res.status(409).send();
    }
    res.status(200).send();
});

// DELETE /schedule/{schedule_id}
export const adminDeleteSchedule = asyncHandler(async (req, res, next) => {
    // Authorisation
    const adminCheck = await Auth.extractVerifyJWT(req, true);
    if (adminCheck.failHttpCode !== null) {
        return res.status(adminCheck.failHttpCode).send();
    }
    if (!adminCheck.isAdmin) {
        return res.status(403).send();
    }

    // Validation
    const scheduleId = req.params.schedule_id;
    if (!verify(scheduleId, [Check.IS_INTEGER])) {
        return res.status(400).json({ reason: "Invalid schedule_id format" });
    }
    const force = req.query.force !== undefined;

    // Operation
    const result = await Schedule.softDeleteInDb(scheduleId, force);

    if (result.exception) {
        return res.status(500).send();
    }
    if (!result.scheduleIdExists) {
        return res.status(404).send();
    }
    if (result.blockedByReservation) {
        return res.status(409).send();
    }
    res.status(200).send();
});
