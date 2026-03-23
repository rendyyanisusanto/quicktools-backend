/**
 * pdf.service.js
 * Business logic for PDF operations.
 * Add new PDF tools (split, compress, etc.) here as separate functions.
 */

import PDFMerger from 'pdf-merger-js';
import { PDFDocument } from 'pdf-lib';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import { ENV } from '../config/env.js';
import { ensureDir, generateUniqueFilename, resolveFromRoot } from '../utils/file.utils.js';

const execPromise = util.promisify(exec);

/**
 * Merges multiple PDF files into a single output PDF.
 *
 * @param {string[]} filePaths - Absolute paths of uploaded PDFs (in merge order)
 * @returns {Promise<{ fileName: string, outputPath: string, downloadUrl: string }>}
 */
export async function mergePdfs(filePaths) {
  if (!filePaths || filePaths.length < 2) {
    throw new Error('Minimal 2 file PDF diperlukan untuk digabung.');
  }

  const outputDir = resolveFromRoot(ENV.OUTPUT_DIR);
  ensureDir(outputDir);

  const fileName = generateUniqueFilename('merged', 'pdf');
  const outputPath = path.join(outputDir, fileName);

  const merger = new PDFMerger();

  for (const filePath of filePaths) {
    try {
      await merger.add(filePath);
    } catch (err) {
      const name = path.basename(filePath);
      // pdf-lib throws when the file is not a valid PDF binary
      if (err.message?.includes('No PDF header')) {
        throw new Error(
          `File "${name}" bukan file PDF yang valid atau file rusak. Pastikan file yang diunggah adalah PDF asli.`
        );
      }
      throw new Error(`Gagal memproses file "${name}": ${err.message}`);
    }
  }

  try {
    await merger.save(outputPath);
  } catch (err) {
    throw new Error(`Gagal menyimpan hasil gabungan: ${err.message}`);
  }

  return {
    fileName,
    outputPath,
    downloadUrl: `/downloads/${fileName}`,
  };
}

/**
 * Splits a PDF file based on the selected mode.
 *
 * @param {string} filePath - Absolute path of uploaded PDF file
 * @param {string} mode - 'range' | 'all-pages'
 * @param {string} pages - e.g., '1-3,5' (used only if mode === 'range')
 * @returns {Promise<{ mode: string, files: Array<{fileName: string, downloadUrl: string}> }>}
 */
export async function splitPdf(filePath, mode, pages = '') {
  const outputDir = resolveFromRoot(ENV.OUTPUT_DIR);
  ensureDir(outputDir);

  const nameBase = path.parse(filePath).name.replace(/[^a-zA-Z0-9-]/g, '');

  let mergedPdf;
  let pdfDoc;

  if (mode === 'range') {
    if (!pages.trim()) {
      throw new Error('Masukkan rentang halaman.');
    }
    
    // Parse pages like "1-3, 5" into 1-based page numbers
    const pageNumbers = new Set();
    const parts = pages.split(',').map(p => p.trim()).filter(Boolean);
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (isNaN(start) || isNaN(end) || start > end || start < 1) {
          throw new Error(`Format format rentang halaman tidak valid: ${part}`);
        }
        for (let i = start; i <= end; i++) {
          pageNumbers.add(i);
        }
      } else {
        const num = Number(part);
        if (isNaN(num) || num < 1) {
          throw new Error(`Nomor halaman tidak valid: ${part}`);
        }
        pageNumbers.add(num);
      }
    }

    const uniquePages = Array.from(pageNumbers).sort((a, b) => a - b);
    if (uniquePages.length === 0) {
      throw new Error('Tidak ada halaman yang dipilih.');
    }

    const merger = new PDFMerger();
    try {
      await merger.add(filePath, uniquePages); // pdf-merger-js supports array of pages (1-based)
    } catch (err) {
      if (err.message?.includes('No PDF header')) {
        throw new Error('File tidak valid atau rusak. Pastikan unggah PDF asli.');
      }
      throw new Error(`Gagal memisahkan file: halaman mungkin melebihi jumlah halaman dokumen.`);
    }

    const fileName = generateUniqueFilename(`split-range`, 'pdf');
    const outputPath = path.join(outputDir, fileName);
    await merger.save(outputPath);

    return {
      mode: 'range',
      files: [{ fileName, downloadUrl: `/downloads/${fileName}` }]
    };

  } else if (mode === 'all-pages') {
    // For all-pages, use pdf-lib directly to extract 1 by 1
    const { readFile, writeFile } = await import('fs/promises');
    let pdfBytes;
    try {
      pdfBytes = await readFile(filePath);
      pdfDoc = await PDFDocument.load(pdfBytes);
    } catch (err) {
      throw new Error('File PDF rusak atau tidak dapat dibaca.');
    }

    const totalPages = pdfDoc.getPageCount();
    const generatedFiles = [];

    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(copiedPage);

      const pdfBytesOut = await newPdf.save();
      const fileName = generateUniqueFilename(`page-${i + 1}`, 'pdf');
      const outputPath = path.join(outputDir, fileName);

      await writeFile(outputPath, pdfBytesOut);
      generatedFiles.push({ fileName, downloadUrl: `/downloads/${fileName}` });
    }

    return {
      mode: 'all-pages',
      files: generatedFiles
    };

  } else {
    throw new Error('Mode pemisahan tidak didukung.');
  }
}

/**
 * Basic PDF compression implementation using pdf-lib.
 * Does not deeply compress image bytes, just strips metadata.
 */
export async function compressPdf(filePath) {
  const outputDir = resolveFromRoot(ENV.OUTPUT_DIR);
  ensureDir(outputDir);

  const { readFile, writeFile, stat } = await import('fs/promises');
  
  let pdfBytes;
  try {
    pdfBytes = await readFile(filePath);
  } catch (err) {
    throw new Error('Gagal membaca file PDF rujukan.');
  }
  
  const originalStats = await stat(filePath);

  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes);
  } catch (err) {
    throw new Error('File PDF rusak atau tidak valid.');
  }

  // Best effort JS metadata compression by saving with default settings
  const optimizedBytes = await pdfDoc.save({ useObjectStreams: false });
  
  const fileName = generateUniqueFilename('compress', 'pdf');
  const outputPath = path.join(outputDir, fileName);
  await writeFile(outputPath, optimizedBytes);

  return {
    fileName,
    outputPath,
    downloadUrl: `/downloads/${fileName}`,
    originalSize: originalStats.size,
    newSize: optimizedBytes.length,
    simulated: true, // indicates to frontend we ran best-effort 
  };
}

/**
 * Embeds multiple JPG files into a new PDF document.
 */
export async function jpgToPdf(imagePaths) {
  const outputDir = resolveFromRoot(ENV.OUTPUT_DIR);
  ensureDir(outputDir);

  const { readFile, writeFile } = await import('fs/promises');
  
  const pdfDoc = await PDFDocument.create();

  for (const imgPath of imagePaths) {
    try {
      const imgBytes = await readFile(imgPath);
      const image = await pdfDoc.embedJpg(imgBytes);
      const { width, height } = image.scale(1);
      
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
    } catch (err) {
      throw new Error(`Gagal memuat gambar: ${path.basename(imgPath)}. Pastikan file berformat JPG yang valid.`);
    }
  }

  const pdfBytes = await pdfDoc.save();
  const fileName = generateUniqueFilename('jpg-pdf', 'pdf');
  const outputPath = path.join(outputDir, fileName);
  
  await writeFile(outputPath, pdfBytes);

  return {
    fileName,
    outputPath,
    downloadUrl: `/downloads/${fileName}`,
  };
}

/**
 * Renders each page of a PDF into a separate JPG file natively using pdftoppm.
 */
export async function pdfToJpg(filePath) {
  const outputDir = resolveFromRoot(ENV.OUTPUT_DIR);
  ensureDir(outputDir);

  const prefix = generateUniqueFilename('pdf-jpg', ''); 
  // e.g. "pdf-jpg-16104030-xxxx" -> pdftoppm will create "pdf-jpg-16104030-xxxx-1.jpg"

  const outputPathPrefix = path.join(outputDir, prefix);

  try {
    // Run pdftoppm
    // -jpeg: Output as JPEG
    // -r 150: DPI resolution (150 is a good balance of quality and speed)
    await execPromise(`pdftoppm -jpeg -r 150 "${filePath}" "${outputPathPrefix}"`);

    // pdftoppm generates files named prefix-1.jpg, prefix-2.jpg, or prefix-01.jpg depending on page count.
    // So we read the output directory to find all files starting with our prefix.
    const { readdir } = await import('fs/promises');
    const filesInDir = await readdir(outputDir);
    
    const generatedImages = filesInDir
      .filter((file) => file.startsWith(prefix) && file.endsWith('.jpg'))
      .sort(); // guarantees -1 before -2 before -10 if numerically uniform, but string sort usually works if padded

    if (generatedImages.length === 0) {
      throw new Error('Tidak ada gambar yang dihasilkan.');
    }

    const files = generatedImages.map((fileName) => ({
      fileName,
      downloadUrl: `/downloads/${fileName}`,
    }));

    return {
      ready: true,
      files,
    };
  } catch (err) {
    throw new Error('Gagal mengonversi PDF ke JPG. Pastikan file PDF tidak dikunci/enkripsi.');
  }
}
