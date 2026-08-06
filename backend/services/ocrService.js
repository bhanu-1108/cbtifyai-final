/**
 * ocrService.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends uploaded files to the Python FastAPI OCR microservice and returns
 * the extracted text.
 *
 * Supported types:
 *   • PDF  →  POST /ocr/pdf
 *   • PNG / JPG / JPEG  →  POST /ocr/image
 */

import axios from 'axios';
import FormData from 'form-data';

// Base URL of the FastAPI OCR microservice (from environment)
const OCR_BASE_URL = process.env.PYTHON_OCR_URL || 'http://localhost:8000';

// Timeout for OCR requests — CPU OCR and large PDFs can take extra time
const OCR_TIMEOUT_MS = 300_000; // 5 minutes

/**
 * Send a file buffer to the appropriate OCR endpoint based on MIME type.
 *
 * @param {Buffer}  fileBuffer   Raw file content.
 * @param {string}  mimetype     MIME type of the file.
 * @param {string}  originalname Original filename.
 * @returns {Promise<string>}    Extracted text from the document.
 */
export async function extractText(fileBuffer, mimetype, originalname) {
  const endpoint = resolveEndpoint(mimetype, originalname);

  const form = new FormData();
  form.append('file', fileBuffer, {
    filename: originalname,
    contentType: mimetype,
  });

  let response;
  try {
    response = await axios.post(`${OCR_BASE_URL}${endpoint}`, form, {
      headers: form.getHeaders(),
      timeout: OCR_TIMEOUT_MS,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw new Error(
        `OCR microservice is unavailable at ${OCR_BASE_URL}. ` +
          'Ensure the FastAPI service is running (cd backend/python && uvicorn main:app --reload).'
      );
    }
    const detail = err.response?.data?.detail || err.message;
    throw new Error(`OCR service error: ${detail}`);
  }

  const text = response.data?.text;
  if (typeof text !== 'string') {
    throw new Error('OCR service returned an unexpected response format.');
  }

  return text;
}

/**
 * Map a MIME type / filename to the correct FastAPI endpoint path.
 */
function resolveEndpoint(mimetype, originalname) {
  const lower = (originalname || '').toLowerCase();

  if (mimetype === 'application/pdf' || lower.endsWith('.pdf')) {
    return '/ocr/pdf';
  }

  if (
    ['image/png', 'image/jpeg', 'image/jpg'].includes(mimetype) ||
    lower.match(/\.(png|jpe?g)$/)
  ) {
    return '/ocr/image';
  }

  throw new Error(
    `Unsupported file type: "${mimetype}". Accepted types: PDF, PNG, JPG, JPEG.`
  );
}
