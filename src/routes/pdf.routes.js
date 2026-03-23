import { Router } from 'express';
import { 
  mergePdf, 
  splitPdf, 
  compressPdf, 
  jpgToPdf, 
  pdfToJpg 
} from '../controllers/pdf.controller.js';

const router = Router();

// POST /api/pdf/merge
router.post('/merge', mergePdf);

// POST /api/pdf/split
router.post('/split', splitPdf);

// POST /api/pdf/compress
router.post('/compress', compressPdf);

// POST /api/pdf/jpg-to-pdf
router.post('/jpg-to-pdf', jpgToPdf);

// POST /api/pdf/pdf-to-jpg
router.post('/pdf-to-jpg', pdfToJpg);

export default router;
