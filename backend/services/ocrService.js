/**
 * ocrService.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * High-performance text extraction engine.
 * Supports:
 *   1. Python FastAPI OCR Microservice (PaddleOCR + PyMuPDF) if online
 *   2. Native Node.js pdf-parse engine (Zero-dependency cloud PDF processing)
 */

import axios from 'axios';
import FormData from 'form-data';
import pdfParse from 'pdf-parse';

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
  } catch (err) {
    console.log(`[OCR] Python microservice unavailable at ${OCR_BASE_URL}. Using cloud fallback mode...`);
  }

  // Attempt 2: Native Node.js PDF parsing for PDF files
  if (isPdf) {
    try {
      const parsed = await pdfParse(fileBuffer);
      if (parsed?.text && parsed.text.trim().length >= 20) {
        console.log(`[PDF] Extracted ${parsed.text.length} characters natively via pdf-parse.`);
        return parsed.text;
      }
    } catch (pdfErr) {
      console.error('[PDF] Native pdf-parse extraction error:', pdfErr.message);
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
    `Unable to extract readable text from PDF "${originalname}". Please ensure the PDF contains text or upload a standard study document.`
  );
}
