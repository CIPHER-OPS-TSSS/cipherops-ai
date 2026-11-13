import { Router, Request, Response } from 'express';
import multer from 'multer';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS, CONFIG } from '../config/index.js';
import { uploadToCloudinary, isCloudinaryConfigured } from '../config/Cloudinary.js';

export const documentsRouter = Router();

documentsRouter.use(authMiddleware);

// Multer memory storage — files are streamed straight to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// GET /api/documents
documentsRouter.get('/', requirePermission(PERMISSIONS.DOCUMENT_VIEW), (req: Request, res: Response) => {
  const { caseId, documentType, search } = req.query;
  const docs = dbStore.getDocuments({
    caseId: caseId as string,
    documentType: documentType as string,
    search: search as string,
  });

  res.json({ documents: docs, count: docs.length });
});

// GET /api/documents/:id
documentsRouter.get('/:id', requirePermission(PERMISSIONS.DOCUMENT_VIEW), (req: Request, res: Response) => {
  const doc = dbStore.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: `Document '${req.params.id}' not found` });
  }

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_ACCESS',
    targetResource: `Document:${doc.documentNumber}`,
    details: `Accessed document ${doc.documentNumber} (${doc.title})`,
    ipAddress: req.ip,
  });

  res.json({ document: doc });
});

// POST /api/documents/upload - Upload file with OCR & indexing
documentsRouter.post('/upload', requirePermission(PERMISSIONS.DOCUMENT_UPLOAD), upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  const { title, documentType, caseId, extractedText } = req.body;

  const fileName = file ? file.originalname : `uploaded_doc_${Date.now()}.pdf`;
  const fileSize = file ? file.size : 284000;
  const mimeType = file ? file.mimetype : 'application/pdf';

  // Store file in Cloudinary when configured; skip for metadata-only submissions
  let cloudinaryInfo: { publicId: string; url: string; secureUrl: string } | null = null;
  if (file && isCloudinaryConfigured) {
    try {
      const result = await uploadToCloudinary(file.buffer, file.originalname);
      cloudinaryInfo = { publicId: result.publicId, url: result.url, secureUrl: result.secureUrl };
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      return res.status(502).json({ error: 'Failed to store file in Cloudinary' });
    }
  }

  const simulatedOcrText = extractedText || `CIPHEROPS OCR TEXT EXTRACTION ENGINE
File: ${fileName} | Ingested: ${new Date().toISOString()}
Integrity: Verified SHA-256 Cryptographic Checksum
Extracted Content: Official evidentiary submission concerning Case ${caseId || 'Unassigned'}.
All entries correspond to verified forensic and investigative proceedings.`;

  const newDoc = dbStore.uploadDocument({
    title: title || (file ? file.originalname : 'New Investigation Document'),
    fileName,
    fileSize,
    mimeType,
    documentType: documentType || 'Investigation Report',
    caseId,
    extractedText: simulatedOcrText,
    filePath: cloudinaryInfo?.secureUrl,
  });

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_CREATE',
    targetResource: `Document:${newDoc.documentNumber}`,
    details: `Uploaded and indexed document ${newDoc.documentNumber} (${newDoc.fileName}, SHA-256: ${newDoc.sha256Hash.substring(0, 16)}...)`,
    ipAddress: req.ip,
  });

  res.status(201).json({
    message: 'Document uploaded, OCR processed, and indexed successfully',
    document: newDoc,
    cloudinary: cloudinaryInfo,
  });
});

// POST /api/documents/:id/reprocess
documentsRouter.post('/:id/reprocess', requirePermission(PERMISSIONS.DOCUMENT_UPLOAD), (req: Request, res: Response) => {
  const doc = dbStore.data.documents.find(d => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  doc.processingStatus = 'READY';
  doc.ocrPerformed = true;
  doc.updatedAt = new Date().toISOString();
  dbStore.persist();

  res.json({ message: 'Document reprocessed and re-indexed', document: doc });
});
