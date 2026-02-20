import React, { useState, useCallback } from 'react';
import { T } from '../lib/theme.js';
import { store, load } from '../lib/store.js';
import { Card, Section, Btn, Inp, Sel, TabBar, Toggle, ConfirmDialog } from '../components/ui.jsx';

const SUB_TABS = ['Compte', 'Utilisateurs', 'Facturation', 'Intégrations', 'Data & Export', 'RGPD & Légal'];

const SECTORS = [
  { value: '', label: 'Sélectionner...' },
  { value: 'tech', label: 'Tech / SaaS' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'services', label: 'Services' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'industrie', label: 'Industrie' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'sante', label: 'Santé' },
  { value: 'autre', label: 'Autre' },
];

const PLANS = [
  {
    id: 'starter', name: 'Starter', monthly: 99,
    features: ['Dashboard Overview', 'CRM basique (100 contacts)', 'Données financières', '1 utilisateur', 'Support email'],
  },
  {
    id: 'professional', name: 'Professional', monthly: 249, recommended: true,
    features: ['Tout Starter +', 'CRM avancé (illimité)', 'Sales Pipeline & Pub', 'Agenda complet', '5 utilisateurs', 'Intégrations API', 'Support prioritaire'],
  },
  {
    id: 'enterprise', name: 'Enterprise', monthly: 499,
    features: ['Tout Professional +', 'CI/CD Data Monitoring', 'Backup automatique 24h', 'KPI personnalisés', 'Utilisateurs illimités', 'Onboarding dédié', 'SLA 99.9%', 'Account manager'],
  },
];

const INTEGRATIONS = [
  { name: 'Stripe', desc: 'Paiements et facturation', icon: '💳' },
  { name: 'Revolut', desc: 'Données bancaires', icon: '🏦' },
  { name: 'GoHighLevel', desc: 'CRM et marketing', icon: '📈' },
  { name: 'Meta Ads', desc: 'Publicité Facebook/Instagram', icon: '📣' },
];

function csvEscape(val) {
  const s = String(val ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [removeTarget, setRemoveTarget] = useState(null);

  const upd = useCallback((k, v) => setCompany((prev) => ({ ...prev, [k]: v })), []);

  const saveCompany = useCallback(() => {
    store('settings_company', company);
    setSavedCompany(true);
    setTimeout(() => setSavedCompany(false), 2000);
  }, [company]);

  const toggleIntegration = useCallback((name) => {
    setIntegrations((prev) => {
      const updated = { ...prev, [name]: !prev[name] };
      store('integrations', updated);
      return updated;
    });
  }, []);

  const selectPlan = useCallback((id) => {
    setSelectedPlan(id);
    store('plan', id);
  }, []);

  const inviteUser = useCallback(() => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return;
    setUsers((prev) => {
      const updated = [...prev, { name: inviteEmail.split('@')[0], email: inviteEmail, role: 'Membre' }];
      store('users', updated);
      return updated;
    });
    setInviteEmail('');
  }, [inviteEmail]);

  const confirmRemoveUser = useCallback((email) => setRemoveTarget(email), []);

  const executeRemoveUser = useCallback(() => {
    if (removeTarget) {
      setUsers((prev) => {
        const updated = prev.filter((u) => u.email !== removeTarget);
        store('users', updated);
        return updated;
      });
      setRemoveTarget(null);
    }
  }, [removeTarget]);

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
    ['contacts', 'events', 'finHistory', 'settings_company', 'integrations', 'plan', 'users', 'onboarded', 'company', 'tools', 'apiKeys', 'dataSources'].forEach((k) => {
      try { localStorage.removeItem('hs_' + k); } catch {}
    });
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Inp small value={inviteEmail} onChange={setInviteEmail} placeholder="email@exemple.com" onKeyDown={(e) => e.key === 'Enter' && inviteUser()} />
                <Btn onClick={inviteUser} aria-label="Inviter un utilisateur" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>+ Inviter</Btn>
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
                  {u.role !== 'Owner' && <Btn v="ghost" small aria-label={`Retirer ${u.name}`} onClick={() => confirmRemoveUser(u.email)}>✕</Btn>}
                </div>
              ))}
            </div>
          </Card>

          <ConfirmDialog
            open={removeTarget !== null}
            title="Retirer cet utilisateur ?"
            message="L'utilisateur n'aura plus accès à votre espace client."
            onConfirm={executeRemoveUser}
            onCancel={() => setRemoveTarget(null)}
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
            {INTEGRATIONS.map((ig) => (
              <Card key={ig.name} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{ig.icon}</div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{ig.name}</div>
                  <div style={{ fontSize: 11, color: T.textSecondary }}>{ig.desc}</div>
                </div>
                <Btn v={integrations[ig.name] ? 'success' : 'secondary'} small onClick={() => toggleIntegration(ig.name)}>
                  {integrations[ig.name] ? '✓ Connecté' : 'Connecter'}
                </Btn>
              </Card>
            ))}
          </div>
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
