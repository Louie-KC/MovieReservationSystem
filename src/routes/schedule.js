import { Router } from 'express';

import * as controller from '../controllers/schedule.js';

export const schedule_router = Router();

// No authorisation

schedule_router.get("", controller.get_schedule_query);
schedule_router.get("/:schedule_id", controller.get_schedule_by_id);
schedule_router.get("/:schedule_id/seats", controller.get_schedule_by_id);

// Admin only

schedule_router.get("/:location_id/:cinema_id", controller.admin_get_cinema_schedule);
schedule_router.put("", controller.admin_put_new_schedule);
schedule_router.post("/:schedule_id", controller.admin_post_update_schedule);
schedule_router.delete("/:schedule_id", controller.admin_delete_schedule);