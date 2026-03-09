import React, { useState, useCallback, useEffect, useRef } from 'react';
import { T, FONT } from '../lib/theme.js';
import { signup, ensureDemoAccount } from '../lib/auth.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { createCheckoutSession } from '../lib/api.js';
import { store, load } from '../lib/store.js';
import { PLANS } from '../lib/constants.js';
import { Btn, Inp } from '../components/ui.jsx';

// ─── Card formatting helpers ───────────────────────────────────────────────
function formatCardNumber(v) {
  const digits = v.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v) {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}
function detectCardBrand(num) {
  const d = num.replace(/\D/g, '');
  if (/^4/.test(d)) return { brand: 'Visa', color: '#1a1f71' };
  if (/^5[1-5]/.test(d)) return { brand: 'Mastercard', color: '#eb001b' };
  if (/^3[47]/.test(d)) return { brand: 'Amex', color: '#006fcf' };
  return null;
}

const GRAD = 'linear-gradient(135deg, #f97316, #f59e0b)';

// ─── Step indicator ────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Forfait', 'Compte', 'Paiement'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 13, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, fontFamily: FONT,
              background: i < current ? T.green : i === current ? GRAD : T.surface2,
              color: i <= current ? '#fff' : T.textMuted,
              border: i > current ? `1px solid ${T.border}` : 'none',
              transition: 'all .3s ease',
            }}>
              {i < current ? '\u2713' : i + 1}
            </div>
            <span style={{
              fontSize: 11, fontWeight: i === current ? 700 : 500,
              color: i === current ? T.text : T.textMuted,
            }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 32, height: 1, margin: '0 8px',
              background: i < current ? T.green : T.border,
              transition: 'background .3s ease',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main Checkout Component ───────────────────────────────────────────────
export default function Checkout({ onAuth, onBack, preselectedPlan }) {
  const [step, setStep] = useState(preselectedPlan ? 1 : 0); // 0=plan, 1=account, 2=payment
  const [selectedPlan, setSelectedPlan] = useState(preselectedPlan || 'professional');
  const [annual, setAnnual] = useState(true);

  // Account fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Payment fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const cardRef = useRef(null);

  useEffect(() => { ensureDemoAccount(); }, []);

  // Focus first field on step change
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => cardRef.current?.querySelector('input')?.focus(), 200);
    }
  }, [step]);

  const plan = PLANS.find((p) => p.id === selectedPlan) || PLANS[1];
  const price = annual ? Math.round(plan.monthly * 0.8) : plan.monthly;
  const cardBrand = detectCardBrand(cardNumber);

  // ─── Step 0: Plan selection ──────────────────────────────────────────
  const handlePlanSelect = useCallback((id) => {
    setSelectedPlan(id);
    setError('');
  }, []);

  const goToAccount = useCallback(() => {
    setStep(1);
    setError('');
  }, []);

  // ─── Step 1: Account validation ──────────────────────────────────────
  const goToPayment = useCallback(() => {
    if (!name.trim()) { setError('Le nom est requis'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email invalide'); return; }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return; }
    setError('');
    setStep(2);
  }, [name, email, password]);

  // ─── Step 2: Stripe Checkout (when Supabase is configured) ─────────
  const handleStripeCheckout = useCallback(async () => {
    setError('');
    setLoading(true);
    setProcessing(true);

    try {
      // Create account first
      const authResult = await signup({ name, email, password });
      if (!authResult.ok) {
        setLoading(false);
        setProcessing(false);
        setError(authResult.error);
        return;
      }

      // Persist referral attribution if user came via /r/ link
      const refSlug = load('ref_slug');
      if (refSlug) {
        store('referred_by', { slug: refSlug, signedUpAt: new Date().toISOString() });
      }

      // Create Stripe Checkout session with timeout protection (10s)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Le serveur de paiement ne répond pas. Veuillez réessayer.')), 10000)
      );
      const result = await Promise.race([
        createCheckoutSession(selectedPlan),
        timeoutPromise,
      ]);
      window.location.href = result.url;
    } catch (err) {
      setLoading(false);
      setProcessing(false);
      setError(err.message || 'Erreur lors de la création de la session de paiement. Veuillez réessayer.');
    }
  }, [name, email, password, selectedPlan]);

  // ─── Step 2: Demo payment validation & submit (local mode) ────────
  const handleSubmit = useCallback(async () => {
    const digits = cardNumber.replace(/\D/g, '');
    if (!cardName.trim()) { setError('Le nom sur la carte est requis'); return; }
    if (digits.length < 15) { setError('Numéro de carte invalide'); return; }
    const exp = cardExpiry.replace(/\D/g, '');
    if (exp.length < 4) { setError('Date d\'expiration invalide'); return; }
    const expMonth = parseInt(exp.slice(0, 2), 10);
    const expYear = parseInt('20' + exp.slice(2), 10);
    const now = new Date();
    if (expMonth < 1 || expMonth > 12 || expYear < now.getFullYear() ||
        (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
      setError('Carte expirée'); return;
    }
    if (cardCvc.replace(/\D/g, '').length < 3) { setError('CVC invalide'); return; }

    setError('');
    setLoading(true);
    setProcessing(true);

    try {
      // Step 1: Create account first — abort if this fails
      const result = await signup({ name, email, password });
      if (!result.ok) {
        setLoading(false);
        setProcessing(false);
        setError(result.error);
        return;
      }

      // Step 2: Simulate payment processing (only after successful account creation)
      await new Promise((resolve) => setTimeout(resolve, 1800));

      // Store plan & payment info
      store('plan', selectedPlan);
      store('billing_annual', annual);
      store('payment_method', {
        brand: cardBrand?.brand || 'Card',
        last4: digits.slice(-4),
        expiry: cardExpiry,
        name: cardName,
        addedAt: new Date().toISOString(),
      });
      store('trial', {
        startedAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
        plan: selectedPlan,
      });

      // Persist referral attribution if user came via /r/ link
      const refSlug = load('ref_slug');
      if (refSlug) {
        store('referred_by', { slug: refSlug, signedUpAt: new Date().toISOString() });
      }

      setLoading(false);
      setSuccessMsg('Paiement réussi ! Redirection...');
      setTimeout(() => {
        setProcessing(false);
        setSuccessMsg('');
        onAuth(result.user);
      }, 1200);
    } catch (err) {
      setLoading(false);
      setProcessing(false);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    }
  }, [cardName, cardNumber, cardExpiry, cardCvc, name, email, password, selectedPlan, annual, cardBrand, onAuth]);

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, fontFamily: FONT,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      {/* BG */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 30% 20%, rgba(249,115,22,.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(99,102,241,.05) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: 560, maxWidth: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px',
            background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 22, color: '#fff',
            boxShadow: '0 8px 32px rgba(249,115,22,.25)',
          }}>H</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>
            Démarrer votre essai gratuit
          </h1>
          <p style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>
            14 jours gratuits, sans engagement. Annulez quand vous voulez.
          </p>
        </div>

        <Steps current={step} />

        {/* Processing overlay */}
        {processing && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(9,9,11,.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            {successMsg ? (
              <>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: T.greenBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, border: `2px solid ${T.green}`,
                }}>
                  <span style={{ fontSize: 22, color: T.green }}>{'\u2713'}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.green }}>{successMsg}</div>
              </>
            ) : (
              <>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', border: `3px solid ${T.border}`,
                  borderTopColor: '#f97316', animation: 'spin 0.8s linear infinite', marginBottom: 16,
                }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Traitement en cours...</div>
                <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>
                  Vérification et activation de votre compte
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════ STEP 0: Plan selection ════════════ */}
        {step === 0 && (
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 16, padding: '24px 20px',
            boxShadow: '0 16px 48px rgba(0,0,0,.25)',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 4px', textAlign: 'center' }}>
              Choisissez votre forfait
            </h2>
            <p style={{ fontSize: 11, color: T.textSecondary, textAlign: 'center', margin: '0 0 16px' }}>
              Vous ne serez débité qu'après les 14 jours d'essai
            </p>

            {/* Annual toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: annual ? 500 : 700, color: annual ? T.textMuted : T.text }}>Mensuel</span>
              <div onClick={() => setAnnual((a) => !a)} style={{
                width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative',
                background: annual ? GRAD : T.surface2, border: annual ? 'none' : `1px solid ${T.border}`,
                transition: 'all .2s ease',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 8, background: '#fff',
                  position: 'absolute', top: 3, left: annual ? 20 : 3,
                  transition: 'left .2s ease', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: annual ? 700 : 500, color: annual ? T.text : T.textMuted }}>Annuel</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: T.green, background: T.greenBg, padding: '2px 6px', borderRadius: 4 }}>-20%</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {PLANS.map((p) => {
                const pr = annual ? Math.round(p.monthly * 0.8) : p.monthly;
                const selected = selectedPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handlePlanSelect(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                      background: selected ? T.accentBg : T.surface2,
                      border: `2px solid ${selected ? '#f97316' : T.border}`,
                      transition: 'all .2s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Radio */}
                    <div style={{
                      width: 18, height: 18, borderRadius: 9, flexShrink: 0,
                      border: `2px solid ${selected ? '#f97316' : T.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .2s ease',
                    }}>
                      {selected && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#f97316' }} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{p.name}</span>
                        {p.recommended && (
                          <span style={{
                            fontSize: 8, fontWeight: 800, color: '#fff', padding: '2px 6px',
                            borderRadius: 4, background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            textTransform: 'uppercase', letterSpacing: .3,
                          }}>Populaire</span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 2 }}>
                        {p.features.slice(0, 3).join(' \u00b7 ')}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>{pr}<span style={{ fontSize: 11, fontWeight: 500, color: T.textMuted }}>\u20ac</span></div>
                      <div style={{ fontSize: 9, color: T.textMuted }}>/mois</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Btn full onClick={goToAccount} style={{ background: GRAD, boxShadow: '0 2px 12px rgba(249,115,22,.3)' }}>
              Continuer avec {plan.name}
            </Btn>
          </div>
        )}

        {/* ════════════ STEP 1: Account ════════════ */}
        {step === 1 && (
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 16, padding: '24px 20px',
            boxShadow: '0 16px 48px rgba(0,0,0,.25)',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 4px', textAlign: 'center' }}>
              Créez votre compte
            </h2>
            <p style={{ fontSize: 11, color: T.textSecondary, textAlign: 'center', margin: '0 0 18px' }}>
              Informations de connexion pour votre espace client
            </p>

            {/* Plan summary */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 10, background: T.surface2,
              border: `1px solid ${T.border}`, marginBottom: 16,
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Plan {plan.name}</div>
                <div style={{ fontSize: 10, color: T.textSecondary }}>14 jours d'essai gratuit</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{price}<span style={{ fontSize: 10, color: T.textMuted }}>\u20ac/mois</span></div>
                {annual && <div style={{ fontSize: 9, color: T.green }}>{price * 12}\u20ac/an</div>}
              </div>
              <button onClick={() => setStep(0)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 10, color: T.accent, fontFamily: FONT, fontWeight: 600,
              }}>Changer</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Inp label="Nom complet" value={name} onChange={setName} placeholder="Jean Dupont" autoComplete="name" />
              <Inp label="Email professionnel" type="email" value={email} onChange={setEmail} placeholder="vous@entreprise.fr" autoComplete="email" />
              <div style={{ position: 'relative' }}>
                <Inp
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={setPassword}
                  placeholder="Min. 6 caractères" autoComplete="new-password"
                  onKeyDown={(e) => { if (e.key === 'Enter') goToPayment(); }}
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} style={{
                  position: 'absolute', right: 10, top: 28, background: 'none',
                  border: 'none', cursor: 'pointer', fontSize: 12, color: T.textMuted, fontFamily: FONT,
                }}>
                  {showPassword ? 'Masquer' : 'Voir'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: T.redBg, color: T.red, border: `1px solid ${T.red}22`,
              }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Btn v="secondary" onClick={() => { setStep(0); setError(''); }} style={{ flex: 0 }}>
                {'\u2190'}
              </Btn>
              <Btn full onClick={goToPayment} style={{ background: GRAD, boxShadow: '0 2px 12px rgba(249,115,22,.3)' }}>
                Continuer vers le paiement
              </Btn>
            </div>
          </div>
        )}

        {/* ════════════ STEP 2: Payment ════════════ */}
        {step === 2 && (
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 16, padding: '24px 20px',
            boxShadow: '0 16px 48px rgba(0,0,0,.25)',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 4px', textAlign: 'center' }}>
              Informations de paiement
            </h2>
            <p style={{ fontSize: 11, color: T.textSecondary, textAlign: 'center', margin: '0 0 18px' }}>
              Vous ne serez pas débité pendant les 14 jours d'essai
            </p>

            {/* Plan + trial summary */}
            <div style={{
              padding: '14px 16px', borderRadius: 12, marginBottom: 18,
              background: `linear-gradient(135deg, rgba(249,115,22,.06), rgba(245,158,11,.04))`,
              border: `1px solid rgba(249,115,22,.15)`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Plan {plan.name}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{price}\u20ac<span style={{ fontSize: 10, fontWeight: 500, color: T.textMuted }}>/mois</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: 3, background: T.green,
                  boxShadow: `0 0 6px ${T.green}`,
                }} />
                <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>
                  Essai gratuit de 14 jours inclus
                </span>
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
                Premier prélèvement le {new Date(Date.now() + 14 * 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Payment form — Stripe Checkout when Supabase is configured, demo card form otherwise */}
            {isSupabaseConfigured() ? (
              <>
                {/* Stripe Checkout mode */}
                <div style={{
                  padding: '20px 16px', borderRadius: 12, textAlign: 'center',
                  background: T.surface2, border: `1px solid ${T.border}`, marginBottom: 4,
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{'\uD83D\uDD12'}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                    Paiement sécurisé via Stripe
                  </div>
                  <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>
                    Vous allez être redirigé vers la page de paiement sécurisée Stripe
                    pour entrer vos informations de carte bancaire.
                  </div>
                </div>

                {error && (
                  <div style={{
                    marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: T.redBg, color: T.red, border: `1px solid ${T.red}22`,
                  }}>{error}</div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  <Btn v="secondary" onClick={() => { setStep(1); setError(''); }} style={{ flex: 0 }}>
                    {'\u2190'}
                  </Btn>
                  <Btn full disabled={loading} onClick={handleStripeCheckout}
                    style={{ background: GRAD, boxShadow: '0 2px 12px rgba(249,115,22,.3)', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Redirection...' : 'Procéder au paiement Stripe'}
                  </Btn>
                </div>
              </>
            ) : (
              <>
                {/* Demo mode — local card form mockup */}
                <div ref={cardRef} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Inp label="Nom sur la carte" value={cardName} onChange={setCardName} placeholder="JEAN DUPONT" autoComplete="cc-name" />

                  {/* Card number with brand detection */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.textSecondary, marginBottom: 4 }}>
                      Numéro de carte
                    </label>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: T.surface2, border: `1px solid ${T.border}`,
                      borderRadius: 8, padding: '0 10px',
                      transition: 'border-color .2s ease',
                    }}>
                      {/* Card icon */}
                      <div style={{ flexShrink: 0, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {cardBrand ? (
                          <span style={{ fontSize: 10, fontWeight: 800, color: cardBrand.color, background: `${cardBrand.color}15`, padding: '2px 4px', borderRadius: 3 }}>
                            {cardBrand.brand}
                          </span>
                        ) : (
                          <span style={{ fontSize: 16, color: T.textMuted }}>{'\uD83D\uDCB3'}</span>
                        )}
                      </div>
                      <input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="4242 4242 4242 4242"
                        autoComplete="cc-number"
                        inputMode="numeric"
                        maxLength={19}
                        style={{
                          flex: 1, background: 'transparent', border: 'none', color: T.text,
                          fontSize: 14, fontFamily: FONT, padding: '10px 0', outline: 'none',
                          letterSpacing: 1.5, fontWeight: 600,
                        }}
                      />
                    </div>
                  </div>

                  {/* Expiry + CVC side by side */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.textSecondary, marginBottom: 4 }}>
                        Expiration
                      </label>
                      <input
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/AA"
                        autoComplete="cc-exp"
                        inputMode="numeric"
                        maxLength={5}
                        style={{
                          width: '100%', background: T.surface2, border: `1px solid ${T.border}`,
                          borderRadius: 8, color: T.text, fontSize: 13, fontFamily: FONT,
                          padding: '10px 12px', outline: 'none', letterSpacing: 1, fontWeight: 600,
                          transition: 'border-color .2s ease',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.textSecondary, marginBottom: 4 }}>
                        CVC
                      </label>
                      <input
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        autoComplete="cc-csc"
                        inputMode="numeric"
                        maxLength={4}
                        style={{
                          width: '100%', background: T.surface2, border: `1px solid ${T.border}`,
                          borderRadius: 8, color: T.text, fontSize: 13, fontFamily: FONT,
                          padding: '10px 12px', outline: 'none', letterSpacing: 1, fontWeight: 600,
                          transition: 'border-color .2s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div style={{
                    marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: T.redBg, color: T.red, border: `1px solid ${T.red}22`,
                  }}>{error}</div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  <Btn v="secondary" onClick={() => { setStep(1); setError(''); }} style={{ flex: 0 }}>
                    {'\u2190'}
                  </Btn>
                  <Btn full disabled={loading} onClick={handleSubmit}
                    style={{ background: GRAD, boxShadow: '0 2px 12px rgba(249,115,22,.3)', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Traitement...' : `Démarrer l'essai gratuit`}
                  </Btn>
                </div>
              </>
            )}

            {/* Trust signals */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              marginTop: 16, flexWrap: 'wrap',
            }}>
              {[
                { icon: '\uD83D\uDD12', label: 'Paiement sécurisé SSL' },
                { icon: '\u2713', label: 'Annulation à tout moment' },
                { icon: '\uD83C\uDDEA\uD83C\uDDFA', label: 'Données en Europe' },
              ].map((t) => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10 }}>{t.icon}</span>
                  <span style={{ fontSize: 9, color: T.textMuted, fontWeight: 500 }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          {onBack && (
            <button onClick={onBack} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: T.textMuted, fontFamily: FONT,
              marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              {'\u2190'} Retour au site
            </button>
          )}
          <p style={{ fontSize: 10, color: T.textMuted }}>
            En créant votre compte, vous acceptez les CGV et la politique de confidentialité
          </p>
        </div>
      </div>
    </div>
  );
}
