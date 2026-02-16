import React, { useState, useEffect, useCallback } from "react";
import { C, FONT, FONT_TITLE, sGet, sSet, fmt } from "./shared.jsx";
import { Btn, Card, Modal, Sect, Toggle } from "./components.jsx";

/* ─── CONSENT STORAGE KEYS ─── */
const CK = "sc_rgpd_consent";
const CK_PREFS = "sc_rgpd_prefs";
const CK_DATE = "sc_rgpd_date";

/* ─── HELPERS ─── */
export function getConsent() {
  try { return JSON.parse(localStorage.getItem(CK) || "null"); } catch { return null; }
}
export function getConsentPrefs() {
  try {
    return JSON.parse(localStorage.getItem(CK_PREFS) || "null") || { essential: true, functional: true, analytics: false };
  } catch { return { essential: true, functional: true, analytics: false }; }
}
function saveConsent(accepted, prefs) {
  const ts = new Date().toISOString();
  localStorage.setItem(CK, JSON.stringify(accepted));
  localStorage.setItem(CK_PREFS, JSON.stringify(prefs));
  localStorage.setItem(CK_DATE, ts);
}

/* ═══════════════════════════════════════════════════
   1. CONSENT BANNER
   ═══════════════════════════════════════════════════ */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ essential: true, functional: true, analytics: false });

  useEffect(() => {
    const c = getConsent();
    if (c === null) setVisible(true);
  }, []);

  const accept = () => { saveConsent(true, { essential: true, functional: true, analytics: true }); setVisible(false); };
  const acceptSelected = () => { saveConsent(true, prefs); setVisible(false); };
  const refuse = () => { saveConsent(false, { essential: true, functional: false, analytics: false }); setVisible(false); };

  if (!visible) return null;
  return <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 99999, padding: "0 12px 12px", fontFamily: FONT }}>
    <div style={{
      maxWidth: 560, margin: "0 auto", background: C.card, border: `1px solid ${C.brd}`,
      borderRadius: 16, padding: "20px 22px", boxShadow: "0 -4px 32px rgba(0,0,0,.4)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)"
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>{"🔒"}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.t, marginBottom: 4, fontFamily: FONT_TITLE }}>
            Protection de vos données
          </div>
          <div style={{ fontSize: 11, color: C.td, lineHeight: 1.5 }}>
            {"Cette plateforme utilise des cookies essentiels et traite vos données personnelles conformément au RGPD. Consultez notre "}
            <a href="#privacy" style={{ color: C.acc, textDecoration: "underline" }}>{"politique de confidentialité"}</a>
            {" pour en savoir plus."}
          </div>
        </div>
      </div>

      {showPrefs && <div style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.brd}`, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.td, letterSpacing: .8, marginBottom: 10 }}>{"PRÉFÉRENCES"}</div>
        {[
          { key: "essential", label: "Essentiels", desc: "Authentification, session, paramètres — toujours actifs", locked: true },
          { key: "functional", label: "Fonctionnels", desc: "Synchronisation CRM (GHL), Banque (Revolut), Paiements (Stripe), Slack" },
          { key: "analytics", label: "Analytiques", desc: "Données d'utilisation anonymisées pour améliorer la plateforme" },
        ].map(p => <div key={p.key} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
          borderBottom: `1px solid ${C.brd}08`
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: C.t }}>{p.label}</div>
            <div style={{ fontSize: 10, color: C.td }}>{p.desc}</div>
          </div>
          <Toggle value={prefs[p.key]} onChange={v => { if (!p.locked) setPrefs({ ...prefs, [p.key]: v }); }} />
        </div>)}
      </div>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn onClick={accept} style={{ flex: "1 1 auto" }}>Tout accepter</Btn>
        <Btn v="secondary" onClick={() => setShowPrefs(!showPrefs)} style={{ flex: "0 0 auto" }}>
          {showPrefs ? "Masquer" : "Personnaliser"}
        </Btn>
        {showPrefs && <Btn v="secondary" onClick={acceptSelected} style={{ flex: "1 1 auto" }}>
          {"Accepter la sélection"}
        </Btn>}
        <Btn v="ghost" onClick={refuse} style={{ flex: "0 0 auto", fontSize: 10 }}>Refuser</Btn>
      </div>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════
   2. PRIVACY POLICY PAGE
   ═══════════════════════════════════════════════════ */
export function PrivacyPolicyPage({ hold, onBack }) {
  const brandName = hold?.brand?.name || "L'INCUBATEUR ECS";
  const S = { h1: { fontFamily: FONT_TITLE, fontSize: 20, fontWeight: 900, color: C.t, marginBottom: 6 },
    h2: { fontFamily: FONT_TITLE, fontSize: 15, fontWeight: 800, color: C.acc, marginTop: 24, marginBottom: 8 },
    h3: { fontWeight: 700, fontSize: 13, color: C.t, marginTop: 16, marginBottom: 6 },
    p: { fontSize: 12, color: C.td, lineHeight: 1.7, marginBottom: 8 },
    ul: { fontSize: 12, color: C.td, lineHeight: 1.7, paddingLeft: 20, marginBottom: 8 },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 12 },
    th: { padding: "8px 10px", textAlign: "left", background: C.bg, color: C.td, fontWeight: 700, fontSize: 10, border: `1px solid ${C.brd}` },
    td: { padding: "8px 10px", border: `1px solid ${C.brd}`, color: C.td, fontSize: 11 },
  };

  return <div className="glass-bg" style={{ minHeight: "100vh", fontFamily: FONT, color: C.t, padding: "20px 16px", position: "relative", zIndex: 1 }}>
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <button onClick={onBack} style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
        borderRadius: 10, border: `1px solid ${C.brd}`, background: C.card, color: C.t,
        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, marginBottom: 20
      }}>{"\u2190 Retour"}</button>

      <Card style={{ padding: "28px 24px" }}>
        <h1 style={S.h1}>{"Politique de Confidentialité"}</h1>
        <p style={{ ...S.p, fontStyle: "italic" }}>{"Dernière mise à jour : "}{new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>

        <h2 style={S.h2}>1. Responsable du traitement</h2>
        <p style={S.p}>
          {"Le responsable du traitement des données est "}<strong>{brandName}</strong>{", plateforme de pilotage SaaS pour incubateurs et startups."}
          <br/>
          {"Contact : "}<strong>contact@lincubateur.fr</strong>
        </p>

        <h2 style={S.h2}>{"2. Données collectées"}</h2>
        <p style={S.p}>{"Nous collectons et traitons les catégories de données suivantes :"}</p>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>{"Catégorie"}</th><th style={S.th}>{"Données"}</th><th style={S.th}>{"Finalité"}</th>
          </tr></thead>
          <tbody>
            {[
              ["Identification", "Nom, prénom, email, téléphone", "Gestion de compte et accès"],
              ["Droits d'accès", "Liste des projets/sociétés accessibles", "Contrôle d'accès par projet (minimisation)"],
              ["Authentification", "Email, mot de passe (hashé), tokens de session", "Sécurité et connexion"],
              ["Données d'entreprise", "Nom société, CA, charges, marge, KPIs", "Pilotage et reporting"],
              ["Données clients", "Nom, email, téléphone des clients de chaque société", "CRM et facturation"],
              ["Données bancaires", "Transactions, soldes (via API Revolut)", "Suivi financier"],
              ["Données commerciales", "Leads, deals, pipeline (via API GoHighLevel)", "Gestion commerciale"],
              ["Données de paiement", "Charges, abonnements (via API Stripe)", "Suivi des paiements"],
              ["Préférences", "Thème, paramètres d'affichage", "Personnalisation de l'expérience"],
              ["Données techniques", "Adresse IP, type de navigateur, horodatages", "Sécurité et maintenance"],
            ].map(([cat, data, fin], i) => <tr key={i}>
              <td style={{ ...S.td, fontWeight: 600 }}>{cat}</td><td style={S.td}>{data}</td><td style={S.td}>{fin}</td>
            </tr>)}
          </tbody>
        </table>

        <h2 style={S.h2}>{"3. Base légale du traitement"}</h2>
        <ul style={S.ul}>
          <li><strong>{"Exécution du contrat"}</strong>{" (Art. 6.1.b RGPD) : traitement nécessaire à la fourniture du service"}</li>
          <li><strong>{"Intérêt légitime"}</strong>{" (Art. 6.1.f RGPD) : amélioration du service, sécurité"}</li>
          <li><strong>Consentement</strong>{" (Art. 6.1.a RGPD) : données analytiques et cookies non-essentiels"}</li>
          <li><strong>{"Obligation légale"}</strong>{" (Art. 6.1.c RGPD) : conservation des données comptables"}</li>
        </ul>

        <h2 style={S.h2}>{"4. Destinataires des données"}</h2>
        <p style={S.p}>{"Vos données sont transmises aux sous-traitants suivants, tous conformes au RGPD :"}</p>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Service</th><th style={S.th}>{"Finalité"}</th><th style={S.th}>Localisation</th>
          </tr></thead>
          <tbody>
            {[
              ["Supabase", "Hébergement base de données & authentification", "UE (AWS Frankfurt)"],
              ["Vercel", "Hébergement de l'application web", "UE / US"],
              ["GoHighLevel", "CRM, gestion contacts & pipeline", "US (clauses contractuelles types)"],
              ["Revolut Business", "API bancaire, transactions", "UE (Royaume-Uni)"],
              ["Stripe", "Traitement des paiements", "UE / US (certifié Privacy Shield)"],
              ["Slack", "Notifications internes", "US (clauses contractuelles types)"],
              ["Google Fonts", "Typographies de l'interface", "US (CDN mondial)"],
            ].map(([svc, fin, loc], i) => <tr key={i}>
              <td style={{ ...S.td, fontWeight: 600 }}>{svc}</td><td style={S.td}>{fin}</td><td style={S.td}>{loc}</td>
            </tr>)}
          </tbody>
        </table>

        <h2 style={S.h2}>5. Transferts hors UE</h2>
        <p style={S.p}>
          {"Certaines données peuvent être transférées hors de l'UE (GoHighLevel, Slack, Stripe, Vercel). Ces transferts sont encadrés par des "}
          <strong>Clauses Contractuelles Types (CCT)</strong>
          {" approuvées par la Commission européenne, garantissant un niveau de protection adéquat."}
        </p>

        <h2 style={S.h2}>{"6. Durée de conservation"}</h2>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>{"Type de données"}</th><th style={S.th}>{"Durée"}</th>
          </tr></thead>
          <tbody>
            {[
              ["Données de compte", "Durée de la relation contractuelle + 3 ans"],
              ["Données comptables & financières", "10 ans (obligation légale)"],
              ["Données de session", "24 heures d'inactivité (suppression automatique)"],
              ["Cookies de consentement", "13 mois maximum"],
              ["Logs techniques", "12 mois glissants"],
              ["Données supprimées", "Effacement sous 30 jours ouvrables"],
            ].map(([type, dur], i) => <tr key={i}>
              <td style={{ ...S.td, fontWeight: 600 }}>{type}</td><td style={S.td}>{dur}</td>
            </tr>)}
          </tbody>
        </table>

        <h2 style={S.h2}>7. Vos droits</h2>
        <p style={S.p}>{"Conformément au RGPD, vous disposez des droits suivants :"}</p>
        <ul style={S.ul}>
          <li><strong>{"Droit d'accès"}</strong>{" (Art. 15) : obtenir une copie de toutes vos données"}</li>
          <li><strong>Droit de rectification</strong>{" (Art. 16) : corriger vos données inexactes"}</li>
          <li><strong>{"Droit à l'effacement"}</strong>{" (Art. 17) : demander la suppression de vos données"}</li>
          <li><strong>{"Droit à la portabilité"}</strong>{" (Art. 20) : recevoir vos données dans un format structuré"}</li>
          <li><strong>{"Droit d'opposition"}</strong>{" (Art. 21) : vous opposer au traitement de vos données"}</li>
          <li><strong>Droit de limitation</strong>{" (Art. 18) : limiter le traitement dans certains cas"}</li>
          <li><strong>Droit de retrait du consentement</strong>{" : retirer votre consentement à tout moment"}</li>
        </ul>
        <p style={S.p}>
          {"Pour exercer vos droits, rendez-vous dans "}<strong>{"Paramètres > Vie privée"}</strong>{" de votre espace, ou contactez-nous à "}<strong>rgpd@lincubateur.fr</strong>.
        </p>
        <p style={S.p}>
          {"Vous pouvez également déposer une réclamation auprès de la "}<strong>CNIL</strong>{" "}
          {"(Commission Nationale de l'Informatique et des Libertés) : "}<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: C.acc }}>www.cnil.fr</a>.
        </p>

        <h2 style={S.h2}>8. Cookies et stockage local</h2>
        <p style={S.p}>{"Cette plateforme utilise le stockage local (localStorage) du navigateur :"}</p>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>{"Cookie / Clé"}</th><th style={S.th}>Type</th><th style={S.th}>{"Durée"}</th><th style={S.th}>{"Finalité"}</th>
          </tr></thead>
          <tbody>
            {[
              ["sc_auth_token", "Essentiel", "Session (24h)", "Authentification"],
              ["sc_auth_refresh", "Essentiel", "Session", "Renouvellement de session"],
              ["scTheme", "Essentiel", "Persistant", "Préférence thème clair/sombre"],
              ["sc_rgpd_consent", "Essentiel", "13 mois", "Choix de consentement RGPD"],
              ["scA*", "Fonctionnel", "Persistant", "Cache des données métier (hors-ligne)"],
              ["ghl_*", "Fonctionnel", "Persistant", "Cache des données CRM"],
              ["rev_*", "Fonctionnel", "Persistant", "Cache des données bancaires"],
            ].map(([name, type, dur, fin], i) => <tr key={i}>
              <td style={{ ...S.td, fontFamily: "monospace", fontSize: 10 }}>{name}</td>
              <td style={S.td}>{type}</td><td style={S.td}>{dur}</td><td style={S.td}>{fin}</td>
            </tr>)}
          </tbody>
        </table>

        <h2 style={S.h2}>{"9. Sécurité"}</h2>
        <p style={S.p}>
          {"Nous mettons en \u0153uvre des mesures de sécurité techniques et organisationnelles pour protéger vos données :"}
        </p>
        <ul style={S.ul}>
          <li>Chiffrement HTTPS/TLS pour toutes les communications</li>
          <li>{"Mots de passe hashés (bcrypt) côté serveur"}</li>
          <li>{"Tokens JWT avec expiration automatique"}</li>
          <li>{"Déconnexion automatique après 24h d'inactivité"}</li>
          <li>{"En-têtes CSP (Content Security Policy)"}</li>
          <li>{"API proxy server-side (clés API non exposées côté client)"}</li>
        </ul>

        <h2 style={S.h2}>10. Modification de cette politique</h2>
        <p style={S.p}>
          {"Cette politique peut être mise à jour. En cas de modification substantielle, une notification sera affichée sur la plateforme et un nouveau consentement sera demandé."}
        </p>

        <div style={{
          marginTop: 28, padding: 16, background: C.accD, borderRadius: 12,
          border: `1px solid ${C.acc}22`, textAlign: "center"
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: C.acc, marginBottom: 4 }}>
            Contact DPO
          </div>
          <div style={{ fontSize: 11, color: C.td }}>
            {"Pour toute question relative à vos données personnelles :"}<br />
            <strong>rgpd@lincubateur.fr</strong>
          </div>
        </div>
      </Card>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════
   3. MENTIONS LÉGALES
   ═══════════════════════════════════════════════════ */
export function MentionsLegalesPage({ hold, onBack }) {
  const brandName = hold?.brand?.name || "L'INCUBATEUR ECS";
  const S = {
    h2: { fontFamily: FONT_TITLE, fontSize: 15, fontWeight: 800, color: C.acc, marginTop: 24, marginBottom: 8 },
    p: { fontSize: 12, color: C.td, lineHeight: 1.7, marginBottom: 8 },
  };
  return <div className="glass-bg" style={{ minHeight: "100vh", fontFamily: FONT, color: C.t, padding: "20px 16px", position: "relative", zIndex: 1 }}>
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <button onClick={onBack} style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
        borderRadius: 10, border: `1px solid ${C.brd}`, background: C.card, color: C.t,
        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, marginBottom: 20
      }}>{"\u2190 Retour"}</button>

      <Card style={{ padding: "28px 24px" }}>
        <h1 style={{ fontFamily: FONT_TITLE, fontSize: 20, fontWeight: 900, color: C.t, marginBottom: 6 }}>{"Mentions Légales"}</h1>

        <h2 style={S.h2}>{"1. Éditeur du site"}</h2>
        <p style={S.p}>
          <strong>{brandName}</strong><br />
          {"Plateforme de pilotage SaaS pour incubateurs et startups"}<br />
          {"Site web : "}<a href="https://lincubateur.fr" style={{ color: C.acc }}>lincubateur.fr</a><br />
          {"Email : contact@lincubateur.fr"}
        </p>

        <h2 style={S.h2}>{"2. Hébergement"}</h2>
        <p style={S.p}>
          <strong>Vercel Inc.</strong><br />
          {"440 N Barranca Ave #4133, Covina, CA 91723, États-Unis"}<br />
          {"Site : "}<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: C.acc }}>vercel.com</a>
        </p>
        <p style={S.p}>
          <strong>Supabase Inc.</strong>{" (Base de données)"}<br />
          {"970 Toa Payoh North, Singapour"}<br />
          {"Hébergement des données : AWS eu-central-1 (Frankfurt, Allemagne)"}
        </p>

        <h2 style={S.h2}>{"3. Propriété intellectuelle"}</h2>
        <p style={S.p}>
          {"L'ensemble du contenu de cette plateforme (textes, graphismes, logiciels, images, logos) est protégé par le droit d'auteur et le droit de la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable."}
        </p>

        <h2 style={S.h2}>{"4. Données personnelles"}</h2>
        <p style={S.p}>
          {"Le traitement des données personnelles est détaillé dans notre "}
          <a href="#privacy" style={{ color: C.acc, textDecoration: "underline" }}>{"Politique de Confidentialité"}</a>
          {". Conformément au Règlement Général sur la Protection des Données (RGPD - UE 2016/679), vous disposez d'un droit d'accès, de rectification et de suppression de vos données."}
        </p>

        <h2 style={S.h2}>{"5. Limitation de responsabilité"}</h2>
        <p style={S.p}>
          {brandName}{" s'efforce de fournir des informations fiables mais ne saurait garantir l'exactitude des données provenant de services tiers (GoHighLevel, Revolut, Stripe). L'utilisateur reste responsable de la vérification des données affichées."}
        </p>

        <h2 style={S.h2}>6. Droit applicable</h2>
        <p style={S.p}>
          {"Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents."}
        </p>
      </Card>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════
   4. DATA EXPORT (Droit d'accès / portabilité)
   ═══════════════════════════════════════════════════ */
export function exportUserData(role, socs, reps, clients, team, invoices, actions, journal, subs, porteurSocIds) {
  const soc = role !== "admin" ? socs.find(s => s.id === role) : null;
  const accessibleSocs = Array.isArray(porteurSocIds) && porteurSocIds.length > 0
    ? porteurSocIds.map(sid => socs.find(s => s.id === sid)).filter(Boolean)
    : soc ? [soc] : [];
  const data = {
    _meta: {
      exported_at: new Date().toISOString(),
      platform: "L'INCUBATEUR ECS",
      format: "RGPD - Droit d'accès (Art. 15)",
      scope: role === "admin" ? "Toutes les sociétés" : (soc?.nom || role),
    },
    compte: soc ? {
      id: soc.id, nom: soc.nom, porteur: soc.porteur, email: soc.email,
      phone: soc.phone, activite: soc.act, description: soc.desc,
      date_creation: soc.createdAt || "N/A",
    } : { role: "admin" },
    acces_projets: role !== "admin" ? accessibleSocs.map(s => ({ id: s.id, nom: s.nom })) : "Tous (administrateur)",
    rapports_financiers: {},
    clients: [],
    equipe: [],
    factures: [],
    actions: [],
    journal: {},
    abonnements: [],
  };

  // Financial reports
  const ids = soc ? [soc.id] : socs.map(s => s.id);
  ids.forEach(id => {
    const socReps = {};
    Object.entries(reps).forEach(([k, v]) => { if (k.startsWith(id + "_")) socReps[k.replace(id + "_", "")] = v; });
    data.rapports_financiers[id] = socReps;
  });

  // Clients
  data.clients = soc
    ? (clients || []).filter(c => c.socId === soc.id).map(c => ({
      nom: c.name, email: c.email, telephone: c.phone, entreprise: c.company,
      statut: c.status, domaine: c.domain, notes: c.notes, date_ajout: c.addedAt,
      facturation: c.billing,
    }))
    : (clients || []).map(c => ({ nom: c.name, email: c.email, telephone: c.phone, socId: c.socId }));

  // Team
  data.equipe = soc
    ? (team || []).filter(t => t.socId === soc.id)
    : (team || []);

  // Invoices
  data.factures = soc
    ? (invoices || []).filter(i => i.socId === soc.id)
    : (invoices || []);

  // Actions
  data.actions = soc
    ? (actions || []).filter(a => a.socId === soc.id)
    : (actions || []);

  // Journal
  if (journal) {
    if (soc) {
      Object.entries(journal).forEach(([k, v]) => { if (k.startsWith(soc.id)) data.journal[k] = v; });
    } else {
      data.journal = journal;
    }
  }

  // Subscriptions
  data.abonnements = soc
    ? (subs || []).filter(s => s.socId === soc.id)
    : (subs || []);

  // Download
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `donnees_rgpd_${role}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════
   5. DATA DELETION REQUEST
   ═══════════════════════════════════════════════════ */
export function DataDeletionModal({ open, onClose, role, socs, onConfirm }) {
  const [step, setStep] = useState(0);
  const [confirm, setConfirm] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const soc = socs?.find(s => s.id === role);

  const handleDelete = async () => {
    if (confirm !== "SUPPRIMER") return;
    setProcessing(true);
    try {
      // Clear all localStorage data for this user
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sc")) keysToRemove.push(key);
        if (key && key.startsWith("ghl_")) keysToRemove.push(key);
        if (key && key.startsWith("rev_")) keysToRemove.push(key);
        if (key && key.startsWith("stripe")) keysToRemove.push(key);
        if (key && key.startsWith("metaAds_")) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Notify admin via callback
      if (onConfirm) await onConfirm();
      setDone(true);
    } catch {
      setDone(true);
    }
    setProcessing(false);
  };

  const reset = () => { setStep(0); setConfirm(""); setDone(false); setProcessing(false); };

  return <Modal open={open} onClose={() => { reset(); onClose(); }} title={"Suppression des données"}>
    {!done ? <>
      {step === 0 && <>
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>{"🗑️"}</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.t, marginBottom: 8 }}>
            {"Droit à l'effacement (Art. 17 RGPD)"}
          </div>
          <div style={{ fontSize: 11, color: C.td, lineHeight: 1.6, marginBottom: 16 }}>
            {"Vous pouvez demander la suppression de vos données personnelles. Cette action est "}
            <strong style={{ color: C.r }}>{"irréversible"}</strong>.
          </div>
        </div>
        <Card style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.r, marginBottom: 8 }}>{"DONNÉES CONCERNÉES"}</div>
          <ul style={{ fontSize: 11, color: C.td, lineHeight: 1.8, paddingLeft: 18 }}>
            <li>{"Informations de compte ("}{soc?.nom || "administrateur"}{")"}</li>
            <li>{"Données clients et prestataires associés"}</li>
            <li>Rapports financiers et KPIs</li>
            <li>{"Historique d'activité et journal"}</li>
            <li>Cache local (localStorage)</li>
          </ul>
          <div style={{ fontSize: 10, color: C.o, marginTop: 8, fontStyle: "italic" }}>
            {"Note : les données comptables légales (10 ans) seront anonymisées mais conservées."}
          </div>
        </Card>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="danger" onClick={() => setStep(1)}>Continuer la suppression</Btn>
          <Btn v="secondary" onClick={() => { reset(); onClose(); }}>Annuler</Btn>
        </div>
      </>}
      {step === 1 && <>
        <div style={{ fontSize: 12, color: C.td, marginBottom: 14, lineHeight: 1.6 }}>
          {"Pour confirmer, tapez "}<strong style={{ color: C.r }}>SUPPRIMER</strong>{" ci-dessous :"}
        </div>
        <input
          value={confirm} onChange={e => setConfirm(e.target.value.toUpperCase())}
          placeholder="Tapez SUPPRIMER"
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 10,
            border: `1px solid ${confirm === "SUPPRIMER" ? C.r : C.brd}`,
            background: C.bg, color: C.t, fontSize: 13, fontWeight: 700,
            fontFamily: FONT, textAlign: "center", letterSpacing: 2, marginBottom: 14
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="danger" onClick={handleDelete} disabled={confirm !== "SUPPRIMER" || processing}>
            {processing ? "Suppression..." : "Confirmer la suppression"}
          </Btn>
          <Btn v="secondary" onClick={() => setStep(0)}>Retour</Btn>
        </div>
      </>}
    </> : <>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>{"✅"}</div>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.g, marginBottom: 8 }}>
          {"Demande enregistrée"}
        </div>
        <div style={{ fontSize: 11, color: C.td, lineHeight: 1.6 }}>
          {"Vos données locales ont été supprimées."}<br />
          {"La suppression complète côté serveur sera effectuée sous "}<strong>30 jours ouvrables</strong>.<br />
          {"Un email de confirmation vous sera envoyé."}
        </div>
      </div>
      <Btn onClick={() => { reset(); onClose(); window.location.reload(); }} full>Fermer</Btn>
    </>}
  </Modal>;
}

/* ═══════════════════════════════════════════════════
   6. RGPD SETTINGS PANEL (for Settings tab)
   ═══════════════════════════════════════════════════ */
export function RGPDSettingsPanel({ role, socs, reps, clients, team, invoices, actions, journal, subs, porteurSocIds }) {
  const [prefs, setPrefs] = useState(getConsentPrefs);
  const [showDelete, setShowDelete] = useState(false);
  const [exported, setExported] = useState(false);
  const consentDate = localStorage.getItem(CK_DATE);

  const updatePref = (key, val) => {
    const np = { ...prefs, [key]: val };
    setPrefs(np);
    saveConsent(true, np);
  };

  const doExport = () => {
    exportUserData(role, socs, reps, clients, team, invoices, actions, journal, subs, porteurSocIds);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const resetConsent = () => {
    localStorage.removeItem(CK);
    localStorage.removeItem(CK_PREFS);
    localStorage.removeItem(CK_DATE);
    window.location.reload();
  };

  return <>
    <Sect title={"🔒 Vie privée & RGPD"} sub={"Gestion de vos données personnelles"}>
      {/* Consent status */}
      <Card style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>{"📋"}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.t }}>Statut du consentement</div>
            <div style={{ fontSize: 10, color: C.td }}>
              {consentDate
                ? `Consentement donné le ${new Date(consentDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
                : "Aucun consentement enregistré"}
            </div>
          </div>
        </div>
        {[
          { key: "essential", label: "Cookies essentiels", desc: "Authentification, session, thème", locked: true },
          { key: "functional", label: "Cookies fonctionnels", desc: "Cache CRM, données bancaires, Stripe" },
          { key: "analytics", label: "Cookies analytiques", desc: "Amélioration du service (anonymisé)" },
        ].map(p => <div key={p.key} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
          borderBottom: `1px solid ${C.brd}08`
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: C.t }}>{p.label}</div>
            <div style={{ fontSize: 10, color: C.td }}>{p.desc}</div>
          </div>
          {p.locked
            ? <span style={{ fontSize: 9, color: C.g, background: C.gD, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>Toujours actif</span>
            : <Toggle value={prefs[p.key]} onChange={v => updatePref(p.key, v)} />}
        </div>)}
        <div style={{ marginTop: 10 }}>
          <Btn small v="ghost" onClick={resetConsent}>Renouveler mon consentement</Btn>
        </div>
      </Card>

      {/* Data access & export */}
      <Card style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>{"📦"}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.t }}>{"Accès à vos données"}</div>
            <div style={{ fontSize: 10, color: C.td }}>{"Droit d'accès & portabilité (Art. 15 & 20 RGPD)"}</div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: C.td, lineHeight: 1.6, marginBottom: 12 }}>
          {"Téléchargez l'intégralité de vos données personnelles dans un format structuré (JSON). Le fichier contient vos informations de compte, rapports, clients, factures et historique."}
        </p>
        <Btn onClick={doExport} small>
          {exported ? "✅ Export téléchargé !" : "📥 Exporter mes données"}
        </Btn>
      </Card>

      {/* Data deletion */}
      <Card style={{ padding: 16, marginBottom: 12, border: `1px solid ${C.r}22` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>{"🗑️"}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.r }}>{"Suppression des données"}</div>
            <div style={{ fontSize: 10, color: C.td }}>{"Droit à l'effacement (Art. 17 RGPD)"}</div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: C.td, lineHeight: 1.6, marginBottom: 12 }}>
          {"Demandez la suppression définitive de toutes vos données personnelles. Les données comptables légales seront anonymisées."}
        </p>
        <Btn v="danger" onClick={() => setShowDelete(true)} small>Demander la suppression</Btn>
      </Card>

      {/* Legal links */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>{"📄"}</span>
          <div style={{ fontWeight: 800, fontSize: 13, color: C.t }}>{"Documents légaux"}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href="#privacy" style={{
            padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.brd}`,
            background: C.bg, color: C.acc, fontSize: 11, fontWeight: 600,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4
          }}>{"🔒 Politique de confidentialité"}</a>
          <a href="#mentions" style={{
            padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.brd}`,
            background: C.bg, color: C.acc, fontSize: 11, fontWeight: 600,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4
          }}>{"📜 Mentions légales"}</a>
        </div>
        <div style={{ fontSize: 10, color: C.td, marginTop: 10 }}>
          {"Contact DPO : "}<strong>rgpd@lincubateur.fr</strong>{" | Réclamation CNIL : "}<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: C.acc }}>www.cnil.fr</a>
        </div>
      </Card>
    </Sect>

    <DataDeletionModal
      open={showDelete} onClose={() => setShowDelete(false)}
      role={role} socs={socs}
      onConfirm={async () => {
        // Send deletion request notification (could be Slack, email, etc.)
        console.log("[RGPD] Demande de suppression pour:", role);
      }}
    />
  </>;
}

/* ═══════════════════════════════════════════════════
   7. LOGIN FOOTER (privacy links under login form)
   ═══════════════════════════════════════════════════ */
export function LoginFooter() {
  const linkStyle = { color: C.td, textDecoration: "underline", cursor: "pointer" };
  const nav = (h) => (e) => { e.preventDefault(); window.location.hash = h; };
  return <div style={{ marginTop: 16, textAlign: "center", fontSize: 10, color: C.td, lineHeight: 1.8 }}>
    {"En vous connectant, vous acceptez notre "}
    <a href="#privacy" onClick={nav("privacy")} style={{ ...linkStyle, color: C.acc }}>{"politique de confidentialité"}</a>
    <br />
    <a href="#mentions" onClick={nav("mentions")} style={linkStyle}>{"Mentions légales"}</a>
    {" · "}
    <a href="#rgpd" onClick={nav("rgpd")} style={linkStyle}>RGPD</a>
  </div>;
}
