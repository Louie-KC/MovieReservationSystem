import asyncHandler from 'express-async-handler';

// GET /schedule?location={location id}&date={YYYY-MM-DD}
export const getScheduleQuery = asyncHandler(async (req, res, next) => {
    const { location, date } = req.query;
    res.send(`NOT IMPLEMENTED: getScheduleQuery. location ${location}, date ${date}`);
})

// GET /schedule/{schedule_id}
export const getScheduleById = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: getScheduleById ${req.params.schedule_id}`);
});

// GET /schedule/{schedule_id}/seats
export const getScheduleSeatsById = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: getScheduleSeatsById ${req.params.schedule_id}`);
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
