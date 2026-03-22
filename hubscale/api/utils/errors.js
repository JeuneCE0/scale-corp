// HubScale — Shared API Error Response Helpers

const ALLOWED_ORIGINS = new Set([
  process.env.VITE_APP_URL || 'https://hubscale.app',
  'https://hubscale.app',
]);

// Allow localhost in development
if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') {
  ALLOWED_ORIGINS.add('http://localhost:5173');
  ALLOWED_ORIGINS.add('http://localhost:3000');
}

export function cors(res, methods = 'GET, POST, OPTIONS', req) {
  // If req is provided, validate origin; otherwise use configured APP_URL
  const origin = req?.headers?.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', process.env.VITE_APP_URL || 'https://hubscale.app');
  }
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export function apiError(res, status, message) {
  return res.status(status).json({ error: message });
}

export function unauthorized(res) {
  return apiError(res, 401, 'Non autorisé');
}

export function forbidden(res, message = 'Accès refusé') {
  return apiError(res, 403, message);
}

export function badRequest(res, message = 'Requête invalide') {
  return apiError(res, 400, message);
}

export function notFound(res, message = 'Ressource introuvable') {
  return apiError(res, 404, message);
}

export function methodNotAllowed(res) {
  return apiError(res, 405, 'Method not allowed');
}

export function tooManyRequests(res) {
  return apiError(res, 429, 'Trop de requêtes. Réessayez dans quelques instants.');
}

export function serverError(res) {
  return apiError(res, 500, 'Erreur serveur');
}
