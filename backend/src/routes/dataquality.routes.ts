import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const dataQualityRouter = Router();

dataQualityRouter.use(authMiddleware);

// GET /api/data-quality/metrics
dataQualityRouter.get('/metrics', requirePermission(PERMISSIONS.DATA_QUALITY_VIEW), (req: Request, res: Response) => {
  const metrics = dbStore.getDataQualityMetrics();
  res.json(metrics);
});

// POST /api/data-quality/review-duplicate
dataQualityRouter.post('/review-duplicate', requirePermission(PERMISSIONS.DATA_QUALITY_RESOLVE), (req: Request, res: Response) => {
  const { candidateAId, candidateBId, decision, reviewNotes } = req.body;

  // IMPORTANT: As per Section 6 & 18 rules:
  // "Never automatically merge person records, delete evidence, or alter legal statuses based solely on a data-quality score."
  // Decisions must require authorized human review and remain logged with provenance.

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RELATIONSHIP_REVIEW',
    targetResource: `DataQuality:ReviewDuplicate:${candidateAId}_${candidateBId}`,
    details: `Authorized human review for duplicate candidates ${candidateAId} and ${candidateBId}. Decision: ${decision}. Notes: ${reviewNotes || 'Verified distinct entities'}`,
    ipAddress: req.ip,
  });

  res.json({
    message: 'Duplicate candidate review recorded with full provenance. Records remain distinct per evidentiary safeguards.',
    decision,
    reviewedBy: req.user?.fullName,
    timestamp: new Date().toISOString(),
  });
});
