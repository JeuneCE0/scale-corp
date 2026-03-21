import React, { useState, useCallback, useRef } from 'react';
import { T } from '../../lib/theme.js';
import { store, load } from '../../lib/store.js';
import { Card, Section, Btn, Badge } from '../../components/ui.jsx';
import { INTEGRATIONS } from '../../lib/constants.js';
import { canAccessPro } from '../../lib/plan.js';
import { t } from '../../lib/i18n.js';

function csvEscape(val) {
  let s = String(val ?? '');
  // Prevent Excel formula injection
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function DataExportTab() {
  // --- JSON Import ---
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const importInputRef = useRef(null);

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

  return (
    <>
      <Section title={t('settings.dataExport').toUpperCase()} sub={t('common.export')}>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: t('settings.exportContacts'), sub: `${t('common.name')}, ${t('common.email')}, ${t('common.phone')}, ${t('common.status')}`, icon: '👥', type: 'contacts' },
              { label: t('settings.exportFinance'), sub: `CA, ${t('common.amount')}`, icon: '💰', type: 'finances' },
              { label: `${t('common.export')} (CSV)`, sub: `${t('common.title')}, ${t('common.date')}, ${t('common.type')}`, icon: '📅', type: 'events' },
              { label: `Backup (JSON)`, sub: t('common.export'), icon: '💾', type: 'backup' },
            ].map((e) => (
              <div key={e.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: T.surface2, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 180 }}>
                  <span style={{ fontSize: 16 }}>{e.icon}</span>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{e.label}</span>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{e.sub}</div>
                  </div>
                </div>
                <Btn v="secondary" small onClick={canAccessPro() ? () => exportData(e.type) : undefined} disabled={!canAccessPro()}>{canAccessPro() ? t('common.export') : '🔒 Pro'}</Btn>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title={`${t('common.export')} PDF`} sub={t('common.print')}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
              <span style={{ fontSize: 22 }}>{'📊'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{t('common.print')}</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                  {t('common.print')}
                </div>
              </div>
            </div>
            <Btn onClick={canAccessPro() ? generateFinancialReport : undefined} disabled={!canAccessPro()} style={{ background: canAccessPro() ? 'linear-gradient(135deg, #f97316, #f59e0b)' : T.surface2 }}>{canAccessPro() ? t('common.print') : '🔒 Pro'}</Btn>
          </div>
        </Card>
      </Section>

      <Section title={`${t('common.export')} ${t('settings.integrations')}`} sub={t('settings.integrations')}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
              <span style={{ fontSize: 22 }}>{'🔗'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{t('settings.integrations')} (CSV)</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                  {t('common.export')}
                </div>
              </div>
            </div>
            <Btn v="secondary" onClick={exportIntegrationsCSV}>{t('common.export')} CSV</Btn>
          </div>
        </Card>
      </Section>

      <Section title={`${t('common.add')} / Import`} sub="JSON">
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 22 }}>{'📥'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{t('common.add')} backup</div>
              <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                <code style={{ background: T.surface2, padding: '1px 5px', borderRadius: 4, fontSize: 10 }}>hubscale_backup.json</code>
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
            <Btn v="secondary" onClick={() => importInputRef.current?.click()}>{t('common.add')} JSON</Btn>
            {importSuccess && <Badge label={t('settings.saved')} color={T.green} bg={T.greenBg} />}
          </div>

          {importError && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: T.redBg, border: `1px solid ${T.red}22`, fontSize: 11, color: T.red, fontWeight: 600 }}>
              {importError}
            </div>
          )}

          {importPreview && (
            <div style={{ marginTop: 14, padding: 16, borderRadius: 10, background: T.surface2, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>{t('common.description')}</div>
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
                {t('common.irreversible')}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={confirmImport} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>{t('common.confirm')}</Btn>
                <Btn v="ghost" onClick={cancelImport}>{t('common.cancel')}</Btn>
              </div>
            </div>
          )}
        </Card>
      </Section>
    </>
  );
}
