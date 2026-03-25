import { Router } from 'express';
import healthRoute from './health.route.js';
import pdfRoutes from './pdf.routes.js';
import imageRoutes from './image.routes.js';

const router = Router();

// Mount sub-routes
router.use('/health', healthRoute);
router.use('/pdf', pdfRoutes);
router.use('/image', imageRoutes);

export default router;
