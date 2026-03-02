import React, { useState, useCallback, useEffect, useRef } from 'react';
import { T, FONT } from '../lib/theme.js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase.js';
import { Btn, Inp } from '../components/ui.jsx';

export default function ResetPassword({ onBack }) {
  const [mode, setMode] = useState('request'); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Detect recovery session
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabase();
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) setMode('reset');
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('reset');
    });
    return () => subscription.unsubscribe();
  }, []);

  // Autofocus appropriate field
  useEffect(() => {
    if (mode === 'request') {
      setTimeout(() => emailRef.current?.querySelector('input')?.focus(), 200);
    } else {
      setTimeout(() => passwordRef.current?.querySelector('input')?.focus(), 200);
    }
  }, [mode]);

  // Handle request mode: send reset link
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    setError('');
    setInfo('');

    if (!isSupabaseConfigured()) {
      setInfo('Reset de mot de passe indisponible en mode d\u00e9mo');
      return;
    }

    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    setLoading(true);

    try {
      const sb = getSupabase();
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error: resetError } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        console.error('[reset-password]', resetError.message);
      }

      // Always show success message to avoid leaking account existence
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [email]);

  // Handle reset mode: update password
  const handleReset = useCallback(async (e) => {
    e?.preventDefault?.();
    setError('');
    setInfo('');

    if (!newPassword || newPassword.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caract\u00e8res');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const sb = getSupabase();
      const { error: updateError } = await sb.auth.updateUser({ password: newPassword });

      if (updateError) {
        setError(updateError.message || 'Une erreur est survenue');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [newPassword, confirmPassword]);

  const showDemoWarning = !isSupabaseConfigured();

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
            Espace client B2B &mdash; Pilotez votre activit&eacute;
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 16, padding: '28px 24px',
          boxShadow: '0 16px 48px rgba(0,0,0,.25)',
        }}>
          {mode === 'reset' ? (
            /* ─── Reset mode: new password form ─── */
            <>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 4px', textAlign: 'center' }}>
                Nouveau mot de passe
              </h2>
              <p style={{ fontSize: 11, color: T.textSecondary, textAlign: 'center', margin: '0 0 20px' }}>
                Choisissez un nouveau mot de passe pour votre compte
              </p>

              {success ? (
                <div>
                  <div style={{
                    padding: '14px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: T.greenBg, color: T.green, border: `1px solid ${T.green}22`,
                    textAlign: 'center', lineHeight: 1.5,
                  }}>
                    Mot de passe mis &agrave; jour avec succ&egrave;s. Vous pouvez vous connecter.
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button
                      onClick={onBack}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, color: T.accent, fontFamily: FONT,
                        textDecoration: 'underline', textUnderlineOffset: 2,
                      }}
                    >
                      {'\u2190'} Retour &agrave; la connexion
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div ref={passwordRef}>
                    <Inp
                      label="Nouveau mot de passe"
                      type="password"
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="Min. 6 caract\u00e8res"
                      autoComplete="new-password"
                    />
                  </div>

                  <Inp
                    label="Confirmer le mot de passe"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Retapez le mot de passe"
                    autoComplete="new-password"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleReset(); }}
                  />

                  {error && (
                    <div style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: T.redBg, color: T.red, border: `1px solid ${T.red}22`,
                    }}>
                      {error}
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
                    {loading ? 'Mise \u00e0 jour...' : 'Mettre \u00e0 jour le mot de passe'}
                  </Btn>
                </form>
              )}
            </>
          ) : (
            /* ─── Request mode: email form ─── */
            <>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 4px', textAlign: 'center' }}>
                Mot de passe oubli&eacute;
              </h2>
              <p style={{ fontSize: 11, color: T.textSecondary, textAlign: 'center', margin: '0 0 20px' }}>
                Entrez votre email pour recevoir un lien de r&eacute;initialisation
              </p>

              {success ? (
                <div>
                  <div style={{
                    padding: '14px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: T.greenBg, color: T.green, border: `1px solid ${T.green}22`,
                    textAlign: 'center', lineHeight: 1.5,
                  }}>
                    Si un compte existe avec cet email, vous recevrez un lien de r&eacute;initialisation.
                  </div>
                  <p style={{
                    fontSize: 11, color: T.textMuted, textAlign: 'center', marginTop: 14, marginBottom: 0,
                  }}>
                    V&eacute;rifiez votre bo&icirc;te de r&eacute;ception ainsi que vos spams.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Demo mode warning */}
                  {showDemoWarning && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: T.orangeBg, color: T.orange, border: `1px solid ${T.orange}22`,
                      textAlign: 'center',
                    }}>
                      Reset de mot de passe indisponible en mode d&eacute;mo
                    </div>
                  )}

                  <div ref={emailRef}>
                    <Inp
                      label="Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="vous@entreprise.fr"
                      autoComplete="email"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                    />
                  </div>

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
                      background: T.orangeBg, color: T.orange, border: `1px solid ${T.orange}22`,
                    }}>
                      {info}
                    </div>
                  )}

                  <Btn
                    type="submit"
                    disabled={loading || showDemoWarning}
                    full
                    style={{
                      marginTop: 4,
                      background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                      boxShadow: '0 2px 12px rgba(249,115,22,.3)',
                      opacity: (loading || showDemoWarning) ? 0.7 : 1,
                    }}
                  >
                    {loading ? 'Envoi en cours...' : 'Envoyer le lien de r\u00e9initialisation'}
                  </Btn>
                </form>
              )}
            </>
          )}

          {/* Back to login link */}
          {!(mode === 'reset' && success) && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={onBack}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, color: T.accent, fontFamily: FONT,
                  textDecoration: 'underline', textUnderlineOffset: 2,
                }}
              >
                {'\u2190'} Retour &agrave; la connexion
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontSize: 10, color: T.textMuted }}>
            En vous connectant, vous acceptez nos conditions d'utilisation
          </p>
        </div>
      </div>
    </div>
  );
}
