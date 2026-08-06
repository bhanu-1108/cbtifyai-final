/**
 * textCleaner.js — CBTifyAI-Final
 * ─────────────────────────────────────────────────────────────────────────────
 * Cleans raw OCR / PDF-extracted text before chunking and AI processing.
 *
 * Removes: page numbers, header/footer noise, OCR garbage characters,
 *          excessive whitespace, duplicate consecutive lines.
 * Normalises: line endings, spaces, paragraph boundaries.
 */

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

  // 2. Remove strange Unicode / OCR garbage
  text = text.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ''); // control chars
  text = text.replace(/[\uE000-\uF8FF]/g, '');                      // private-use area
  text = text.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');          // zero-width / soft hyphen
  text = text.replace(/[^\x20-\x7E\n\t\u00A0-\u024F]/g, ' ');      // non-Latin noise

  // 3. Remove page number lines
  text = text.replace(/^[\s\-–—]*(?:page|pg\.?|p\.?)?\s*\d+\s*(?:of\s*\d+)?[\s\-–—]*$/gim, '');

  // 4. Remove common header/footer boilerplate (ALL CAPS ≤ 60 chars, ≤ 5 words)
  text = text.replace(/^[A-Z0-9 \t\-–—:\.]{1,60}$/gm, (match) => {
    const wordCount = match.trim().split(/\s+/).length;
    return wordCount <= 5 ? '' : match;
  });

  // 5. Remove URLs and email addresses (OCR noise in footers)
  text = text.replace(/https?:\/\/\S+/gi, '');
  text = text.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '');

  // 6. Collapse multiple spaces on each line
  text = text.replace(/[ \t]+/g, ' ');

  // 7. Remove lines that are pure punctuation / noise
  text = text.replace(/^[\s\-–—_=\*\.#|~`]{0,80}$/gm, '');

  // 8. Remove duplicate consecutive lines
  const lines = text.split('\n');
  const deduped = lines.filter((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return true; // preserve blank lines for paragraph separation
    const prevTrimmed = idx > 0 ? lines[idx - 1].trim() : null;
    return trimmed !== prevTrimmed;
  });
  text = deduped.join('\n');

  // 9. Collapse 3+ blank lines → 2 blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  // 10. Trim
  text = text.trim();

  return text;
}
