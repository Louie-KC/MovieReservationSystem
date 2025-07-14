import { Router } from 'express';

import { getLocationList } from '../controllers/location.js';

export const locationRouter = Router();

// No authorisation

locationRouter.get("", getLocationList);
