import { Router } from 'express';

import * as controller from '../controllers/movie.js';

export const movie_router = Router();

// No authorisation

movie_router.get("", controller.get_movie_query);
movie_router.get("/:movie_id", controller.get_movie_by_id);

// Admin only

movie_router.put("", controller.admin_put_new_movie);
movie_router.post(":movie_id", controller.admin_post_update_movie);
movie_router.patch(":movie_id", controller.admin_patch_movie_availability);
movie_router.delete(":movie_id", controller.admin_delete_movie_by_id);