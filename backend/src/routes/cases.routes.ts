import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const casesRouter = Router();

// Protect all case endpoints
casesRouter.use(authMiddleware);

// GET /api/cases - List filterable cases
casesRouter.get('/', requirePermission(PERMISSIONS.CASE_VIEW), (req: Request, res: Response) => {
  const { status, priority, search, investigatorId } = req.query;
  const cases = dbStore.getCases({
    status: status as string,
    priority: priority as string,
    search: search as string,
    investigatorId: investigatorId as string,
  });

  res.json({ cases, count: cases.length });
});

// GET /api/cases/fir-registry - Dedicated FIR view
casesRouter.get('/fir-registry', requirePermission(PERMISSIONS.CASE_VIEW), (req: Request, res: Response) => {
  const cases = dbStore.getCases();
  const firList = cases
    .filter(c => c.firNumber)
    .map(c => ({
      id: c.id,
      caseNumber: c.caseNumber,
      firNumber: c.firNumber,
      title: c.title,
      policeStation: c.policeStation,
      jurisdiction: c.jurisdiction,
      incidentDate: c.incidentDate,
      reportedDate: c.reportedDate,
      statutorySections: c.statutorySections,
      status: c.status,
      assignedInvestigator: c.assignedInvestigator?.fullName || 'Unassigned',
      priority: c.priority,
    }));

  res.json({ firRecords: firList, count: firList.length });
});

// GET /api/cases/:id - Deep case dossier
casesRouter.get('/:id', requirePermission(PERMISSIONS.CASE_VIEW), (req: Request, res: Response) => {
  const caseDossier = dbStore.getCaseById(req.params.id);
  if (!caseDossier) {
    return res.status(404).json({ error: `Case '${req.params.id}' not found` });
  }

  // Audit record access
  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_ACCESS',
    targetResource: `Case:${caseDossier.caseNumber}`,
    details: `Accessed full dossier for Case ${caseDossier.caseNumber}`,
    ipAddress: req.ip,
  });

  res.json({ case: caseDossier });
});

// POST /api/cases - Create new case
casesRouter.post('/', requirePermission(PERMISSIONS.CASE_CREATE), (req: Request, res: Response) => {
  const { title, description, policeStation, jurisdiction, priority, statutorySections, firNumber, incidentDate, isSensitive } = req.body;

  if (!title || !policeStation || !jurisdiction) {
    return res.status(400).json({ error: 'Title, police station, and jurisdiction are required fields' });
  }

  const newCase = dbStore.createCase(
    {
      title,
      description: description || 'New investigative filing',
      policeStation,
      jurisdiction,
      priority: priority || 'MEDIUM',
      statutorySections: statutorySections || [],
      firNumber: firNumber || null,
      incidentDate: incidentDate || new Date().toISOString(),
      isSensitive: !!isSensitive,
      assignedInvestigatorId: req.user?.id,
    },
    req.user?.fullName
  );

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_CREATE',
    targetResource: `Case:${newCase.caseNumber}`,
    details: `Created new investigation record Case ${newCase.caseNumber} ("${title}")`,
    ipAddress: req.ip,
  });

  res.status(201).json({ message: 'Case created successfully', case: newCase });
});

// PATCH /api/cases/:id - Update case fields or status
casesRouter.patch('/:id', requirePermission(PERMISSIONS.CASE_EDIT), (req: Request, res: Response) => {
  const updated = dbStore.updateCase(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: `Case '${req.params.id}' not found` });
  }

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_UPDATE',
    targetResource: `Case:${updated.caseNumber}`,
    details: `Updated case parameters: ${Object.keys(req.body).join(', ')}`,
    ipAddress: req.ip,
  });

  res.json({ message: 'Case updated successfully', case: updated });
});

// POST /api/cases/:id/timeline - Add timeline event
casesRouter.post('/:id', requirePermission(PERMISSIONS.CASE_EDIT), (req: Request, res: Response) => {
  const { title, description, eventType, timestamp } = req.body;
  const targetCase = dbStore.data.cases.find(c => c.id === req.params.id);
  if (!targetCase) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const newEvent = {
    id: `tle-${Date.now().toString(36)}`,
    caseId: targetCase.id,
    timestamp: timestamp || new Date().toISOString(),
    eventType: eventType || 'INVESTIGATOR_NOTE',
    title: title || 'Investigative Progress Note',
    description: description || '',
    author: req.user?.fullName || 'Investigator',
    isVerified: true,
    createdAt: new Date().toISOString(),
  };

  dbStore.data.timelineEvents.push(newEvent);
  dbStore.persist();

  res.status(201).json({ message: 'Timeline event recorded', event: newEvent });
});
