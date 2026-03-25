import 'dotenv/config';

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 4000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  OUTPUT_DIR: process.env.OUTPUT_DIR || 'public/downloads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB) || 20,
  MAX_FILES: parseInt(process.env.MAX_FILES) || 10,
  // Python microservice base URLs
  PYTHON_PDF_SERVICE_URL: process.env.PYTHON_PDF_SERVICE_URL || 'http://localhost:8001',
  PYTHON_IMAGE_SERVICE_URL: process.env.PYTHON_IMAGE_SERVICE_URL || 'http://localhost:8002',
};
