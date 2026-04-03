import { handleUpload } from '../middlewares/upload.middleware.js';
import { forwardFileToPythonImage, forwardPasPhotoToPythonImage } from '../services/pythonImageService.js';
import { removeFiles } from '../utils/file.utils.js';
import { ENV } from '../config/env.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const VALID_SIZES = ['2x3', '3x4', '4x6'];
const VALID_BACKGROUNDS = ['red', 'blue'];

/**
 * POST /api/image/remove-background
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

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      removeFiles(uploadedPaths);
      return res.status(400).json({ success: false, message: 'Format gambar tidak didukung.' });
    }

    const pythonResponse = await forwardFileToPythonImage(file, '/api/image/remove-background');

    removeFiles(uploadedPaths);

    const downloadUrl = `${ENV.APP_BASE_URL}/api/python-proxy/image/${pythonResponse.data.file_name}`;

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
 * POST /api/image/pas-photo
 * Accepts one image + size + background options, forwards to Python service.
 */
export async function pasPhoto(req, res, next) {
  let uploadedPaths = [];

  try {
    await handleUpload(req, res);

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'File gambar diperlukan.' });
    }

    const file = files[0];
    uploadedPaths = [file.path];

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      removeFiles(uploadedPaths);
      return res.status(400).json({ success: false, message: 'Format gambar tidak didukung. Harap upload JPG, PNG, atau WEBP.' });
    }

    const { size, background } = req.body;

    if (!size || !VALID_SIZES.includes(size)) {
      removeFiles(uploadedPaths);
      return res.status(400).json({ success: false, message: `Ukuran tidak valid. Pilihan: ${VALID_SIZES.join(', ')}.` });
    }

    if (!background || !VALID_BACKGROUNDS.includes(background)) {
      removeFiles(uploadedPaths);
      return res.status(400).json({ success: false, message: `Warna background tidak valid. Pilihan: ${VALID_BACKGROUNDS.join(', ')}.` });
    }

    const pythonResponse = await forwardPasPhotoToPythonImage(file, size, background);

    removeFiles(uploadedPaths);

    const downloadUrl = `${ENV.APP_BASE_URL}/api/python-proxy/image/${pythonResponse.data.file_name}`;

    return res.status(200).json({
      success: true,
      message: pythonResponse.message,
      data: {
        fileName: pythonResponse.data.file_name,
        downloadUrl,
        size,
        background,
      },
    });
  } catch (err) {
    removeFiles(uploadedPaths);
    next(err);
  }
}

