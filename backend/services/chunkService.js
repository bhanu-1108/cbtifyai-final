/**
 * chunkService.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * Splits cleaned text into logical chunks suitable for sending to LLM.
 * Smartly preserves intact question boundaries (Q1, Q2, 1., 2., etc.) so
 * no original question in a question paper is ever cut in half or skipped.
 */

const MAX_CHUNK_SIZE = 2800;

/**
 * Split cleaned text into chunks while preserving question boundaries.
 *
 * @param {string} text  Cleaned document text.
 * @returns {string[]}   Array of text chunks.
 */
export function chunkText(text) {
  if (!text || typeof text !== 'string') return [];

  const trimmed = text.trim();
  if (trimmed.length <= MAX_CHUNK_SIZE) {
    return [trimmed];
  }

  // Detect if text contains numbered questions (e.g. "Q1.", "1.", "Question 1", "1)")
  const questionSplitRegex = /\n(?=(?:Q(?:uestion)?\s*\d+|\d+[\.\)]\s+))/i;

  let blocks = [];
  if (questionSplitRegex.test(trimmed)) {
    blocks = trimmed.split(questionSplitRegex).map((b) => b.trim()).filter(Boolean);
  } else {
    blocks = trimmed.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  }

  const chunks = [];
  let currentChunk = '';

  for (const block of blocks) {
    if ((currentChunk.length + block.length + 2) <= MAX_CHUNK_SIZE) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${block}` : block;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = block;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.length >= 30);
}
