import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const incidentsRouter = Router();

incidentsRouter.use(authMiddleware);

// GET /api/incidents
incidentsRouter.get('/', requirePermission(PERMISSIONS.CASE_VIEW), (req: Request, res: Response) => {
  const { category, severity, caseId, search } = req.query;
  const incidents = dbStore.getIncidents({
    category: category as string,
    severity: severity as string,
    caseId: caseId as string,
    search: search as string,
  });

  res.json({ incidents, count: incidents.length });
});

// POST /api/incidents
incidentsRouter.post('/', requirePermission(PERMISSIONS.CASE_CREATE), (req: Request, res: Response) => {
  const { title, category, description, occurredAt, severity, caseId, locationId } = req.body;

  if (!title || !category || !description) {
    return res.status(400).json({ error: 'Title, category, and description are required' });
  }

  const id = `inc-${Date.now().toString(36)}`;
  const incidentNumber = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newIncident = {
    id,
    incidentNumber,
    title,
    category,
    description,
    occurredAt: occurredAt || new Date().toISOString(),
    reportedAt: new Date().toISOString(),
    severity: severity || 'Medium',
    caseId: caseId || null,
    locationId: locationId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.data.incidents.push(newIncident);
  dbStore.persist();

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_CREATE',
    targetResource: `Incident:${incidentNumber}`,
    details: `Registered incident ${incidentNumber} ("${title}") under category ${category}`,
    ipAddress: req.ip,
  });

  res.status(201).json({ message: 'Incident created successfully', incident: newIncident });
});

// GET /api/locations
incidentsRouter.get('/locations', requirePermission(PERMISSIONS.CASE_VIEW), (req: Request, res: Response) => {
  const locations = dbStore.getLocations();
  res.json({ locations, count: locations.length });
});
