import { Router } from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const settingsRoutes = Router();

settingsRoutes.use(requireAuth);

settingsRoutes.get('/', asyncHandler(settingsController.getSettings));
settingsRoutes.post('/', asyncHandler(settingsController.updateSettings));
