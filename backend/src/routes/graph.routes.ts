import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const graphRouter = Router();

graphRouter.use(authMiddleware);

// GET /api/graph/network - Return nodes and edges
graphRouter.get('/network', requirePermission(PERMISSIONS.RELATIONSHIP_VIEW), (req: Request, res: Response) => {
  const { caseId, relationshipType, verifiedOnly } = req.query;

  const graphData = dbStore.getGraphData({
    caseId: caseId as string,
    relationshipType: relationshipType as string,
    verifiedOnly: verifiedOnly === 'true',
  });

  res.json(graphData);
});

// POST /api/graph/relationships - Create relationship
graphRouter.post('/relationships', requirePermission(PERMISSIONS.RELATIONSHIP_CREATE), (req: Request, res: Response) => {
  const { sourceCaseId, targetCaseId, relationshipType, description, supportingEvidence } = req.body;

  if (!sourceCaseId || !targetCaseId || !relationshipType) {
    return res.status(400).json({ error: 'sourceCaseId, targetCaseId, and relationshipType are required' });
  }

  const id = `rel-${Date.now().toString(36)}`;
  const newRel = {
    id,
    sourceCaseId,
    targetCaseId,
    relationshipType,
    description: description || 'Investigator identified connection',
    supportingEvidence: supportingEvidence || null,
    isVerified: true,
    confidenceScore: 1.0,
    reasonForSuggestion: null,
    suggestedBy: 'HUMAN_INVESTIGATOR',
    reviewedBy: req.user?.fullName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.data.caseRelationships.push(newRel);
  dbStore.persist();

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_CREATE',
    targetResource: `Relationship:${id}`,
    details: `Created relationship between Case ${sourceCaseId} and Case ${targetCaseId} (${relationshipType})`,
    ipAddress: req.ip,
  });

  res.status(201).json({ message: 'Relationship established', relationship: newRel });
});

// PATCH /api/graph/relationships/:id/verify - Verify or reject AI suggested link
graphRouter.patch('/relationships/:id/verify', requirePermission(PERMISSIONS.RELATIONSHIP_REVIEW), (req: Request, res: Response) => {
  const { approved } = req.body;
  const rel = dbStore.data.caseRelationships.find(r => r.id === req.params.id);

  if (!rel) {
    return res.status(404).json({ error: 'Relationship not found' });
  }

  if (approved) {
    rel.isVerified = true;
    rel.reviewedBy = req.user?.fullName;
    rel.updatedAt = new Date().toISOString();
  } else {
    // Delete relationship if rejected
    const idx = dbStore.data.caseRelationships.findIndex(r => r.id === req.params.id);
    dbStore.data.caseRelationships.splice(idx, 1);
  }

  dbStore.persist();

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RELATIONSHIP_REVIEW',
    targetResource: `Relationship:${req.params.id}`,
    details: `${approved ? 'Approved and verified' : 'Rejected'} AI suggested relationship ${req.params.id}`,
    ipAddress: req.ip,
  });

  res.json({ message: approved ? 'Relationship verified successfully' : 'Relationship rejected and removed' });
});
