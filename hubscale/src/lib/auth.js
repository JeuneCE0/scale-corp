// HubScale — Authentication Module
// Uses Supabase Auth when configured, falls back to localStorage for dev/demo mode.

import { getSupabase, isSupabaseConfigured } from './supabase.js';
import { setOrgId, restoreOrgId } from './db.js';
import { store } from './store.js';

const AUTH_KEY = 'hs_auth_session';
const USERS_KEY = 'hs_auth_users';

// ─── Event bus for auth state changes ───
const _listeners = new Set();
export function onAuthChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
function _emit(event, user) {
  _listeners.forEach((fn) => fn(event, user));
}

// ─── Supabase Auth ───

/** Fetch org plan/subscription from Supabase and sync to localStorage */
async function syncOrgPlan(sb, orgId) {
  try {
    const { data: org } = await sb.from('organizations').select('plan, stripe_subscription_id, trial_ends_at').eq('id', orgId).single();
    if (!org) return;
    store('plan', org.plan || 'starter');
    store('payment_method', !!org.stripe_subscription_id);
    if (org.trial_ends_at) {
      store('trial', { endsAt: org.trial_ends_at });
    }
  } catch (err) {
    console.warn('[auth] syncOrgPlan error:', err.message);
  }
}

async function supabaseSignup({ name, email, password }) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) return { ok: false, error: error.message };

  const user = data.user;
  if (!user) return { ok: false, error: 'Vérifiez votre email pour confirmer votre compte' };

  // If Supabase requires email confirmation, session will be null
  if (!data.session) {
    return { ok: false, error: 'Un email de vérification a été envoyé à votre adresse. Vérifiez votre boîte de réception pour confirmer votre compte.' };
  }

  // Create organization + profile on first signup
  const orgName = name.split(' ')[0] + "'s Organization";
  const { data: org, error: orgErr } = await sb.from('organizations').insert({ name: orgName }).select().single();
  if (orgErr) return { ok: false, error: 'Erreur création organisation: ' + orgErr.message };

  await sb.from('profiles').insert({
    id: user.id, org_id: org.id, full_name: name, email, role: 'owner',
  });
  await sb.from('user_preferences').insert({ user_id: user.id });

  setOrgId(org.id);
  store('plan', org.plan || 'starter');
  store('payment_method', false);

  // Send welcome email (fire-and-forget)
  fetch('/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` },
    body: JSON.stringify({ action: 'welcome', name, email }),
  }).catch(() => {});

  const profile = { id: user.id, name, email, avatar: null, createdAt: user.created_at, orgId: org.id, role: 'owner' };
  _emit('signin', profile);
  return { ok: true, user: profile };
}

async function supabaseLogin(email, password) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes('Email not confirmed')) return { ok: false, error: 'Votre email n\'a pas encore été confirmé. Vérifiez votre boîte de réception.' };
    if (error.message.includes('Invalid login')) return { ok: false, error: 'Email ou mot de passe incorrect' };
    return { ok: false, error: error.message };
  }

  const user = data.user;
  // Fetch profile to get org_id
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return { ok: false, error: 'Profil introuvable' };

  setOrgId(profile.org_id);
  await syncOrgPlan(sb, profile.org_id);

  const u = {
    id: user.id, name: profile.full_name, email: profile.email,
    avatar: profile.avatar_url, createdAt: user.created_at, orgId: profile.org_id, role: profile.role,
  };
  _emit('signin', u);
  return { ok: true, user: u };
}

async function supabaseLogout() {
  const sb = getSupabase();
  await sb.auth.signOut();
  setOrgId(null);
  store('plan', null);
  store('payment_method', null);
  store('trial', null);
  _emit('signout', null);
}

async function supabaseGetUser() {
  const sb = getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;

  const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
  if (!profile) return null;

  setOrgId(profile.org_id);
  await syncOrgPlan(sb, profile.org_id);

  return {
    id: session.user.id, name: profile.full_name, email: profile.email,
    avatar: profile.avatar_url, createdAt: session.user.created_at, orgId: profile.org_id, role: profile.role,
  };
}

async function supabaseUpdateProfile(updates) {
  const sb = getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return { ok: false, error: 'Non connecté' };

  const profileUpdates = {};
  if (updates.name) profileUpdates.full_name = updates.name;
  if (updates.avatar !== undefined) profileUpdates.avatar_url = updates.avatar;

  const { error } = await sb.from('profiles').update(profileUpdates).eq('id', session.user.id);
  if (error) return { ok: false, error: error.message };

  const user = await supabaseGetUser();
  _emit('profile_update', user);
  return { ok: true, user };
}

// ─── Local Auth (fallback for dev/demo when Supabase is not configured) ───

function hashPassword(password) {
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
  } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return session;
  } catch { return null; }
}

function saveSession(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

function localSignup({ name, email, password }) {
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
    role: 'owner',
  };

  users.push(user);
  saveUsers(users);

  const session = {
    token: generateToken(),
    userId: user.id,
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, createdAt: user.createdAt, role: user.role || 'owner' },
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  saveSession(session);
  _emit('signin', session.user);
  return { ok: true, user: session.user };
}

function localLogin(email, password) {
  if (!email || !password) return { ok: false, error: 'Email et mot de passe requis' };

  const users = getStoredUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) return { ok: false, error: 'Aucun compte trouvé avec cet email' };
  if (user.passwordHash !== hashPassword(password)) return { ok: false, error: 'Mot de passe incorrect' };

  const session = {
    token: generateToken(),
    userId: user.id,
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, createdAt: user.createdAt, role: user.role || 'owner' },
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  saveSession(session);
  _emit('signin', session.user);
  return { ok: true, user: session.user };
}

function localLogout() {
  localStorage.removeItem(AUTH_KEY);
  _emit('signout', null);
}

function localGetUser() {
  const session = getSession();
  return session ? session.user : null;
}

function localUpdateProfile(updates) {
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
  _emit('profile_update', session.user);
  return { ok: true, user: session.user };
}

function localIsAuthenticated() {
  return getSession() !== null;
}

// ─── Public API (unified interface) ───

/**
 * Sign up a new user.
 * Returns { ok: true, user } or { ok: false, error: string }
 */
export async function signup({ name, email, password }) {
  if (isSupabaseConfigured()) {
    return supabaseSignup({ name, email, password });
  }
  return localSignup({ name, email, password });
}

/**
 * Login with email and password.
 */
export async function login(email, password) {
  if (isSupabaseConfigured()) {
    return supabaseLogin(email, password);
  }
  return localLogin(email, password);
}

/**
 * Logout — clears session.
 */
export async function logout() {
  if (isSupabaseConfigured()) {
    return supabaseLogout();
  }
  return localLogout();
}

/**
 * Get the current authenticated user, or null.
 */
export async function getCurrentUser() {
  if (isSupabaseConfigured()) {
    return supabaseGetUser();
  }
  return localGetUser();
}

/**
 * Check if a user is currently authenticated.
 */
export function isAuthenticated() {
  if (isSupabaseConfigured()) {
    const sb = getSupabase();
    // Sync check — Supabase persists session in localStorage
    try {
      const key = 'hs_supabase_auth';
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const session = JSON.parse(raw);
      return !!(session?.access_token || session?.currentSession?.access_token);
    } catch { return false; }
  }
  return localIsAuthenticated();
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(updates) {
  if (isSupabaseConfigured()) {
    return supabaseUpdateProfile(updates);
  }
  return localUpdateProfile(updates);
}

/**
 * Get auth token for API calls.
 */
export async function getAuthToken() {
  if (isSupabaseConfigured()) {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    return session?.access_token || null;
  }
  const session = getSession();
  return session ? session.token : null;
}

/**
 * Seed a demo account if none exists (for dev/demo mode).
 */
export function ensureDemoAccount() {
  if (isSupabaseConfigured()) return; // Not needed with real auth
  const users = getStoredUsers();
  if (users.length === 0) {
    const demo = {
      id: 'demo_user_001',
      name: 'Admin Demo',
      email: 'demo@hubscale.fr',
      passwordHash: hashPassword('demo123'),
      createdAt: new Date().toISOString(),
      avatar: null,
      role: 'super_admin',
    };
    saveUsers([demo]);
  }
}

/**
 * Initialize auth — restore session, listen for changes.
 * Call once at app startup.
 */
export async function initAuth() {
  if (isSupabaseConfigured()) {
    const sb = getSupabase();
    // Restore org_id from cache
    restoreOrgId();

    // Listen for auth state changes
    sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const user = await supabaseGetUser();
        _emit('signin', user);
      } else if (event === 'SIGNED_OUT') {
        setOrgId(null);
        _emit('signout', null);
      } else if (event === 'PASSWORD_RECOVERY' && session) {
        _emit('password_recovery', { session });
      } else if (event === 'TOKEN_REFRESHED') {
        // Token auto-refreshed, nothing to do
      }
    });

    return supabaseGetUser();
  }
  return localGetUser();
}
