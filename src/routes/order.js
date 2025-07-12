import { Router } from 'express';

import * as controller from '../controllers/order.js';

export const order_router = Router();

// Customer only

order_router.get("/history", controller.get_order_history);
order_router.post("/reserve", controller.post_order_reserve);
order_router.post("/confirm", controller.post_order_confirm);
order_router.post("/cancel", controller.post_order_cancel);