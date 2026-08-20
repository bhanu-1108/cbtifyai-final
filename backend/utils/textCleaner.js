/**
 * textCleaner.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * High-performance text cleaner & boilerplate remover.
 * Cleans raw OCR / PDF text before chunking and AI processing.
 *
 * Optimizations:
 *   - Fast single-pass normalization
 *   - Preserves all math symbols, numbers, and Greek formulas
 *   - Strips repetitive header/footer noise, page numbers, duplicate lines
 *   - Caps raw input to a high-yield maximum (24,000 chars) to prevent model token bloat
 */

const MAX_CLEANED_TEXT_LENGTH = 16_000;

/**
 * Clean raw text extracted from a document.
 *
 * @param {string} rawText  The unprocessed OCR or PDF text.
 * @returns {string}        Cleaned, normalised text ready for chunking.
 */
export function cleanText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Normalise Windows / mixed line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Remove strange control characters while strictly PRESERVING all mathematical symbols, numbers, and Greek letters
  text = text.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ''); // control chars
  text = text.replace(/[\uE000-\uF8FF]/g, '');                      // private-use area
  text = text.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');          // zero-width / soft hyphen

  // Keep ASCII (numbers, math ops =+-*/^%<>[]{}()|~`), Latin Extended, Greek (\u0370-\u03FF), 
  // Superscripts/Subscripts (\u2070-\u209F), Math Operators (\u2200-\u22FF), Arrows (\u2190-\u21FF), Fractions (\u2150-\u218F), Degree/Currency (\u00A0-\u00FF)
  text = text.replace(/[^\x20-\x7E\n\t\u00A0-\u024F\u0370-\u03FF\u2070-\u209F\u2100-\u214F\u2150-\u218F\u2190-\u21FF\u2200-\u22FF\u2A00-\u2AFF]/g, ' ');

  // 3. Remove page number lines (e.g. "Page 1 of 12", "pg. 4", "- 3 -")
  text = text.replace(/^[\s\-–—]*(?:page|pg\.?|p\.?)?\s*\d+\s*(?:of\s*\d+)?[\s\-–—]*$/gim, '');

  // 4. Remove URLs and email addresses (OCR noise in footers)
  text = text.replace(/https?:\/\/\S+/gi, '');
  text = text.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '');

  // 5. Remove repetitive lines that are pure punctuation / noise
  text = text.replace(/^[\s\-–—_=\*\.#|~`]{0,80}$/gm, '');

  // 6. Deduplicate consecutive identical lines
  const lines = text.split('\n');
  const deduped = [];
  let lastLine = '';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      if (deduped.length > 0 && deduped[deduped.length - 1] !== '') {
        deduped.push('');
      }
      continue;
    }
    if (trimmed !== lastLine) {
      deduped.push(trimmed);
      lastLine = trimmed;
    }
  }

  text = deduped.join('\n');

  // 7. Collapse multiple spaces and blank lines
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  // 8. Cap maximum input size to prevent massive token overhead
  if (text.length > MAX_CLEANED_TEXT_LENGTH) {
    text = text.slice(0, MAX_CLEANED_TEXT_LENGTH).trim();
  }

  return text;
}
