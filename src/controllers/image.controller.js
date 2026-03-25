import { handleUpload } from '../middlewares/upload.middleware.js';
import { forwardFileToPythonImage } from '../services/pythonImageService.js';
import { removeFiles } from '../utils/file.utils.js';
import { ENV } from '../config/env.js';

/**
 * POST /api/image/remove-background
 * Accepts one image, forwards to Python service, returns PNG download info.
 */
export async function removeBackground(req, res, next) {
  let uploadedPaths = [];

  try {
    await handleUpload(req, res);

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'File gambar diperlukan.' });
    }

    if (files.length > 1) {
      return res.status(400).json({ success: false, message: 'Hanya satu file gambar yang diizinkan.' });
    }

    const file = files[0];
    uploadedPaths = [file.path];

    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      removeFiles(uploadedPaths);
      return res.status(400).json({ success: false, message: 'Format gambar tidak didukung.' });
    }

    // Forward image to Python service
    const pythonResponse = await forwardFileToPythonImage(file, '/api/image/remove-background');

    // Clean up temp upload
    removeFiles(uploadedPaths);

    // Build absolute download URL pointing to Python Image service static files
    const downloadUrl = `${ENV.PYTHON_IMAGE_SERVICE_URL}${pythonResponse.data.download_url}`;

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
