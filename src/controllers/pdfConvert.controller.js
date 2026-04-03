/**
 * pdfConvert.controller.js
 * Handles request/response for Python-backed PDF conversion endpoints.
 * Business logic is delegated to pythonPdfService.js.
 */

import { handleUpload } from '../middlewares/upload.middleware.js';
import { forwardFileToPythonPdf, forwardApplySignatureToPythonPdf } from '../services/pythonPdfService.js';
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

/**
 * POST /api/pdf/apply-signature
 * Accepts one PDF file and one Image file along with positioning config.
 */
export async function applySignature(req, res, next) {
  let uploadedPaths = [];

  try {
    await handleUpload(req, res);

    const files = req.files;

    if (!files || files.length !== 2) {
      if (files) removeFiles(files.map(f => f.path));
      return res.status(400).json({ success: false, message: 'Dibutuhkan 1 file PDF dan 1 file gambar.' });
    }

    uploadedPaths = files.map((f) => f.path);

    const filePdf = files.find(f => f.mimetype === 'application/pdf');
    const fileSig = files.find(f => ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(f.mimetype));

    if (!filePdf || !fileSig) {
      removeFiles(uploadedPaths);
      return res.status(400).json({ success: false, message: 'Format file tidak sesuai. Harus ada 1 PDF dan 1 gambar (PNG/JPG/WEBP).' });
    }

    const { page, alignH, alignV, size } = req.body;

    const pythonResponse = await forwardApplySignatureToPythonPdf(filePdf, fileSig, page, alignH, alignV, size);

    removeFiles(uploadedPaths);

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
