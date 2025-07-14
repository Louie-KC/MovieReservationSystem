import asyncHandler from 'express-async-handler';

// GET /movie?genre={genre}
export const getMovieQuery = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: getMovieQuery. genre ${req.query.genre}`);
})

// GET /movie/{movie_id}
export const getMovieById = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: getMovieById ${req.params.movie_id}`);
});

// PUT /movie
export const adminPutNewMovie = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: adminPutNewMovie`);
});

// POST /movie/{movie_id}
export const adminPostUpdateMovie = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: adminPostUpdateMovie. id ${req.params.movie_id}`);
});

// PATCH /movie/{movie_id}
export const adminPatchMovieAvailability = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: adminPatchMovieAvailability. id ${req.params.movie_id}`);
})

// DELETE /movie/{movie_id}
export const adminDeleteMovieById = asyncHandler(async (req, res, next) => {
    res.send(`NOT IMPLEMENTED: adminDeleteMovieById. id ${req.params.movie_id}`);
})