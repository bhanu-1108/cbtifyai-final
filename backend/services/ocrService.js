/**
 * ocrService.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * High-performance text extraction engine.
 * Supports:
 *   1. Ultra-fast local digital PDF extraction (~5ms) for text PDFs
 *   2. Python FastAPI OCR Microservice (PaddleOCR + PyMuPDF) for scanned PDFs and images
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
const OCR_BASE_URL = process.env.PYTHON_OCR_URL || 'http://127.0.0.1:8000';
const OCR_TIMEOUT_MS = 60_000;

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

  // Step 1: For digital PDFs, attempt instantaneous local extraction first (~5ms)
  if (isPdf && PDFParse) {
    try {
      const parser = new PDFParse(new Uint8Array(fileBuffer));
      await parser.load();
      const textResult = await parser.getText();
      const extracted = typeof textResult === 'string'
        ? textResult
        : (textResult?.text || textResult?.pages?.map(p => p.text).join('\n') || '');

      if (extracted && extracted.trim().length >= 80) {
        console.log(`[PDF] Fast native extraction complete: ${extracted.length} characters.`);
        return extracted;
      }
    } catch (_err) {
      // Fall through to Python OCR microservice
    }
  }

  // Step 2: Python OCR Microservice (PaddleOCR for images and scanned PDFs)
  const candidateUrls = [
    OCR_BASE_URL,
    'http://127.0.0.1:8000',
    'http://localhost:8000',
  ];

  for (const baseUrl of [...new Set(candidateUrls)]) {
    try {
      const endpoint = isPdf ? '/ocr/pdf' : '/ocr/image';
      const form = new FormData();
      form.append('file', fileBuffer, {
        filename: originalname,
        contentType: mimetype,
      });

      const response = await axios.post(`${baseUrl}${endpoint}`, form, {
        headers: form.getHeaders(),
        timeout: OCR_TIMEOUT_MS,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (response.data?.text && typeof response.data.text === 'string' && response.data.text.trim().length >= 10) {
        console.log(`[OCR] Extracted ${response.data.text.length} chars via Python OCR service at ${baseUrl}.`);
        return response.data.text;
      }
    } catch (err) {
      // Continue to next candidate URL
    }
  }

  // Step 3: Raw PDF text stream fallback for PDFs if OCR service was busy
  if (isPdf) {
    const rawText = extractRawPdfText(fileBuffer);
    if (rawText && rawText.length >= 20) {
      console.log(`[PDF] Extracted ${rawText.length} characters via raw stream fallback.`);
      return rawText;
    }
  }

  if (!isPdf) {
    throw new Error(
      `Image OCR microservice is currently offline at ${OCR_BASE_URL}. ` +
      'To process scanned image files (PNG/JPG), ensure the Python OCR service is running on port 8000.'
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
      const txt = (match[1] || '').trim();
      if (txt.length > 1 && !/^(Font|Type|Subtype|ProcSet|MediaBox|CropBox|Rotate|Filter|Length|Catalog|Pages|Root)/i.test(txt)) {
        textMatches.push(txt);
      }
    }
    const clean = textMatches.join(' ').replace(/\\/g, '').replace(/\s+/g, ' ').trim();
    if (clean.length > 50) return clean;

    const matches = pdfString.match(/[A-Za-z0-9\s.,?!'\":;()\-]{30,}/g) || [];
    const filtered = matches.filter(m => !/(FontDescriptor|BaseFont|Encoding|FontName|PDF-1\.|endobj|stream)/i.test(m));
    return filtered.join(' ').replace(/\s+/g, ' ').trim();
  } catch (_e) {
    return '';
  }
}
