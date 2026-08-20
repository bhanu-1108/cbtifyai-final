/**
 * huggingfaceService.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * Dual-Mode Intelligent CBT Question Generator using Qwen/Qwen2.5-7B-Instruct.
 *
 * Capabilities:
 *   1. Raw Educational Paragraphs / Topic Notes (Math, Chemistry, Science, Arts, Tech):
 *      Reads conceptual content on any subject, extracts reactions/formulas/concepts,
 *      and synthesizes 5–15 rigorous MCQs with 4 options, solutions, Bloom's ratings,
 *      and step-by-step explanations.
 *
 *   2. Pre-formatted Question Papers / Quizzes:
 *      Parses, standardizes, and formats all questions without skipping.
 */

import 'dotenv/config';
import axios from 'axios';

const HF_TIMEOUT_MS = 40_000;
const MAX_TOTAL_QUESTIONS = 60;

/**
 * Generate CBT questions for an array of text chunks.
 * Uses parallel execution across chunks with multi-token automatic failover.
 *
 * @param {string[]} chunks  Array of cleaned text chunks.
 * @param {string|null} answerKey Optional instructor answer key.
 * @returns {Promise<object[]>}  Array of validated question objects.
 */
export async function generateQuestions(chunks, answerKey = null) {
  const rawApiKeys = (process.env.HF_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  if (rawApiKeys.length === 0 || rawApiKeys[0] === 'hf_your_token_here') {
    throw new Error(
      'HF_API_KEY is not configured. Add your Hugging Face API token to backend/.env'
    );
  }

  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('No text chunks provided for question generation.');
  }

  console.log(`[HF] Fast generation started for ${chunks.length} chunk(s) in parallel (with ${rawApiKeys.length} configured key(s))...`);

  // Parallel generation across all chunks with key failover
  const results = await Promise.allSettled(
    chunks.map(async (chunk, idx) => {
      console.log(`[HF] Processing chunk ${idx + 1}/${chunks.length} (${chunk.length} chars) …`);
      const questions = await generateForChunkWithKeyRotation(chunk, rawApiKeys, answerKey);
      console.log(`[HF] Chunk ${idx + 1}: generated ${questions.length} questions.`);
      return questions;
    })
  );

  const allQuestions = [];
  const errors = [];

  results.forEach((res, idx) => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      allQuestions.push(...res.value);
    } else if (res.status === 'rejected') {
      console.error(`[HF] Chunk ${idx + 1} failed: ${res.reason?.message || res.reason}`);
      errors.push(`Chunk ${idx + 1}: ${res.reason?.message || res.reason}`);
    }
  });

  if (allQuestions.length === 0) {
    throw new Error(
      `Question generation failed for all chunks. Errors:\n${errors.join('\n')}`
    );
  }

  return deduplicateQuestions(allQuestions).slice(0, MAX_TOTAL_QUESTIONS);
}

async function generateForChunkWithKeyRotation(chunk, apiKeys, answerKey = null) {
  let lastError = null;

  for (let kIdx = 0; kIdx < apiKeys.length; kIdx++) {
    const currentKey = apiKeys[kIdx];
    try {
      return await generateForChunk(chunk, currentKey, answerKey);
    } catch (err) {
      lastError = err;
      if (kIdx < apiKeys.length - 1) {
        console.warn(`[HF] Key ${kIdx + 1} failed (${(err.message || '').slice(0, 80)}...). Automatically failing over to backup key ${kIdx + 2}/${apiKeys.length}…`);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

async function generateForChunk(chunk, apiKey, answerKey = null) {
  const prompt = buildPrompt(chunk, answerKey);

  const candidateModels = [
    'Qwen/Qwen2.5-72B-Instruct',
    'meta-llama/Llama-3.1-8B-Instruct',
    'meta-llama/Llama-3.3-70B-Instruct',
  ];

  let lastError = null;
  let rawContent = null;
  let isCreditDepleted = false;

  for (const model of candidateModels) {
    const chatPayload = {
      model,
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
      max_tokens: 1900,
      temperature: 0.2,
    };

    // Attempt 1: Hugging Face OpenAI-compatible Chat Router
    try {
      console.log(`[HF] Requesting model ${model} via Router …`);
      const res = await axios.post(
        'https://router.huggingface.co/v1/chat/completions',
        chatPayload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: HF_TIMEOUT_MS,
        }
      );

      if (res && res.data && res.data.choices?.[0]?.message?.content) {
        rawContent = res.data.choices[0].message.content;
        break;
      }
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const rawError = err.response?.data?.error;
      const msg = typeof rawError === 'object' ? (rawError?.message || JSON.stringify(rawError)) : (rawError || err.message);
      if (status === 402) {
        isCreditDepleted = true;
      }
      console.warn(`[HF Router] Model ${model} failed (status ${status}): ${msg}`);
    }

    // Attempt 2: Direct Serverless Inference API fallback
    try {
      console.log(`[HF Serverless] Fallback requesting ${model} …`);
      const serverlessRes = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          inputs: `<|im_start|>system\nYou are an expert Educational Assessment Architect and CBT AI Engine. Output ONLY a valid JSON array starting with [ and ending with ].<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`,
          parameters: {
            max_new_tokens: 2200,
            temperature: 0.2,
            return_full_text: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: HF_TIMEOUT_MS,
        }
      );

      const data = serverlessRes.data;
      if (Array.isArray(data) && data[0]?.generated_text) {
        rawContent = data[0].generated_text;
        break;
      } else if (typeof data === 'string') {
        rawContent = data;
        break;
      }
    } catch (sErr) {
      const status = sErr.response?.status;
      console.warn(`[HF Serverless] Model ${model} fallback failed (status ${status})`);
    }
  }

  if (!rawContent) {
    if (isCreditDepleted) {
      throw new Error(
        'Your Hugging Face API key has depleted its monthly inference provider credits (Status 402). ' +
        'Please generate a new free Hugging Face User Access Token at https://huggingface.co/settings/tokens and update HF_API_KEY in backend/.env'
      );
    }
    throw new Error(
      `Hugging Face Inference API failed on all models: ${lastError?.message || 'Unknown error'}`
    );
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

  return `You are an expert Educational Assessment Architect and CBT Examination AI Engine.
Generate a high-quality Computer-Based Test (CBT) multiple-choice examination strictly and ONLY from the provided text below.

STRICT GROUNDING & SUBJECT RULES:
1. STRICTLY FAITHFUL: Generate questions based SOLELY on the content, facts, concepts, definitions, events, rules, dates, or formulas present in the provided text.
2. SUBJECT AGNOSTIC: If the text is about Social Studies (SST), History, Geography, Civics, Economics, Biology, Physics, Chemistry, Mathematics, Literature, Technology, or Aptitude, generate questions ONLY matching that specific subject. NEVER mix or hallucinate concepts from other subjects (e.g., do NOT generate science/chemistry questions for an SST or History document).
3. If the text is an EXISTING QUESTION PAPER, extract all original questions and options faithfully.
4. If the text is STUDY NOTES / LESSON PARAGRAPHS, synthesize 5 to 10 high-yield multiple choice questions testing key ideas directly mentioned in the text.

${answerKeyInstruction}

CRITICAL RULES:
1. "question": Clean, concise question prompt testing a specific point from the text.
2. "options": Array of exactly 4 plausible option strings WITHOUT "A.", "B.", "C.", "D." prefixes. Example: ["Option 1", "Option 2", "Option 3", "Option 4"].
3. "correctAnswer": MUST be the EXACT text string matching one of the 4 items in the options array.
4. "difficulty": "Easy" | "Medium" | "Hard"
5. "topic": Specific subject/chapter topic drawn directly from the text (e.g., "French Revolution", "Indian Constitution", "Cell Division", "Kinematics", etc.).
6. "bloomLevel": "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create"
7. "explanation": A clear 1-2 sentence explanation citing the fact, concept, or formula from the text.

JSON SCHEMA:
[
  {
    "question": "string (question prompt ONLY)",
    "options": ["Option 1 Text", "Option 2 Text", "Option 3 Text", "Option 4 Text"],
    "correctAnswer": "string (exact match to one of the 4 options)",
    "difficulty": "Easy" | "Medium" | "Hard",
    "topic": "string (topic name from text)",
    "bloomLevel": "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create",
    "explanation": "string (clear reason from the text)"
  }
]

DOCUMENT TEXT:
"""
${chunk}
"""

Return ONLY the valid JSON array starting with [ and ending with ]. Do not include markdown codeblocks or any additional commentary.`;
}

function parseQuestionsFromContent(rawContent) {
  let content = (rawContent || '').trim();
  if (content.startsWith('```json')) {
    content = content.slice(7);
  } else if (content.startsWith('```')) {
    content = content.slice(3);
  }
  if (content.endsWith('```')) {
    content = content.slice(0, -3);
  }
  content = content.trim();

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
    if (lastBrace === -1) return null;
    const closed = truncatedJson.slice(0, lastBrace + 1) + ']';
    const parsed = JSON.parse(closed);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (_e) {
    // Repair attempt failed
  }
  return null;
}

function deduplicateQuestions(questions) {
  const seen = new Set();
  return questions.filter((q) => {
    if (!q || !q.question) return false;
    const key = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
