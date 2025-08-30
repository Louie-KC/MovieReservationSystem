import { Router } from 'express';

import * as controller from '../controllers/schedule.js';

export const scheduleRouter = Router();

// No authorisation

scheduleRouter.get("", controller.getScheduleQuery);
scheduleRouter.get("/:schedule_id", controller.getScheduleById);
scheduleRouter.get("/:schedule_id/seats", controller.getScheduleSeatsById);

// Admin only

scheduleRouter.get("/:location_id/:cinema_id", controller.adminGetCinemaSchedule);
scheduleRouter.post("", controller.adminPostNewSchedule);
scheduleRouter.put("/:schedule_id", controller.adminPutUpdateSchedule);
scheduleRouter.delete("/:schedule_id", controller.adminDeleteSchedule);
