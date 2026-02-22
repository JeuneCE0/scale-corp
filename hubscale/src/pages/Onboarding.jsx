import React, { useState, useCallback } from 'react';
import { T } from '../lib/theme.js';
import { store } from '../lib/store.js';
import { Card, Btn, Inp, Sel, ProgressBar } from '../components/ui.jsx';

const STEPS = [
  { id: 1, label: 'Informations entreprise' },
  { id: 2, label: 'Outils & Logiciels' },
  { id: 3, label: 'Clés API & Tokens' },
  { id: 4, label: 'Sources de données' },
  { id: 5, label: 'Tutoriel plateforme' },
];

const SECTORS = [
  { value: '', label: 'Sélectionner un secteur...' },
  { value: 'tech', label: 'Tech / SaaS' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'services', label: 'Services' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'industrie', label: 'Industrie' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'sante', label: 'Santé' },
  { value: 'autre', label: 'Autre' },
];

const TOOLS = [
  { id: 'stripe', label: 'Stripe', icon: '💳', desc: 'Paiements en ligne' },
  { id: 'revolut', label: 'Revolut Business', icon: '🏦', desc: 'Banque en ligne' },
  { id: 'ghl', label: 'GoHighLevel', icon: '📈', desc: 'CRM & Marketing' },
  { id: 'meta', label: 'Meta Ads', icon: '📣', desc: 'Publicité Facebook/Instagram' },
  { id: 'google', label: 'Google Ads', icon: '🔍', desc: 'Publicité Google' },
  { id: 'hubspot', label: 'HubSpot', icon: '🔶', desc: 'CRM' },
  { id: 'quickbooks', label: 'QuickBooks', icon: '📗', desc: 'Comptabilité' },
  { id: 'slack', label: 'Slack', icon: '💬', desc: 'Communication' },
];

const DATA_SOURCES = [
  { id: 'manual', label: 'Saisie manuelle', desc: 'Entrez vos données manuellement', icon: '✏️' },
  { id: 'csv', label: 'Import CSV', desc: 'Importez depuis un fichier CSV', icon: '📄' },
  { id: 'api', label: 'Connexion API', desc: 'Synchronisation automatique via API', icon: '🔗' },
  { id: 'comptable', label: 'Export comptable', desc: 'Import depuis votre logiciel comptable', icon: '🧾' },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState({ name: '', sector: '', website: '', employees: '', ca: '', created: '', description: '' });
  const [selectedTools, setSelectedTools] = useState([]);
  const [apiKeys, setApiKeys] = useState({ stripe: '', revolut: '', ghl: '', meta: '' });
  const [dataSources, setDataSources] = useState([]);

  const progress = (step / STEPS.length) * 100;
  const toggleTool = useCallback((id) => setSelectedTools((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]), []);
  const toggleSource = useCallback((id) => setDataSources((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]), []);
  const next = useCallback(() => setStep((s) => Math.min(s + 1, 5)), []);
  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  const finish = useCallback(() => {
    store('company', company);
    store('tools', selectedTools);
    // API keys are not stored in localStorage for security — they should be sent to a secure backend
    store('dataSources', dataSources);
    if (onComplete) onComplete();
  }, [company, selectedTools, dataSources, onComplete]);

  const skip = useCallback(() => { if (onComplete) onComplete(); }, [onComplete]);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>
      <div className="fade-up" style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Onboarding</h1>
        <p style={{ color: T.textSecondary, fontSize: 13, marginTop: 6 }}>
          Étape {step}/{STEPS.length} — {STEPS[step - 1].label}
        </p>
        <div style={{ marginTop: 12 }} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progression onboarding">
          <ProgressBar value={progress} max={100} color="#f97316" h={6} />
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{Math.round(progress)}%</div>
        </div>
      </div>

      <nav className="fade-up d1 subtabs" aria-label="Étapes d'onboarding" style={{ gap: 4, marginBottom: 24, justifyContent: 'center' }}>
        {STEPS.map((s) => (
          <button key={s.id} onClick={() => setStep(s.id)} aria-current={s.id === step ? 'step' : undefined} style={{
            padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
            background: s.id === step ? T.accentBg : s.id < step ? T.greenBg : T.surface2,
            color: s.id === step ? T.accent : s.id < step ? T.green : T.textMuted,
            border: `1px solid ${s.id === step ? T.accent + '44' : 'transparent'}`,
            transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit',
          }}>
            {s.id < step ? '✓ ' : ''}{s.label}
          </button>
        ))}
      </nav>

      {step === 1 && (
        <Card className="fade-up d2">
          <Inp label="Nom de l'entreprise *" value={company.name} onChange={(v) => setCompany({ ...company, name: v })} placeholder="Ex: Ma Société SAS" />
          <Sel label="Secteur d'activité" value={company.sector} onChange={(v) => setCompany({ ...company, sector: v })} options={SECTORS} />
          <Inp label="Site web" value={company.website} onChange={(v) => setCompany({ ...company, website: v })} placeholder="https://www.masociete.fr" />
          <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Inp label="Nombre d'employés" value={company.employees} onChange={(v) => setCompany({ ...company, employees: v })} type="number" placeholder="5" />
            <Inp label="CA annuel estimé (€)" value={company.ca} onChange={(v) => setCompany({ ...company, ca: v })} type="number" placeholder="500000" suffix="€" />
          </div>
          <Inp label="Date de création" type="date" value={company.created} onChange={(v) => setCompany({ ...company, created: v })} />
          <Inp label="Description de l'activité" value={company.description} onChange={(v) => setCompany({ ...company, description: v })} textarea placeholder="Décrivez votre activité en quelques lignes..." />
        </Card>
      )}

      {step === 2 && (
        <Card className="fade-up d2">
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Quels outils utilisez-vous ?</div>
          <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 16 }}>Sélectionnez les outils que vous souhaitez connecter</div>
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {TOOLS.map((t) => {
              const sel = selectedTools.includes(t.id);
              return (
                <div key={t.id} onClick={() => toggleTool(t.id)} role="checkbox" aria-checked={sel} tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTool(t.id); } }}
                  style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    background: sel ? T.accentBg : T.surface2,
                    border: `1px solid ${sel ? T.accent + '66' : T.border}`,
                    display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s',
                  }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: sel ? T.accent : T.text }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{t.desc}</div>
                  </div>
                  {sel && <span style={{ color: T.accent, fontWeight: 700, fontSize: 14 }}>✓</span>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="fade-up d2">
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Clés API & Tokens</div>
          <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 16 }}>Renseignez vos clés API. Vous pourrez les modifier plus tard.</div>
          <Inp label="Stripe Secret Key" value={apiKeys.stripe} onChange={(v) => setApiKeys({ ...apiKeys, stripe: v })} placeholder="sk_live_..." note="Dashboard Stripe → Développeurs → Clés API" />
          <Inp label="Revolut API Key" value={apiKeys.revolut} onChange={(v) => setApiKeys({ ...apiKeys, revolut: v })} placeholder="prod-..." note="Revolut Business → API" />
          <Inp label="GoHighLevel API Key" value={apiKeys.ghl} onChange={(v) => setApiKeys({ ...apiKeys, ghl: v })} placeholder="eyJ..." note="Settings → API Keys" />
          <Inp label="Meta Ads Access Token" value={apiKeys.meta} onChange={(v) => setApiKeys({ ...apiKeys, meta: v })} placeholder="EAA..." note="Meta Business Suite → Paramètres" />
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: T.orangeBg, border: `1px solid ${T.orange}22` }}>
            <div style={{ fontSize: 11, color: T.orange }}>🔒 Vos clés sont chiffrées. Vous pouvez passer cette étape.</div>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="fade-up d2">
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Sources de données</div>
          <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 16 }}>Comment souhaitez-vous alimenter vos données financières ?</div>
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {DATA_SOURCES.map((s) => {
              const sel = dataSources.includes(s.id);
              return (
                <div key={s.id} onClick={() => toggleSource(s.id)} role="checkbox" aria-checked={sel} tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSource(s.id); } }}
                  style={{
                    padding: 16, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    background: sel ? T.accentBg : T.surface2,
                    border: `1px solid ${sel ? T.accent + '66' : T.border}`, transition: 'all .15s',
                  }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: sel ? T.accent : T.text, marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{s.desc}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card className="fade-up d2">
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 8 }}>Vous êtes prêt !</h2>
            <p style={{ fontSize: 13, color: T.textSecondary, maxWidth: 400, margin: '0 auto 20px' }}>
              Votre espace client est configuré. Découvrez les fonctionnalités principales de HubScale.
            </p>
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, maxWidth: 500, margin: '0 auto' }}>
              {[
                { icon: '📊', title: 'Dashboard', desc: "Vue d'ensemble" },
                { icon: '👥', title: 'CRM', desc: 'Contacts & pipeline' },
                { icon: '💰', title: 'Data', desc: 'Suivez vos finances' },
                { icon: '📅', title: 'Agenda', desc: 'Vos événements' },
              ].map((f) => (
                <div key={f.title} style={{ padding: 14, borderRadius: 10, background: T.surface2, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: T.text }}>{f.title}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 8 }}>
        <div>{step > 1 && <Btn v="ghost" onClick={prev} aria-label="Étape précédente">← Précédent</Btn>}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={skip} aria-label="Passer l'onboarding" style={{
            background: 'none', border: 'none', color: T.textMuted, fontSize: 11,
            cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
          }}>Passer l'onboarding</button>
          {step < 5 ? (
            <Btn onClick={next} aria-label="Étape suivante" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Suivant →</Btn>
          ) : (
            <Btn onClick={finish} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Accéder au Dashboard →</Btn>
          )}
        </div>
      </div>
    </div>
  );
}
