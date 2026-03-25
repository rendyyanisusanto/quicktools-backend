/**
 * pdfConvert.controller.js
 * Handles request/response for Python-backed PDF conversion endpoints.
 * Business logic is delegated to pythonPdfService.js.
 */

import { handleUpload } from '../middlewares/upload.middleware.js';
import { forwardFileToPythonPdf } from '../services/pythonPdfService.js';
import { removeFiles } from '../utils/file.utils.js';
import { ENV } from '../config/env.js';

/**
 * POST /api/pdf/to-word
 * Accepts one PDF, forwards to Python service, returns DOCX download info.
 */
export async function pdfToWord(req, res, next) {
  let uploadedPaths = [];

  try {
    await handleUpload(req, res);

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'File PDF diperlukan.' });
    }

    if (files.length > 1) {
      return res.status(400).json({ success: false, message: 'Hanya satu file PDF yang diizinkan.' });
    }

    const file = files[0];
    uploadedPaths = [file.path];

    // Validate MIME type (upload middleware accepts PDF + JPG; enforce PDF only here)
    if (file.mimetype !== 'application/pdf') {
      removeFiles(uploadedPaths);
      return res.status(400).json({ success: false, message: 'Hanya file PDF yang diizinkan.' });
    }

    // Forward PDF to Python service
    const pythonResponse = await forwardFileToPythonPdf(file, '/api/pdf/to-word');

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
