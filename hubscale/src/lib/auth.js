// HubScale — Authentication Module (local-first, backend-ready)

const AUTH_KEY = 'hs_auth_session';
const USERS_KEY = 'hs_auth_users';

// --- Helpers ---

function hashPassword(password) {
  // Simple hash for local storage (NOT for production — use bcrypt on a real server)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const ch = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Check expiry (30 days)
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

// --- Public API ---

/**
 * Sign up a new user
 * @returns {{ ok: true, user: object } | { ok: false, error: string }}
 */
export function signup({ name, email, password }) {
  if (!name || !name.trim()) return { ok: false, error: 'Le nom est requis' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Email invalide' };
  if (!password || password.length < 6) return { ok: false, error: 'Le mot de passe doit faire au moins 6 caractères' };

  const users = getStoredUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: 'Un compte existe déjà avec cet email' };
  }

  const user = {
    id: generateToken().slice(0, 12),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    avatar: null,
  };

  users.push(user);
  saveUsers(users);

  const session = {
    token: generateToken(),
    userId: user.id,
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, createdAt: user.createdAt },
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  saveSession(session);

  return { ok: true, user: session.user };
}

/**
 * Login with email and password
 * @returns {{ ok: true, user: object } | { ok: false, error: string }}
 */
export function login(email, password) {
  if (!email || !password) return { ok: false, error: 'Email et mot de passe requis' };

  const users = getStoredUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) return { ok: false, error: 'Aucun compte trouvé avec cet email' };
  if (user.passwordHash !== hashPassword(password)) return { ok: false, error: 'Mot de passe incorrect' };

  const session = {
    token: generateToken(),
    userId: user.id,
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, createdAt: user.createdAt },
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  saveSession(session);

  return { ok: true, user: session.user };
}

/**
 * Logout - clears the current session
 */
export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Get the current authenticated user, or null
 */
export function getCurrentUser() {
  const session = getSession();
  return session ? session.user : null;
}

/**
 * Check if a user is currently authenticated
 */
export function isAuthenticated() {
  return getSession() !== null;
}

/**
 * Update the current user's profile
 */
export function updateProfile(updates) {
  const session = getSession();
  if (!session) return { ok: false, error: 'Non connecté' };

  const users = getStoredUsers();
  const idx = users.findIndex((u) => u.id === session.userId);
  if (idx === -1) return { ok: false, error: 'Utilisateur introuvable' };

  if (updates.name) users[idx].name = updates.name.trim();
  if (updates.avatar !== undefined) users[idx].avatar = updates.avatar;
  saveUsers(users);

  session.user = { ...session.user, ...updates };
  saveSession(session);

  return { ok: true, user: session.user };
}

/**
 * Get auth token for API calls
 */
export function getAuthToken() {
  const session = getSession();
  return session ? session.token : null;
}

/**
 * Seed a demo account if none exists (for first launch)
 */
export function ensureDemoAccount() {
  const users = getStoredUsers();
  if (users.length === 0) {
    const demo = {
      id: 'demo_user_001',
      name: 'Admin Demo',
      email: 'demo@hubscale.fr',
      passwordHash: hashPassword('demo123'),
      createdAt: new Date().toISOString(),
      avatar: null,
    };
    saveUsers([demo]);
  }
}
