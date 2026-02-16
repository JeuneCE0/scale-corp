import React, { useState, useEffect, useMemo, useCallback } from "react";
import { C, FONT, FONT_TITLE, fmt, ago, getLineageLogs, onLineageChange, fetchLineageLogs, LINEAGE_LAYERS, LINEAGE_SOURCES } from "../shared.jsx";

const LAYER_ORDER = ["bronze","silver","gold"];
const STEP_LABELS = { fetch:"Ingestion", transform:"Transformation", categorize:"Catégorisation", aggregate:"Agrégation", store:"Stockage", render:"Rendu" };
const STATUS_COLORS = { success:C.g, error:C.r, warning:C.o, skipped:C.td };
const STATUS_ICONS = { success:"\u2713", error:"\u2717", warning:"\u26A0", skipped:"\u2014" };
const PIPELINE_LABELS = { sync_ghl:"Sync GHL", sync_revolut:"Sync Revolut", sync_soc_revolut:"Sync Revolut Soc.", sync_stripe:"Sync Stripe", auto_report:"Rapport auto", manual_report:"Rapport manuel", calc_holding:"Calcul Holding" };

/* ─── FLOW DIAGRAM (static) ─── */
function FlowDiagram({ socs }) {
  const nodeStyle = (bg, border) => ({
    padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${border}`,
    background: bg, fontSize: 10, fontWeight: 600, textAlign: "center",
    minWidth: 100, color: C.t, fontFamily: FONT, position: "relative"
  });
  const arrowStyle = { display: "flex", alignItems: "center", justifyContent: "center", color: C.td, fontSize: 16, padding: "0 6px" };
  const colStyle = { display: "flex", flexDirection: "column", gap: 8, alignItems: "center" };
  const layerLabel = (l) => (
    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: LINEAGE_LAYERS[l].color, textTransform: "uppercase", marginBottom: 4 }}>
      {LINEAGE_LAYERS[l].icon}. {LINEAGE_LAYERS[l].label}
    </div>
  );

  return (
    <div style={{ overflowX: "auto", padding: "16px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0, minWidth: 700 }}>
        {/* Sources */}
        <div style={colStyle}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: C.td, textTransform: "uppercase", marginBottom: 4 }}>Sources</div>
          {Object.entries(LINEAGE_SOURCES).filter(([k]) => k !== "system").map(([k, v]) => (
            <div key={k} style={nodeStyle(v.color + "15", v.color + "44")}>
              <span style={{ fontSize: 16 }}>{v.icon}</span>
              <div style={{ marginTop: 2 }}>{v.label}</div>
            </div>
          ))}
        </div>

        <div style={arrowStyle}><span style={{ fontSize: 20 }}>{"\u2192"}</span></div>

        {/* Bronze */}
        <div style={colStyle}>
          {layerLabel("bronze")}
          <div style={nodeStyle("#cd7f3218", "#cd7f3244")}>
            <div style={{ fontSize: 14 }}>{"\u0031\uFE0F\u20E3"}</div>
            <div style={{ fontWeight: 700 }}>Ingestion brute</div>
            <div style={{ fontSize: 8, color: C.td, marginTop: 3, lineHeight: 1.4 }}>
              Appel API<br/>Validation réponse<br/>Cache local
            </div>
          </div>
        </div>

        <div style={arrowStyle}><span style={{ fontSize: 20 }}>{"\u2192"}</span></div>

        {/* Silver */}
        <div style={colStyle}>
          {layerLabel("silver")}
          <div style={nodeStyle("#c0c0c018", "#c0c0c044")}>
            <div style={{ fontSize: 14 }}>{"\u0032\uFE0F\u20E3"}</div>
            <div style={{ fontWeight: 700 }}>Transformation</div>
            <div style={{ fontSize: 8, color: C.td, marginTop: 3, lineHeight: 1.4 }}>
              Mapping champs<br/>Catégorisation tx<br/>Filtrage exclusions<br/>Calcul mensuel
            </div>
          </div>
        </div>

        <div style={arrowStyle}><span style={{ fontSize: 20 }}>{"\u2192"}</span></div>

        {/* Gold */}
        <div style={colStyle}>
          {layerLabel("gold")}
          <div style={nodeStyle("#FFD70018", "#FFD70044")}>
            <div style={{ fontSize: 14 }}>{"\u0033\uFE0F\u20E3"}</div>
            <div style={{ fontWeight: 700 }}>Agrégation</div>
            <div style={{ fontSize: 8, color: C.td, marginTop: 3, lineHeight: 1.4 }}>
              Rapport mensuel<br/>KPIs & Health Score<br/>Cash Cascade<br/>Alertes
            </div>
          </div>
        </div>

        <div style={arrowStyle}><span style={{ fontSize: 20 }}>{"\u2192"}</span></div>

        {/* Dashboards */}
        <div style={colStyle}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: C.acc, textTransform: "uppercase", marginBottom: 4 }}>Dashboards</div>
          {[{ icon: "\uD83D\uDCCA", label: "KPIs" }, { icon: "\uD83D\uDCC8", label: "Finances" }, { icon: "\uD83D\uDCCB", label: "Rapports" }, { icon: "\uD83C\uDFE6", label: "Banking" }].map((d, i) => (
            <div key={i} style={nodeStyle(C.accD, C.acc + "44")}>
              <span style={{ fontSize: 14 }}>{d.icon}</span>
              <div style={{ marginTop: 2 }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── LOG ENTRY CARD ─── */
function LogEntry({ log, socs }) {
  const [open, setOpen] = useState(false);
  const socName = log.societyId ? (socs.find(s => s.id === log.societyId)?.nom || log.societyId) : "Global";
  const src = LINEAGE_SOURCES[log.source] || LINEAGE_SOURCES.system;

  return (
    <div onClick={() => setOpen(!open)} style={{
      padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`,
      background: C.card, cursor: "pointer", transition: "all .15s",
      borderLeft: `3px solid ${LINEAGE_LAYERS[log.layer]?.color || C.td}`
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {/* Status */}
        <span style={{ width: 20, height: 20, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: STATUS_COLORS[log.status] + "20", color: STATUS_COLORS[log.status], fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
          {STATUS_ICONS[log.status]}
        </span>
        {/* Source */}
        <span style={{ fontSize: 14 }}>{src.icon}</span>
        {/* Pipeline + step */}
        <span style={{ fontSize: 11, fontWeight: 700, color: C.t }}>{PIPELINE_LABELS[log.pipeline] || log.pipeline}</span>
        <span style={{ fontSize: 9, color: C.td, background: C.card2, padding: "2px 6px", borderRadius: 4 }}>
          {STEP_LABELS[log.step] || log.step}
        </span>
        {/* Layer badge */}
        <span style={{ fontSize: 8, fontWeight: 700, color: LINEAGE_LAYERS[log.layer]?.color || C.td, letterSpacing: .5, textTransform: "uppercase" }}>
          {log.layer}
        </span>
        {/* Society */}
        <span style={{ fontSize: 9, color: C.td, marginLeft: "auto" }}>{socName}</span>
        {/* Timestamp */}
        <span style={{ fontSize: 8, color: C.tm }}>{ago(log.createdAt)}</span>
      </div>

      {/* Records info */}
      <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
        {log.recordsIn > 0 && <span style={{ fontSize: 9, color: C.td }}>{log.recordsIn} entrées</span>}
        {log.recordsOut > 0 && <span style={{ fontSize: 9, color: C.g }}>{log.recordsOut} sorties</span>}
        {log.durationMs > 0 && <span style={{ fontSize: 9, color: C.b }}>{log.durationMs}ms</span>}
        {log.errorMessage && <span style={{ fontSize: 9, color: C.r }}>{log.errorMessage}</span>}
      </div>

      {/* Expandable details */}
      {open && log.details && Object.keys(log.details).length > 0 && (
        <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: C.bg, border: `1px solid ${C.brd}`, fontSize: 10, lineHeight: 1.6 }}>
          <div style={{ color: C.td, fontWeight: 700, fontSize: 8, letterSpacing: .5, marginBottom: 4, textTransform: "uppercase" }}>Détails</div>
          {Object.entries(log.details).map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 8 }}>
              <span style={{ color: C.td, minWidth: 90 }}>{k}:</span>
              <span style={{ color: C.t, fontWeight: 600, wordBreak: "break-all" }}>
                {typeof v === "object" ? JSON.stringify(v) : String(v)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── STATS CARDS ─── */
function StatCards({ logs }) {
  const bySource = {};
  const byLayer = { bronze: 0, silver: 0, gold: 0 };
  const byStatus = { success: 0, error: 0, warning: 0, skipped: 0 };
  let totalDuration = 0;

  logs.forEach(l => {
    bySource[l.source] = (bySource[l.source] || 0) + 1;
    if (byLayer[l.layer] !== undefined) byLayer[l.layer]++;
    if (byStatus[l.status] !== undefined) byStatus[l.status]++;
    totalDuration += l.durationMs || 0;
  });

  const cardStyle = { padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.card, textAlign: "center" };

  return (
    <div className="rg-auto" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 8, marginBottom: 14 }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.acc }}>{logs.length}</div>
        <div style={{ fontSize: 9, color: C.td, fontWeight: 600 }}>Logs total</div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.g }}>{byStatus.success}</div>
        <div style={{ fontSize: 9, color: C.td, fontWeight: 600 }}>Succès</div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.r }}>{byStatus.error}</div>
        <div style={{ fontSize: 9, color: C.td, fontWeight: 600 }}>Erreurs</div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.o }}>{byStatus.warning}</div>
        <div style={{ fontSize: 9, color: C.td, fontWeight: 600 }}>Warnings</div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.b }}>{totalDuration > 1000 ? `${(totalDuration / 1000).toFixed(1)}s` : `${totalDuration}ms`}</div>
        <div style={{ fontSize: 9, color: C.td, fontWeight: 600 }}>Durée totale</div>
      </div>
      {Object.entries(byLayer).map(([k, v]) => (
        <div key={k} style={cardStyle}>
          <div style={{ fontSize: 20, fontWeight: 900, color: LINEAGE_LAYERS[k]?.color }}>{v}</div>
          <div style={{ fontSize: 9, color: C.td, fontWeight: 600 }}>{k.charAt(0).toUpperCase() + k.slice(1)}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export function DataLineage({ socs, socId }) {
  const [logs, setLogs] = useState(getLineageLogs);
  const [filterLayer, setFilterLayer] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSoc, setFilterSoc] = useState(socId || "all");
  const [view, setView] = useState("logs"); // "flow" | "logs"
  const [loading, setLoading] = useState(false);

  // Subscribe to live updates
  useEffect(() => {
    const unsub = onLineageChange(setLogs);
    return unsub;
  }, []);

  // Load historical logs on mount
  useEffect(() => {
    setLoading(true);
    fetchLineageLogs(filterSoc === "all" ? null : filterSoc).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (filterLayer !== "all" && l.layer !== filterLayer) return false;
      if (filterSource !== "all" && l.source !== filterSource) return false;
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (filterSoc !== "all" && l.societyId !== filterSoc) return false;
      return true;
    });
  }, [logs, filterLayer, filterSource, filterStatus, filterSoc]);

  const selStyle = {
    padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.brd}`,
    background: C.card, color: C.t, fontSize: 10, fontWeight: 600,
    fontFamily: FONT, cursor: "pointer"
  };
  const tabBtnStyle = (active) => ({
    padding: "8px 16px", borderRadius: 8, border: `1px solid ${active ? C.acc + "44" : C.brd}`,
    background: active ? C.accD : "transparent", color: active ? C.acc : C.td,
    fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT, transition: "all .15s"
  });

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 16, fontFamily: FONT_TITLE, marginBottom: 4 }}>
        Data Lineage
      </div>
      <div style={{ color: C.td, fontSize: 11, marginBottom: 16, lineHeight: 1.5 }}>
        {"Traçabilité complète des données : de l'ingestion (APIs) à l'affichage (dashboards). Architecture Médaillon Bronze \u2192 Silver \u2192 Gold."}
      </div>

      {/* View toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button onClick={() => setView("flow")} style={tabBtnStyle(view === "flow")}>Architecture</button>
        <button onClick={() => setView("logs")} style={tabBtnStyle(view === "logs")}>
          Logs en direct {logs.length > 0 && <span style={{ marginLeft: 4, padding: "1px 6px", borderRadius: 8, background: C.acc + "22", color: C.acc, fontSize: 9, fontWeight: 700 }}>{logs.length}</span>}
        </button>
      </div>

      {view === "flow" && (
        <div style={{ padding: 16, borderRadius: 14, border: `1px solid ${C.brd}`, background: C.card, marginBottom: 14 }}>
          <div style={{ color: C.td, fontSize: 9, fontWeight: 700, letterSpacing: .8, marginBottom: 10, textTransform: "uppercase" }}>
            {"Flux de données \u2014 Architecture Médaillon"}
          </div>
          <FlowDiagram socs={socs} />

          {/* Legend */}
          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: C.bg, border: `1px solid ${C.brd}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.td, letterSpacing: .5, marginBottom: 8, textTransform: "uppercase" }}>Légende des couches</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
              {LAYER_ORDER.map(l => (
                <div key={l} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: LINEAGE_LAYERS[l].color, flexShrink: 0, marginTop: 3 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: LINEAGE_LAYERS[l].color }}>{LINEAGE_LAYERS[l].label}</div>
                    <div style={{ fontSize: 9, color: C.td, lineHeight: 1.4 }}>
                      {l === "bronze" && "Données brutes des APIs (GHL, Revolut, Stripe). Aucune transformation."}
                      {l === "silver" && "Nettoyage, mapping des champs, catégorisation des transactions, filtrage."}
                      {l === "gold" && "Métriques agrégées : CA, marge, KPIs, health score, rapports mensuels."}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table mapping */}
          <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: C.bg, border: `1px solid ${C.brd}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.td, letterSpacing: .5, marginBottom: 8, textTransform: "uppercase" }}>Tables physiques (Supabase)</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.brd}` }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: C.td, fontWeight: 700 }}>Table</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: C.td, fontWeight: 700 }}>Couche</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: C.td, fontWeight: 700 }}>Source</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: C.td, fontWeight: 700 }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { table: "data_lineage_logs", layer: "system", src: "Toutes", desc: "Logs de traçabilité du pipeline" },
                  { table: "societies", layer: "bronze", src: "Config", desc: "Sociétés et paramètres" },
                  { table: "client_data", layer: "silver", src: "GHL + Manuel", desc: "Données clients enrichies" },
                  { table: "tx_categories", layer: "silver", src: "Revolut", desc: "Catégorisation des transactions" },
                  { table: "meta_ads", layer: "bronze", src: "Manuel", desc: "Dépenses publicitaires mensuelles" },
                  { table: "sales_data", layer: "bronze", src: "Manuel", desc: "Données de vente" },
                  { table: "reports", layer: "gold", src: "Auto + Manuel", desc: "Rapports mensuels agrégés" },
                  { table: "holding", layer: "gold", src: "Calculé", desc: "Configuration et cash cascade holding" },
                ].map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.brd}08` }}>
                    <td style={{ padding: "6px 8px", fontWeight: 600, color: C.t, fontFamily: "monospace" }}>{r.table}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: r.layer === "system" ? C.v : LINEAGE_LAYERS[r.layer]?.color, letterSpacing: .5, textTransform: "uppercase" }}>{r.layer}</span>
                    </td>
                    <td style={{ padding: "6px 8px", color: C.td }}>{r.src}</td>
                    <td style={{ padding: "6px 8px", color: C.td }}>{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "logs" && (
        <>
          <StatCards logs={filtered} />

          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <select value={filterLayer} onChange={e => setFilterLayer(e.target.value)} style={selStyle}>
              <option value="all">Toutes les couches</option>
              {LAYER_ORDER.map(l => <option key={l} value={l}>{LINEAGE_LAYERS[l].label}</option>)}
            </select>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={selStyle}>
              <option value="all">Toutes les sources</option>
              {Object.entries(LINEAGE_SOURCES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selStyle}>
              <option value="all">Tous les statuts</option>
              <option value="success">{"Succès"}</option>
              <option value="error">Erreur</option>
              <option value="warning">Warning</option>
              <option value="skipped">Skipped</option>
            </select>
            {!socId && (
              <select value={filterSoc} onChange={e => setFilterSoc(e.target.value)} style={selStyle}>
                <option value="all">{"Toutes les sociétés"}</option>
                {socs.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            )}
            <span style={{ fontSize: 9, color: C.td, marginLeft: "auto" }}>
              {filtered.length} / {logs.length} logs
              {loading && <span style={{ marginLeft: 6, color: C.acc }}>chargement...</span>}
            </span>
          </div>

          {/* Log list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", borderRadius: 14, border: `1px dashed ${C.brd}`, background: C.card }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{"\uD83D\uDD0D"}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.t, marginBottom: 4 }}>Aucun log</div>
                <div style={{ fontSize: 11, color: C.td, lineHeight: 1.5 }}>
                  {"Les logs apparaîtront automatiquement lors des synchronisations de données (GHL, Revolut, Stripe) et de la génération des rapports."}
                </div>
              </div>
            )}
            {filtered.slice(0, 100).map(log => (
              <LogEntry key={log.id} log={log} socs={socs} />
            ))}
            {filtered.length > 100 && (
              <div style={{ textAlign: "center", color: C.td, fontSize: 10, padding: 8 }}>
                + {filtered.length - 100} logs supplémentaires
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
