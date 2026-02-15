import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "../utils/index.jsx";
// Destructure commonly used utilities for readability
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;

import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";
import { RiskMatrix, CohortAnalysis } from "../components/features.jsx";

export function UserAccessPanel({socs}){
 const[users,setUsers]=useState([]);const[loading,setLoading]=useState(true);const[showAdd,setShowAdd]=useState(false);
 const[addEmail,setAddEmail]=useState("");const[addName,setAddName]=useState("");const[addPass,setAddPass]=useState("");const[addRole,setAddRole]=useState("porteur");const[addSoc,setAddSoc]=useState("");const[addErr,setAddErr]=useState("");const[addLoading,setAddLoading]=useState(false);
 const[pwModal,setPwModal]=useState(null);const[newPw,setNewPw]=useState("");const[delConfirm,setDelConfirm]=useState(null);
 const loadUsers=useCallback(async()=>{setLoading(true);try{const r=await fetch("/api/auth?action=list_users");const d=await r.json();setUsers(d.users||[]);}catch{}setLoading(false);},[]);
 useEffect(()=>{loadUsers();},[loadUsers]);
 const doAdd=async()=>{if(!addEmail||!addPass){setAddErr("Email et mot de passe requis");return;}setAddLoading(true);setAddErr("");try{const r=await fetch("/api/auth?action=signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:addEmail,password:addPass,name:addName,role:addRole,society_id:addSoc})});const d=await r.json();if(!r.ok){setAddErr(d.msg||d.error||"Erreur");return;}setShowAdd(false);setAddEmail("");setAddName("");setAddPass("");setAddRole("porteur");setAddSoc("");loadUsers();}catch{setAddErr("Erreur réseau");}finally{setAddLoading(false);}};
 const doUpdatePw=async()=>{if(!newPw||!pwModal)return;try{const r=await fetch("/api/auth?action=update_password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:pwModal,password:newPw})});if(r.ok){setPwModal(null);setNewPw("");}}catch{}};
 const doDelete=async(uid2)=>{try{await fetch("/api/auth?action=delete_user",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:uid2})});setDelConfirm(null);loadUsers();}catch{}};
 const socName=(sid)=>{const s=socs.find(x=>x.id===sid);return s?s.nom:sid||"—";};
 return <><Sect title="👥 Gestion des accès" sub="Utilisateurs Supabase Auth" right={<div style={{display:"flex",gap:6}}><Btn small v="secondary" onClick={loadUsers}>↻</Btn><Btn small onClick={()=>setShowAdd(true)}>+ Ajouter un porteur</Btn></div>}>
  {loading&&<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Chargement...</div>}
  {!loading&&users.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucun utilisateur</div></Card>}
  {!loading&&users.map(u=>{const meta=u.user_metadata||{};const isAdmin=meta.role==="admin";return <Card key={u.id} style={{marginBottom:4,padding:"10px 14px"}}>
   <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
    <span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:700,background:isAdmin?"#FFBF0022":"#3b82f622",color:isAdmin?"#FFBF00":"#3b82f6",border:`1px solid ${isAdmin?"#FFBF0033":"#3b82f633"}`}}>{isAdmin?"Admin":"Porteur"}</span>
    <div style={{flex:1,minWidth:100}}>
     <div style={{fontWeight:700,fontSize:12}}>{meta.name||u.email}</div>
     <div style={{fontSize:10,color:C.td}}>{u.email}{meta.society_id?` · ${socName(meta.society_id)}`:""}</div>
    </div>
    <div style={{fontSize:9,color:C.td}}>{u.last_sign_in_at?`Vu ${new Date(u.last_sign_in_at).toLocaleDateString("fr-FR")}`:""}</div>
    <button onClick={()=>{setPwModal(u.id);setNewPw("");}} style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${C.brd}`,background:C.card,color:C.td,fontSize:9,cursor:"pointer",fontFamily:FONT}}>🔑 MDP</button>
    <button onClick={()=>setDelConfirm(u.id)} style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${C.r}33`,background:C.rD,color:C.r,fontSize:9,cursor:"pointer",fontFamily:FONT}}>✕</button>
   </div>
  </Card>;})}
 </Sect>
 <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Ajouter un utilisateur">
  <Inp label="Email" value={addEmail} onChange={setAddEmail} placeholder="porteur@email.com"/>
  <Inp label="Nom" value={addName} onChange={setAddName} placeholder="Prénom Nom"/>
  <Inp label="Mot de passe" value={addPass} onChange={setAddPass} type="password" placeholder="Min. 6 caractères"/>
  <Sel label="Rôle" value={addRole} onChange={setAddRole} options={[{v:"porteur",l:"Porteur"},{v:"admin",l:"Admin"}]}/>
  {addRole==="porteur"&&<Sel label="Société" value={addSoc} onChange={setAddSoc} options={[{v:"",l:"— Sélectionner —"},...socs.map(s=>({v:s.id,l:s.nom}))]}/>}
  {addErr&&<div style={{color:C.r,fontSize:11,marginTop:4}}>⚠ {addErr}</div>}
  <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={doAdd} disabled={addLoading}>{addLoading?"Création...":"Créer"}</Btn><Btn v="secondary" onClick={()=>setShowAdd(false)}>Annuler</Btn></div>
 </Modal>
 <Modal open={!!pwModal} onClose={()=>setPwModal(null)} title="Modifier le mot de passe">
  <Inp label="Nouveau mot de passe" value={newPw} onChange={setNewPw} type="password" placeholder="Min. 6 caractères"/>
  <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={doUpdatePw}>Sauver</Btn><Btn v="secondary" onClick={()=>setPwModal(null)}>Annuler</Btn></div>
 </Modal>
 <Modal open={!!delConfirm} onClose={()=>setDelConfirm(null)} title="Confirmer la suppression">
  <p style={{color:C.td,fontSize:12}}>Supprimer définitivement cet utilisateur ?</p>
  <div style={{display:"flex",gap:8,marginTop:12}}><Btn v="danger" onClick={()=>doDelete(delConfirm)}>Supprimer</Btn><Btn v="secondary" onClick={()=>setDelConfirm(null)}>Annuler</Btn></div>
 </Modal>
 </>;
}
/* ANALYTIQUE TAB */
export function AnalytiqueTab({socs,reps,allM}){
 const cM2=curM();const actS=socs.filter(s=>s.stat==="active");
 const[cmpIds,setCmpIds]=useState(actS.slice(0,3).map(s=>s.id));const cmpSocs=socs.filter(s=>cmpIds.includes(s.id));
 return <><Sect title="Comparaison" right={<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{actS.map(s=><button key={s.id} onClick={()=>setCmpIds(prev=>prev.includes(s.id)?prev.filter(x=>x!==s.id):[...prev,s.id])} style={{padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:600,border:`1px solid ${cmpIds.includes(s.id)?s.color:C.brd}`,background:cmpIds.includes(s.id)?s.color+"22":"transparent",color:cmpIds.includes(s.id)?s.color:C.td,cursor:"pointer",fontFamily:FONT}}>{s.nom}</button>)}</div>}>
  {cmpSocs.length>=2&&<><div className="fu d1" style={{height:200,background:C.card,borderRadius:12,border:`1px solid ${C.brd}`,padding:"14px 6px 6px 0"}}><ResponsiveContainer><BarChart data={allM.slice(-6).map(m=>{const row={mois:ml(m)};cmpSocs.forEach(s=>{row[s.nom]=pf(gr(reps,s.id,m)?.ca);});return row;})}><CartesianGrid strokeDasharray="3 3" stroke={C.brd}/><XAxis dataKey="mois" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/><Tooltip content={<CTip/>}/><Legend wrapperStyle={{fontSize:10}}/>{cmpSocs.map(s=><Bar key={s.id} dataKey={s.nom} fill={s.color} radius={[3,3,0,0]}/>)}</BarChart></ResponsiveContainer></div>
   <div style={{display:"grid",gridTemplateColumns:`repeat(${cmpSocs.length},1fr)`,gap:8,marginTop:12}}>{cmpSocs.map(s=>{const r=gr(reps,s.id,cM2);const ca2=r?pf(r.ca):0,ch2=r?pf(r.charges):0;const hs2=healthScore(s,reps);return <Card key={s.id} accent={s.color} style={{padding:12}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}><GradeBadge grade={hs2.grade} color={hs2.color}/><span style={{fontWeight:700,fontSize:12}}>{s.nom}</span></div>{[["CA",fmt(ca2)+"€"],["Marge",pct(ca2-ch2,ca2)+"%"],["Score",hs2.score+"/100"]].map(([l,v2],i2)=><div key={i2} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:11}}><span style={{color:C.td}}>{l}</span><span style={{fontWeight:700}}>{v2}</span></div>)}</Card>;})}</div></>}
 </Sect>
 <Sect title="CA Total"><div className="fu d2" style={{height:200,background:C.card,borderRadius:12,border:`1px solid ${C.brd}`,padding:"14px 6px 6px 0"}}><ResponsiveContainer><AreaChart data={allM.map(m=>{let t=0;socs.forEach(s=>{t+=pf(gr(reps,s.id,m)?.ca);});return{mois:ml(m),total:t};})}><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.acc} stopOpacity={.25}/><stop offset="100%" stopColor={C.acc} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.brd}/><XAxis dataKey="mois" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/><Tooltip content={<CTip/>}/><Area type="monotone" dataKey="total" stroke={C.acc} strokeWidth={2} fill="url(#ga)" name="CA Total"/></AreaChart></ResponsiveContainer></div></Sect>
 <Sect title="Répartition"><div className="fu d3" style={{height:200,background:C.card,borderRadius:12,border:`1px solid ${C.brd}`,padding:10,display:"flex",alignItems:"center"}}><div style={{width:"45%"}}><ResponsiveContainer><PieChart><Pie data={socs.filter(s=>pf(gr(reps,s.id,cM2)?.ca)>0).map(s=>({name:s.nom,value:pf(gr(reps,s.id,cM2).ca),color:s.color}))} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={3} strokeWidth={0}>{socs.filter(s=>pf(gr(reps,s.id,cM2)?.ca)>0).map((s,i)=><Cell key={i} fill={s.color}/>)}</Pie><Tooltip content={<CTip/>}/></PieChart></ResponsiveContainer></div><div style={{flex:1,paddingLeft:8}}>{socs.filter(s=>pf(gr(reps,s.id,cM2)?.ca)>0).sort((a2,b2)=>pf(gr(reps,b2.id,cM2).ca)-pf(gr(reps,a2.id,cM2).ca)).map(s=>{const ca3=pf(gr(reps,s.id,cM2).ca);const tot=socs.reduce((a2,s2)=>a2+pf(gr(reps,s2.id,cM2)?.ca),0);return <div key={s.id} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><span style={{width:5,height:5,borderRadius:3,background:s.color}}/><span style={{color:C.td,fontSize:10,flex:1}}>{s.nom}</span><span style={{fontWeight:700,fontSize:10}}>{fmt(ca3)}€</span><span style={{color:C.td,fontSize:9,width:28,textAlign:"right"}}>{pct(ca3,tot)}%</span></div>;})}</div></div></Sect>
 <RiskMatrix socs={socs} reps={reps} allM={allM}/>
 <CohortAnalysis socs={socs} reps={reps} allM={allM}/>
 </>;
}
// cache-bust 1771110009
// v1771111679
