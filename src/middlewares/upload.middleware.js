/**
 * upload.middleware.js
 * Multer configuration for PDF file uploads.
 * Used by PDF tool routes.
 */

import multer from 'multer';
import path from 'path';
import { ENV } from '../config/env.js';
import { ensureDir, resolveFromRoot } from '../utils/file.utils.js';

const ALLOWED_MIME_TYPES = [
  'application/pdf', 
  'image/jpeg', 
  'image/jpg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];
const MAX_FILE_SIZE_BYTES = ENV.MAX_FILE_SIZE_MB * 1024 * 1024;

// Multer disk storage — saves to UPLOAD_DIR
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadPath = resolveFromRoot(ENV.UPLOAD_DIR);
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    // Keep original name prefixed with timestamp to avoid collisions
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, safeName);
  },
});

// Validate MIME type
function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file PDF, Word, JPG, PNG, dan WEBP yang diizinkan.'), false);
  }
}

export const uploadPdfFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: ENV.MAX_FILES,
  },
}).array('files'); // field name: 'files'

/**
 * Wraps multer in a promise to allow try/catch in controllers.
 * Maps multer-specific errors into readable messages.
 */
export function handleUpload(req, res) {
  return new Promise((resolve, reject) => {
    uploadPdfFiles(req, res, (err) => {
      if (!err) return resolve();

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return reject(new Error(`Ukuran file melebihi batas ${ENV.MAX_FILE_SIZE_MB}MB.`));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return reject(new Error(`Maksimal ${ENV.MAX_FILES} file sekaligus.`));
        }
      }
      reject(err);
    });
  });
}
