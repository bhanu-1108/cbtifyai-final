/**
 * huggingfaceService.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * Dual-Mode Intelligent CBT Question Generator using Qwen/Qwen2.5-7B-Instruct.
 *
 * Capabilities:
 *   1. Raw Educational Paragraphs / Topic Notes:
 *      Reads conceptual content on any subject (1-2 pages or paragraphs),
 *      understands the core concepts, and synthesizes 5–15 rigorous MCQs
 *      with 4 options, solutions, Bloom's Taxonomy ratings, and explanations.
 *
 *   2. Pre-formatted Question Papers / Quizzes:
 *      Parses, standardizes, and formats all questions without skipping.
 */

import 'dotenv/config';
import axios from 'axios';

const HF_TIMEOUT_MS = 120_000;
const MAX_TOTAL_QUESTIONS = 60;

/**
 * Generate CBT questions for an array of text chunks.
 *
 * @param {string[]} chunks  Array of cleaned text chunks.
 * @param {string|null} answerKey Optional instructor answer key.
 * @returns {Promise<object[]>}  Array of validated question objects.
 */
export async function generateQuestions(chunks, answerKey = null) {
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
      const questions = await generateForChunk(chunk, apiKey, answerKey);
      console.log(`[HF] Chunk ${i + 1}: generated ${questions.length} questions.`);
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

async function generateForChunk(chunk, apiKey, answerKey = null) {
  const prompt = buildPrompt(chunk, answerKey);

  const chatPayload = {
    model: 'Qwen/Qwen2.5-7B-Instruct',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert Educational Assessment Architect and Computer-Based Testing (CBT) AI Engine. ' +
          'Your objective is to generate accurate, high-yield Multiple Choice Questions (MCQs) from any study document, lecture notes, textbook paragraph, or exam paper. ' +
          'Always provide exactly 4 distinct options per question, the exact correct answer text string, a pedagogical rationale/explanation, and Bloom\'s Taxonomy cognitive classification. ' +
          'Output ONLY a valid JSON array starting with [ and ending with ]. Do not wrap in markdown or add conversational text.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 3500,
    temperature: 0.2,
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
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message;
      console.warn(`[HF] Endpoint ${req.url} failed (status ${status}): ${msg}`);
    }
  }

  if (!responseData) {
    throw new Error(
      `Hugging Face Inference API failed on all endpoints: ${lastError?.message || 'Unknown error'}`
    );
  }

  const rawContent = responseData.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Hugging Face returned an empty response.');
  }

  return parseQuestionsFromContent(rawContent);
}

function buildPrompt(chunk, answerKey = null) {
  let answerKeyInstruction = '';
  if (answerKey && typeof answerKey === 'string' && answerKey.trim().length > 0) {
    answerKeyInstruction = `
INSTRUCTOR ANSWER KEY / OVERRIDES:
"""
${answerKey.trim()}
"""
Rule: For any question matching the above key, set "correctAnswer" to the specified answer.`;
  }

  return `Generate a complete, high-quality Computer-Based Test (CBT) multiple-choice examination from the educational content below.

MODE INSTRUCTIONS:
1. IF the text is a STUDY PARAGRAPH, TOPIC NOTES, ESSAY, OR LESSON (no questions exist):
   - Carefully analyze the topic, concepts, definitions, rules, facts, and principles.
   - Synthesize 5 to 12 conceptual multiple-choice questions (MCQs) that thoroughly test understanding of the material.
   - For each question, formulate 1 correct answer and 3 realistic, plausible distractors.

2. IF the text is an EXISTING QUESTION PAPER OR QUIZ:
   - Extract and convert all questions sequentially.
   - Cleanly separate the question sentence from the options and answers.

${answerKeyInstruction}

CRITICAL RULES:
1. "question": Clean, self-contained question prompt. Never put options or "Answer:" inside the question string.
2. "options": Array of exactly 4 option strings WITHOUT "A.", "B.", "C.", "D." prefixes. Example: ["Option 1", "Option 2", "Option 3", "Option 4"].
3. "correctAnswer": MUST be the EXACT text string matching one of the 4 items in the options array.
4. "difficulty": "Easy" | "Medium" | "Hard"
5. "topic": Short subject/concept label based on the topic of the text.
6. "bloomLevel": "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create"
7. "explanation": A clear 1-2 sentence explanation of why the correct answer is right.

JSON SCHEMA:
[
  {
    "question": "string (question prompt ONLY)",
    "options": ["Option 1 Text", "Option 2 Text", "Option 3 Text", "Option 4 Text"],
    "correctAnswer": "string (exact match to one of the 4 options)",
    "difficulty": "Easy" | "Medium" | "Hard",
    "topic": "string (topic name)",
    "bloomLevel": "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create",
    "explanation": "string (concise reason why this option is correct)"
  }
]

EDUCATIONAL CONTENT / PARAGRAPH / TOPIC TEXT:
"""
${chunk}
"""

Return ONLY the valid JSON array starting with [ and ending with ]. Do not include markdown codeblocks or any additional commentary.`;
}

function parseQuestionsFromContent(rawContent) {
  let content = rawContent.trim();
  content = content.replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/i, '');

  const startIdx = content.indexOf('[');
  const endIdx = content.lastIndexOf(']');

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(
      'Model did not return a valid JSON array. Raw output: ' + content.slice(0, 200)
    );
  }

  const jsonSubstring = content.slice(startIdx, endIdx + 1);

  try {
    const parsed = JSON.parse(jsonSubstring);
    if (!Array.isArray(parsed)) {
      throw new Error('Parsed JSON is not an array.');
    }
    return parsed;
  } catch (err) {
    console.warn('[HF] Standard JSON.parse failed, attempting repair of truncated JSON…');
    const repaired = tryRepairJson(jsonSubstring);
    if (repaired && Array.isArray(repaired) && repaired.length > 0) {
      console.log(`[HF] Successfully repaired JSON: recovered ${repaired.length} question(s).`);
      return repaired;
    }
    throw new Error(`Failed to parse questions from model response: ${err.message}`);
  }
}

function tryRepairJson(truncatedJson) {
  try {
    const lastBrace = truncatedJson.lastIndexOf('}');
    if (lastBrace !== -1) {
      const candidate = truncatedJson.slice(0, lastBrace + 1) + ']';
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_e) {}
  return null;
}

function deduplicateQuestions(questions) {
  const seen = new Set();
  return questions.filter((q) => {
    if (!q || !q.question) return false;
    const key = q.question.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
