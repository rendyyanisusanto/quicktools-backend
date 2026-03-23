/**
 * file.utils.js
 * Helper functions for file system operations.
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Ensures a directory exists; creates it recursively if not.
 * @param {string} dirPath - Absolute or relative path
 */
export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generates a unique filename with a given prefix and extension.
 * Example: merged-a3f9b2.pdf
 * @param {string} prefix
 * @param {string} ext - Without leading dot
 * @returns {string}
 */
export function generateUniqueFilename(prefix, ext) {
  const uid = uuidv4().split('-')[0]; // short 8-char id
  return `${prefix}-${uid}.${ext}`;
}

/**
 * Removes a list of file paths from the filesystem silently.
 * @param {string[]} filePaths
 */
export function removeFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Silently ignore removal errors on temp files
    }
  }
}

/**
 * Resolves a path relative to the project root (backend directory).
 * @param {...string} segments
 * @returns {string}
 */
export function resolveFromRoot(...segments) {
  return path.resolve(process.cwd(), ...segments);
}
