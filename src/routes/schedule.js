import { Router } from 'express';

import * as controller from '../controllers/schedule.js';

export const scheduleRouter = Router();

// No authorisation

scheduleRouter.get("", controller.getScheduleQuery);
scheduleRouter.get("/:schedule_id", controller.getScheduleById);
scheduleRouter.get("/:schedule_id/seats", controller.getScheduleById);

// Admin only

scheduleRouter.get("/:location_id/:cinema_id", controller.adminGetCinemaSchedule);
scheduleRouter.put("", controller.adminPutNewSchedule);
scheduleRouter.post("/:schedule_id", controller.adminPostUpdateSchedule);
scheduleRouter.delete("/:schedule_id", controller.adminDeleteSchedule);
