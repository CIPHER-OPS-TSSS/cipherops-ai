import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const reportsRouter = Router();

reportsRouter.use(authMiddleware);

// Export history in memory
const exportHistory: any[] = [
  {
    id: 'exp-001',
    reportType: 'CASE_SUMMARY',
    title: 'Operation ShadowNet — Comprehensive Investigation Report',
    format: 'PDF',
    status: 'COMPLETED',
    generatedAt: '2026-05-18T14:30:00Z',
    generatedBy: 'Inspector Kabir Sharma',
    fileSize: '1.4 MB',
    recordCount: 14,
  },
  {
    id: 'exp-002',
    reportType: 'EVIDENCE_INVENTORY',
    title: 'Central Digital & Forensic Evidence Inventory 2026',
    format: 'CSV',
    status: 'COMPLETED',
    generatedAt: '2026-05-19T10:15:00Z',
    generatedBy: 'Dr. Meera Nambiar',
    fileSize: '320 KB',
    recordCount: 20,
  },
];

// POST /api/reports/generate
reportsRouter.post('/generate', requirePermission(PERMISSIONS.REPORT_GENERATE), (req: Request, res: Response) => {
  const { reportType, caseId, format } = req.body;

  let reportData: any = {};
  let title = 'Investigation Management Report';
  let recordCount = 0;

  if (reportType === 'CASE_SUMMARY') {
    const targetCase = caseId ? dbStore.getCaseById(caseId) : dbStore.getCases()[0];
    title = `Case Summary Report — ${targetCase?.caseNumber || 'All Cases'}`;
    reportData = targetCase;
    recordCount = 1;
  } else if (reportType === 'EVIDENCE_INVENTORY') {
    title = 'Official Evidence Inventory & Custody Log';
    const evidenceList = dbStore.getEvidence({ caseId });
    reportData = evidenceList;
    recordCount = evidenceList.length;
  } else if (reportType === 'CHAIN_OF_CUSTODY') {
    title = 'Cryptographic Chain of Custody Audit Ledger';
    reportData = dbStore.data.evidenceCustodyEvents;
    recordCount = dbStore.data.evidenceCustodyEvents.length;
  } else if (reportType === 'AUDIT_LOG') {
    title = 'System Tamper-Evident Security & Access Audit Trail';
    reportData = dbStore.data.auditEvents;
    recordCount = dbStore.data.auditEvents.length;
  } else {
    title = 'FIR & Incident Geographical Distribution Report';
    reportData = dbStore.getMapData();
    recordCount = dbStore.data.incidents.length;
  }

  const exportEntry = {
    id: `exp-${Date.now().toString(36)}`,
    reportType: reportType || 'CASE_SUMMARY',
    title,
    format: format || 'PDF',
    status: 'COMPLETED',
    generatedAt: new Date().toISOString(),
    generatedBy: req.user?.fullName || 'Authorized Investigator',
    fileSize: `${Math.floor(200 + Math.random() * 800)} KB`,
    recordCount,
    downloadPayload: reportData,
  };

  exportHistory.unshift(exportEntry);

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'EXPORT_JOB',
    targetResource: `Report:${exportEntry.reportType}`,
    details: `Generated official export: ${title} (${format || 'PDF'}, ${recordCount} records)`,
    ipAddress: req.ip,
  });

  res.status(201).json({
    message: 'Report generated successfully',
    report: exportEntry,
  });
});

// GET /api/reports/history
reportsRouter.get('/history', requirePermission(PERMISSIONS.REPORT_GENERATE), (req: Request, res: Response) => {
  res.json({ history: exportHistory });
});
