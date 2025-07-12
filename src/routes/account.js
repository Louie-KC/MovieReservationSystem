import { Router } from 'express';

import * as controller from '../controllers/account.js';

export const account_router = Router();

// Admin only

account_router.get("/:account_id", controller.admin_get_account_by_id);
account_router.get("", controller.admin_get_account_query);