import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);

// GET /api/dashboard/stats
dashboardRouter.get('/stats', requirePermission(PERMISSIONS.CASE_VIEW), (req: Request, res: Response) => {
  const stats = dbStore.getDashboardStats();
  res.json(stats);
});
