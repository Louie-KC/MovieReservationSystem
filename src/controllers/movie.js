import asyncHandler from 'express-async-handler';

import { Check, verify } from '../utils/checker.js';
import * as Auth  from '../services/auth.js';
import { Movie } from '../models/movie.js';

// GET /movie?genre={genre}
export const getMovieQuery = asyncHandler(async (req, res, next) => {
    // Validation
    const { genre } = req.query;

    if (genre && !verify(genre, [Check.IS_ALPHABETICAL, Check.NO_SEMICOLON])) {
        return res.status(400).json({reason: "Invalid genre value"});
    }
    
    // Operation
    const movies = genre
        ? await Movie.findByGenre(genre)
        : await Movie.findAll();

    if (!movies) {
        return res.status(500).send();
    }

    res.status(200).json(movies);
})

// GET /movie/{movie_id}
export const getMovieById = asyncHandler(async (req, res, next) => {
    // Validation
    const movieId = req.params.movie_id;

    if (!verify(movieId, [Check.IS_INTEGER])) {
        return res.status(400).json({reason: "Invalid movie id"});
    }

    const movieIdNumber = +movieId;
    
    // Operation
    const movie = await Movie.findByID(movieIdNumber);
    if (!movie) {
        return res.status(404).send();
    }

    delete movie.id;  // id known in request
    res.status(200).json(movie);
});

// POST /movie
export const adminPostNewMovie = asyncHandler(async (req, res, next) => {
    // Authorisation
    const adminCheck = await Auth.extractVerifyJWT(req, true);
    if (adminCheck.failHttpCode !== null) {
        return res.status(adminCheck.failHttpCode).send();
    }
    if (!adminCheck.isAdmin) {
        return res.status(403).send();
    }

    // Validation
    if (!req.body || !Movie.validateFields(req.body)) {
        return res.status(400).json({ reason: "Invalid body" });
    }

    // Operation
    const movie = new Movie(req.body);
    const result = await movie.saveNewInDb();

    if (!result.movie_succeeded) {
        return res.status(500).send();
    }

    if (result.fail.length > 0) {
        res.status(400).json({ reason: `invalid genre(s): ${result.fail}` });
    } else {
        res.status(201).json({ id: result.movie_id });
    }
});

// PUT /movie/{movie_id}
export const adminPutUpdateMovie = asyncHandler(async (req, res, next) => {
    // Authorisation
    const adminCheck = await Auth.extractVerifyJWT(req, true);
    if (adminCheck.failHttpCode !== null) {
        return res.status(adminCheck.failHttpCode).send();
    }
    if (!adminCheck.isAdmin) {
        return res.status(403).send();
    }

    // Validation
    const movieId = req.params.movie_id;
    if (!verify(movieId, [Check.IS_INTEGER])) {
        return res.status(400).json({ reason: "Invalid movie_id format" });
    }
    if (!req.body || !Movie.validateFields(req.body)) {
        return res.status(400).json({ reason: "Invalid body" });
    }

    // Operation
    const updatedMovie = new Movie(req.body);
    const result = await updatedMovie.updateInDb(movieId);

    if (result.exception) {
        return res.status(500).send();
    }
    if (!result.movieIdExists) {
        return res.status(404).send();
    }
    if (result.failedGenres.length > 0) {
        return res.status(400).json({ reason: `invalid genre(s): ${result.failedGenres}`});
    }
    res.status(200).send();
});

// DELETE /movie/{movie_id}
export const adminDeleteMovieById = asyncHandler(async (req, res, next) => {
    // Authorisation
    const adminCheck = await Auth.extractVerifyJWT(req, true);
    if (adminCheck.failHttpCode !== null) {
        return res.status(adminCheck.failHttpCode).send();
    }
    if (!adminCheck.isAdmin) {
        return res.status(403).send();
    }

    // Validation
    const movieId = req.params.movie_id;
    if (!verify(movieId, [Check.IS_INTEGER])) {
        return res.status(400).json({ reason: "Invalid movie_id format" });
    }
    const force = req.query.force !== undefined;

    // Operation
    const result = await Movie.softDeleteInDb(movieId, force);
    
    if (result.exception) {
        return res.status(500).send();
    }
    if (!result.movieIdExists) {
        return res.status(404).send();
    }
    if (result.blockedByReservation) {
        return res.status(409).send();
    }
    res.status(200).send();
});
