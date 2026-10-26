import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const entitiesRouter = Router();

entitiesRouter.use(authMiddleware);

// GET /api/entities/vehicles
entitiesRouter.get('/vehicles', requirePermission(PERMISSIONS.CASE_VIEW), (req: Request, res: Response) => {
  const { search } = req.query;
  let vehicles = [...dbStore.data.vehicles];

  if (search) {
    const q = (search as string).toLowerCase();
    vehicles = vehicles.filter(v =>
      v.registrationNumber.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.registeredOwner && v.registeredOwner.toLowerCase().includes(q))
    );
  }

  const enriched = vehicles.map(v => ({
    ...v,
    case: dbStore.data.cases.find(c => c.id === v.caseId) || null,
  }));

  res.json({ vehicles: enriched, count: enriched.length });
});

// GET /api/entities/organizations
entitiesRouter.get('/organizations', requirePermission(PERMISSIONS.CASE_VIEW), (req: Request, res: Response) => {
  const { search } = req.query;
  let orgs = [...dbStore.data.organizations];

  if (search) {
    const q = (search as string).toLowerCase();
    orgs = orgs.filter(o =>
      o.name.toLowerCase().includes(q) ||
      (o.registrationNumber && o.registrationNumber.toLowerCase().includes(q)) ||
      o.orgType.toLowerCase().includes(q)
    );
  }

  res.json({ organizations: orgs, count: orgs.length });
});

// GET /api/entities/court-proceedings
entitiesRouter.get('/court-proceedings', requirePermission(PERMISSIONS.CASE_VIEW), (req: Request, res: Response) => {
  const { caseId } = req.query;
  let proceedings = [...dbStore.data.courtProceedings];

  if (caseId) {
    proceedings = proceedings.filter(cp => cp.caseId === caseId);
  }

  const enriched = proceedings.map(cp => ({
    ...cp,
    case: dbStore.data.cases.find(c => c.id === cp.caseId) || null,
  }));

  res.json({ courtProceedings: enriched, count: enriched.length });
});
