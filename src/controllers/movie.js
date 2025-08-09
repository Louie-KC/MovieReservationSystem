import asyncHandler from 'express-async-handler';

import { Check, verify } from '../utils/checker.js';
import * as Auth  from '../services/auth.js';
import { Movie } from '../models/movie.js';

// GET /movie?genre={genre}
export const getMovieQuery = asyncHandler(async (req, res, next) => {
    const { genre } = req.query;

    if (genre && !verify(genre, [Check.IS_ALPHABETICAL, Check.NO_SEMICOLON])) {
        return res.status(400).json({reason: "Invalid genre value"});
    }
    
    const movies = genre
        ? await Movie.findByGenre(genre)
        : await Movie.findAll();

    if (!movies) {
        console.log(`getMovieQuery: Query error. genre: ${genre}`);
        return res.status(500).send();
    }

    res.status(200).json(movies);
})

// GET /movie/{movie_id}
export const getMovieById = asyncHandler(async (req, res, next) => {
    const movieId = req.params.movie_id;

    if (!verify(movieId, [Check.IS_ONLY_DIGITS])) {
        return res.status(400).json({reason: "Invalid movie id"});
    }

    const movieIdNumber = +movieId;
    
    const movie = await Movie.findByID(movieIdNumber);
    if (!movie) {
        return res.status(404).send();
    }

    delete movie.id;  // id known in request
    res.status(200).json(movie);
});

// PUT /movie
export const adminPutNewMovie = asyncHandler(async (req, res, next) => {
    if (!req.body || !Movie.validateFields(req.body)) {
        return res.status(400).json({ reason: "Invalid body" });
    }

    const adminCheckRes = await Auth.tokenAdminCheck(req);
    if (adminCheckRes !== null) {
        return res.status(adminCheckRes).send();
    }

    const movie = new Movie(req.body);
    const result = await movie.saveNewInDb();

    if (!result.movie_succeeded) {
        return res.status(500).send();
    }

    if (result.fail.length > 0) {
        res.status(400).json({ reason: `invalid genre(s): ${result.fail}` });
    } else {
        res.status(201).send();
    }
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