import * as statsRepo from '../repositories/statsRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const statsRoutes = Router();
statsRoutes.use(requireAuth);

statsRoutes.get('/', asyncHandler(async (req, res) => {
  const [overview, trend, severity, recent] = await Promise.all([
    statsRepo.getStats(),
    statsRepo.getTrend(30),
    statsRepo.getSeverityBreakdown(),
    statsRepo.getRecentActivity(8)
  ]);
  res.json({ overview, trend, severity, recent });
}));
