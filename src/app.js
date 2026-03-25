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

// Serve merged PDF files for download (native Node.js)
const downloadsPath = resolveFromRoot(ENV.OUTPUT_DIR);
app.use('/downloads', express.static(downloadsPath));

// Proxy for Python service files
app.get('/api/python-proxy/:service/:filename', async (req, res) => {
  const { service, filename } = req.params;
  let targetBaseUrl = '';

  if (service === 'pdf') {
    targetBaseUrl = ENV.PYTHON_PDF_SERVICE_URL;
  } else if (service === 'image') {
    targetBaseUrl = ENV.PYTHON_IMAGE_SERVICE_URL;
  } else {
    return res.status(400).json({ success: false, message: 'Invalid service' });
  }

  const targetUrl = `${targetBaseUrl}/files/output/${filename}`;

  try {
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      console.error(`Proxy Target Error: ${response.status} ${response.statusText} for ${targetUrl}`);
      return res.status(response.status).json({ 
        success: false, 
        message: 'File tidak ditemukan di layanan Python.' 
      });
    }

    // Forward headers
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the response body to the client
    // Native fetch in Node 18+ provides a Web Stream body
    if (response.body) {
      const { Readable } = await import('node:stream');
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.status(500).json({ success: false, message: 'Response body is empty' });
    }
  } catch (err) {
    console.error(`Proxy Exception for ${targetUrl}:`, err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil file dari layanan Python. Pastikan layanan berjalan.' 
    });
  }
});

// Mount API routes
app.use('/api', apiRoutes);

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

export default app;

