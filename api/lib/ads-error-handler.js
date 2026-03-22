import { apiLog } from '../_middleware.js';

/**
 * Generic error handler for ads API responses.
 * Logs the error and returns a standardized error response.
 */
export function handleAdsError(res, provider, action, error, statusCode = 500) {
  const message = error?.message || error?.error?.message || String(error);
  apiLog('error', { api: provider, action }, { error: message });
  return res.status(statusCode).json({ ok: false, error: message });
}

/**
 * Handle a non-ok fetch response from an ads API.
 * Reads the response body, logs it, and returns a standardized error.
 */
export async function handleAdsApiResponse(r, res, provider) {
  const text = await r.text();
  let message = `${provider} API error: ${r.status}`;
  try { const j = JSON.parse(text); message = j.error?.message || message; } catch {}
  apiLog('error', { api: provider }, { status: r.status, error: text.slice(0, 200) });
  return res.status(r.status).json({ ok: false, error: message });
}
