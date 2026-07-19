import * as statsRepo from '../repositories/statsRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const statsRoutes = Router();
statsRoutes.use(requireAuth);

statsRoutes.get('/', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [overview, trend, severity, recent] = await Promise.all([
    statsRepo.getStats(userId),
    statsRepo.getTrend(30, userId),
    statsRepo.getSeverityBreakdown(userId),
    statsRepo.getRecentActivity(8, userId)
  ]);
  res.json({ overview, trend, severity, recent });
}));
