import asyncHandler from 'express-async-handler';

export const get_schedule_query = asyncHandler(async (req, res, next) => {
    const query_loc_id = req.query.location_id;
    const query_date = req.query.date;

    res.send(`NOT IMPLEMENTED: get_schedule_query. location ${query_loc_id}, date ${query_date}`);
})

export const get_schedule_by_id = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: get_schedule_by_id ${req.params.schedule_id}`);
});

export const get_schedule_seats_by_id = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: get_schedule_seats_by_id ${req.params.schedule_id}`);
});

export const admin_get_cinema_schedule = asyncHandler(async (req, res, next) => {
    const req_loc_id = req.params.location_id;
    const req_cinema_id = req.params.cinema_id;
    const query_date = req.query.date;
    res.send(`NOT IMPLEMENTED: admin_get_schedule_for_cinema. loc ${req_loc_id}, cinema ${req_cinema_id}, date ${query_date}`);
});

export const admin_put_new_schedule = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: admin_put_new_schedule");
});

export const admin_post_update_schedule = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: admin_post_update_schedule");
});

export const admin_delete_schedule = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: admin_delete_schedule");
});
