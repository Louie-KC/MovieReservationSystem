import { Router } from 'express';

import { location_list } from '../controllers/location.js';

export const location_router = Router();

// No authorisation

location_router.get("", location_list);