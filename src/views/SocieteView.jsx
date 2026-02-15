import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "../utils/index.jsx";
// Destructure commonly used utilities for readability
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;

import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";
import { MilestonesWall, MilestonesCompact, MilestoneCount, AICoPilot, PulseForm, BankingPanel, BankingTransactions, TabCRM, SocBankWidget, SynergiesPanel, KnowledgeBase, GamificationPanel, InboxUnifiee, ParcoursClientVisuel, BenchmarkRadar, SmartAlertsPanel, SubsTeamPanel, SubsTeamBadge, ChallengesPanel, AIWeeklyCoach, RapportsPanel, DealFlow } from "../components/features.jsx";
import { ClientsPanelSafe } from "./Clients.jsx";
import { SocSettingsPanel, NotificationCenter } from "./PorteurSettings.jsx";
import { PorteurAIChat } from "./PorteurAIChat.jsx";
import { PorteurDashboard, LeaderboardCard, PulseDashWidget } from "./PorteurDashboard.jsx";
import { InboxPanel, AgendaPanel, ConversationsPanel, TodoPanel, PipelineKanbanPanel, RessourcesPanel, ActivitePanel, ClientsUnifiedPanel } from "./PorteurPanels.jsx";
import { HealthBadge, SalesPanel, PublicitePanel } from "./SalesPanel.jsx";
import { Sidebar } from "../components/navigation.jsx";

export function SocieteView({soc,reps,allM,save,onLogout,actions,journal,pulses,saveAJ,savePulse,socBankData,syncSocBank,okrs,saveOkrs,kb,saveKb,socs,subs,saveSubs,team,saveTeam,clients,saveClients,ghlData,invoices,saveInvoices,hold,onTour,onThemeToggle,stripeData,adminBack}){
 const cM2=curM();const[pTab,setPTab]=useState(0);const[mo,setMo]=useState(cM2);
 const[f,setF]=useState(()=>gr(reps,soc.id,cM2)||{...BF});const[done,setDone]=useState(false);const[showPub,setShowPub]=useState(false);const[jText,setJText]=useState("");
 const[showWarRoom,setShowWarRoom]=useState(false);const[autoPilotOn,setAutoPilotOn]=useState(()=>{try{return!!JSON.parse(localStorage.getItem(`autopilot_on_${soc.id}`));}catch{return false;}});
 useEffect(()=>{const ex=gr(reps,soc.id,mo)||{...BF};setF(ex);setShowPub(!!pf(ex.pub));setDone(false);},[mo,soc.id]);
 const ex=gr(reps,soc.id,mo),ca=pf(f.ca),ch=pf(f.charges),marge=ca-ch;
 const prestaP=pf(f.prestataireAmount||0);const remontee=(soc.pT==="ca"?ca:Math.max(0,ca-prestaP))*soc.pP/100;
 const oP=soc.obj>0&&ca>0?pct(ca,soc.obj):null;const past=Object.entries(reps).filter(([k])=>k.startsWith(soc.id+"_")).sort(([a2],[b2])=>b2.localeCompare(a2)).slice(0,6);
 const evo=allM.map(m=>{const r=gr(reps,soc.id,m);if(!r)return null;const rca=pf(r.ca),rch=pf(r.charges),sal=pf(r.salaire),ops=pf(r.chargesOps),form=pf(r.formation),pub=pf(r.pub),lds=pf(r.leads),ldC=pf(r.leadsContact),ldCl=pf(r.leadsClos);return{mois:ml(m),m,ca:rca,marge:rca-rch,margePct:rca>0?Math.round((rca-rch)/rca*100):0,mrr:pf(r.mrr),pipeline:pf(r.pipeline),treso:pf(r.tresoSoc),salaire:sal,chargesOps:ops,formation:form,pub,leads:lds,leadsContact:ldC,leadsClos:ldCl,charges:rch};}).filter(Boolean);
 const exCur=gr(reps,soc.id,cM2);const status=exCur?(exCur.ok?"validated":"pending"):"missing";
 const statusColor={missing:C.r,pending:C.o,validated:C.g}[status];const statusText={missing:"À soumettre",pending:"En attente",validated:"✓ Validé"}[status];
 const hs=healthScore(soc,reps);const myActions=actions.filter(a2=>a2.socId===soc.id);const myJournal=(journal[soc.id]||[]).sort((a2,b2)=>new Date(b2.date)-new Date(a2.date));
 const rw=runway(reps,soc.id,allM);
 const totalCA=evo.reduce((a2,d)=>a2+d.ca,0);const avgCA=evo.length>0?Math.round(totalCA/evo.length):0;
 const milestones=useMemo(()=>calcMilestones(soc,reps,actions,pulses,allM),[soc,reps,actions,pulses,allM]);
 const doSub=()=>{
  const newReps={...reps,[`${soc.id}_${mo}`]:{...f,at:new Date().toISOString(),ok:ex?.ok||false,comment:ex?.comment||""}};
  save(null,newReps,null);setDone(true);setTimeout(()=>setDone(false),2500);
  if(hold?.slack?.enabled&&hold.slack.notifyReport){
   slackSend(hold.slack,buildReportSlackMsg(soc,f,mo)).then(r=>{if(r.ok)console.log("Slack: report notified");});
  }
 };
 const toggleAction=(id)=>{saveAJ(actions.map(a2=>a2.id===id?{...a2,done:!a2.done}:a2),null);};
 const addJournal=()=>{if(!jText.trim())return;saveAJ(null,{...journal,[soc.id]:[...myJournal,{id:uid(),date:new Date().toISOString(),text:jText.trim()}]});setJText("");};
 const bankFin=revFinancials(socBankData,mo);
 const autoFill=()=>{if(!bankFin)return;setF(prev=>({...prev,ca:String(bankFin.ca),charges:String(bankFin.expense||bankFin.charges),tresoSoc:String(bankFin.tresoSoc)}));};
 /* NEW: Personal goals */
 const[goals,setGoals]=useState({});
 /* NEW: Celebration */
 const[celebMs,setCelebMs]=useState(null);
 /* Milestones celebration disabled */
 /* NEW: Computed insights, benchmark, playbooks */
 const insights=useMemo(()=>genInsights(evo,hs,rw,myActions,soc,reps,allM),[evo,hs,rw,myActions]);
 const benchmark=useMemo(()=>calcBenchmark(soc,reps,socs,cM2),[soc,reps,socs,cM2]);
 const playbooks=useMemo(()=>getPlaybooks(evo,hs,rw,clients),[evo,hs,rw,clients]);
 const[notifOpen,setNotifOpen]=useState(false);
 const[mobileMenuOpen,setMobileMenuOpen]=useState(false);
 const porteurNotifs=useMemo(()=>genPorteurNotifications(soc,reps,socBankData?{[soc.id]:socBankData}:{},ghlData,clients,allM),[soc,reps,socBankData,ghlData,clients,allM]);
 return <div className="glass-bg" style={{display:"flex",minHeight:"100vh",fontFamily:FONT,color:C.t}}>
  <style>{CSS}</style>
  <NotificationCenter notifications={porteurNotifs} open={notifOpen} onClose={()=>setNotifOpen(false)}/>
  {/* Mobile Header */}
  <div className="mobile-header" style={{display:"none",position:"fixed",top:0,left:0,right:0,zIndex:100,background:"rgba(14,14,22,.8)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.06)",padding:"10px 16px",alignItems:"center",gap:10}}>
   <button onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} style={{background:"none",border:"none",fontSize:20,color:C.t,cursor:"pointer",padding:4}}>☰</button>
   <div style={{flex:1,fontWeight:800,fontSize:13,fontFamily:FONT_TITLE,color:soc.brandColor||soc.color}}>{soc.nom}</div>
   <button onClick={onThemeToggle} style={{background:"none",border:"none",fontSize:16,cursor:"pointer",padding:4,color:C.td}}>{getTheme()==="light"?"🌙":"☀️"}</button>
   <button onClick={()=>setNotifOpen(true)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",position:"relative",padding:4}}>🔔{porteurNotifs.length>0&&<span style={{position:"absolute",top:0,right:0,width:14,height:14,borderRadius:7,background:C.r,color:"#fff",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{porteurNotifs.length}</span>}</button>
  </div>
  {/* Mobile sidebar overlay */}
  {mobileMenuOpen&&<div className="fi" onClick={()=>setMobileMenuOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:150}}><div onClick={e=>e.stopPropagation()} style={{width:240,height:"100vh",background:C.card,borderRight:`1px solid ${C.brd}`,overflowY:"auto"}}>
   <Sidebar items={SB_PORTEUR} activeTab={pTab} setTab={t=>{setPTab(t);setMobileMenuOpen(false);}} brandTitle={soc.nom} brandSub={soc.porteur} onLogout={onLogout} onTour={onTour} adminBack={adminBack||(() => {})} onThemeToggle={onThemeToggle} dataTourPrefix="porteur" brand={{logoUrl:soc.logoUrl||"",logoLetter:(soc.nom||"?")[0],accentColor:soc.brandColor||soc.color}} extra={null}/>
  </div></div>}
  <div className="sidebar-desktop"><Sidebar items={SB_PORTEUR} activeTab={pTab} setTab={setPTab} brandTitle={soc.nom} brandSub={`${soc.porteur}${soc.incub?" · "+sinceLbl(soc.incub):""}`} onLogout={onLogout} onTour={onTour||(() => {})} onThemeToggle={onThemeToggle} adminBack={adminBack} dataTourPrefix="porteur" brand={{logoUrl:soc.logoUrl||"",logoLetter:(soc.nom||"?")[0],accentColor:soc.brandColor||soc.color}} extra={<div style={{display:"flex",alignItems:"center",gap:6}}>
   <button onClick={()=>setNotifOpen(true)} style={{background:"none",border:"none",cursor:"pointer",position:"relative",fontSize:16,padding:"2px 4px"}}>🔔{porteurNotifs.length>0&&<span style={{position:"absolute",top:-2,right:-2,width:14,height:14,borderRadius:7,background:C.r,color:"#fff",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{porteurNotifs.length}</span>}</button>
  </div>}/></div>
  <div className="main-content" style={{flex:1,minWidth:0,height:"100vh",overflow:"auto"}}>
  {/* AI Chat Bubble */}
  <PorteurAIChat soc={soc} reps={reps} allM={allM} socBank={socBankData?{[soc.id]:socBankData}:{}} ghlData={ghlData} clients={clients}/>
  {celebMs&&<CelebrationOverlay milestone={celebMs} onClose={()=>setCelebMs(null)}/>}
  <div style={{padding:"16px 16px 16px",maxWidth:680,margin:"0 auto"}}>
  {/* === PORTEUR DASHBOARD (pTab 0) === */}
  {showWarRoom&&<WarRoom soc={soc} reps={reps} allM={allM} ghlData={ghlData} clients={clients} socBank={socBankData?{[soc.id]:socBankData}:{}} socs={socs} onClose={()=>setShowWarRoom(false)}/>}
  {pTab===0&&<><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
   <button onClick={()=>setShowWarRoom(true)} style={{padding:"6px 14px",borderRadius:8,border:"1px solid rgba(255,170,0,.25)",background:"rgba(255,170,0,.08)",color:"#FFAA00",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FONT,boxShadow:"0 0 12px rgba(255,170,0,.1)"}}>🎮 War Room</button>
   <button onClick={()=>{const v=!autoPilotOn;setAutoPilotOn(v);try{localStorage.setItem(`autopilot_on_${soc.id}`,JSON.stringify(v));sSet(`autopilot_on_${soc.id}`,v);}catch{}}} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${autoPilotOn?"rgba(52,211,153,.3)":"rgba(255,255,255,.1)"}`,background:autoPilotOn?"rgba(52,211,153,.1)":"transparent",color:autoPilotOn?"#34d399":"#71717a",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>🔄 Auto-Pilot {autoPilotOn?"ON":"OFF"}</button>
  </div>
  <PredictionsCard soc={soc} reps={reps} allM={allM} clients={clients} ghlData={ghlData} socBank={socBankData?{[soc.id]:socBankData}:{}}/>
  <PorteurDashboard soc={soc} reps={reps} allM={allM} socBank={socBankData?{[soc.id]:socBankData}:{}} ghlData={ghlData} setPTab={setPTab} soc2={soc} clients={clients} pulses={pulses} savePulse={savePulse} hold={hold} stripeData={stripeData}/>
  {autoPilotOn&&<AutoPilotSection soc={soc} clients={clients} ghlData={ghlData} socBank={socBankData?{[soc.id]:socBankData}:{}} reps={reps}/>}</>}
  {pTab===5&&<><SocBankWidget bankData={socBankData} onSync={()=>syncSocBank(soc.id)} soc={soc}/>
   <SubsTeamPanel socs={[soc]} subs={subs} saveSubs={saveSubs} team={team} saveTeam={saveTeam} socId={soc.id} reps={reps} socBankData={socBankData}/>
  </>}
  {pTab===9&&<ErrorBoundary label="Clients"><ClientsUnifiedPanel soc={soc} clients={clients} saveClients={saveClients} ghlData={ghlData} socBankData={socBankData} invoices={invoices} saveInvoices={saveInvoices} stripeData={stripeData}/></ErrorBoundary>}
  {pTab===13&&<ErrorBoundary label="Rapports"><RapportsPanel soc={soc} socBankData={socBankData} ghlData={ghlData} clients={clients} reps={reps} allM={allM}/></ErrorBoundary>}
  {pTab===12&&<SocSettingsPanel soc={soc} save={save} socs={socs} clients={clients}/>}
  {pTab===1&&<ErrorBoundary label="Activité"><ActivitePanel soc={soc} ghlData={ghlData} socBankData={socBankData} clients={clients}/></ErrorBoundary>}
  {pTab===2&&<ErrorBoundary label="Sales"><SalesPanel soc={soc} ghlData={ghlData} socBankData={socBankData} clients={clients} reps={reps} setPTab={setPTab}/></ErrorBoundary>}
  {pTab===3&&<ErrorBoundary label="Publicité"><PublicitePanel soc={soc} ghlData={ghlData} socBankData={socBankData} clients={clients} reps={reps} setPTab={setPTab}/></ErrorBoundary>}
  </div>
  </div>
 </div>;
}
/* ADMIN VALROW */
export function ValRow({s,r,reps,save,hs,delay,onAction,hold}){
 const[open,setOpen]=useState(false);const[cmt,setCmt]=useState(r.comment||"");const[actText,setActText]=useState("");
 const ca=pf(r.ca),ch=pf(r.charges),mrr=pf(r.mrr),pipe=pf(r.pipeline),ts=pf(r.tresoSoc),marge=ca-ch,m=curM();
 const doVal=(wc)=>{
  const finalComment=wc?cmt:r.comment;
  save(null,{...reps,[`${s.id}_${m}`]:{...r,ok:true,comment:finalComment}},null);setOpen(false);
  if(hold?.slack?.enabled&&hold.slack.notifyValidation){
   slackSend(hold.slack,buildValidationSlackMsg(s,finalComment,m));
  }
 };
 const prevR=gr(reps,s.id,prevM(m)),prevCa=prevR?pf(prevR.ca):0;const trend=prevCa>0?pct(ca-prevCa,prevCa):null;
 return <div className={`fu d${delay}`}>
  <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:C.card,borderRadius:open?"12px 12px 0 0":12,border:`1px solid ${C.brd}`,borderBottom:open?"none":`1px solid ${C.brd}`,marginBottom:open?0:5,cursor:"pointer"}} onClick={()=>setOpen(!open)}>
   <GradeBadge grade={hs.grade} color={hs.color}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{s.nom} <span style={{color:C.td,fontWeight:400,fontSize:11}}>· {s.porteur}</span></div></div>
   <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>{trend!=null&&<span style={{fontSize:10,fontWeight:600,color:trend>=0?C.g:C.r}}>{trend>=0?"▲":"▼"}{Math.abs(trend)}%</span>}<span style={{fontWeight:800,fontSize:15}}>{fmt(ca)}€</span>
    {r.ok?<span style={{color:C.g,fontSize:13}}>✓</span>:<button className="ba" onClick={e=>{e.stopPropagation();doVal(false);}} style={{background:C.gD,color:C.g,border:`1px solid ${C.g}33`,borderRadius:6,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Valider</button>}<span style={{color:C.td,fontSize:10,transform:open?"rotate(180deg)":"",transition:"transform .2s"}}>▼</span></div>
  </div>
  {open&&<div className="fu" style={{background:C.card,border:`1px solid ${C.brd}`,borderTop:"none",borderRadius:"0 0 12px 12px",padding:"8px 12px 12px",marginBottom:5}}>
   <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8,fontSize:11,color:C.td}}>
    <span>CA: <strong style={{color:C.t}}>{fmt(ca)}€</strong></span><span>Marge: <strong style={{color:marge>=0?C.g:C.r}}>{fmt(marge)}€</strong></span>
    {s.obj>0&&<span>Obj: <strong style={{color:pct(ca,s.obj)>=100?C.g:C.r}}>{pct(ca,s.obj)}%</strong></span>}
    {s.rec&&mrr>0&&<span>MRR: <strong style={{color:C.b}}>{fmt(mrr)}€</strong></span>}{pipe>0&&<span>Pipe: <strong style={{color:C.acc}}>{fmt(pipe)}€</strong></span>}{ts>0&&<span>Tréso: <strong>{fmt(ts)}€</strong></span>}
   </div>
   {r.notes&&<div style={{fontSize:11,color:C.td,fontStyle:"italic",marginBottom:8,padding:"6px 8px",background:C.bg,borderRadius:6}}>"{r.notes}"</div>}
   <div style={{display:"flex",gap:8,alignItems:"flex-end",marginBottom:8}}><div style={{flex:1}}><Inp label="Commentaire" value={cmt} onChange={setCmt} placeholder="Feedback…" small/></div>
    {!r.ok&&<Btn small v="success" onClick={()=>doVal(true)}>✓ Valider</Btn>}
    {cmt!==r.comment&&<Btn small v="secondary" onClick={()=>{save(null,{...reps,[`${s.id}_${m}`]:{...r,comment:cmt}},null);}}>Envoyer</Btn>}
   </div>
   <div style={{display:"flex",gap:6,alignItems:"center",borderTop:`1px solid ${C.brd}`,paddingTop:8}}>
    <input value={actText} onChange={e=>setActText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&actText.trim()){onAction(s.id,actText.trim());setActText("");}}} placeholder="+ Action…" style={{flex:1,background:C.bg,border:`1px solid ${C.brd}`,borderRadius:6,color:C.t,padding:"6px 8px",fontSize:11,fontFamily:FONT,outline:"none"}}/><Btn small v="secondary" onClick={()=>{if(actText.trim()){onAction(s.id,actText.trim());setActText("");}}}>+</Btn>
   </div>
  </div>}
 </div>;
}
/* SIMULATEUR */
export function TabSimulateur({socs,reps,hold}){
 const cM2=curM();const actS=socs.filter(s=>["active","lancement"].includes(s.stat));
 const[simCA,setSimCA]=useState(()=>{const o={};actS.forEach(s=>{const r=gr(reps,s.id,cM2);o[s.id]=r?pf(r.ca):0;});return o;});
 const hcReal=calcH(socs,reps,hold,cM2),hcSim=simH(socs,simCA,hold),diff=hcSim.pf-hcReal.pf;
 return <><Sect title="Simulateur" sub="Ajustez et voyez l'impact en temps réel">{actS.map((s,i)=>{const cur=gr(reps,s.id,cM2);const curCA=cur?pf(cur.ca):0;const v=simCA[s.id]||0;
  return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{padding:"10px 14px",background:C.card,borderRadius:10,border:`1px solid ${C.brd}`,marginBottom:5}}>
   <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:6,height:6,borderRadius:3,background:s.color}}/><span style={{fontWeight:700,fontSize:12}}>{s.nom}</span></div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:C.td,fontSize:10}}>Actuel: {fmt(curCA)}€</span><span style={{fontWeight:800,fontSize:14,color:v>curCA?C.g:v<curCA?C.r:C.t,minWidth:70,textAlign:"right"}}>{fmt(v)}€</span></div></div>
   <input type="range" min={0} max={Math.max(curCA*3,30000)} step={100} value={v} onChange={e=>setSimCA({...simCA,[s.id]:parseInt(e.target.value)})} style={{width:"100%"}}/></div>;})}
 </Sect>
 <Sect title="Impact"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
  <Card style={{padding:14,textAlign:"center"}}><div style={{color:C.td,fontSize:10,fontWeight:700}}>FLUX</div><div style={{fontWeight:800,fontSize:20,color:C.g}}>{fmt(hcSim.tIn)}€</div><div style={{color:C.td,fontSize:10}}>actuel: {fmt(hcReal.tIn)}€</div></Card>
  <Card style={{padding:14,textAlign:"center"}}><div style={{color:C.td,fontSize:10,fontWeight:700}}>DISPO</div><div style={{fontWeight:800,fontSize:20,color:C.acc}}>{fmt(hcSim.dispo)}€</div><div style={{color:C.td,fontSize:10}}>actuel: {fmt(hcReal.dispo)}€</div></Card>
  <Card style={{padding:14,textAlign:"center"}}><div style={{color:C.td,fontSize:10,fontWeight:700}}>/ FONDATEUR</div><div style={{fontWeight:800,fontSize:20,color:diff>=0?C.g:C.r}}>{fmt(hcSim.pf)}€</div><div style={{color:diff>=0?C.g:C.r,fontSize:11,fontWeight:600}}>{diff>=0?"+":""}{fmt(diff)}€</div></Card>
 </div></Sect></>;
}
/* ONBOARDING SYSTEM */
export const OB_STEPS=[
 {id:"welcome",icon:"👋",label:"Bienvenue",title:"Bienvenue dans l'incubateur Scale Corp",sub:"Avant d'accéder à la plateforme, configurons votre espace en quelques étapes."},
 {id:"company",icon:"🏢",label:"Entreprise",title:"Profil de votre entreprise",sub:"Ces informations seront visibles sur votre fiche dans le portfolio."},
 {id:"team",icon:"👥",label:"Équipe",title:"Votre équipe fondatrice",sub:"Présentez les personnes clés de votre projet."},
 {id:"metrics",icon:"📊",label:"Métriques",title:"Vos métriques actuelles",sub:"Point de départ pour suivre votre progression."},
 {id:"goals",icon:"🎯",label:"Objectifs",title:"Objectifs d'incubation",sub:"Définissez ce que vous souhaitez accomplir."},
 {id:"legal",icon:"📋",label:"Légal",title:"Documents & engagements",sub:"Conditions du programme et validation."},
 {id:"prefs",icon:"⚙️",label:"Préférences",title:"Configuration du compte",sub:"Personnalisez votre expérience."},
 {id:"recap",icon:"✅",label:"Récap",title:"Tout est prêt !",sub:"Vérifiez vos informations."},
];
export const OB_SECTORS=["Media Buying","Copywriting","Vidéo / Contenu","Design / Branding","Formation","E-commerce","Consulting","SaaS","Coaching","Import / Export","Autre"];
export const OB_GOALS=["Atteindre 10K€/mois de CA","Automatiser le delivery","Recruter les premiers talents","Structurer les processus","Développer l'acquisition client","Diversifier les revenus","Construire une marque forte","Optimiser la rentabilité"];

export function ObInp({label,value,onChange,type="text",placeholder,required,info,onKeyDown}){
 const[f,setF]=useState(false);
 return <div style={{marginBottom:14}}>
  {label&&<label style={{display:"flex",alignItems:"center",fontSize:12,fontWeight:600,color:C.td,marginBottom:5,fontFamily:FONT,letterSpacing:.3}}>
   {label}{required&&<span style={{color:C.r,marginLeft:3,fontSize:10}}>*</span>}
   {info&&<span title={info} style={{marginLeft:5,width:15,height:15,borderRadius:"50%",background:C.accD,color:C.acc,fontSize:9,display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"help",fontWeight:700}}>?</span>}
  </label>}
  <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
   onFocus={()=>setF(true)} onBlur={()=>setF(false)}
   style={{width:"100%",padding:"10px 13px",borderRadius:9,border:`1.5px solid ${f?C.acc+"66":C.brd}`,fontSize:13,fontFamily:FONT,background:C.bg,color:C.t,outline:"none",transition:"all .2s",boxSizing:"border-box",boxShadow:f?`0 0 0 3px ${C.accD}`:"none"}}/>
 </div>;
}
export function ObTextArea({label,value,onChange,placeholder,rows=3,info}){
 const[f,setF]=useState(false);
 return <div style={{marginBottom:14}}>
  {label&&<label style={{display:"flex",alignItems:"center",fontSize:12,fontWeight:600,color:C.td,marginBottom:5,fontFamily:FONT,letterSpacing:.3}}>
   {label}{info&&<span title={info} style={{marginLeft:5,width:15,height:15,borderRadius:"50%",background:C.accD,color:C.acc,fontSize:9,display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"help",fontWeight:700}}>?</span>}
  </label>}
  <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
   onFocus={()=>setF(true)} onBlur={()=>setF(false)}
   style={{width:"100%",padding:"10px 13px",borderRadius:9,border:`1.5px solid ${f?C.acc+"66":C.brd}`,fontSize:13,fontFamily:FONT,background:C.bg,color:C.t,outline:"none",transition:"all .2s",boxSizing:"border-box",resize:"vertical",lineHeight:1.5,boxShadow:f?`0 0 0 3px ${C.accD}`:"none"}}/>
 </div>;
}
export function ObSelect({label,value,onChange,options,placeholder,required}){
 return <div style={{marginBottom:14}}>
  {label&&<label style={{display:"flex",alignItems:"center",fontSize:12,fontWeight:600,color:C.td,marginBottom:5,fontFamily:FONT,letterSpacing:.3}}>
   {label}{required&&<span style={{color:C.r,marginLeft:3,fontSize:10}}>*</span>}
  </label>}
  <select value={value} onChange={e=>onChange(e.target.value)}
   style={{width:"100%",padding:"10px 13px",borderRadius:9,border:`1.5px solid ${C.brd}`,fontSize:13,fontFamily:FONT,background:C.bg,color:value?C.t:C.td,outline:"none",boxSizing:"border-box",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FFAA00' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"}}>
   <option value="" disabled>{placeholder||"Sélectionner..."}</option>
   {options.map(o=><option key={o} value={o}>{o}</option>)}
  </select>
 </div>;
}
export function ObCheck({checked,onChange,label}){
 return <label style={{display:"flex",alignItems:"flex-start",gap:9,cursor:"pointer",fontSize:12.5,color:C.t,lineHeight:1.5,fontFamily:FONT,marginBottom:10}}>
  <div onClick={e=>{e.preventDefault();onChange(!checked);}}
   style={{width:18,height:18,minWidth:18,borderRadius:5,marginTop:1,border:checked?"none":`1.5px solid ${C.brd}`,background:checked?`linear-gradient(135deg,${C.acc},#FF9D00)`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",cursor:"pointer"}}>
   {checked&&<span style={{color:"#0a0a0f",fontSize:11,fontWeight:900}}>✓</span>}
  </div>
  <span>{label}</span>
 </label>;
}
export function ObTag({selected,onToggle,options}){
 return <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{options.map(o=>{const sel=selected.includes(o);return <button key={o} onClick={()=>onToggle(o)}
  style={{padding:"7px 14px",borderRadius:20,fontSize:11.5,fontWeight:sel?700:400,border:`1.5px solid ${sel?C.acc:C.brd}`,background:sel?C.accD:"transparent",color:sel?C.acc:C.td,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>{o}</button>;})}</div>;
}

