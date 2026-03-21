// HubScale — Shared API Error Response Helpers

export function cors(res, methods = 'GET, POST, OPTIONS') {
  const APP_URL = process.env.VITE_APP_URL || 'https://hubscale.app';
  res.setHeader('Access-Control-Allow-Origin', APP_URL);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

export function serverError(res) {
  return apiError(res, 500, 'Erreur serveur');
}
