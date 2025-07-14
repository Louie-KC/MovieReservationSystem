import { Router } from 'express';

import * as controller from '../controllers/account.js';

export const accountRouter = Router();

// No authorisation required to call

accountRouter.post("/register", controller.postAccountRegister);
accountRouter.post("/login", controller.postAccountLogin);

// Logged in users

accountRouter.post("/change-password", controller.postAccountChangePassword);

// Admin only

accountRouter.get("/:account_id", controller.adminGetAccountById);
accountRouter.get("", controller.adminGetAccountQuery);
