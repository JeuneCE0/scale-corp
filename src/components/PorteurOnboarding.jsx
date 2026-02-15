import React, { useState, useRef, useEffect } from "react";
import * as U from "../utils/index.jsx";
const { C, FONT, FONT_TITLE, CSS, sSet, sbUpsert } = U;

const STEPS = [
  { id: "welcome", icon: "👋", label: "Bienvenue", title: "Bienvenue sur Scale Corp !", sub: "Votre espace de pilotage est prêt." },
  { id: "societe", icon: "🏢", label: "Société", title: "Informations société", sub: "Complétez le profil de votre société pour personnaliser votre expérience." },
  { id: "features", icon: "🚀", label: "Fonctionnalités", title: "Vos outils", sub: "Découvrez ce que la plateforme vous offre." },
  { id: "connect", icon: "🔗", label: "Connexion", title: "Vos intégrations", sub: "Vérifiez vos connexions API." },
  { id: "report", icon: "📊", label: "Premier rapport", title: "Votre premier rapport", sub: "Commencez à alimenter vos données." },
];

const FEATURES = [
  { icon: "📊", title: "Dashboard", desc: "Vue d'ensemble de vos KPIs, CA, marge et trésorerie en temps réel." },
  { icon: "🏦", title: "Banque", desc: "Connexion Revolut automatique. Transactions catégorisées et rapprochées." },
  { icon: "📞", title: "CRM & Sales", desc: "Pipeline GHL synchronisé. Leads, deals et conversion en un coup d'œil." },
  { icon: "📋", title: "Rapports", desc: "Rapports mensuels auto-générés à partir de vos données bancaires et CRM." },
  { icon: "🏆", title: "Milestones", desc: "Débloquez des achievements en atteignant vos objectifs." },
  { icon: "🤖", title: "AI Coach", desc: "Conseils personnalisés basés sur votre performance." },
];

const FORMES_JURIDIQUES = ["SAS", "SASU", "SARL", "EURL", "SCI", "SA", "SNC", "LTD", "LLC", "GmbH", "Auto-entrepreneur", "Autre"];
const SECTEURS = ["Tech / SaaS", "E-commerce", "Consulting", "Marketing / Agence", "Finance", "Immobilier", "Santé", "Formation", "Industrie", "BTP", "Restauration", "Transport", "Autre"];

const SOCIETE_SECTIONS = [
  { id: "identite", icon: "🏢", label: "Identité", fields: ["nom_societe", "forme_juridique", "numero_entreprise", "date_creation", "capital_social"] },
  { id: "adresse", icon: "📍", label: "Adresse", fields: ["adresse_rue", "adresse_cp", "adresse_ville", "adresse_pays"] },
  { id: "contact", icon: "📧", label: "Contact", fields: ["email_societe", "telephone_societe", "site_web"] },
  { id: "activite", icon: "💼", label: "Activité", fields: ["secteur_activite", "numero_tva", "description_activite"] },
];

const FIELD_DEFS = {
  nom_societe: { label: "Nom de la société", placeholder: "Ex: Ma Société SAS", required: true, type: "text" },
  forme_juridique: { label: "Forme juridique", required: true, type: "select", options: FORMES_JURIDIQUES },
  numero_entreprise: { label: "N° entreprise / SIRET / Company Number", placeholder: "Ex: 123 456 789 00012", required: true, type: "text" },
  date_creation: { label: "Date de création", required: true, type: "date" },
  capital_social: { label: "Capital social (€)", placeholder: "Ex: 10000", required: true, type: "number" },
  adresse_rue: { label: "Rue", placeholder: "Ex: 12 rue de la Paix", required: true, type: "text" },
  adresse_cp: { label: "Code postal", placeholder: "Ex: 75001", required: true, type: "text" },
  adresse_ville: { label: "Ville", placeholder: "Ex: Paris", required: true, type: "text" },
  adresse_pays: { label: "Pays", placeholder: "Ex: France", required: true, type: "text" },
  email_societe: { label: "Email de contact", placeholder: "contact@masociete.com", required: true, type: "email" },
  telephone_societe: { label: "Téléphone", placeholder: "+33 1 23 45 67 89", required: true, type: "tel" },
  site_web: { label: "Site web", placeholder: "https://masociete.com", required: false, type: "url" },
  secteur_activite: { label: "Secteur d'activité", required: true, type: "select", options: SECTEURS },
  numero_tva: { label: "Numéro TVA", placeholder: "Ex: FR12345678901", required: false, type: "text" },
  description_activite: { label: "Description de l'activité", placeholder: "Décrivez brièvement votre activité...", required: true, type: "textarea" },
};

function SocieteForm({ soc, socData, setSocData, socSection, setSocSection, errors }) {
  const sec = SOCIETE_SECTIONS[socSection];

  const inputStyle = (field) => ({
    width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 12, fontFamily: FONT,
    background: "rgba(255,255,255,.03)", border: `1.5px solid ${errors[field] ? C.r + "88" : C.brd}`,
    color: C.t, outline: "none", transition: "border .2s",
    boxSizing: "border-box",
  });

  const labelStyle = { fontSize: 10, fontWeight: 700, color: C.td, marginBottom: 4, display: "flex", gap: 4, alignItems: "center" };

  const renderField = (key) => {
    const def = FIELD_DEFS[key];
    return (
      <div key={key} style={{ marginBottom: 12 }}>
        <div style={labelStyle}>
          {def.label} {def.required && <span style={{ color: C.acc, fontSize: 8 }}>●</span>}
        </div>
        {def.type === "select" ? (
          <select value={socData[key] || ""} onChange={e => setSocData(d => ({ ...d, [key]: e.target.value }))}
            style={{ ...inputStyle(key), cursor: "pointer", appearance: "auto" }}>
            <option value="">Sélectionner...</option>
            {def.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : def.type === "textarea" ? (
          <textarea value={socData[key] || ""} onChange={e => setSocData(d => ({ ...d, [key]: e.target.value }))}
            placeholder={def.placeholder} rows={3}
            style={{ ...inputStyle(key), resize: "vertical", minHeight: 60 }} />
        ) : (
          <input type={def.type} value={socData[key] || ""} onChange={e => setSocData(d => ({ ...d, [key]: e.target.value }))}
            placeholder={def.placeholder} style={inputStyle(key)} />
        )}
        {errors[key] && <div style={{ fontSize: 9, color: C.r, marginTop: 3 }}>{errors[key]}</div>}
      </div>
    );
  };

  return (
    <div>
      {/* Section tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {SOCIETE_SECTIONS.map((s, i) => (
          <button key={s.id} onClick={() => setSocSection(i)} style={{
            flex: 1, padding: "8px 4px", borderRadius: 8, border: `1px solid ${i === socSection ? C.acc + "44" : C.brd}`,
            background: i === socSection ? C.accD : "transparent", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontFamily: FONT,
          }}>
            <span style={{ fontSize: 14 }}>{s.icon}</span>
            <span style={{ fontSize: 8, fontWeight: i === socSection ? 700 : 500, color: i === socSection ? C.acc : C.td }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Fields for current section */}
      <div style={{ animation: "fu .25s ease both" }}>
        {sec.fields.map(renderField)}
      </div>

      {/* Section nav */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {socSection > 0 ? (
          <button onClick={() => setSocSection(socSection - 1)} style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.brd}`,
            background: "transparent", color: C.td, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
          }}>← {SOCIETE_SECTIONS[socSection - 1].label}</button>
        ) : <div />}
        {socSection < SOCIETE_SECTIONS.length - 1 && (
          <button onClick={() => setSocSection(socSection + 1)} style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.acc}33`,
            background: C.accD, color: C.acc, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
          }}>{SOCIETE_SECTIONS[socSection + 1].label} →</button>
        )}
      </div>
    </div>
  );
}

export default function PorteurOnboarding({ soc, onComplete }) {
  const [step, setStep] = useState(0);
  const [anim, setAnim] = useState(false);
  const [socData, setSocData] = useState({ nom_societe: soc.nom || "", adresse_pays: "France" });
  const [socSection, setSocSection] = useState(0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  const go = (t) => {
    if (anim) return;
    // Validate société step before leaving it
    if (step === 1 && t > 1) {
      const errs = {};
      Object.entries(FIELD_DEFS).forEach(([k, def]) => {
        if (def.required && !socData[k]?.toString().trim()) errs[k] = "Champ requis";
      });
      if (socData.email_societe && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(socData.email_societe)) errs.email_societe = "Email invalide";
      if (Object.keys(errs).length) {
        setErrors(errs);
        // Jump to first section with error
        const firstErrField = Object.keys(errs)[0];
        const secIdx = SOCIETE_SECTIONS.findIndex(s => s.fields.includes(firstErrField));
        if (secIdx >= 0) setSocSection(secIdx);
        return;
      }
      setErrors({});
      // Save to Supabase (user_settings as structured JSON + dedicated table)
      setSaving(true);
      const payload = { ...socData, updated_at: new Date().toISOString() };
      Promise.all([
        sSet(`scSocieteInfo_${soc.id}`, payload),
        sbUpsert('society_info', { society_id: soc.id, ...payload }),
      ]).finally(() => setSaving(false));
    }
    setAnim(true);
    setTimeout(() => { setStep(t); setAnim(false); if (ref.current) ref.current.scrollTop = 0; }, 180);
  };

  const finish = async () => {
    try {
      await sSet(`scPorteurOnboarded_${soc.id}`, true);
      sbUpsert('user_settings', { society_id: soc.id, key: `scPorteurOnboarded_${soc.id}`, value: true });
    } catch {}
    onComplete();
  };

  const prog = ((step + 1) / STEPS.length) * 100;
  const s = STEPS[step];

  return (
    <div className="glass-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: 16 }}>
      <style>{CSS}</style>
      <div style={{ width: 560, maxWidth: "100%", position: "relative" }}>
        {/* Progress bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {STEPS.map((st, i) => (
            <div key={st.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: i <= step ? C.accD : "rgba(255,255,255,.03)",
                border: `1.5px solid ${i <= step ? C.acc + "44" : C.brd}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: i < step ? 11 : 14, fontWeight: 700,
                color: i < step ? C.g : i === step ? C.acc : C.td,
                transition: "all .3s",
              }}>
                {i < step ? "✓" : st.icon}
              </div>
              <span style={{ fontSize: 8, fontWeight: i === step ? 700 : 400, color: i === step ? C.acc : C.td }}>{st.label}</span>
            </div>
          ))}
        </div>

        {/* Content card */}
        <div className="glass-modal" style={{ borderRadius: 20, padding: 0, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.brd}`, background: `linear-gradient(135deg,${C.acc}08,transparent)` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.acc, letterSpacing: 1, marginBottom: 3 }}>ÉTAPE {step + 1}/{STEPS.length}</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.t, fontFamily: FONT_TITLE }}>{s.title}</h2>
            <p style={{ margin: "4px 0 0", color: C.td, fontSize: 11 }}>{s.sub}</p>
          </div>

          {/* Body */}
          <div ref={ref} style={{ padding: "20px 24px", minHeight: 280, maxHeight: 420, overflowY: "auto", animation: anim ? "none" : "fu .3s ease both" }}>
            {step === 0 && (
              <div>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 16,
                    background: `${soc.color}22`, border: `2px solid ${soc.color}44`,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, fontWeight: 900, color: soc.color, marginBottom: 12,
                  }}>{soc.nom[0]}</div>
                  <h3 style={{ fontWeight: 800, fontSize: 16, margin: "0 0 6px", color: C.t }}>{soc.nom}</h3>
                  <p style={{ color: C.td, fontSize: 12 }}>Porteur : {soc.porteur}</p>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: 10, background: C.accD, border: `1px solid ${C.acc}33`, fontSize: 12, color: C.acc, lineHeight: 1.5, textAlign: "center" }}>
                  🎯 Votre espace est configuré et prêt. Prenez 2 minutes pour découvrir les outils à votre disposition.
                </div>
              </div>
            )}

            {step === 1 && (
              <SocieteForm soc={soc} socData={socData} setSocData={setSocData}
                socSection={socSection} setSocSection={setSocSection} errors={errors} />
            )}

            {step === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {FEATURES.map((f, i) => (
                  <div key={i} className="fu" style={{
                    padding: "12px 14px", borderRadius: 10,
                    background: C.bg, border: `1px solid ${C.brd}`,
                    animationDelay: `${i * 0.05}s`,
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 11, color: C.t, marginBottom: 3 }}>{f.title}</div>
                    <div style={{ fontSize: 10, color: C.td, lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  {[
                    { icon: "🏦", name: "Revolut", connected: !!soc.revolutCompany, detail: soc.revolutCompany ? `Compte ${soc.revolutCompany}` : "Non configuré" },
                    { icon: "📡", name: "GoHighLevel", connected: !!soc.ghlLocationId, detail: soc.ghlLocationId ? "Connecté" : "Non configuré" },
                  ].map((api, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 14px", background: C.bg, borderRadius: 10,
                      border: `1px solid ${api.connected ? C.g + "33" : C.brd}`, marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 20 }}>{api.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: C.t }}>{api.name}</div>
                        <div style={{ fontSize: 10, color: C.td }}>{api.detail}</div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: api.connected ? C.g : C.o,
                        background: api.connected ? C.gD : C.oD,
                        padding: "3px 10px", borderRadius: 8,
                      }}>{api.connected ? "✅ Connecté" : "⏳ En attente"}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 8, background: C.bD, border: `1px solid ${C.b}22`, fontSize: 11, color: C.b, lineHeight: 1.5 }}>
                  💡 Les connexions sont gérées par l'équipe Scale Corp. Si une intégration manque, contactez votre admin.
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontWeight: 800, fontSize: 16, margin: "0 0 8px", color: C.t }}>Vous êtes prêt !</h3>
                <p style={{ color: C.td, fontSize: 12, lineHeight: 1.5, maxWidth: 360, margin: "0 auto 16px" }}>
                  Votre dashboard se remplit automatiquement grâce aux données Revolut et GHL.
                  Soumettez votre premier rapport mensuel pour débloquer toutes les fonctionnalités.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
                  {[
                    { icon: "📊", text: "Remplir mon rapport" },
                    { icon: "⚡", text: "Envoyer mon Pulse" },
                    { icon: "🎯", text: "Voir mes objectifs" },
                  ].map((a, i) => (
                    <div key={i} style={{
                      padding: "14px 8px", borderRadius: 10,
                      background: C.accD, border: `1px solid ${C.acc}22`,
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{a.icon}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: C.acc }}>{a.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.brd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => { if (step > 0) go(step - 1); }} disabled={step === 0} style={{
              padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.brd}`,
              background: "transparent", color: step > 0 ? C.t : C.tm,
              fontSize: 11, fontWeight: 600, cursor: step > 0 ? "pointer" : "default", fontFamily: FONT,
            }}>← Retour</button>

            {/* Progress dots */}
            <div style={{ display: "flex", gap: 4 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 16 : 6, height: 6, borderRadius: 3,
                  background: i <= step ? C.acc : C.brd, transition: "all .3s",
                }} />
              ))}
            </div>

            {step < STEPS.length - 1 ? (
              <button onClick={() => go(step + 1)} disabled={saving} style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: `linear-gradient(135deg,${C.acc},#FF9D00)`,
                color: "#0a0a0f", fontSize: 11, fontWeight: 700,
                cursor: saving ? "wait" : "pointer", fontFamily: FONT,
                boxShadow: `0 4px 16px ${C.accD}`,
                opacity: saving ? 0.7 : 1,
              }}>{saving ? "Sauvegarde..." : "Suivant →"}</button>
            ) : (
              <button onClick={finish} style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: `linear-gradient(135deg,${C.g},#16a34a)`,
                color: "#fff", fontSize: 11, fontWeight: 700,
                cursor: "pointer", fontFamily: FONT,
                boxShadow: `0 4px 16px ${C.gD}`,
              }}>🚀 C'est parti !</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
