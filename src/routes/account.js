import { Router } from 'express';

import * as controller from '../controllers/account.js';

export const account_router = Router();

// No authorisation required to call

account_router.post("/register", controller.post_account_register);
account_router.post("/login", controller.post_account_login);

// Logged in users

account_router.post("/change-password", controller.post_account_change_password);

// Admin only

account_router.get("/:account_id", controller.admin_get_account_by_id);
account_router.get("", controller.admin_get_account_query);