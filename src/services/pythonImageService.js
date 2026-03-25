import { readFile } from 'fs/promises';
import { ENV } from '../config/env.js';

const BASE_URL = ENV.PYTHON_IMAGE_SERVICE_URL;

/**
 * Forward a single uploaded file to the Python Image service.
 *
 * @param {Object} file     - Multer file object { path, originalname, mimetype }
 * @param {string} endpoint - Python service path e.g. '/api/image/remove-background'
 * @returns {Promise<Object>} Parsed JSON response from Python service
 */
export async function forwardFileToPythonImage(file, endpoint) {
  const buffer = await readFile(file.path);
  const blob = new Blob([buffer], { type: file.mimetype });

  const formData = new FormData();
  formData.append('file', blob, file.originalname);

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error(
      `Python Image service tidak dapat dihubungi. Pastikan service berjalan di ${BASE_URL}.`
    );
  }

  const json = await response.json();

  if (!response.ok) {
    const detail = json?.detail || json?.message || 'Terjadi kesalahan pada Python service.';
    throw new Error(detail);
  }

  return json;
}
