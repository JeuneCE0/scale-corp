import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { T, getTheme, applyTheme } from '../lib/theme.js';
import { store, load } from '../lib/store.js';
import { isValidEmail } from '../lib/utils.js';
import { Card, Section, Btn, Inp, Sel, TabBar, Toggle, ConfirmDialog, Badge, ProgressBar, PremiumGate, Modal } from '../components/ui.jsx';
import { canAccessPro, getPlan, isPaid, getTrialInfo } from '../lib/plan.js';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import { SECTORS, PLANS, INTEGRATIONS, AUTOMATION_RULES } from '../lib/constants.js';
import { onIntegrationConnect, getIntegrationMeta } from '../lib/integrationData.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { t } from '../lib/i18n.js';
import { startOAuthFlow, disconnectIntegration as apiDisconnect, syncIntegration, connectWithApiKey, requestDataExport, requestAccountDeletion, createBillingPortalSession } from '../lib/api.js';
import { setIntegrationConnected, fetchAllSyncedData } from '../lib/db.js';
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeUrl } from '../lib/sanitize.js';
import DataExportTab from './settings/DataExportTab.jsx';

function getIntegrationCategories() {
  return [
    { label: t('settings.catAll'), cat: null },
    { label: t('settings.catPayments'), cat: 'paiements' },
    { label: t('settings.catBank'), cat: 'banque' },
    { label: t('settings.catAgenda'), cat: 'agenda' },
    { label: t('settings.catCRM'), cat: 'crm' },
    { label: t('settings.catMarketing'), cat: 'marketing' },
    { label: t('settings.catProject'), cat: 'projet' },
    { label: t('settings.catAds'), cat: 'publicite' },
    { label: t('settings.catSupport'), cat: 'support' },
  ];
}

function getSubTabs() {
  return [
    { key: 'account', label: t('settings.account') },
    { key: 'users', label: t('settings.users') },
    { key: 'billing', label: t('settings.billing') },
    { key: 'integrations', label: t('settings.integrations') },
    { key: 'automations', label: t('settings.automations') },
    { key: 'dataExport', label: t('settings.dataExport') },
    { key: 'gdpr', label: t('settings.gdpr') },
  ];
}

const ACCENT_COLORS = [
  { name: 'Orange', value: '#f97316' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Red', value: '#ef4444' },
];

function getLocalStorageSize() {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      total += (key.length + value.length) * 2; // UTF-16 = 2 bytes per char
    }
    return total;
  } catch {
    return 0;
  }
}

export default function Settings() {
  const SUB_TABS = useMemo(() => getSubTabs(), []);
  const INTEGRATION_CATEGORIES = useMemo(() => getIntegrationCategories(), []);
  const [subTab, setSubTab] = useState('account');
  const [company, setCompany] = useState(() => load('settings_company') || {
    name: '', siret: '', tva: '', sector: '', address: '', city: '', zip: '', email: '', phone: '', website: '',
  });
  const [savedCompany, setSavedCompany] = useState(false);
  const [integrations, setIntegrations] = useState(() => load('integrations') || {});
  const [annual, setAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(() => load('plan') || 'professional');
  const [users, setUsers] = useState(() => load('users') || [
    { name: 'Admin', email: 'admin@entreprise.fr', role: 'Owner' },
  ]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [theme, setTheme] = useState(() => getTheme());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Logo upload state
  const [logo, setLogo] = useState(() => load('settings_logo'));
  const logoInputRef = useRef(null);

  // Accent color state
  const [accentColor, setAccentColor] = useState(() => load('settings_accentColor') || '#f97316');

  // Integration connection timestamps
  const [integrationTimestamps, setIntegrationTimestamps] = useState(() => load('integrationTimestamps') || {});

  // Integration toggle animation tracking
  const [bouncingIntegration, setBouncingIntegration] = useState(null);

  // Integration search & filter
  const [integrationSearch, setIntegrationSearch] = useState('');
  const [integrationCatFilter, setIntegrationCatFilter] = useState(null);

  // Integration detail modal
  const [detailModal, setDetailModal] = useState(null); // integration name or null

  // API key connection modal
  const [connectModal, setConnectModal] = useState(null); // integration name or null
  const [connectKey, setConnectKey] = useState('');
  const [connectUrl, setConnectUrl] = useState('');
  const [connectError, setConnectError] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);

  // Sync history log
  const [syncHistory, setSyncHistory] = useState(() => load('syncHistory') || []);

  // API Logs state
  const [apiLogs, setApiLogs] = useState(() => load('apiLogs') || []);

  // OAuth callback detection: after redirect from OAuth provider
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthResult = params.get('oauth');
    const integrationName = params.get('integration');
    if (!oauthResult) return;

    // Clean URL params
    const cleanUrl = window.location.pathname;
    window.history.replaceState(null, '', cleanUrl);

    if (oauthResult === 'success' && integrationName) {
      // Mark as connected locally
      setIntegrations((prev) => {
        const updated = { ...prev, [integrationName]: true };
        store('integrations', updated);
        return updated;
      });
      setIntegrationTimestamps((prev) => {
        const updated = { ...prev, [integrationName]: new Date().toISOString() };
        store('integrationTimestamps', updated);
        return updated;
      });

      // Find integration tier
      const integDef = INTEGRATIONS.find((ig) => ig.name.toLowerCase() === integrationName.toLowerCase());
      const isLive = integDef?.tier === 'live';

      // Trigger sync + data fetch for live integrations
      setSyncStatus((prev) => ({ ...prev, [integrationName]: 'syncing' }));
      (async () => {
        try {
          if (isLive) {
            const syncResult = await syncIntegration(integrationName);
            if (syncResult?.data) storeSyncData(syncResult.data);
            await fetchAllSyncedData().catch(() => {});
          }
          try { await setIntegrationConnected(integrationName, true); } catch {}
        } catch (err) {
          console.warn(`[sync] ${integrationName}:`, err.message);
          setSyncStatus((prev) => ({ ...prev, [integrationName]: { status: 'error', message: err.message } }));
          setTimeout(() => setSyncStatus((prev) => ({ ...prev, [integrationName]: null })), 5000);
          return;
        }
        setSyncStatus((prev) => ({ ...prev, [integrationName]: 'done' }));
        setSyncHistory((prev) => {
          const entry = { name: integrationName, action: 'connect', timestamp: new Date().toISOString() };
          const updated = [entry, ...prev].slice(0, 50);
          store('syncHistory', updated);
          return updated;
        });
        window.dispatchEvent(new CustomEvent('hs:integration-sync', { detail: { name: integrationName, action: 'connect' } }));
        setTimeout(() => setSyncStatus((prev) => ({ ...prev, [integrationName]: null })), 2000);
      })();

      // Navigate to integrations sub-tab
      setSubTab('integrations');
    } else if (oauthResult === 'error') {
      console.error('[oauth] Callback error:', params.get('error'));
      setSubTab('integrations');
    }
  }, []);

  const removeUser = useCallback((email) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.email !== email);
      store('users', updated);
      return updated;
    });
  }, []);
  const del = useConfirmDialog(removeUser);

  const upd = useCallback((k, v) => setCompany((prev) => ({ ...prev, [k]: v })), []);

  const saveCompany = useCallback(() => {
    const sanitized = {
      ...company,
      name: sanitizeText(company.name, 200),
      siret: sanitizeText(company.siret, 50),
      tva: sanitizeText(company.tva, 50),
      address: sanitizeText(company.address, 300),
      city: sanitizeText(company.city, 100),
      zip: sanitizeText(company.zip, 20),
      email: sanitizeEmail(company.email) || company.email,
      phone: sanitizePhone(company.phone),
      website: sanitizeUrl(company.website) || company.website,
    };
    store('settings_company', sanitized);
    setCompany(sanitized);
    setSavedCompany(true);
    setTimeout(() => setSavedCompany(false), 2000);
  }, [company]);

  const [syncStatus, setSyncStatus] = useState({});

  // Store sync response data directly into localStorage
  const storeSyncData = useCallback((data) => {
    if (!data || typeof data !== 'object') return;
    if (data.contacts?.length) {
      const existing = load('contacts') || [];
      const byId = new Map(existing.map((c) => [c.external_id || c.email || c.name, c]));
      data.contacts.forEach((c) => byId.set(c.external_id || c.email || c.name, c));
      store('contacts', Array.from(byId.values()));
    }
    if (data.transactions?.length) {
      store('transactions', data.transactions);
      // Merge into finHistory monthly buckets (key/ca/charges/marge/treso format)
      const existing = load('finHistory') || [];
      const monthMap = {};
      existing.forEach((r) => { monthMap[r.key] = { ...r }; });
      data.transactions.forEach((tx) => {
        const d = new Date(tx.created_at || tx.date || Date.now());
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthMap[key]) monthMap[key] = { key, ca: 0, charges: 0, marge: 0, treso: 0 };
        const amount = Number(tx.amount) || 0;
        if (amount >= 0) monthMap[key].ca += amount;
        else monthMap[key].charges += Math.abs(amount);
      });
      Object.values(monthMap).forEach((r) => {
        r.marge = r.ca - r.charges;
        r.result = r.marge;
      });
      const finHistory = Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key));
      if (finHistory.length) store('finHistory', finHistory);
    }
    if (data.events?.length) {
      store('events', data.events);
    }
    if (data.deals?.length) {
      store('deals', data.deals);
    }
    if (data.adInsights?.length) {
      store('metaAds', data.adInsights);
    }
    if (data.balance) {
      store('stripeBalance', data.balance);
    }
    if (data.bankAccounts?.length) {
      store('bankAccounts', data.bankAccounts);
      // Update latest treso in finHistory from real bank balances
      const totalBalance = data.bankAccounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
      if (totalBalance > 0) {
        const finHistory = load('finHistory') || [];
        if (finHistory.length > 0) {
          finHistory[finHistory.length - 1].treso = totalBalance;
          store('finHistory', finHistory);
        }
      }
    }
  }, []);

  // Filtered integrations based on search + category
  const filteredIntegrations = useMemo(() => {
    let list = INTEGRATIONS;
    if (integrationCatFilter) {
      list = list.filter((ig) => ig.category === integrationCatFilter);
    }
    if (integrationSearch.trim()) {
      const q = integrationSearch.trim().toLowerCase();
      list = list.filter((ig) => ig.name.toLowerCase().includes(q) || ig.desc.toLowerCase().includes(q) || ig.category.toLowerCase().includes(q));
    }
    return list;
  }, [integrationSearch, integrationCatFilter]);

  // Handle successful connection after API key or OAuth
  const finalizeConnection = useCallback((name) => {
    setIntegrations((prev) => {
      const updated = { ...prev, [name]: true };
      store('integrations', updated);
      return updated;
    });
    setIntegrationTimestamps((prev) => {
      const updated = { ...prev, [name]: new Date().toISOString() };
      store('integrationTimestamps', updated);
      return updated;
    });
    setSyncStatus((prev) => ({ ...prev, [name]: 'done' }));
    setSyncHistory((prev) => {
      const entry = { name, action: 'connect', timestamp: new Date().toISOString() };
      const updated = [entry, ...prev].slice(0, 50);
      store('syncHistory', updated);
      return updated;
    });
    window.dispatchEvent(new CustomEvent('hs:integration-sync', { detail: { name, action: 'connect' } }));
    setTimeout(() => setSyncStatus((prev) => ({ ...prev, [name]: null })), 2000);
  }, []);

  // Integrations that require a URL alongside the API key
  const URL_REQUIRED_INTEGRATIONS = ['ActiveCampaign', 'Shopify', 'Salesforce'];

  // Submit API key connection from modal
  const submitApiKeyConnection = useCallback(async (name) => {
    if (!connectKey.trim()) { setConnectError('Veuillez entrer votre clé API'); return; }
    if (URL_REQUIRED_INTEGRATIONS.includes(name) && !connectUrl.trim()) {
      const labels = { ActiveCampaign: 'l\'URL API ActiveCampaign', Shopify: 'le domaine de votre boutique Shopify', Salesforce: 'l\'URL d\'instance Salesforce' };
      setConnectError(`Veuillez renseigner ${labels[name] || 'l\'URL requise'}`);
      return;
    }
    setConnectLoading(true);
    setConnectError('');
    try {
      // Always try the real API first
      await connectWithApiKey(name, connectKey.trim(), connectUrl.trim() || undefined);
      setSyncStatus((prev) => ({ ...prev, [name]: 'syncing' }));
      try {
        const syncResult = await syncIntegration(name);
        if (syncResult?.data) storeSyncData(syncResult.data);
      } catch (syncErr) {
        console.warn(`[sync] ${name}:`, syncErr.message);
      }
      try { await setIntegrationConnected(name, true); } catch {}
      finalizeConnection(name);
      setConnectModal(null);
      setConnectKey('');
      setConnectUrl('');
    } catch (err) {
      setConnectError(err.message || 'Erreur de connexion');
    } finally {
      setConnectLoading(false);
    }
  }, [connectKey, connectUrl, finalizeConnection, storeSyncData]);

  const toggleIntegration = useCallback(async (name) => {
    setBouncingIntegration(name);
    setTimeout(() => setBouncingIntegration(null), 400);

    const wasOff = !integrations[name];
    const integDef = INTEGRATIONS.find((ig) => ig.name === name);
    const isLive = integDef?.tier === 'live' || integDef?.tier === 'oauth';

    if (wasOff && isLive) {
      // Try OAuth first
      setSyncStatus((prev) => ({ ...prev, [name]: 'syncing' }));
      try {
        const result = await startOAuthFlow(name);
        if (result.url) {
          window.location.href = result.url;
          return;
        }
      } catch (err) {
        console.warn(`[oauth] ${name}: ${err.message}`);
      }
      setSyncStatus((prev) => ({ ...prev, [name]: null }));
      // OAuth not available — open API key modal
      setConnectModal(name);
      setConnectKey('');
      setConnectUrl('');
      setConnectError('');
      return;
    }

    if (!wasOff) {
      // Disconnect
      if (isLive) {
        try {
          await apiDisconnect(name);
          await setIntegrationConnected(name, false);
        } catch {}
      }
      setIntegrations((prev) => {
        const updated = { ...prev, [name]: false };
        store('integrations', updated);
        return updated;
      });
      setSyncHistory((prev) => {
        const entry = { name, action: 'disconnect', timestamp: new Date().toISOString() };
        const updated = [entry, ...prev].slice(0, 50);
        store('syncHistory', updated);
        return updated;
      });
      window.dispatchEvent(new CustomEvent('hs:integration-sync', { detail: { name, action: 'disconnect' } }));
      return;
    }

    // Demo-tier connect: seed demo data locally
    setIntegrations((prev) => {
      const updated = { ...prev, [name]: true };
      store('integrations', updated);
      return updated;
    });
    setIntegrationTimestamps((prev) => {
      const updated = { ...prev, [name]: new Date().toISOString() };
      store('integrationTimestamps', updated);
      return updated;
    });
    setSyncStatus((prev) => ({ ...prev, [name]: 'syncing' }));
    setTimeout(() => {
      onIntegrationConnect(name);
      setSyncStatus((prev) => ({ ...prev, [name]: 'done' }));
      setSyncHistory((prev) => {
        const entry = { name, action: 'connect', timestamp: new Date().toISOString() };
        const updated = [entry, ...prev].slice(0, 50);
        store('syncHistory', updated);
        return updated;
      });
      window.dispatchEvent(new CustomEvent('hs:integration-sync', { detail: { name, action: 'connect' } }));
      setTimeout(() => setSyncStatus((prev) => ({ ...prev, [name]: null })), 2000);
    }, 800);
  }, [integrations]);

  // Re-sync an integration — always try real API
  const resyncIntegration = useCallback(async (name) => {
    setSyncStatus((prev) => ({ ...prev, [name]: 'syncing' }));

    try {
      const syncResult = await syncIntegration(name);
      if (syncResult?.data) storeSyncData(syncResult.data);
      // Also pull fresh data from Supabase to ensure all tables are in sync
      await fetchAllSyncedData().catch(() => {});
    } catch (err) {
      console.warn(`[resync] ${name}:`, err.message);
      setSyncStatus((prev) => ({ ...prev, [name]: { status: 'error', message: err.message } }));
      setTimeout(() => setSyncStatus((prev) => ({ ...prev, [name]: null })), 5000);
      return;
    }

    setSyncStatus((prev) => ({ ...prev, [name]: 'done' }));
    setSyncHistory((prev) => {
      const entry = { name, action: 'resync', timestamp: new Date().toISOString() };
      const updated = [entry, ...prev].slice(0, 50);
      store('syncHistory', updated);
      return updated;
    });
    window.dispatchEvent(new CustomEvent('hs:integration-sync', { detail: { name, action: 'resync' } }));
    setTimeout(() => setSyncStatus((prev) => ({ ...prev, [name]: null })), 2000);
  }, [storeSyncData]);

  const selectPlan = useCallback((id) => {
    setSelectedPlan(id);
    store('plan', id);
  }, []);

  const [inviteError, setInviteError] = useState('');

  const inviteUser = useCallback(() => {
    if (!inviteEmail.trim()) return;
    if (!isValidEmail(inviteEmail)) { setInviteError('Format email invalide'); return; }
    if (users.some((u) => u.email.toLowerCase() === inviteEmail.trim().toLowerCase())) { setInviteError('Utilisateur déjà ajouté'); return; }
    setUsers((prev) => {
      const updated = [...prev, { name: inviteEmail.split('@')[0], email: inviteEmail, role: 'Membre' }];
      store('users', updated);
      return updated;
    });
    setInviteEmail('');
    setInviteError('');
  }, [inviteEmail, users]);

  // Logo upload handler
  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      store('settings_logo', base64);
      setLogo(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const removeLogo = useCallback(() => {
    store('settings_logo', null);
    setLogo(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  }, []);

  // Accent color handler
  const selectAccentColor = useCallback((color) => {
    setAccentColor(color);
    store('settings_accentColor', color);
  }, []);

  // Usage stats
  const usageStats = useMemo(() => {
    const contacts = load('contacts') || [];
    const events = load('events') || [];
    const finHistory = load('finHistory') || [];
    const storageBytes = getLocalStorageSize();
    const storageKB = Math.round(storageBytes / 1024);
    return {
      contacts: contacts.length,
      events: events.length,
      months: finHistory.length,
      users: users.length,
      storageKB,
    };
  }, [users]);

  // generateFinancialReport, exportData, exportIntegrationsCSV moved to DataExportTab
  // --- API Log Helpers ---
  const API_LOG_ENDPOINTS = {
    paiements: (name) => [`/api/v1/${name.toLowerCase()}/transactions`, `/api/v1/${name.toLowerCase()}/invoices`, `/api/v1/${name.toLowerCase()}/payments`],
    banque: (name) => [`/api/v1/${name.toLowerCase()}/balance`, `/api/v1/${name.toLowerCase()}/statements`, `/api/v1/${name.toLowerCase()}/accounts`],
    crm: (name) => [`/api/v1/${name.toLowerCase()}/contacts`, `/api/v1/${name.toLowerCase()}/deals`, `/api/v1/${name.toLowerCase()}/companies`],
    marketing: (name) => [`/api/v1/${name.toLowerCase()}/campaigns`, `/api/v1/${name.toLowerCase()}/subscribers`, `/api/v1/${name.toLowerCase()}/analytics`],
    agenda: (name) => [`/api/v1/${name.toLowerCase().replace(/\s+/g, '-')}/events`, `/api/v1/${name.toLowerCase().replace(/\s+/g, '-')}/calendars`],
    projet: (name) => [`/api/v1/${name.toLowerCase()}/tasks`, `/api/v1/${name.toLowerCase()}/projects`, `/api/v1/${name.toLowerCase()}/boards`],
    publicite: (name) => [`/api/v1/${name.toLowerCase().replace(/\s+/g, '-')}/campaigns`, `/api/v1/${name.toLowerCase().replace(/\s+/g, '-')}/adsets`, `/api/v1/${name.toLowerCase().replace(/\s+/g, '-')}/metrics`],
    support: (name) => [`/api/v1/${name.toLowerCase()}/tickets`, `/api/v1/${name.toLowerCase()}/conversations`, `/api/v1/${name.toLowerCase()}/agents`],
  };

  const generateApiLogEntry = useCallback((integrationName) => {
    const ig = INTEGRATIONS.find((i) => i.name === integrationName);
    if (!ig) return null;
    const endpoints = (API_LOG_ENDPOINTS[ig.category] || API_LOG_ENDPOINTS.crm)(ig.name);
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const methods = ['GET', 'POST', 'PUT'];
    const methodWeights = [0.6, 0.3, 0.1];
    const r = Math.random();
    const method = r < methodWeights[0] ? methods[0] : r < methodWeights[0] + methodWeights[1] ? methods[1] : methods[2];
    const statusRoll = Math.random();
    const status = statusRoll < 0.7 ? 200 : statusRoll < 0.9 ? 201 : statusRoll < 0.95 ? 400 : 500;
    const responseTime = Math.floor(Math.random() * 271) + 80; // 80-350ms
    const now = new Date();
    const offset = Math.floor(Math.random() * 3600000); // random offset up to 1h
    const timestamp = new Date(now.getTime() - offset).toISOString();
    return {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp,
      integration: ig.name,
      icon: ig.icon,
      method,
      endpoint,
      status,
      responseTime,
    };
  }, []);

  // Generate initial logs from syncHistory on first render
  const initialApiLogs = useMemo(() => {
    if (apiLogs.length > 0) return apiLogs;
    const connectedNames = Object.entries(integrations).filter(([, v]) => v).map(([k]) => k);
    if (connectedNames.length === 0) return [];
    const logs = [];
    connectedNames.forEach((name) => {
      const count = Math.floor(Math.random() * 4) + 2; // 2-5 logs per integration
      for (let i = 0; i < count; i++) {
        const entry = generateApiLogEntry(name);
        if (entry) {
          // Spread timestamps over the last 24h
          const ago = Math.floor(Math.random() * 86400000);
          entry.timestamp = new Date(Date.now() - ago).toISOString();
          logs.push(entry);
        }
      }
    });
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const trimmed = logs.slice(0, 20);
    if (trimmed.length > 0) {
      store('apiLogs', trimmed);
      // We cannot call setApiLogs here (inside useMemo), so return and let effect handle it
    }
    return trimmed;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Seed apiLogs state from initial computation if empty
  useState(() => {
    if (apiLogs.length === 0 && initialApiLogs.length > 0) {
      setApiLogs(initialApiLogs);
    }
  });

  const simulateApiCall = useCallback(() => {
    const connectedNames = Object.entries(integrations).filter(([, v]) => v).map(([k]) => k);
    if (connectedNames.length === 0) return;
    const name = connectedNames[Math.floor(Math.random() * connectedNames.length)];
    const entry = generateApiLogEntry(name);
    if (!entry) return;
    entry.timestamp = new Date().toISOString();
    setApiLogs((prev) => {
      const updated = [entry, ...prev].slice(0, 20);
      store('apiLogs', updated);
      return updated;
    });
  }, [integrations, generateApiLogEntry]);

  const deleteAccount = useCallback(() => {
    if (deleteConfirmText !== 'SUPPRIMER') return;
    ['contacts', 'events', 'finHistory', 'settings_company', 'integrations', 'integrationTimestamps', 'plan', 'users', 'onboarded', 'company', 'tools', 'apiKeys', 'dataSources'].forEach((k) => {
      try { localStorage.removeItem('hs_' + k); } catch {}
    });
    try { localStorage.removeItem('settings_logo'); } catch {}
    try { localStorage.removeItem('settings_accentColor'); } catch {}
    window.location.reload();
  }, [deleteConfirmText]);

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{t('nav.settings')}</h1>
        <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>{t('common.description')}</p>
      </div>

      <div className="fade-up d1" style={{ marginBottom: 24 }}>
        <TabBar items={SUB_TABS.map(st => st.label)} active={SUB_TABS.find(st => st.key === subTab)?.label} onChange={(label) => { const tab = SUB_TABS.find(st => st.label === label); if (tab) setSubTab(tab.key); }} />
      </div>

      {/* -------- COMPTE -------- */}
      {subTab === 'account' && (
        <>
          <Section title={t('settings.companyName').toUpperCase()} sub={t('common.description')}>
            <Card>
              <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 0, columnGap: 16 }}>
                <Inp label={t('settings.companyName')} value={company.name} onChange={(v) => upd('name', v)} placeholder={t('settings.companyName')} />
                <Inp label={t('settings.siret')} value={company.siret} onChange={(v) => upd('siret', v)} placeholder="123 456 789 00012" />
                <Inp label={t('settings.tvaNumber')} value={company.tva} onChange={(v) => upd('tva', v)} placeholder="FR 12 345678901" />
                <Sel label={t('settings.sector')} value={company.sector} onChange={(v) => upd('sector', v)} options={SECTORS} />
                <Inp label={t('common.address')} value={company.address} onChange={(v) => upd('address', v)} placeholder={t('common.address')} />
                <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Inp label={t('settings.city')} value={company.city} onChange={(v) => upd('city', v)} placeholder={t('settings.city')} />
                  <Inp label={t('settings.zip')} value={company.zip} onChange={(v) => upd('zip', v)} placeholder="75001" />
                </div>
                <Inp label={t('common.email')} value={company.email} onChange={(v) => upd('email', v)} type="email" placeholder="contact@societe.fr" />
                <Inp label={t('common.phone')} value={company.phone} onChange={(v) => upd('phone', v)} placeholder="+33 1 23 45 67 89" />
                <Inp label={t('settings.website')} value={company.website} onChange={(v) => upd('website', v)} placeholder="https://www.societe.fr" />
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                {savedCompany && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ {t('settings.saved')}</span>}
                <Btn onClick={saveCompany} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>{t('common.save')}</Btn>
              </div>
            </Card>
          </Section>

          <Section title={t('settings.theme').toUpperCase()} sub={t('settings.accentColor')}>
            <Card>
              {/* Theme toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{t('settings.theme')}</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>{t('settings.dark')} / {t('settings.light')}</div>
                </div>
                <Toggle
                  on={theme === 'light'}
                  onToggle={() => {
                    const next = theme === 'dark' ? 'light' : 'dark';
                    applyTheme(next);
                    setTheme(next);
                  }}
                  label={theme === 'dark' ? `🌙 ${t('settings.dark')}` : `☀️ ${t('settings.light')}`}
                />
              </div>

              {/* Logo upload */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{t('settings.logo')}</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 12 }}>{t('settings.uploadLogo')} (PNG, JPG, SVG)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {/* Logo preview */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    background: logo ? 'transparent' : T.surface2,
                    border: `2px dashed ${logo ? 'transparent' : T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {logo ? (
                      <img src={logo} alt="Logo" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      <span style={{ fontSize: 18, color: T.textMuted }}>🏢</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                      id="logo-upload"
                    />
                    <Btn v="secondary" small onClick={() => logoInputRef.current?.click()}>
                      {t('settings.uploadLogo')}
                    </Btn>
                    {logo && (
                      <Btn v="ghost" small onClick={removeLogo}>{t('settings.removeLogo')}</Btn>
                    )}
                  </div>
                </div>
              </div>

              {/* Accent color picker */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{t('settings.accentColor')}</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 12 }}>{t('common.color')}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {ACCENT_COLORS.map((c) => {
                    const selected = accentColor === c.value;
                    return (
                      <div
                        key={c.value}
                        onClick={() => selectAccentColor(c.value)}
                        role="radio"
                        aria-checked={selected}
                        aria-label={c.name}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAccentColor(c.value); } }}
                        title={c.name}
                        style={{
                          width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                          background: c.value, transition: 'all .15s',
                          border: selected ? '3px solid ' + T.text : '3px solid transparent',
                          boxShadow: selected ? `0 0 0 3px ${c.value}44` : 'none',
                          transform: selected ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>{t('common.loading')}</div>
              </div>
            </Card>
          </Section>

          {/* Usage stats */}
          <Section title={t('settings.storageUsed').toUpperCase()} sub={t('settings.storageUsed')}>
            <Card>
              <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Contacts', value: usageStats.contacts, icon: '👥', color: T.accent },
                  { label: 'Événements', value: usageStats.events, icon: '📅', color: T.blue },
                  { label: 'Mois de données', value: usageStats.months, icon: '💰', color: T.green },
                  { label: 'Utilisateurs', value: usageStats.users, icon: '🧑‍💼', color: T.purple },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    padding: '12px 14px', borderRadius: 10, background: T.surface2,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1.2 }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary }}>{t('settings.storageUsed')}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted }}>~{usageStats.storageKB}KB / 5MB</span>
                </div>
                <ProgressBar value={usageStats.storageKB} max={5120} color={usageStats.storageKB > 4096 ? T.red : usageStats.storageKB > 2560 ? T.orange : T.green} h={5} />
              </div>
            </Card>
          </Section>

          <Section title={t('settings.gdprDelete').toUpperCase()}>
            <Card style={{ borderLeft: `3px solid ${T.red}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.red }}>{t('settings.gdprDelete')}</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                    {t('settings.gdprDeleteWarning')}
                  </div>
                </div>
                <Btn v="danger" onClick={() => setShowDeleteConfirm(true)}>{t('settings.gdprDelete')}</Btn>
              </div>
              {showDeleteConfirm && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: T.redBg, border: `1px solid ${T.red}22` }}>
                  <div style={{ fontSize: 11, color: T.red, marginBottom: 8 }}>{t('settings.clearDataConfirm')} :</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Inp small value={deleteConfirmText} onChange={setDeleteConfirmText} placeholder="SUPPRIMER" />
                    <Btn v="danger" small onClick={deleteAccount} disabled={deleteConfirmText !== 'SUPPRIMER'}>{t('common.confirm')}</Btn>
                    <Btn v="ghost" small onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}>{t('common.cancel')}</Btn>
                  </div>
                </div>
              )}
            </Card>
          </Section>
        </>
      )}

      {/* -------- UTILISATEURS -------- */}
      {subTab === 'users' && (
        <Section title={t('settings.users').toUpperCase()} sub={t('settings.inviteUser')}>
          <PremiumGate label={t('settings.users')} blur>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 12, color: T.textSecondary }}>{users.length} {t('settings.users')}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Inp small value={inviteEmail} onChange={(v) => { setInviteEmail(v); setInviteError(''); }} placeholder="email@exemple.com" onKeyDown={(e) => e.key === 'Enter' && inviteUser()} />
                  <Btn onClick={inviteUser} aria-label={t('settings.inviteUser')} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>+ {t('settings.invite')}</Btn>
                  {inviteError && <span style={{ fontSize: 11, color: T.red, fontWeight: 600, width: '100%' }}>{inviteError}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {users.map((u) => (
                  <div key={u.email} style={{ padding: '12px 14px', borderRadius: 10, background: T.surface2, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: T.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: T.accent, fontSize: 14, flexShrink: 0 }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: T.textSecondary }}>{u.email}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.accent, background: T.accentBg, padding: '3px 8px', borderRadius: 6 }}>{u.role}</span>
                    {u.role !== 'Owner' && <Btn v="ghost" small aria-label={`Retirer ${u.name}`} onClick={() => del.request(u.email)}>✕</Btn>}
                  </div>
                ))}
              </div>
            </Card>
          </PremiumGate>

          <ConfirmDialog
            open={del.isOpen}
            title={`${t('common.delete')} ?`}
            message={t('common.irreversible')}
            onConfirm={del.execute}
            onCancel={del.cancel}
          />
        </Section>
      )}

      {/* -------- FACTURATION -------- */}
      {subTab === 'billing' && (
        <>
          {/* Subscription status */}
          <Card className="fade-up" style={{ marginBottom: 20, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{t('settings.currentPlan')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: T.text, textTransform: 'capitalize' }}>{getPlan()}</span>
                  <Badge color={isPaid() ? T.green : T.orange}>{isPaid() ? t('common.yes') : t('ui.freeTrial')}</Badge>
                </div>
                {!isPaid() && getTrialInfo() && (
                  <div style={{ fontSize: 11, color: getTrialInfo().daysLeft <= 3 ? T.red : T.textSecondary, marginTop: 4 }}>
                    {getTrialInfo().expired
                      ? t('ui.freeTrial')
                      : t('ui.trialDaysLeft', { days: getTrialInfo().daysLeft })}
                  </div>
                )}
              </div>
              {isSupabaseConfigured() && (
                <Btn v="secondary" small onClick={async () => {
                  try {
                    const { url } = await createBillingPortalSession();
                    if (url) window.location.href = url;
                  } catch (err) { alert('Erreur : ' + err.message); }
                }}>{t('settings.billing')}</Btn>
              )}
            </div>
          </Card>

          <div className="fade-up" style={{ textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: T.textSecondary, fontSize: 12 }}>{t('settings.billing')}</p>
            {isSupabaseConfigured() && (
              <Btn v="secondary" small style={{ marginTop: 8 }} onClick={async () => {
                try {
                  const { url } = await createBillingPortalSession();
                  if (url) window.location.href = url;
                } catch (err) { alert('Erreur : ' + err.message); }
              }}>{t('settings.billing')}</Btn>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 }}>
              <span style={{ fontSize: 12, fontWeight: annual ? 500 : 700, color: annual ? T.textMuted : T.text }}>{t('settings.monthly')}</span>
              <Toggle on={annual} onToggle={() => setAnnual(!annual)} label={<><span>{t('settings.annual')}</span> <span style={{ color: T.green, fontWeight: 700 }}>-20%</span></>} />
            </div>
          </div>

          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
            {PLANS.map((plan, i) => {
              const price = annual ? Math.round(plan.monthly * 0.8) : plan.monthly;
              const active = selectedPlan === plan.id;
              return (
                <div key={plan.id} className={`fade-up d${i + 1}`} onClick={() => selectPlan(plan.id)} role="button" aria-pressed={active} tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPlan(plan.id); } }}
                  style={{
                    background: T.surface, border: `2px solid ${active ? '#f97316' : plan.recommended ? T.accent + '44' : T.border}`,
                    borderRadius: 16, padding: 20, cursor: 'pointer', position: 'relative', transition: 'all .2s ease',
                    boxShadow: active ? '0 0 24px rgba(249,115,22,.15)' : 'none',
                  }}>
                  {plan.recommended && (
                    <div style={{
                      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff',
                      padding: '3px 12px', borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: .5,
                    }}>RECOMMANDÉ</div>
                  )}
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>{plan.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                      <span style={{ fontSize: 36, fontWeight: 800, color: T.text }}>{price}</span>
                      <span style={{ fontSize: 13, color: T.textMuted }}>€/mois</span>
                    </div>
                    {annual && <div style={{ fontSize: 11, color: T.green, marginTop: 4 }}>{plan.monthly * 12}€ → {price * 12}€/an</div>}
                  </div>
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {plan.features.map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: T.green, fontSize: 11, flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: 11, color: T.textSecondary }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Btn full v={active ? 'primary' : 'secondary'}
                      style={active ? { background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 2px 12px rgba(249,115,22,.3)' } : {}}>
                      {active ? t('settings.currentPlan') : t('common.confirm')}
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* -------- INTÉGRATIONS -------- */}
      {subTab === 'integrations' && (
        <Section title={t('settings.integrations').toUpperCase()} sub={t('settings.searchIntegrations')}>
          <PremiumGate label={t('settings.integrations')} blur>
          {/* Search bar + Category filter */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 220px', position: 'relative' }}>
                <input
                  type="text"
                  value={integrationSearch}
                  onChange={(e) => setIntegrationSearch(e.target.value)}
                  placeholder={t('settings.searchIntegrations')}
                  style={{
                    width: '100%', padding: '9px 14px 9px 34px', borderRadius: 10, fontSize: 12,
                    background: T.surface2, border: `1px solid ${T.border}`, color: T.text,
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = T.accent; }}
                  onBlur={(e) => { e.target.style.borderColor = T.border; }}
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: T.textMuted, pointerEvents: 'none' }}>
                  🔍
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.textSecondary }}>
                {Object.values(integrations).filter(Boolean).length}/{INTEGRATIONS.length}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {INTEGRATION_CATEGORIES.map((c) => {
                const active = integrationCatFilter === c.cat;
                const count = c.cat ? INTEGRATIONS.filter((ig) => ig.category === c.cat).length : INTEGRATIONS.length;
                return (
                  <button
                    key={c.label}
                    onClick={() => setIntegrationCatFilter(active ? null : c.cat)}
                    style={{
                      padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: active ? T.accent + '22' : T.surface2,
                      color: active ? T.accent : T.textSecondary,
                      transition: 'all .15s',
                    }}
                  >
                    {c.label} ({count})
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Filtered integration list grouped by category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { label: `💳 ${t('settings.catPayments')}`, cat: 'paiements' },
              { label: `🏦 ${t('settings.catBank')}`, cat: 'banque' },
              { label: `📅 ${t('settings.catAgenda')}`, cat: 'agenda' },
              { label: `📈 ${t('settings.catCRM')}`, cat: 'crm' },
              { label: `📧 ${t('settings.catMarketing')}`, cat: 'marketing' },
              { label: `📋 ${t('settings.catProject')}`, cat: 'projet' },
              { label: `📣 ${t('settings.catAds')}`, cat: 'publicite' },
              { label: `🎧 ${t('settings.catSupport')}`, cat: 'support' },
            ].map(({ label, cat }) => {
              const items = filteredIntegrations.filter((ig) => ig.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
                    {label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((ig) => {
                      const connected = !!integrations[ig.name];
                      const timestamp = integrationTimestamps[ig.name];
                      const isBouncing = bouncingIntegration === ig.name;
                      const rawStatus = syncStatus[ig.name];
                      const syncing = rawStatus === 'syncing';
                      const justSynced = rawStatus === 'done';
                      const syncError = rawStatus && typeof rawStatus === 'object' && rawStatus.status === 'error' ? rawStatus.message : null;
                      const meta = connected ? getIntegrationMeta(ig.name) : null;
                      return (
                        <Card key={ig.name} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', cursor: connected ? 'pointer' : 'default' }}
                          onClick={connected ? () => setDetailModal(ig.name) : undefined}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: syncError ? T.redBg : connected ? T.greenBg : T.surface2,
                            border: syncError ? `1px solid ${T.red}22` : connected ? `1px solid ${T.green}22` : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                            transition: 'all .3s ease',
                          }}>{ig.icon}</div>
                          <div style={{ flex: 1, minWidth: 120 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{ig.name}</div>
                              {ig.tier === 'demo' && !connected && (
                                <Badge label="Demo" color={T.textSecondary} bg={T.bgSecondary || 'rgba(255,255,255,.06)'} />
                              )}
                              {connected && !syncing && !syncError && (
                                <Badge label={t('settings.connectBtn')} color={T.green} bg={T.greenBg} />
                              )}
                              {syncing && (
                                <Badge label={t('common.loading')} color={T.orange} bg={T.orangeBg} />
                              )}
                              {justSynced && (
                                <Badge label={t('settings.saved')} color={T.green} bg={T.greenBg} />
                              )}
                              {syncError && (
                                <Badge label="Erreur sync" color={T.red} bg={T.redBg} />
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: T.textSecondary }}>{ig.desc}</div>
                            {syncError && (
                              <div style={{ fontSize: 10, color: T.red, marginTop: 3, lineHeight: 1.3 }}>
                                {syncError}
                              </div>
                            )}
                            {connected && timestamp && !syncError && (
                              <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>
                                {t('settings.connectedAt', { date: new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) })}
                                {meta && meta.accountId && <> — ID: {meta.accountId}</>}
                                {meta && meta.syncedContacts && <> — {meta.syncedContacts} contacts importés</>}
                                {meta && meta.syncedEvents && <> — {meta.syncedEvents} événements synchronisés</>}
                                {meta && meta.syncedItems && <> — {meta.syncedItems} éléments synchronisés</>}
                                {meta && meta.ordersImported && <> — {meta.ordersImported} commandes importées</>}
                                {meta && meta.subscribers && <> — {meta.subscribers} abonnés</>}
                                {meta && meta.openTickets && <> — {meta.openTickets} tickets ouverts</>}
                              </div>
                            )}
                          </div>
                          <div style={{
                            transition: 'transform .15s ease',
                            transform: isBouncing ? 'scale(1.2)' : 'scale(1)',
                          }} onClick={(e) => e.stopPropagation()}>
                            <Btn v={connected ? 'success' : 'secondary'} small onClick={() => toggleIntegration(ig.name)} disabled={syncing} aria-label={`${connected ? 'Déconnecter' : 'Connecter'} ${ig.name}`}>
                              {syncing ? '⟳ Sync...' : connected ? `✓ ${t('settings.connectBtn')}` : t('settings.connectBtn')}
                            </Btn>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {filteredIntegrations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: T.textMuted, fontSize: 12 }}>
                {t('common.noData')}
              </div>
            )}
          </div>

          {/* Integration status summary */}
          {Object.values(integrations).some(Boolean) && (
            <Card style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 14 }}>{'🔗'}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>
                  {t('settings.integrations')}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {INTEGRATIONS.filter((ig) => integrations[ig.name]).map((ig) => (
                  <div key={ig.name} onClick={() => setDetailModal(ig.name)} style={{
                    padding: '10px 12px', borderRadius: 8, background: T.greenBg,
                    border: `1px solid ${T.green}22`, textAlign: 'center', cursor: 'pointer',
                    transition: 'all .15s',
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{ig.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.green }}>{ig.name}</div>
                    <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>{t('settings.connectBtn')}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Integration Detail Modal */}
          {detailModal && (() => {
            const ig = INTEGRATIONS.find((i) => i.name === detailModal);
            if (!ig) return null;
            const meta = getIntegrationMeta(ig.name);
            const timestamp = integrationTimestamps[ig.name];
            const connected = !!integrations[ig.name];
            const metaEntries = meta ? Object.entries(meta).filter(([k]) => k !== 'connectedAt') : [];
            return (
              <div onClick={() => setDetailModal(null)} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
              }}>
                <div onClick={(e) => e.stopPropagation()} style={{
                  background: T.surface, borderRadius: 16, padding: 24, maxWidth: 440, width: '100%',
                  border: `1px solid ${T.border}`, boxShadow: '0 20px 60px rgba(0,0,0,.4)',
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, fontSize: 26,
                      background: connected ? T.greenBg : T.surface2,
                      border: connected ? `1px solid ${T.green}22` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{ig.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>{ig.name}</div>
                      <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>{ig.desc}</div>
                    </div>
                    <span onClick={() => setDetailModal(null)} style={{
                      fontSize: 18, color: T.textMuted, cursor: 'pointer', padding: '4px 8px',
                      borderRadius: 8, background: T.surface2,
                    }}>✕</span>
                  </div>

                  {/* Status */}
                  <div style={{
                    padding: '12px 14px', borderRadius: 10, marginBottom: 16,
                    background: connected ? T.greenBg : T.surface2,
                    border: `1px solid ${connected ? T.green + '22' : T.border}`,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: connected ? T.green : T.textMuted,
                      boxShadow: connected ? `0 0 8px ${T.green}66` : 'none',
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: connected ? T.green : T.textMuted }}>
                      {connected ? t('settings.connectBtn') : t('settings.disconnectBtn')}
                    </span>
                    {timestamp && (
                      <span style={{ fontSize: 10, color: T.textMuted, marginLeft: 'auto' }}>
                        {t('settings.connectedAt', { date: new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) })}
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  {connected && metaEntries.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
                        {t('settings.integrationDetail')}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {metaEntries.map(([k, v]) => (
                          <div key={k} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '6px 10px', borderRadius: 6, background: T.surface2, fontSize: 11,
                          }}>
                            <span style={{ color: T.textSecondary, fontWeight: 600 }}>{k}</span>
                            <span style={{ color: T.text, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {Array.isArray(v) ? v.join(', ') : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sync History for this integration */}
                  {(() => {
                    const history = syncHistory.filter((h) => h.name === ig.name).slice(0, 5);
                    if (history.length === 0) return null;
                    const actionLabels = { connect: 'Connexion', disconnect: 'Déconnexion', resync: 'Re-synchronisation' };
                    const actionColors = { connect: T.green, disconnect: T.red, resync: T.blue };
                    return (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
                          {t('settings.syncHistoryTitle')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {history.map((h, i) => (
                            <div key={i} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '5px 10px', borderRadius: 6, background: T.surface2, fontSize: 10,
                            }}>
                              <span style={{ color: actionColors[h.action] || T.text, fontWeight: 600 }}>
                                {actionLabels[h.action] || h.action}
                              </span>
                              <span style={{ color: T.textMuted }}>
                                {new Date(h.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sync error in detail modal */}
                  {(() => {
                    const rawSt = syncStatus[ig.name];
                    const errMsg = rawSt && typeof rawSt === 'object' && rawSt.status === 'error' ? rawSt.message : null;
                    if (!errMsg) return null;
                    return (
                      <div style={{
                        padding: '8px 12px', borderRadius: 8, marginBottom: 12,
                        background: T.redBg, border: `1px solid ${T.red}22`,
                        fontSize: 11, color: T.red, fontWeight: 600,
                      }}>
                        Erreur de synchronisation : {errMsg}
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {connected ? (
                      <>
                        <Btn v="secondary" small onClick={() => resyncIntegration(ig.name)}
                          disabled={syncStatus[ig.name] === 'syncing'} style={{ flex: 1 }}>
                          {syncStatus[ig.name] === 'syncing' ? '⟳ Sync...' : `⟳ ${t('settings.resyncBtn')}`}
                        </Btn>
                        <Btn v="danger" small onClick={() => { toggleIntegration(ig.name); setDetailModal(null); }} style={{ flex: 1 }}>
                          {t('settings.disconnectBtn')}
                        </Btn>
                        <Btn v="ghost" small onClick={() => setDetailModal(null)}>
                          ✕
                        </Btn>
                      </>
                    ) : (
                      <>
                        <Btn v="primary" small onClick={() => { toggleIntegration(ig.name); setDetailModal(null); }}
                          style={{ flex: 1, background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
                          {t('settings.connectBtn')}
                        </Btn>
                        <Btn v="ghost" small onClick={() => setDetailModal(null)} style={{ flex: 1 }}>
                          {t('common.close')}
                        </Btn>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* API Key Connection Modal */}
          {(() => {
            const ig = connectModal ? INTEGRATIONS.find((i) => i.name === connectModal) : null;
            const keyFields = {
              Stripe: { label: 'Clé secrète Stripe (sk_...)', placeholder: 'sk_live_... ou sk_test_...' },
              Revolut: { label: 'Access Token Revolut Business', placeholder: 'oa_prod_...' },
              Qonto: { label: 'Clé API Qonto', placeholder: 'Votre clé API Qonto', hasUrl: true, urlLabel: 'URL API (optionnel)', urlPlaceholder: 'https://thirdparty.qonto.com/v2' },
              HubSpot: { label: 'Clé API privée HubSpot', placeholder: 'pat-na1-...' },
              Salesforce: { label: 'Access Token Salesforce', placeholder: 'Votre access token', hasUrl: true, urlLabel: 'URL instance Salesforce (requis)', urlPlaceholder: 'https://votreinstance.salesforce.com', urlRequired: true },
              Pipedrive: { label: 'Token API Pipedrive', placeholder: 'Votre token API Pipedrive' },
              Mailchimp: { label: 'Clé API Mailchimp', placeholder: 'xxxx-us21' },
              Brevo: { label: 'Clé API Brevo', placeholder: 'xkeysib-...' },
              'Meta Ads': { label: 'Access Token Meta (long-lived)', placeholder: 'EAAx...' },
              'Google Ads': { label: 'Developer Token Google Ads', placeholder: 'Votre developer token' },
              'TikTok Ads': { label: 'Access Token TikTok Ads', placeholder: 'Votre access token' },
              'Google Calendar': { label: 'Clé API Google', placeholder: 'AIza...' },
              GoHighLevel: { label: 'Clé API GoHighLevel', placeholder: 'Votre clé API GHL' },
              PayPal: { label: 'Client Secret PayPal', placeholder: 'Votre client secret' },
              Zoho: { label: 'Clé API Zoho CRM', placeholder: 'Votre clé API Zoho' },
              ActiveCampaign: { label: 'Clé API ActiveCampaign', placeholder: 'Votre clé API', hasUrl: true, urlLabel: 'URL API ActiveCampaign (requis)', urlPlaceholder: 'https://votrecompte.api-us1.com', urlRequired: true },
              Shopify: { label: 'Access Token Shopify', placeholder: 'shpat_...', hasUrl: true, urlLabel: 'Domaine de la boutique (requis)', urlPlaceholder: 'monshop.myshopify.com', urlRequired: true },
              'LinkedIn Ads': { label: 'Access Token LinkedIn Ads', placeholder: 'Votre access token' },
              Notion: { label: 'Token d\'intégration Notion', placeholder: 'ntn_...' },
              Slack: { label: 'Bot Token Slack', placeholder: 'xoxb-...' },
            };
            const field = ig ? (keyFields[ig.name] || { label: `Clé API ${ig.name}`, placeholder: 'Votre clé API' }) : {};
            return (
              <Modal open={!!connectModal} onClose={() => setConnectModal(null)} title={ig ? `Connecter ${ig.name}` : ''}>
                {ig && (
                  <>
                    {/* Icon + description */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, fontSize: 22,
                        background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>{ig.icon}</div>
                      <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.4 }}>{ig.desc}</div>
                    </div>

                    {/* Info banner */}
                    <div style={{
                      padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                      background: T.blueBg, border: `1px solid ${T.blue}22`, fontSize: 11, color: T.blue, lineHeight: 1.5,
                    }}>
                      Entrez votre clé API pour connecter {ig.name} et synchroniser vos données automatiquement.
                    </div>

                    {/* API Key Input */}
                    <Inp
                      label={field.label}
                      type="password"
                      value={connectKey}
                      onChange={setConnectKey}
                      placeholder={field.placeholder}
                    />

                    {/* Optional URL field */}
                    {field.hasUrl && (
                      <Inp
                        label={field.urlLabel}
                        value={connectUrl}
                        onChange={setConnectUrl}
                        placeholder={field.urlPlaceholder}
                      />
                    )}

                    {/* Error */}
                    {connectError && (
                      <div style={{
                        padding: '8px 12px', borderRadius: 8, marginBottom: 12,
                        background: T.redBg, border: `1px solid ${T.red}22`,
                        fontSize: 11, color: T.red, fontWeight: 600,
                      }}>
                        {connectError}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <Btn v="primary" small onClick={() => submitApiKeyConnection(ig.name)}
                        disabled={connectLoading || !connectKey.trim() || (field.urlRequired && !connectUrl.trim())}
                        style={{ flex: 1, background: 'linear-gradient(135deg, #f97316, #f59e0b)', opacity: connectLoading ? 0.7 : 1 }}>
                        {connectLoading ? '⟳ Connexion...' : 'Connecter'}
                      </Btn>
                      <Btn v="ghost" small onClick={() => setConnectModal(null)} style={{ flex: 1 }}>
                        Annuler
                      </Btn>
                    </div>
                  </>
                )}
              </Modal>
            );
          })()}

          {/* API Logs / Webhook Simulator */}
          <Card style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{'📡'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{t('settings.apiLogs')}</div>
                  <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 1 }}>{t('settings.apiLogs')}</div>
                </div>
              </div>
              <Btn v="secondary" small onClick={simulateApiCall} disabled={Object.values(integrations).filter(Boolean).length === 0}>
                {t('settings.apiLogs')}
              </Btn>
            </div>

            {(apiLogs.length > 0 || initialApiLogs.length > 0) ? (
              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, borderRadius: 10, border: `1px solid ${T.border}`, padding: 6, background: T.surface2 }}>
                {(apiLogs.length > 0 ? apiLogs : initialApiLogs).slice(0, 20).map((log, idx) => {
                  const statusColor = log.status === 200 || log.status === 201 ? T.green : log.status === 400 ? T.orange : T.red;
                  const statusBg = log.status === 200 || log.status === 201 ? T.greenBg : log.status === 400 ? T.orangeBg : T.redBg;
                  const methodColor = log.method === 'GET' ? T.blue : log.method === 'POST' ? T.green : T.orange;
                  const methodBg = log.method === 'GET' ? T.blueBg : log.method === 'POST' ? T.greenBg : T.orangeBg;
                  const isNew = idx === 0 && apiLogs.length > 0 && (Date.now() - new Date(log.timestamp).getTime()) < 2000;
                  return (
                    <div
                      key={log.id}
                      className={isNew ? 'fade-up' : ''}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                        padding: '7px 10px', borderRadius: 8, background: T.surface,
                        borderLeft: `3px solid ${statusColor}`,
                        transition: 'all .2s ease',
                      }}
                    >
                      {/* Timestamp */}
                      <span style={{ fontSize: 9, color: T.textMuted, minWidth: 70, flexShrink: 0 }}>
                        {new Date(log.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      {/* Integration icon + name */}
                      <span style={{ fontSize: 12, flexShrink: 0 }}>{log.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: T.text, minWidth: 60, flexShrink: 0 }}>{log.integration}</span>
                      {/* Method badge */}
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                        color: methodColor, background: methodBg, flexShrink: 0, fontFamily: 'monospace',
                      }}>{log.method}</span>
                      {/* Endpoint */}
                      <span style={{
                        fontSize: 10, color: T.textSecondary, flex: 1, minWidth: 100,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontFamily: 'monospace',
                      }}>{log.endpoint}</span>
                      {/* Status code badge */}
                      <Badge label={String(log.status)} color={statusColor} bg={statusBg} />
                      {/* Response time */}
                      <span style={{ fontSize: 9, color: T.textMuted, flexShrink: 0 }}>{log.responseTime}ms</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: T.textMuted, fontSize: 11 }}>
                {t('settings.noApiLogs')}
              </div>
            )}
          </Card>
          </PremiumGate>
        </Section>
      )}

      {/* -------- AUTOMATISATIONS -------- */}
      {subTab === 'automations' && (() => {
        const [automations, setAutomations] = React.useState(() => {
          const saved = load('automations') || {};
          const defaults = {};
          AUTOMATION_RULES.forEach((r) => { defaults[r.id] = r.defaultEnabled; });
          return { ...defaults, ...saved };
        });

        const toggleRule = (id) => {
          setAutomations((prev) => {
            const next = { ...prev, [id]: !prev[id] };
            store('automations', next);
            return next;
          });
        };

        const enabledCount = Object.values(automations).filter(Boolean).length;

        return (
          <>
            <Section title={t('settings.automations').toUpperCase()} sub={`${enabledCount} / ${AUTOMATION_RULES.length}`}>
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['crm', 'finance'].map((cat) => (
                    <div key={cat}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                        {cat === 'crm' ? t('settings.catCRM') : t('settings.billing')}
                      </div>
                      {AUTOMATION_RULES.filter((r) => r.category === cat).map((rule) => (
                        <div key={rule.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 16px', borderRadius: 10, background: T.surface2,
                          border: `1px solid ${automations[rule.id] ? T.accent + '33' : T.border}`,
                          marginBottom: 8, transition: 'all .2s',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                            <span style={{ fontSize: 18 }}>{rule.icon}</span>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{rule.label}</div>
                              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{rule.description}</div>
                            </div>
                          </div>
                          <Toggle checked={!!automations[rule.id]} onChange={() => toggleRule(rule.id)} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            </Section>
          </>
        );
      })()}

      {/* -------- DATA & EXPORT -------- */}
      {subTab === 'dataExport' && <DataExportTab />}

      {/* -------- RGPD -------- */}
      {subTab === 'gdpr' && (
        <Section title={t('settings.gdpr').toUpperCase()} sub={t('settings.gdprTitle')}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{t('settings.gdprTitle')}</div>
                <div style={{ fontSize: 11, color: T.textSecondary }}>
                  {t('settings.gdprTitle')}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{t('settings.gdprDelete')}</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 8 }}>
                  {t('settings.gdprDeleteWarning')}
                </div>
                <Btn v="danger" small onClick={async () => {
                  if (isSupabaseConfigured()) {
                    if (window.confirm('Êtes-vous sûr ? Cette action est irréversible et supprimera toutes vos données.')) {
                      try {
                        await requestAccountDeletion();
                        window.location.reload();
                      } catch (err) { alert(err.message); }
                    }
                  } else {
                    setSubTab('account'); setShowDeleteConfirm(true);
                  }
                }}>{t('settings.gdprDelete')}</Btn>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{t('settings.gdprExport')}</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 8 }}>
                  {t('settings.gdprExport')}
                </div>
                <Btn v="secondary" small onClick={async () => {
                  if (isSupabaseConfigured()) {
                    try {
                      const data = await requestDataExport();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = 'hubscale_gdpr_export.json'; a.click();
                      URL.revokeObjectURL(url);
                    } catch (err) { alert('Erreur : ' + err.message); }
                  } else {
                    const data = { contacts: load('contacts') || [], finances: load('finHistory') || [], events: load('events') || [], settings: load('settings_company') || {}, integrations: load('integrations') || {} };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'hubscale_backup.json'; a.click();
                    URL.revokeObjectURL(url);
                  }
                }}>{t('settings.gdprExport')}</Btn>
              </div>
            </div>
          </Card>
        </Section>
      )}
    </div>
  );
}
