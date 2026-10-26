import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const mapRouter = Router();

mapRouter.use(authMiddleware);

// GET /api/map/incidents - Filter incidents on real map
mapRouter.get('/incidents', requirePermission(PERMISSIONS.CASE_VIEW), (req: Request, res: Response) => {
  const { lat, lng, radiusKm, category, startDate, endDate } = req.query;

  const mapData = dbStore.getMapData({
    lat: lat ? parseFloat(lat as string) : undefined,
    lng: lng ? parseFloat(lng as string) : undefined,
    radiusKm: radiusKm ? parseFloat(radiusKm as string) : undefined,
    category: category as string,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.json(mapData);
});

// GET /api/map/summary
mapRouter.get('/summary', requirePermission(PERMISSIONS.CASE_VIEW), (req: Request, res: Response) => {
  const mapData = dbStore.getMapData();
  res.json({
    totalMappedIncidents: mapData.total,
    categoryStats: mapData.categoryStats,
    locationsCount: mapData.locations.length,
  });
});
