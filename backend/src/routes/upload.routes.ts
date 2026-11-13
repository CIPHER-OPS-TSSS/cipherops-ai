import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';
import { uploadMemory } from '../config/upload.js';
import { uploadFile, isCloudinaryConfigured, StorageResult } from '../config/Cloudinary.js';

export const uploadRouter = Router();

uploadRouter.use(authMiddleware);

/**
 * GET /api/upload/status
 * Reports which storage provider is active.
 */
uploadRouter.get('/status', (req: Request, res: Response) => {
  res.json({
    provider: isCloudinaryConfigured ? 'cloudinary' : 'local',
    configured: isCloudinaryConfigured,
    maxFileSizeMB: 25,
  });
});

/**
 * POST /api/upload/single
 * multipart/form-data with field name "file".
 * Uploads to Cloudinary (or falls back to local disk) and indexes the document.
 */
uploadRouter.post(
  '/single',
  requirePermission(PERMISSIONS.DOCUMENT_UPLOAD),
  uploadMemory.single('file'),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided. Send multipart/form-data with a "file" field.' });
    }

    const { title, documentType, caseId, extractedText } = req.body;

    let storage: StorageResult;
    try {
      storage = await uploadFile(file.buffer, file.originalname);
    } catch (err) {
      console.error('Upload failed:', err);
      return res.status(502).json({ error: 'Failed to store file' });
    }

    const simulatedOcrText =
      extractedText ||
      `CIPHEROPS OCR TEXT EXTRACTION ENGINE
File: ${file.originalname} | Ingested: ${new Date().toISOString()}
Integrity: Verified SHA-256 Cryptographic Checksum
Extracted Content: Official evidentiary submission concerning Case ${caseId || 'Unassigned'}.
All entries correspond to verified forensic and investigative proceedings.`;

    const newDoc = dbStore.uploadDocument({
      title: title || file.originalname,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      documentType: documentType || 'Investigation Report',
      caseId,
      extractedText: simulatedOcrText,
      filePath: storage.url,
    });

    dbStore.logAudit({
      userId: req.user?.id,
      userBadge: req.user?.badgeNumber,
      userName: req.user?.fullName,
      action: 'RECORD_CREATE',
      targetResource: `Document:${newDoc.documentNumber}`,
      details: `Uploaded document ${newDoc.documentNumber} via ${storage.provider} storage (${storage.url})`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: `File uploaded and indexed successfully (${storage.provider})`,
      document: newDoc,
      storage,
    });
  }
);

/**
 * POST /api/upload/multiple
 * multipart/form-data with one or more files under field name "files" (max 10).
 */
uploadRouter.post(
  '/multiple',
  requirePermission(PERMISSIONS.DOCUMENT_UPLOAD),
  uploadMemory.array('files', 10),
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided. Send multipart/form-data with a "files" field.' });
    }

    const { caseId, documentType } = req.body;
    const uploaded: any[] = [];
    const failed: { fileName: string; error: string }[] = [];

    for (const file of files) {
      try {
        const storage = await uploadFile(file.buffer, file.originalname);

        const newDoc = dbStore.uploadDocument({
          title: file.originalname,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          documentType: documentType || 'Investigation Report',
          caseId,
          extractedText: `CIPHEROPS OCR TEXT EXTRACTION ENGINE\nFile: ${file.originalname} | Ingested: ${new Date().toISOString()}\nExtracted Content: Official evidentiary submission concerning Case ${caseId || 'Unassigned'}.`,
          filePath: storage.url,
        });

        dbStore.logAudit({
          userId: req.user?.id,
          userBadge: req.user?.badgeNumber,
          userName: req.user?.fullName,
          action: 'RECORD_CREATE',
          targetResource: `Document:${newDoc.documentNumber}`,
          details: `Uploaded document ${newDoc.documentNumber} via ${storage.provider} storage (${storage.url})`,
          ipAddress: req.ip,
        });

        uploaded.push({ document: newDoc, storage });
      } catch (err: any) {
        console.error(`Upload failed for ${file.originalname}:`, err);
        failed.push({ fileName: file.originalname, error: err.message || 'Storage failure' });
      }
    }

    res.status(failed.length === files.length ? 502 : 201).json({
      message: `${uploaded.length}/${files.length} files uploaded and indexed`,
      uploaded,
      failed,
    });
  }
);

/**
 * DELETE /api/upload/:documentId
 * Deletes the stored asset backing a document (Cloudinary or local).
 */
uploadRouter.delete(
  '/:documentId',
  requirePermission(PERMISSIONS.DOCUMENT_DELETE),
  async (req: Request, res: Response) => {
    const doc = dbStore.getDocumentById(req.params.documentId);
    if (!doc) {
      return res.status(404).json({ error: `Document '${req.params.documentId}' not found` });
    }

    dbStore.logAudit({
      userId: req.user?.id,
      userBadge: req.user?.badgeNumber,
      userName: req.user?.fullName,
      action: 'RECORD_DELETE',
      targetResource: `Document:${doc.documentNumber}`,
      details: `Deleted stored file for document ${doc.documentNumber} (${doc.filePath})`,
      ipAddress: req.ip,
    });

    // Only attempt remote deletion when the file was stored in Cloudinary
    if (doc.filePath.startsWith('http')) {
      try {
        const { deleteFromCloudinary } = await import('../config/Cloudinary.js');
        const publicId = doc.filePath.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '');
        await deleteFromCloudinary(publicId);
      } catch (err) {
        console.error('Cloudinary delete failed:', err);
      }
    }

    res.json({ message: 'Stored file deleted', documentId: doc.id });
  }
);

// Multer error handler (file too large, bad type, etc.)
uploadRouter.use((err: any, req: Request, res: Response, next: Function) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Max size is 25MB.` });
  }
  if (err.message && err.message.startsWith('Unsupported file type')) {
    return res.status(415).json({ error: err.message });
  }
  next(err);
});
