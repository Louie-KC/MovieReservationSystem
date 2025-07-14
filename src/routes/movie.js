import { Router } from 'express';

import * as controller from '../controllers/movie.js';

export const movieRouter = Router();

// No authorisation

movieRouter.get("", controller.getMovieQuery);
movieRouter.get("/:movie_id", controller.getMovieById);

// Admin only

movieRouter.put("", controller.adminPutNewMovie);
movieRouter.post(":movie_id", controller.adminPostUpdateMovie);
movieRouter.patch(":movie_id", controller.adminPatchMovieAvailability);
movieRouter.delete(":movie_id", controller.adminDeleteMovieById);
