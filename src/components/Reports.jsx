import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import {
  BF, BILL_TYPES, C, CLIENT_STATUS, CSS, CURR_SYMBOLS, DEAL_STAGES, EXCLUDED_ACCOUNTS, ErrorBoundary, FONT, FONT_TITLE,
  GHL_STAGES_COLORS, INV_STATUS, KB_CATS, MILESTONE_CATS, MN, MOODS, SLACK_MODES, SUB_CATS, SYN_STATUS, SYN_TYPES, gr,
  TIER_BG, TIER_COLORS, ago, autoDetectSubscriptions, buildAIContext, buildPulseSlackMsg, buildReportSlackMsg, buildValidationSlackMsg,
  calcH, calcMilestones, clamp, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, curM, curW,
  deadline, fK, fetchGHL, fmt, generateInvoices, getAlerts, getStripeChargesForClient, getStripeTotal, getTheme, ghlCreateContact,
  ghlCreateInvoice, ghlSendInvoice, ghlUpdateContact, healthScore, matchSubsToRevolut, ml, nextM, normalizeStr, pct,
  pf, prevM, project, revFinancials, runway, sSet, sbUpsert, simH, sinceLbl, sinceMonths, slackSend, subMonthly, teamMonthly,
  uid, autoCategorize,
} from "../shared.jsx";

export function RapportsPanel({soc,socBankData,ghlData,clients,reps,allM}){
 const[expandedMonth,setExpandedMonth]=useState(null);
 const[notesMap,setNotesMap]=useState(()=>{try{return JSON.parse(localStorage.getItem(`scRapportNotes_${soc?.id}`)||"{}");}catch{return{};}});
 const saveNote=(month,text)=>{const next={...notesMap,[month]:text};setNotesMap(next);try{localStorage.setItem(`scRapportNotes_${soc?.id}`,JSON.stringify(next));}catch{}};
 const cm=curM();
 const months=useMemo(()=>{const ms=[];let m=cm;for(let i=0;i<12;i++){ms.push(m);m=prevM(m);}return ms;},[cm]);
 const getMonthData=(month)=>{
  const txs=(socBankData?.transactions||[]).filter(t=>(t.created_at||"").startsWith(month));
  const excl=EXCLUDED_ACCOUNTS[soc?.id]||[];
  const filtered=txs.filter(t=>{const leg=t.legs?.[0];return leg&&!excl.includes(leg.account_id);});
  const ca=filtered.filter(t=>(t.legs?.[0]?.amount||0)>0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0);
  const charges=Math.abs(filtered.filter(t=>(t.legs?.[0]?.amount||0)<0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0));
  const marge=ca-charges;
  // Top 5 clients by collected
  const clientTotals={};filtered.filter(t=>(t.legs?.[0]?.amount||0)>0).forEach(t=>{const desc=(t.legs?.[0]?.description||t.reference||"").trim();clientTotals[desc]=(clientTotals[desc]||0)+(t.legs?.[0]?.amount||0);});
  const topClients=Object.entries(clientTotals).sort((a,b)=>b[1]-a[1]).slice(0,5);
  // Top 5 expenses
  const expTotals={};filtered.filter(t=>(t.legs?.[0]?.amount||0)<0).forEach(t=>{const desc=(t.legs?.[0]?.description||t.reference||"").trim();expTotals[desc]=(expTotals[desc]||0)+Math.abs(t.legs?.[0]?.amount||0);});
  const topExpenses=Object.entries(expTotals).sort((a,b)=>b[1]-a[1]).slice(0,5);
  // Clients won/lost
  const gd=ghlData?.[soc.id];
  const wonThisMonth=(gd?.opportunities||[]).filter(o=>o.status==="won"&&(o.updatedAt||o.createdAt||"").startsWith(month)).length;
  const lostThisMonth=(gd?.opportunities||[]).filter(o=>o.status==="lost"&&(o.updatedAt||o.createdAt||"").startsWith(month)).length;
  return{ca,charges,marge,topClients,topExpenses,wonThisMonth,lostThisMonth,treso:socBankData?.balance||0,txCount:filtered.length};
 };
 // MRR tracking
 const activeClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active"&&c.billing);
 const mrrMonths=months.slice(0,6).reverse();
 const mrrData=useMemo(()=>{
  return activeClients.map(cl=>{
   const cn=(cl.name||"").toLowerCase().trim();
   const monthPayments={};
   mrrMonths.forEach(mo=>{
    const txs=(socBankData?.transactions||[]).filter(t=>(t.created_at||"").startsWith(mo));
    const found=txs.some(t=>{const leg=t.legs?.[0];if(!leg||leg.amount<=0)return false;const desc=(leg.description||t.reference||"").toLowerCase();return cn.length>2&&desc.includes(cn);});
    monthPayments[mo]=found;
   });
   return{client:cl,payments:monthPayments,billing:clientMonthlyRevenue(cl)};
  });
 },[activeClients,socBankData,mrrMonths]);
 const mrrTheorique=activeClients.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 return <div className="fu">
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
   <div><h2 style={{color:C.t,fontSize:13,fontWeight:800,margin:0,fontFamily:FONT_TITLE}}>📋 RAPPORTS MENSUELS</h2><p style={{color:C.td,fontSize:10,margin:"2px 0 0"}}>Bilans financiers auto-générés</p></div>
   <ReplayMensuel soc={soc} reps={reps} allM={allM} socBank={socBankData?{[soc.id]:socBankData}:{}} clients={clients} ghlData={ghlData}/>
  </div>
  {months.map((month,mi)=>{
   const d=getMonthData(month);const isExpanded=expandedMonth===month||mi===0;const isCurrent=mi===0;
   return <div key={month} className={`glass-card-static fu d${Math.min(mi+1,6)}`} style={{padding:isCurrent?20:14,marginBottom:10,cursor:isCurrent?undefined:"pointer"}} onClick={!isCurrent?()=>setExpandedMonth(expandedMonth===month?null:month):undefined}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:isExpanded?12:0}}>
     <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:isCurrent?16:12}}>{isCurrent?"📊":"📄"}</span>
      <div>
       <div style={{fontWeight:800,fontSize:isCurrent?14:12,color:C.t}}>{ml(month)}{isCurrent?" (en cours)":""}</div>
       {!isExpanded&&<div style={{fontSize:9,color:C.td}}>CA {fmt(d.ca)}€ · Charges {fmt(d.charges)}€ · Marge {fmt(d.marge)}€</div>}
      </div>
     </div>
     {!isCurrent&&<span style={{fontSize:11,color:C.td}}>{isExpanded?"▲":"▼"}</span>}
    </div>
    {isExpanded&&<>
     {/* KPIs */}
     <div className="rg4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
      <div style={{padding:10,background:C.gD,borderRadius:8,textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.g}}>{fmt(d.ca)}€</div><div style={{fontSize:8,color:C.g,fontWeight:600}}>CA</div></div>
      <div style={{padding:10,background:C.rD,borderRadius:8,textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.r}}>{fmt(d.charges)}€</div><div style={{fontSize:8,color:C.r,fontWeight:600}}>Charges</div></div>
      <div style={{padding:10,background:d.marge>=0?C.gD:C.rD,borderRadius:8,textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:d.marge>=0?C.g:C.r}}>{fmt(d.marge)}€</div><div style={{fontSize:8,color:C.td,fontWeight:600}}>Marge</div></div>
      <div style={{padding:10,background:C.bD,borderRadius:8,textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.b}}>{d.txCount}</div><div style={{fontSize:8,color:C.td,fontWeight:600}}>Transactions</div></div>
     </div>
     {/* Top clients + expenses side by side */}
     <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <div>
       <div style={{fontSize:9,fontWeight:700,color:C.g,marginBottom:6}}>TOP CLIENTS</div>
       {d.topClients.length===0?<div style={{fontSize:10,color:C.td}}>—</div>:d.topClients.map(([n,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.brd}08`}}><span style={{fontSize:10,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{n}</span><span style={{fontSize:10,fontWeight:700,color:C.g}}>{fmt(v)}€</span></div>)}
      </div>
      <div>
       <div style={{fontSize:9,fontWeight:700,color:C.r,marginBottom:6}}>TOP DÉPENSES</div>
       {d.topExpenses.length===0?<div style={{fontSize:10,color:C.td}}>—</div>:d.topExpenses.map(([n,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.brd}08`}}><span style={{fontSize:10,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{n}</span><span style={{fontSize:10,fontWeight:700,color:C.r}}>{fmt(v)}€</span></div>)}
      </div>
     </div>
     {/* Won/lost */}
     <div style={{display:"flex",gap:12,marginBottom:12}}>
      <span style={{fontSize:10,color:C.g,fontWeight:600}}>✅ {d.wonThisMonth} client{d.wonThisMonth>1?"s":""} gagné{d.wonThisMonth>1?"s":""}</span>
      <span style={{fontSize:10,color:C.r,fontWeight:600}}>❌ {d.lostThisMonth} perdu{d.lostThisMonth>1?"s":""}</span>
     </div>
     {/* Objectifs vs Réalité */}
     {(soc.obj||soc.monthlyGoal)>0&&(()=>{const obj=soc.obj||soc.monthlyGoal||0;const atteint=d.ca>=obj;return <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:atteint?C.gD:C.rD,borderRadius:8,marginBottom:12}}>
      <span style={{fontSize:14}}>{atteint?"✅":"❌"}</span>
      <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:atteint?C.g:C.r}}>{atteint?"Objectif atteint":"Non atteint"}</div><div style={{fontSize:9,color:C.td}}>Objectif: {fmt(obj)}€ · Réalisé: {fmt(d.ca)}€ ({obj>0?Math.round(d.ca/obj*100):0}%)</div></div>
     </div>;})()}
     {/* Publicité Meta */}
     {(()=>{let metaD=null;try{metaD=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${month}`));}catch{}
      if(!metaD||!metaD.spend)return null;
      const sp3=metaD.spend||0,lds3=metaD.leads||0,rev3=metaD.revenue||0;
      const cpl3=lds3>0?sp3/lds3:0,roas3=sp3>0?rev3/sp3:0;
      let metaPD=null;try{metaPD=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${prevM(month)}`));}catch{}
      const pCpl3=metaPD&&metaPD.leads>0?metaPD.spend/metaPD.leads:0;
      const pRoas3=metaPD&&metaPD.spend>0?metaPD.revenue/metaPD.spend:0;
      return <div style={{padding:10,background:C.accD,borderRadius:8,marginBottom:12,border:`1px solid ${C.acc}22`}}>
       <div style={{fontSize:9,fontWeight:700,color:C.acc,marginBottom:6}}>📣 PUBLICITÉ META</div>
       <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:600}}>Budget: {fmt(sp3)}€</span>
        <span style={{fontSize:10,fontWeight:600}}>Leads: {lds3}</span>
        <span style={{fontSize:10,fontWeight:600,color:cpl3>0&&pCpl3>0?(cpl3<=pCpl3?C.g:C.r):C.t}}>CPL: {cpl3.toFixed(2)}€{pCpl3>0?` (${cpl3<=pCpl3?"↓":"↑"})`:""}</span>
        <span style={{fontSize:10,fontWeight:600,color:roas3>=2?C.g:roas3>=1?C.o:C.r}}>ROAS: {roas3.toFixed(2)}x{pRoas3>0?` (${roas3>=pRoas3?"↑":"↓"})`:""}</span>
       </div>
      </div>;
     })()}
     {/* Export PDF */}
     <button onClick={(e)=>{e.stopPropagation();const logo=hold?.brand?.logoUrl||"";const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport ${ml(month)} — ${soc.nom}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a}h1{color:#FFAA00;font-size:24px}h2{color:#333;font-size:16px;margin-top:20px}.kpi{display:inline-block;padding:12px 20px;margin:6px;background:#f5f5f5;border-radius:8px;text-align:center}.kpi .val{font-size:22px;font-weight:900}.kpi .lbl{font-size:11px;color:#666}table{width:100%;border-collapse:collapse;margin-top:10px}td,th{padding:6px 10px;border-bottom:1px solid #eee;text-align:left;font-size:12px}@media print{body{padding:20px}}</style></head><body>${logo?`<img src="${logo}" style="height:40px;margin-bottom:12px"/>`:""}
<h1>Rapport ${ml(month)}</h1><p>${soc.nom} — ${soc.porteur}</p>
<div><div class="kpi"><div class="val" style="color:#22c55e">${fmt(d.ca)}€</div><div class="lbl">CA</div></div><div class="kpi"><div class="val" style="color:#ef4444">${fmt(d.charges)}€</div><div class="lbl">Charges</div></div><div class="kpi"><div class="val" style="color:${d.marge>=0?"#22c55e":"#ef4444"}">${fmt(d.marge)}€</div><div class="lbl">Marge</div></div></div>
<h2>Top Clients</h2><table>${d.topClients.map(([n,v])=>`<tr><td>${n}</td><td style="font-weight:700;color:#22c55e">${fmt(v)}€</td></tr>`).join("")}</table>
<h2>Top Dépenses</h2><table>${d.topExpenses.map(([n,v])=>`<tr><td>${n}</td><td style="font-weight:700;color:#ef4444">${fmt(v)}€</td></tr>`).join("")}</table>
${(soc.obj||0)>0?`<h2>Objectif</h2><p>${d.ca>=(soc.obj||0)?"✅ Atteint":"❌ Non atteint"} — ${fmt(d.ca)}€ / ${fmt(soc.obj)}€</p>`:""}
<p style="margin-top:30px;color:#999;font-size:10px">MRR théorique: ${fmt(mrrTheorique)}€ · Généré le ${new Date().toLocaleDateString("fr-FR")}</p></body></html>`;const w=window.open("","_blank");w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),500);}} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${C.acc}`,background:C.accD,color:C.acc,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT,marginBottom:12}}>📥 Exporter PDF</button>
     {/* Notes per month */}
     <div style={{marginTop:8}}>
      <label style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:.5,display:"block",marginBottom:4}}>📝 NOTES DU MOIS</label>
      <textarea value={notesMap[month]||""} onChange={e=>saveNote(month,e.target.value)} placeholder="Ajouter vos observations, commentaires..." style={{width:"100%",minHeight:isCurrent?80:50,padding:10,borderRadius:8,border:`1px solid ${C.brd}`,background:"rgba(6,6,11,0.6)",color:C.t,fontSize:11,fontFamily:FONT,outline:"none",resize:"vertical"}}/>
     </div>
    </>}
   </div>;
  })}
  {/* Objectifs summary */}
  {(soc.obj||soc.monthlyGoal)>0&&(()=>{const obj=soc.obj||soc.monthlyGoal||0;const results=months.map(mo=>getMonthData(mo)).filter(d=>d.txCount>0);const atteints=results.filter(d=>d.ca>=obj).length;const total=results.length;const pctObj=total>0?Math.round(atteints/total*100):0;return <div className="glass-card-static" style={{padding:16,marginTop:12,marginBottom:4,display:"flex",alignItems:"center",gap:12}}>
   <span style={{fontSize:24}}>{pctObj>=70?"🏆":pctObj>=40?"📊":"📉"}</span>
   <div><div style={{fontWeight:800,fontSize:12,color:pctObj>=70?C.g:pctObj>=40?C.o:C.r}}>Objectifs atteints: {atteints}/{total} mois ({pctObj}%)</div><div style={{fontSize:9,color:C.td}}>Objectif mensuel: {fmt(obj)}€</div></div>
  </div>;})()}
  {/* MRR TRACKING */}
  {activeClients.length>0&&<div className="glass-card-static" style={{padding:20,marginTop:16}}>
   <div style={{fontSize:9,fontWeight:700,color:C.v,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 SUIVI MRR — RÉCURRENCE CLIENTS</div>
   <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
     <thead><tr>
      <th style={{textAlign:"left",padding:"6px 8px",borderBottom:`1px solid ${C.brd}`,color:C.td,fontWeight:700,fontSize:9}}>Client</th>
      <th style={{textAlign:"right",padding:"6px 4px",borderBottom:`1px solid ${C.brd}`,color:C.td,fontWeight:700,fontSize:8}}>€/m</th>
      {mrrMonths.map(mo=><th key={mo} style={{textAlign:"center",padding:"6px 4px",borderBottom:`1px solid ${C.brd}`,color:C.td,fontWeight:700,fontSize:8,minWidth:50}}>{ml(mo).split(" ")[0]}</th>)}
     </tr></thead>
     <tbody>
      {mrrData.map(({client:cl,payments,billing})=><tr key={cl.id}>
       <td style={{padding:"5px 8px",borderBottom:`1px solid ${C.brd}08`,fontWeight:600,color:C.t,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cl.name}</td>
       <td style={{padding:"5px 4px",borderBottom:`1px solid ${C.brd}08`,textAlign:"right",fontWeight:700,color:C.acc}}>{fmt(billing)}€</td>
       {mrrMonths.map(mo=><td key={mo} style={{padding:"5px 4px",borderBottom:`1px solid ${C.brd}08`,textAlign:"center"}}>{payments[mo]?<span style={{color:C.g}}>✅</span>:<span style={{color:C.r,background:C.rD,padding:"1px 4px",borderRadius:4}}>❌</span>}</td>)}
      </tr>)}
      <tr style={{fontWeight:800}}>
       <td style={{padding:"8px 8px",color:C.t}}>MRR Théorique</td>
       <td style={{padding:"8px 4px",textAlign:"right",color:C.acc}}>{fmt(mrrTheorique)}€</td>
       {mrrMonths.map(mo=>{const real=mrrData.filter(d=>d.payments[mo]).reduce((a,d)=>a+d.billing,0);return <td key={mo} style={{padding:"8px 4px",textAlign:"center",color:real>=mrrTheorique?C.g:C.r,fontSize:10}}>{fmt(real)}€</td>;})}
      </tr>
     </tbody>
    </table>
   </div>
  </div>}
 </div>;
}
/* SYNERGIES MAP */

export function ReplayMensuel({soc,reps,allM,socBank,clients,ghlData}){
 const[open,setOpen]=useState(false);
 const[slide,setSlide]=useState(0);
 const[confetti,setConfetti]=useState(false);
 const timerRef=useRef(null);
 const cm=curM();const pm=prevM(cm);
 const r=gr(reps,soc?.id,cm);const rp=gr(reps,soc?.id,pm);
 const ca=pf(r?.ca);const prevCa=pf(rp?.ca);const ch=pf(r?.charges);const marge=ca-ch;
 const myCl=(clients||[]).filter(c=>c.socId===soc?.id);
 const activeCl=myCl.filter(c=>c.status==="active");
 const mrr=activeCl.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 const growth=prevCa>0?Math.round((ca-prevCa)/prevCa*100):0;
 const topClient=activeCl.map(c=>({name:c.name,rev:clientMonthlyRevenue(c)})).sort((a,b)=>b.rev-a.rev)[0];
 const gd=ghlData?.[soc?.id];const leads=pf(r?.leads)||(gd?.ghlClients||[]).length;
 // Score calculation
 const goalPct=soc?.obj?Math.min(100,Math.round(ca/soc.obj*100)):50;
 const margePct=ca>0?Math.round(marge/ca*100):0;
 const score=Math.min(100,Math.round(goalPct*0.4+Math.min(100,margePct*2)*0.3+(growth>0?Math.min(100,growth*2):0)*0.3));
 // Records
 const records=useMemo(()=>{
  const recs=[];const allCas=allM.slice(0,-1).map(m=>pf(gr(reps,soc?.id,m)?.ca));const maxPrev=Math.max(0,...allCas);
  if(ca>maxPrev&&maxPrev>0)recs.push(`🏆 Record CA: ${fmt(ca)}€ (ancien: ${fmt(maxPrev)}€)`);
  if(activeCl.length>0){const prevClCounts=allM.slice(0,-1).map(m=>(clients||[]).filter(c=>c.socId===soc?.id&&c.status==="active").length);const maxCl=Math.max(0,...prevClCounts);if(activeCl.length>maxCl&&maxCl>0)recs.push(`👥 Record clients: ${activeCl.length}`);}
  if(mrr>0)recs.push(`💰 MRR record: ${fmt(mrr)}€/mois`);
  return recs;
 },[ca,activeCl,mrr,allM,reps,soc,clients]);
 const proj=project(reps,soc?.id,allM);
 const slides=[
  {title:"📊 Ton mois en chiffres",bg:"linear-gradient(135deg,#1a1a4e,#0a0a2e)",render:()=><div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginTop:20}}>{[{l:"CA",v:fmt(ca)+"€",c:C.g},{l:"Charges",v:fmt(ch)+"€",c:C.r},{l:"Leads",v:String(leads),c:C.b},{l:"Clients",v:String(activeCl.length),c:C.acc}].map((k,i)=><div key={i} style={{textAlign:"center",animation:`celebIn .5s ease ${i*0.1}s both`}}><div style={{fontSize:36,fontWeight:900,color:k.c,fontFamily:FONT_TITLE}}>{k.v}</div><div style={{fontSize:12,color:C.td,marginTop:4}}>{k.l}</div></div>)}</div>},
  {title:"🏆 Ton meilleur client",bg:"linear-gradient(135deg,#2d1a00,#1a0a00)",render:()=><div style={{textAlign:"center",marginTop:30}}>{topClient?<><div style={{fontSize:48,marginBottom:10,animation:"celebIn .5s ease both"}}>🏆</div><div style={{fontSize:24,fontWeight:900,color:C.acc}}>{topClient.name}</div><div style={{fontSize:18,color:C.g,fontWeight:700,marginTop:8}}>{fmt(topClient.rev)}€/mois</div><div style={{marginTop:12,display:"inline-block",padding:"4px 14px",borderRadius:20,background:C.accD,color:C.acc,fontSize:11,fontWeight:700}}>⭐ MVP du mois</div></>:<div style={{color:C.td,fontSize:14}}>Pas encore de client ce mois</div>}</div>},
  {title:"📈 Ta croissance",bg:"linear-gradient(135deg,#001a2d,#000a1a)",render:()=><div style={{textAlign:"center",marginTop:30}}><div style={{fontSize:56,fontWeight:900,color:growth>=0?C.g:C.r,animation:"celebIn .5s ease both"}}>{growth>=0?"+":""}{growth}%</div><div style={{fontSize:13,color:C.td,marginTop:8}}>vs {ml(pm)}</div><div style={{marginTop:16,display:"flex",justifyContent:"center",gap:20}}><div><div style={{fontSize:14,fontWeight:700,color:C.td}}>Avant</div><div style={{fontSize:20,fontWeight:800,color:C.t}}>{fmt(prevCa)}€</div></div><div style={{fontSize:24,color:C.td}}>→</div><div><div style={{fontSize:14,fontWeight:700,color:C.td}}>Maintenant</div><div style={{fontSize:20,fontWeight:800,color:C.g}}>{fmt(ca)}€</div></div></div></div>},
  {title:"🔥 Tes records battus",bg:"linear-gradient(135deg,#2d0a00,#1a0500)",render:()=><div style={{marginTop:20}}>{records.length>0?records.map((r2,i)=><div key={i} style={{padding:"14px 18px",background:"rgba(255,255,255,.05)",borderRadius:12,marginBottom:10,fontSize:14,color:C.t,animation:`slideInRight .3s ease ${i*0.1}s both`}}>{r2}</div>):<div style={{textAlign:"center",color:C.td,fontSize:14,marginTop:30}}>Continue comme ça, les records arrivent ! 💪</div>}</div>},
  {title:"⭐ Score du mois",bg:"linear-gradient(135deg,#1a0a2d,#0a051a)",render:()=>{
   if(score>80&&!confetti)setConfetti(true);
   return <div style={{textAlign:"center",marginTop:20}}><svg width="160" height="160" viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="none" stroke={C.brd} strokeWidth="8"/><circle cx="80" cy="80" r="70" fill="none" stroke={score>=80?C.g:score>=50?C.acc:C.r} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${score/100*440} 440`} transform="rotate(-90 80 80)" style={{transition:"stroke-dasharray 1.5s ease"}}/><text x="80" y="75" textAnchor="middle" fill={C.t} fontSize="36" fontWeight="900" fontFamily={FONT_TITLE}>{score}</text><text x="80" y="95" textAnchor="middle" fill={C.td} fontSize="11">/100</text></svg><div style={{marginTop:12,fontSize:14,color:score>=80?C.g:score>=50?C.acc:C.r,fontWeight:700}}>{score>=80?"🔥 Exceptionnel !":score>=60?"👍 Bon mois !":score>=40?"📊 Peut mieux faire":"⚠️ Mois difficile"}</div></div>;
  }},
  {title:"🚀 Objectif prochain mois",bg:"linear-gradient(135deg,#0a1a0a,#051a05)",render:()=><div style={{textAlign:"center",marginTop:30}}>{proj?<><div style={{fontSize:32,fontWeight:900,color:C.acc,animation:"celebIn .5s ease both"}}>{fmt(proj[0])}€</div><div style={{fontSize:12,color:C.td,marginTop:6}}>Projection {ml(nextM(cm))}</div><div style={{marginTop:20,padding:"12px 20px",background:"rgba(255,170,0,.08)",borderRadius:12,display:"inline-block"}}><div style={{fontSize:11,color:C.acc,fontWeight:700}}>🎯 Si tu maintiens le rythme :</div><div style={{fontSize:11,color:C.td,marginTop:4}}>T+2: {fmt(proj[1])}€ · T+3: {fmt(proj[2])}€</div></div></>:<div style={{color:C.td}}>Pas assez de données pour projeter</div>}</div>}
 ];
 const TOTAL=slides.length;
 useEffect(()=>{if(!open)return;timerRef.current=setInterval(()=>setSlide(p=>(p+1)%TOTAL),3000);return()=>clearInterval(timerRef.current);},[open]);
 const copyShare=()=>{const txt=`📊 Replay ${soc?.nom} — ${ml(cm)}\nCA: ${fmt(ca)}€ | Marge: ${fmt(marge)}€ (${margePct}%)\nClients: ${activeCl.length} | MRR: ${fmt(mrr)}€\nCroissance: ${growth>=0?"+":""}${growth}%\nScore: ${score}/100`;navigator.clipboard?.writeText(txt);};
 if(!open)return <button onClick={()=>{setOpen(true);setSlide(0);setConfetti(false);}} style={{padding:"8px 16px",borderRadius:10,border:`1px solid ${C.acc}44`,background:C.accD,color:C.acc,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:6}}>🎬 Replay du mois</button>;
 return <div style={{position:"fixed",inset:0,zIndex:9999,background:"#06060b",fontFamily:FONT,display:"flex",flexDirection:"column",animation:"fi .3s ease"}}>
  {confetti&&<div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:10}}>{Array.from({length:40}).map((_,i)=><div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:-20,width:8,height:8,borderRadius:i%2?4:0,background:["#FFAA00","#34d399","#f87171","#60a5fa","#a78bfa","#fb923c"][i%6],animation:`confetti ${2+Math.random()*2}s ease ${Math.random()}s both`}}/>)}</div>}
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 24px"}}>
   <div style={{display:"flex",gap:6}}>{slides.map((_,i)=><div key={i} onClick={()=>{clearInterval(timerRef.current);setSlide(i);}} style={{width:i===slide?24:8,height:8,borderRadius:4,background:i===slide?C.acc:C.brd,cursor:"pointer",transition:"all .3s"}}/>)}</div>
   <div style={{display:"flex",gap:8}}>
    <button onClick={copyShare} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:"transparent",color:C.t,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>📋 Partager</button>
    <button onClick={()=>setOpen(false)} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:"transparent",color:C.t,fontSize:11,cursor:"pointer",fontFamily:FONT}}>✕ Fermer</button>
   </div>
  </div>
  <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
   <div key={slide} style={{width:"100%",maxWidth:500,padding:40,borderRadius:24,background:slides[slide].bg,border:"1px solid rgba(255,255,255,.08)",backdropFilter:"blur(20px)",animation:"celebIn .4s ease both"}}>
    <div style={{textAlign:"center",fontSize:22,fontWeight:800,color:C.t,marginBottom:8,fontFamily:FONT_TITLE}}>{slides[slide].title}</div>
    {slides[slide].render()}
   </div>
  </div>
  <div style={{display:"flex",justifyContent:"center",gap:12,padding:"16px 24px"}}>
   <button onClick={()=>{clearInterval(timerRef.current);setSlide(p=>Math.max(0,p-1));}} disabled={slide===0} style={{padding:"8px 20px",borderRadius:10,border:`1px solid ${C.brd}`,background:"transparent",color:slide===0?C.tm:C.t,fontSize:12,cursor:slide===0?"default":"pointer",fontFamily:FONT}}>← Précédent</button>
   <button onClick={()=>{clearInterval(timerRef.current);setSlide(p=>Math.min(TOTAL-1,p+1));}} disabled={slide===TOTAL-1} style={{padding:"8px 20px",borderRadius:10,border:`1px solid ${C.acc}44`,background:C.accD,color:C.acc,fontSize:12,cursor:slide===TOTAL-1?"default":"pointer",fontFamily:FONT}}>Suivant →</button>
  </div>
 </div>;
}

/* ============ PREDICTIONS & SCORING ============ */
