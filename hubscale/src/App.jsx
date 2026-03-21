import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { T, FONT, getTheme, applyTheme } from './lib/theme.js';
import { GLOBAL_CSS } from './lib/css.js';
import { load, store } from './lib/store.js';
import { Spinner, ErrorBoundary, Btn, Badge, NotificationDot, useToast, ToastContainer } from './components/ui.jsx';
import { t, getLang, setLang, onLangChange, AVAILABLE_LANGS } from './lib/i18n.js';
import { daysSince, daysUntil, ago, forecastCA, businessHealth, fmt } from './lib/utils.js';
import { NOTIFICATION_TYPES, AUTOMATION_RULES } from './lib/constants.js';
import { isInvoiceOverdue } from './lib/utils.js';
import { useNotifications } from './hooks/useNotifications.js';
import { getIntegrationMeta } from './lib/integrationData.js';
import { isAuthenticated, getCurrentUser, logout as authLogout, initAuth, onAuthChange } from './lib/auth.js';
import { listNotifications as fetchServerNotifications, markNotificationRead, markAllNotificationsRead } from './lib/api.js';
import { isSupabaseConfigured } from './lib/supabase.js';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const CRM = lazy(() => import('./pages/CRM.jsx'));
const Data = lazy(() => import('./pages/Data.jsx'));
const Agenda = lazy(() => import('./pages/Agenda.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Legal = lazy(() => import('./pages/Legal.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const Documents = lazy(() => import('./pages/Documents.jsx'));
const Tasks = lazy(() => import('./pages/Tasks.jsx'));
const HelpCenter = lazy(() => import('./pages/HelpCenter.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const Affiliation = lazy(() => import('./pages/Affiliation.jsx'));

const TABS = [
  { id: 'overview', icon: '📊', color: '#f97316' },
  { id: 'crm', icon: '👥', color: '#3b82f6' },
  { id: 'data', icon: '💰', color: '#22c55e' },
  { id: 'documents', icon: '🧾', color: '#06b6d4' },
  { id: 'tasks', icon: '📋', color: '#eab308' },
  { id: 'agenda', icon: '📅', color: '#a855f7' },
  { id: 'analytics', icon: '📈', color: '#6366f1' },
  { id: 'reports', icon: '📑', color: '#f43f5e' },
  { id: 'affiliation', icon: '🎁', color: '#ec4899' },
  { id: 'help', icon: '💡', color: '#14b8a6' },
  { id: 'settings', icon: '⚙️', color: '#71717a' },
];

// --- Session Greeting ---
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return t('greeting.morning');
  if (h < 18) return t('greeting.afternoon');
  return t('greeting.evening');
}

// --- Loading Fallback ---
function LoadingFallback({ page }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 10 }}>
      <Spinner size={24} />
      <span style={{ color: T.textMuted, fontSize: 12 }}>{page ? t('app.loadingPage', { page }) : t('common.loading')}</span>
    </div>
  );
}

// --- useNotifications Hook (extracted to hooks/useNotifications.js) ---
// PLACEHOLDER_REMOVE_START
// --- Notification Center ---
function NotificationCenter({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => load('notifDismissed') || []);
  const [prevCount, setPrevCount] = useState(0);
  const [shaking, setShaking] = useState(false);
  const panelRef = useRef(null);
  const btnRef = useRef(null);
  const computeNotifs = useNotifications();
  const [serverNotifs, setServerNotifs] = useState([]);

  // Fetch server-side notifications when Supabase is configured
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let mounted = true;
    const fetchServer = async () => {
      try {
        const data = await fetchServerNotifications(1);
        if (mounted) {
          setServerNotifs((data.notifications || []).map(n => ({
            id: `srv-${n.id}`,
            serverId: n.id,
            type: n.type || 'tip',
            message: n.message,
            time: n.created_at,
            tab: n.data?.tab || 'overview',
            read: n.read,
            isServer: true,
          })));
        }
      } catch {}
    };
    fetchServer();
    const interval = setInterval(fetchServer, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const localNotifs = computeNotifs();
  const allNotifs = [...serverNotifs, ...localNotifs];
  const unread = allNotifs.filter((n) => n.isServer ? !n.read : !dismissed.includes(n.id));
  const unreadCount = unread.length;

  // Bell shake when count changes (increases)
  useEffect(() => {
    if (unreadCount > prevCount && unreadCount > 0) {
      setShaking(true);
      const timer = setTimeout(() => setShaking(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevCount(unreadCount);
  }, [unreadCount, prevCount]);

  // Update prevCount after shake
  useEffect(() => {
    setPrevCount(unreadCount);
  }, [unreadCount]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const markAllRead = useCallback(() => {
    const allIds = allNotifs.map((n) => n.id);
    setDismissed(allIds);
    store('notifDismissed', allIds);
    // Mark server notifications as read
    if (serverNotifs.some(n => !n.read)) {
      markAllNotificationsRead().then(() => {
        setServerNotifs(prev => prev.map(n => ({ ...n, read: true })));
      }).catch(() => {});
    }
  }, [allNotifs, serverNotifs]);

  const handleNotifClick = useCallback((notif) => {
    onNavigate(notif.tab);
    setOpen(false);
    // Mark server notification as read on click
    if (notif.isServer && !notif.read) {
      markNotificationRead(notif.serverId).then(() => {
        setServerNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      }).catch(() => {});
    }
  }, [onNavigate]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8,
          padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', position: 'relative', fontSize: 15,
        }}
      >
        <span className={shaking ? 'bell-shake' : ''} style={{ display: 'inline-block', lineHeight: 1 }}>
          {'🔔'}
        </span>
        <NotificationDot count={unreadCount} />
      </button>

      {open && (
        <div ref={panelRef} className="notif-panel scale-in" style={{ marginTop: 4 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 10,
                  fontWeight: 600, color: T.accent, fontFamily: FONT, padding: '2px 6px',
                }}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {allNotifs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>
              Aucune notification
            </div>
          ) : (
            <div style={{ padding: 6 }}>
              {allNotifs.map((notif) => {
                const typeInfo = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.alert;
                const isRead = notif.isServer ? notif.read : dismissed.includes(notif.id);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className="hoverable"
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      opacity: isRead ? 0.5 : 1,
                      transition: 'all .15s ease',
                    }}
                  >
                    <span style={{
                      fontSize: 16, width: 28, height: 28, borderRadius: 8,
                      background: typeInfo.bg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0,
                    }}>
                      {typeInfo.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: isRead ? 500 : 600, color: T.text,
                        lineHeight: 1.4, marginBottom: 3,
                      }}>
                        {notif.message}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: T.textMuted }}>{ago(notif.time)}</span>
                        <Badge label={typeInfo.label} color={typeInfo.color} bg={typeInfo.bg} />
                      </div>
                    </div>
                    {!isRead && (
                      <div style={{
                        width: 6, height: 6, borderRadius: 3, background: T.accent,
                        flexShrink: 0, marginTop: 6,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
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
    const invoicesSearch = load('invoices') || [];
    invoicesSearch.filter((inv) => (inv.number || '').toLowerCase().includes(q) || (inv.contactName || '').toLowerCase().includes(q))
      .slice(0, 3).forEach((inv) => items.push({ type: 'facture', label: inv.number, sub: `${inv.contactName || ''} — ${inv.totalTTC || 0}€`, tab: 'data', icon: '📋' }));
    const documentsSearch = load('documents') || [];
    documentsSearch.filter((d) => (d.number || '').toLowerCase().includes(q) || (d.clientName || '').toLowerCase().includes(q))
      .slice(0, 3).forEach((d) => items.push({ type: 'document', label: d.number || 'Document', sub: `${d.clientName || ''} — ${d.type || ''}`, tab: 'documents', icon: '🧾' }));
    const tasksSearch = load('tasks') || [];
    tasksSearch.filter((t) => (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
      .slice(0, 3).forEach((t) => items.push({ type: 'task', label: t.title || 'Tâche', sub: t.status || '', tab: 'tasks', icon: '📋' }));
    [{ label: 'Dashboard', tab: 'overview', icon: '📊' }, { label: 'CRM', tab: 'crm', icon: '👥' },
     { label: 'Data', tab: 'data', icon: '💰' }, { label: 'Documents', tab: 'documents', icon: '🧾' },
     { label: 'Tâches', tab: 'tasks', icon: '📋' }, { label: 'Agenda', tab: 'agenda', icon: '📅' },
     { label: 'Analytics', tab: 'analytics', icon: '📈' }, { label: 'Rapports', tab: 'reports', icon: '📑' },
     { label: 'Aide', tab: 'help', icon: '💡' }, { label: 'Paramètres', tab: 'settings', icon: '⚙️' }]
      .filter((p) => p.label.toLowerCase().includes(q))
      .forEach((p) => items.push({ type: 'page', label: p.label, sub: 'Naviguer', tab: p.tab, icon: p.icon }));
    return items;
  }, [query]);

  if (!open) return null;
  return (
    <div className="fade-in" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '80px 16px', backdropFilter: 'blur(8px)' }}>
      <div className="scale-in" onClick={(e) => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, width: 520, maxWidth: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.5)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 16, color: T.textMuted }}>{'🔍'}</span>
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
  { keys: ['1–6'], desc: 'Naviguer entre les onglets' },
  { keys: ['N'], desc: 'Nouveau (contact dans CRM, événement dans Agenda)' },
  { keys: ['G', 'D'], desc: 'Aller au Dashboard' },
  { keys: ['G', 'C'], desc: 'Aller au CRM' },
  { keys: ['G', 'F'], desc: 'Aller aux Finances (Data)' },
  { keys: ['G', 'A'], desc: 'Aller à l\'Agenda' },
  { keys: ['G', 'R'], desc: 'Aller aux Analytics' },
  { keys: ['G', 'S'], desc: 'Aller aux Paramètres' },
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
          <Btn v="ghost" small onClick={onClose} aria-label="Fermer">{'✕'}</Btn>
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

// --- User Menu (avatar + dropdown) ---
function UserMenu({ user, onLogout, onAdmin }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleEsc); };
  }, [open]);

  if (!user) return null;

  const initials = (user.name || user.email || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu utilisateur"
        style={{
          width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
          background: user.avatar ? 'transparent' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
          border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 700, fontSize: 11, color: '#fff',
          fontFamily: FONT, overflow: 'hidden', flexShrink: 0,
        }}
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" style={{ width: 30, height: 30, objectFit: 'cover' }} />
        ) : initials}
      </button>

      {open && (
        <div className="scale-in" style={{
          position: 'absolute', right: 0, top: 38, width: 220,
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,.4)',
          overflow: 'hidden', zIndex: 200,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: T.textMuted, wordBreak: 'break-all' }}>{user.email}</div>
          </div>
          <div style={{ padding: 6 }}>
            {user.role === 'super_admin' && onAdmin && (
              <button
                onClick={() => { setOpen(false); onAdmin(); }}
                className="hoverable"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 8, background: 'none',
                  border: 'none', cursor: 'pointer', fontFamily: FONT,
                  fontSize: 12, color: T.orange, fontWeight: 600, textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 14 }}>{'⚙️'}</span>
                Panel Admin
              </button>
            )}
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="hoverable"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8, background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: FONT,
                fontSize: 12, color: T.red, fontWeight: 600, textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 14 }}>{'🚪'}</span>
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // view: 'landing' | 'login' | 'checkout' | 'app'
  const [view, setView] = useState(() => isAuthenticated() ? 'app' : 'landing');
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [tab, setTab] = useState('overview');
  const [onboarded, setOnboarded] = useState(() => load('onboarded') === true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [pageKey, setPageKey] = useState(0);
  const [lang, setLangState] = useState(getLang);
  const [transitionPhase, setTransitionPhase] = useState('visible');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  const mainRef = useRef(null);
  const chordKeyTimestamp = useRef(0);
  const [chordPending, setChordPending] = useState(false);
  const chordTimerRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (!document.getElementById('hs-css')) {
      const style = document.createElement('style');
      style.id = 'hs-css';
      style.textContent = GLOBAL_CSS;
      document.head.appendChild(style);
    }
  }, []);

  // Activate enterprise plan ONLY in demo mode (no Supabase) — full access to all features
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      store('plan', 'enterprise');
      store('payment_method', true);
    }
  }, []);

  // Initialize auth (async — restores session, fetches profile)
  useEffect(() => {
    initAuth().then((u) => {
      if (u) {
        setUser(u);
        setAuthed(true);
        setView('app');
      }
      setAuthLoading(false);
    }).catch(() => setAuthLoading(false));
  }, []);

  // Listen for password recovery events from Supabase
  useEffect(() => {
    const unsub = onAuthChange((event) => {
      if (event === 'password_recovery') {
        setView('reset-password');
      }
    });
    return unsub;
  }, []);

  // Listen for integration sync events and show toasts
  useEffect(() => {
    const handleSync = (e) => {
      const { name, action } = e.detail || {};
      if (!name) return;
      if (action === 'connect') toast.add(`${name} connecté avec succès`, 'success');
      else if (action === 'resync') toast.add(`${name} re-synchronisé`, 'info');
      else if (action === 'disconnect') toast.add(`${name} déconnecté`, 'warning');
    };
    window.addEventListener('hs:integration-sync', handleSync);
    return () => window.removeEventListener('hs:integration-sync', handleSync);
  }, [toast]);

  // Sync lang state with i18n module
  useEffect(() => onLangChange(setLangState), []);

  // Online/offline tracking
  useEffect(() => {
    const goOnline = () => { setIsOnline(true); setOfflineDismissed(false); };
    const goOffline = () => { setIsOnline(false); setOfflineDismissed(false); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const handleAuth = useCallback((u) => {
    setUser(u);
    setAuthed(true);
    setView('app');
  }, []);

  const handleLogout = useCallback(async () => {
    await authLogout();
    setUser(null);
    setAuthed(false);
    setView('landing');
  }, []);

  const navigate = useCallback((tabId) => {
    setTab(tabId);
    setPageKey((k) => k + 1);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen for checkout event from PremiumGate / TrialBanner
  useEffect(() => {
    const goCheckout = () => { setCheckoutPlan(null); setView('checkout'); };
    window.addEventListener('hs:checkout', goCheckout);
    return () => window.removeEventListener('hs:checkout', goCheckout);
  }, []);

  // Global keyboard shortcuts: Cmd+K (search), Cmd+? (shortcuts help), 1-5 (tabs), N (new)
  useEffect(() => {
    if (!authed) return;
    const handleKey = (e) => {
      // Skip if user is typing in an input/textarea/select
      const tag = document.activeElement?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if ((e.metaKey || e.ctrlKey) && (e.key === '?' || (e.shiftKey && e.key === '/'))) { e.preventDefault(); setShortcutsOpen(true); }

      // Number shortcuts 1-5 for tab navigation (only when not typing)
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tabKeys = { '1': 'overview', '2': 'crm', '3': 'data', '4': 'agenda', '5': 'analytics', '6': 'settings' };
        if (tabKeys[e.key]) {
          e.preventDefault();
          setTab(tabKeys[e.key]);
          setPageKey((k) => k + 1);
        }
        // N for new (context-dependent)
        if (e.key === 'n' || e.key === 'N') {
          // Dispatch a custom event so child pages can pick it up
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('hs:shortcut-new'));
        }

        // Chord shortcuts: G then D/C/F/A/S (GitHub-style)
        const chordTargets = { d: 'overview', c: 'crm', f: 'data', a: 'agenda', r: 'analytics', s: 'settings' };
        const lowerKey = e.key.toLowerCase();

        if (lowerKey === 'g') {
          chordKeyTimestamp.current = Date.now();
          setChordPending(true);
          if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
          chordTimerRef.current = setTimeout(() => setChordPending(false), 1000);
        } else if (chordTargets[lowerKey] && (Date.now() - chordKeyTimestamp.current) < 1000) {
          e.preventDefault();
          chordKeyTimestamp.current = 0;
          setChordPending(false);
          if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
          navigate(chordTargets[lowerKey]);
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [authed, navigate]);

  const handleOnboardingComplete = useCallback(() => {
    store('onboarded', true);
    setOnboarded(true);
    if (!load('tourDone')) setTourOpen(true);
  }, []);

  const handleTabChange = useCallback((tabId) => {
    // Trigger a brief opacity flash for smoother perceived transition
    setTransitionPhase('exiting');
    setTimeout(() => {
      setTab(tabId);
      setPageKey((k) => k + 1);
      setTransitionPhase('entering');
      window.scrollTo(0, 0);
      setTimeout(() => setTransitionPhase('visible'), 30);
    }, 80);
  }, []);

  const handleLangToggle = useCallback(() => {
    const next = getLang() === 'fr' ? 'en' : 'fr';
    setLang(next);
  }, []);

  const greeting = getGreeting();

  // Compute page transition style
  const transitionStyle = transitionPhase === 'exiting'
    ? { opacity: 0, transform: 'translateY(4px)', transition: 'opacity 80ms ease, transform 80ms ease' }
    : transitionPhase === 'entering'
    ? { opacity: 0, transform: 'translateY(6px)' }
    : {};

  // ─── View routing (all hooks are declared above, safe from Rules of Hooks) ───

  // Referral link handling: /r/:slug — capture slug, track click, and redirect to homepage
  const refMatch = window.location.pathname.match(/^\/r\/([^/]+)$/);
  if (refMatch) {
    const slug = refMatch[1];
    // Persist referral slug so checkout can attribute the referral
    store('ref_slug', slug);
    store('ref_captured_at', new Date().toISOString());
    // Record click locally
    const clicks = load('ref_clicks') || [];
    clicks.push({ slug, at: new Date().toISOString(), ua: navigator.userAgent });
    store('ref_clicks', clicks);
    // Track click server-side (so affiliate dashboard shows it)
    fetch('/api/affiliate?action=track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(() => {});
    // Redirect to homepage immediately
    window.history.replaceState(null, '', '/');
  }

  // Auth loading
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={32} />
      </div>
    );
  }

  // Legal pages (CGU / Privacy)
  if (view === 'legal') {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
        <Suspense fallback={<LoadingFallback />}>
          <Legal onBack={() => setView(authed ? 'app' : 'landing')} />
        </Suspense>
      </div>
    );
  }

  // Landing page
  if (view === 'landing' && !authed) {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', background: T.bg }} />}>
        <Landing
          onLogin={() => setView('login')}
          onSignup={(planId) => { setCheckoutPlan(planId || null); setView('checkout'); }}
        />
      </Suspense>
    );
  }

  // Checkout (plan + CB + account creation)
  if (view === 'checkout' && !authed) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
        <Suspense fallback={<LoadingFallback />}>
          <Checkout onAuth={handleAuth} onBack={() => setView('landing')} preselectedPlan={checkoutPlan} />
        </Suspense>
      </div>
    );
  }

  // Password reset (renders even when authed, since recovery session makes user "authenticated")
  if (view === 'reset-password') {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
        <Suspense fallback={<LoadingFallback />}>
          <ResetPassword onBack={() => setView(authed ? 'overview' : 'login')} />
        </Suspense>
      </div>
    );
  }

  // Login only (existing users)
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
        <Suspense fallback={<LoadingFallback />}>
          <Login onAuth={handleAuth} initialMode="login" onBack={() => setView('landing')} onForgotPassword={() => setView('reset-password')} />
        </Suspense>
      </div>
    );
  }

  // Onboarding
  if (!onboarded) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
        <Suspense fallback={<LoadingFallback />}>
          <Onboarding onComplete={handleOnboardingComplete} />
        </Suspense>
      </div>
    );
  }

  // Admin Panel (super_admin only)
  if (view === 'admin' && user?.role === 'super_admin') {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
        <Suspense fallback={<LoadingFallback page="Admin" />}>
          <Admin user={user} onBack={() => setView('app')} />
        </Suspense>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
      {/* Skip nav (a11y) */}
      <a href="#main-content" className="skip-nav" style={{ fontFamily: FONT }}>{t('app.skipNav')}</a>

      <nav role="navigation" aria-label="Navigation principale" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: getTheme() === 'light' ? 'rgba(255,255,255,.92)' : 'rgba(9,9,11,.9)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${getTheme() === 'light' ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.06)'}`,
        padding: '0 20px',
        transition: 'background .3s ease, border-color .3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #f97316, #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0,
              boxShadow: '0 2px 12px rgba(249,115,22,.25)',
            }}>H</div>
            <div className="hide-mobile">
              <div style={{ fontWeight: 800, fontSize: 14, color: T.text, lineHeight: 1.2, letterSpacing: -.3 }}>HubScale</div>
              <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: .5, textTransform: 'uppercase' }}>{t('app.clientPortal')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleLangToggle} aria-label={t('lang.label')} title={t('lang.label')}
              style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: T.textMuted, fontFamily: FONT }}>
              {getLang().toUpperCase()}
            </button>
            <button onClick={() => setSearchOpen(true)} aria-label="Recherche globale"
              style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: T.textMuted }}>{'🔍'}</span>
              <span className="hide-mobile" style={{ fontSize: 11, color: T.textMuted }}>{t('common.search').replace('...', '')}</span>
              <kbd className="hide-mobile" style={{ fontSize: 9, color: T.textMuted, background: T.bg, padding: '1px 4px', borderRadius: 3, border: `1px solid ${T.border}`, marginLeft: 4 }}>{'⌘'}K</kbd>
            </button>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <NotificationCenter onNavigate={navigate} />
              <div
                title={isOnline ? t('app.connected') : t('app.offlineStatus')}
                style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 8, height: 8, borderRadius: '50%',
                  background: isOnline ? T.green : T.red,
                  border: '2px solid rgba(9,9,11,.85)',
                  boxShadow: isOnline ? `0 0 6px ${T.green}66` : `0 0 6px ${T.red}66`,
                  transition: 'background .3s ease, box-shadow .3s ease',
                  pointerEvents: 'none',
                }}
              />
            </div>
            {!load('tourDone') && <button onClick={() => setTourOpen(true)} aria-label={t('app.guidedTour')} style={{ background: T.orangeBg, border: `1px solid ${T.orange}33`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: T.orange, fontFamily: FONT }}>Tour</button>}
            <UserMenu user={user} onLogout={handleLogout} onAdmin={() => setView('admin')} />
          </div>
        </div>

        <div className="nav-tab-bar" role="tablist">
          {TABS.map((tb) => {
            const active = tab === tb.id;
            return (
              <button
                key={tb.id}
                role="tab"
                aria-selected={active}
                aria-label={t(`nav.${tb.id}`)}
                className="nav-tab"
                onClick={() => handleTabChange(tb.id)}
                style={active ? {
                  background: `${tb.color}18`,
                  borderColor: `${tb.color}30`,
                  color: T.text,
                  fontWeight: 700,
                } : undefined}
              >
                <span className="tab-icon" style={active ? {
                  background: `${tb.color}25`,
                  borderColor: `${tb.color}40`,
                  boxShadow: `0 0 12px ${tb.color}20`,
                } : undefined}>
                  {tb.icon}
                </span>
                {t(`nav.${tb.id}`)}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Offline banner */}
      {!isOnline && !offlineDismissed && (
        <div className="fade-up" style={{
          position: 'sticky', top: 48, zIndex: 99,
          background: T.orangeBg, borderBottom: `1px solid ${T.orange}44`,
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          animation: 'slideDown .3s ease',
        }}>
          <span style={{ fontSize: 14 }}>{'⚠️'}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.orange }}>
            {t('app.offline')}
          </span>
          <button
            onClick={() => setOfflineDismissed(true)}
            aria-label={t('common.close')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, color: T.orange, padding: '2px 6px', borderRadius: 4,
              fontFamily: FONT, fontWeight: 700, marginLeft: 8, lineHeight: 1,
            }}
          >
            {'✕'}
          </button>
        </div>
      )}

      <main id="main-content" ref={mainRef} className="page-pad" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 60px', overflowX: 'hidden' }}>
        <ErrorBoundary fallbackTitle={t('app.errorIn', { page: t(`nav.${tab}`) })}>
          <Suspense fallback={<LoadingFallback page={t(`nav.${tab}`)} />}>
            <div key={pageKey} className="page-transition" style={{ ...transitionStyle, minWidth: 0 }}>
              {tab === 'overview' && <Dashboard onNavigate={navigate} greeting={greeting} />}
              {tab === 'crm' && <CRM />}
              {tab === 'data' && <Data />}
              {tab === 'documents' && <Documents />}
              {tab === 'tasks' && <Tasks />}
              {tab === 'agenda' && <Agenda />}
              {tab === 'analytics' && <Analytics onNavigate={navigate} />}
              {tab === 'reports' && <Reports />}
              {tab === 'affiliation' && <Affiliation />}
              {tab === 'help' && <HelpCenter />}
              {tab === 'settings' && <Settings />}
            </div>
          </Suspense>
        </ErrorBoundary>
      </main>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={navigate} />
      <ShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <GuidedTour open={tourOpen} onClose={() => setTourOpen(false)} onNavigate={navigate} />
      <ToastContainer toasts={toast.toasts} />

      {/* Chord indicator toast */}
      {chordPending && (
        <div className="fade-in" style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1300, background: T.surface2, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: '6px 16px', boxShadow: '0 8px 24px rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none',
        }}>
          <kbd style={{
            fontSize: 13, fontWeight: 700, color: T.accent, background: T.bg,
            padding: '2px 8px', borderRadius: 5, border: `1px solid ${T.border}`,
            fontFamily: FONT,
          }}>G</kbd>
          <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>...</span>
        </div>
      )}
    </div>
  );
}
