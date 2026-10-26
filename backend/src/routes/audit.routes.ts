import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const auditRouter = Router();

auditRouter.use(authMiddleware);

// GET /api/audit/events - Tamper-evident ledger of audit events with cryptographic integrity check
auditRouter.get('/events', requirePermission(PERMISSIONS.AUDIT_VIEW), (req: Request, res: Response) => {
  const { action, userBadge, search } = req.query;

  const auditReport = dbStore.getAuditEvents({
    action: action as string,
    userBadge: userBadge as string,
    search: search as string,
  });

  res.json({
    events: auditReport.events,
    totalCount: auditReport.totalCount,
    isChainValid: auditReport.isChainValid,
    ledgerIntegrityStatus: auditReport.isChainValid ? 'CRYPTOGRAPHICALLY_VERIFIED_VALID' : 'INTEGRITY_TAMPER_FLAGGED',
  });
});
