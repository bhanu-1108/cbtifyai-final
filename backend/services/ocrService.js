/**
 * ocrService.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * High-performance hybrid text extraction engine:
 *   1. Ultra-fast local digital PDF extraction (~5ms) for text PDFs via pdf-parse
 *   2. Python FastAPI OCR Microservice (PaddleOCR) if online (fast 2.5s connect check)
 *   3. Pure In-Memory JavaScript OCR (Tesseract.js) for cloud images with zero external servers
 *   4. Native PDF binary stream decoder fallback
 */

import { createRequire } from 'node:module';
import axios from 'axios';
import FormData from 'form-data';
import { createWorker } from 'tesseract.js';

const require = createRequire(import.meta.url);

let PDFParse = null;
try {
  const pdfParsePkg = require('pdf-parse');
  PDFParse = pdfParsePkg.PDFParse || pdfParsePkg.default || pdfParsePkg;
} catch (_e) {}

const OCR_BASE_URL = process.env.PYTHON_OCR_URL || 'http://127.0.0.1:8000';
const PYTHON_OCR_TIMEOUT_MS = 4_000; // 4s fast timeout if Python microservice is offline

/**
 * Send a file buffer to the OCR service or fallback to native PDF/Tesseract parsing.
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
        : (textResult?.text || textResult?.pages?.map((p) => p.text).join('\n') || '');

      if (extracted && extracted.trim().length >= 80) {
        console.log(`[PDF] Fast native extraction complete: ${extracted.length} characters.`);
        return extracted;
      }
    } catch (_err) {
      // Fall through to OCR
    }
  }

  // Step 2: Python OCR Microservice (if running locally or deployed)
  const candidateUrls = [OCR_BASE_URL, 'http://127.0.0.1:8000'].filter(Boolean);
  const uniqueUrls = [...new Set(candidateUrls)];

  for (const baseUrl of uniqueUrls) {
    try {
      const endpoint = isPdf ? '/ocr/pdf' : '/ocr/image';
      const form = new FormData();
      form.append('file', fileBuffer, {
        filename: originalname,
        contentType: mimetype,
      });

      const response = await axios.post(`${baseUrl}${endpoint}`, form, {
        headers: form.getHeaders(),
        timeout: PYTHON_OCR_TIMEOUT_MS,
      });

      if (response.data?.text && typeof response.data.text === 'string' && response.data.text.trim().length >= 10) {
        console.log(`[OCR] Extracted ${response.data.text.length} chars via Python OCR service at ${baseUrl}.`);
        return response.data.text;
      }
    } catch (_err) {
      // Fast fallback to next engine
    }
  }

  // Step 3: Pure In-Memory OCR for Images using Tesseract.js (Cloud & Serverless Ready)
  if (!isPdf) {
    try {
      console.log(`[OCR] Running local in-memory OCR on image "${originalname}" …`);
      const worker = await createWorker('eng');
      const ret = await worker.recognize(fileBuffer);
      await worker.terminate();
      const extracted = (ret?.data?.text || '').trim();
      if (extracted && extracted.length >= 10) {
        console.log(`[OCR] In-memory OCR successfully extracted ${extracted.length} characters.`);
        return extracted;
      }
    } catch (tessErr) {
      console.warn('[OCR] In-memory Tesseract fallback error:', tessErr.message);
    }
  }

  // Step 4: Raw PDF stream fallback
  if (isPdf) {
    const rawText = extractRawPdfText(fileBuffer);
    if (rawText && rawText.length >= 20) {
      console.log(`[PDF] Extracted ${rawText.length} characters via raw stream fallback.`);
      return rawText;
    }
  }

  if (!isPdf) {
    throw new Error(
      `Unable to extract text from image "${originalname}". Please ensure the image is clear and contains readable text.`
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
    const filtered = matches.filter((m) => !/(FontDescriptor|BaseFont|Encoding|FontName|PDF-1\.|endobj|stream)/i.test(m));
    return filtered.join(' ').replace(/\s+/g, ' ').trim();
  } catch (_e) {
    return '';
  }
}
