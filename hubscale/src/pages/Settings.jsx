import React, { useState, useCallback, useMemo, useRef } from 'react';
import { T, getTheme, applyTheme } from '../lib/theme.js';
import { store, load } from '../lib/store.js';
import { Card, Section, Btn, Inp, Sel, TabBar, Toggle, ConfirmDialog, Badge, ProgressBar } from '../components/ui.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import { SECTORS, PLANS, INTEGRATIONS } from '../lib/constants.js';
import { onIntegrationConnect, getIntegrationMeta } from '../lib/integrationData.js';

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
        setTimeout(() => setSyncStatus((prev) => ({ ...prev, [name]: null })), 2000);
      }, 800);
    }
  }, [integrations]);

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
    };
    let content, filename, mime;
    if (type === 'contacts') {
      const header = 'Nom,Email,Société,Téléphone,Statut';
      const rows = data.contacts.map((c) => [c.name, c.email, c.company, c.phone, c.status].map(csvEscape).join(','));
      content = header + '\n' + rows.join('\n');
      filename = 'hubscale_contacts.csv'; mime = 'text/csv;charset=utf-8';
    } else if (type === 'finances') {
      const header = 'Mois,CA,Charges,Résultat';
      const rows = data.finances.map((r) => [r.key, r.ca, r.charges, r.result].map(csvEscape).join(','));
      content = header + '\n' + rows.join('\n');
      filename = 'hubscale_finances.csv'; mime = 'text/csv;charset=utf-8';
    } else if (type === 'events') {
      const header = 'Titre,Date,Heure,Type';
      const rows = data.events.map((e) => [e.title, e.date, e.time, e.type].map(csvEscape).join(','));
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {INTEGRATIONS.map((ig) => {
              const connected = !!integrations[ig.name];
              const timestamp = integrationTimestamps[ig.name];
              const isBouncing = bouncingIntegration === ig.name;
              const syncing = syncStatus[ig.name] === 'syncing';
              const justSynced = syncStatus[ig.name] === 'done';
              const meta = connected ? getIntegrationMeta(ig.name) : null;
              return (
                <Card key={ig.name} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
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
                      </div>
                    )}
                  </div>
                  <div style={{
                    transition: 'transform .15s ease',
                    transform: isBouncing ? 'scale(1.2)' : 'scale(1)',
                  }}>
                    <Btn v={connected ? 'success' : 'secondary'} small onClick={() => toggleIntegration(ig.name)} disabled={syncing}>
                      {syncing ? '⟳ Sync...' : connected ? '✓ Connecté' : 'Connecter'}
                    </Btn>
                  </div>
                </Card>
              );
            })}
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
                  <div key={ig.name} style={{
                    padding: '10px 12px', borderRadius: 8, background: T.greenBg,
                    border: `1px solid ${T.green}22`, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{ig.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.green }}>{ig.name}</div>
                    <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>Actif</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Section>
      )}

      {/* -------- DATA & EXPORT -------- */}
      {subTab === 'Data & Export' && (
        <Section title="EXPORT DE DONNÉES" sub="Téléchargez vos données">
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Exporter les contacts (CSV)', icon: '👥', type: 'contacts' },
                { label: 'Exporter les finances (CSV)', icon: '💰', type: 'finances' },
                { label: 'Exporter les événements (CSV)', icon: '📅', type: 'events' },
                { label: 'Backup complet (JSON)', icon: '💾', type: 'backup' },
              ].map((e) => (
                <div key={e.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: T.surface2, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{e.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{e.label}</span>
                  </div>
                  <Btn v="secondary" small onClick={() => exportData(e.type)}>Télécharger</Btn>
                </div>
              ))}
            </div>
          </Card>
        </Section>
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
