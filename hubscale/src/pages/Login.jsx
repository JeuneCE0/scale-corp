import React, { useState, useCallback, useEffect, useRef } from 'react';
import { T, FONT } from '../lib/theme.js';
import { login, signup, ensureDemoAccount } from '../lib/auth.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { Btn, Inp } from '../components/ui.jsx';

export default function Login({ onAuth, initialMode, onBack, onForgotPassword }) {
  const [mode, setMode] = useState(initialMode || 'login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [info, setInfo] = useState('');
  const emailRef = useRef(null);

  // Ensure demo account exists on mount (only in local mode)
  useEffect(() => { ensureDemoAccount().catch(() => {}); }, []);

  // Autofocus email field
  useEffect(() => {
    setTimeout(() => emailRef.current?.querySelector('input')?.focus(), 200);
  }, [mode]);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      let result;
      if (mode === 'signup') {
        result = await signup({ name, email, password });
      } else {
        result = await login(email, password);
      }

      if (result.ok) {
        onAuth(result.user);
      } else {
        setError(result.error);
        // Check if it's an email verification message
        if (result.error.includes('email') || result.error.includes('Vérifiez')) {
          setInfo(result.error);
          setError('');
        }
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [mode, name, email, password, onAuth]);

  const fillDemo = useCallback(() => {
    setEmail('demo@hubscale.fr');
    setPassword('demo123');
    setError('');
  }, []);

  const toggleMode = useCallback(() => {
    setMode((m) => m === 'login' ? 'signup' : 'login');
    setError('');
    setInfo('');
    setName('');
    setEmail('');
    setPassword('');
  }, []);

  const showDemoSection = !isSupabaseConfigured();

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, fontFamily: FONT,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      {/* Subtle background gradient */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 30% 20%, rgba(249,115,22,.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(99,102,241,.05) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div className="scale-in" style={{
        position: 'relative', zIndex: 1,
        width: 420, maxWidth: '100%',
      }}>
        {/* Logo + branding */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #f97316, #f59e0b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 26, color: '#fff',
            boxShadow: '0 8px 32px rgba(249,115,22,.25)',
          }}>H</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 4px' }}>
            HubScale
          </h1>
          <p style={{ fontSize: 12, color: T.textSecondary, margin: 0 }}>
            Espace client B2B — Pilotez votre activité
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 16, padding: '28px 24px',
          boxShadow: '0 16px 48px rgba(0,0,0,.25)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 4px', textAlign: 'center' }}>
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p style={{ fontSize: 11, color: T.textSecondary, textAlign: 'center', margin: '0 0 20px' }}>
            {mode === 'login'
              ? 'Connectez-vous à votre espace client'
              : 'Remplissez les informations pour créer votre compte'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'signup' && (
              <Inp
                label="Nom complet"
                value={name}
                onChange={setName}
                placeholder="Jean Dupont"
                autoComplete="name"
              />
            )}

            <div ref={emailRef}>
              <Inp
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="vous@entreprise.fr"
                autoComplete="email"
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Inp
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder={mode === 'signup' ? 'Min. 6 caractères' : '••••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={{
                  position: 'absolute', right: 10, top: 28, background: 'none',
                  border: 'none', cursor: 'pointer', fontSize: 12, color: T.textMuted,
                  fontFamily: FONT, padding: '2px 4px',
                }}
              >
                {showPassword ? 'Masquer' : 'Voir'}
              </button>
            </div>

            {mode === 'login' && onForgotPassword && (
              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: T.accent, fontFamily: FONT,
                    padding: 0, textDecoration: 'underline', textUnderlineOffset: 2,
                  }}
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {error && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: T.redBg, color: T.red, border: `1px solid ${T.red}22`,
              }}>
                {error}
              </div>
            )}

            {info && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: T.accentBg, color: T.accent, border: `1px solid ${T.accent}22`,
              }}>
                {info}
              </div>
            )}

            <Btn
              type="submit"
              disabled={loading}
              full
              style={{
                marginTop: 4,
                background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                boxShadow: '0 2px 12px rgba(249,115,22,.3)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? (mode === 'login' ? 'Connexion...' : 'Création...')
                : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
            </Btn>
          </form>

          {/* Demo credentials (only in local/dev mode) */}
          {showDemoSection && mode === 'login' && (
            <div style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 8,
              background: T.surface2, border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>
                Compte démo
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>
                    <strong style={{ color: T.text }}>demo@hubscale.fr</strong> / <strong style={{ color: T.text }}>demo123</strong>
                  </div>
                </div>
                <button
                  onClick={fillDemo}
                  style={{
                    background: T.accentBg, border: `1px solid ${T.accent}33`,
                    borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                    fontSize: 10, fontWeight: 700, color: T.accent, fontFamily: FONT,
                  }}
                >
                  Remplir
                </button>
              </div>
            </div>
          )}

          {/* Toggle mode */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 12, color: T.textSecondary }}>
              {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
            </span>{' '}
            <button
              onClick={toggleMode}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: T.accent, fontFamily: FONT,
                textDecoration: 'underline', textUnderlineOffset: 2,
              }}
            >
              {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: T.textMuted, fontFamily: FONT,
                marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              {'\u2190'} Retour au site
            </button>
          )}
          <p style={{ fontSize: 10, color: T.textMuted }}>
            En vous connectant, vous acceptez nos conditions d'utilisation
          </p>
        </div>
      </div>
    </div>
  );
}
