import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { T, FONT } from './lib/theme.js';
import { GLOBAL_CSS } from './lib/css.js';
import { load, store } from './lib/store.js';
import { Spinner, ErrorBoundary, Btn } from './components/ui.jsx';
import { t, getLang, setLang, onLangChange, AVAILABLE_LANGS } from './lib/i18n.js';

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

// --- Keyboard Shortcuts Help (Cmd+?) ---
const SHORTCUTS = [
  { keys: ['⌘', 'K'], desc: 'Recherche globale' },
  { keys: ['⌘', '?'], desc: 'Aide raccourcis clavier' },
  { keys: ['Ctrl', 'Z'], desc: 'Annuler la dernière suppression' },
  { keys: ['Esc'], desc: 'Fermer modale / recherche' },
  { keys: ['Enter'], desc: 'Valider formulaire' },
];

// --- Guided Tour ---
const TOUR_STEPS = [
  { target: 'overview', title: '📊 Dashboard', desc: () => t('tour.step1') },
  { target: 'crm', title: '👥 CRM', desc: () => t('tour.step2') },
  { target: 'data', title: '💰 Data', desc: () => t('tour.step3') },
  { target: 'agenda', title: '📅 Agenda', desc: () => t('tour.step4') },
  { target: 'settings', title: '⚙️ Paramètres', desc: () => t('tour.step5') },
];

function GuidedTour({ open, onClose, onNavigate }) {
  const [step, setStep] = useState(0);

  useEffect(() => { if (open) setStep(0); }, [open]);

  const goNext = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      const next = step + 1;
      setStep(next);
      onNavigate(TOUR_STEPS[next].target);
    } else {
      store('tourDone', true);
      onClose();
    }
  }, [step, onClose, onNavigate]);

  const goPrev = useCallback(() => {
    if (step > 0) {
      const prev = step - 1;
      setStep(prev);
      onNavigate(TOUR_STEPS[prev].target);
    }
  }, [step, onNavigate]);

  if (!open) return null;
  const s = TOUR_STEPS[step];
  return (
    <div className="fade-in" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div className="scale-in" onClick={(e) => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 400, maxWidth: '90%', boxShadow: '0 24px 64px rgba(0,0,0,.5)', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>{s.title.split(' ')[0]}</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 8px' }}>{s.title}</h3>
        <p style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}>{s.desc()}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 3, background: i === step ? T.accent : T.border, transition: 'all .2s' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {step > 0 && <Btn v="ghost" small onClick={goPrev}>{t('tour.prev')}</Btn>}
          <Btn v="ghost" small onClick={() => { store('tourDone', true); onClose(); }}>{t('tour.skip')}</Btn>
          <Btn onClick={goNext} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
            {step < TOUR_STEPS.length - 1 ? t('tour.next') : t('tour.finish')}
          </Btn>
        </div>
        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 12 }}>{step + 1} / {TOUR_STEPS.length}</div>
      </div>
    </div>
  );
}

function ShortcutsHelp({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fade-in" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(8px)' }}>
      <div className="scale-in" onClick={(e) => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, width: 400, maxWidth: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Raccourcis clavier</h3>
          <Btn v="ghost" small onClick={onClose} aria-label="Fermer">✕</Btn>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SHORTCUTS.map((s) => (
            <div key={s.desc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12, color: T.textSecondary }}>{s.desc}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {s.keys.map((k) => (
                  <kbd key={k} style={{ fontSize: 11, color: T.text, background: T.surface2, padding: '3px 8px', borderRadius: 5, border: `1px solid ${T.border}`, fontFamily: FONT, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <span style={{ fontSize: 10, color: T.textMuted }}>Sur Mac, ⌘ = Cmd. Sur Windows/Linux, ⌘ = Ctrl.</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('overview');
  const [onboarded, setOnboarded] = useState(() => load('onboarded') === true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [pageKey, setPageKey] = useState(0);
  const [lang, setLangState] = useState(getLang);
  const mainRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById('hs-css')) {
      const style = document.createElement('style');
      style.id = 'hs-css';
      style.textContent = GLOBAL_CSS;
      document.head.appendChild(style);
    }
  }, []);

  // Sync lang state with i18n module
  useEffect(() => onLangChange(setLangState), []);

  // Global keyboard shortcuts: Cmd+K (search), Cmd+? (shortcuts help)
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if ((e.metaKey || e.ctrlKey) && (e.key === '?' || (e.shiftKey && e.key === '/'))) { e.preventDefault(); setShortcutsOpen(true); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    store('onboarded', true);
    setOnboarded(true);
    if (!load('tourDone')) setTourOpen(true);
  }, []);

  const navigate = useCallback((tabId) => {
    setTab(tabId);
    setPageKey((k) => k + 1);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!onboarded) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
        <Suspense fallback={<LoadingFallback />}>
          <Onboarding onComplete={handleOnboardingComplete} />
        </Suspense>
      </div>
    );
  }

  const handleTabChange = useCallback((tabId) => {
    setTab(tabId);
    setPageKey((k) => k + 1);
  }, []);

  const handleLangToggle = useCallback(() => {
    const next = getLang() === 'fr' ? 'en' : 'fr';
    setLang(next);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
      {/* Skip nav (a11y) */}
      <a href="#main-content" className="skip-nav" style={{ fontFamily: FONT }}>Aller au contenu</a>

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
            <button onClick={handleLangToggle} aria-label="Changer de langue" title={t('lang.label')}
              style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: T.textMuted, fontFamily: FONT }}>
              {getLang().toUpperCase()}
            </button>
            <button onClick={() => setSearchOpen(true)} aria-label="Recherche globale"
              style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: T.textMuted }}>🔍</span>
              <span className="hide-mobile" style={{ fontSize: 11, color: T.textMuted }}>{t('common.search').replace('...', '')}</span>
              <kbd className="hide-mobile" style={{ fontSize: 9, color: T.textMuted, background: T.bg, padding: '1px 4px', borderRadius: 3, border: `1px solid ${T.border}`, marginLeft: 4 }}>⌘K</kbd>
            </button>
            {!load('tourDone') && <button onClick={() => setTourOpen(true)} aria-label="Visite guidée" style={{ background: T.orangeBg, border: `1px solid ${T.orange}33`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: T.orange, fontFamily: FONT }}>Tour</button>}
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
                onClick={() => handleTabChange(t.id)}
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

      <main id="main-content" ref={mainRef} className="page-pad" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 40px' }}>
        <ErrorBoundary fallbackTitle={`Erreur dans ${TAB_LABELS[tab] || 'la page'}`}>
          <Suspense fallback={<LoadingFallback page={TAB_LABELS[tab]} />}>
            <div key={pageKey} className="page-transition">
              {tab === 'overview' && <Dashboard onNavigate={navigate} />}
              {tab === 'crm' && <CRM />}
              {tab === 'data' && <Data />}
              {tab === 'agenda' && <Agenda />}
              {tab === 'settings' && <Settings />}
            </div>
          </Suspense>
        </ErrorBoundary>
      </main>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={navigate} />
      <ShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <GuidedTour open={tourOpen} onClose={() => setTourOpen(false)} onNavigate={navigate} />
    </div>
  );
}
