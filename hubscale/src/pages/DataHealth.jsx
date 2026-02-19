import React, { useState } from 'react';
import { T } from '../lib/theme.js';
import { KPI, Card, Section, Btn, Badge, ProgressBar } from '../components/ui.jsx';

const SUB_TABS = ['CI/CD Tests', 'Règles nettoyage', 'Backups', 'KPI & Business'];

const TESTS = {
  api: {
    title: 'INTÉGRATIONS API',
    tests: [
      { id: 'stripe', name: 'Stripe API', desc: 'Vérifie la connexion Stripe et les webhooks', critical: true },
      { id: 'revolut', name: 'Revolut API', desc: "Vérifie l'accès aux données bancaires", critical: true },
      { id: 'ghl', name: 'GoHighLevel API', desc: 'Vérifie la synchronisation CRM', critical: false },
      { id: 'meta', name: 'Meta Ads API', desc: "Vérifie l'accès aux données publicitaires", critical: false },
    ],
  },
  quality: {
    title: 'QUALITÉ DONNÉES',
    tests: [
      { id: 'finance', name: 'Données financières', desc: 'Vérifie la cohérence des données CA/Charges', critical: true },
      { id: 'crm', name: 'Intégrité CRM', desc: 'Vérifie les doublons et données manquantes', critical: false },
      { id: 'ads', name: 'Données publicitaires', desc: 'Vérifie la cohérence des métriques pub', critical: false },
      { id: 'cross', name: 'Validation croisée', desc: 'Cross-check entre les différentes sources', critical: true },
      { id: 'schema', name: 'Schéma données', desc: 'Vérifie la conformité du schéma de données', critical: true },
    ],
  },
  infra: {
    title: 'INFRASTRUCTURE',
    tests: [
      { id: 'backup', name: 'Backup 24h', desc: 'Vérifie que le backup automatique fonctionne', critical: true },
      { id: 'quota', name: 'Quota stockage', desc: "Vérifie l'espace de stockage disponible", critical: false },
      { id: 'session', name: 'Session auth', desc: "Vérifie la validité des sessions d'authentification", critical: false },
    ],
  },
};

const ALL_TESTS = [...TESTS.api.tests, ...TESTS.quality.tests, ...TESTS.infra.tests];

export default function DataHealth() {
  const [subTab, setSubTab] = useState('CI/CD Tests');
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);

  const passed = Object.values(results).filter((r) => r === 'pass').length;
  const warnings = Object.values(results).filter((r) => r === 'warning').length;
  const failed = Object.values(results).filter((r) => r === 'fail').length;
  const criticals = ALL_TESTS.filter((t) => t.critical && results[t.id] !== 'pass').length;
  const total = ALL_TESTS.length;

  const runTests = () => {
    setRunning(true);
    setResults({});
    // Simulate test execution
    let i = 0;
    const interval = setInterval(() => {
      if (i >= ALL_TESTS.length) {
        clearInterval(interval);
        setRunning(false);
        return;
      }
      const test = ALL_TESTS[i];
      const rand = Math.random();
      setResults((prev) => ({
        ...prev,
        [test.id]: rand > 0.6 ? 'pass' : rand > 0.3 ? 'warning' : 'fail',
      }));
      i++;
    }, 300);
  };

  const getStatusBadge = (testId, critical) => {
    const r = results[testId];
    if (!r) {
      if (critical) return <Badge label="CRITIQUE" color={T.red} bg={T.redBg} />;
      return <Badge label="En attente" color={T.textMuted} bg={T.surface2} />;
    }
    if (r === 'pass') return <Badge label="PASSÉ" color={T.green} bg={T.greenBg} />;
    if (r === 'warning') return <Badge label="WARNING" color={T.orange} bg={T.orangeBg} />;
    return <Badge label="ÉCHEC" color={T.red} bg={T.redBg} />;
  };

  const renderTestSection = (section) => {
    const sectionPassed = section.tests.filter((t) => results[t.id] === 'pass').length;
    return (
      <Section key={section.title} title={section.title} sub={`${sectionPassed}/${section.tests.length} passé(s)`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {section.tests.map((test) => (
            <Card key={test.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: results[test.id] === 'pass' ? T.greenBg : results[test.id] === 'warning' ? T.orangeBg : results[test.id] === 'fail' ? T.redBg : T.surface2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                transition: 'background .3s',
              }}>
                {results[test.id] === 'pass' ? '✓' : results[test.id] === 'warning' ? '⚠' : results[test.id] === 'fail' ? '✗' : '○'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: T.text }}>{test.name}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{test.desc}</div>
              </div>
              {getStatusBadge(test.id, test.critical)}
            </Card>
          ))}
        </div>
      </Section>
    );
  };

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Data Health</h1>
        <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>Monitoring CI/CD, qualité des données et infrastructure</p>
      </div>

      {/* Sub-tabs */}
      <div className="fade-up d1" style={{ display: 'flex', gap: 0, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 20, width: 'fit-content' }}>
        {SUB_TABS.map((t) => {
          const active = subTab === t;
          return (
            <button key={t} onClick={() => setSubTab(t)} style={{
              background: active ? T.accentBg : 'transparent', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: 'inherit',
              color: active ? T.accent : T.textMuted, transition: 'all .15s', whiteSpace: 'nowrap',
            }}>{t}</button>
          );
        })}
      </div>

      {subTab === 'CI/CD Tests' && (
        <>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            <KPI label="TESTS PASSÉS" value={`${passed}/${total}`} accent={T.green} icon="✅" delay={1} />
            <KPI label="WARNINGS" value={String(warnings)} accent={T.orange} icon="⚠️" delay={2} />
            <KPI label="ÉCHECS" value={String(failed)} accent={T.red} icon="❌" delay={3} />
            <KPI label="CRITIQUES" value={String(criticals)} accent={T.red} icon="🚨" delay={4} />
          </div>

          {/* Run tests button */}
          <div className="fade-up d2" style={{ marginBottom: 20 }}>
            <Btn
              full
              disabled={running}
              onClick={runTests}
              style={{
                background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                boxShadow: '0 4px 20px rgba(249,115,22,.3)',
                padding: '14px 24px', fontSize: 14,
              }}
            >
              {running ? '⏳ Tests en cours...' : '🧪 Lancer les tests'}
            </Btn>
          </div>

          {/* Test sections */}
          {renderTestSection(TESTS.api)}
          {renderTestSection(TESTS.quality)}
          {renderTestSection(TESTS.infra)}

          {/* Fallback policy */}
          <Section title="POLITIQUE DE FALLBACK">
            <Card style={{ borderLeft: `3px solid ${T.blue}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 18 }}>ℹ️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: T.text, marginBottom: 4 }}>Gestion des erreurs et fallbacks</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
                    En cas d'échec d'une intégration API, le système bascule automatiquement sur les dernières données en cache.
                    Les données sont mises à jour dès que la connexion est rétablie. Les tests critiques sont relancés toutes les 6 heures.
                    Un email d'alerte est envoyé si un test critique échoue 3 fois consécutives.
                  </div>
                </div>
              </div>
            </Card>
          </Section>
        </>
      )}

      {subTab === 'Règles nettoyage' && (
        <Section title="RÈGLES DE NETTOYAGE" sub="Automatisez le nettoyage de vos données">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Suppression doublons CRM', freq: 'Hebdomadaire', active: true },
              { name: 'Normalisation emails', freq: 'À chaque import', active: true },
              { name: 'Vérification SIRET', freq: 'Mensuel', active: false },
              { name: 'Nettoyage téléphones', freq: 'À chaque import', active: true },
              { name: 'Archivage contacts inactifs', freq: 'Mensuel', active: false },
            ].map((r) => (
              <Card key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 4,
                  background: r.active ? T.green : T.textMuted,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: T.text }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{r.freq}</div>
                </div>
                <Badge label={r.active ? 'Actif' : 'Inactif'} color={r.active ? T.green : T.textMuted} bg={r.active ? T.greenBg : T.surface2} />
              </Card>
            ))}
          </div>
        </Section>
      )}

      {subTab === 'Backups' && (
        <Section title="SAUVEGARDES" sub="Historique et configuration des backups">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <KPI label="DERNIER BACKUP" value="il y a 6h" accent={T.green} icon="💾" />
            <KPI label="TAILLE" value="12.4 MB" accent={T.blue} icon="📦" />
            <KPI label="BACKUPS STOCKÉS" value="30" sub="Rétention 30 jours" accent={T.purple} icon="📚" />
          </div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: T.text }}>Historique récent</div>
              <Btn v="secondary" small>Backup manuel</Btn>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { date: '19 Fév 2026, 06:00', size: '12.4 MB', status: 'ok' },
                { date: '18 Fév 2026, 06:00', size: '12.1 MB', status: 'ok' },
                { date: '17 Fév 2026, 06:00', size: '11.9 MB', status: 'ok' },
                { date: '16 Fév 2026, 06:00', size: '11.8 MB', status: 'warning' },
                { date: '15 Fév 2026, 06:00', size: '11.6 MB', status: 'ok' },
              ].map((b) => (
                <div key={b.date} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 6, background: T.surface2 }}>
                  <span style={{ fontSize: 12, color: b.status === 'ok' ? T.green : T.orange }}>
                    {b.status === 'ok' ? '✓' : '⚠'}
                  </span>
                  <span style={{ fontSize: 11, color: T.text, flex: 1 }}>{b.date}</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{b.size}</span>
                  <Btn v="ghost" small>Restaurer</Btn>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {subTab === 'KPI & Business' && (
        <Section title="KPI PERSONNALISÉS" sub="Suivez vos indicateurs clés de performance">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <KPI label="MRR" value="2 490€" sub="Monthly Recurring Revenue" accent={T.green} icon="💰" />
            <KPI label="CHURN RATE" value="2.1%" sub="Taux d'attrition mensuel" accent={T.orange} icon="📉" />
            <KPI label="LTV" value="14 940€" sub="Lifetime Value client" accent={T.blue} icon="⭐" />
            <KPI label="CAC" value="120€" sub="Coût d'acquisition client" accent={T.purple} icon="🎯" />
          </div>
          <Card>
            <div style={{ fontSize: 11, color: T.textSecondary, textAlign: 'center', padding: 20 }}>
              Configurez vos KPI personnalisés dans les paramètres pour suivre les métriques qui comptent pour votre business.
            </div>
          </Card>
        </Section>
      )}
    </div>
  );
}
