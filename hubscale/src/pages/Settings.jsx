import React, { useState } from 'react';
import { T } from '../lib/theme.js';
import { Card, Section, Btn, Inp, Sel } from '../components/ui.jsx';

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

export default function Settings() {
  const [subTab, setSubTab] = useState('Compte');
  const [company, setCompany] = useState({
    name: '', siret: '', tva: '', sector: '', address: '', city: '', zip: '', email: '', phone: '', website: '',
  });

  const upd = (k, v) => setCompany({ ...company, [k]: v });

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Paramètres</h1>
        <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>Configuration de votre espace client</p>
      </div>

      {/* Sub-tabs */}
      <div className="fade-up d1" style={{ display: 'flex', gap: 0, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 24, flexWrap: 'wrap' }}>
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

      {subTab === 'Compte' && (
        <>
          <Section title="INFORMATIONS DE LA SOCIÉTÉ" sub="Données légales et coordonnées">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 0, columnGap: 16 }}>
                <Inp label="Raison sociale" value={company.name} onChange={(v) => upd('name', v)} placeholder="Nom de votre société" />
                <Inp label="SIRET" value={company.siret} onChange={(v) => upd('siret', v)} placeholder="123 456 789 00012" />
                <Inp label="N° TVA intracommunautaire" value={company.tva} onChange={(v) => upd('tva', v)} placeholder="FR 12 345678901" />
                <Sel label="Secteur d'activité" value={company.sector} onChange={(v) => upd('sector', v)} options={SECTORS} />
                <Inp label="Adresse" value={company.address} onChange={(v) => upd('address', v)} placeholder="Rue, numéro" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Inp label="Ville" value={company.city} onChange={(v) => upd('city', v)} placeholder="Paris" />
                  <Inp label="Code postal" value={company.zip} onChange={(v) => upd('zip', v)} placeholder="75001" />
                </div>
                <Inp label="Email principal" value={company.email} onChange={(v) => upd('email', v)} type="email" placeholder="contact@societe.fr" />
                <Inp label="Téléphone" value={company.phone} onChange={(v) => upd('phone', v)} placeholder="+33 1 23 45 67 89" />
                <Inp label="Site web" value={company.website} onChange={(v) => upd('website', v)} placeholder="https://www.societe.fr" />
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Btn style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Sauvegarder</Btn>
              </div>
            </Card>
          </Section>

          {/* Danger zone */}
          <Section title="ZONE DANGEREUSE">
            <Card style={{ borderLeft: `3px solid ${T.red}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.red }}>Supprimer le compte</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                    Cette action est irréversible. Toutes les données seront définitivement supprimées.
                  </div>
                </div>
                <Btn v="danger">Supprimer mon compte</Btn>
              </div>
            </Card>
          </Section>
        </>
      )}

      {subTab === 'Utilisateurs' && (
        <Section title="GESTION DES UTILISATEURS" sub="Ajoutez et gérez les membres de votre équipe">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: T.textSecondary }}>1 utilisateur sur votre forfait</div>
              <Btn style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>+ Inviter</Btn>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: T.surface2, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: T.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: T.accent, fontSize: 14 }}>A</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>Admin</div>
                <div style={{ fontSize: 11, color: T.textSecondary }}>admin@entreprise.fr</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: T.accent, background: T.accentBg, padding: '3px 8px', borderRadius: 6 }}>Owner</span>
            </div>
          </Card>
        </Section>
      )}

      {subTab === 'Facturation' && (
        <Section title="ABONNEMENT" sub="Gérez votre forfait et vos paiements">
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: T.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Plan Starter</div>
                <div style={{ fontSize: 12, color: T.textSecondary }}>99€/mois — Renouvellement le 1er mars 2026</div>
              </div>
              <Btn v="secondary">Changer de plan</Btn>
            </div>
          </Card>
        </Section>
      )}

      {subTab === 'Intégrations' && (
        <Section title="INTÉGRATIONS API" sub="Connectez vos outils et services externes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Stripe', desc: 'Paiements et facturation', icon: '💳', connected: false },
              { name: 'Revolut', desc: 'Données bancaires', icon: '🏦', connected: false },
              { name: 'GoHighLevel', desc: 'CRM et marketing', icon: '📈', connected: false },
              { name: 'Meta Ads', desc: 'Publicité Facebook/Instagram', icon: '📣', connected: false },
            ].map((i) => (
              <Card key={i.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{i.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{i.name}</div>
                  <div style={{ fontSize: 11, color: T.textSecondary }}>{i.desc}</div>
                </div>
                <Btn v={i.connected ? 'success' : 'secondary'} small>{i.connected ? 'Connecté' : 'Connecter'}</Btn>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {subTab === 'Data & Export' && (
        <Section title="EXPORT DE DONNÉES" sub="Téléchargez vos données">
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Exporter les contacts (CSV)', icon: '👥' },
                { label: 'Exporter les finances (CSV)', icon: '💰' },
                { label: 'Exporter les événements (CSV)', icon: '📅' },
                { label: 'Backup complet (JSON)', icon: '💾' },
              ].map((e) => (
                <div key={e.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: T.surface2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{e.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{e.label}</span>
                  </div>
                  <Btn v="secondary" small>Télécharger</Btn>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

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
                <Btn v="danger" small>Demander la suppression</Btn>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>Export des données (RGPD Art. 20)</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 8 }}>
                  Téléchargez l'intégralité de vos données dans un format portable.
                </div>
                <Btn v="secondary" small>Exporter mes données</Btn>
              </div>
            </div>
          </Card>
        </Section>
      )}
    </div>
  );
}
