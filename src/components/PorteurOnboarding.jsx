import React, { useState, useRef, useEffect } from "react";
import * as U from "../utils/index.jsx";
const { C, FONT, FONT_TITLE, CSS, sSet, sbUpsert } = U;

const STEPS = [
  { id: "welcome", icon: "👋", label: "Bienvenue", title: "Bienvenue sur Scale Corp !", sub: "Votre espace de pilotage est prêt." },
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

export default function PorteurOnboarding({ soc, onComplete }) {
  const [step, setStep] = useState(0);
  const [anim, setAnim] = useState(false);
  const ref = useRef(null);

  const go = (t) => {
    if (anim) return;
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
      <div style={{ width: 520, maxWidth: "100%", position: "relative" }}>
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
          <div ref={ref} style={{ padding: "20px 24px", minHeight: 280, animation: anim ? "none" : "fu .3s ease both" }}>
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

            {step === 2 && (
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

            {step === 3 && (
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
              <button onClick={() => go(step + 1)} style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: `linear-gradient(135deg,${C.acc},#FF9D00)`,
                color: "#0a0a0f", fontSize: 11, fontWeight: 700,
                cursor: "pointer", fontFamily: FONT,
                boxShadow: `0 4px 16px ${C.accD}`,
              }}>Suivant →</button>
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
