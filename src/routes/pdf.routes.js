import { Router } from 'express';
import { 
  mergePdf, 
  splitPdf, 
  compressPdf, 
  jpgToPdf, 
  pdfToJpg,
  addWatermark
} from '../controllers/pdf.controller.js';
import { pdfToWord } from '../controllers/pdfConvert.controller.js';
import { wordToPdf } from '../controllers/wordConvert.controller.js';

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

// POST /api/pdf/to-word (Python microservice gateway)
router.post('/to-word', pdfToWord);

// POST /api/pdf/word-to-pdf (Python microservice gateway)
router.post('/word-to-pdf', wordToPdf);

// POST /api/pdf/add-watermark
router.post('/add-watermark', addWatermark);

export default router;
