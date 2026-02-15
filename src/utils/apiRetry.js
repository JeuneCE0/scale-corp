/**
 * API retry with exponential backoff + error handling
 */

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000; // 1s

/**
 * Fetch with automatic retry and exponential backoff
 */
export async function fetchWithRetry(url, options = {}, { maxRetries = DEFAULT_MAX_RETRIES, baseDelay = DEFAULT_BASE_DELAY } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      // Don't retry on 4xx (client errors) except 429 (rate limit)
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          const data = await response.json().catch(() => ({}));
          throw new ApiError(data.error || `HTTP ${response.status}`, response.status, false);
        }
        // 5xx or 429 → retry
        throw new ApiError(`HTTP ${response.status}`, response.status, true);
      }
      
      return await response.json();
    } catch (err) {
      lastError = err;
      
      // Don't retry if explicitly non-retryable
      if (err instanceof ApiError && !err.retryable) throw err;
      
      // Don't retry aborted requests (timeout) on last attempt
      if (attempt === maxRetries) break;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  throw lastError || new ApiError('Request failed after retries', 0, false);
}

export class ApiError extends Error {
  constructor(message, status = 0, retryable = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryable = retryable;
  }
}

/**
 * Friendly error messages for display
 */
export function getApiErrorMessage(err, service = 'API') {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Session expirée. Reconnectez-vous.';
    if (err.status === 403) return 'Accès non autorisé à cette ressource.';
    if (err.status === 429) return `${service} : trop de requêtes. Réessayez dans quelques secondes.`;
    if (err.status >= 500) return `${service} est temporairement indisponible.`;
    return err.message;
  }
  if (err?.name === 'AbortError') return `${service} : la requête a expiré.`;
  if (!navigator.onLine) return 'Pas de connexion internet.';
  return `${service} : erreur de connexion.`;
}
