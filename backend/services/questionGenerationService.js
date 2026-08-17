/**
 * questionGenerationService.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * High-level orchestrator that ties together OCR ➔ Clean ➔ Chunk ➔ HF ➔ Validate.
 *
 * Capabilities:
 *   - Works on 1-2 page short topic paragraphs, lesson summaries, or full question papers.
 *   - Transforms any educational topic into an interactive CBT examination.
 */

import { extractText } from './ocrService.js';
import { generateQuestions } from './huggingfaceService.js';
import { chunkText } from './chunkService.js';
import { cleanText } from '../utils/textCleaner.js';
import { validateQuestions } from './validatorService.js';

function parseAnswerKeyMap(answerKeyText) {
  if (!answerKeyText || typeof answerKeyText !== 'string') return {};
  const map = {};
  const regex = /(?:Q(?:uestion)?\s*(\d+)|\b(\d+)\b)\s*[:.\-=)]*\s*\(?([A-Da-d])\)?/gi;
  let m;
  while ((m = regex.exec(answerKeyText)) !== null) {
    const qNum = parseInt(m[1] || m[2], 10);
    const letter = (m[3] || '').toUpperCase();
    const letterIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[letter];
    if (!isNaN(qNum) && letterIdx !== undefined && qNum > 0) {
      map[qNum - 1] = letterIdx; // 0-indexed
    }
  }
  return map;
}

/**
 * Normalise a question from Hugging Face format ➔ CBTifyAI MongoDB format.
 *
 * HF returns: { question, options, correctAnswer (string), difficulty, topic, bloomLevel, explanation }
 * CBTify needs: { questionText, options, correctAnswer (0-based index), explanation }
 */
function normalizeHFQuestion(hfQ) {
  const correctIndex = (hfQ.options || []).findIndex(
    (opt) => opt.trim() === (hfQ.correctAnswer || '').trim()
  );

  return {
    questionText: hfQ.question,
    options: hfQ.options,
    correctAnswer: correctIndex >= 0 ? correctIndex : 0,
    explanation: hfQ.explanation || `Topic: ${hfQ.topic || 'General'} | Bloom Level: ${hfQ.bloomLevel || 'Understand'} | Difficulty: ${hfQ.difficulty || 'Medium'}`,
    difficulty: hfQ.difficulty || 'Medium',
    topic: hfQ.topic || 'General',
    bloomLevel: hfQ.bloomLevel || 'Understand',
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
 * @param {string|null} answerKey  Optional custom answer key
 * @returns {Promise<{ testDoc, documentDoc, extractedText, validationWarnings }>}
 */
export async function generateCbtFromFile(fileBuffer, mimetype, originalname, createdBy, db, answerKey = null) {
  // ── Step 1: OCR ────────────────────────────────────────────────────────────
  console.log('[Pipeline] Step 1/5: Extracting text via OCR microservice …');
  const rawText = await extractText(fileBuffer, mimetype, originalname);

  if (!rawText || rawText.trim().length < 30) {
    throw new Error(
      'Extracted text is too short or empty. Ensure the file contains readable text.'
    );
  }

  // ── Step 2: Clean text ────────────────────────────────────────────────────
  console.log('[Pipeline] Step 2/5: Cleaning extracted text …');
  const cleanedText = cleanText(rawText);
  const wordCount = cleanedText.split(/\s+/).filter(w => w.length > 2).length;

  if (cleanedText.length < 50 || wordCount < 6) {
    throw new Error(
      `The file "${originalname}" contains insufficient readable text (${wordCount} words found). Please ensure your document contains educational text, notes, or paragraphs.`
    );
  }

  // ── Step 3: Chunk text ────────────────────────────────────────────────────
  console.log('[Pipeline] Step 3/5: Splitting text into chunks …');
  const chunks = chunkText(cleanedText);

  if (chunks.length === 0) {
    throw new Error('Could not split text into processable chunks.');
  }

  console.log(`[Pipeline] Text split into ${chunks.length} chunk(s).`);

  // ── Step 4: Generate questions via Hugging Face ───────────────────────────
  console.log('[Pipeline] Step 4/5: Generating questions via Hugging Face …');
  const rawQuestions = await generateQuestions(chunks, answerKey);

  // ── Step 5: Validate question schema ──────────────────────────────────────
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

  // ── Normalise to CBTifyAI schema ──────────────────────────────────────────
  const answerKeyMap = parseAnswerKeyMap(answerKey);
  const normalizedQuestions = valid.map((q, idx) => {
    const norm = normalizeHFQuestion(q);
    if (answerKeyMap[idx] !== undefined && norm.options && norm.options[answerKeyMap[idx]]) {
      norm.correctAnswer = answerKeyMap[idx];
      norm.explanation = (norm.explanation ? norm.explanation + ' | ' : '') + `Verified against Official Answer Key (Option ${['A','B','C','D'][answerKeyMap[idx]]})`;
    }
    return norm;
  });

  // ── Persist to MongoDB ────────────────────────────────────────────────────
  const testId = `test-${Date.now()}`;
  const cleanTitle = originalname.replace(/\.[^/.]+$/, '').replace(/[_\-]+/g, ' ');
  const testDoc = {
    _id: testId,
    title: `CBT Exam: ${cleanTitle}`,
    description: `Generated from ${originalname} using Hugging Face Qwen2.5-7B-Instruct`,
    timeLimit: Math.max(5, normalizedQuestions.length * 2),
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
