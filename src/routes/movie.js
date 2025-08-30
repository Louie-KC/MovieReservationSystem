import { Router } from 'express';

import * as controller from '../controllers/movie.js';

export const movieRouter = Router();

// No authorisation

movieRouter.get("", controller.getMovieQuery);
movieRouter.get("/:movie_id", controller.getMovieById);

// Admin only

movieRouter.post("", controller.adminPostNewMovie);
movieRouter.put("/:movie_id", controller.adminPutUpdateMovie);
// movieRouter.patch(":movie_id", controller.adminPatchMovieAvailability);
movieRouter.delete("/:movie_id", controller.adminDeleteMovieById);
