import { Router } from 'express';
import { removeBackground, pasPhoto } from '../controllers/image.controller.js';

const router = Router();

// POST /api/image/remove-background
router.post('/remove-background', removeBackground);

// POST /api/image/pas-photo
router.post('/pas-photo', pasPhoto);

export default router;

