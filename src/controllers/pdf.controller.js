/**
 * pdf.controller.js
 * Handles request/response for PDF tool endpoints.
 * Business logic is delegated to pdf.service.js.
 */

import { handleUpload } from '../middlewares/upload.middleware.js';
import { 
  mergePdfs, 
  splitPdf as splitService,
  compressPdf as compressService,
  jpgToPdf as jpgToPdfService,
  pdfToJpg as pdfToJpgService,
  addWatermark as addWatermarkService
} from '../services/pdf.service.js';
import { removeFiles } from '../utils/file.utils.js';

/**
 * POST /api/pdf/merge
 * Accepts multiple PDF files, merges them, returns download URL.
 */
export async function mergePdf(req, res, next) {
  let uploadedPaths = [];

  try {
    // Handle multipart upload
    await handleUpload(req, res);

    const files = req.files;

    if (!files || files.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Minimal 2 file PDF diperlukan.',
      });
    }

    uploadedPaths = files.map((f) => f.path);

    // Merge PDFs via service
    const result = await mergePdfs(uploadedPaths);

    // Clean up temp uploads after successful merge
    removeFiles(uploadedPaths);

    return res.status(200).json({
      success: true,
      message: 'PDF berhasil digabung.',
      data: {
        fileName: result.fileName,
        downloadUrl: result.downloadUrl,
      },
    });
  } catch (err) {
    // Clean up uploads on error
    removeFiles(uploadedPaths);
    next(err);
  }
}

/**
 * POST /api/pdf/split
 * Accepts one PDF file, splits it by mode/range, and returns download URL(s).
 */
export async function splitPdf(req, res, next) {
  let uploadedPaths = [];

  try {
    await handleUpload(req, res);

    const files = req.files;

    if (!files || files.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Satu file PDF diperlukan.',
      });
    }

    uploadedPaths = files.map((f) => f.path);
    const filePath = uploadedPaths[0];

    // Read mode and pages from body
    const { mode, pages } = req.body;
    if (!mode) {
      return res.status(400).json({
        success: false,
        message: 'Mode pemisahan (mode) tidak tersedia dalam request.',
      });
    }

    // Process split
    const result = await splitService(filePath, mode, pages);

    // Cleanup
    removeFiles(uploadedPaths);

    return res.status(200).json({
      success: true,
      message: mode === 'range' ? 'PDF berhasil dipisah (Range).' : 'PDF berhasil dipisah per halaman.',
      data: result,
    });
  } catch (err) {
    removeFiles(uploadedPaths);
    next(err);
  }
}

/**
 * POST /api/pdf/compress
 * Accepts one PDF file, applies metadata compression, returns size diff and URL.
 */
export async function compressPdf(req, res, next) {
  let uploadedPaths = [];

  try {
    await handleUpload(req, res);

    const files = req.files;
    if (!files || files.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Satu file PDF diperlukan.',
      });
    }

    uploadedPaths = files.map((f) => f.path);
    const filePath = uploadedPaths[0];

    const result = await compressService(filePath);

    removeFiles(uploadedPaths);

    return res.status(200).json({
      success: true,
      message: 'File PDF berhasil dioptimalkan.',
      data: result,
    });
  } catch (err) {
    removeFiles(uploadedPaths);
    next(err);
  }
}

/**
 * POST /api/pdf/jpg-to-pdf
 * Accepts multiple JPG files, embeds them in one PDF, returns download URL.
 */
export async function jpgToPdf(req, res, next) {
  let uploadedPaths = [];

  try {
    await handleUpload(req, res);

    const files = req.files;
    if (!files || files.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimal satu gambar JPG diperlukan.',
      });
    }

    // Validate MIME again in controller just to be sure
    const valid = files.every(f => f.mimetype === 'image/jpeg' || f.mimetype === 'image/jpg');
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Hanya file JPG/JPEG yang didukung.',
      });
    }

    uploadedPaths = files.map((f) => f.path);

    const result = await jpgToPdfService(uploadedPaths);

    removeFiles(uploadedPaths);

    return res.status(200).json({
      success: true,
      message: 'JPG berhasil digabung menjadi PDF.',
      data: result,
    });
  } catch (err) {
    removeFiles(uploadedPaths);
    next(err);
  }
}

/**
 * POST /api/pdf/pdf-to-jpg
 * Accepts one PDF file, returns placeholder contract for Under-Development status.
 */
export async function pdfToJpg(req, res, next) {
  let uploadedPaths = [];

  try {
    await handleUpload(req, res);

    const files = req.files;
    if (!files || files.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Satu file PDF diperlukan.',
      });
    }

    uploadedPaths = files.map((f) => f.path);
    const filePath = uploadedPaths[0];

    // Read the placeholder struct contract
    const result = await pdfToJpgService(filePath);

    removeFiles(uploadedPaths);

    if (!result.ready) {
      return res.status(501).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil melakukan konversi PDF ke JPG.',
      data: result,
    });
  } catch (err) {
    removeFiles(uploadedPaths);
    next(err);
  }
}

/**
 * POST /api/pdf/add-watermark
 * Accepts one PDF file and watermark config, returns download URL for watermarked PDF.
 */
export async function addWatermark(req, res, next) {
  let uploadedPaths = [];

  try {
    await handleUpload(req, res);

    const files = req.files;
    if (!files || files.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Satu file PDF diperlukan.',
      });
    }

    uploadedPaths = files.map((f) => f.path);
    const filePath = uploadedPaths[0];

    const { text, position, opacity, fontSize, rotation, colorHex } = req.body;

    if (!text) {
      removeFiles(uploadedPaths);
      return res.status(400).json({
        success: false,
        message: 'Teks watermark diperlukan.',
      });
    }

    const config = {
      text,
      position,
      opacity: opacity ? parseFloat(opacity) : 0.5,
      fontSize: fontSize ? parseInt(fontSize, 10) : 48,
      rotation: rotation ? parseInt(rotation, 10) : 45,
      colorHex: colorHex || '#000000',
    };

    const result = await addWatermarkService(filePath, config);

    removeFiles(uploadedPaths);

    return res.status(200).json({
      success: true,
      message: 'Watermark berhasil ditambahkan ke PDF.',
      data: result,
    });
  } catch (err) {
    removeFiles(uploadedPaths);
    next(err);
  }
}
