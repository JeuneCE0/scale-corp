import React, { useState, useCallback, useMemo, useRef } from 'react';
import { T, getTheme, applyTheme } from '../lib/theme.js';
import { store, load } from '../lib/store.js';
import { Card, Section, Btn, Inp, Sel, TabBar, Toggle, ConfirmDialog, Badge, ProgressBar } from '../components/ui.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import { SECTORS, PLANS, INTEGRATIONS } from '../lib/constants.js';
import { onIntegrationConnect, getIntegrationMeta } from '../lib/integrationData.js';

const INTEGRATION_CATEGORIES = [
  { label: 'Tous', cat: null },
  { label: 'Paiements', cat: 'paiements' },
  { label: 'Banque', cat: 'banque' },
  { label: 'Agenda', cat: 'agenda' },
  { label: 'CRM', cat: 'crm' },
  { label: 'Marketing', cat: 'marketing' },
  { label: 'Projet', cat: 'projet' },
  { label: 'Publicite', cat: 'publicite' },
  { label: 'Support', cat: 'support' },
];

const SUB_TABS = ['Compte', 'Utilisateurs', 'Facturation', 'Intégrations', 'Data & Export', 'RGPD & Légal'];

const ACCENT_COLORS = [
  { name: 'Orange', value: '#f97316' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Red', value: '#ef4444' },
];

function csvEscape(val) {
  let s = String(val ?? '');
  // Prevent Excel formula injection
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

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
  const [subTab, setSubTab] = useState('Compte');
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
  const [logo, setLogo] = useState(() => {
    try { return localStorage.getItem('settings_logo') || null; } catch { return null; }
  });
  const logoInputRef = useRef(null);

  // Accent color state
  const [accentColor, setAccentColor] = useState(() => {
    try { return localStorage.getItem('settings_accentColor') || '#f97316'; } catch { return '#f97316'; }
  });

  // Integration connection timestamps
  const [integrationTimestamps, setIntegrationTimestamps] = useState(() => load('integrationTimestamps') || {});

  // Integration toggle animation tracking
  const [bouncingIntegration, setBouncingIntegration] = useState(null);

  // Integration search & filter
  const [integrationSearch, setIntegrationSearch] = useState('');
  const [integrationCatFilter, setIntegrationCatFilter] = useState(null);

  // Integration detail modal
  const [detailModal, setDetailModal] = useState(null); // integration name or null

  // Sync history log
  const [syncHistory, setSyncHistory] = useState(() => load('syncHistory') || []);

  // API Logs state
  const [apiLogs, setApiLogs] = useState(() => load('apiLogs') || []);

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
    store('settings_company', company);
    setSavedCompany(true);
    setTimeout(() => setSavedCompany(false), 2000);
  }, [company]);

  const [syncStatus, setSyncStatus] = useState({});

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

  const toggleIntegration = useCallback((name) => {
    setBouncingIntegration(name);
    setTimeout(() => setBouncingIntegration(null), 400);

    const wasOff = !integrations[name];

    setIntegrations((prev) => {
      const updated = { ...prev, [name]: !prev[name] };
      store('integrations', updated);
      return updated;
    });

    // Track timestamp and seed data when connecting
    if (wasOff) {
      setIntegrationTimestamps((prev) => {
        const updated = { ...prev, [name]: new Date().toISOString() };
        store('integrationTimestamps', updated);
        return updated;
      });
      // Show syncing state, then seed data
      setSyncStatus((prev) => ({ ...prev, [name]: 'syncing' }));
      setTimeout(() => {
        onIntegrationConnect(name);
        setSyncStatus((prev) => ({ ...prev, [name]: 'done' }));
        // Record sync history
        setSyncHistory((prev) => {
          const entry = { name, action: 'connect', timestamp: new Date().toISOString() };
          const updated = [entry, ...prev].slice(0, 50);
          store('syncHistory', updated);
          return updated;
        });
        window.dispatchEvent(new CustomEvent('hs:integration-sync', { detail: { name, action: 'connect' } }));
        setTimeout(() => setSyncStatus((prev) => ({ ...prev, [name]: null })), 2000);
      }, 800);
    } else {
      // Disconnection — record it
      setSyncHistory((prev) => {
        const entry = { name, action: 'disconnect', timestamp: new Date().toISOString() };
        const updated = [entry, ...prev].slice(0, 50);
        store('syncHistory', updated);
        return updated;
      });
      window.dispatchEvent(new CustomEvent('hs:integration-sync', { detail: { name, action: 'disconnect' } }));
    }
  }, [integrations]);

  // Re-sync an integration (force re-seed)
  const resyncIntegration = useCallback((name) => {
    setSyncStatus((prev) => ({ ...prev, [name]: 'syncing' }));
    setTimeout(() => {
      onIntegrationConnect(name);
      setSyncStatus((prev) => ({ ...prev, [name]: 'done' }));
      setSyncHistory((prev) => {
        const entry = { name, action: 'resync', timestamp: new Date().toISOString() };
        const updated = [entry, ...prev].slice(0, 50);
        store('syncHistory', updated);
        return updated;
      });
      window.dispatchEvent(new CustomEvent('hs:integration-sync', { detail: { name, action: 'resync' } }));
      setTimeout(() => setSyncStatus((prev) => ({ ...prev, [name]: null })), 2000);
    }, 800);
  }, []);

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
      try {
        localStorage.setItem('settings_logo', base64);
        setLogo(base64);
      } catch {}
    };
    reader.readAsDataURL(file);
  }, []);

  const removeLogo = useCallback(() => {
    try { localStorage.removeItem('settings_logo'); } catch {}
    setLogo(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  }, []);

  // Accent color handler
  const selectAccentColor = useCallback((color) => {
    setAccentColor(color);
    try { localStorage.setItem('settings_accentColor', color); } catch {}
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

  const exportData = useCallback((type) => {
    const data = {
      contacts: load('contacts') || [],
      finances: load('finHistory') || [],
      events: load('events') || [],
      settings: load('settings_company') || {},
      integrations: load('integrations') || {},
      integrationTimestamps: load('integrationTimestamps') || {},
    };
    let content, filename, mime;
    if (type === 'contacts') {
      const header = 'Nom,Email,Société,Téléphone,Statut,CA,Créé le,Source';
      const rows = data.contacts.map((c) => [c.name, c.email, c.company, c.phone, c.status, c.ca ?? '', c.createdAt ?? '', c.source ?? ''].map(csvEscape).join(','));
      content = header + '\n' + rows.join('\n');
      filename = 'hubscale_contacts.csv'; mime = 'text/csv;charset=utf-8';
    } else if (type === 'finances') {
      const header = 'Mois,CA,Charges,Résultat,Trésorerie';
      const rows = data.finances.map((r) => [r.key, r.ca, r.charges, r.result, r.treso ?? ''].map(csvEscape).join(','));
      content = header + '\n' + rows.join('\n');
      filename = 'hubscale_finances.csv'; mime = 'text/csv;charset=utf-8';
    } else if (type === 'events') {
      const header = 'Titre,Date,Heure,Type,Description,Source';
      const rows = data.events.map((e) => [e.title, e.date, e.time, e.type, e.description ?? '', e.source ?? ''].map(csvEscape).join(','));
      content = header + '\n' + rows.join('\n');
      filename = 'hubscale_events.csv'; mime = 'text/csv;charset=utf-8';
    } else {
      content = JSON.stringify(data, null, 2);
      filename = 'hubscale_backup.json'; mime = 'application/json';
    }
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }, []);

  // --- PDF Financial Report ---
  const generateFinancialReport = useCallback(() => {
    const comp = load('settings_company') || {};
    const finHistory = load('finHistory') || [];
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const reportId = `RPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const totalCA = finHistory.reduce((s, r) => s + (Number(r.ca) || 0), 0);
    const totalCharges = finHistory.reduce((s, r) => s + (Number(r.charges) || 0), 0);
    const totalResult = finHistory.reduce((s, r) => s + (Number(r.result) || 0), 0);
    const maxCA = Math.max(...finHistory.map((r) => Number(r.ca) || 0), 1);

    const fmt = (n) => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const tableRows = finHistory.map((r) => {
      const ca = Number(r.ca) || 0;
      const charges = Number(r.charges) || 0;
      const result = Number(r.result) || 0;
      const treso = r.treso != null ? Number(r.treso) : null;
      return `<tr>
        <td>${r.key || ''}</td>
        <td style="text-align:right">${fmt(ca)} &euro;</td>
        <td style="text-align:right">${fmt(charges)} &euro;</td>
        <td style="text-align:right;color:${result >= 0 ? '#22c55e' : '#ef4444'};font-weight:600">${fmt(result)} &euro;</td>
        <td style="text-align:right">${treso != null ? fmt(treso) + ' &euro;' : '—'}</td>
      </tr>`;
    }).join('');

    const chartBars = finHistory.slice(-12).map((r) => {
      const ca = Number(r.ca) || 0;
      const charges = Number(r.charges) || 0;
      const pctCA = Math.round((ca / maxCA) * 100);
      const pctCharges = Math.round((charges / maxCA) * 100);
      const label = (r.key || '').replace(/^\d{4}-/, '');
      return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:40px;max-width:60px;">
        <div style="width:100%;height:120px;display:flex;align-items:flex-end;gap:2px;justify-content:center;">
          <div style="width:40%;background:linear-gradient(to top,#f97316,#f59e0b);border-radius:3px 3px 0 0;height:${pctCA}%;" title="CA: ${fmt(ca)} €"></div>
          <div style="width:40%;background:#ef4444;border-radius:3px 3px 0 0;height:${pctCharges}%;" title="Charges: ${fmt(charges)} €"></div>
        </div>
        <div style="font-size:8px;color:#999;margin-top:4px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${label}</div>
      </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport Financier ${reportId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; color: #1a1a2e; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #f97316; padding-bottom: 20px; }
    .brand { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #f97316, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .brand-sub { font-size: 11px; color: #666; margin-top: 4px; }
    .report-meta { text-align: right; }
    .report-meta h2 { font-size: 20px; color: #f97316; margin-bottom: 8px; }
    .report-meta p { font-size: 12px; color: #666; line-height: 1.6; }
    .company-info { background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
    .company-info h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 10px; }
    .company-info p { font-size: 12px; line-height: 1.8; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 12px; margin-top: 30px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead th { background: #1a1a2e; color: #fff; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
    thead th:not(:first-child) { text-align: right; }
    tbody td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 12px; }
    tbody tr:hover { background: #fafafa; }
    tfoot td { padding: 12px 14px; font-weight: 800; font-size: 13px; border-top: 2px solid #1a1a2e; }
    tfoot td:not(:first-child) { text-align: right; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
    .kpi-card { padding: 16px; border-radius: 10px; text-align: center; }
    .kpi-value { font-size: 22px; font-weight: 800; line-height: 1.2; }
    .kpi-label { font-size: 10px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .chart-container { display: flex; align-items: flex-end; gap: 4px; padding: 16px; background: #f8f9fa; border-radius: 10px; margin-bottom: 20px; overflow-x: auto; }
    .legend { display: flex; gap: 16px; justify-content: center; margin-bottom: 20px; font-size: 11px; color: #666; }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 2px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #999; line-height: 1.8; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:20px;">
    <button onclick="window.print()" style="background:linear-gradient(135deg,#f97316,#f59e0b);color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Imprimer / PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">HubScale</div>
      <div class="brand-sub">Rapport financier</div>
    </div>
    <div class="report-meta">
      <h2>RAPPORT FINANCIER</h2>
      <p>
        <strong>Réf :</strong> ${reportId}<br>
        <strong>Date :</strong> ${dateStr}<br>
        <strong>Période :</strong> ${finHistory.length > 0 ? (finHistory[0].key || '—') + ' → ' + (finHistory[finHistory.length - 1].key || '—') : 'Aucune donnée'}
      </p>
    </div>
  </div>

  <div class="company-info">
    <h3>Informations société</h3>
    <p>
      ${comp.name ? '<strong>' + comp.name + '</strong><br>' : ''}${comp.address ? comp.address + '<br>' : ''}${comp.zip || comp.city ? (comp.zip || '') + ' ' + (comp.city || '') + '<br>' : ''}${comp.siret ? 'SIRET : ' + comp.siret + '<br>' : ''}${comp.tva ? 'TVA : ' + comp.tva + '<br>' : ''}${comp.email ? 'Email : ' + comp.email : ''}${comp.phone ? ' — Tél : ' + comp.phone : ''}
    </p>
  </div>

  <div class="section-title">Indicateurs clés</div>
  <div class="kpi-grid">
    <div class="kpi-card" style="background:#fff7ed;border:1px solid #fed7aa;">
      <div class="kpi-value" style="color:#f97316;">${fmt(totalCA)} &euro;</div>
      <div class="kpi-label">Chiffre d'affaires total</div>
    </div>
    <div class="kpi-card" style="background:#fef2f2;border:1px solid #fecaca;">
      <div class="kpi-value" style="color:#ef4444;">${fmt(totalCharges)} &euro;</div>
      <div class="kpi-label">Charges totales</div>
    </div>
    <div class="kpi-card" style="background:${totalResult >= 0 ? '#f0fdf4' : '#fef2f2'};border:1px solid ${totalResult >= 0 ? '#bbf7d0' : '#fecaca'};">
      <div class="kpi-value" style="color:${totalResult >= 0 ? '#22c55e' : '#ef4444'};">${fmt(totalResult)} &euro;</div>
      <div class="kpi-label">Résultat net</div>
    </div>
    <div class="kpi-card" style="background:#eff6ff;border:1px solid #bfdbfe;">
      <div class="kpi-value" style="color:#3b82f6;">${finHistory.length}</div>
      <div class="kpi-label">Mois de données</div>
    </div>
  </div>

  ${finHistory.length > 0 ? `
  <div class="section-title">Évolution mensuelle (12 derniers mois)</div>
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:linear-gradient(135deg,#f97316,#f59e0b);"></div> CA</div>
    <div class="legend-item"><div class="legend-dot" style="background:#ef4444;"></div> Charges</div>
  </div>
  <div class="chart-container">${chartBars}</div>
  ` : ''}

  <div class="section-title">Détail mensuel</div>
  <table>
    <thead>
      <tr>
        <th>Mois</th>
        <th>CA</th>
        <th>Charges</th>
        <th>Résultat</th>
        <th>Trésorerie</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
    <tfoot>
      <tr>
        <td><strong>TOTAL</strong></td>
        <td style="text-align:right">${fmt(totalCA)} &euro;</td>
        <td style="text-align:right">${fmt(totalCharges)} &euro;</td>
        <td style="text-align:right;color:${totalResult >= 0 ? '#22c55e' : '#ef4444'}">${fmt(totalResult)} &euro;</td>
        <td style="text-align:right">—</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <p>
      ${comp.name ? '<strong>' + comp.name + '</strong> — ' : '<strong>HubScale</strong> — '}${comp.siret ? 'SIRET ' + comp.siret + ' — ' : ''}${comp.tva ? 'TVA ' + comp.tva + ' — ' : ''}Rapport généré le ${dateStr}<br>
      Ce document est un récapitulatif financier à usage interne. Il ne constitue pas un document comptable officiel.
    </p>
  </div>
</body>
</html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }, []);

  // --- Integration CSV Export ---
  const exportIntegrationsCSV = useCallback(() => {
    const ints = load('integrations') || {};
    const timestamps = load('integrationTimestamps') || {};
    const header = 'Nom,Connecté,Date de connexion,Catégorie';
    const rows = INTEGRATIONS.map((ig) => {
      const connected = ints[ig.name] ? 'Oui' : 'Non';
      const connectedAt = timestamps[ig.name] ? new Date(timestamps[ig.name]).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      return [ig.name, connected, connectedAt, ig.category].map(csvEscape).join(',');
    });
    const bom = '\uFEFF';
    const content = header + '\n' + rows.join('\n');
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'hubscale_integrations.csv'; a.click();
    URL.revokeObjectURL(url);
  }, []);

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

  // --- JSON Import ---
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const importInputRef = useRef(null);

  const handleImportFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSuccess(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const preview = {
          contacts: Array.isArray(parsed.contacts) ? parsed.contacts.length : 0,
          finances: Array.isArray(parsed.finances) ? parsed.finances.length : 0,
          events: Array.isArray(parsed.events) ? parsed.events.length : 0,
          settings: parsed.settings && typeof parsed.settings === 'object' ? 1 : 0,
          integrations: parsed.integrations && typeof parsed.integrations === 'object' ? Object.keys(parsed.integrations).filter((k) => parsed.integrations[k]).length : 0,
          raw: parsed,
        };
        setImportPreview(preview);
      } catch {
        setImportError('Fichier JSON invalide. Veuillez sélectionner un fichier hubscale_backup.json valide.');
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  }, []);

  const confirmImport = useCallback(() => {
    if (!importPreview?.raw) return;
    const d = importPreview.raw;
    try {
      if (Array.isArray(d.contacts)) store('contacts', d.contacts);
      if (Array.isArray(d.finances)) store('finHistory', d.finances);
      if (Array.isArray(d.events)) store('events', d.events);
      if (d.settings && typeof d.settings === 'object') store('settings_company', d.settings);
      if (d.integrations && typeof d.integrations === 'object') store('integrations', d.integrations);
      if (d.integrationTimestamps && typeof d.integrationTimestamps === 'object') store('integrationTimestamps', d.integrationTimestamps);
      setImportSuccess(true);
      setImportPreview(null);
      if (importInputRef.current) importInputRef.current.value = '';
      setTimeout(() => setImportSuccess(false), 3000);
    } catch {
      setImportError('Erreur lors de l\'importation. Veuillez réessayer.');
    }
  }, [importPreview]);

  const cancelImport = useCallback(() => {
    setImportPreview(null);
    setImportError('');
    if (importInputRef.current) importInputRef.current.value = '';
  }, []);

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
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Paramètres</h1>
        <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>Configuration de votre espace client</p>
      </div>

      <div className="fade-up d1" style={{ marginBottom: 24 }}>
        <TabBar items={SUB_TABS} active={subTab} onChange={setSubTab} />
      </div>

      {/* -------- COMPTE -------- */}
      {subTab === 'Compte' && (
        <>
          <Section title="INFORMATIONS DE LA SOCIÉTÉ" sub="Données légales et coordonnées">
            <Card>
              <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 0, columnGap: 16 }}>
                <Inp label="Raison sociale" value={company.name} onChange={(v) => upd('name', v)} placeholder="Nom de votre société" />
                <Inp label="SIRET" value={company.siret} onChange={(v) => upd('siret', v)} placeholder="123 456 789 00012" />
                <Inp label="N° TVA intracommunautaire" value={company.tva} onChange={(v) => upd('tva', v)} placeholder="FR 12 345678901" />
                <Sel label="Secteur d'activité" value={company.sector} onChange={(v) => upd('sector', v)} options={SECTORS} />
                <Inp label="Adresse" value={company.address} onChange={(v) => upd('address', v)} placeholder="Rue, numéro" />
                <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Inp label="Ville" value={company.city} onChange={(v) => upd('city', v)} placeholder="Paris" />
                  <Inp label="Code postal" value={company.zip} onChange={(v) => upd('zip', v)} placeholder="75001" />
                </div>
                <Inp label="Email principal" value={company.email} onChange={(v) => upd('email', v)} type="email" placeholder="contact@societe.fr" />
                <Inp label="Téléphone" value={company.phone} onChange={(v) => upd('phone', v)} placeholder="+33 1 23 45 67 89" />
                <Inp label="Site web" value={company.website} onChange={(v) => upd('website', v)} placeholder="https://www.societe.fr" />
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                {savedCompany && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ Sauvegardé</span>}
                <Btn onClick={saveCompany} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Sauvegarder</Btn>
              </div>
            </Card>
          </Section>

          <Section title="APPARENCE" sub="Personnalisez l'affichage de votre espace">
            <Card>
              {/* Theme toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>Thème</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>Basculez entre le mode sombre et clair</div>
                </div>
                <Toggle
                  on={theme === 'light'}
                  onToggle={() => {
                    const next = theme === 'dark' ? 'light' : 'dark';
                    applyTheme(next);
                    setTheme(next);
                    window.location.reload();
                  }}
                  label={theme === 'dark' ? '🌙 Sombre' : '☀️ Clair'}
                />
              </div>

              {/* Logo upload */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>Logo de l'entreprise</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 12 }}>Uploadez le logo de votre société (PNG, JPG, SVG)</div>
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
                      {logo ? 'Changer le logo' : 'Uploader un logo'}
                    </Btn>
                    {logo && (
                      <Btn v="ghost" small onClick={removeLogo}>Supprimer le logo</Btn>
                    )}
                  </div>
                </div>
              </div>

              {/* Accent color picker */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>Couleur d'accent</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 12 }}>Choisissez la couleur principale de votre interface</div>
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
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>Rechargez la page pour appliquer</div>
              </div>
            </Card>
          </Section>

          {/* Usage stats */}
          <Section title="UTILISATION" sub="Aperçu de vos données et stockage">
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
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary }}>Espace utilisé</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted }}>~{usageStats.storageKB}KB / 5MB</span>
                </div>
                <ProgressBar value={usageStats.storageKB} max={5120} color={usageStats.storageKB > 4096 ? T.red : usageStats.storageKB > 2560 ? T.orange : T.green} h={5} />
              </div>
            </Card>
          </Section>

          <Section title="ZONE DANGEREUSE">
            <Card style={{ borderLeft: `3px solid ${T.red}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.red }}>Supprimer le compte</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                    Cette action est irréversible. Toutes les données seront définitivement supprimées.
                  </div>
                </div>
                <Btn v="danger" onClick={() => setShowDeleteConfirm(true)}>Supprimer mon compte</Btn>
              </div>
              {showDeleteConfirm && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: T.redBg, border: `1px solid ${T.red}22` }}>
                  <div style={{ fontSize: 11, color: T.red, marginBottom: 8 }}>Tapez SUPPRIMER pour confirmer :</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Inp small value={deleteConfirmText} onChange={setDeleteConfirmText} placeholder="SUPPRIMER" />
                    <Btn v="danger" small onClick={deleteAccount} disabled={deleteConfirmText !== 'SUPPRIMER'}>Confirmer</Btn>
                    <Btn v="ghost" small onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}>Annuler</Btn>
                  </div>
                </div>
              )}
            </Card>
          </Section>
        </>
      )}

      {/* -------- UTILISATEURS -------- */}
      {subTab === 'Utilisateurs' && (
        <Section title="GESTION DES UTILISATEURS" sub="Ajoutez et gérez les membres de votre équipe">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 12, color: T.textSecondary }}>{users.length} utilisateur{users.length > 1 ? 's' : ''} sur votre forfait</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Inp small value={inviteEmail} onChange={(v) => { setInviteEmail(v); setInviteError(''); }} placeholder="email@exemple.com" onKeyDown={(e) => e.key === 'Enter' && inviteUser()} />
                <Btn onClick={inviteUser} aria-label="Inviter un utilisateur" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>+ Inviter</Btn>
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

          <ConfirmDialog
            open={del.isOpen}
            title="Retirer cet utilisateur ?"
            message="L'utilisateur n'aura plus accès à votre espace client."
            onConfirm={del.execute}
            onCancel={del.cancel}
          />
        </Section>
      )}

      {/* -------- FACTURATION -------- */}
      {subTab === 'Facturation' && (
        <>
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: T.textSecondary, fontSize: 12 }}>Paiement sécurisé via Stripe. Annulez à tout moment.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 }}>
              <span style={{ fontSize: 12, fontWeight: annual ? 500 : 700, color: annual ? T.textMuted : T.text }}>Mensuel</span>
              <Toggle on={annual} onToggle={() => setAnnual(!annual)} label={<><span>Annuel</span> <span style={{ color: T.green, fontWeight: 700 }}>-20%</span></>} />
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
                      {active ? 'Plan actuel' : 'Choisir'}
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* -------- INTÉGRATIONS -------- */}
      {subTab === 'Intégrations' && (
        <Section title="INTÉGRATIONS API" sub="Connectez vos outils et services externes">
          {/* Search bar + Category filter */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 220px', position: 'relative' }}>
                <input
                  type="text"
                  value={integrationSearch}
                  onChange={(e) => setIntegrationSearch(e.target.value)}
                  placeholder="Rechercher une intégration..."
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
                {Object.values(integrations).filter(Boolean).length}/{INTEGRATIONS.length} connectées
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
              { label: '💳 Paiements & E-commerce', cat: 'paiements' },
              { label: '🏦 Banque & Comptabilité', cat: 'banque' },
              { label: '📅 Agenda', cat: 'agenda' },
              { label: '📈 CRM & Gestion', cat: 'crm' },
              { label: '📧 Email Marketing & Automation', cat: 'marketing' },
              { label: '📋 Gestion de projet & Communication', cat: 'projet' },
              { label: '📣 Publicité', cat: 'publicite' },
              { label: '🎧 Support Client', cat: 'support' },
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
                      const syncing = syncStatus[ig.name] === 'syncing';
                      const justSynced = syncStatus[ig.name] === 'done';
                      const meta = connected ? getIntegrationMeta(ig.name) : null;
                      return (
                        <Card key={ig.name} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', cursor: connected ? 'pointer' : 'default' }}
                          onClick={connected ? () => setDetailModal(ig.name) : undefined}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: connected ? T.greenBg : T.surface2,
                            border: connected ? `1px solid ${T.green}22` : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                            transition: 'all .3s ease',
                          }}>{ig.icon}</div>
                          <div style={{ flex: 1, minWidth: 120 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{ig.name}</div>
                              {connected && !syncing && (
                                <Badge label="Connecté" color={T.green} bg={T.greenBg} />
                              )}
                              {syncing && (
                                <Badge label="Synchronisation..." color={T.orange} bg={T.orangeBg} />
                              )}
                              {justSynced && (
                                <Badge label="Données importées" color={T.green} bg={T.greenBg} />
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: T.textSecondary }}>{ig.desc}</div>
                            {connected && timestamp && (
                              <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>
                                Connecté le {new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                {meta && meta.accountId && <> — ID: {meta.accountId}</>}
                                {meta && meta.syncedContacts && <> — {meta.syncedContacts} contacts importés</>}
                                {meta && meta.syncedEvents && <> — {meta.syncedEvents} événements synchronisés</>}
                                {meta && meta.syncedItems && <> — {meta.syncedItems} éléments synchronisés</>}
                              </div>
                            )}
                          </div>
                          <div style={{
                            transition: 'transform .15s ease',
                            transform: isBouncing ? 'scale(1.2)' : 'scale(1)',
                          }} onClick={(e) => e.stopPropagation()}>
                            <Btn v={connected ? 'success' : 'secondary'} small onClick={() => toggleIntegration(ig.name)} disabled={syncing}>
                              {syncing ? '⟳ Sync...' : connected ? '✓ Connecté' : 'Connecter'}
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
                Aucune intégration ne correspond à votre recherche
              </div>
            )}
          </div>

          {/* Integration status summary */}
          {Object.values(integrations).some(Boolean) && (
            <Card style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 14 }}>{'🔗'}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>
                  Résumé des connexions
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
                    <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>Actif</div>
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
                      {connected ? 'Connecté' : 'Déconnecté'}
                    </span>
                    {timestamp && (
                      <span style={{ fontSize: 10, color: T.textMuted, marginLeft: 'auto' }}>
                        depuis le {new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  {connected && metaEntries.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
                        Détails de connexion
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
                          Historique de synchronisation
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

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {connected ? (
                      <>
                        <Btn v="secondary" small onClick={() => resyncIntegration(ig.name)}
                          disabled={syncStatus[ig.name] === 'syncing'} style={{ flex: 1 }}>
                          {syncStatus[ig.name] === 'syncing' ? '⟳ Sync...' : '⟳ Re-sync'}
                        </Btn>
                        <Btn v="danger" small onClick={() => { toggleIntegration(ig.name); setDetailModal(null); }} style={{ flex: 1 }}>
                          Déconnecter
                        </Btn>
                        <Btn v="ghost" small onClick={() => setDetailModal(null)}>
                          ✕
                        </Btn>
                      </>
                    ) : (
                      <>
                        <Btn v="primary" small onClick={() => { toggleIntegration(ig.name); setDetailModal(null); }}
                          style={{ flex: 1, background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
                          Connecter
                        </Btn>
                        <Btn v="ghost" small onClick={() => setDetailModal(null)} style={{ flex: 1 }}>
                          Fermer
                        </Btn>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* API Logs / Webhook Simulator */}
          <Card style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{'📡'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>Journal d'activité API</div>
                  <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 1 }}>Historique des appels API récents vers vos intégrations</div>
                </div>
              </div>
              <Btn v="secondary" small onClick={simulateApiCall} disabled={Object.values(integrations).filter(Boolean).length === 0}>
                Simuler un appel API
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
                Connectez une intégration pour voir les appels API
              </div>
            )}
          </Card>
        </Section>
      )}

      {/* -------- DATA & EXPORT -------- */}
      {subTab === 'Data & Export' && (
        <>
          <Section title="EXPORT DE DONNÉES" sub="Téléchargez vos données au format CSV ou JSON">
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Exporter les contacts (CSV)', sub: 'Nom, email, société, téléphone, statut, CA, date, source', icon: '👥', type: 'contacts' },
                  { label: 'Exporter les finances (CSV)', sub: 'Mois, CA, charges, résultat, trésorerie', icon: '💰', type: 'finances' },
                  { label: 'Exporter les événements (CSV)', sub: 'Titre, date, heure, type, description, source', icon: '📅', type: 'events' },
                  { label: 'Backup complet (JSON)', sub: 'Toutes les données : contacts, finances, événements, paramètres, intégrations', icon: '💾', type: 'backup' },
                ].map((e) => (
                  <div key={e.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: T.surface2, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 180 }}>
                      <span style={{ fontSize: 16 }}>{e.icon}</span>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{e.label}</span>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{e.sub}</div>
                      </div>
                    </div>
                    <Btn v="secondary" small onClick={() => exportData(e.type)}>Télécharger</Btn>
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          <Section title="RAPPORT FINANCIER PDF" sub="Générez un rapport financier imprimable avec synthèse visuelle">
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                  <span style={{ fontSize: 22 }}>{'📊'}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>Rapport financier</div>
                    <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                      Ouvre un rapport complet dans une nouvelle fenêtre : informations société, tableau détaillé CA/Charges/Résultat/Trésorerie, graphique d'évolution, et totaux.
                    </div>
                  </div>
                </div>
                <Btn onClick={generateFinancialReport} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Générer le rapport</Btn>
              </div>
            </Card>
          </Section>

          <Section title="EXPORT INTÉGRATIONS" sub="Exportez le statut de vos intégrations connectées">
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                  <span style={{ fontSize: 22 }}>{'🔗'}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>Statut des intégrations (CSV)</div>
                    <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                      Exporte la liste de toutes les intégrations avec leur statut de connexion, date et catégorie.
                    </div>
                  </div>
                </div>
                <Btn v="secondary" onClick={exportIntegrationsCSV}>Exporter CSV</Btn>
              </div>
            </Card>
          </Section>

          <Section title="IMPORT DE DONNÉES" sub="Restaurez vos données depuis un fichier de sauvegarde JSON">
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>{'📥'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>Importer un backup</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                    Sélectionnez un fichier <code style={{ background: T.surface2, padding: '1px 5px', borderRadius: 4, fontSize: 10 }}>hubscale_backup.json</code> pour restaurer vos données. Les données existantes seront écrasées.
                  </div>
                </div>
              </div>

              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                style={{ display: 'none' }}
                id="import-json"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Btn v="secondary" onClick={() => importInputRef.current?.click()}>Choisir un fichier JSON</Btn>
                {importSuccess && <Badge label="Import réussi !" color={T.green} bg={T.greenBg} />}
              </div>

              {importError && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: T.redBg, border: `1px solid ${T.red}22`, fontSize: 11, color: T.red, fontWeight: 600 }}>
                  {importError}
                </div>
              )}

              {importPreview && (
                <div style={{ marginTop: 14, padding: 16, borderRadius: 10, background: T.surface2, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>Aperçu de l'importation</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14 }}>
                    {[
                      { label: 'Contacts', value: importPreview.contacts, icon: '👥', color: T.accent },
                      { label: 'Finances (mois)', value: importPreview.finances, icon: '💰', color: T.green },
                      { label: 'Événements', value: importPreview.events, icon: '📅', color: T.blue },
                      { label: 'Paramètres société', value: importPreview.settings ? 'Oui' : 'Non', icon: '🏢', color: T.purple },
                      { label: 'Intégrations actives', value: importPreview.integrations, icon: '🔗', color: T.orange },
                    ].map((item) => (
                      <div key={item.label} style={{ padding: '10px 12px', borderRadius: 8, background: T.surface, textAlign: 'center' }}>
                        <div style={{ fontSize: 14, marginBottom: 2 }}>{item.icon}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</div>
                        <div style={{ fontSize: 9, color: T.textSecondary, marginTop: 2 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: T.orangeBg, border: `1px solid ${T.orange}22`, fontSize: 11, color: T.orange, marginBottom: 12 }}>
                    Attention : l'importation remplacera les données existantes pour chaque catégorie présente dans le fichier.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn onClick={confirmImport} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Confirmer l'import</Btn>
                    <Btn v="ghost" onClick={cancelImport}>Annuler</Btn>
                  </div>
                </div>
              )}
            </Card>
          </Section>
        </>
      )}

      {/* -------- RGPD -------- */}
      {subTab === 'RGPD & Légal' && (
        <Section title="RGPD & CONFORMITÉ" sub="Gestion des données personnelles">
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>Politique de confidentialité</div>
                <div style={{ fontSize: 11, color: T.textSecondary }}>
                  Vos données sont hébergées en Europe via Supabase. Nous ne partageons aucune donnée avec des tiers sans votre consentement.
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>Droit à l'oubli</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 8 }}>
                  Conformément au RGPD, vous pouvez demander la suppression complète de toutes vos données personnelles.
                </div>
                <Btn v="danger" small onClick={() => { setSubTab('Compte'); setShowDeleteConfirm(true); }}>Demander la suppression</Btn>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>Export des données (RGPD Art. 20)</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 8 }}>
                  Téléchargez l'intégralité de vos données dans un format portable.
                </div>
                <Btn v="secondary" small onClick={() => exportData('backup')}>Exporter mes données</Btn>
              </div>
            </div>
          </Card>
        </Section>
      )}
    </div>
  );
}
