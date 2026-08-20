/**
 * validatorService.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates, sanitises, and auto-repairs CBT question objects.
 * Automatically cleans options prefixes ("A. ", "B. "), removes "Answer: B"
 * from question titles, and maps answer letters (A, B, C, D) to exact option text.
 */

const VALID_DIFFICULTIES = new Set(['Easy', 'Medium', 'Hard']);
const VALID_BLOOM_LEVELS = new Set([
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
]);

/**
 * Clean, repair, and validate question objects.
 *
 * @param {any[]} questions  Raw array from the AI model.
 * @returns {{ valid: object[], errors: string[] }}
 */
export function validateQuestions(questions) {
  if (!Array.isArray(questions)) {
    return { valid: [], errors: ['Input is not an array of questions.'] };
  }

  const valid = [];
  const errors = [];
  const seenQuestions = new Set();

  questions.forEach((q, idx) => {
    const label = `Question[${idx + 1}]`;

    if (typeof q !== 'object' || q === null) {
      errors.push(`${label}: not an object — skipped.`);
      return;
    }

    let questionText = (q.question || '').trim();
    if (!questionText) {
      errors.push(`${label}: "question" text is missing.`);
      return;
    }

    // 1. Clean Question Text: Remove trailing options (A. ... B. ...) or "Answer: X"
    questionText = questionText
      .replace(/\s+[A-D][\.\)]\s+.*$/i, '')
      .replace(/\s*Answer\s*:\s*[A-D].*$/i, '')
      .replace(/^(?:Q(?:uestion)?\s*\d+[\.\)]?|\d+[\.\)])\s*/i, '') // strip "1. " or "Q1."
      .trim();

    if (!questionText) {
      errors.push(`${label}: "question" text empty after cleaning.`);
      return;
    }

    // 2. Clean Options: Strip "A. ", "B. ", "a) ", "1. " prefixes
    let rawOptions = Array.isArray(q.options)
      ? q.options.map((o) => cleanOptionString(o)).filter(Boolean)
      : [];

    if (rawOptions.length < 4) {
      const defaultChoices = ['True', 'False', 'Both A and B', 'None of the above'];
      while (rawOptions.length < 4) {
        const fill = defaultChoices[rawOptions.length] || `Option ${rawOptions.length + 1}`;
        if (!rawOptions.includes(fill)) rawOptions.push(fill);
        else rawOptions.push(`Option ${rawOptions.length + 1}`);
      }
    } else if (rawOptions.length > 4) {
      rawOptions = rawOptions.slice(0, 4);
    }

    // 3. Clean & Resolve Correct Answer
    let corrAns = (q.correctAnswer || '').trim();
    corrAns = cleanOptionString(corrAns);

    // If answer is letter label ("A", "B", "C", "D", "Answer: B", "Option B")
    const letterMatch = corrAns.match(/^(?:Answer\s*:\s*|Option\s*)?([A-D])[\.\)]?$/i);
    if (letterMatch) {
      const letterIndex = letterMatch[1].toUpperCase().charCodeAt(0) - 65; // A->0, B->1, C->2, D->3
      if (rawOptions[letterIndex]) {
        corrAns = rawOptions[letterIndex];
      }
    }

    // Match with cleaned options
    let exactMatch = rawOptions.find((o) => o === corrAns);
    if (!exactMatch) {
      exactMatch =
        rawOptions.find((o) => o.toLowerCase() === corrAns.toLowerCase()) ||
        rawOptions.find((o) => corrAns.toLowerCase().includes(o.toLowerCase())) ||
        rawOptions[0]; // fallback
    }
    corrAns = exactMatch;

    // 4. Default Metadata
    let difficulty = q.difficulty;
    if (!VALID_DIFFICULTIES.has(difficulty)) {
      difficulty = 'Medium';
    }

    let topic = (q.topic || 'General').trim();

    let bloomLevel = q.bloomLevel;
    if (!VALID_BLOOM_LEVELS.has(bloomLevel)) {
      bloomLevel = 'Understand';
    }

    const questionKey = questionText.toLowerCase();
    if (seenQuestions.has(questionKey)) {
      errors.push(`${label}: duplicate question — skipped.`);
      return;
    }

    seenQuestions.add(questionKey);
    valid.push({
      question: questionText,
      options: rawOptions,
      correctAnswer: corrAns,
      difficulty,
      topic,
      bloomLevel,
    });
  });

  return { valid, errors };
}

/**
 * Remove option letter prefixes like "A. ", "B. ", "(A) ", "(1) " from option strings
 * while strictly protecting decimal numbers (e.g. 1.5, 3.14), negative numbers (-4), and equations.
 */
function cleanOptionString(str) {
  if (typeof str !== 'string') return '';
  let cleaned = str.trim();

  // Strip leading "Answer: " or "Ans: "
  cleaned = cleaned.replace(/^(?:Answer|Ans)\s*:\s*/i, '');

  // Strip "(A)", "(B)", "(C)", "(D)", "(1)", "(2)", "(3)", "(4)"
  cleaned = cleaned.replace(/^\(([A-Da-d1-4])\)\s*/, '');

  // Strip "A. ", "B. ", "C. ", "D. ", "a) ", "b) " (strictly requiring a letter OR a number followed by closing parenthesis or whitespace that is NOT a decimal digit)
  cleaned = cleaned.replace(/^[A-Da-d][\.\)]\s+/, '');
  cleaned = cleaned.replace(/^[1-4]\)\s+/, ''); // only "1) ", not "1.5"
  cleaned = cleaned.replace(/^[1-4]\.\s+(?=[^\d]|$)/, ''); // only "1. Text", not "1.5"

  return cleaned.trim();
}
