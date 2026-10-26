import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const evidenceRouter = Router();

evidenceRouter.use(authMiddleware);

// GET /api/evidence
evidenceRouter.get('/', requirePermission(PERMISSIONS.EVIDENCE_VIEW), (req: Request, res: Response) => {
  const { caseId, category, status, search } = req.query;
  const items = dbStore.getEvidence({
    caseId: caseId as string,
    category: category as string,
    status: status as string,
    search: search as string,
  });

  res.json({ evidence: items, count: items.length });
});

// GET /api/evidence/:id - Evidence detail & chain of custody verification
evidenceRouter.get('/:id', requirePermission(PERMISSIONS.EVIDENCE_VIEW), (req: Request, res: Response) => {
  const item = dbStore.getEvidenceById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: `Evidence item '${req.params.id}' not found` });
  }

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_ACCESS',
    targetResource: `Evidence:${item.evidenceNumber}`,
    details: `Accessed evidence dossier for ${item.evidenceNumber} (Barcode: ${item.barcode})`,
    ipAddress: req.ip,
  });

  res.json({ evidence: item });
});

// POST /api/evidence - Log new evidence
evidenceRouter.post('/', requirePermission(PERMISSIONS.EVIDENCE_CREATE), (req: Request, res: Response) => {
  const { caseId, category, description, collectionDateTime, collectionLocation, storageLocation, currentCustodianName, sealReference } = req.body;

  if (!caseId || !description || !category) {
    return res.status(400).json({ error: 'caseId, category, and description are required' });
  }

  const newEvidence = dbStore.createEvidence({
    caseId,
    category,
    description,
    collectionDateTime,
    collectionLocation,
    storageLocation,
    currentCustodianName: currentCustodianName || req.user?.fullName,
    sealReference,
  });

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_CREATE',
    targetResource: `Evidence:${newEvidence.evidenceNumber}`,
    details: `Logged new evidence ${newEvidence.evidenceNumber} (Barcode: ${newEvidence.barcode}) under Case ${caseId}`,
    ipAddress: req.ip,
  });

  res.status(201).json({ message: 'Evidence item logged successfully', evidence: newEvidence });
});

// POST /api/evidence/:id/custody-events - Execute custody transfer with tamper-evident cryptographic hash
evidenceRouter.post('/:id/custody-events', requirePermission(PERMISSIONS.EVIDENCE_TRANSFER), (req: Request, res: Response) => {
  const { newCustodianName, reason, location, authorization } = req.body;

  if (!newCustodianName || !reason || !location) {
    return res.status(400).json({ error: 'newCustodianName, reason, and location are required' });
  }

  const custodyEvent = dbStore.transferCustody(req.params.id, {
    newCustodianName,
    reason,
    location,
    authorization,
  });

  if (!custodyEvent) {
    return res.status(404).json({ error: 'Evidence item not found' });
  }

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'CUSTODY_TRANSFER',
    targetResource: `Evidence:${req.params.id}`,
    details: `Custody transferred to ${newCustodianName} at ${location}. Reason: ${reason}. Hash: ${custodyEvent.currentHash.substring(0, 16)}...`,
    ipAddress: req.ip,
  });

  res.status(201).json({ message: 'Custody transfer logged with tamper-evident cryptographic hash', custodyEvent });
});
