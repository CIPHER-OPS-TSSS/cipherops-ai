import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './index.js';

/**
 * Multer upload configuration.
 *
 * Uses memory storage so the file buffer can be streamed directly to
 * Cloudinary (see config/Cloudinary.ts). If Cloudinary is not configured,
 * callers may fall back to writing the buffer to CONFIG.UPLOAD_DIR.
 */

// Allowed file types for evidentiary documents
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: images, PDF, Word, Excel, plain text.`));
  }
};

// Memory storage — buffer is available at (req as any).file.buffer
export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});

// Disk storage fallback for local-only uploads
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
      fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
    }
    cb(null, CONFIG.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  },
});

export const uploadDisk = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});

/** Ensure the local uploads directory exists (fallback usage). */
export function ensureUploadDir(): string {
  if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
    fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
  }
  return CONFIG.UPLOAD_DIR;
}

export function getUploadFilePath(fileName: string): string {
  return path.join(ensureUploadDir(), fileName);
}

export { ALLOWED_MIME_TYPES };
