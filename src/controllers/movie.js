import asyncHandler from 'express-async-handler';

// GET /movie?genre={genre}
export const get_movie_query = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: get_movie_query. genre ${req.query.genre}`);
})

// GET /movie/{movie_id}
export const get_movie_by_id = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: get_movie_by_id ${req.params.movie_id}`);
});

// PUT /movie
export const admin_put_new_movie = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: admin_put_new_movie`);
});

// POST /movie/{movie_id}
export const admin_post_update_movie = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: admin_post_update_movie. id ${req.params.movie_id}`);
});

// PATCH /movie/{movie_id}
export const admin_patch_movie_availability = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: admin_patch_movie_availability. id ${req.params.movie_id}`);
})

// DELETE /movie/{movie_id}
export const admin_delete_movie_by_id = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: admin_delete_movie_by_id. id ${req.params.movie_id}`);
})