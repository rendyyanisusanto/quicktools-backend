/**
 * wordConvert.controller.js
 * Handles request/response for Python-backed Word to PDF conversion endpoints.
 * Business logic is delegated to pythonPdfService.js for proxying.
 */

import { handleUpload } from '../middlewares/upload.middleware.js';
import { forwardFileToPythonPdf } from '../services/pythonPdfService.js';
import { removeFiles } from '../utils/file.utils.js';
import { ENV } from '../config/env.js';

/**
 * POST /api/pdf/word-to-pdf
 * Accepts one Word file (.doc or .docx), forwards to Python service, returns PDF download info.
 */
export async function wordToPdf(req, res, next) {
  let uploadedPaths = [];

  try {
    await handleUpload(req, res);

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'File Word diperlukan.' });
    }

    if (files.length > 1) {
      return res.status(400).json({ success: false, message: 'Hanya satu file Word yang diizinkan.' });
    }

    const file = files[0];
    uploadedPaths = [file.path];

    const ALLOWED_MIME_TYPES = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    // Validate MIME type locally
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      removeFiles(uploadedPaths);
      return res.status(400).json({ success: false, message: 'Hanya file Word (.docx atau .doc) yang diizinkan.' });
    }

    // Forward Word to Python service (reusing the scalable forwarding function)
    const pythonResponse = await forwardFileToPythonPdf(file, '/api/word/to-pdf');

    // Clean up temp upload
    removeFiles(uploadedPaths);

    // Build absolute download URL pointing to the Backend proxy
    const downloadUrl = `${ENV.APP_BASE_URL}/api/python-proxy/pdf/${pythonResponse.data.file_name}`;

    return res.status(200).json({
      success: true,
      message: pythonResponse.message,
      data: {
        fileName: pythonResponse.data.file_name,
        downloadUrl,
      },
    });
  } catch (err) {
    removeFiles(uploadedPaths);
    next(err);
  }
}
