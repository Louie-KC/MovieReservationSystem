import { Router } from 'express';

import * as controller from '../controllers/order.js';

export const orderRouter = Router();

// Customer only

orderRouter.get("/history", controller.getOrderHistory);
orderRouter.post("/reserve", controller.postOrderReserve);
orderRouter.post("/confirm", controller.postOrderConfirm);
orderRouter.post("/cancel", controller.postOrderCancel);
