import express from 'express';
import cors from 'cors';
import path from 'path';
import { ENV } from './config/env.js';
import { ensureDir, resolveFromRoot } from './utils/file.utils.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Ensure upload and output directories exist on startup
ensureDir(resolveFromRoot(ENV.UPLOAD_DIR));
ensureDir(resolveFromRoot(ENV.OUTPUT_DIR));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — allow any localhost port in dev, configured URL in production
const isLocalhost = (origin) => /^https?:\/\/localhost(:\d+)?$/.test(origin || '');

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // server-to-server / curl
      if (ENV.NODE_ENV === 'development' && isLocalhost(origin)) {
        return callback(null, true);
      }
      if (origin === ENV.FRONTEND_URL) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Serve merged PDF files for download
const downloadsPath = resolveFromRoot(ENV.OUTPUT_DIR);
app.use('/downloads', express.static(downloadsPath));

// Mount API routes
app.use('/api', apiRoutes);

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

export default app;

