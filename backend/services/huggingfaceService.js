/**
 * huggingfaceService.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends text chunks to the Hugging Face Inference API using Qwen/Qwen2.5-7B-Instruct.
 * Parses and converts ALL questions from the study material without skipping,
 * separating question prompts from option choices and explicit "Answer: X" labels.
 */

import 'dotenv/config';
import axios from 'axios';

const HF_TIMEOUT_MS = 120_000;
const MAX_TOTAL_QUESTIONS = 60;

/**
 * Generate CBT questions for an array of text chunks.
 *
 * @param {string[]} chunks  Array of cleaned text chunks.
 * @returns {Promise<object[]>}  Array of validated question objects.
 */
export async function generateQuestions(chunks) {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey || apiKey === 'hf_your_token_here') {
    throw new Error(
      'HF_API_KEY is not configured. Add your Hugging Face API token to backend/.env'
    );
  }

  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('No text chunks provided for question generation.');
  }

  const allQuestions = [];
  const errors = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[HF] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars) …`);

    try {
      const questions = await generateForChunk(chunk, apiKey);
      console.log(`[HF] Chunk ${i + 1}: received ${questions.length} questions.`);
      allQuestions.push(...questions);

      if (allQuestions.length >= MAX_TOTAL_QUESTIONS) break;
    } catch (err) {
      console.error(`[HF] Chunk ${i + 1} failed: ${err.message}`);
      errors.push(`Chunk ${i + 1}: ${err.message}`);
    }
  }

  if (allQuestions.length === 0) {
    throw new Error(
      `Question generation failed for all chunks. Errors:\n${errors.join('\n')}`
    );
  }

  return deduplicateQuestions(allQuestions).slice(0, MAX_TOTAL_QUESTIONS);
}

async function generateForChunk(chunk, apiKey) {
  const prompt = buildPrompt(chunk);

  const chatPayload = {
    model: 'Qwen/Qwen2.5-7B-Instruct',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert Examination Question Parser and CBT Generator. ' +
          'Your job is to cleanly separate question text from options and answers. ' +
          'Never put options or "Answer:" inside the question field. ' +
          'Never put "A. ", "B. " labels inside the options items. Output ONLY valid JSON arrays.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 3500,
    temperature: 0.1,
  };

  const requests = [
    { url: 'https://router.huggingface.co/v1/chat/completions', payload: chatPayload, type: 'chat' },
    { url: 'https://router.huggingface.co/hf-inference/v1/chat/completions', payload: chatPayload, type: 'chat' },
  ];

  let lastError = null;
  let responseData = null;

  for (const req of requests) {
    try {
      console.log(`[HF] Attempting request: ${req.url}`);
      const res = await axios.post(req.url, req.payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: HF_TIMEOUT_MS,
      });

      if (res && res.data) {
        responseData = res.data;
        break;
      }
    } catch (err) {
      lastError = err;
      if (err.code === 'ECONNABORTED') {
        console.warn(`[HF] Timeout on ${req.url}`);
        continue;
      }
      const status = err.response?.status;
      if (status === 401) {
        throw new Error('Invalid Hugging Face API key (401 Unauthorized). Please check your token.');
      }
      console.warn(`[HF] ${req.url} returned status ${status || err.code}: ${err.message}`);
    }
  }

  if (!responseData) {
    const status = lastError?.response?.status;
    const detail =
      lastError?.response?.data?.error ||
      (typeof lastError?.response?.data === 'string' ? lastError.response.data : null) ||
      lastError?.message;
    throw new Error(`Hugging Face API error (${status || 'Network'}): ${detail}`);
  }

  const rawContent = responseData.choices?.[0]?.message?.content || '';
  if (!rawContent) {
    throw new Error('Hugging Face returned an empty response.');
  }

  return parseQuestionsFromContent(rawContent);
}

function buildPrompt(chunk) {
  return `Convert EVERY SINGLE QUESTION found in the study material below into the JSON schema format.

CRITICAL SEPARATION RULES:
1. "question": Include ONLY the question prompt/sentence (e.g. "Which of the following device can store large amounts of data?"). Do NOT include options ("A. Floppy Disk...", "B. Hard Disk...") or "Answer: B" inside the question field!
2. "options": Array of 4 option strings WITHOUT "A.", "B.", "C.", "D." prefixes. Example: ["Floppy Disk", "Hard Disk", "CDROM", "Zip Disk"].
3. "correctAnswer": The EXACT option text string corresponding to the answer (e.g. "Hard Disk"). If the text says "Answer: B", map option B's text ("Hard Disk") as the correctAnswer. Do NOT output "Answer: B" or "B" as the correctAnswer!
4. Process EVERY question in sequential order without skipping any item!

JSON SCHEMA:
[
  {
    "question": "string (question prompt ONLY)",
    "options": ["Option 1 Text", "Option 2 Text", "Option 3 Text", "Option 4 Text"],
    "correctAnswer": "string (exact match to one of the 4 option texts)",
    "difficulty": "Easy" | "Medium" | "Hard",
    "topic": "string (subject/topic label)",
    "bloomLevel": "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create"
  }
]

STUDY MATERIAL / QUESTION PAPER TEXT:
"""
${chunk}
"""

Return ONLY the JSON array starting with [ and ending with ]. Do not include any text before or after the JSON array.`;
}

function parseQuestionsFromContent(rawContent) {
  let content = rawContent.trim();
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  const startIdx = content.indexOf('[');
  const endIdx = content.lastIndexOf(']');

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(
      'Model did not return a valid JSON array. Raw output: ' + content.slice(0, 200)
    );
  }

  const jsonString = content.slice(startIdx, endIdx + 1);

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (parseErr) {
    throw new Error(
      `Failed to parse model JSON: ${parseErr.message}. Snippet: ${jsonString.slice(0, 200)}`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Model output is not a JSON array.');
  }

  return parsed;
}

function deduplicateQuestions(questions) {
  const seen = new Set();
  return questions.filter((q) => {
    const key = (q.question || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
