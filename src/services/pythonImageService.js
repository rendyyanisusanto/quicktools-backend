import { readFile } from 'fs/promises';
import { ENV } from '../config/env.js';

const BASE_URL = ENV.PYTHON_IMAGE_SERVICE_URL;

/**
 * Build a base FormData with the uploaded file.
 */
async function _buildFileFormData(file) {
  const buffer = await readFile(file.path);
  const blob = new Blob([buffer], { type: file.mimetype });
  const formData = new FormData();
  formData.append('file', blob, file.originalname);
  return formData;
}

/**
 * Generic helper: POST formData to the Python Image service and return parsed JSON.
 */
async function _postToPython(endpoint, formData) {
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

/**
 * Forward a single uploaded file to the Python Image service.
 *
 * @param {Object} file     - Multer file object { path, originalname, mimetype }
 * @param {string} endpoint - Python service path e.g. '/api/image/remove-background'
 * @returns {Promise<Object>} Parsed JSON response from Python service
 */
export async function forwardFileToPythonImage(file, endpoint) {
  const formData = await _buildFileFormData(file);
  return _postToPython(endpoint, formData);
}

/**
 * Forward a file + pas-foto options to the Python Image service.
 *
 * @param {Object} file       - Multer file object
 * @param {string} size       - '2x3' | '3x4' | '4x6'
 * @param {string} background - 'red' | 'blue'
 * @returns {Promise<Object>}
 */
export async function forwardPasPhotoToPythonImage(file, size, background) {
  const formData = await _buildFileFormData(file);
  formData.append('size', size);
  formData.append('background', background);
  return _postToPython('/api/image/pas-photo', formData);
}
