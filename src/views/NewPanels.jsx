import React, { useState, useMemo, useCallback, Fragment } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";
import { C, FONT, FONT_TITLE, pf, gr, fmt, fK, pct, curM, prevM, nextM, ml, uid, ago, sinceLbl, sinceMonths, healthScore, runway, clientMonthlyRevenue, commitmentRemaining, commitmentEnd, EXCLUDED_ACCOUNTS, isExcludedTx, generateInvoices, ghlCreateInvoice, ghlSendInvoice, project } from "../shared.jsx";
import { Btn, Card, Inp, Sel, Sect, Modal, CTip, KPI, Toggle } from "../components.jsx";

/* ═══════════════════════════════════════════
   1. PIPELINE PANEL (ex-Clients tab → renamed)
   GHL pipeline with prospects, stages, drag
   ═══════════════════════════════════════════ */
export function PipelinePanel({soc, ghlData, clients, socBankData}) {
 const gd = ghlData?.[soc.id] || {};
 const pipelines = gd.pipelines || [];
 const allOpps = gd.opportunities || [];
 const calEvts = gd.calendarEvents || [];
 const [selPipeline, setSelPipeline] = useState("all");
 const [search, setSearch] = useState("");
 const [viewOpp, setViewOpp] = useState(null);
 const [statusFilter, setStatusFilter] = useState("open");

 const stages = selPipeline === "all"
   ? (pipelines[0]?.stages || [])
   : (pipelines.find(p => p.id === selPipeline)?.stages || []);

 const opps = selPipeline === "all" ? allOpps : allOpps.filter(o => o.pipelineId === selPipeline);
 const filtered = search.trim() === "" ? opps : opps.filter(o => {
   const q = search.toLowerCase();
   return (o.name||"").toLowerCase().includes(q) || (o.contact?.name||"").toLowerCase().includes(q) || (o.email||"").toLowerCase().includes(q);
 });

 const openOpps = filtered.filter(o => o.status === "open");
 const wonOpps = filtered.filter(o => o.status === "won");
 const lostOpps = filtered.filter(o => o.status === "lost");
 const pipelineValue = openOpps.reduce((a, o) => a + (o.monetaryValue || o.value || 0), 0);
 const wonValue = wonOpps.reduce((a, o) => a + (o.monetaryValue || o.value || 0), 0);
 const lostValue = lostOpps.reduce((a, o) => a + (o.monetaryValue || o.value || 0), 0);

 // Avg days in stage
 const avgDaysToWin = useMemo(() => {
   if(wonOpps.length === 0) return null;
   let total = 0, cnt = 0;
   wonOpps.forEach(o => { if(o.createdAt && o.updatedAt) { total += Math.max(0, Math.round((new Date(o.updatedAt) - new Date(o.createdAt)) / 864e5)); cnt++; }});
   return cnt > 0 ? Math.round(total / cnt) : null;
 }, [wonOpps]);

 // Stage conversion rates
 const stageConvRates = useMemo(() => {
   const rates = {};
   stages.forEach((s, i) => {
     const inStage = allOpps.filter(o => o.pipelineStageId === s.id || o.stageId === s.id).length;
     const nextStage = i < stages.length - 1 ? allOpps.filter(o => o.pipelineStageId === stages[i+1].id || o.stageId === stages[i+1].id).length : wonOpps.length;
     rates[s.id] = inStage > 0 ? Math.round(nextStage / inStage * 100) : 0;
   });
   return rates;
 }, [stages, allOpps, wonOpps]);

 const stageColors = ["#60a5fa", "#FFAA00", "#a78bfa", "#14b8a6", "#f472b6", "#34d399", "#fb923c", "#ec4899"];
 const oppsForStage = (stageId) => openOpps.filter(o => o.pipelineStageId === stageId || o.stageId === stageId);

 if (!soc.ghlLocationId) return <div style={{textAlign:"center",padding:40}}><div style={{fontSize:40,marginBottom:12}}>🎯</div><div style={{fontWeight:700,fontSize:15,color:C.t}}>Pipeline non disponible</div><div style={{color:C.td,fontSize:12,marginTop:6}}>Connectez GoHighLevel dans les paramètres pour accéder à la pipeline.</div></div>;

 return <div>
   <Sect title="🎯 Pipeline" sub={`${openOpps.length} opportunités ouvertes · ${fmt(pipelineValue)}€`}>
     {/* KPIs */}
     <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8,marginBottom:14}}>
       <Card accent={C.acc} style={{padding:"10px 12px",textAlign:"center"}}><div style={{color:C.td,fontSize:8,fontWeight:700}}>PIPELINE</div><div style={{fontWeight:900,fontSize:20,color:C.acc}}>{fmt(pipelineValue)}€</div><div style={{fontSize:8,color:C.td}}>{openOpps.length} ouvertes</div></Card>
       <Card accent={C.g} style={{padding:"10px 12px",textAlign:"center"}}><div style={{color:C.td,fontSize:8,fontWeight:700}}>GAGNÉS</div><div style={{fontWeight:900,fontSize:20,color:C.g}}>{wonOpps.length}</div><div style={{fontSize:8,color:C.td}}>{fmt(wonValue)}€</div></Card>
       <Card accent={C.r} style={{padding:"10px 12px",textAlign:"center"}}><div style={{color:C.td,fontSize:8,fontWeight:700}}>PERDUS</div><div style={{fontWeight:900,fontSize:20,color:C.r}}>{lostOpps.length}</div><div style={{fontSize:8,color:C.td}}>{fmt(lostValue)}€</div></Card>
       <Card style={{padding:"10px 12px",textAlign:"center"}}><div style={{color:C.td,fontSize:8,fontWeight:700}}>CONVERSION</div><div style={{fontWeight:900,fontSize:20,color:"#a78bfa"}}>{allOpps.length > 0 ? Math.round(wonOpps.length / allOpps.length * 100) : 0}%</div></Card>
       <Card style={{padding:"10px 12px",textAlign:"center"}}><div style={{color:C.td,fontSize:8,fontWeight:700}}>PANIER MOYEN</div><div style={{fontWeight:900,fontSize:20,color:C.acc}}>{wonOpps.length > 0 ? fmt(Math.round(wonValue / wonOpps.length)) : "—"}€</div></Card>
       {avgDaysToWin !== null && <Card style={{padding:"10px 12px",textAlign:"center"}}><div style={{color:C.td,fontSize:8,fontWeight:700}}>CYCLE VENTE</div><div style={{fontWeight:900,fontSize:20,color:C.b}}>{avgDaysToWin}j</div></Card>}
     </div>

     {/* Filters */}
     <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
       {pipelines.length > 1 && <select value={selPipeline} onChange={e => setSelPipeline(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT}}>
         <option value="all">Toutes les pipelines</option>
         {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
       </select>}
       <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un prospect..." style={{flex:1,minWidth:150,padding:"6px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}} />
     </div>
     {/* Stage conversion funnel */}
     {stages.length > 1 && <div className="funnel-scroll" style={{display:"flex",alignItems:"center",gap:0,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
       {stages.map((s, i) => {
         const col = stageColors[i % stageColors.length];
         const conv = stageConvRates[s.id];
         const cnt = oppsForStage(s.id).length;
         return <Fragment key={s.id}>
           {i > 0 && <div style={{fontSize:9,color:C.td,padding:"0 3px",flexShrink:0}}>→ <span style={{fontWeight:700,color:conv>=50?C.g:conv>=25?C.o:C.r,fontSize:8}}>{conv}%</span></div>}
           <div style={{padding:"6px 10px",background:`${col}12`,border:`1px solid ${col}33`,borderRadius:8,textAlign:"center",minWidth:60,flexShrink:0}}>
             <div style={{fontWeight:800,fontSize:14,color:col}}>{cnt}</div>
             <div style={{fontSize:7,color:C.td,fontWeight:600,whiteSpace:"nowrap"}}>{s.name}</div>
           </div>
         </Fragment>;
       })}
     </div>}

     {/* Kanban board */}
     <div className="kanban-board" style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8}}>
       {stages.map((stage, si) => {
         const stageOpps = oppsForStage(stage.id);
         const stageVal = stageOpps.reduce((a, o) => a + (o.monetaryValue || o.value || 0), 0);
         const col = stageColors[si % stageColors.length];
         return <div key={stage.id} style={{minWidth:220,flex:"1 0 220px",background:C.card2,borderRadius:12,border:`1px solid ${C.brd}`,overflow:"hidden"}}>
           <div style={{padding:"10px 12px",borderBottom:`2px solid ${col}`,background:`${col}08`}}>
             <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
               <span style={{fontWeight:700,fontSize:11,color:C.t}}>{stage.name}</span>
               <span style={{fontSize:9,fontWeight:700,color:col,background:`${col}18`,padding:"2px 6px",borderRadius:6}}>{stageOpps.length}</span>
             </div>
             {stageVal > 0 && <div style={{fontSize:9,color:C.td,marginTop:2}}>{fmt(stageVal)}€</div>}
           </div>
           <div style={{padding:8,maxHeight:400,overflowY:"auto"}}>
             {stageOpps.length === 0 && <div style={{padding:12,textAlign:"center",color:C.td,fontSize:10}}>Aucun prospect</div>}
             {stageOpps.map(opp => {
               const daysInStage = opp.updatedAt ? Math.round((Date.now() - new Date(opp.updatedAt).getTime()) / 864e5) : null;
               return <div key={opp.id} onClick={() => setViewOpp(opp)} style={{padding:"8px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:4,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e => e.currentTarget.style.borderColor = col} onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}>
               <div style={{fontWeight:600,fontSize:11,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{opp.contact?.name || opp.name || "—"}</div>
               <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                 {(opp.monetaryValue || opp.value) > 0 && <span style={{fontSize:10,fontWeight:700,color:C.acc}}>{fmt(opp.monetaryValue || opp.value)}€</span>}
                 {daysInStage !== null && <span style={{fontSize:7,padding:"1px 5px",borderRadius:4,background:daysInStage > 14 ? C.rD : daysInStage > 7 ? C.oD : C.gD,color:daysInStage > 14 ? C.r : daysInStage > 7 ? C.o : C.g,fontWeight:700}}>{daysInStage}j</span>}
               </div>
               <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                 {opp.email && <span style={{fontSize:8,color:C.td}}>📧</span>}
                 {opp.phone && <span style={{fontSize:8,color:C.td}}>📱 {opp.phone}</span>}
                 {opp.source && <span style={{fontSize:7,color:C.tm,background:C.card2,padding:"1px 4px",borderRadius:3}}>{opp.source}</span>}
               </div>
             </div>;})}

           </div>
         </div>;
       })}
     </div>

     {/* Won / Lost summary */}
     {(wonOpps.length > 0 || lostOpps.length > 0) && <div className="deals-recent" style={{marginTop:14}}>
       <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:6}}>DEALS RÉCENTS</div>
       {[...wonOpps,...lostOpps].sort((a,b) => new Date(b.updatedAt||0) - new Date(a.updatedAt||0)).slice(0,8).map(o => <div key={o.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:o.status==="won"?C.gD:C.rD,borderRadius:8,marginBottom:2,border:`1px solid ${o.status==="won"?C.g:C.r}15`}}>
         <span style={{fontSize:10}}>{o.status==="won"?"🏆":"❌"}</span>
         <span style={{flex:1,fontSize:11,fontWeight:600}}>{o.contact?.name || o.name || "—"}</span>
         <span style={{fontSize:10,fontWeight:700,color:o.status==="won"?C.g:C.r}}>{fmt(o.monetaryValue || o.value || 0)}€</span>
         <span style={{fontSize:8,color:C.td}}>{ago(o.updatedAt)}</span>
       </div>)}
     </div>}
   </Sect>

   {/* Opp detail modal */}
   {viewOpp && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={() => setViewOpp(null)}>
     <div className="fade-up glass-card-static" style={{padding:24,borderRadius:16,maxWidth:420,width:"90%"}} onClick={e => e.stopPropagation()}>
       <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
         <span style={{fontWeight:800,fontSize:14,color:C.t}}>{viewOpp.contact?.name || viewOpp.name || "Prospect"}</span>
         <button onClick={() => setViewOpp(null)} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:16}}>✕</button>
       </div>
       <div style={{display:"flex",flexDirection:"column",gap:8}}>
         {viewOpp.email && <div style={{fontSize:11,color:C.td}}>📧 {viewOpp.email}</div>}
         {viewOpp.phone && <div style={{fontSize:11,color:C.td}}>📱 {viewOpp.phone}</div>}
         {(viewOpp.monetaryValue || viewOpp.value) > 0 && <div style={{fontSize:13,fontWeight:800,color:C.acc}}>💰 {fmt(viewOpp.monetaryValue || viewOpp.value)}€</div>}
         {viewOpp.source && <div style={{fontSize:10,color:C.td}}>Source: {viewOpp.source}</div>}
         {viewOpp.createdAt && <div style={{fontSize:10,color:C.td}}>Créé: {new Date(viewOpp.createdAt).toLocaleDateString("fr-FR")}</div>}
         {viewOpp.updatedAt && <div style={{fontSize:10,color:C.td}}>Dernière activité: {ago(viewOpp.updatedAt)}</div>}
         {viewOpp.createdAt && viewOpp.updatedAt && <div style={{fontSize:10,color:C.b}}>Durée dans le funnel: {Math.round((new Date(viewOpp.updatedAt) - new Date(viewOpp.createdAt)) / 864e5)}j</div>}
         <div style={{marginTop:4,padding:"8px 12px",background:C.card2,borderRadius:8}}>
           <div style={{fontSize:9,fontWeight:700,color:C.td,marginBottom:4}}>STATUT</div>
           <span style={{padding:"3px 10px",borderRadius:6,fontSize:10,fontWeight:700,color:viewOpp.status==="won"?C.g:viewOpp.status==="lost"?C.r:C.acc,background:viewOpp.status==="won"?C.gD:viewOpp.status==="lost"?C.rD:C.accD}}>{viewOpp.status==="won"?"Gagné":viewOpp.status==="lost"?"Perdu":"En cours"}</span>
         </div>
       </div>
     </div>
   </div>}
 </div>;
}

/* ═══════════════════════════════════════════
   2. NEW CLIENTS PANEL
   Active, late payments, ending, awaiting, invoicing
   ═══════════════════════════════════════════ */
export function NewClientsPanel({soc, clients, saveClients, ghlData, socBankData, invoices, saveInvoices, stripeData}) {
 const [tab, setTab] = useState("active");
 const [editInv, setEditInv] = useState(null);
 const [sending, setSending] = useState(null);
 const [viewClient, setViewClient] = useState(null);
 const myClients = (clients || []).filter(c => c.socId === soc.id);
 const myInvoices = (invoices || []).filter(i => i.socId === soc.id);
 const now = Date.now();
 const txs0 = socBankData?.transactions || [];
 const excluded = EXCLUDED_ACCOUNTS[soc.id] || [];

 // Compute cumulated revenue per client
 const clientRevMap = useMemo(() => {
   const map = {};
   myClients.forEach(cl => {
     const cn = (cl.name || "").toLowerCase().trim();
     if (cn.length < 3) { map[cl.id] = 0; return; }
     const matched = txs0.filter(tx => {
       const leg = tx.legs?.[0];
       if (!leg || leg.amount <= 0) return false;
       if (isExcludedTx(tx, excluded)) return false;
       return (leg.description || tx.reference || "").toLowerCase().includes(cn);
     });
     map[cl.id] = Math.round(matched.reduce((a, tx) => a + (tx.legs?.[0]?.amount || 0), 0));
   });
   return map;
 }, [myClients, txs0, excluded]);

 // Total MRR
 const totalMRR = myClients.filter(c => c.status === "active").reduce((a, c) => a + clientMonthlyRevenue(c), 0);

 // Categories
 const active = myClients.filter(c => c.status === "active");
 const endingSoon = myClients.filter(c => {
   const r = commitmentRemaining(c);
   return r !== null && r <= 2 && r > 0 && c.status === "active";
 });
 const awaitingSignature = myClients.filter(c => c.status === "prospect" || c.status === "pending");

 // Late payments: active clients with no bank payment in 45 days
 const txs = socBankData?.transactions || [];
 const now45 = now - 45 * 864e5;
 const latePayments = active.filter(cl => {
   if (!cl.billing || cl.billing.type === "oneoff") return false;
   const cn = (cl.name || "").toLowerCase().trim();
   if (cn.length < 3) return false;
   return !txs.some(tx => {
     const leg = tx.legs?.[0];
     if (!leg || leg.amount <= 0) return false;
     return new Date(tx.created_at || tx.date || 0).getTime() > now45 && (leg.description || tx.reference || "").toLowerCase().includes(cn);
   });
 });

 // Overdue invoices
 const overdueInvs = myInvoices.filter(i => i.status === "overdue" || (i.status === "sent" && new Date(i.dueDate) < new Date()));
 const draftInvs = myInvoices.filter(i => i.status === "draft");
 const paidInvs = myInvoices.filter(i => i.status === "paid");
 const totalEncaisse = paidInvs.reduce((a, i) => a + i.amount, 0);
 const totalOverdue = overdueInvs.reduce((a, i) => a + i.amount, 0);

 const sendInvoice = async (inv) => {
   setSending(inv.id);
   const apiKey = soc.ghlKey;
   if (apiKey && inv.ghlInvoiceId) await ghlSendInvoice(apiKey, inv.ghlInvoiceId);
   const updated = (invoices || []).map(i => i.id === inv.id ? {...i, status: "sent", sentAt: new Date().toISOString()} : i);
   saveInvoices(updated);
   setSending(null);
 };
 const markPaid = (inv) => {
   const updated = (invoices || []).map(i => i.id === inv.id ? {...i, status: "paid", paidAt: new Date().toISOString()} : i);
   saveInvoices(updated);
 };

 // Manual invoice creation
 const createManualInvoice = () => {
   setEditInv({id: uid(), socId: soc.id, clientId: "", number: `${soc.nom.toUpperCase().replace(/\s/g,"")}-${new Date().getFullYear()}-${String(myInvoices.length + 1).padStart(3, "0")}`, amount: 0, dueDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), status: "draft", description: "", createdAt: new Date().toISOString()});
 };
 const saveManualInvoice = () => {
   if (!editInv || !editInv.amount) return;
   const exists = (invoices || []).findIndex(i => i.id === editInv.id);
   if (exists >= 0) {
     saveInvoices((invoices || []).map(i => i.id === editInv.id ? editInv : i));
   } else {
     saveInvoices([...(invoices || []), editInv]);
   }
   setEditInv(null);
 };

 const tabs = [
   {id: "active", label: "Actifs", count: active.length, icon: "✅", color: C.g},
   {id: "late", label: "Retard paiement", count: latePayments.length, icon: "⚠️", color: C.o},
   {id: "ending", label: "Fin de contrat", count: endingSoon.length, icon: "📅", color: C.r},
   {id: "awaiting", label: "En attente", count: awaitingSignature.length, icon: "✍️", color: C.b},
   {id: "invoices", label: "Facturation", count: myInvoices.length, icon: "🧾", color: C.acc},
 ];

 const displayClients = tab === "active" ? active : tab === "late" ? latePayments : tab === "ending" ? endingSoon : tab === "awaiting" ? awaitingSignature : [];

 return <div>
   <Sect title="👥 Clients" sub={`${active.length} actifs · ${myClients.length} total · MRR ${fmt(totalMRR)}€`}>
     {/* KPIs */}
     <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(95px,1fr))",gap:6,marginBottom:12}}>
       <Card accent={C.g} style={{padding:"8px 10px",textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.g}}>{active.length}</div><div style={{fontSize:8,color:C.td}}>Actifs</div></Card>
       <Card accent={C.acc} style={{padding:"8px 10px",textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.acc}}>{fmt(totalMRR)}€</div><div style={{fontSize:8,color:C.td}}>MRR</div></Card>
       <Card accent={C.o} style={{padding:"8px 10px",textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:latePayments.length > 0 ? C.o : C.td}}>{latePayments.length}</div><div style={{fontSize:8,color:C.td}}>Retard</div></Card>
       <Card accent={C.r} style={{padding:"8px 10px",textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:endingSoon.length > 0 ? C.r : C.td}}>{endingSoon.length}</div><div style={{fontSize:8,color:C.td}}>Fin contrat</div></Card>
       <Card accent={C.b} style={{padding:"8px 10px",textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.b}}>{awaitingSignature.length}</div><div style={{fontSize:8,color:C.td}}>En attente</div></Card>
       {totalOverdue > 0 && <Card accent={C.r} style={{padding:"8px 10px",textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.r}}>{fmt(totalOverdue)}€</div><div style={{fontSize:8,color:C.td}}>Impayé</div></Card>}
     </div>

     {/* Tabs */}
     <div className="panel-tabs" style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap"}}>
       {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{padding:"8px 14px",borderRadius:8,border:`1px solid ${tab === t.id ? t.color + "66" : C.brd}`,background:tab === t.id ? t.color + "15" : "transparent",color:tab === t.id ? t.color : C.td,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:4,minHeight:38}}>
         <span>{t.icon}</span>{t.label}{t.count > 0 && <span style={{background:t.color + "22",color:t.color,padding:"1px 5px",borderRadius:6,fontSize:8,fontWeight:800}}>{t.count}</span>}
       </button>)}
     </div>

     {/* Client list views */}
     {tab !== "invoices" && <>
       {displayClients.length === 0 && <Card><div style={{textAlign:"center",padding:24,color:C.td,fontSize:12}}>
         {tab === "active" && "Aucun client actif"}
         {tab === "late" && "Aucun paiement en retard"}
         {tab === "ending" && "Aucun contrat en fin de période"}
         {tab === "awaiting" && "Aucun client en attente de signature"}
       </div></Card>}
       {displayClients.map((cl, i) => {
         const billing = cl.billing || {};
         const remaining = commitmentRemaining(cl);
         const endDate = commitmentEnd(cl);
         const monthlyRev = clientMonthlyRevenue(cl);
         const cumul = clientRevMap[cl.id] || 0;
         const startDate = cl.startDate || cl.at || cl.createdAt || cl.dateAdded;
         const fidelityMonths = startDate ? Math.max(1, Math.round((Date.now() - new Date(startDate).getTime()) / 864e5 / 30)) : null;
         return <Card key={cl.id} style={{padding:"10px 14px",marginBottom:4,cursor:"pointer"}} delay={Math.min(i + 1, 8)} onClick={() => setViewClient(viewClient?.id === cl.id ? null : cl)}>
           <div style={{display:"flex",alignItems:"center",gap:10}}>
             <div style={{width:36,height:36,borderRadius:10,background:C.accD,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:C.acc}}>{(cl.name || "?")[0].toUpperCase()}</div>
             <div style={{flex:1,minWidth:0}}>
               <div style={{fontWeight:700,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cl.name || "—"}</div>
               <div style={{display:"flex",gap:6,fontSize:9,color:C.td,flexWrap:"wrap",alignItems:"center"}}>
                 {billing.type && <span style={{fontWeight:600,color:C.acc}}>{billing.type === "fixed" ? `${fmt(billing.amount)}€/mois` : billing.type === "percent" ? `${billing.percent}%` : billing.type === "oneoff" ? `${fmt(billing.amount)}€ one-off` : billing.type}</span>}
                 {fidelityMonths && <span style={{background:C.gD,color:C.g,padding:"1px 5px",borderRadius:4,fontWeight:600,fontSize:7}}>{fidelityMonths} mois</span>}
                 {cumul > 0 && <span style={{fontSize:8}}>Cumulé: {fmt(cumul)}€</span>}
               </div>
             </div>
             <div style={{textAlign:"right"}}>
               {monthlyRev > 0 && <div style={{fontWeight:800,fontSize:14,color:C.acc}}>{fmt(monthlyRev)}€<span style={{fontSize:8,color:C.td}}>/m</span></div>}
               {tab === "late" && <div style={{fontSize:9,fontWeight:700,color:C.o,background:C.oD,padding:"2px 6px",borderRadius:6}}>Relancer</div>}
               {tab === "ending" && remaining !== null && <div style={{fontSize:9,fontWeight:700,color:C.r}}>{remaining} mois restant{remaining > 1 ? "s" : ""}</div>}
               {tab === "ending" && endDate && <div style={{fontSize:8,color:C.td}}>fin {endDate.toLocaleDateString("fr-FR",{month:"short",year:"numeric"})}</div>}
             </div>
           </div>
           {/* Expanded client detail */}
           {viewClient?.id === cl.id && <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.brd}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:10}}>
             {cl.email && <div><span style={{color:C.td}}>📧</span> {cl.email}</div>}
             {cl.phone && <div><span style={{color:C.td}}>📱</span> {cl.phone}</div>}
             {cl.domain && <div><span style={{color:C.td}}>🌐</span> {cl.domain}</div>}
             {startDate && <div><span style={{color:C.td}}>📅</span> Depuis {new Date(startDate).toLocaleDateString("fr-FR",{month:"short",year:"numeric"})}</div>}
             {cumul > 0 && <div style={{gridColumn:"span 2",marginTop:4,padding:"6px 10px",background:C.card2,borderRadius:6}}>
               <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.td,fontWeight:600}}>CA cumulé</span><span style={{fontWeight:800,color:C.acc}}>{fmt(cumul)}€</span></div>
               {fidelityMonths && monthlyRev > 0 && <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{color:C.td,fontWeight:600}}>Moyenne mensuelle</span><span style={{fontWeight:700,color:C.g}}>{fmt(Math.round(cumul / fidelityMonths))}€/m</span></div>}
             </div>}
           </div>}
         </Card>;
       })}
     </>}

     {/* Invoicing view */}
     {tab === "invoices" && <div>
       <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
         <Btn small onClick={createManualInvoice}>+ Nouvelle facture</Btn>
       </div>

       {overdueInvs.length > 0 && <Card accent={C.r} style={{padding:12,marginBottom:8}}>
         <div style={{fontSize:9,fontWeight:700,color:C.r,marginBottom:6}}>⚠️ FACTURES EN RETARD ({overdueInvs.length})</div>
         {overdueInvs.map(inv => {
           const cl = myClients.find(c => c.id === inv.clientId);
           const days = Math.round((now - new Date(inv.dueDate).getTime()) / 864e5);
           return <div key={inv.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:C.rD,borderRadius:6,marginBottom:2}}>
             <span style={{flex:1,fontSize:10,fontWeight:600,color:C.r}}>{cl?.name || "Client"} <span style={{fontWeight:400,color:C.td}}>· {days}j retard</span></span>
             <span style={{fontWeight:700,fontSize:11,color:C.r}}>{fmt(inv.amount)}€</span>
             <button onClick={() => markPaid(inv)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.g}`,background:C.gD,color:C.g,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Payée</button>
           </div>;
         })}
       </Card>}

       {draftInvs.length > 0 && <Card style={{padding:12,marginBottom:8}}>
         <div style={{fontSize:9,fontWeight:700,color:C.td,marginBottom:6}}>📝 BROUILLONS ({draftInvs.length})</div>
         {draftInvs.map(inv => {
           const cl = myClients.find(c => c.id === inv.clientId);
           return <div key={inv.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:C.bg,borderRadius:6,marginBottom:2}}>
             <span style={{flex:1,fontSize:10,fontWeight:600}}>{cl?.name || "Client"} <span style={{color:C.td,fontWeight:400,fontSize:8}}>{inv.number}</span></span>
             <span style={{fontWeight:700,fontSize:11}}>{fmt(inv.amount)}€</span>
             <button onClick={() => sendInvoice(inv)} disabled={sending === inv.id} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.b}`,background:C.bD,color:C.b,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>{sending === inv.id ? "..." : "Envoyer"}</button>
           </div>;
         })}
       </Card>}

       {/* All invoices */}
       <Card style={{padding:12}}>
         <div style={{fontSize:9,fontWeight:700,color:C.td,marginBottom:6}}>TOUTES LES FACTURES ({myInvoices.length})</div>
         {myInvoices.sort((a, b) => (b.dueDate||"").localeCompare(a.dueDate||"")).slice(0, 20).map(inv => {
           const cl = myClients.find(c => c.id === inv.clientId);
           const stColor = inv.status === "paid" ? C.g : inv.status === "sent" ? C.b : inv.status === "overdue" ? C.r : C.td;
           const stLabel = inv.status === "paid" ? "Payée" : inv.status === "sent" ? "Envoyée" : inv.status === "overdue" ? "Retard" : "Brouillon";
           return <div key={inv.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:6,marginBottom:2,borderBottom:`1px solid ${C.brd}08`}}>
             <span style={{fontSize:7,fontWeight:700,color:stColor,background:stColor + "18",padding:"2px 6px",borderRadius:4,minWidth:44,textAlign:"center"}}>{stLabel}</span>
             <span style={{flex:1,fontSize:10,fontWeight:600}}>{cl?.name || "—"}</span>
             <span style={{fontSize:8,color:C.td,fontFamily:"monospace"}}>{inv.number}</span>
             <span style={{fontWeight:700,fontSize:10}}>{fmt(inv.amount)}€</span>
             <span style={{fontSize:8,color:C.td}}>{new Date(inv.dueDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
           </div>;
         })}
       </Card>
     </div>}
   </Sect>

   {/* Manual invoice modal */}
   {editInv && <Modal open onClose={() => setEditInv(null)} title="Nouvelle facture">
     <Sel label="Client" value={editInv.clientId} onChange={v => setEditInv({...editInv, clientId: v})} options={[{v:"",l:"— Sélectionner —"},...myClients.map(c => ({v: c.id, l: c.name || c.email || "?"}))]}/>
     <Inp label="N° facture" value={editInv.number} onChange={v => setEditInv({...editInv, number: v})} />
     <Inp label="Montant" type="number" value={editInv.amount} onChange={v => setEditInv({...editInv, amount: pf(v)})} suffix="€" />
     <Inp label="Description" value={editInv.description} onChange={v => setEditInv({...editInv, description: v})} placeholder="Prestation / Forfait..." />
     <Inp label="Date d'échéance" type="date" value={editInv.dueDate} onChange={v => setEditInv({...editInv, dueDate: v})} />
     <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={saveManualInvoice}>Créer la facture</Btn><Btn v="secondary" onClick={() => setEditInv(null)}>Annuler</Btn></div>
   </Modal>}
 </div>;
}

/* ═══════════════════════════════════════════
   3. PRESTATAIRES PANEL
   Track freelancers, affiliated clients, tasks, notes
   ═══════════════════════════════════════════ */
export function PrestatairesPanel({soc, team, saveTeam, clients, reps}) {
 const [editPresta, setEditPresta] = useState(null);
 const [taskText, setTaskText] = useState("");
 const cm = curM();
 const myPresta = (team || []).filter(t => t.socId === soc.id);

 const addPresta = () => setEditPresta({id: uid(), socId: soc.id, name: "", role: "", payType: "fixed", amount: 0, notes: "", email: "", phone: "", affiliatedClients: [], tasks: []});

 const savePresta = (p) => {
   const idx = (team || []).findIndex(t => t.id === p.id);
   if (idx >= 0) { const nt = [...team]; nt[idx] = p; saveTeam(nt); }
   else saveTeam([...(team || []), p]);
   setEditPresta(null);
 };

 const deletePresta = (id) => saveTeam((team || []).filter(t => t.id !== id));

 const addTask = (prestaId) => {
   if (!taskText.trim()) return;
   const updated = (team || []).map(t => t.id === prestaId ? {...t, tasks: [...(t.tasks || []), {id: uid(), text: taskText.trim(), done: false, at: new Date().toISOString()}]} : t);
   saveTeam(updated);
   setTaskText("");
 };

 const toggleTask = (prestaId, taskId) => {
   const updated = (team || []).map(t => t.id === prestaId ? {...t, tasks: (t.tasks || []).map(tk => tk.id === taskId ? {...tk, done: !tk.done} : tk)} : t);
   saveTeam(updated);
 };

 const affiliateClient = (prestaId, clientId) => {
   const updated = (team || []).map(t => {
     if (t.id !== prestaId) return t;
     const aff = t.affiliatedClients || [];
     return {...t, affiliatedClients: aff.includes(clientId) ? aff.filter(x => x !== clientId) : [...aff, clientId]};
   });
   saveTeam(updated);
 };

 const ca = pf(gr(reps, soc.id, cm)?.ca);
 const totalPrestaMonthly = myPresta.reduce((a, t) => {
   if (t.payType === "fixed") return a + pf(t.amount);
   if (t.payType === "percent") return a + ca * pf(t.amount) / 100;
   return a;
 }, 0);

 const prestaPctOfCa = ca > 0 ? Math.round(totalPrestaMonthly / ca * 100) : 0;

 return <div>
   <Sect title="🛠️ Prestataires" sub={`${myPresta.length} prestataire${myPresta.length > 1 ? "s" : ""} · ${fmt(totalPrestaMonthly)}€/mois`} right={<Btn small onClick={addPresta}>+ Ajouter</Btn>}>
     {/* Financial recap */}
     {myPresta.length > 0 && <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8,marginBottom:14}}>
       <Card accent={C.r} style={{padding:"10px 12px",textAlign:"center"}}><div style={{color:C.td,fontSize:8,fontWeight:700}}>COÛT MENSUEL</div><div style={{fontWeight:900,fontSize:18,color:C.r}}>{fmt(totalPrestaMonthly)}€</div></Card>
       <Card accent={C.acc} style={{padding:"10px 12px",textAlign:"center"}}><div style={{color:C.td,fontSize:8,fontWeight:700}}>CA MENSUEL</div><div style={{fontWeight:900,fontSize:18,color:C.acc}}>{fmt(ca)}€</div></Card>
       <Card accent={prestaPctOfCa > 40 ? C.r : prestaPctOfCa > 25 ? C.o : C.g} style={{padding:"10px 12px",textAlign:"center"}}><div style={{color:C.td,fontSize:8,fontWeight:700}}>RATIO COÛT/CA</div><div style={{fontWeight:900,fontSize:18,color:prestaPctOfCa > 40 ? C.r : prestaPctOfCa > 25 ? C.o : C.g}}>{prestaPctOfCa}%</div></Card>
       <Card accent={C.g} style={{padding:"10px 12px",textAlign:"center"}}><div style={{color:C.td,fontSize:8,fontWeight:700}}>MARGE APRÈS PRESTA</div><div style={{fontWeight:900,fontSize:18,color:ca - totalPrestaMonthly >= 0 ? C.g : C.r}}>{fmt(ca - totalPrestaMonthly)}€</div></Card>
     </div>}
     {myPresta.length === 0 && <Card><div style={{textAlign:"center",padding:30,color:C.td}}>
       <div style={{fontSize:32,marginBottom:8}}>🛠️</div>
       <div style={{fontSize:12,marginBottom:8}}>Aucun prestataire</div>
       <Btn small onClick={addPresta}>Ajouter un prestataire</Btn>
     </div></Card>}

     {myPresta.map((p, i) => {
       const monthlyPay = p.payType === "fixed" ? pf(p.amount) : ca * pf(p.amount) / 100;
       const affClients = (clients || []).filter(c => (p.affiliatedClients || []).includes(c.id));
       const tasks = p.tasks || [];
       const doneTasks = tasks.filter(t => t.done).length;
       return <Card key={p.id} style={{padding:14,marginBottom:8}} delay={Math.min(i + 1, 6)}>
         <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
           <div style={{width:36,height:36,borderRadius:10,background:"#ec489922",border:"1.5px solid #ec489944",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:"#ec4899"}}>{(p.name || "?")[0].toUpperCase()}</div>
           <div style={{flex:1}}>
             <div style={{fontWeight:700,fontSize:13}}>{p.name || "Sans nom"}</div>
             <div style={{fontSize:10,color:C.td}}>{p.role || "Rôle non défini"}{p.email ? ` · ${p.email}` : ""}</div>
           </div>
           <div style={{textAlign:"right"}}>
             <div style={{fontWeight:800,fontSize:14,color:C.acc}}>{fmt(monthlyPay)}€<span style={{fontSize:8,color:C.td}}>/m</span></div>
             <div style={{fontSize:8,color:C.td}}>{p.payType === "fixed" ? "Fixe" : `${p.amount}% du CA`}</div>
           </div>
           <button onClick={() => setEditPresta({...p})} style={{background:"none",border:`1px solid ${C.brd}`,borderRadius:6,color:C.td,cursor:"pointer",padding:"4px 8px",fontSize:10,fontFamily:FONT}}>✏️</button>
         </div>

         {/* Affiliated clients */}
         {affClients.length > 0 && <div style={{marginBottom:8}}>
           <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:.5,marginBottom:4}}>CLIENTS AFFILIÉS ({affClients.length})</div>
           <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
             {affClients.map(cl => <span key={cl.id} style={{fontSize:9,padding:"2px 8px",borderRadius:6,background:C.gD,color:C.g,fontWeight:600,border:`1px solid ${C.g}33`}}>{cl.name}</span>)}
           </div>
         </div>}

         {/* Tasks */}
         <div style={{marginBottom:8}}>
           <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:.5,marginBottom:4}}>TÂCHES ({doneTasks}/{tasks.length})</div>
           {tasks.length > 0 && <div style={{marginBottom:6}}>
             {tasks.map(tk => <div key={tk.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0"}}>
               <input type="checkbox" checked={tk.done} onChange={() => toggleTask(p.id, tk.id)} style={{cursor:"pointer"}} />
               <span style={{flex:1,fontSize:10,color:tk.done ? C.td : C.t,textDecoration:tk.done ? "line-through" : "none"}}>{tk.text}</span>
               <span style={{fontSize:8,color:C.tm}}>{ago(tk.at)}</span>
             </div>)}
           </div>}
           <div style={{display:"flex",gap:4}}>
             <input value={taskText} onChange={e => setTaskText(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask(p.id)} placeholder="Nouvelle tâche..." style={{flex:1,padding:"5px 10px",borderRadius:6,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT,outline:"none"}} />
             <button onClick={() => addTask(p.id)} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${C.acc}44`,background:C.accD,color:C.acc,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>+</button>
           </div>
         </div>

         {/* Notes */}
         {p.notes && <div style={{padding:"6px 10px",background:C.bg,borderRadius:6,fontSize:10,color:C.td,fontStyle:"italic"}}>📝 {p.notes}</div>}
       </Card>;
     })}
   </Sect>

   {/* Edit modal */}
   {editPresta && <Modal open onClose={() => setEditPresta(null)} title={editPresta.name ? `Modifier ${editPresta.name}` : "Nouveau prestataire"}>
     <Inp label="Nom" value={editPresta.name} onChange={v => setEditPresta({...editPresta, name: v})} placeholder="Nom du prestataire" />
     <Inp label="Rôle" value={editPresta.role} onChange={v => setEditPresta({...editPresta, role: v})} placeholder="Ex: Développeur, Designer..." />
     <Inp label="Email" value={editPresta.email || ""} onChange={v => setEditPresta({...editPresta, email: v})} placeholder="email@..." />
     <Inp label="Téléphone" value={editPresta.phone || ""} onChange={v => setEditPresta({...editPresta, phone: v})} />
     <Sel label="Type de rémunération" value={editPresta.payType} onChange={v => setEditPresta({...editPresta, payType: v})} options={[{v:"fixed",l:"Montant fixe"},{v:"percent",l:"% du CA"}]} />
     <Inp label={editPresta.payType === "fixed" ? "Montant mensuel" : "Pourcentage"} type="number" value={editPresta.amount} onChange={v => setEditPresta({...editPresta, amount: pf(v)})} suffix={editPresta.payType === "fixed" ? "€" : "%"} />
     <Inp label="Notes" value={editPresta.notes} onChange={v => setEditPresta({...editPresta, notes: v})} placeholder="Notes libres..." />
     <div style={{marginTop:8}}>
       <div style={{fontSize:9,fontWeight:700,color:C.td,marginBottom:4}}>AFFILIER DES CLIENTS</div>
       <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
         {(clients || []).filter(c => c.socId === soc.id && c.status === "active").map(cl => {
           const isAff = (editPresta.affiliatedClients || []).includes(cl.id);
           return <button key={cl.id} onClick={() => {
             const aff = editPresta.affiliatedClients || [];
             setEditPresta({...editPresta, affiliatedClients: isAff ? aff.filter(x => x !== cl.id) : [...aff, cl.id]});
           }} style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${isAff ? C.g : C.brd}`,background:isAff ? C.gD : "transparent",color:isAff ? C.g : C.td,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>
             {isAff ? "✓ " : ""}{cl.name}
           </button>;
         })}
       </div>
     </div>
     <div style={{display:"flex",gap:8,marginTop:12}}>
       <Btn onClick={() => savePresta(editPresta)}>Sauver</Btn>
       <Btn v="secondary" onClick={() => setEditPresta(null)}>Annuler</Btn>
       {(team || []).find(t => t.id === editPresta.id) && <Btn v="danger" onClick={() => {deletePresta(editPresta.id); setEditPresta(null);}} style={{marginLeft:"auto"}}>Supprimer</Btn>}
     </div>
   </Modal>}
 </div>;
}

/* ═══════════════════════════════════════════
   4. SANTÉ SOCIÉTÉ PANEL
   Health state, alerts, recommendations, action plan
   ═══════════════════════════════════════════ */
export function SantePanel({soc, reps, allM, socBankData, ghlData, clients, hold, team}) {
 const cm = curM();
 const hs = healthScore(soc, reps);
 const rw = runway(reps, soc.id, allM);
 const report = gr(reps, soc.id, cm);
 const prevReport = gr(reps, soc.id, prevM(cm));
 const ca = pf(report?.ca);
 const charges = pf(report?.charges);
 const marge = ca - charges;
 const margePct = ca > 0 ? Math.round(marge / ca * 100) : 0;
 const prevCa = pf(prevReport?.ca);
 const growth = prevCa > 0 ? Math.round((ca - prevCa) / prevCa * 100) : null;
 const treso = socBankData?.balance || pf(report?.tresoSoc);
 const myClients = (clients || []).filter(c => c.socId === soc.id);
 const activeClients = myClients.filter(c => c.status === "active");
 const churnedClients = myClients.filter(c => c.status === "churned");
 const churnRate = myClients.length > 0 ? Math.round(churnedClients.length / myClients.length * 100) : 0;
 const gd = ghlData?.[soc.id];
 const calEvts = gd?.calendarEvents || [];
 const wonOpps = (gd?.opportunities || []).filter(o => o.status === "won");
 const totalCalls = calEvts.length;
 const convRate = totalCalls > 0 ? Math.round(wonOpps.length / totalCalls * 100) : 0;

 // Burn rate from bank data
 const bankTxs = socBankData?.transactions || [];
 const excluded = EXCLUDED_ACCOUNTS[soc.id] || [];
 const last3M = [cm, prevM(cm), prevM(prevM(cm))];
 const monthlyBurn = last3M.map(m => {
   const mTxs = bankTxs.filter(t => (t.created_at || "").startsWith(m) && !isExcludedTx(t, excluded));
   return Math.abs(mTxs.filter(t => (t.legs?.[0]?.amount || 0) < 0).reduce((a, t) => a + (t.legs?.[0]?.amount || 0), 0));
 });
 const avgBurn = monthlyBurn.reduce((a, v) => a + v, 0) / Math.max(1, monthlyBurn.filter(v => v > 0).length);
 const burnRunway = avgBurn > 0 ? Math.floor(treso / avgBurn) : 99;

 // Alerts generation
 const alerts = [];
 // Critical
 if (burnRunway <= 2 && burnRunway > 0) alerts.push({level: "critical", icon: "🚨", text: `Seulement ${burnRunway} mois de trésorerie restante`, action: "Réduire les dépenses ou augmenter le CA immédiatement"});
 if (margePct < 0) alerts.push({level: "critical", icon: "🔴", text: `Marge négative (${margePct}%) — vous perdez de l'argent`, action: "Réviser la structure de coûts"});
 if (churnRate > 30) alerts.push({level: "critical", icon: "💀", text: `Taux de churn critique : ${churnRate}%`, action: "Enquêter sur les raisons de départ et mettre en place un plan de rétention"});
 // Warnings
 if (burnRunway > 2 && burnRunway <= 5) alerts.push({level: "warning", icon: "⚠️", text: `${burnRunway} mois de runway — anticipez`, action: "Préparer un plan de relance commercial"});
 if (growth !== null && growth < -20) alerts.push({level: "warning", icon: "📉", text: `CA en baisse de ${Math.abs(growth)}% vs mois précédent`, action: "Analyser les causes et intensifier la prospection"});
 if (margePct >= 0 && margePct < 15) alerts.push({level: "warning", icon: "⚠️", text: `Marge faible (${margePct}%)`, action: "Optimiser les coûts ou augmenter les prix"});
 if (convRate < 10 && totalCalls > 5) alerts.push({level: "warning", icon: "📞", text: `Taux de conversion bas (${convRate}%)`, action: "Améliorer le script de vente et la qualification des prospects"});
 if (ca > 0 && soc.obj > 0 && ca < soc.obj * 0.5) alerts.push({level: "warning", icon: "🎯", text: `CA à ${Math.round(ca/soc.obj*100)}% de l'objectif`, action: "Accélérer les efforts commerciaux"});
 // Positive
 if (growth !== null && growth > 10) alerts.push({level: "success", icon: "🚀", text: `Croissance de +${growth}% vs mois précédent`, action: "Maintenir la dynamique et capitaliser"});
 if (margePct >= 30) alerts.push({level: "success", icon: "💪", text: `Excellente marge de ${margePct}%`, action: "Envisager des investissements de croissance"});
 if (burnRunway > 12) alerts.push({level: "success", icon: "🏦", text: `+12 mois de runway — situation confortable`, action: "Concentrez-vous sur la croissance"});
 if (convRate >= 25) alerts.push({level: "success", icon: "🎯", text: `Taux de conversion excellent (${convRate}%)`, action: "Votre process de vente fonctionne bien"});
 if (churnRate === 0 && activeClients.length > 0) alerts.push({level: "success", icon: "💚", text: "0 churn — excellente rétention client", action: "Continuez à délivrer de la valeur"});

 const levelColors = {critical: C.r, warning: C.o, success: C.g};
 const levelLabels = {critical: "CRITIQUE", warning: "ATTENTION", success: "POSITIF"};
 const criticals = alerts.filter(a => a.level === "critical");
 const warnings = alerts.filter(a => a.level === "warning");
 const successes = alerts.filter(a => a.level === "success");

 // Score visual
 const gradeEmoji = {A: "🟢", B: "🔵", C: "🟡", D: "🔴"};
 const gradeTxt = {A: "Excellente santé", B: "Bonne santé", C: "À surveiller", D: "Situation critique"};

 return <div>
   <Sect title="🩺 État de santé" sub={`${soc.nom} · ${ml(cm)}`}>
     {/* Health grade hero */}
     <div className="glass-card-static" style={{padding:24,marginBottom:16,textAlign:"center"}}>
       <div style={{fontSize:48,marginBottom:8}}>{gradeEmoji[hs.grade] || "❓"}</div>
       <div style={{fontWeight:900,fontSize:48,color:hs.color,lineHeight:1}}>{hs.grade}</div>
       <div style={{fontWeight:700,fontSize:14,color:C.t,marginTop:6}}>{gradeTxt[hs.grade] || "—"}</div>
       <div style={{fontSize:11,color:C.td,marginTop:4}}>Score: {hs.score}/100</div>
       <div className="health-score-grid" style={{display:"flex",justifyContent:"center",gap:16,marginTop:14}}>
         <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td,fontWeight:600}}>Objectif</div><div style={{fontWeight:800,fontSize:14,color:C.acc}}>{hs.obj}/30</div></div>
         <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td,fontWeight:600}}>Croissance</div><div style={{fontWeight:800,fontSize:14,color:C.g}}>{hs.growth}/25</div></div>
         <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td,fontWeight:600}}>Marge</div><div style={{fontWeight:800,fontSize:14,color:C.b}}>{hs.margin}/25</div></div>
         <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td,fontWeight:600}}>Rétention</div><div style={{fontWeight:800,fontSize:14,color:"#a78bfa"}}>{hs.retention}/20</div></div>
       </div>
     </div>

     {/* Burn rate / Runway */}
     <div className="glass-card-static" style={{padding:16,marginBottom:14}}>
       <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:8,fontFamily:FONT_TITLE}}>🔥 BURN-RATE & SURVIE</div>
       <div className="burn-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
         <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td}}>Dépenses moy/mois</div><div style={{fontWeight:900,fontSize:18,color:C.r}}>{fmt(avgBurn)}€</div></div>
         <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td}}>Trésorerie</div><div style={{fontWeight:900,fontSize:18,color:C.b}}>{fmt(treso)}€</div></div>
         <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td}}>Mois de survie</div><div style={{fontWeight:900,fontSize:18,color:burnRunway <= 3 ? C.r : burnRunway <= 6 ? C.o : C.g}}>{burnRunway >= 99 ? "∞" : burnRunway}</div></div>
       </div>
       {avgBurn > 0 && <div style={{marginTop:10}}>
         <div style={{height:8,background:C.brd,borderRadius:4,overflow:"hidden"}}>
           <div style={{height:"100%",width:`${Math.min(100, burnRunway / 12 * 100)}%`,background:burnRunway <= 3 ? C.r : burnRunway <= 6 ? C.o : C.g,borderRadius:4,transition:"width .6s ease"}} />
         </div>
         <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:8,color:C.td}}>
           <span>0 mois</span><span>6 mois</span><span>12+ mois</span>
         </div>
       </div>}
     </div>

     {/* Alerts */}
     {criticals.length > 0 && <div style={{marginBottom:12}}>
       <div style={{fontSize:9,fontWeight:700,color:C.r,letterSpacing:1,marginBottom:6}}>🚨 POINTS CRITIQUES ({criticals.length})</div>
       {criticals.map((a, i) => <div key={i} style={{padding:"10px 14px",background:C.rD,borderRadius:10,border:`1px solid ${C.r}22`,marginBottom:4}}>
         <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>{a.icon}</span><span style={{fontWeight:700,fontSize:12,color:C.r}}>{a.text}</span></div>
         <div style={{fontSize:10,color:C.td,marginTop:4,paddingLeft:22}}>→ {a.action}</div>
       </div>)}
     </div>}

     {warnings.length > 0 && <div style={{marginBottom:12}}>
       <div style={{fontSize:9,fontWeight:700,color:C.o,letterSpacing:1,marginBottom:6}}>⚠️ POINTS D'ATTENTION ({warnings.length})</div>
       {warnings.map((a, i) => <div key={i} style={{padding:"10px 14px",background:C.oD,borderRadius:10,border:`1px solid ${C.o}22`,marginBottom:4}}>
         <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>{a.icon}</span><span style={{fontWeight:700,fontSize:12,color:C.o}}>{a.text}</span></div>
         <div style={{fontSize:10,color:C.td,marginTop:4,paddingLeft:22}}>→ {a.action}</div>
       </div>)}
     </div>}

     {successes.length > 0 && <div style={{marginBottom:12}}>
       <div style={{fontSize:9,fontWeight:700,color:C.g,letterSpacing:1,marginBottom:6}}>✅ POINTS POSITIFS ({successes.length})</div>
       {successes.map((a, i) => <div key={i} style={{padding:"10px 14px",background:C.gD,borderRadius:10,border:`1px solid ${C.g}22`,marginBottom:4}}>
         <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>{a.icon}</span><span style={{fontWeight:700,fontSize:12,color:C.g}}>{a.text}</span></div>
         <div style={{fontSize:10,color:C.td,marginTop:4,paddingLeft:22}}>→ {a.action}</div>
       </div>)}
     </div>}

     {alerts.length === 0 && <Card><div style={{textAlign:"center",padding:20,color:C.td}}>Pas assez de données pour générer des alertes</div></Card>}

     {/* Key metrics recap */}
     <div className="glass-card-static" style={{padding:16,marginTop:4}}>
       <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>📊 RÉSUMÉ DES INDICATEURS</div>
       {[
         {label: "CA mensuel", value: `${fmt(ca)}€`, target: soc.obj > 0 ? `/ ${fmt(soc.obj)}€` : null, color: soc.obj > 0 && ca >= soc.obj ? C.g : ca > 0 ? C.acc : C.td},
         {label: "Marge brute", value: `${fmt(marge)}€ (${margePct}%)`, color: margePct >= 30 ? C.g : margePct >= 0 ? C.o : C.r},
         {label: "Croissance M/M", value: growth !== null ? `${growth > 0 ? "+" : ""}${growth}%` : "—", color: growth > 0 ? C.g : growth < 0 ? C.r : C.td},
         {label: "Clients actifs", value: String(activeClients.length), color: C.b},
         {label: "Taux de churn", value: `${churnRate}%`, color: churnRate === 0 ? C.g : churnRate <= 10 ? C.o : C.r},
         {label: "Appels bookés", value: String(totalCalls), color: "#14b8a6"},
         {label: "Conversion", value: `${convRate}%`, color: convRate >= 20 ? C.g : convRate >= 10 ? C.o : C.r},
         {label: "Runway", value: burnRunway >= 99 ? "∞" : `${burnRunway} mois`, color: burnRunway <= 3 ? C.r : burnRunway <= 6 ? C.o : C.g},
       ].map((m, i) => <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:i < 7 ? `1px solid ${C.brd}08` : "none"}}>
         <span style={{fontSize:11,color:C.td}}>{m.label}</span>
         <div>
           <span style={{fontWeight:700,fontSize:12,color:m.color}}>{m.value}</span>
           {m.target && <span style={{fontSize:9,color:C.td,marginLeft:4}}>{m.target}</span>}
         </div>
       </div>)}
     </div>
   </Sect>
 </div>;
}

/* ═══════════════════════════════════════════
   5. AGENDA STATS (call tracking)
   Appended stats for the existing AgendaPanel
   ═══════════════════════════════════════════ */
export function AgendaStats({soc, ghlData}) {
 const gd = ghlData?.[soc.id] || {};
 const calEvts = gd.calendarEvents || [];
 const now = new Date();
 const thisYear = now.getFullYear();
 const thisMonth = curM();

 // Current week boundaries
 const dayOfWeek = now.getDay() || 7; // Mon=1
 const weekStart = new Date(now);
 weekStart.setDate(now.getDate() - dayOfWeek + 1);
 weekStart.setHours(0,0,0,0);
 const weekEnd = new Date(weekStart);
 weekEnd.setDate(weekStart.getDate() + 7);

 const prevWeekStart = new Date(weekStart);
 prevWeekStart.setDate(weekStart.getDate() - 7);
 const nextWeekEnd = new Date(weekEnd);
 nextWeekEnd.setDate(weekEnd.getDate() + 7);

 // Counts
 const yearCalls = calEvts.filter(e => (e.startTime||"").startsWith(String(thisYear))).length;
 const monthCalls = calEvts.filter(e => (e.startTime||"").startsWith(thisMonth)).length;
 const weekCalls = calEvts.filter(e => {const d = new Date(e.startTime||0); return d >= weekStart && d < weekEnd;}).length;
 const prevWeekCalls = calEvts.filter(e => {const d = new Date(e.startTime||0); return d >= prevWeekStart && d < weekStart;}).length;
 const nextWeekCalls = calEvts.filter(e => {const d = new Date(e.startTime||0); return d >= weekEnd && d < nextWeekEnd;}).length;

 const noShows = calEvts.filter(e => (e.status||"").toLowerCase().match(/cancel|no.show/)).length;
 const confirmed = calEvts.filter(e => (e.status||"").toLowerCase().includes("confirm")).length;

 return <div className="glass-card-static" style={{padding:16,marginBottom:14}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>📞 APPELS RÉSERVÉS</div>
   <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))",gap:8}}>
     <div style={{textAlign:"center",padding:8,background:C.bg,borderRadius:8}}>
       <div style={{fontWeight:900,fontSize:20,color:C.acc}}>{yearCalls}</div>
       <div style={{fontSize:8,color:C.td}}>Cette année</div>
     </div>
     <div style={{textAlign:"center",padding:8,background:C.bg,borderRadius:8}}>
       <div style={{fontWeight:900,fontSize:20,color:C.b}}>{monthCalls}</div>
       <div style={{fontSize:8,color:C.td}}>Ce mois</div>
     </div>
     <div style={{textAlign:"center",padding:8,background:C.bg,borderRadius:8}}>
       <div style={{fontWeight:900,fontSize:20,color:"#14b8a6"}}>{weekCalls}</div>
       <div style={{fontSize:8,color:C.td}}>Cette semaine</div>
     </div>
     <div style={{textAlign:"center",padding:8,background:C.bg,borderRadius:8}}>
       <div style={{fontWeight:900,fontSize:20,color:C.td}}>{prevWeekCalls}</div>
       <div style={{fontSize:8,color:C.td}}>Sem. passée</div>
     </div>
     <div style={{textAlign:"center",padding:8,background:C.bg,borderRadius:8}}>
       <div style={{fontWeight:900,fontSize:20,color:C.g}}>{nextWeekCalls}</div>
       <div style={{fontSize:8,color:C.td}}>Sem. prochaine</div>
     </div>
   </div>
   <div style={{display:"flex",gap:12,marginTop:10,justifyContent:"center",flexWrap:"wrap"}}>
     <span style={{fontSize:9,color:C.g}}>✅ {confirmed} confirmés</span>
     <span style={{fontSize:9,color:C.r}}>❌ {noShows} no-show/annulés</span>
     <span style={{fontSize:9,color:C.td}}>📊 Taux: {calEvts.length > 0 ? Math.round(confirmed / calEvts.length * 100) : 0}% confirmés</span>
   </div>
 </div>;
}

/* ═══════════════════════════════════════════
   6. CA FORECAST (prévisionnel)
   For the dashboard
   ═══════════════════════════════════════════ */
export function CAForecast({soc, reps, allM, socBank}) {
 const cm = curM();
 const bankData = socBank?.[soc.id];
 const excluded = EXCLUDED_ACCOUNTS[soc.id] || [];

 // Build history from bank data or reports
 const historyData = useMemo(() => {
   const months = (allM || []).slice(-6);
   return months.map(m => {
     let ca = 0;
     if (bankData?.transactions) {
       ca = bankData.transactions.filter(t => (t.created_at||"").startsWith(m) && !isExcludedTx(t, excluded) && (t.legs?.[0]?.amount||0) > 0)
         .reduce((a, t) => a + (t.legs?.[0]?.amount || 0), 0);
     }
     if (ca === 0) ca = pf(gr(reps, soc.id, m)?.ca);
     return {month: m, label: ml(m), ca: Math.round(ca)};
   }).filter(d => d.ca > 0);
 }, [allM, bankData, reps, soc.id, excluded]);

 // Simple linear projection (next 3 months)
 const forecast = useMemo(() => {
   if (historyData.length < 2) return [];
   const vals = historyData.map(d => d.ca);
   const n = vals.length;
   const sumX = n * (n - 1) / 2;
   const sumY = vals.reduce((a, v) => a + v, 0);
   const sumXY = vals.reduce((a, v, i) => a + i * v, 0);
   const sumX2 = n * (n - 1) * (2 * n - 1) / 6;
   const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
   const intercept = (sumY - slope * sumX) / n;

   let m = cm;
   return [0, 1, 2].map(i => {
     m = i === 0 ? nextM(cm) : nextM(m);
     const predicted = Math.max(0, Math.round(intercept + slope * (n + i)));
     return {month: m, label: ml(m), ca: predicted, forecast: true};
   });
 }, [historyData, cm]);

 if (historyData.length < 2) return null;

 const allData = [...historyData.map(d => ({...d, forecast: false})), ...forecast];

 return <div className="glass-card-static" style={{padding:18,marginBottom:16}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📈 PRÉVISIONNEL CA</div>
   <div style={{height:180}}>
     <ResponsiveContainer>
       <AreaChart data={allData}>
         <defs>
           <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
             <stop offset="0%" stopColor={C.acc} stopOpacity={0.3}/>
             <stop offset="100%" stopColor={C.acc} stopOpacity={0}/>
           </linearGradient>
           <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
             <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.2}/>
             <stop offset="100%" stopColor="#a78bfa" stopOpacity={0}/>
           </linearGradient>
         </defs>
         <CartesianGrid strokeDasharray="3 3" stroke={C.brd} />
         <XAxis dataKey="label" tick={{fill: C.td, fontSize: 9}} axisLine={false} tickLine={false} />
         <YAxis tick={{fill: C.td, fontSize: 9}} axisLine={false} tickLine={false} tickFormatter={v => `${fK(v)}€`} />
         <Tooltip content={<CTip />} />
         <Area type="monotone" dataKey="ca" stroke={C.acc} fill="url(#caGrad)" strokeWidth={2} strokeDasharray={d => d.forecast ? "5 3" : "0"} dot={d => ({fill: d.payload.forecast ? "#a78bfa" : C.acc, r: 3, stroke: d.payload.forecast ? "#a78bfa" : C.acc})} name="CA" />
       </AreaChart>
     </ResponsiveContainer>
   </div>
   <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:8}}>
     <span style={{fontSize:9,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:3,background:C.acc,borderRadius:2}} />Réalisé</span>
     <span style={{fontSize:9,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:3,background:"#a78bfa",borderRadius:2,borderTop:"1px dashed #a78bfa"}} />Prévision</span>
   </div>
 </div>;
}
