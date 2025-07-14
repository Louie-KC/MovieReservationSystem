import asyncHandler from 'express-async-handler';

import { Movie } from '../models/movie.js';

// GET /movie?genre={genre}
export const getMovieQuery = asyncHandler(async (req, res, next) => {
    const { genre } = req.query;

    // TODO: param verificaiton
    
    try {
        const movies = genre
            ? await Movie.findByGenre(genre)
            : await Movie.findAll();

        if (!movies) {
            console.log("getMovieQuery: Query error. genre", genre);
            res.status(500);
            next();
            return;
        }

        res.status(200).json(movies);
    } catch (err) {
        console.log(err);
        next(err);
    }
})

// GET /movie/{movie_id}
export const getMovieById = asyncHandler(async (req, res, next) => {
    const movieId = req.params.movie_id;

    // TODO: param verification

    try {
        const movie = await Movie.findByID(movieId);
        if (!movie) {
            res.status(404);
            next();
            return;
        }

        delete movie.id;  // id known in request
        res.status(200).json(movie);
    } catch (err) {
        console.log(err);
        next(err);
    }
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