/**
 * pythonPdfService.js
 * Gateway service for communicating with the Python PDF microservice.
 *
 * All Python communication is isolated here. To add a new Python PDF tool,
 * simply add a new exported function pointing to the relevant endpoint.
 */

import { readFile } from 'fs/promises';
import { ENV } from '../config/env.js';

const BASE_URL = ENV.PYTHON_PDF_SERVICE_URL;

/**
 * Forward a single uploaded file to the Python PDF service.
 *
 * Uses native Node 18+ fetch + FormData + Blob — no extra npm packages needed.
 *
 * @param {Object} file     - Multer file object { path, originalname, mimetype }
 * @param {string} endpoint - Python service path e.g. '/api/pdf/to-word'
 * @returns {Promise<Object>} Parsed JSON response from Python service
 */
export async function forwardFileToPythonPdf(file, endpoint) {
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
      `Python PDF service tidak dapat dihubungi. Pastikan service berjalan di ${BASE_URL}.`
    );
  }

  const json = await response.json();

  if (!response.ok) {
    // Bubble up the Python service error message cleanly
    const detail = json?.detail || json?.message || 'Terjadi kesalahan pada Python service.';
    throw new Error(detail);
  }

  return json;
}
