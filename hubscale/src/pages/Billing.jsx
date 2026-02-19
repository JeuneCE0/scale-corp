import React, { useState } from 'react';
import { T } from '../lib/theme.js';
import { Card, Btn, Toggle, Badge } from '../components/ui.jsx';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 99,
    features: [
      'Dashboard Overview',
      'CRM basique (100 contacts)',
      'Données financières',
      '1 utilisateur',
      'Support email',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthly: 249,
    recommended: true,
    features: [
      'Tout Starter +',
      'CRM avancé (illimité)',
      'Sales Pipeline & Pub',
      'Agenda & Data Health',
      '5 utilisateurs',
      'Intégrations API',
      'Support prioritaire',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: 499,
    features: [
      'Tout Professional +',
      'CI/CD Data Monitoring',
      'Backup automatique 24h',
      'KPI personnalisés',
      'Utilisateurs illimités',
      'Onboarding dédié',
      'SLA 99.9%',
      'Account manager',
    ],
  },
];

export default function Billing() {
  const [annual, setAnnual] = useState(false);
  const [selected, setSelected] = useState('professional');

  return (
    <div>
      <div className="fade-up" style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: T.text }}>Choisissez votre forfait</h1>
        <p style={{ color: T.textSecondary, fontSize: 13, marginTop: 6 }}>
          Paiement sécurisé via Stripe. Annulez à tout moment.
        </p>

        {/* Toggle Mensuel / Annuel */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
          <span style={{ fontSize: 12, fontWeight: annual ? 500 : 700, color: annual ? T.textMuted : T.text }}>Mensuel</span>
          <div onClick={() => setAnnual(!annual)} style={{
            width: 44, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative',
            background: annual ? T.green : T.border, transition: 'background .2s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 9, background: '#fff',
              position: 'absolute', top: 2, left: annual ? 24 : 2, transition: 'left .2s',
            }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: annual ? 700 : 500, color: annual ? T.text : T.textMuted }}>
            Annuel <span style={{ color: T.green, fontWeight: 700 }}>-20%</span>
          </span>
        </div>
      </div>

      {/* Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
        {PLANS.map((plan, i) => {
          const price = annual ? Math.round(plan.monthly * 0.8) : plan.monthly;
          const active = selected === plan.id;
          return (
            <div
              key={plan.id}
              className={`fade-up d${i + 1}`}
              onClick={() => setSelected(plan.id)}
              style={{
                background: T.surface,
                border: `2px solid ${active ? '#f97316' : plan.recommended ? T.accent + '44' : T.border}`,
                borderRadius: 16, padding: 24, cursor: 'pointer',
                position: 'relative', transition: 'all .2s ease',
                boxShadow: active ? '0 0 24px rgba(249,115,22,.15)' : plan.recommended ? '0 0 24px rgba(99,102,241,.1)' : 'none',
              }}
            >
              {plan.recommended && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff',
                  padding: '3px 12px', borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: .5,
                }}>RECOMMANDÉ</div>
              )}

              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: T.text, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: T.text }}>{price}</span>
                  <span style={{ fontSize: 14, color: T.textMuted }}>€/mois</span>
                </div>
                {annual && (
                  <div style={{ fontSize: 11, color: T.green, marginTop: 4 }}>
                    {plan.monthly * 12}€ → {price * 12}€/an
                  </div>
                )}
              </div>

              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: T.green, fontSize: 12, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 12, color: T.textSecondary }}>{f}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20 }}>
                <Btn
                  full
                  v={active ? 'primary' : 'secondary'}
                  style={active ? { background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 2px 12px rgba(249,115,22,.3)' } : {}}
                >
                  {active ? 'Sélectionné' : 'Choisir'}
                </Btn>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="fade-up d4" style={{ textAlign: 'center' }}>
        <Btn
          style={{
            background: 'linear-gradient(135deg, #f97316, #f59e0b)',
            boxShadow: '0 4px 20px rgba(249,115,22,.3)',
            padding: '14px 32px', fontSize: 15,
          }}
        >
          Continuer → Informations entreprise
        </Btn>
        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>
          Vous serez redirigé vers le paiement sécurisé Stripe
        </div>
      </div>
    </div>
  );
}
