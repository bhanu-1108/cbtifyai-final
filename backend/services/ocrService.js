/**
 * ocrService.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * High-performance text extraction engine.
 * Supports:
 *   1. Python FastAPI OCR Microservice (PaddleOCR + PyMuPDF) if online
 *   2. Native Node.js PDFParse engine (Zero-dependency cloud PDF processing)
 */

import { createRequire } from 'node:module';
import axios from 'axios';
import FormData from 'form-data';

const require = createRequire(import.meta.url);

let PDFParse = null;
try {
  const pdfParsePkg = require('pdf-parse');
  PDFParse = pdfParsePkg.PDFParse || pdfParsePkg.default || pdfParsePkg;
} catch (_e) {
  // pdf-parse module resolution fallback
}

// Base URL of the FastAPI OCR microservice (from environment)
const OCR_BASE_URL = process.env.PYTHON_OCR_URL || 'http://localhost:8000';
const OCR_TIMEOUT_MS = 15_000; // 15 seconds fast timeout before fallback

/**
 * Send a file buffer to the OCR service or fallback to native PDF parsing.
 *
 * @param {Buffer}  fileBuffer   Raw file content.
 * @param {string}  mimetype     MIME type of the file.
 * @param {string}  originalname Original filename.
 * @returns {Promise<string>}    Extracted text from the document.
 */
export async function extractText(fileBuffer, mimetype, originalname) {
  const lower = (originalname || '').toLowerCase();
  const isPdf = mimetype === 'application/pdf' || lower.endsWith('.pdf');

  // Attempt 1: Fast Python OCR Microservice (if active)
  try {
    const endpoint = isPdf ? '/ocr/pdf' : '/ocr/image';
    const form = new FormData();
    form.append('file', fileBuffer, {
      filename: originalname,
      contentType: mimetype,
    });

    const response = await axios.post(`${OCR_BASE_URL}${endpoint}`, form, {
      headers: form.getHeaders(),
      timeout: OCR_TIMEOUT_MS,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (response.data?.text && typeof response.data.text === 'string' && response.data.text.trim().length >= 20) {
      console.log(`[OCR] Extracted ${response.data.text.length} chars via Python OCR service.`);
      return response.data.text;
    }
  } catch (_err) {
    console.log(`[OCR] Python microservice unavailable at ${OCR_BASE_URL}. Using cloud PDF fallback mode...`);
  }

  // Attempt 2: Native PDF parsing for PDF files
  if (isPdf) {
    if (PDFParse) {
      try {
        const parser = new PDFParse(new Uint8Array(fileBuffer));
        await parser.load();
        const textResult = await parser.getText();
        const extracted = typeof textResult === 'string' ? textResult : (textResult?.text || textResult?.pages?.map(p => p.text).join('\n') || '');
        if (extracted && extracted.trim().length >= 20) {
          console.log(`[PDF] Extracted ${extracted.length} characters natively via PDFParse.`);
          return extracted;
        }
      } catch (pdfErr) {
        console.log('[PDF] PDFParse failed, trying raw text stream fallback:', pdfErr.message);
      }
    }

    // Attempt 3: Raw PDF text stream fallback
    const rawText = extractRawPdfText(fileBuffer);
    if (rawText && rawText.length >= 20) {
      console.log(`[PDF] Extracted ${rawText.length} characters via raw stream fallback.`);
      return rawText;
    }
  }

  // Error handling for unsupported or empty image files without active OCR
  if (!isPdf) {
    throw new Error(
      `Image OCR microservice is currently offline at ${OCR_BASE_URL}. ` +
      'To process scanned image files (PNG/JPG), start the Python OCR service (cd backend/python && uvicorn main:app --port 8000) or upload PDF documents directly.'
    );
  }

  throw new Error(
    `Unable to extract readable text from PDF "${originalname}". Please ensure the PDF contains readable text or upload a standard study document.`
  );
}

function extractRawPdfText(fileBuffer) {
  try {
    const pdfString = fileBuffer.toString('latin1');
    const textMatches = [];
    const regexTj = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = regexTj.exec(pdfString)) !== null) {
      if (match[1] && match[1].trim().length > 1) {
        textMatches.push(match[1]);
      }
    }
    const clean = textMatches.join(' ').replace(/\\/g, '').replace(/\s+/g, ' ').trim();
    if (clean.length > 50) return clean;
    return (pdfString.match(/[A-Za-z0-9\s.,?!'\":;()\-]{25,}/g) || []).join(' ').replace(/\s+/g, ' ').trim();
  } catch (_e) {
    return '';
  }
}
