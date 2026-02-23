// HubScale — Input Sanitization Utilities
// Pure functions, zero dependencies.  Suitable for both client and server use.

/**
 * Strip HTML tags, trim whitespace and enforce a maximum length.
 *
 * @param {string} str
 * @param {number} [maxLen=1000]
 * @returns {string}
 */
export function sanitizeText(str, maxLen = 1000) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

/**
 * Normalise and validate an email address.
 * Returns the cleaned email or an empty string when the format is invalid.
 *
 * @param {string} str
 * @returns {string}
 */
export function sanitizeEmail(str) {
  if (typeof str !== 'string') return '';
  const cleaned = str.toLowerCase().trim();
  // Simple but practical email regex — intentionally not RFC-5322 exhaustive.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return EMAIL_RE.test(cleaned) ? cleaned : '';
}

/**
 * Keep only characters that are valid in phone numbers:
 * digits, +, spaces, parentheses and dashes.
 *
 * @param {string} str
 * @returns {string}
 */
export function sanitizePhone(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[^\d+\s()-]/g, '').trim();
}

/**
 * Validate a URL string.  Only `http://` and `https://` schemes are allowed.
 * Returns the trimmed URL or an empty string when the value is unsafe.
 *
 * @param {string} str
 * @returns {string}
 */
export function sanitizeUrl(str) {
  if (typeof str !== 'string') return '';
  const trimmed = str.trim();

  // Block javascript: and data: URIs regardless of casing / whitespace tricks.
  if (/^\s*javascript\s*:/i.test(trimmed)) return '';
  if (/^\s*data\s*:/i.test(trimmed)) return '';

  // Must begin with http:// or https://
  if (!/^https?:\/\//i.test(trimmed)) return '';

  return trimmed;
}

/**
 * Parse a value as a number and clamp it between `min` and `max`.
 * Returns `NaN` when the value cannot be converted to a finite number.
 *
 * @param {*} val
 * @param {number} [min=-Infinity]
 * @param {number} [max=Infinity]
 * @returns {number}
 */
export function sanitizeNumber(val, min = -Infinity, max = Infinity) {
  const num = Number(val);
  if (!Number.isFinite(num)) return NaN;
  return Math.min(Math.max(num, min), max);
}

/**
 * Escape the five characters that are meaningful in HTML so that the string
 * can be safely interpolated into markup.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Remove common XSS vectors from an HTML string:
 * - `<script>` blocks (including their content)
 * - Inline event-handler attributes (`on*="…"`)
 * - `javascript:` URLs inside attribute values
 *
 * This is a defence-in-depth helper — prefer `escapeHtml` when outputting
 * user-supplied text.  `stripXSS` is useful when you need to keep *some*
 * HTML (e.g. from a rich-text editor) but remove dangerous patterns.
 *
 * @param {string} str
 * @returns {string}
 */
export function stripXSS(str) {
  if (typeof str !== 'string') return '';
  return str
    // Remove <script> … </script> blocks (case-insensitive, multiline).
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    // Remove standalone <script> tags that may not have a closing pair.
    .replace(/<script\b[^>]*\/?>/gi, '')
    // Remove on* event-handler attributes (onclick, onerror, etc.).
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove javascript: URLs inside attributes.
    .replace(/javascript\s*:/gi, '');
}
