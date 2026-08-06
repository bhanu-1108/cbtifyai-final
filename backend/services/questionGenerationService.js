/**
 * questionGenerationService.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * High-level orchestrator that ties together OCR → Clean → Chunk → HF → Validate.
 *
 * Exported function:
 *   generateCbtFromFile(fileBuffer, mimetype, originalname, createdBy, db)
 *
 * Returns:
 *   { testDoc, documentDoc }  — both already persisted to MongoDB
 */

import { extractText } from './ocrService.js';
import { generateQuestions } from './huggingfaceService.js';
import { chunkText } from './chunkService.js';
import { cleanText } from '../utils/textCleaner.js';
import { validateQuestions } from './validatorService.js';

/**
 * Normalise a question from Hugging Face format → CBTifyAI MongoDB format.
 *
 * HF returns: { question, options, correctAnswer (string), difficulty, topic, bloomLevel }
 * CBTify needs: { questionText, options, correctAnswer (0-based index), explanation }
 */
function normalizeHFQuestion(hfQ) {
  const correctIndex = hfQ.options.findIndex(
    (opt) => opt.trim() === (hfQ.correctAnswer || '').trim()
  );

  return {
    questionText: hfQ.question,
    options: hfQ.options,
    correctAnswer: correctIndex >= 0 ? correctIndex : 0,
    explanation: `Topic: ${hfQ.topic || 'N/A'} | Bloom Level: ${hfQ.bloomLevel || 'N/A'} | Difficulty: ${hfQ.difficulty || 'N/A'}`,
    difficulty: hfQ.difficulty || 'Medium',
    topic: hfQ.topic || '',
    bloomLevel: hfQ.bloomLevel || 'Remember',
  };
}

/**
 * Run the full pipeline and persist results to MongoDB.
 *
 * @param {Buffer}  fileBuffer
 * @param {string}  mimetype
 * @param {string}  originalname
 * @param {string}  createdBy      User ID / 'system'
 * @param {object}  db             MongoDB Db instance
 * @returns {Promise<{ testDoc, documentDoc, extractedText, validationWarnings }>}
 */
export async function generateCbtFromFile(fileBuffer, mimetype, originalname, createdBy, db) {
  // ── Step 1: OCR ─────────────────────────────────────────────────────────────
  console.log('[Pipeline] Step 1/5: Extracting text via OCR microservice …');
  const rawText = await extractText(fileBuffer, mimetype, originalname);

  if (!rawText || rawText.trim().length < 50) {
    throw new Error(
      'Extracted text is too short or empty. Ensure the file contains readable text.'
    );
  }

  // ── Step 2: Clean text ───────────────────────────────────────────────────────
  console.log('[Pipeline] Step 2/5: Cleaning extracted text …');
  const cleanedText = cleanText(rawText);
  const wordCount = cleanedText.split(/\s+/).filter(w => w.length > 2).length;

  if (cleanedText.length < 150 || wordCount < 15) {
    throw new Error(
      `The file "${originalname}" contains scanned images or insufficient readable text (${wordCount} words found). Please upload a standard text PDF document (such as study notes, textbook chapters, or question papers).`
    );
  }

  // ── Step 3: Chunk text ───────────────────────────────────────────────────────
  console.log('[Pipeline] Step 3/5: Splitting text into chunks …');
  const chunks = chunkText(cleanedText);

  if (chunks.length === 0) {
    throw new Error('Could not split text into processable chunks.');
  }

  console.log(`[Pipeline] Text split into ${chunks.length} chunk(s).`);

  // ── Step 4: Generate questions via Hugging Face ──────────────────────────────
  console.log('[Pipeline] Step 4/5: Generating questions via Hugging Face …');
  const rawQuestions = await generateQuestions(chunks);

  // ── Step 5: Validate question schema ────────────────────────────────────────
  console.log('[Pipeline] Step 5/5: Validating question schema …');
  const { valid, errors: validationErrors } = validateQuestions(rawQuestions);

  if (valid.length === 0) {
    throw new Error(
      `All generated questions failed validation. Errors: ${validationErrors.slice(0, 5).join('; ')}`
    );
  }

  console.log(
    `[Pipeline] Complete. Valid questions: ${valid.length}. Rejected: ${rawQuestions.length - valid.length}.`
  );

  // ── Normalise to CBTifyAI schema ─────────────────────────────────────────────
  const normalizedQuestions = valid.map(normalizeHFQuestion);

  // ── Persist to MongoDB ───────────────────────────────────────────────────────
  const testId = `test-${Date.now()}`;
  const testDoc = {
    _id: testId,
    title: `AI-Generated Test: ${originalname}`,
    description: `Customized assessment generated from uploaded document "${originalname}".`,
    timeLimit: Math.max(5, normalizedQuestions.length * 3),
    createdBy: createdBy || 'system',
    createdAt: new Date(),
    questions: normalizedQuestions.map((q, i) => ({
      _id: `${testId}-q-${i}`,
      ...q,
    })),
  };

  await db.collection('tests').insertOne(testDoc);
  console.log(`[Pipeline] Test saved to MongoDB: ${testId}`);

  const sizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(1);
  const documentDoc = {
    _id: `doc-${Date.now()}`,
    filename: originalname,
    size: `${sizeMB} MB`,
    status: 'ready',
    testId,
    createdAt: new Date(),
  };

  await db.collection('documents').insertOne(documentDoc);
  console.log(`[Pipeline] Document metadata saved to MongoDB: ${documentDoc._id}`);

  return {
    testDoc,
    documentDoc,
    extractedText: cleanedText,
    validationWarnings: validationErrors,
  };
}
