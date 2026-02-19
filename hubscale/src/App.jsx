import React, { useState, useEffect } from 'react';
import { T, FONT } from './lib/theme.js';
import { GLOBAL_CSS } from './lib/css.js';
import { load, store } from './lib/store.js';
import Dashboard from './pages/Dashboard.jsx';
import CRM from './pages/CRM.jsx';
import Data from './pages/Data.jsx';
import Agenda from './pages/Agenda.jsx';
import Settings from './pages/Settings.jsx';
import Onboarding from './pages/Onboarding.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'crm', label: 'CRM', icon: '👥' },
  { id: 'data', label: 'Data', icon: '💰' },
  { id: 'agenda', label: 'Agenda', icon: '📅' },
  { id: 'settings', label: 'Paramètres', icon: '⚙️' },
];

const PAGE_MAP = {
  overview: Dashboard,
  crm: CRM,
  data: Data,
  agenda: Agenda,
  settings: Settings,
};

export default function App() {
  const [tab, setTab] = useState('overview');
  const [onboarded, setOnboarded] = useState(() => load('onboarded') === true);

  useEffect(() => {
    if (!document.getElementById('hs-css')) {
      const style = document.createElement('style');
      style.id = 'hs-css';
      style.textContent = GLOBAL_CSS;
      document.head.appendChild(style);
    }
  }, []);

  const handleOnboardingComplete = () => {
    store('onboarded', true);
    setOnboarded(true);
  };

  if (!onboarded) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const Page = PAGE_MAP[tab];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
      <nav style={{
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
            <span style={{
              fontSize: 9, fontWeight: 700, color: T.orange, border: `1px solid ${T.orange}44`,
              borderRadius: 4, padding: '2px 6px', letterSpacing: .5,
            }}>PREVIEW</span>
          </div>
        </div>

        <div className="nav-tabs-scroll" style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
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
        <Page />
      </main>
    </div>
  );
}
