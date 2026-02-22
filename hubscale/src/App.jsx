import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { T, FONT } from './lib/theme.js';
import { GLOBAL_CSS } from './lib/css.js';
import { load, store } from './lib/store.js';
import { Spinner, ErrorBoundary } from './components/ui.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const CRM = lazy(() => import('./pages/CRM.jsx'));
const Data = lazy(() => import('./pages/Data.jsx'));
const Agenda = lazy(() => import('./pages/Agenda.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'));

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'crm', label: 'CRM', icon: '👥' },
  { id: 'data', label: 'Data', icon: '💰' },
  { id: 'agenda', label: 'Agenda', icon: '📅' },
  { id: 'settings', label: 'Paramètres', icon: '⚙️' },
];

const TAB_LABELS = { overview: 'Dashboard', crm: 'CRM', data: 'Data', agenda: 'Agenda', settings: 'Paramètres' };

function LoadingFallback({ page }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 10 }}>
      <Spinner size={24} />
      <span style={{ color: T.textMuted, fontSize: 12 }}>Chargement {page ? `de ${page}` : ''}...</span>
    </div>
  );
}

// --- Global Search (Cmd+K) ---
function GlobalSearch({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const items = [];
    const contacts = load('contacts') || [];
    contacts.filter((c) => (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q))
      .slice(0, 5).forEach((c) => items.push({ type: 'contact', label: c.name, sub: c.email || c.company || '', tab: 'crm', icon: '👤' }));
    const events = load('events') || [];
    events.filter((e) => (e.title || '').toLowerCase().includes(q))
      .slice(0, 5).forEach((e) => items.push({ type: 'event', label: e.title, sub: e.date || '', tab: 'agenda', icon: '📅' }));
    const finances = load('finHistory') || [];
    finances.filter((f) => (f.key || '').includes(q))
      .slice(0, 3).forEach((f) => items.push({ type: 'finance', label: `Mois ${f.key}`, sub: `CA: ${f.ca}€`, tab: 'data', icon: '💰' }));
    [{ label: 'Dashboard', tab: 'overview', icon: '📊' }, { label: 'CRM', tab: 'crm', icon: '👥' },
     { label: 'Data', tab: 'data', icon: '💰' }, { label: 'Agenda', tab: 'agenda', icon: '📅' },
     { label: 'Paramètres', tab: 'settings', icon: '⚙️' }]
      .filter((p) => p.label.toLowerCase().includes(q))
      .forEach((p) => items.push({ type: 'page', label: p.label, sub: 'Naviguer', tab: p.tab, icon: p.icon }));
    return items;
  }, [query]);

  if (!open) return null;
  return (
    <div className="fade-in" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '80px 16px', backdropFilter: 'blur(8px)' }}>
      <div className="scale-in" onClick={(e) => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, width: 520, maxWidth: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.5)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 16, color: T.textMuted }}>🔍</span>
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher contacts, événements, pages..."
            style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, fontSize: 14, fontFamily: FONT, outline: 'none' }} />
          <kbd style={{ fontSize: 10, color: T.textMuted, background: T.surface2, padding: '2px 6px', borderRadius: 4, border: `1px solid ${T.border}` }}>ESC</kbd>
        </div>
        {results.length > 0 && (
          <div style={{ maxHeight: 320, overflowY: 'auto', padding: 8 }}>
            {results.map((r, i) => (
              <div key={`${r.type}-${i}`} onClick={() => { onNavigate(r.tab); onClose(); }}
                className="hoverable" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer' }}>
                <span style={{ fontSize: 16, width: 28, textAlign: 'center' }}>{r.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{r.sub}</div>
                </div>
                <span style={{ fontSize: 9, color: T.textMuted, background: T.surface2, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', fontWeight: 600 }}>{r.type}</span>
              </div>
            ))}
          </div>
        )}
        {query.length >= 2 && results.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>Aucun résultat pour "{query}"</div>
        )}
        {query.length < 2 && (
          <div style={{ padding: 24, textAlign: 'center', color: T.textMuted, fontSize: 11 }}>Tapez au moins 2 caractères pour chercher</div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('overview');
  const [onboarded, setOnboarded] = useState(() => load('onboarded') === true);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!document.getElementById('hs-css')) {
      const style = document.createElement('style');
      style.id = 'hs-css';
      style.textContent = GLOBAL_CSS;
      document.head.appendChild(style);
    }
  }, []);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    store('onboarded', true);
    setOnboarded(true);
  }, []);

  const navigate = useCallback((tabId) => setTab(tabId), []);

  if (!onboarded) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
        <Suspense fallback={<LoadingFallback />}>
          <Onboarding onComplete={handleOnboardingComplete} />
        </Suspense>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
      <nav role="navigation" aria-label="Navigation principale" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(9,9,11,.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.border}`,
        padding: '0 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #f97316, #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14, color: '#fff', flexShrink: 0,
            }}>H</div>
            <div className="hide-mobile">
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, lineHeight: 1.2 }}>Client Portal</div>
              <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: .3 }}>HubScale — Espace client B2B</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setSearchOpen(true)} aria-label="Recherche globale"
              style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: T.textMuted }}>🔍</span>
              <span className="hide-mobile" style={{ fontSize: 11, color: T.textMuted }}>Rechercher</span>
              <kbd className="hide-mobile" style={{ fontSize: 9, color: T.textMuted, background: T.bg, padding: '1px 4px', borderRadius: 3, border: `1px solid ${T.border}`, marginLeft: 4 }}>⌘K</kbd>
            </button>
            <span style={{
              fontSize: 9, fontWeight: 700, color: T.orange, border: `1px solid ${T.orange}44`,
              borderRadius: 4, padding: '2px 6px', letterSpacing: .5,
            }}>PREVIEW</span>
          </div>
        </div>

        <div className="nav-tabs-scroll" role="tablist" style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                aria-label={t.label}
                onClick={() => setTab(t.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 12px', fontFamily: FONT,
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: active ? 700 : 500,
                  color: active ? T.text : T.textMuted,
                  borderBottom: active ? '2px solid #f97316' : '2px solid transparent',
                  transition: 'all .15s ease', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 12 }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="page-pad" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 40px' }}>
        <ErrorBoundary fallbackTitle={`Erreur dans ${TAB_LABELS[tab] || 'la page'}`}>
          <Suspense fallback={<LoadingFallback page={TAB_LABELS[tab]} />}>
            {tab === 'overview' && <Dashboard onNavigate={navigate} />}
            {tab === 'crm' && <CRM />}
            {tab === 'data' && <Data />}
            {tab === 'agenda' && <Agenda />}
            {tab === 'settings' && <Settings />}
          </Suspense>
        </ErrorBoundary>
      </main>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={navigate} />
    </div>
  );
}
