import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './index.js';

/**
 * Cloudinary configuration for CipherOps AI.
 *
 * Reads credentials from environment variables:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * If credentials are missing, `isCloudinaryConfigured` returns false and the
 * upload pipeline falls back to local disk storage.
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
}

/** Folder in the Cloudinary account where investigation documents are stored. */
export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'cipherops/documents';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  bytes: number;
  format: string;
  resourceType: string;
  provider: 'cloudinary';
}

export interface LocalUploadResult {
  fileName: string;
  url: string;
  bytes: number;
  provider: 'local';
}

export type StorageResult = CloudinaryUploadResult | LocalUploadResult;

/**
 * Upload a file buffer to Cloudinary.
 * @param buffer   Raw file bytes (from multer memory storage)
 * @param filename Original filename, used to build the public id
 */
export async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_* environment variables.');
  }

  return new Promise((resolve, reject) => {
    const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: 'auto',
        public_id: `${Date.now()}-${cleanName.replace(/\.[^.]+$/, '')}`,
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error('Cloudinary upload failed with no result'));
        }
        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          bytes: result.bytes,
          format: result.format,
          resourceType: result.resource_type,
          provider: 'cloudinary',
        });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Fallback: persist a buffer to the local uploads directory.
 * Mirrors the shape of CloudinaryUploadResult so callers don't branch.
 */
export function uploadToLocalStorage(buffer: Buffer, filename: string): LocalUploadResult {
  if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
    fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
  }
  const cleanName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(CONFIG.UPLOAD_DIR, cleanName);
  fs.writeFileSync(filePath, buffer);
  return {
    fileName: cleanName,
    url: `/uploads/${cleanName}`,
    bytes: buffer.length,
    provider: 'local',
  };
}

/**
 * Unified upload: uses Cloudinary when configured, otherwise local disk.
 */
export async function uploadFile(buffer: Buffer, filename: string): Promise<StorageResult> {
  if (isCloudinaryConfigured) {
    return uploadToCloudinary(buffer, filename);
  }
  return uploadToLocalStorage(buffer, filename);
}

/** Delete an asset from Cloudinary by its public id (best-effort). */
export async function deleteFromCloudinary(publicId: string, resourceType = 'image'): Promise<void> {
  if (!isCloudinaryConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType as any });
  } catch (err) {
    console.error('Cloudinary delete failed:', err);
  }
}

export { cloudinary };
