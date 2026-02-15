import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import {
  BF, BILL_TYPES, C, CLIENT_STATUS, CSS, CURR_SYMBOLS, DEAL_STAGES, EXCLUDED_ACCOUNTS, ErrorBoundary, FONT, FONT_TITLE, isExcludedTx,
  GHL_STAGES_COLORS, INV_STATUS, KB_CATS, MILESTONE_CATS, MN, MOODS, SLACK_MODES, SUB_CATS, SYN_STATUS, SYN_TYPES, gr,
  TIER_BG, TIER_COLORS, ago, autoDetectSubscriptions, buildAIContext, buildPulseSlackMsg, buildReportSlackMsg, buildValidationSlackMsg,
  calcH, calcMilestones, clamp, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, curM, curW,
  deadline, fK, fetchGHL, fmt, generateInvoices, getAlerts, getStripeChargesForClient, getStripeTotal, getTheme, ghlCreateContact,
  ghlCreateInvoice, ghlSendInvoice, ghlUpdateContact, healthScore, matchSubsToRevolut, ml, nextM, normalizeStr, pct,
  pf, prevM, project, revFinancials, runway, sSet, sbUpsert, simH, sinceLbl, sinceMonths, slackSend, subMonthly, teamMonthly,
  uid, autoCategorize, ErrorCard, OfflineBanner, cacheGet,
} from "../shared.jsx";

import { TX_CATEGORIES } from "../shared.jsx";
// Minimal UI components to avoid circular import with components.jsx
const KPI=({label,value,sub,accent,small,icon})=>{const C2=C;return <div className="glass-card-static" style={{padding:small?"10px 12px":"14px 16px",textAlign:"center"}}>{icon&&<div style={{fontSize:16,marginBottom:4}}>{icon}</div>}<div style={{color:C2.td,fontSize:small?7:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4,fontFamily:FONT_TITLE}}>{label}</div><div style={{fontSize:small?16:20,fontWeight:900,color:accent||C2.t,lineHeight:1}}>{value}</div>{sub&&<div style={{marginTop:4,fontSize:9,fontWeight:600,color:C2.td}}>{sub}</div>}</div>;};
const Btn=({children,onClick,v="primary",small,style:sx,disabled})=>{const bg=v==="primary"?"linear-gradient(135deg,#FFBF00,#FF9D00)":v==="danger"?"linear-gradient(135deg,#f87171,#ef4444)":v==="success"?"linear-gradient(135deg,#34d399,#10b981)":v==="secondary"?C.card2:"transparent";const tc=v==="ghost"?C.td:(v==="primary"||v==="danger"||v==="success")?"#0a0a0f":C.t;return <button onClick={onClick} disabled={disabled} style={{background:bg,color:tc,border:v==="ghost"?`1px solid ${C.brd}`:"none",borderRadius:small?6:10,padding:small?"5px 10px":"10px 20px",fontWeight:700,fontSize:small?10:12,cursor:disabled?"not-allowed":"pointer",fontFamily:FONT,opacity:disabled?.5:1,transition:"all .15s",...sx}}>{children}</button>;};
const Sect=({children,title,sub,right})=><div className="fu" style={{marginTop:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8,flexWrap:"wrap",gap:4}}><div>{title&&<h2 style={{color:C.t,fontSize:13,fontWeight:800,margin:0,letterSpacing:1,textTransform:"uppercase",fontFamily:FONT_TITLE}}>{title}</h2>}{sub&&<p style={{color:C.td,fontSize:10,margin:"1px 0 0"}}>{sub}</p>}</div>{right}</div>{children}</div>;
const Card=({children,style:sx,onClick,accent,delay=0})=><div className={`fu d${Math.min(delay,8)} ${onClick?"glass-card":"glass-card-static"}`} onClick={onClick} style={{padding:14,cursor:onClick?"pointer":"default",...(accent?{borderLeft:`3px solid ${accent}`}:{}),...sx}}>{children}</div>;

export function categorizeTransaction(tx){
 const leg=tx.legs?.[0];if(!leg)return{id:"autres",label:"📦 Autres dépenses",icon:"📦"};
 const amt=leg.amount;const ref=((leg.description||"")+" "+(tx.reference||"")).toLowerCase();
 const legDesc=((tx.legs?.[0]?.description||"")+"").toLowerCase();
 const hasCounterparty=!!tx.legs?.[0]?.counterparty;const isSingleLeg=(tx.legs||[]).length===1;
 const isRealDividend=(/dividend/i.test(tx.reference||"")&&hasCounterparty&&isSingleLeg)||(/scale\s*corp/i.test(legDesc)&&hasCounterparty&&isSingleLeg)||(/scale\s*corp/i.test(ref));
 const findCat=(id)=>TX_CATEGORIES.find(c=>c.id===id)||{id,label:id,icon:"📦"};
 if(isRealDividend)return findCat("dividendes");
 // Internal pocket transfers (not real expenses) — treat as internal transfers
 if(tx.type==="transfer"&&/to eur (sol|publicit|prestataire|abonnement|anthony|jimmy|principal)/i.test(ref))return findCat("transfert");
 if(tx.type==="transfer"&&/echange to eur|exchange to eur/i.test(ref))return findCat("transfert");
 if(amt>0)return findCat("revenus");
 if(/loyer|rent/.test(ref))return findCat("loyer");
 if(/facebook|google ads|meta ads|meta|tiktok|pub/.test(ref))return findCat("pub");
 if(/lecosysteme|l.{0,2}ecosyst[eè]me/i.test(ref))return findCat("abonnements");
 if(/company.*pro.*plan|plan.*fee/i.test(ref))return findCat("abonnements");
 if(/stripe|notion|slack|ghl|zapier|skool|adobe|figma|revolut|gohighlevel|highlevel|canva|chatgpt|openai|anthropic|vercel|github|zoom|brevo|make\.com|clickup|airtable/.test(ref))return findCat("abonnements");
 if(/lucien|salaire|salary|freelance|prestataire|prestation/.test(ref))return findCat("equipe");
 if(/fynovates|fiscalit|tax|tva|impot|imposition|urssaf|cfe|cotisation/i.test(ref))return findCat("fiscalite");
 if(tx.type==="transfer")return findCat("transfert");
 return findCat("autres");
}
export function BankingPanel({revData,onSync,compact,clients:allClients2=[]}){
 const cachedRev=(!revData||!revData.accounts)?cacheGet("rev_eco"):null;
 const isOffline=!revData&&!!cachedRev;
 const effectiveData=revData||(cachedRev?.accounts?cachedRev:null);
 if(!effectiveData||!effectiveData.accounts){
  return <ErrorCard source="Revolut" onRetry={onSync} compact={compact}/>;
 }
 const revDataFinal=effectiveData;
 const{accounts,transactions,totalEUR,lastSync,isDemo}=revDataFinal;
 const inflow=transactions.filter(t=>t.legs?.[0]?.amount>0).reduce((s,t)=>s+t.legs?.[0]?.amount||0,0);
 const outflow=Math.abs(transactions.filter(t=>t.legs?.[0]?.amount<0).reduce((s,t)=>s+t.legs?.[0]?.amount||0,0));
 const cs=v=>CURR_SYMBOLS[v]||v;
 if(compact)return <Card style={{padding:12}} accent={C.g}>{isOffline&&<OfflineBanner/>}
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
   <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:14}}>🏦</span><span style={{fontWeight:700,fontSize:11,color:C.td}}>REVOLUT</span>{isDemo&&<span style={{fontSize:8,color:C.o,background:C.oD,padding:"1px 5px",borderRadius:6}}>DEMO</span>}</div>
   <span style={{fontSize:9,color:C.tm}}>{ago(lastSync)}</span>
  </div>
  <div style={{fontWeight:900,fontSize:20,color:C.g}}>{fmt(totalEUR)}€</div>
  <div style={{display:"flex",gap:8,marginTop:6}}>{accounts.slice(0,3).map(a=><div key={a.id} style={{fontSize:10,color:C.td}}>{a.name}: <strong style={{color:C.t}}>{fmt(a.balance)}{cs(a.currency)}</strong></div>)}</div>
 </Card>;
 return <>
  {isOffline&&<OfflineBanner/>}
  {isDemo&&<div className="fu" style={{background:C.oD,border:`1px solid ${C.o}22`,borderRadius:10,padding:"8px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{color:C.o,fontSize:11,fontWeight:600}}>⚠ Données demo — Ajoute ton token Revolut dans Paramètres Holding</span><Btn small v="secondary" onClick={onSync}>↻ Sync</Btn></div>}
  <div className="fu" style={{background:`linear-gradient(135deg,${C.card},${C.card2})`,border:`1px solid ${C.brd}`,borderRadius:14,padding:20,marginBottom:14,textAlign:"center"}}>
   <div style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:4}}>SOLDE TOTAL</div>
   <div style={{fontWeight:900,fontSize:34,color:C.g,lineHeight:1}}>{fmt(totalEUR)}€</div>
   <div style={{color:C.td,fontSize:11,marginTop:4}}>Dernière sync: {ago(lastSync)}</div>
   {!isDemo&&<Btn small v="secondary" onClick={onSync} style={{marginTop:8}}>↻ Actualiser</Btn>}
  </div>
  <Sect title="Comptes" sub={`${accounts.length} comptes`}>
   {accounts.map((a,i)=><div key={a.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:C.card,borderRadius:10,border:`1px solid ${C.brd}`,marginBottom:4}}>
    <div style={{width:36,height:36,borderRadius:9,background:a.state==="active"?C.gD:C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏦</div>
    <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{a.name}</div><div style={{color:C.td,fontSize:10}}>{a.currency} · {a.state==="active"?"Actif":"Inactif"}</div></div>
    <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:18,color:a.balance>=0?C.g:C.r}}>{fmt(a.balance)} {cs(a.currency)}</div></div>
   </div>)}
  </Sect>
  <div style={{display:"flex",gap:10,marginTop:4}}>
   <KPI label="Entrées (30j)" value={`+${fmt(inflow)}€`} accent={C.g} delay={1}/>
   <KPI label="Sorties (30j)" value={`-${fmt(outflow)}€`} accent={C.r} delay={2}/>
   <KPI label="Net" value={`${fmt(inflow-outflow)}€`} accent={inflow-outflow>=0?C.g:C.r} delay={3}/>
  </div>
  <BankingTransactions transactions={transactions} cs={cs} allClients2={allClients2}/>
 </>;
}
export function BankingTransactions({transactions,cs,allClients2=[]}){
 const[catFilter,setCatFilter]=useState("all");
 const[typeFilter,setTypeFilter]=useState("all");
 const[periodFilter,setPeriodFilter]=useState("all");
 const[sortBy,setSortBy]=useState("recent");
 const[search,setSearch]=useState("");
 const filtered=useMemo(()=>{
  const now=new Date();let txs=[...transactions];
  // period
  if(periodFilter==="month"){const s=new Date(now.getFullYear(),now.getMonth(),1);txs=txs.filter(t=>new Date(t.created_at)>=s);}
  else if(periodFilter==="lastmonth"){const s=new Date(now.getFullYear(),now.getMonth()-1,1);const e=new Date(now.getFullYear(),now.getMonth(),1);txs=txs.filter(t=>{const d=new Date(t.created_at);return d>=s&&d<e;});}
  else if(periodFilter==="3months"){const s=new Date(now.getFullYear(),now.getMonth()-2,1);txs=txs.filter(t=>new Date(t.created_at)>=s);}
  // type
  if(typeFilter==="in")txs=txs.filter(t=>t.legs?.[0]?.amount>0);
  else if(typeFilter==="out")txs=txs.filter(t=>t.legs?.[0]?.amount<0);
  // category
  if(catFilter!=="all")txs=txs.filter(t=>categorizeTransaction(t).id===catFilter);
  // search
  if(search.trim()){const q=search.toLowerCase();txs=txs.filter(t=>{const ref=((t.legs?.[0]?.description||"")+" "+(t.reference||"")+" "+(t.merchant?.name||"")).toLowerCase();return ref.includes(q);});}
  // sort
  if(sortBy==="oldest")txs.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  else if(sortBy==="recent")txs.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  else if(sortBy==="amountUp")txs.sort((a,b)=>(a.legs?.[0]?.amount||0)-(b.legs?.[0]?.amount||0));
  else if(sortBy==="amountDown")txs.sort((a,b)=>(b.legs?.[0]?.amount||0)-(a.legs?.[0]?.amount||0));
  return txs;
 },[transactions,catFilter,typeFilter,periodFilter,sortBy,search]);
 const totals=useMemo(()=>{
  let inp=0,out=0,div=0;filtered.forEach(t=>{const a=t.legs?.[0]?.amount||0;if(a>0)inp+=a;else{out+=Math.abs(a);if(categorizeTransaction(t).id==="dividendes")div+=Math.abs(a);}});
  return{inp:Math.round(inp),out:Math.round(out),net:Math.round(inp-out),count:filtered.length,div:Math.round(div)};
 },[filtered]);
 const selS={background:C.bg,border:`1px solid ${C.brd}`,borderRadius:6,color:C.t,padding:"4px 6px",fontSize:10,fontFamily:FONT,outline:"none"};
 return <>
  <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center",marginTop:10,marginBottom:6}}>
   <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={selS}>{TX_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>
   <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={selS}><option value="all">Toutes</option><option value="in">Entrées</option><option value="out">Sorties</option></select>
   <select value={periodFilter} onChange={e=>setPeriodFilter(e.target.value)} style={selS}><option value="all">Tout</option><option value="month">Ce mois</option><option value="lastmonth">Mois dernier</option><option value="3months">3 derniers mois</option></select>
   <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selS}><option value="recent">Plus récent</option><option value="oldest">Plus ancien</option><option value="amountDown">Montant ↓</option><option value="amountUp">Montant ↑</option></select>
   <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{...selS,flex:"1 1 100px",minWidth:80}}/>
  </div>
  <div style={{display:"flex",gap:6,marginBottom:8}}>
   <div style={{flex:1,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:C.td,fontWeight:700}}>ENTRÉES</div><div style={{fontWeight:800,fontSize:12,color:C.g}}>+{fmt(totals.inp)}€</div></div>
   <div style={{flex:1,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:C.td,fontWeight:700}}>SORTIES</div><div style={{fontWeight:800,fontSize:12,color:C.r}}>-{fmt(totals.out)}€</div></div>
   <div style={{flex:1,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:C.td,fontWeight:700}}>NET</div><div style={{fontWeight:800,fontSize:12,color:totals.net>=0?C.g:C.r}}>{fmt(totals.net)}€</div></div>
   <div style={{flex:1,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:C.td,fontWeight:700}}>TX</div><div style={{fontWeight:800,fontSize:12,color:C.t}}>{totals.count}</div></div>
  </div>
  {totals.div>0&&<div style={{background:"#7c3aed11",border:"1px solid #7c3aed33",borderRadius:8,padding:"6px 10px",marginBottom:8,display:"flex",alignItems:"center",gap:6,fontSize:11}}><span style={{fontSize:13}}>🏛️</span><span style={{color:"#7c3aed",fontWeight:700}}>Total dividendes holding : {fmt(totals.div)}€</span><span style={{color:C.td,fontSize:10}}>(non comptés dans les charges opérationnelles)</span></div>}
  <Sect title="Transactions" sub={`${totals.count} résultats`}>
   {filtered.map((tx,i)=>{
    const leg=tx.legs?.[0];if(!leg)return null;
    const isIn=leg.amount>0;const desc=leg.description||tx.reference||tx.merchant?.name||"Transaction";
    const cat=categorizeTransaction(tx);const isDiv=cat.id==="dividendes";
    const catColors={"revenus":C.g,"loyer":"#f59e0b","pub":"#ec4899","abonnements":C.b,"equipe":C.o,"transfert":"#6366f1","dividendes":"#7c3aed","autres":C.td};
    return <div key={tx.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:isDiv?"#7c3aed11":C.card,borderRadius:8,border:`1px solid ${isDiv?"#7c3aed33":C.brd}`,marginBottom:2}}>
    <div style={{width:26,height:26,borderRadius:7,background:isIn?C.gD:isDiv?"#7c3aed22":C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:isIn?C.g:isDiv?"#7c3aed":C.r,flexShrink:0}}>{cat.icon||"↑"}</div>
    <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{desc}</span><span style={{fontSize:9,padding:"1px 6px",borderRadius:8,background:(catColors[cat.id]||C.td)+"22",color:catColors[cat.id]||C.td,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>{cat.label}</span></div><div style={{fontSize:10,color:C.td}}>{new Date(tx.created_at).toLocaleDateString("fr-FR")} · {tx.type==="card_payment"?"Carte":"Virement"}</div></div>
    <span style={{fontWeight:800,fontSize:13,color:isIn?C.g:isDiv?"#7c3aed":C.r,whiteSpace:"nowrap"}}>{isIn?"+":""}{fmt(leg.amount)} {cs(leg.currency)}</span>
    {(()=>{const d2=(desc||"").toLowerCase();const match=allClients2.find(c=>{const n=(c.name||"").toLowerCase().trim();if(n.length<3)return false;if(d2.includes(n))return true;const pts=n.split(/\s+/).filter(p=>p.length>2);return pts.length>=2&&pts.every(p=>d2.includes(p));});return match?<span style={{fontSize:7,padding:"1px 5px",borderRadius:6,background:"#60a5fa22",color:"#60a5fa",fontWeight:700,marginLeft:4,flexShrink:0,whiteSpace:"nowrap"}}>👤 {match.name}</span>:null;})()}
    </div>;
   })}
   {filtered.length===0&&<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucune transaction trouvée</div>}
  </Sect>
 </>;
}
/* GHL CRM TAB */
/* PER-SOCIÉTÉ BANKING WIDGET — REDESIGNED */
export function SocBankWidget({bankData,onSync,soc}){
 const[txFilter,setTxFilter]=useState("all");
 const[searchTx,setSearchTx]=useState("");
 const[advancedMode,setAdvancedMode]=useState(false);
 const[selectedMonth,setSelectedMonth]=useState(curM());
 const[txCatOverrides,setTxCatOverrides]=useState(()=>{try{return JSON.parse(localStorage.getItem(`scTxCat_${soc?.id}`)||"{}");}catch{return{};}});
 const[catDropdown,setCatDropdown]=useState(null);
 const[catDropPos,setCatDropPos]=useState(null);
 const[selectedTx,setSelectedTx]=useState(new Set());
 const saveCatOverride=(txId,catId)=>{const next={...txCatOverrides,[txId]:catId};setTxCatOverrides(next);try{localStorage.setItem(`scTxCat_${soc?.id}`,JSON.stringify(next));}catch{}setCatDropdown(null);};
 const getCat=(tx)=>txCatOverrides[tx.id]?TX_CATEGORIES.find(c=>c.id===txCatOverrides[tx.id])||categorizeTransaction(tx):categorizeTransaction(tx);
 if(!bankData)return <Card style={{textAlign:"center",padding:20}}>
  <div style={{fontSize:28,marginBottom:6}}>🏦</div>
  <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>Revolut Business</div>
  <div style={{color:C.td,fontSize:11,marginBottom:10}}>Connecte ton compte Revolut</div>
  <Btn small onClick={onSync}>Charger données demo</Btn>
 </Card>;
 const{accounts:allAccounts,transactions:allTransactions,balance,monthly,lastSync,isDemo}=bankData;
 const excl=EXCLUDED_ACCOUNTS[soc?.id]||[];
 const transactions=allTransactions.filter(t=>!isExcludedTx(t,excl));
 const cm=curM();
 // Available months from transactions
 const availableMonths=useMemo(()=>{
  const months=new Set();
  if(monthly)Object.keys(monthly).forEach(m=>months.add(m));
  transactions.forEach(t=>{if(t.created_at){const d=new Date(t.created_at);months.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}});
  months.add(cm);
  return[...months].sort().reverse();
 },[monthly,transactions,cm]);
 const selM=selectedMonth;
 const prevSelM=prevM(selM);
 const selData=monthly?.[selM];const prevSelData=monthly?.[prevSelM];
 const monthTx=transactions.filter(tx=>{const leg=tx.legs?.[0];if(!leg)return false;return(tx.created_at||"").startsWith(selM);});
 const entriesMois=selData?.income||monthTx.filter(t=>(t.legs?.[0]?.amount||0)>0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0);
 const sortiesMois=selData?.expense||Math.abs(monthTx.filter(t=>(t.legs?.[0]?.amount||0)<0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0));
 const isCurrentMonth=selM===cm;
 // Filter logic
 let filteredTx=txFilter==="in"?monthTx.filter(tx=>(tx.legs?.[0]?.amount||0)>0):txFilter==="out"?monthTx.filter(tx=>(tx.legs?.[0]?.amount||0)<0):monthTx;
 if(searchTx.trim()){const q=searchTx.toLowerCase();filteredTx=filteredTx.filter(tx=>{const leg=tx.legs?.[0];const desc=(leg?.description||tx.reference||"").toLowerCase();return desc.includes(q);});}
 if(advancedMode&&txFilter!=="all"&&txFilter!=="in"&&txFilter!=="out"){filteredTx=filteredTx.filter(tx=>getCat(tx).id===txFilter);}
 const catColors={"revenus":C.g,"loyer":"#f59e0b","pub":"#ec4899","abonnements":C.b,"equipe":C.o,"transfert":"#6366f1","dividendes":"#7c3aed","autres":C.td};
 const catIconMap={"revenus":"💰","loyer":"🏠","pub":"📢","abonnements":"💻","equipe":"👤","transfert":"📤","dividendes":"🏛️","autres":"📦"};
 const selS2={background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.t,padding:"6px 10px",fontSize:11,fontFamily:FONT,outline:"none",cursor:"pointer"};
 return <>
  {isDemo&&<div className="fu" style={{background:C.oD,border:`1px solid ${C.o}22`,borderRadius:10,padding:"6px 12px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{color:C.o,fontSize:10,fontWeight:600}}>⚠ Demo — Ajoute le token Revolut via l'admin</span><Btn small v="ghost" onClick={onSync} style={{fontSize:9}}>↻</Btn></div>}
  {/* Month selector */}
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
   <div style={{display:"flex",alignItems:"center",gap:6}}>
    <button onClick={()=>{const idx=availableMonths.indexOf(selM);if(idx<availableMonths.length-1)setSelectedMonth(availableMonths[idx+1]);}} style={{background:"none",border:`1px solid ${C.brd}`,borderRadius:8,color:C.td,cursor:"pointer",padding:"6px 10px",fontSize:14,fontFamily:FONT}}>‹</button>
    <select value={selM} onChange={e=>setSelectedMonth(e.target.value)} style={selS2}>
     {availableMonths.map(m=><option key={m} value={m}>{ml(m)}{m===cm?" (actuel)":""}</option>)}
    </select>
    <button onClick={()=>{const idx=availableMonths.indexOf(selM);if(idx>0)setSelectedMonth(availableMonths[idx-1]);}} style={{background:"none",border:`1px solid ${C.brd}`,borderRadius:8,color:C.td,cursor:"pointer",padding:"6px 10px",fontSize:14,fontFamily:FONT}}>›</button>
   </div>
   {!isCurrentMonth&&<button onClick={()=>setSelectedMonth(cm)} style={{background:C.accD,border:`1px solid ${C.acc}33`,borderRadius:8,color:C.acc,cursor:"pointer",padding:"5px 12px",fontSize:10,fontWeight:600,fontFamily:FONT}}>Mois actuel</button>}
   {!isDemo&&isCurrentMonth&&<Btn small v="secondary" onClick={onSync}>↻ Actualiser</Btn>}
  </div>
  {/* Cash flow prediction */}
  {isCurrentMonth&&sortiesMois>0&&<div className="glass-card-static" style={{padding:14,marginBottom:12,borderLeft:`3px solid ${C.b}`}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div>
     <div style={{fontSize:9,fontWeight:700,color:C.b,letterSpacing:.5,fontFamily:FONT_TITLE}}>📊 PRÉVISION CASH FLOW</div>
     <div style={{fontSize:10,color:C.td,marginTop:2}}>Basé sur les abonnements et charges récurrentes</div>
    </div>
    <div style={{textAlign:"right"}}>
     <div style={{fontWeight:900,fontSize:16,color:balance-sortiesMois>=0?C.g:C.r}}>{fmt(Math.round(balance-sortiesMois))}€</div>
     <div style={{fontSize:8,color:C.td}}>Solde estimé fin de mois</div>
    </div>
   </div>
   {balance>0&&sortiesMois>0&&<div style={{display:"flex",gap:10,marginTop:8}}>
    <div style={{fontSize:9,color:C.td}}>Runway: <strong style={{color:Math.floor(balance/sortiesMois)<=2?C.r:C.g}}>{Math.floor(balance/sortiesMois)} mois</strong></div>
    <div style={{fontSize:9,color:C.td}}>Burn rate: <strong style={{color:C.r}}>{fmt(sortiesMois)}€/mois</strong></div>
   </div>}
  </div>}
  {/* 3 KPI cards */}
  <div className="rg3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
   <div className="glass-card-static" style={{padding:20,textAlign:"center"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>SOLDE ACTUEL</div>
    <div style={{fontWeight:900,fontSize:26,color:C.g,lineHeight:1}}>{fmt(balance)}€</div>
    <div style={{color:C.tm,fontSize:9,marginTop:4}}>Sync {ago(lastSync)}</div>
   </div>
   <div className="glass-card-static" style={{padding:20,textAlign:"center"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>ENTRÉES {ml(selM).toUpperCase()}</div>
    <div style={{fontWeight:900,fontSize:26,color:C.g,lineHeight:1}}>+{fmt(entriesMois)}€</div>
    {prevSelData&&<div style={{fontSize:9,fontWeight:600,marginTop:4,color:entriesMois>=(prevSelData.income||0)?C.g:C.r}}>{entriesMois>=(prevSelData.income||0)?"↑":"↓"} {fmt(Math.abs(entriesMois-(prevSelData.income||0)))}€ vs {ml(prevSelM)}</div>}
   </div>
   <div className="glass-card-static" style={{padding:20,textAlign:"center"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>SORTIES {ml(selM).toUpperCase()}</div>
    <div style={{fontWeight:900,fontSize:26,color:C.r,lineHeight:1}}>-{fmt(sortiesMois)}€</div>
    {prevSelData&&<div style={{fontSize:9,fontWeight:600,marginTop:4,color:sortiesMois<=(prevSelData.expense||0)?C.g:C.r}}>{sortiesMois<=(prevSelData.expense||0)?"↓":"↑"} {fmt(Math.abs(sortiesMois-(prevSelData.expense||0)))}€ vs {ml(prevSelM)}</div>}
   </div>
  </div>
  {/* Filter tabs + search + advanced toggle */}
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
   <div style={{display:"flex",gap:4}}>
    {[{id:"all",l:"Tout"},{id:"in",l:"Entrées ↑"},{id:"out",l:"Sorties ↓"}].map(f=><button key={f.id} onClick={()=>setTxFilter(f.id)} style={{padding:"6px 14px",borderRadius:8,fontSize:10,fontWeight:txFilter===f.id?700:500,border:`1px solid ${txFilter===f.id?C.acc:C.brd}`,background:txFilter===f.id?C.accD:"transparent",color:txFilter===f.id?C.acc:C.td,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>{f.l}</button>)}
   </div>
   <div style={{flex:1,minWidth:120,position:"relative"}}>
    <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:C.td}}>🔍</span>
    <input value={searchTx} onChange={e=>setSearchTx(e.target.value)} placeholder="Rechercher..." style={{width:"100%",padding:"7px 10px 7px 30px",borderRadius:8,border:`1px solid ${C.brd}`,background:"var(--sc-input-a6)",color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
   </div>
   <button onClick={()=>setAdvancedMode(!advancedMode)} style={{padding:"6px 12px",borderRadius:8,fontSize:9,fontWeight:600,border:`1px solid ${advancedMode?C.acc:C.brd}`,background:advancedMode?C.accD:"transparent",color:advancedMode?C.acc:C.td,cursor:"pointer",fontFamily:FONT}}>⚙ Mode avancé</button>
  </div>
  {/* Advanced: category pills + select all */}
  {advancedMode&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
   {TX_CATEGORIES.filter(c=>c.id!=="all").map(c=><span key={c.id} onClick={()=>setTxFilter(txFilter===c.id?"all":c.id)} style={{padding:"3px 10px",borderRadius:12,fontSize:9,fontWeight:600,cursor:"pointer",background:txFilter===c.id?(catColors[c.id]||C.acc)+"22":"transparent",color:txFilter===c.id?(catColors[c.id]||C.acc):C.td,border:`1px solid ${txFilter===c.id?(catColors[c.id]||C.acc):C.brd}`,transition:"all .15s"}}>{c.label}</span>)}
   <span onClick={()=>{if(selectedTx.size===filteredTx.length)setSelectedTx(new Set());else setSelectedTx(new Set(filteredTx.map(t=>t.id)));}} style={{padding:"3px 10px",borderRadius:12,fontSize:9,fontWeight:600,cursor:"pointer",color:C.acc,border:`1px solid ${C.acc}`,background:selectedTx.size>0?C.acc+"22":"transparent",marginLeft:"auto"}}>{selectedTx.size>0?"☐ Désélect.":"☑ Tout"}</span>
  </div>}
  {/* Transaction list */}
  <div style={{marginBottom:8}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:8,fontFamily:FONT_TITLE}}>{filteredTx.length} TRANSACTIONS</div>
   {filteredTx.length===0?<div style={{color:C.td,fontSize:11,padding:20,textAlign:"center"}}>Aucune transaction</div>:filteredTx.map((tx,i)=>{const leg=tx.legs?.[0];if(!leg)return null;const isIn=leg.amount>0;const cat=getCat(tx);const isDiv=cat.id==="dividendes";
    return <div key={tx.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:selectedTx.has(tx.id)?C.acc+"08":"transparent",borderRadius:8,borderBottom:`1px solid ${C.brd}08`,marginBottom:1,transition:"background .15s"}}>
    {advancedMode&&<input type="checkbox" checked={selectedTx.has(tx.id)} onChange={()=>setSelectedTx(prev=>{const n=new Set(prev);n.has(tx.id)?n.delete(tx.id):n.add(tx.id);return n;})} style={{width:14,height:14,accentColor:C.acc,cursor:"pointer",flexShrink:0}} />}
    <span style={{width:28,height:28,borderRadius:8,background:isIn?C.gD:isDiv?"#7c3aed15":C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{catIconMap[cat.id]||(isIn?"↑":"↓")}</span>
    <div style={{flex:1,minWidth:0}}>
     <div style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.t}}>{leg.description||tx.reference||"—"}</div>
     <div style={{fontSize:9,color:C.td}}>{new Date(tx.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</div>
    </div>
    <span style={{fontWeight:700,fontSize:12,color:isIn?C.g:C.r,whiteSpace:"nowrap"}}>{isIn?"+":""}{fmt(leg.amount)}€</span>
    </div>;})}
  </div>
  {/* Bulk categorization bar */}
  {advancedMode&&selectedTx.size>0&&<div style={{position:"sticky",bottom:0,background:"var(--sc-card-a9)",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.brd}`,padding:"8px 12px",display:"flex",alignItems:"center",gap:8,borderRadius:"0 0 10px 10px"}}>
    <span style={{fontSize:11,fontWeight:600}}>{selectedTx.size} sélectionnée{selectedTx.size>1?"s":""}</span>
    {TX_CATEGORIES.filter(c=>c.id!=="all").map(c=><button key={c.id} onClick={()=>{selectedTx.forEach(id=>saveCatOverride(id,c.id));setSelectedTx(new Set());}} style={{fontSize:9,padding:"4px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:3}}><span>{c.icon}</span><span>{c.label.replace(/^[^\s]+\s/,"")}</span></button>)}
    <button onClick={()=>setSelectedTx(new Set())} style={{marginLeft:"auto",fontSize:9,color:C.td,background:"none",border:"none",cursor:"pointer",fontFamily:FONT}}>Désélectionner</button>
  </div>}
 </>;
}
/* RAPPORTS PANEL */
