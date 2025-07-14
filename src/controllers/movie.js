import asyncHandler from 'express-async-handler';

import { Check, verify } from '../utils/checker.js';
import { Movie } from '../models/movie.js';

// GET /movie?genre={genre}
export const getMovieQuery = asyncHandler(async (req, res, next) => {
    const { genre } = req.query;

    if (genre && !verify(genre, [Check.IS_ALPHABETICAL, Check.NO_SEMICOLON])) {
        res.status(400).json({reason: "Invalid genre value"});
        next();
        return;
    }
    
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

    if (!verify(movieId, [Check.IS_ONLY_DIGITS])) {
        res.status(400).json({reason: "Invalid movie id"});
        next();
        return;
    }

    const movieIdNumber = +movieId;
    
    try {
        const movie = await Movie.findByID(movieIdNumber);
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