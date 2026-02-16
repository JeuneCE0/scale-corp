import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { showToast } from "./ui-polish.jsx";
import {
  BF, BILL_TYPES, C, CLIENT_STATUS, CSS, CURR_SYMBOLS, DEAL_STAGES, EXCLUDED_ACCOUNTS, ErrorBoundary, FONT, FONT_TITLE, isExcludedTx,
  GHL_STAGES_COLORS, INV_STATUS, KB_CATS, MILESTONE_CATS, MN, MOODS, SLACK_MODES, SUB_CATS, SYN_STATUS, SYN_TYPES, gr,
  TIER_BG, TIER_COLORS, ago, autoDetectSubscriptions, buildAIContext, buildPulseSlackMsg, buildReportSlackMsg, buildValidationSlackMsg,
  calcH, calcMilestones, clamp, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, curM, curW,
  deadline, fK, fetchGHL, fmt, generateInvoices, getAlerts, getStripeChargesForClient, getStripeTotal, getTheme, ghlCreateContact,
  ghlCreateInvoice, ghlSendInvoice, ghlUpdateContact, healthScore, matchSubsToRevolut, ml, nextM, normalizeStr, pct,
  pf, prevM, project, revFinancials, runway, sSet, sbUpsert, simH, sinceLbl, sinceMonths, slackSend, subMonthly, teamMonthly,
  uid, autoCategorize, TX_CATEGORIES,
} from "./shared.jsx";


// Import + re-export from chunk files
import { PredictionsCard } from "./components/PredictionsCard.jsx";
import { LiveFeed } from "./components/LiveFeed.jsx";
import { categorizeTransaction, BankingTransactions } from "./components/BankingPanel.jsx";
import { SocBankWidget } from "./components/SocBankWidget.jsx";
export { PredictionsCard, LiveFeed, categorizeTransaction, BankingTransactions, SocBankWidget };
// TabCRM is lazy-loaded directly; AICoPilot is lazy-loaded directly; PulseScreen is lazy-loaded directly; BankingPanel is lazy-loaded directly
import { AIWeeklyCoach } from "./components/AI.jsx";
import { RapportsPanel, ReplayMensuel } from "./components/Reports.jsx";
export { AIWeeklyCoach, RapportsPanel, ReplayMensuel };
import { PipelinePanel, NewClientsPanel, PrestatairesPanel, SantePanel, AgendaStats, CAForecast } from "./views/NewPanels.jsx";

export function MobileBottomNav({items,activeTab,setTab,onAIToggle,aiOpen}){
 const mainItems=[
  items.find(i=>i.id==="dashboard"||i.id==="dash"),
  items.find(i=>i.id==="sales"||i.id==="bank"),
  {_ai:true}, // AI button placeholder
  items.find(i=>i.id==="clients"),
  items.find(i=>i.id==="conversations"||i.id==="activite"),
 ].filter(x=>x);
 const[moreOpen,setMoreOpen]=useState(false);
 const otherItems=items.filter(i=>!i.children&&!mainItems.find(m=>m&&m.id===i.id));
 return <><nav className="mobile-bottom-nav" style={{display:"none",position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"rgba(6,6,11,.92)",backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",borderTop:"1px solid rgba(255,255,255,.06)",padding:"0 0 env(safe-area-inset-bottom,0px)",justifyContent:"space-around",alignItems:"flex-end"}}>
  {mainItems.map((item,idx)=>{
   if(item._ai) return <button key="ai-fab" onClick={onAIToggle} className="mobile-ai-fab" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,background:"none",border:"none",cursor:"pointer",fontFamily:FONT,position:"relative",bottom:12,padding:0}}>
    <div style={{width:52,height:52,borderRadius:26,background:aiOpen?"linear-gradient(135deg,#a78bfa,#FFAA00)":"linear-gradient(135deg,#FFBF00,#FF9D00)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:aiOpen?"0 0 24px rgba(167,139,250,.5)":"0 4px 20px rgba(255,170,0,.35)",transition:"all .3s cubic-bezier(.4,0,.2,1)",transform:aiOpen?"scale(1.05) rotate(15deg)":"scale(1)"}}>
     <span style={{fontSize:24,filter:"drop-shadow(0 1px 2px rgba(0,0,0,.3))"}}>{aiOpen?"✕":"🤖"}</span>
    </div>
    <span style={{fontSize:8,fontWeight:700,color:aiOpen?C.v:C.acc,marginTop:2,letterSpacing:.3}}>IA</span>
   </button>;
   const active=item.tab===activeTab;
   return <button key={item.id} onClick={()=>{setTab(item.tab);setMoreOpen(false);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,background:"none",border:"none",padding:"10px 6px 8px",cursor:"pointer",fontFamily:FONT,minWidth:0,flex:1,position:"relative",transition:"all .2s"}}>
    <span style={{fontSize:20,transition:"all .2s",transform:active?"scale(1.15) translateY(-2px)":"scale(1)",filter:active?"brightness(1.2)":"brightness(0.7)"}}>{item.icon}</span>
    <span style={{fontSize:9,fontWeight:active?800:500,color:active?C.acc:C.td,transition:"all .2s",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:60,letterSpacing:active?.3:0}}>{item.label}</span>
    {active&&<span style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",width:20,height:3,borderRadius:2,background:C.acc,boxShadow:`0 0 8px ${C.acc}66`}}/>}
   </button>;
  })}
  <button onClick={()=>setMoreOpen(!moreOpen)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,background:"none",border:"none",padding:"10px 6px 8px",cursor:"pointer",fontFamily:FONT,minWidth:0,flex:1}}>
   <span style={{fontSize:20,opacity:moreOpen?1:.6,transition:"all .2s",transform:moreOpen?"rotate(90deg)":"rotate(0)"}}>{moreOpen?"✕":"⋯"}</span>
   <span style={{fontSize:9,fontWeight:moreOpen?700:500,color:moreOpen?C.acc:C.td}}>Plus</span>
  </button>
 </nav>
 {/* More menu drawer */}
 {moreOpen&&<div className="fi" onClick={()=>setMoreOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(8px)",zIndex:190}}>
  <div onClick={e=>e.stopPropagation()} style={{position:"fixed",bottom:"calc(60px + env(safe-area-inset-bottom,0px))",left:8,right:8,background:"rgba(14,14,22,.95)",backdropFilter:"blur(30px)",borderRadius:20,border:"1px solid rgba(255,255,255,.08)",padding:"16px 12px",boxShadow:"0 -8px 40px rgba(0,0,0,.5)",animation:"slideInUp .25s cubic-bezier(.22,1,.36,1)"}}>
   <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
    {otherItems.map(item=>{const active=item.tab===activeTab;return <button key={item.id} onClick={()=>{setTab(item.tab);setMoreOpen(false);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:active?"rgba(255,170,0,.12)":"rgba(255,255,255,.03)",border:active?`1px solid ${C.acc}44`:"1px solid rgba(255,255,255,.04)",borderRadius:14,padding:"14px 6px 10px",cursor:"pointer",fontFamily:FONT,transition:"all .2s"}}>
     <span style={{fontSize:22}}>{item.icon}</span>
     <span style={{fontSize:9,fontWeight:active?700:500,color:active?C.acc:C.td,textAlign:"center"}}>{item.label}</span>
    </button>;})}
   </div>
  </div>
 </div>}
 </>;
}
export function Badge({s}){const m={active:[C.gD,C.g,"Active"],lancement:[C.oD,C.o,"Lancement"],signature:[C.bD,C.b,"Signature"],inactive:[C.rD,C.r,"Inactive"]};const[bg2,c2,l]=m[s]||m.inactive;return <span style={{background:bg2,color:c2,padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:700,letterSpacing:.5}}>{l}</span>;}
export function IncubBadge({incub}){if(!incub)return null;const lbl=sinceLbl(incub);return <span style={{background:C.vD,color:C.v,padding:"2px 7px",borderRadius:20,fontSize:9,fontWeight:600}}>📅 {lbl}</span>;}
export function GradeBadge({grade,color,size="sm"}){const s=size==="lg"?{w:32,h:32,fs:16,r:9,bw:2}:{w:22,h:22,fs:11,r:6,bw:1.5};return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:s.w,height:s.h,borderRadius:s.r,background:color+"15",color,fontWeight:900,fontSize:s.fs,border:`${s.bw}px solid ${color}33`,flexShrink:0}}>{grade}</span>;}
export function KPI({label,value,sub,accent,small,delay=0,icon}){
 return <div className={`fu d${delay} glass-card-static`} style={{padding:small?"10px 12px":"16px 18px",flex:"1 1 130px",minWidth:small?100:130,transition:"all .3s cubic-bezier(.4,0,.2,1)"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=`${accent||C.acc}33`;e.currentTarget.style.boxShadow=`0 0 20px ${(accent||C.acc)}15`;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--sc-w06)";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,.3)";e.currentTarget.style.transform="translateY(0)";}}>
  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}>{icon&&<span style={{fontSize:11}}>{icon}</span>}<span style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",fontFamily:FONT_TITLE}}>{label}</span></div>
  <div className="kpi-val" style={{fontSize:small?16:28,fontWeight:900,color:accent||C.t,lineHeight:1.1}}>{value}</div>
  {sub&&<div style={{color:C.td,fontSize:10,marginTop:3}}>{sub}</div>}
 </div>;
}
export function PBar({value,max,color,h=5}){const w=clamp(pct(value,max),0,100);return <div style={{background:C.brd,borderRadius:h,height:h,overflow:"hidden"}}><div className="pg" style={{background:color||C.acc,height:"100%",width:`${w}%`,"--w":`${w}%`,borderRadius:h}}/></div>;}
export function Btn({children,onClick,v="primary",small,style:sx,disabled,full,"aria-label":ariaLabel}){
 const t={primary:{background:`linear-gradient(135deg,#FFBF00,#FF9D00)`,color:"#0a0a0f",boxShadow:"0 0 20px rgba(255,170,0,.2)"},secondary:{background:"rgba(255,255,255,.03)",color:C.t,border:"1px solid rgba(255,255,255,.08)",backdropFilter:"blur(10px)"},ghost:{background:"transparent",color:C.td,border:"1px solid rgba(255,255,255,.04)"},danger:{background:"rgba(248,113,113,.1)",color:C.r,border:"1px solid rgba(248,113,113,.15)"},success:{background:"rgba(52,211,153,.1)",color:C.g,border:"1px solid rgba(52,211,153,.15)"},ai:{background:`linear-gradient(135deg,${C.v},${C.acc})`,color:"#0a0a0f",boxShadow:`0 0 20px rgba(167,139,250,.2)`}};
 return <button className="ba" disabled={disabled} onClick={onClick} aria-label={ariaLabel} style={{border:"none",borderRadius:10,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:FONT,opacity:disabled?0.35:1,padding:small?"5px 10px":"9px 18px",fontSize:small?10:12,width:full?"100%":"auto",letterSpacing:.3,...t[v],...sx}}>{children}</button>;
}
export function Inp({label,value,onChange,type="text",placeholder,suffix,textarea,small,note,onKeyDown,required,id:propId}){
 const inputId=propId||( label ? "inp-"+label.toLowerCase().replace(/[^a-z0-9]/g,"-") : undefined);
 return <div style={{marginBottom:small?6:10}}>
  {label&&<label htmlFor={inputId} style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3,letterSpacing:.3}}>{label}</label>}
  <div className="glass-input" style={{display:"flex",alignItems:"center",borderRadius:10,overflow:"hidden"}} onFocus={e=>{e.currentTarget.style.borderColor="rgba(255,170,0,.3)";e.currentTarget.style.boxShadow="0 0 16px rgba(255,170,0,.08)";}} onBlur={e=>{e.currentTarget.style.borderColor="var(--sc-w06)";e.currentTarget.style.boxShadow="none";}}>
   {textarea?<textarea id={inputId} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={2} aria-required={required?"true":undefined} style={{flex:1,background:"transparent",border:"none",color:C.t,padding:"7px 10px",fontSize:12,fontFamily:FONT,outline:"none",resize:"vertical"}}/>
    :<input id={inputId} type={type} value={value==null?"":value} onChange={e=>onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} aria-required={required?"true":undefined} style={{flex:1,background:"transparent",border:"none",color:C.t,padding:small?"6px 10px":"8px 10px",fontSize:12,fontFamily:FONT,outline:"none",width:"100%"}}/>}
   {suffix&&<span style={{padding:"0 8px 0 2px",color:C.td,fontSize:11,flexShrink:0}}>{suffix}</span>}
  </div>{note&&<div style={{color:C.tm,fontSize:9,marginTop:2}}>{note}</div>}</div>;
}
export function Sel({label,value,onChange,options,"aria-label":ariaLabel,id:propId}){const selectId=propId||(label?"sel-"+label.toLowerCase().replace(/[^a-z0-9]/g,"-"):undefined);return <div style={{marginBottom:10}}>{label&&<label htmlFor={selectId} style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3,letterSpacing:.3}}>{label}</label>}<select id={selectId} value={value} onChange={e=>onChange(e.target.value)} aria-label={ariaLabel||(!label?undefined:undefined)} style={{width:"100%",background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.t,padding:"8px 10px",fontSize:12,fontFamily:FONT,outline:"none"}}>{options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>;}
export function Sect({children,title,sub,right}){return <div className="fu" style={{marginTop:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8,flexWrap:"wrap",gap:4}}><div>{title&&<h2 style={{color:C.t,fontSize:13,fontWeight:800,margin:0,letterSpacing:1,textTransform:"uppercase",fontFamily:FONT_TITLE}}>{title}</h2>}{sub&&<p style={{color:C.td,fontSize:10,margin:"1px 0 0"}}>{sub}</p>}</div>{right}</div>{children}</div>;}
export function Card({children,style:sx,onClick,accent,delay=0}){return <div className={`fu d${Math.min(delay,8)} ${onClick?"glass-card":"glass-card-static"}`} onClick={onClick} style={{padding:14,cursor:onClick?"pointer":"default",...(accent?{borderLeft:`3px solid ${accent}`}:{}),...sx}} >{children}</div>;}
export function Modal({open,onClose,title,children,wide}){if(!open)return null;return <div className="fi" onClick={onClose} onKeyDown={e=>{if(e.key==="Escape")onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"28px 14px",overflowY:"auto",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}><div className={`mi glass-modal${wide?" modal-wide":""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={el=>{if(el)el.focus();}} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();onClose();}}} style={{borderRadius:18,padding:22,width:wide?700:440,maxWidth:"95vw",outline:"none"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.t}}>{title}</h3><Btn v="ghost" small onClick={onClose} aria-label="Fermer">✕</Btn></div>{children}</div></div>;}
export function CTip({active,payload,label}){if(!active||!payload)return null;return <div style={{background:"rgba(14,14,22,.85)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"8px 12px",boxShadow:"0 8px 32px rgba(0,0,0,.5)"}}><div style={{color:C.t,fontWeight:700,fontSize:9,marginBottom:3}}>{label}</div>{payload.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,marginBottom:1}}><span style={{width:4,height:4,borderRadius:2,background:p.color}}/><span style={{color:C.td,fontSize:9}}>{p.name}:</span><span style={{color:C.t,fontSize:9,fontWeight:600}}>{fmt(p.value)}€</span></div>)}</div>;}
export function Toggle({on,onToggle,label}){return <div onClick={onToggle} style={{display:"inline-flex",alignItems:"center",gap:7,cursor:"pointer",padding:"5px 10px",borderRadius:8,background:on?C.accD:C.card2,border:`1px solid ${on?C.acc+"66":C.brd}`,transition:"all .15s"}}><div style={{width:26,height:14,borderRadius:7,background:on?C.acc:C.brd,position:"relative",transition:"background .2s"}}><div style={{width:10,height:10,borderRadius:5,background:on?"#0a0a0f":C.td,position:"absolute",top:2,left:on?14:2,transition:"left .2s"}}/></div><span style={{fontSize:10,fontWeight:600,color:on?C.acc:C.td}}>{label}</span></div>;}
export function ActionItem({a,socs,onToggle,onDelete}){const s=socs.find(x=>x.id===a.socId);const late=!a.done&&a.deadline<curM();return <div className="fu" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:8,border:`1px solid ${late?C.r+"44":C.brd}`,marginBottom:3}}><div onClick={()=>onToggle(a.id)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${a.done?C.g:C.brd}`,background:a.done?C.gD:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{a.done&&<span style={{color:C.g,fontSize:11}}>✓</span>}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:a.done?C.td:C.t,textDecoration:a.done?"line-through":"none"}}>{a.text}</div><div style={{fontSize:10,color:late?C.r:C.td}}>{s&&<><span style={{width:5,height:5,borderRadius:3,background:s.color,display:"inline-block",marginRight:4}}/>{s.nom} · </>}{ml(a.deadline)}{late&&" ⚠ En retard"}</div></div>{onDelete&&<Btn v="ghost" small onClick={()=>onDelete(a.id)} style={{fontSize:9,padding:"2px 6px"}} aria-label="Supprimer l'action">✕</Btn>}</div>;}
/* AI CO-PILOT */
/* PULSE SYSTEM */
export function PulseForm({soc,pulses,savePulse,hold}){
 const w=curW();const existing=pulses[`${soc.id}_${w}`];
 const[mood,setMood]=useState(existing?.mood??-1);const[win,setWin]=useState(existing?.win||"");
 const[blocker,setBlocker]=useState(existing?.blocker||"");const[conf,setConf]=useState(existing?.conf??3);const[sent,setSent]=useState(!!existing);const[slackSent,setSlackSent]=useState(false);
 const submit=()=>{
  const pulse={mood,win,blocker,conf,at:new Date().toISOString()};
  savePulse(`${soc.id}_${w}`,pulse);setSent(true);setTimeout(()=>setSent(false),2e3);
  if(hold?.slack?.enabled&&hold.slack.notifyPulse){
   slackSend(hold.slack,buildPulseSlackMsg(soc,pulse)).then(r=>{if(r.ok)setSlackSent(true);});
  }
 };
 return <Card style={{padding:14}} accent={soc.color}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
   <span style={{fontWeight:700,fontSize:13}}>⚡ Pulse hebdo {existing&&<span style={{color:C.g,fontSize:10,fontWeight:600}}>✓ Déjà envoyé</span>}</span>
   {hold?.slack?.enabled&&<span style={{fontSize:7,color:C.g,background:C.gD,padding:"1px 5px",borderRadius:4}}>{SLACK_MODES[hold.slack.mode]?.icon||"💬"} Slack</span>}
  </div>
  <div style={{marginBottom:10}}><div style={{color:C.td,fontSize:11,fontWeight:600,marginBottom:4}}>Comment tu te sens ?</div><div style={{display:"flex",gap:6}}>{MOODS.map((e,i)=><button key={i} onClick={()=>setMood(i)} style={{fontSize:22,padding:"4px 8px",borderRadius:8,border:`2px solid ${mood===i?C.acc:C.brd}`,background:mood===i?C.accD:"transparent",cursor:"pointer",transition:"all .15s"}}>{e}</button>)}</div></div>
  <Inp label="🏆 Ta victoire de la semaine" value={win} onChange={setWin} placeholder="Ex: 2 nouveaux clients signés" small/>
  <Inp label="🚧 Un blocage ?" value={blocker} onChange={setBlocker} placeholder="Ex: attente réponse fournisseur (optionnel)" small/>
  <div style={{marginBottom:10}}><div style={{color:C.td,fontSize:11,fontWeight:600,marginBottom:4}}>Confiance pour la suite (1-5)</div><div style={{display:"flex",alignItems:"center",gap:8}}><input type="range" min={1} max={5} value={conf} onChange={e=>setConf(parseInt(e.target.value))} style={{flex:1}}/><span style={{fontWeight:800,fontSize:16,color:[C.r,C.o,C.td,C.b,C.g][conf-1]}}>{conf}/5</span></div></div>
  <Btn onClick={submit} full v={sent?"success":"primary"} disabled={mood<0||!win.trim()}>{sent?"✓ Envoyé !":"Envoyer le pulse"}</Btn>
  {slackSent&&<div style={{textAlign:"center",fontSize:9,color:C.g,marginTop:4}}>💬 Notification Slack envoyée</div>}
 </Card>;
}
export function PulseOverview({socs,pulses}){
 const w=curW();const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 return <>{actS.map(s=>{const p=pulses[`${s.id}_${w}`];
  return <div key={s.id} className="fu" style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
   <span style={{width:5,height:5,borderRadius:3,background:s.color}}/><span style={{flex:1,fontSize:12,fontWeight:600}}>{s.porteur}</span>
   {p?<><span style={{fontSize:16}}>{MOODS[p.mood]}</span><span style={{fontSize:10,color:C.td,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.win}</span>{p.blocker&&<span style={{fontSize:9,color:C.r,background:C.rD,padding:"2px 6px",borderRadius:10}}>blocage</span>}<span style={{fontWeight:700,fontSize:11,color:[C.r,C.o,C.td,C.b,C.g][p.conf-1]}}>{p.conf}/5</span></>
    :<span style={{fontSize:10,color:C.tm}}>— pas encore envoyé</span>}
  </div>;})}</>;
}
/* MEETING MODE */
/* MEETING MODE */
export function MeetingMode({socs,reps,hold,actions,pulses,allM,clients=[],onExit}){
 const cM2=curM();const actS=socs.filter(s=>s.stat==="active");const hc=calcH(socs,reps,hold,cM2);
 const[step,setStep]=useState(0);const[timer,setTimer]=useState(0);const[running,setRunning]=useState(false);const[notes,setNotes]=useState("");
 const steps=[{title:"Vue d'ensemble",icon:"📊"},{title:"Alertes & Actions",icon:"⚠"},...actS.map(s=>({title:s.nom,icon:"🏢",soc:s})),{title:"Décisions & Prochaines étapes",icon:"✅"}];
 useEffect(()=>{let id;if(running)id=setInterval(()=>setTimer(t=>t+1),1e3);return()=>clearInterval(id);},[running]);
 const fmtT=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
 return <div className="glass-bg" style={{minHeight:"100vh",fontFamily:FONT,color:C.t}}>
  <style>{CSS}</style>
  <div style={{background:"var(--sc-card-a7)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--sc-w06)",padding:"14px 20px"}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div><div style={{color:C.acc,fontSize:10,fontWeight:700,letterSpacing:2}}>MODE RÉUNION</div><h1 style={{margin:0,fontSize:18,fontWeight:900}}>{hold?.brand?.name||"Scale Corp"} — {ml(cM2)}</h1></div>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
    <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,fontVariantNumeric:"tabular-nums",color:running?C.g:C.t}}>{fmtT(timer)}</div><div style={{display:"flex",gap:4,marginTop:4}}><Btn small v={running?"danger":"success"} onClick={()=>setRunning(!running)} aria-label={running?"Pause":"Démarrer"}>{running?"⏸":"▶"}</Btn><Btn small v="ghost" onClick={()=>setTimer(0)} aria-label="Réinitialiser le timer">↻</Btn></div></div>
    <Btn v="ghost" onClick={onExit}>✕ Quitter</Btn>
    </div>
   </div>
   <div style={{display:"flex",gap:2,marginTop:12,overflowX:"auto"}}>{steps.map((s,i)=><button key={i} onClick={()=>setStep(i)} style={{padding:"8px 14px",borderRadius:8,fontSize:11,fontWeight:step===i?700:500,border:"none",background:step===i?C.acc+"22":"transparent",color:step===i?C.acc:C.td,cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap"}}>{s.icon} {s.title}</button>)}</div>
  </div>
  <div className="page-wrap" style={{padding:"20px 30px",maxWidth:900,margin:"0 auto"}}>
   {step===0&&<div className="si">
    <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14}}>
    {(()=>{const caG=actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca),0);const chG=actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.charges),0);const margeG=caG-chG;const margePctG=caG>0?Math.round(margeG/caG*100):0;return<><KPI label="CA Groupe" value={`${fmt(caG)}€`} accent={C.acc}/><KPI label="Marge" value={`${fmt(margeG)}€ (${margePctG}%)`} accent={margeG>=0?C.g:C.r}/><KPI label="/ Fondateur" value={`${fmt(hc.pf)}€`} accent={C.o}/><KPI label="Pipeline" value={`${fmt(socs.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.pipeline),0))}€`} accent={C.b}/></>;})()}
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:16}}>{actS.map(s=>{const hs=healthScore(s,reps);const r=gr(reps,s.id,cM2);
     const myCl=(clients||[]).filter(c=>c.socId===s.id&&c.status==="active");const chCl=(clients||[]).filter(c=>c.socId===s.id&&c.status==="churned").length;const totCl=myCl.length+chCl;
     const prevCa=pf(gr(reps,s.id,prevM(cM2))?.ca);
     const ecsQuick=(()=>{let sc=0;sc+=100;const g2=prevCa>0?(pf(r?.ca)-prevCa)/prevCa*100:0;sc+=g2>10?200:g2>5?150:g2>=0?100:50;sc+=Math.round((1-(totCl>0?chCl/totCl:0))*200);sc+=myCl.length>10?100:myCl.length>=5?70:40;return clamp(sc,0,1000);})();
     const ecsC=ecsQuick>800?"#34d399":ecsQuick>600?"#eab308":ecsQuick>400?"#fb923c":"#f87171";
     const ecsB=ecsQuick>800?"🏆":ecsQuick>600?"⭐":ecsQuick>400?"📈":"⚠️";
     return <Card key={s.id} accent={s.color} style={{flex:"1 1 200px",padding:14}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><GradeBadge grade={hs.grade} color={hs.color}/><span style={{fontWeight:700,fontSize:14}}>{s.nom}</span><span style={{marginLeft:"auto",fontSize:9,fontWeight:800,color:ecsC,background:ecsC+"18",padding:"2px 6px",borderRadius:8}}>{ecsB} {ecsQuick}</span></div><div style={{fontSize:22,fontWeight:900}}>{r?`${fmt(r.ca)}€`:"—"}</div><div style={{color:C.td,fontSize:11,marginTop:2}}>{s.porteur}</div></Card>;})}</div>
   </div>}
   {step===1&&<div className="si">
    <Sect title="Alertes">{getAlerts(socs,reps,hold).map((a,i)=><div key={i} style={{padding:"6px 10px",background:{danger:C.rD,warn:C.oD,info:C.bD}[a.t],borderRadius:8,marginBottom:3,color:{danger:C.r,warn:C.o,info:C.b}[a.t],fontSize:12,fontWeight:600}}>⚠ {a.m}</div>)}</Sect>
    <Sect title="Actions en retard">{actions.filter(a=>!a.done&&a.deadline<cM2).map(a=><ActionItem key={a.id} a={a} socs={socs} onToggle={()=>{}} onDelete={()=>{}}/>)}</Sect>
    <Sect title="Actions en cours">{actions.filter(a=>!a.done&&a.deadline>=cM2).slice(0,8).map(a=><ActionItem key={a.id} a={a} socs={socs} onToggle={()=>{}} onDelete={()=>{}}/>)}</Sect>
   </div>}
   {step>=2&&step<steps.length-1&&steps[step].soc&&(()=>{
    const s=steps[step].soc,r=gr(reps,s.id,cM2),rp=gr(reps,s.id,prevM(cM2));const hs=healthScore(s,reps);const rw=runway(reps,s.id,allM);const proj=project(reps,s.id,allM);
    const pw=Object.entries(pulses).filter(([k])=>k.startsWith(s.id+"_")).pop();
    const sActs=actions.filter(a=>a.socId===s.id&&!a.done);
    return <div className="si">
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
    <div style={{width:40,height:40,borderRadius:10,background:`${s.color}22`,border:`2px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:18,color:s.color,overflow:"hidden"}}>{s.logoUrl?<img src={s.logoUrl} alt={s.nom} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:s.nom[0]}</div>
    <div style={{flex:1}}><div style={{fontWeight:900,fontSize:18}}>{s.nom}</div><div style={{color:C.td,fontSize:11,display:"flex",gap:6,alignItems:"center"}}><span>{s.porteur} — {s.act}</span>{s.incub&&<span style={{color:C.v,fontSize:9,background:C.vD,padding:"1px 6px",borderRadius:8}}>📅 {sinceLbl(s.incub)}</span>}</div></div>
    <GradeBadge grade={hs.grade} color={hs.color} size="lg"/>
    </div>
    <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
    {(()=>{const ca2=pf(r?.ca),ch2=pf(r?.charges),m2=ca2-ch2,mp2=ca2>0?Math.round(m2/ca2*100):0;return<><KPI label="CA" value={r?`${fmt(ca2)}€`:"—"} accent={C.acc} small/><KPI label="Marge" value={r?`${fmt(m2)}€ (${mp2}%)`:"—"} accent={m2>=0?C.g:C.r} small/></>;})()}
    {s.rec&&<KPI label="MRR" value={r?`${fmt(r.mrr)}€`:"—"} accent={C.b} small/>}
    <KPI label="Pipeline" value={r?`${fmt(r.pipeline)}€`:"—"} accent={C.acc} small/>
    {rw&&<KPI label="Runway" value={`${rw.months} mois`} accent={rw.months<3?C.r:rw.months<6?C.o:C.g} small/>}
    </div>
    {pw&&<Card style={{marginTop:12,padding:12}} accent={s.color}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22}}>{MOODS[pw[1].mood]}</span><div><div style={{fontSize:12,fontWeight:600}}>Pulse: {pw[1].win}</div>{pw[1].blocker&&<div style={{fontSize:11,color:C.r}}>Blocage: {pw[1].blocker}</div>}</div></div></Card>}
    {/* Milestones disabled */}
    {proj&&<Card style={{marginTop:10,padding:12}}><div style={{color:C.td,fontSize:10,fontWeight:700,marginBottom:4}}>PROJECTION T+3</div><div style={{display:"flex",gap:12}}>{proj.map((v,i)=><span key={i} style={{fontSize:12}}>{ml(nextM(i===0?cM2:nextM(i===1?cM2:nextM(cM2))))}: <strong style={{color:C.acc}}>{fmt(v)}€</strong></span>)}</div></Card>}
    {sActs.length>0&&<Sect title="Actions ouvertes">{sActs.map(a=><ActionItem key={a.id} a={a} socs={socs} onToggle={()=>{}} onDelete={()=>{}}/>)}</Sect>}
    </div>;
   })()}
   {step===steps.length-1&&<div className="si"><Sect title="Notes de réunion"><Inp value={notes} onChange={setNotes} textarea placeholder="Décisions prises, prochaines étapes…"/></Sect></div>}
   <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
    <Btn v="secondary" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}>← Précédent</Btn>
    <span style={{color:C.td,fontSize:11}}>{step+1}/{steps.length}</span>
    <Btn onClick={()=>setStep(Math.min(steps.length-1,step+1))} disabled={step===steps.length-1}>Suivant →</Btn>
   </div>
  </div>
 </div>;
}
/* DEAL FLOW */
/* DEAL FLOW */
export function DealFlow({deals,saveDeals}){
 const[edit,setEdit]=useState(null);
 const move=(id,dir)=>{saveDeals(deals.map(d=>d.id===id?{...d,stage:clamp(d.stage+dir,0,DEAL_STAGES.length-1)}:d));};
 const del=(id)=>{saveDeals(deals.filter(d=>d.id!==id));};
 const saveDeal=()=>{if(!edit)return;const idx=deals.findIndex(d=>d.id===edit.id);saveDeals(idx>=0?deals.map(d=>d.id===edit.id?edit:d):[...deals,edit]);setEdit(null);};
 return <>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,marginTop:6}}><span style={{color:C.td,fontSize:12}}>{deals.length} opportunités</span><Btn small onClick={()=>setEdit({id:uid(),nom:"",contact:"",stage:0,value:0,notes:"",at:new Date().toISOString()})}>+ Deal</Btn></div>
  <div className="deal-flow-stages" style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:10,WebkitOverflowScrolling:"touch"}}>{DEAL_STAGES.map((stage,si)=><div key={si} style={{minWidth:170,flex:"1 1 170px"}}>
   <div style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:6,textAlign:"center"}}>{stage}</div>
   {deals.filter(d=>d.stage===si).length===0&&<div style={{textAlign:"center",padding:"16px 8px",color:C.td,fontSize:10,opacity:.5}}>Glissez un deal ici</div>}
   {deals.filter(d=>d.stage===si).map(d=><Card key={d.id} style={{marginBottom:5,padding:"10px 12px",cursor:"pointer"}} onClick={()=>setEdit({...d})}>
    <div style={{fontWeight:700,fontSize:12,marginBottom:2}}>{d.nom}</div>
    <div style={{fontSize:10,color:C.td}}>{d.contact}</div>
    {d.value>0&&<div style={{fontSize:11,fontWeight:700,color:C.acc,marginTop:2}}>{fmt(d.value)}€/mois</div>}
    <div style={{display:"flex",gap:3,marginTop:6}}>{si>0&&<Btn v="ghost" small onClick={e=>{e.stopPropagation();move(d.id,-1);}} aria-label="Étape précédente">←</Btn>}{si<DEAL_STAGES.length-1&&<Btn v="ghost" small onClick={e=>{e.stopPropagation();move(d.id,1);}} aria-label="Étape suivante">→</Btn>}</div>
   </Card>)}
  </div>)}</div>
  <Modal open={!!edit} onClose={()=>setEdit(null)} title={edit?.nom||"Nouveau deal"}>
   {edit&&<><Inp label="Nom société" value={edit.nom} onChange={v=>setEdit({...edit,nom:v})}/><Inp label="Contact" value={edit.contact} onChange={v=>setEdit({...edit,contact:v})}/><Inp label="Valeur estimée" value={edit.value} onChange={v=>setEdit({...edit,value:pf(v)})} type="number" suffix="€/mois"/><Sel label="Étape" value={edit.stage} onChange={v=>setEdit({...edit,stage:parseInt(v)})} options={DEAL_STAGES.map((s,i)=>({v:i,l:s}))}/><Inp label="Notes" value={edit.notes} onChange={v=>setEdit({...edit,notes:v})} textarea/>
   <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={saveDeal}>Sauver</Btn><Btn v="secondary" onClick={()=>setEdit(null)}>Annuler</Btn>{deals.find(d=>d.id===edit.id)&&<Btn v="danger" onClick={()=>{del(edit.id);setEdit(null);}} style={{marginLeft:"auto"}}>Supprimer</Btn>}</div></>}
  </Modal>
 </>;
}
/* BANKING - REVOLUT */
export { TX_CATEGORIES } from "./shared.jsx";
/* MILESTONES UI */
export function MilestonesWall({milestones,soc}){
 const[showAll,setShowAll]=useState(false);
 const unlocked=milestones.filter(m=>m.unlocked);
 const locked=milestones.filter(m=>!m.unlocked);
 const nextUp=locked.sort((a,b)=>a.tier-b.tier).slice(0,3);
 const cats=[...new Set(milestones.map(m=>m.cat))];
 const progress=Math.round(unlocked.length/milestones.length*100);
 return <>
  <Card accent={C.acc} style={{padding:16,marginTop:6,marginBottom:14}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
    <div>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>MILESTONES DÉBLOQUÉS</div>
    <div style={{display:"flex",alignItems:"baseline",gap:6,marginTop:2}}>
    <span style={{fontWeight:900,fontSize:28,color:C.acc,lineHeight:1}}>{unlocked.length}</span>
    <span style={{color:C.td,fontSize:12}}>/ {milestones.length}</span>
    </div>
    </div>
    <div style={{width:56,height:56,borderRadius:28,background:C.bg,border:`3px solid ${C.acc}44`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
    <span style={{fontWeight:900,fontSize:16,color:C.acc}}>{progress}%</span>
    <svg style={{position:"absolute",inset:-3}} width={62} height={62}><circle cx={31} cy={31} r={27} fill="none" stroke={C.brd} strokeWidth={3}/><circle cx={31} cy={31} r={27} fill="none" stroke={C.acc} strokeWidth={3} strokeDasharray={`${progress*1.7} 170`} strokeLinecap="round" transform="rotate(-90 31 31)" style={{transition:"stroke-dasharray .6s ease"}}/></svg>
    </div>
   </div>
   <PBar value={unlocked.length} max={milestones.length} color={C.acc} h={4}/>
  </Card>
  {unlocked.length>0&&<Sect title="Trophées" sub={`${unlocked.length} débloqués`}>
   <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:6}}>
    {unlocked.sort((a,b)=>b.tier-a.tier).slice(0,showAll?999:12).map((m,i)=>
    <div key={m.id} className={`fu d${Math.min(i+1,8)}`} style={{background:TIER_BG[m.tier],border:`1px solid ${TIER_COLORS[m.tier]}22`,borderRadius:10,padding:"10px 8px",textAlign:"center",position:"relative",overflow:"hidden"}}>
    {m.tier>=4&&<div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 0%,${TIER_COLORS[m.tier]}08,transparent 70%)`,pointerEvents:"none"}}/>}
    <div style={{fontSize:20,marginBottom:3,filter:m.tier>=5?"drop-shadow(0 0 4px rgba(251,191,36,.4))":"none"}}>{m.icon}</div>
    <div style={{fontWeight:700,fontSize:9,color:TIER_COLORS[m.tier],lineHeight:1.2}}>{m.label}</div>
    <div style={{fontSize:7,color:C.td,marginTop:2,lineHeight:1.2}}>{m.desc}</div>
    </div>
    )}
   </div>
   {unlocked.length>12&&!showAll&&<div style={{textAlign:"center",marginTop:8}}><Btn small v="ghost" onClick={()=>setShowAll(true)}>Voir tout ({unlocked.length})</Btn></div>}
  </Sect>}
  {nextUp.length>0&&<Sect title="Prochains paliers">
   {nextUp.map((m,i)=>
    <div key={m.id} className={`fu d${Math.min(i+1,4)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:8,border:`1px dashed ${C.brd}`,marginBottom:3,opacity:.7}}>
    <span style={{fontSize:16,filter:"grayscale(1) opacity(.5)"}}>{m.icon}</span>
    <div style={{flex:1}}>
    <div style={{fontWeight:600,fontSize:11,color:C.td}}>{m.label}</div>
    <div style={{fontSize:9,color:C.tm}}>{m.desc}</div>
    </div>
    <span style={{fontSize:8,color:C.td,background:C.card2,padding:"2px 6px",borderRadius:8}}>🔒</span>
    </div>
   )}
  </Sect>}
  <Sect title="Par catégorie">
   {cats.map(cat=>{
    const catMs=milestones.filter(m=>m.cat===cat);
    const catUnlocked=catMs.filter(m=>m.unlocked).length;
    return <div key={cat} className="fu" style={{marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
    <span style={{fontSize:11,fontWeight:700}}>{MILESTONE_CATS[cat]||cat}</span>
    <span style={{fontSize:9,color:C.td}}>{catUnlocked}/{catMs.length}</span>
    </div>
    <div style={{display:"flex",gap:3}}>
    {catMs.sort((a,b)=>a.tier-b.tier).map(m=><div key={m.id} style={{flex:1,height:4,borderRadius:2,background:m.unlocked?TIER_COLORS[m.tier]:C.brd,transition:"background .3s"}} title={`${m.label}: ${m.desc}${m.unlocked?" ✓":" 🔒"}`}/>)}
    </div>
    </div>;
   })}
  </Sect>
 </>;
}
export function MilestonesCompact({milestones,max=5}){
 const unlocked=milestones.filter(m=>m.unlocked);
 if(unlocked.length===0)return null;
 const top=unlocked.sort((a,b)=>b.tier-a.tier).slice(0,max);
 return <div style={{display:"flex",gap:2,alignItems:"center"}}>
  {top.map(m=><span key={m.id} title={m.label} style={{fontSize:10,filter:m.tier>=4?"none":"opacity(.7)"}}>{m.icon}</span>)}
  {unlocked.length>max&&<span style={{fontSize:8,color:C.td}}>+{unlocked.length-max}</span>}
 </div>;
}
export function MilestoneCount({milestones}){
 const n=milestones.filter(m=>m.unlocked).length;
 if(n===0)return null;
 return <span style={{fontSize:8,color:C.acc,background:C.accD,padding:"1px 5px",borderRadius:8,fontWeight:700}}>🏆 {n}</span>;
}
/* PER-SOCIÉTÉ BANKING WIDGET — REDESIGNED */
/* SYNERGIES MAP */
export function SynergiesPanel({socs,synergies,saveSynergies}){
 const[editing,setEditing]=useState(null);
 const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 const totalValue=synergies.filter(s=>s.status==="won").reduce((a,s)=>a+pf(s.value),0);
 const activeCount=synergies.filter(s=>s.status==="active").length;
 const matrix=useMemo(()=>{
  const m={};actS.forEach(s=>{m[s.id]={out:{},in:{}};});
  synergies.forEach(sy=>{
   if(m[sy.from])m[sy.from].out[sy.to]=(m[sy.from].out[sy.to]||0)+1;
   if(m[sy.to])m[sy.to].in[sy.from]=(m[sy.to].in[sy.from]||0)+1;
  });return m;
 },[actS,synergies]);
 const addSyn=()=>setEditing({id:uid(),from:actS[0]?.id||"",to:actS[1]?.id||"",type:"referral",desc:"",value:0,date:new Date().toISOString().slice(0,10),status:"active"});
 const saveSyn=()=>{if(!editing)return;const idx=synergies.findIndex(s=>s.id===editing.id);saveSynergies(idx>=0?synergies.map(s=>s.id===editing.id?editing:s):[...synergies,editing]);setEditing(null);};
 return <>
  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6,marginBottom:12,flexWrap:"wrap"}}>
   <KPI label="Valeur totale" value={`${fmt(totalValue)}€`} accent={C.g} small delay={1}/>
   <KPI label="En cours" value={activeCount} accent={C.b} small delay={2}/>
   <KPI label="Total" value={synergies.length} accent={C.acc} small delay={3}/>
   <Btn small onClick={addSyn}>+ Synergie</Btn>
  </div>
  <Card style={{padding:14,marginBottom:12}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>CARTE DES SYNERGIES</div>
   <div style={{display:"grid",gridTemplateColumns:`40px repeat(${actS.length},1fr)`,gap:1,fontSize:8}}>
    <div/>
    {actS.map(s=><div key={s.id} style={{textAlign:"center",fontWeight:700,color:s.color,padding:3,overflow:"hidden",textOverflow:"ellipsis"}}>{s.nom.slice(0,6)}</div>)}
    {actS.map(row=><Fragment key={row.id}>
    <div style={{fontWeight:700,color:row.color,padding:3,display:"flex",alignItems:"center"}}>{row.nom.slice(0,5)}</div>
    {actS.map(col=>{
    const count=(matrix[row.id]?.out[col.id]||0);
    const isself=row.id===col.id;
    return <div key={col.id} style={{textAlign:"center",padding:4,background:isself?C.tm:count>0?`${C.acc}${Math.min(99,count*25).toString(16).padStart(2,"0")}`:C.bg,borderRadius:3,color:count>0?C.acc:C.tm,fontWeight:count>0?700:400,cursor:count>0?"pointer":"default",border:`1px solid ${C.brd}`}} title={!isself?`${row.nom} → ${col.nom}: ${count} synergies`:""}>{isself?"·":count||""}</div>;
    })}
    </Fragment>)}
   </div>
  </Card>
  <Sect title="Historique">
   {synergies.sort((a,b)=>new Date(b.date)-new Date(a.date)).map((sy,i)=>{
    const sf=socs.find(s=>s.id===sy.from);const st=socs.find(s=>s.id===sy.to);const tp=SYN_TYPES[sy.type]||SYN_TYPES.referral;const ss=SYN_STATUS[sy.status]||SYN_STATUS.active;
    return <div key={sy.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3,cursor:"pointer"}} onClick={()=>setEditing({...sy})}>
    <span style={{fontSize:12}}>{tp.icon}</span>
    <div style={{flex:1,minWidth:0}}>
    <div style={{fontSize:11,fontWeight:600}}><span style={{color:sf?.color}}>{sf?.nom}</span> → <span style={{color:st?.color}}>{st?.nom}</span></div>
    <div style={{fontSize:9,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sy.desc}</div>
    </div>
    {pf(sy.value)>0&&<span style={{fontSize:10,fontWeight:700,color:C.g}}>{fmt(sy.value)}€</span>}
    <span style={{fontSize:8,color:ss.color,background:ss.color+"18",padding:"1px 5px",borderRadius:6,fontWeight:600}}>{ss.label}</span>
    </div>;
   })}
  </Sect>
  <Modal open={!!editing} onClose={()=>setEditing(null)} title="Synergie">{editing&&<>
   <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Sel label="De" value={editing.from} onChange={v=>setEditing({...editing,from:v})} options={actS.map(s=>({v:s.id,l:s.nom}))}/>
    <Sel label="Vers" value={editing.to} onChange={v=>setEditing({...editing,to:v})} options={actS.map(s=>({v:s.id,l:s.nom}))}/>
    <Sel label="Type" value={editing.type} onChange={v=>setEditing({...editing,type:v})} options={Object.entries(SYN_TYPES).map(([k,v])=>({v:k,l:`${v.icon} ${v.label}`}))}/>
    <Sel label="Statut" value={editing.status} onChange={v=>setEditing({...editing,status:v})} options={Object.entries(SYN_STATUS).map(([k,v])=>({v:k,l:v.label}))}/>
    <Inp label="Valeur" type="number" value={editing.value} onChange={v=>setEditing({...editing,value:pf(v)})} suffix="€"/>
    <Inp label="Date" type="date" value={editing.date} onChange={v=>setEditing({...editing,date:v})}/>
   </div>
   <Inp label="Description" value={editing.desc} onChange={v=>setEditing({...editing,desc:v})} textarea placeholder="Détails de la synergie…"/>
   <div style={{display:"flex",gap:8,marginTop:12}}>
    <Btn onClick={saveSyn}>Sauver</Btn><Btn v="secondary" onClick={()=>setEditing(null)}>Annuler</Btn>
    {synergies.find(s=>s.id===editing.id)&&<Btn v="danger" onClick={()=>{saveSynergies(synergies.filter(s=>s.id!==editing.id));setEditing(null);}} style={{marginLeft:"auto"}}>Supprimer</Btn>}
   </div>
  </>}</Modal>
 </>;
}
/* KNOWLEDGE BASE */
/* KNOWLEDGE BASE */
export function KnowledgeBase({socs,kb,saveKb,isPorteur,socId}){
 const[cat,setCat]=useState("all");const[search,setSearch]=useState("");const[editing,setEditing]=useState(null);const[expanded,setExpanded]=useState(null);
 const filtered=kb.filter(k=>(cat==="all"||k.cat===cat)&&(search===""||k.title.toLowerCase().includes(search.toLowerCase())||k.tags?.some(t=>t.includes(search.toLowerCase()))||k.content.toLowerCase().includes(search.toLowerCase())));
 const addEntry=()=>setEditing({id:uid(),title:"",cat:"tip",author:socId||"eco",content:"",tags:[],date:new Date().toISOString().slice(0,10),likes:0});
 const saveEntry=()=>{if(!editing||!editing.title.trim())return;const idx=kb.findIndex(k=>k.id===editing.id);saveKb(idx>=0?kb.map(k=>k.id===editing.id?editing:k):[...kb,editing]);setEditing(null);};
 const likeEntry=(id)=>saveKb(kb.map(k=>k.id===id?{...k,likes:(k.likes||0)+1}:k));
 return <>
  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,marginBottom:12,flexWrap:"wrap"}}>
   <div style={{flex:"1 1 140px",position:"relative"}}>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{width:"100%",background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.t,padding:"7px 10px 7px 28px",fontSize:11,fontFamily:FONT,outline:"none"}}/>
    <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.td}}>🔍</span>
   </div>
   <select value={cat} onChange={e=>setCat(e.target.value)} style={{background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.t,padding:"6px 10px",fontSize:11,fontFamily:FONT,outline:"none"}}><option value="all">Toutes catégories</option>{Object.entries(KB_CATS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select>
   <Btn small onClick={addEntry}>+ Contribution</Btn>
  </div>
  <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>
   {Object.entries(KB_CATS).map(([k,v])=>{const cnt=kb.filter(e=>e.cat===k).length;
    return <div key={k} onClick={()=>setCat(cat===k?"all":k)} style={{padding:"4px 10px",background:cat===k?v.color+"18":C.card2,border:`1px solid ${cat===k?v.color+"44":C.brd}`,borderRadius:8,fontSize:10,fontWeight:600,color:cat===k?v.color:C.td,cursor:"pointer",transition:"all .15s"}}>
    {v.label} <span style={{fontWeight:800}}>{cnt}</span>
    </div>;
   })}
  </div>
  {filtered.length===0&&<div className="fu" style={{textAlign:"center",padding:40,color:C.td}}><div style={{fontSize:28,marginBottom:6}}>🔍</div><div style={{fontSize:12}}>Aucun résultat trouvé</div><div style={{fontSize:10,marginTop:4,opacity:.7}}>Essayez avec d'autres mots-clés</div></div>}
  {filtered.sort((a,b)=>(b.likes||0)-(a.likes||0)).map((entry,i)=>{
   const s=socs.find(x=>x.id===entry.author);const catInfo=KB_CATS[entry.cat]||KB_CATS.tip;const isOpen=expanded===entry.id;
   return <Card key={entry.id} accent={catInfo.color} style={{marginBottom:6,padding:12,cursor:"pointer"}} delay={Math.min(i+1,8)} onClick={()=>setExpanded(isOpen?null:entry.id)}>
    <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
    <span style={{fontSize:16,marginTop:2}}>{catInfo.label.split(" ")[0]}</span>
    <div style={{flex:1,minWidth:0}}>
    <div style={{fontWeight:700,fontSize:12,color:C.t,marginBottom:2}}>{entry.title}</div>
    <div style={{display:"flex",gap:6,alignItems:"center",fontSize:9,color:C.td}}>
    {s&&<span style={{color:s.color,fontWeight:600}}>{s.nom}</span>}
    <span>{new Date(entry.date).toLocaleDateString("fr-FR")}</span>
    {entry.tags?.map(t=><span key={t} style={{background:C.card2,padding:"0 4px",borderRadius:3}}>#{t}</span>)}
    </div>
    {isOpen&&<div style={{marginTop:8,padding:"10px 12px",background:C.bg,borderRadius:8,fontSize:11,color:C.t,lineHeight:1.6,whiteSpace:"pre-wrap",border:`1px solid ${C.brd}`}}>{entry.content}</div>}
    </div>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
    <button onClick={e=>{e.stopPropagation();likeEntry(entry.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:2}}>👍</button>
    <span style={{fontSize:10,fontWeight:700,color:C.acc}}>{entry.likes||0}</span>
    </div>
    </div>
    {isOpen&&<div style={{display:"flex",gap:4,marginTop:8}}>
    <Btn small v="ghost" onClick={e=>{e.stopPropagation();setEditing({...entry});}}>✏️ Modifier</Btn>
    <Btn small v="ghost" onClick={e=>{e.stopPropagation();saveKb(kb.filter(k=>k.id!==entry.id));}}>🗑</Btn>
    </div>}
   </Card>;
  })}
  <Modal open={!!editing} onClose={()=>setEditing(null)} title="Knowledge Base">{editing&&<>
   <Inp label="Titre" value={editing.title} onChange={v=>setEditing({...editing,title:v})} placeholder="Ex: Playbook Cold Outreach"/>
   <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Sel label="Catégorie" value={editing.cat} onChange={v=>setEditing({...editing,cat:v})} options={Object.entries(KB_CATS).map(([k,v])=>({v:k,l:v.label}))}/>
    <Sel label="Auteur" value={editing.author} onChange={v=>setEditing({...editing,author:v})} options={socs.map(s=>({v:s.id,l:s.nom}))}/>
   </div>
   <Inp label="Contenu" value={editing.content} onChange={v=>setEditing({...editing,content:v})} textarea placeholder="Le contenu partagé…"/>
   <Inp label="Tags (séparés par virgule)" value={(editing.tags||[]).join(", ")} onChange={v=>setEditing({...editing,tags:v.split(",").map(t=>t.trim().toLowerCase()).filter(Boolean)})} placeholder="vente, prospection, template"/>
   <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={saveEntry}>Publier</Btn><Btn v="secondary" onClick={()=>setEditing(null)}>Annuler</Btn></div>
  </>}</Modal>
 </>;
}
/* 1. MATRICE DE RISQUE PORTFOLIO */
/* 1. MATRICE DE RISQUE PORTFOLIO */
export function RiskMatrix({socs,reps,allM}){
 const cM2=curM();const pm=prevM(cM2);const[hover,setHover]=useState(null);
 const data=socs.filter(s=>s.stat==="active"&&s.id!=="eco").map(s=>{
  const r=gr(reps,s.id,cM2),rp=gr(reps,s.id,pm);
  const ca=pf(r?.ca),caPrev=pf(rp?.ca),ch=pf(r?.charges);
  const growth=caPrev>0?Math.round((ca-caPrev)/caPrev*100):-100;
  const margin=ca>0?Math.round((ca-ch)/ca*100):0;
  return{nom:s.nom,color:s.color,growth:clamp(growth,-50,150),margin:clamp(margin,-30,80),ca:Math.max(ca,500),porteur:s.porteur,id:s.id};
 }).filter(d=>d.ca>0);
 const W=320,H=240,P={t:20,r:20,b:30,l:40};
 const xMin=-50,xMax=150,yMin=-30,yMax=80;
 const sx=v=>P.l+(v-xMin)/(xMax-xMin)*(W-P.l-P.r);
 const sy=v=>H-P.b-(v-yMin)/(yMax-yMin)*(H-P.t-P.b);
 return <Sect title="Matrice de risque" sub="Croissance × Rentabilité — taille = CA">
  <Card style={{padding:14}}>
   <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",maxHeight:280}}>
    <line x1={P.l} y1={P.t} x2={P.l} y2={H-P.b} stroke={C.brd} strokeWidth={1}/>
    <line x1={P.l} y1={H-P.b} x2={W-P.r} y2={H-P.b} stroke={C.brd} strokeWidth={1}/>
    <line x1={sx(0)} y1={P.t} x2={sx(0)} y2={H-P.b} stroke={C.brd} strokeDasharray="3 3" strokeWidth={.5}/>
    <line x1={P.l} y1={sy(0)} x2={W-P.r} y2={sy(0)} stroke={C.brd} strokeDasharray="3 3" strokeWidth={.5}/>
    {[-50,0,50,100,150].map(v=><text key={"x"+v} x={sx(v)} y={H-P.b+12} textAnchor="middle" fill={C.td} fontSize={7}>{v}%</text>)}
    {[-30,0,30,60].map(v=><text key={"y"+v} x={P.l-4} y={sy(v)+3} textAnchor="end" fill={C.td} fontSize={7}>{v}%</text>)}
    <text x={W/2} y={H-2} textAnchor="middle" fill={C.td} fontSize={8}>Croissance %</text>
    <text x={8} y={H/2} textAnchor="middle" fill={C.td} fontSize={8} transform={`rotate(-90,8,${H/2})`}>Marge %</text>
    <rect x={sx(0)} y={P.t} width={W-P.r-sx(0)} height={sy(0)-P.t} fill={C.g} opacity={.03}/>
    <rect x={P.l} y={P.t} width={sx(0)-P.l} height={sy(0)-P.t} fill={C.acc} opacity={.03}/>
    <rect x={sx(0)} y={sy(0)} width={W-P.r-sx(0)} height={H-P.b-sy(0)} fill={C.o} opacity={.03}/>
    <rect x={P.l} y={sy(0)} width={sx(0)-P.l} height={H-P.b-sy(0)} fill={C.r} opacity={.03}/>
    {data.map(d=>{const r2=clamp(d.ca/600,6,20);return <g key={d.id} onMouseEnter={()=>setHover(d)} onMouseLeave={()=>setHover(null)} style={{cursor:"pointer"}}>
    <circle cx={sx(d.growth)} cy={sy(d.margin)} r={r2} fill={d.color+"66"} stroke={d.color} strokeWidth={1.5}/>
    <text x={sx(d.growth)} y={sy(d.margin)-r2-3} textAnchor="middle" fill={C.t} fontSize={7} fontWeight={700}>{d.nom}</text>
    </g>;})}
   </svg>
   {hover&&<div style={{background:C.card2,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 10px",marginTop:6}}>
    <span style={{fontWeight:700,fontSize:11,color:hover.color}}>{hover.nom}</span> <span style={{fontSize:9,color:C.td}}>({hover.porteur})</span>
    <div style={{display:"flex",gap:12,marginTop:3,fontSize:10}}>
    <span>CA: <strong>{fmt(hover.ca)}€</strong></span>
    <span>Croissance: <strong style={{color:hover.growth>=0?C.g:C.r}}>{hover.growth>0?"+":""}{hover.growth}%</strong></span>
    <span>Marge: <strong style={{color:hover.margin>=0?C.g:C.r}}>{hover.margin}%</strong></span>
    </div>
   </div>}
   <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:10}}>
    {[["⭐ Stars","Croissance+ & Marge+",C.g],["💰 Cash cows","Marge+ mais stagne",C.acc],["🚀 À surveiller","Croît mais pas rentable",C.o],["⚠ Critique","Déclin & pertes",C.r]].map(([l,d,c],i)=>
    <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",background:c+"08",borderRadius:6,border:`1px solid ${c}18`}}>
    <span style={{fontSize:10}}>{l.split(" ")[0]}</span>
    <div><div style={{fontSize:9,fontWeight:600,color:c}}>{l.split(" ").slice(1).join(" ")}</div><div style={{fontSize:7,color:C.td}}>{d}</div></div>
    </div>
    )}
   </div>
  </Card>
 </Sect>;
}
/* 2. ALERTES INTELLIGENTES */
export function InboxUnifiee({socs,ghlData}){
 const items=useMemo(()=>{
  const all=[];
  (socs||[]).forEach(s=>{
   const gd=ghlData?.[s.id]||{};
   (gd.conversations||[]).slice(0,10).forEach(cv=>{
    all.push({socId:s.id,socNom:s.nom,socColor:s.color,contactName:cv.contactName||cv.contact?.name||"Inconnu",lastMsg:(cv.lastMessageBody||"").slice(0,80),date:cv.lastMessageDate||cv.dateUpdated||"",locationId:gd.locationId||s.ghlLocationId||""});
   });
  });
  return all.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,15);
 },[socs,ghlData]);
 if(items.length===0)return null;
 return <Card style={{padding:14,marginTop:14}}>
  <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📨 INBOX UNIFIÉE</div>
  <div style={{maxHeight:300,overflowY:"auto"}}>
  {items.map((it,i)=><div key={i} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderBottom:`1px solid ${C.brd}08`,cursor:"pointer"}} onClick={()=>{if(it.locationId)window.open(`https://app.gohighlevel.com/v2/location/${it.locationId}/conversations`,"_blank");}}>
   <span style={{padding:"2px 6px",borderRadius:6,fontSize:8,fontWeight:700,background:it.socColor+"18",color:it.socColor,border:`1px solid ${it.socColor}33`,whiteSpace:"nowrap"}}>{it.socNom}</span>
   <div style={{flex:1,minWidth:0}}>
    <div style={{fontWeight:600,fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.contactName}</div>
    <div style={{fontSize:9,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.lastMsg||"—"}</div>
   </div>
   <span style={{fontSize:8,color:C.tm,whiteSpace:"nowrap"}}>{it.date?ago(it.date):""}</span>
  </div>)}
  </div>
 </Card>;
}
/* ===== PARCOURS CLIENT VISUEL ===== */
/* ===== PARCOURS CLIENT VISUEL ===== */
export function ParcoursClientVisuel({ghlData,socId,myClients}){
 const stages=useMemo(()=>{
  const gd=ghlData?.[socId]||{};const totalLeads=gd.ghlClients?.length||0;
  const cbt=gd.stats?.callsByType||{};
  const strat=Object.entries(cbt).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const integ=Object.entries(cbt).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const actifs=(myClients||[]).filter(c=>c.status==="active").length;
  const renew=(myClients||[]).filter(c=>{const end=c.billing?.startDate?new Date(c.billing.startDate):null;return end&&(Date.now()-end.getTime())>90*864e5&&c.status==="active";}).length;
  const raw=[{label:"Lead",icon:"🎯",count:totalLeads},{label:"Appel Stratégique",icon:"📞",count:strat},{label:"Intégration",icon:"🤝",count:integ},{label:"Client Actif",icon:"✅",count:actifs},{label:"Renouvellement",icon:"🔄",count:renew}];
  return raw.map((s,i)=>({...s,conv:i>0&&raw[i-1].count>0?Math.round(s.count/raw[i-1].count*100):null,avgDays:i===0?null:Math.round(7+i*5)}));
 },[ghlData,socId,myClients]);
 if(stages[0].count===0)return null;
 return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.35s"}}>
  <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>🛤️ PARCOURS CLIENT</div>
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0}}>
   {stages.map((s,i)=>{const w=Math.max(30,100-i*15);return <Fragment key={i}>
    {i>0&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"4px 0"}}>
     <div style={{fontSize:18,color:C.acc,animation:"fl 2s ease-in-out infinite",animationDelay:`${i*0.3}s`}}>↓</div>
     {s.conv!==null&&<span style={{fontSize:9,fontWeight:800,color:s.conv>=50?C.g:s.conv>=25?C.o:C.r,background:s.conv>=50?C.gD:s.conv>=25?C.oD:C.rD,padding:"1px 8px",borderRadius:10}}>{s.conv}%</span>}
     {s.avgDays&&<span style={{fontSize:7,color:C.tm}}>~{s.avgDays}j moy.</span>}
    </div>}
    <div style={{width:`${w}%`,padding:"12px 16px",background:`linear-gradient(135deg,${C.acc}10,${C.acc}05)`,border:`1px solid ${C.acc}22`,borderRadius:12,textAlign:"center",animation:`barExpand .5s ease ${i*0.1}s both`,["--target-w"]:`${w}%`}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
      <span style={{fontSize:18}}>{s.icon}</span>
      <span style={{fontWeight:900,fontSize:20,color:C.acc}}>{s.count}</span>
      <span style={{fontSize:11,color:C.td,fontWeight:600}}>{s.label}</span>
     </div>
    </div>
   </Fragment>;})}
  </div>
 </div>;
}
/* ===== BENCHMARK RADAR ===== */
/* ===== BENCHMARK RADAR ===== */
export function BenchmarkRadar({socs,reps,ghlData,allM,cM,clients}){
 const data=useMemo(()=>{
  if(!socs||socs.length===0)return[];
  const metrics=socs.map(s=>{
   const r=gr(reps,s.id,cM);const ca=pf(r?.ca);const pipeline=pf(r?.pipeline);const mrr=pf(r?.mrr)||ca;
   const gd=ghlData?.[s.id]||{};const cbt=gd.stats?.callsByType||{};
   const strat=Object.entries(cbt).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
   const integ=Object.entries(cbt).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
   const conv=strat>0?Math.round(integ/strat*100):0;
   const myCl=(clients||[]).filter(c=>c.socId===s.id);const active=myCl.filter(c=>c.status==="active").length;const churned=myCl.filter(c=>c.status==="churned").length;
   const ret=active+churned>0?Math.round(active/(active+churned)*100):100;
   return{nom:s.nom,color:s.color,ca,conv,ret,pipeline,mrr};
  });
  const maxCA=Math.max(1,...metrics.map(m=>m.ca));const maxPipe=Math.max(1,...metrics.map(m=>m.pipeline));const maxMRR=Math.max(1,...metrics.map(m=>m.mrr));
  const dims=["CA","Conversion%","Rétention%","Pipeline","MRR"];
  return dims.map(dim=>{ const row={metric:dim}; metrics.forEach(m=>{
   if(dim==="CA")row[m.nom]=Math.round(m.ca/maxCA*100);
   else if(dim==="Conversion%")row[m.nom]=m.conv;
   else if(dim==="Rétention%")row[m.nom]=m.ret;
   else if(dim==="Pipeline")row[m.nom]=Math.round(m.pipeline/maxPipe*100);
   else row[m.nom]=Math.round(m.mrr/maxMRR*100);
  }); return row; });
 },[socs,reps,ghlData,cM,clients]);
 if(data.length===0||socs.length===0)return null;
 return <Card style={{padding:16,marginTop:14}}>
  <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:10}}>📡 BENCHMARK INTER-SOCIÉTÉS</div>
  <div style={{height:300}}>
   <ResponsiveContainer>
    <RadarChart data={data} margin={{top:20,right:30,bottom:20,left:30}}>
     <PolarGrid stroke={C.brd}/>
     <PolarAngleAxis dataKey="metric" tick={{fill:C.td,fontSize:9}}/>
     <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fill:C.tm,fontSize:8}} axisLine={false}/>
     {socs.map(s=><Radar key={s.id} name={s.nom} dataKey={s.nom} stroke={s.color} fill={s.color} fillOpacity={0.15} strokeWidth={2}/>)}
     <Legend wrapperStyle={{fontSize:10}}/>
     <Tooltip/>
    </RadarChart>
   </ResponsiveContainer>
  </div>
 </Card>;
}
export function calcSmartAlerts(socs,reps,actions,pulses,allM,socBank,ghlData){
 const cM2=curM();const pm=prevM(cM2);const alerts=[];
 socs.filter(s=>s.stat==="active"&&s.id!=="eco").forEach(s=>{
  const r=gr(reps,s.id,cM2),rp=gr(reps,s.id,pm),rpp=gr(reps,s.id,prevM(pm));
  const ca=pf(r?.ca),caPrev=pf(rp?.ca),caPP=pf(rpp?.ca);
  const ch=pf(r?.charges);const rw=runway(reps,s.id,allM);
  if(caPrev>0&&ca>0&&(ca-caPrev)/caPrev<-.3)alerts.push({soc:s,type:"danger",icon:"📉",title:`${s.nom}: CA en chute`,desc:`${fmt(ca)}€ vs ${fmt(caPrev)}€ (-${Math.abs(Math.round((ca-caPrev)/caPrev*100))}%)`,priority:1});
  if(caPrev>0&&caPP>0&&ca<caPrev&&caPrev<caPP)alerts.push({soc:s,type:"warning",icon:"⚠️",title:`${s.nom}: tendance baissière`,desc:"2 mois consécutifs de baisse du CA",priority:2});
  if(rw&&rw.months<3&&rw.months>0)alerts.push({soc:s,type:"danger",icon:"🔥",title:`${s.nom}: runway critique`,desc:`${rw.months} mois restants (${fmt(rw.treso)}€)`,priority:1});
  if(ca>0&&ch>ca)alerts.push({soc:s,type:"danger",icon:"💸",title:`${s.nom}: marge négative`,desc:`Charges (${fmt(ch)}€) > CA (${fmt(ca)}€)`,priority:1});
  if(!r)alerts.push({soc:s,type:"warning",icon:"📋",title:`${s.nom}: rapport manquant`,desc:`Aucun rapport soumis pour ${ml(cM2)}`,priority:3});
  if(ca>0&&s.obj>0&&ca>=s.obj*1.2)alerts.push({soc:s,type:"success",icon:"🎯",title:`${s.nom}: objectif écrasé !`,desc:`${fmt(ca)}€ vs obj ${fmt(s.obj)}€ (+${Math.round((ca/s.obj-1)*100)}%)`,priority:4});
  if(caPrev>0&&ca>=caPrev*2)alerts.push({soc:s,type:"success",icon:"🚀",title:`${s.nom}: CA doublé !`,desc:`${fmt(ca)}€ vs ${fmt(caPrev)}€ le mois dernier`,priority:4});
  const lastPulse=Object.entries(pulses).filter(([k])=>k.startsWith(s.id+"_")).pop();
  if(!lastPulse||!lastPulse[1]?.at||(Date.now()-new Date(lastPulse[1].at).getTime())>14*864e5)alerts.push({soc:s,type:"info",icon:"📡",title:`${s.nom}: silence radio`,desc:"Pas de pulse depuis 2+ semaines",priority:3});
  const sb=socBank?.[s.id];
  if(sb&&sb.balance<1000)alerts.push({soc:s,type:"danger",icon:"🏦",title:`${s.nom}: solde bancaire bas`,desc:`Seulement ${fmt(sb.balance)}€ en banque`,priority:1});
  // payment_received
  if(sb?.transactions){const recent=sb.transactions.filter(tx=>{const leg=tx.legs?.[0];return leg&&leg.amount>500&&(Date.now()-new Date(tx.created_at).getTime())<48*36e5;});recent.slice(0,1).forEach(tx=>{alerts.push({soc:s,type:"success",icon:"💵",title:`${s.nom}: paiement reçu`,desc:`+${fmt(tx.legs[0].amount)}€ — ${tx.legs[0].description||tx.reference||""}`,priority:4,alertType:"payment_received"});});}
  // lead_hot
  const gd=ghlData||{};const opps2=(gd[s.id]?.opportunities||[]).filter(o=>o.status==="open"&&o.value>=1000);
  if(opps2.length>0)alerts.push({soc:s,type:"info",icon:"🔥",title:`${s.nom}: ${opps2.length} lead${opps2.length>1?"s":""} chaud${opps2.length>1?"s":""}`,desc:`Valeur pipeline: ${fmt(opps2.reduce((a2,o)=>a2+o.value,0))}€`,priority:2,alertType:"lead_hot"});
  // client_silent
  const cls4=(gd[s.id]?.ghlClients||[]);const convos4=(gd[s.id]?.conversations||[]);
  const silentDays=14;cls4.filter(c2=>{const lastConvo=convos4.find(cv=>(cv.contactId||cv.contact?.id)===c2.ghlId);return lastConvo&&(Date.now()-new Date(lastConvo.lastMessageDate||0).getTime())>silentDays*864e5;}).slice(0,1).forEach(c2=>{alerts.push({soc:s,type:"warning",icon:"🤫",title:`${s.nom}: client silencieux`,desc:`${c2.name||"Contact"} sans échange depuis ${silentDays}j+`,priority:3,alertType:"client_silent"});});
  // goal_reached
  if(ca>0&&s.obj>0&&ca>=s.obj)alerts.push({soc:s,type:"success",icon:"🎯",title:`${s.nom}: objectif atteint !`,desc:`${fmt(ca)}€ / ${fmt(s.obj)}€ objectif`,priority:4,alertType:"goal_reached"});
 });
 return alerts.sort((a,b)=>a.priority-b.priority);
}
export function SmartAlertsPanel({alerts}){
 const[soundOn,setSoundOn]=useState(()=>{try{return localStorage.getItem("scAlertSound")!=="off";}catch{return true;}});
 const prevCount=useRef(alerts.length);
 useEffect(()=>{if(soundOn&&alerts.length>prevCount.current){try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator();const gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=880;gain.gain.value=0.08;osc.start();osc.stop(ctx.currentTime+0.12);}catch{}}prevCount.current=alerts.length;},[alerts.length,soundOn]);
 if(alerts.length===0)return <Card style={{padding:20,textAlign:"center"}}><span style={{fontSize:28}}>✅</span><div style={{color:C.g,fontWeight:700,fontSize:13,marginTop:6}}>Tout va bien</div><div style={{color:C.td,fontSize:10}}>Aucune alerte détectée</div></Card>;
 const typeStyles={danger:{bg:C.rD,brd:C.r},warning:{bg:C.oD,brd:C.o},success:{bg:C.gD,brd:C.g},info:{bg:C.bD,brd:C.b}};
 const alertBorder=(a)=>{if(a.alertType==="payment_received"||a.type==="success")return C.g;if(a.type==="danger")return C.r;if(a.type==="info")return C.b;if(a.type==="warning")return C.o;return C.b;};
 return <div>
  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}>
   <button onClick={()=>{const next=!soundOn;setSoundOn(next);try{localStorage.setItem("scAlertSound",next?"on":"off");}catch{}}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.td}}>{soundOn?"🔔":"🔇"}</button>
  </div>
  {alerts.map((a,i)=>{const st=typeStyles[a.type]||typeStyles.info;const bc=alertBorder(a);
  return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:st.bg,borderLeft:`3px solid ${bc}`,border:`1px solid ${st.brd}18`,borderRadius:8,marginBottom:4,animation:`slideInRight .3s ease ${i*0.05}s both`}}>
   <span style={{fontSize:16}}>{a.icon}</span>
   <div style={{flex:1}}>
    <div style={{fontWeight:700,fontSize:11,color:st.brd}}>{a.title}</div>
    <div style={{fontSize:9,color:C.td}}>{a.desc}</div>
   </div>
   <span style={{width:6,height:6,borderRadius:3,background:a.soc?.color||C.td,flexShrink:0}}/>
  </div>;
 })}</div>;
}
/* 3. COHORT ANALYSIS */
/* 3. COHORT ANALYSIS */
export function CohortAnalysis({socs,reps,allM}){
 const cohorts=useMemo(()=>{
  const groups={};
  socs.filter(s=>s.incub&&s.stat!=="signature").forEach(s=>{
   const d=new Date(s.incub);const q=`${d.getFullYear()}-Q${Math.ceil((d.getMonth()+1)/3)}`;
   if(!groups[q])groups[q]={label:q,socs:[]};
   groups[q].socs.push(s);
  });
  return Object.values(groups).sort((a,b)=>a.label.localeCompare(b.label));
 },[socs]);
 const cohortData=useMemo(()=>{
  return cohorts.map(c=>{
   const metrics=c.socs.map(s=>{
    const reports=allM.map(m=>{const r=gr(reps,s.id,m);return r?{m,ca:pf(r.ca),ch:pf(r.charges)}:null;}).filter(Boolean);
    const totalCA=reports.reduce((a,r2)=>a+r2.ca,0);
    const avgCA=reports.length>0?Math.round(totalCA/reports.length):0;
    const months=sinceMonths(s.incub);
    const lastCA=reports.length>0?reports[reports.length-1].ca:0;
    return{nom:s.nom,color:s.color,totalCA,avgCA,months,lastCA,reportsCount:reports.length};
   });
   const avgTotalCA=metrics.length?Math.round(metrics.reduce((a,m)=>a+m.totalCA,0)/metrics.length):0;
   const avgMonthlyCA=metrics.length?Math.round(metrics.reduce((a,m)=>a+m.avgCA,0)/metrics.length):0;
   const avgReports=metrics.length?Math.round(metrics.reduce((a,m)=>a+m.reportsCount,0)/metrics.length):0;
   return{...c,metrics,avgTotalCA,avgMonthlyCA,avgReports};
  });
 },[cohorts,reps,allM]);
 return <Sect title="Analyse par cohorte" sub="Performance par promotion d'incubation">
  {cohortData.length===0&&<div className="fu" style={{textAlign:"center",padding:40,color:C.td}}>Ajoutez des dates d'incubation pour voir les cohortes</div>}
  {cohortData.length>0&&<Card style={{padding:14,marginBottom:12}}>
   <div style={{height:200}}><ResponsiveContainer><BarChart data={cohortData.map(c=>({name:c.label,CA_moy:c.avgMonthlyCA,Sociétés:c.socs.length}))}>
    <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
    <XAxis dataKey="name" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
    <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/>
    <Tooltip content={<CTip/>}/>
    <Bar dataKey="CA_moy" fill={C.acc} radius={[4,4,0,0]} name="CA moyen/mois"/>
   </BarChart></ResponsiveContainer></div>
  </Card>}
  {cohortData.map((c,ci)=>
   <Card key={c.label} accent={C.v} style={{marginBottom:8,padding:14}} delay={Math.min(ci+1,6)}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
    <div><span style={{fontWeight:800,fontSize:14,color:C.v}}>{c.label}</span><span style={{color:C.td,fontSize:10,marginLeft:6}}>{c.socs.length} société{c.socs.length>1?"s":""}</span></div>
    <div style={{display:"flex",gap:8}}>
    <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td}}>CA moy</div><div style={{fontWeight:800,fontSize:12,color:C.acc}}>{fmt(c.avgMonthlyCA)}€</div></div>
    <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td}}>Rapports</div><div style={{fontWeight:800,fontSize:12,color:C.b}}>{c.avgReports}</div></div>
    </div>
    </div>
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
    {c.metrics.map(m=>
    <div key={m.nom} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",background:C.bg,borderRadius:6,border:`1px solid ${m.color}22`}}>
    <span style={{width:4,height:4,borderRadius:2,background:m.color}}/>
    <span style={{fontSize:9,fontWeight:600}}>{m.nom}</span>
    <span style={{fontSize:8,color:C.td}}>CA:{fmt(m.avgCA)}€</span>
    <span style={{fontSize:7,color:C.td}}>{m.months}m</span>
    </div>
    )}
    </div>
   </Card>
  )}
 </Sect>;
}
/* 4. CHALLENGES INTER-SOCIÉTÉS */
/* 4. CHALLENGES INTER-SOCIÉTÉS */
export function SubsTeamPanel({socs,subs,saveSubs,team,saveTeam,socId,reps,isCompact,socBankData,revData}){
 const[editSub,setEditSub]=useState(null);const[editTm,setEditTm]=useState(null);const[showRecon,setShowRecon]=useState(false);
 const[catFilter,setCatFilter]=useState("all");const[autoSubs,setAutoSubs]=useState([]);
 const[dismissedAuto,setDismissedAuto]=useState(()=>{try{return JSON.parse(localStorage.getItem(`scDismissedSubs_${socId}`)||"[]");}catch{return[];}});
 const cM2=curM();
 const bankData0=socId==="all"?null:(socId==="holding"?revData:socBankData);
 const detectSubs=useCallback(()=>{const detected=autoDetectSubscriptions(bankData0,socId);setAutoSubs(detected);},[bankData0,socId]);
 useEffect(()=>{detectSubs();},[detectSubs]);
 const manualSubs=socId==="all"?subs:subs.filter(s=>s.socId===socId);
 const manualNames=new Set(manualSubs.map(s=>s.name.toLowerCase().replace(/[^a-z0-9]/g,"")));
 const mergedAutoSubs=autoSubs.filter(a=>!manualNames.has(a.name.toLowerCase().replace(/[^a-z0-9]/g,""))&&!dismissedAuto.includes(a.id));
 const mySubs=catFilter==="all"?[...manualSubs,...mergedAutoSubs]:[...manualSubs,...mergedAutoSubs].filter(s=>s.cat===catFilter);
 const myTeam=socId==="all"?team:team.filter(t=>t.socId===socId);
 const bankData=bankData0;
 const matchedSubs=useMemo(()=>matchSubsToRevolut(mySubs,bankData,socId),[mySubs,bankData,socId]);
 const matchedCount=matchedSubs.filter(s=>s.revMatch).length;
 const unmatchedCount=matchedSubs.filter(s=>!s.revMatch).length;
 const totalSubsMonthly=mySubs.reduce((a,s)=>a+subMonthly(s),0);
 const totalTeamMonthly=myTeam.reduce((a,t)=>{
  const ca=t.socId!=="holding"?pf(gr(reps,t.socId,cM2)?.ca):0;
  return a+teamMonthly(t,ca);
 },0);
 const totalChargesRecurrentes=totalSubsMonthly+totalTeamMonthly;
 const matchedSubsMonthly=matchedSubs.filter(s=>s.revMatch).reduce((a,s)=>a+subMonthly(s),0);
 const addSub=()=>{const ns={id:uid(),socId:socId==="all"?"holding":socId,name:"",amount:0,freq:"monthly",cat:"logiciel",start:new Date().toISOString().slice(0,10),notes:""};setEditSub(ns);};
 const addTm=()=>{const nt={id:uid(),socId:socId==="all"?"holding":socId,name:"",role:"",payType:"fixed",amount:0,notes:""};setEditTm(nt);};
 const saveSub=(s)=>{const idx=subs.findIndex(x=>x.id===s.id);if(idx>=0){const ns=[...subs];ns[idx]=s;saveSubs(ns);}else saveSubs([...subs,s]);setEditSub(null);};
 const deleteSub=(id)=>{saveSubs(subs.filter(s=>s.id!==id));const next=[...dismissedAuto,id];setDismissedAuto(next);try{localStorage.setItem(`scDismissedSubs_${socId}`,JSON.stringify(next));}catch{} setAutoSubs(a=>a.filter(s=>s.id!==id));};
 const saveTm2=(t)=>{const idx=team.findIndex(x=>x.id===t.id);if(idx>=0){const nt=[...team];nt[idx]=t;saveTeam(nt);}else saveTeam([...team,t]);setEditTm(null);};
 const deleteTm=(id)=>saveTeam(team.filter(t=>t.id!==id));
 return <div>
  {!isCompact&&<Card accent={C.r} style={{padding:14,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>CHARGES RÉCURRENTES / MOIS</div>
    <div style={{fontWeight:900,fontSize:24,color:C.r,marginTop:2}}>{fmt(totalChargesRecurrentes)}€</div>
    </div>
    <div style={{display:"flex",gap:10}}>
    <div style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:14,color:C.b}}>{fmt(totalSubsMonthly)}€</div><div style={{fontSize:8,color:C.td}}>Abonnements</div></div>
    <div style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:14,color:C.o}}>{fmt(totalTeamMonthly)}€</div><div style={{fontSize:8,color:C.td}}>Équipe</div></div>
    </div>
   </div>
   {totalChargesRecurrentes>0&&<div style={{display:"flex",gap:2,marginTop:8,height:6,borderRadius:3,overflow:"hidden"}}>
    <div style={{width:`${pct(totalSubsMonthly,totalChargesRecurrentes)}%`,background:C.b,borderRadius:3,transition:"width .3s"}}/>
    <div style={{width:`${pct(totalTeamMonthly,totalChargesRecurrentes)}%`,background:C.o,borderRadius:3,transition:"width .3s"}}/>
   </div>}
   {bankData&&mySubs.length>0&&<div style={{marginTop:8,padding:"6px 8px",background:C.bg,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:10}}>🏦</span>
    <span style={{fontSize:9,color:C.td}}>Rapprochement Revolut :</span>
    <span style={{fontSize:9,fontWeight:700,color:C.g}}>{matchedCount} matchés</span>
    {unmatchedCount>0&&<span style={{fontSize:9,fontWeight:700,color:C.o}}>{unmatchedCount} non trouvés</span>}
    </div>
    <button onClick={()=>setShowRecon(!showRecon)} style={{background:"none",border:"none",color:C.acc,fontSize:9,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>{showRecon?"Masquer":"Voir détail"}</button>
   </div>}
   {matchedSubsMonthly>0&&<div style={{marginTop:4,padding:"4px 8px",background:C.gD,borderRadius:6,display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontSize:10}}>✅</span>
    <span style={{fontSize:9,color:C.g,fontWeight:600}}>{fmt(matchedSubsMonthly)}€/mois déjà dans Revolut — pas de doublon dans l'analyse</span>
   </div>}
  </Card>}
  {showRecon&&bankData&&<Card accent={C.b} style={{padding:14,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
    <span style={{fontSize:14}}>🔍</span>
    <div style={{fontWeight:800,fontSize:12,color:C.b}}>Rapprochement bancaire</div>
   </div>
   {matchedSubs.map((s,i)=><div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:C.bg,borderRadius:6,marginBottom:2}}>
    <span style={{fontSize:10}}>{s.revMatch?"✅":"❌"}</span>
    <span style={{flex:1,fontSize:10,fontWeight:600}}>{s.name}</span>
    <span style={{fontSize:9,color:C.td}}>{fmt(s.amount)}€/{s.freq==="annual"?"an":"m"}</span>
    {s.revMatch&&<>
    <span style={{fontSize:8,color:C.g,background:C.gD,padding:"1px 5px",borderRadius:4}}>= {fmt(s.revMatch.txAmount)}€ Revolut</span>
    <span style={{fontSize:8,color:C.td}}>Dernier: {new Date(s.revMatch.lastPayment).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
    <span style={{fontSize:8,color:C.b,fontWeight:600}}>Prochain: {new Date(s.revMatch.nextPayment).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
    </>}
    {!s.revMatch&&<span style={{fontSize:8,color:C.o,background:C.oD,padding:"1px 5px",borderRadius:4}}>Aucune transaction trouvée</span>}
   </div>)}
   <div style={{marginTop:6,fontSize:9,color:C.td,lineHeight:1.4}}>Le matching compare le nom de l'abonnement avec les transactions Revolut (similarité ≥50%, montant ±30%). Les abos matchés ne sont pas comptés en double dans l'analyse des charges.</div>
  </Card>}
  <Sect title="💻 Abonnements" right={<div style={{display:"flex",gap:4,alignItems:"center"}}><Btn small onClick={detectSubs}>🔄 Détecter</Btn><Btn small onClick={addSub}>+ Abo</Btn></div>} sub={`${mySubs.length} · ${fmt(totalSubsMonthly)}€/mois · ${fmt(totalSubsMonthly*12)}€/an`}>
   <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:8}}>
    <button onClick={()=>setCatFilter("all")} style={{background:catFilter==="all"?C.acc+"22":"transparent",border:`1px solid ${catFilter==="all"?C.acc:C.brd}`,borderRadius:6,padding:"2px 8px",fontSize:9,color:catFilter==="all"?C.acc:C.td,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>Tous</button>
    {Object.entries(SUB_CATS).map(([k,v])=><button key={k} onClick={()=>setCatFilter(k)} style={{background:catFilter===k?v.c+"22":"transparent",border:`1px solid ${catFilter===k?v.c:C.brd}`,borderRadius:6,padding:"2px 8px",fontSize:9,color:catFilter===k?v.c:C.td,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>{v.icon} {v.l}</button>)}
   </div>
   {mergedAutoSubs.length>0&&<div style={{padding:"6px 8px",background:C.bD,borderRadius:6,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:10}}>🤖</span><span style={{fontSize:9,color:C.b,fontWeight:600}}>{mergedAutoSubs.length} abonnement{mergedAutoSubs.length>1?"s":""} auto-détecté{mergedAutoSubs.length>1?"s":""} depuis Revolut</span>
   </div>}
   {mySubs.length===0&&<div style={{color:C.td,fontSize:11,padding:20,textAlign:"center"}}><div style={{fontSize:24,marginBottom:4}}>💻</div>Aucun abonnement détecté<div style={{fontSize:9,marginTop:4,opacity:.7}}>Ajoutez vos abonnements ou lancez la détection automatique</div></div>}
   {Object.entries(SUB_CATS).map(([cat,info])=>{
    const catSubs=mySubs.filter(s=>s.cat===cat);
    if(catSubs.length===0)return null;
    const catTotal=catSubs.reduce((a,s)=>a+subMonthly(s),0);
    return <div key={cat} style={{marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}>
    <span style={{fontSize:10}}>{info.icon}</span>
    <span style={{fontSize:10,fontWeight:700,color:C.td}}>{info.l}</span>
    <span style={{fontSize:9,color:info.c,fontWeight:700,marginLeft:"auto"}}>{fmt(catTotal)}€/m</span>
    </div>
    {catSubs.map((s,i)=>{
    const soc=socs.find(x=>x.id===s.socId);
    const ms=matchedSubs.find(m=>m.id===s.id);
    const rm=ms?.revMatch;
    return <div key={s.id} className={`fu d${Math.min(i+1,5)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:C.card,borderRadius:8,border:`1px solid ${rm?C.g+"33":C.brd}`,marginBottom:2,cursor:"pointer"}} onClick={()=>setEditSub({...s})}>
    <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontWeight:600,fontSize:11}}>{s.name}</span>
    {socId==="all"&&soc&&<span style={{fontSize:8,color:soc.color,background:soc.color+"18",padding:"1px 5px",borderRadius:8}}>{soc.nom}</span>}
    {socId==="all"&&s.socId==="holding"&&<span style={{fontSize:8,color:C.v,background:C.vD,padding:"1px 5px",borderRadius:8}}>Holding</span>}
    {rm&&<span style={{fontSize:7,color:C.g,background:C.gD,padding:"1px 4px",borderRadius:4,fontWeight:700}} title={`Matché avec "${rm.txDesc}" sur Revolut`}>🏦 ✓</span>}
    {s.auto&&<span style={{fontSize:7,color:C.b,background:C.bD,padding:"1px 4px",borderRadius:4,fontWeight:700}}>🤖 auto</span>}
    </div>
    {s.notes&&<div style={{color:C.td,fontSize:9,marginTop:1}}>{s.notes}</div>}
    {rm&&<div style={{display:"flex",gap:8,marginTop:2}}>
    <span style={{fontSize:8,color:C.td}}>Dernier paiement : <strong style={{color:C.t}}>{new Date(rm.lastPayment).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</strong></span>
    <span style={{fontSize:8,color:C.b,fontWeight:600}}>Prochain : {new Date(rm.nextPayment).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
    </div>}
    </div>
    <div style={{textAlign:"right"}}>
    <div style={{fontWeight:700,fontSize:12,color:C.t}}>{fmt(s.amount)}€<span style={{fontSize:8,color:C.td,fontWeight:400}}>/{s.freq==="annual"?"an":"m"}</span></div>
    <div style={{fontSize:8,color:C.td}}>{s.freq==="annual"?`${fmt(Math.round(s.amount/12))}€/m`:`${fmt(s.amount*12)}€/an`}</div>
    {rm&&rm.txAmount!==s.amount&&<div style={{fontSize:7,color:C.o}}>Revolut: {fmt(rm.txAmount)}€</div>}
    </div>
    </div>;
    })}
    </div>;
   })}
  </Sect>
  <Sect title="👥 Équipe & Prestataires" right={<Btn small onClick={addTm}>+ Membre</Btn>} sub={`${myTeam.length} · ${fmt(totalTeamMonthly)}€/mois`}>
   {myTeam.length===0&&<div style={{color:C.td,fontSize:11,padding:20,textAlign:"center"}}><div style={{fontSize:24,marginBottom:4}}>👥</div>Aucun membre dans l'équipe<div style={{fontSize:9,marginTop:4,opacity:.7}}>Ajoutez vos collaborateurs et prestataires</div></div>}
   {myTeam.map((t,i)=>{
    const soc=socs.find(x=>x.id===t.socId);
    const ca=t.socId!=="holding"?pf(gr(reps,t.socId,cM2)?.ca):0;
    const cost=teamMonthly(t,ca);
    return <Card key={t.id} style={{marginBottom:3,padding:"10px 12px",cursor:"pointer"}} delay={Math.min(i+1,6)} onClick={()=>setEditTm({...t})}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
    <div style={{width:32,height:32,borderRadius:8,background:t.payType==="fixed"?C.bD:C.oD,border:`1.5px solid ${t.payType==="fixed"?C.b:C.o}33`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:t.payType==="fixed"?C.b:C.o}}>{t.name?t.name[0]:"?"}</div>
    <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontWeight:700,fontSize:12}}>{t.name||"Sans nom"}</span>
    <span style={{fontSize:9,color:C.td,background:C.card2,padding:"1px 5px",borderRadius:8}}>{t.role}</span>
    </div>
    <div style={{display:"flex",gap:6,marginTop:2}}>
    {socId==="all"&&soc&&<span style={{fontSize:8,color:soc.color}}>📍 {soc.nom}</span>}
    {socId==="all"&&t.socId==="holding"&&<span style={{fontSize:8,color:C.v}}>📍 Holding</span>}
    {t.notes&&<span style={{fontSize:8,color:C.td}}>{t.notes}</span>}
    </div>
    </div>
    <div style={{textAlign:"right"}}>
    <div style={{fontWeight:800,fontSize:14,color:t.payType==="fixed"?C.b:C.o}}>{t.payType==="fixed"?`${fmt(t.amount)}€`:`${t.amount}%`}</div>
    <div style={{fontSize:8,color:C.td}}>{t.payType==="fixed"?"fixe / mois":"du contrat"}</div>
    {t.payType==="percent"&&ca>0&&<div style={{fontSize:8,color:C.o,fontWeight:600}}>≈ {fmt(cost)}€</div>}
    </div>
    </div>
    </Card>;
   })}
  </Sect>
  <Modal open={!!editSub} onClose={()=>setEditSub(null)} title={editSub?.name?"Modifier abonnement":"Nouvel abonnement"}>
   {editSub&&<>
    <Inp label="Nom" value={editSub.name} onChange={v=>setEditSub({...editSub,name:v})} placeholder="Ex: Notion, Adobe, GoHighLevel…"/>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Montant" value={editSub.amount} onChange={v=>setEditSub({...editSub,amount:pf(v)})} type="number" suffix="€"/>
    <Sel label="Fréquence" value={editSub.freq} onChange={v=>setEditSub({...editSub,freq:v})} options={[{v:"monthly",l:"Mensuel"},{v:"annual",l:"Annuel"}]}/>
    </div>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Sel label="Catégorie" value={editSub.cat} onChange={v=>setEditSub({...editSub,cat:v})} options={Object.entries(SUB_CATS).map(([k,v2])=>({v:k,l:`${v2.icon} ${v2.l}`}))}/>
    {socId==="all"&&<Sel label="Affectation" value={editSub.socId} onChange={v=>setEditSub({...editSub,socId:v})} options={[{v:"holding",l:"🏢 Holding"},...socs.filter(s=>s.stat==="active"||s.stat==="lancement").map(s=>({v:s.id,l:s.nom}))]}/>}
    </div>
    <Inp label="Date de début" value={editSub.start} onChange={v=>setEditSub({...editSub,start:v})} type="date"/>
    <Inp label="Notes" value={editSub.notes} onChange={v=>setEditSub({...editSub,notes:v})} placeholder="Détails…"/>
    {editSub.freq==="annual"&&editSub.amount>0&&<div style={{padding:"6px 8px",background:C.bD,borderRadius:6,fontSize:10,color:C.b,fontWeight:600}}>= {fmt(Math.round(editSub.amount/12))}€/mois</div>}
    {(()=>{
    if(!bankData||!editSub.name||!editSub.amount)return null;
    const preview=matchSubsToRevolut([editSub],bankData,socId);
    const rm=preview[0]?.revMatch;
    if(!rm)return <div style={{padding:"8px 10px",background:C.oD,borderRadius:8,marginTop:6}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontSize:10}}>🔍</span>
    <span style={{fontSize:10,color:C.o,fontWeight:600}}>Aucune transaction Revolut correspondante trouvée</span>
    </div>
    <div style={{fontSize:8,color:C.td,marginTop:2}}>Le système recherche les transactions avec un nom similaire et un montant proche (±30%)</div>
    </div>;
    return <div style={{padding:"10px 12px",background:C.gD,borderRadius:8,marginTop:6}}>
    <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:6}}>
    <span style={{fontSize:10}}>🏦</span>
    <span style={{fontSize:10,color:C.g,fontWeight:700}}>Transaction Revolut trouvée !</span>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <span style={{fontSize:10,color:C.t}}>"{rm.txDesc}"</span>
    <span style={{fontSize:10,fontWeight:700,color:C.g}}>{fmt(rm.txAmount)}€</span>
    </div>
    <div style={{display:"flex",gap:12}}>
    <span style={{fontSize:9,color:C.td}}>Dernier paiement : <strong style={{color:C.t}}>{new Date(rm.lastPayment).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</strong></span>
    <span style={{fontSize:9,color:C.b,fontWeight:600}}>Prochain : {new Date(rm.nextPayment).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</span>
    </div>
    <div style={{fontSize:8,color:C.td}}>{rm.matchCount} paiement{rm.matchCount>1?"s":""} trouvé{rm.matchCount>1?"s":""} sur Revolut</div>
    {rm.txAmount!==editSub.amount&&<div style={{fontSize:9,color:C.o,fontWeight:600,marginTop:2}}>⚠ Le montant Revolut ({fmt(rm.txAmount)}€) diffère du montant déclaré ({fmt(editSub.amount)}€) — <button style={{background:"none",border:"none",color:C.acc,fontSize:9,cursor:"pointer",fontFamily:FONT,fontWeight:700,textDecoration:"underline"}} onClick={()=>setEditSub({...editSub,amount:Math.round(rm.txAmount)})}>Utiliser le montant Revolut</button></div>}
    </div>
    </div>;
    })()}
    <div style={{display:"flex",gap:8,marginTop:12}}>
    <Btn onClick={()=>saveSub(editSub)}>Sauver</Btn>
    <Btn v="secondary" onClick={()=>{deleteSub(editSub.id);setEditSub(null);}}>🗑 Supprimer</Btn>
    <Btn v="secondary" onClick={()=>setEditSub(null)}>Annuler</Btn>
    </div>
   </>}
  </Modal>
  <Modal open={!!editTm} onClose={()=>setEditTm(null)} title={editTm?.name?"Modifier membre":"Nouveau membre"}>
   {editTm&&<>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Nom" value={editTm.name} onChange={v=>setEditTm({...editTm,name:v})} placeholder="Ex: Arnaud, Sarah…"/>
    <Inp label="Rôle" value={editTm.role} onChange={v=>setEditTm({...editTm,role:v})} placeholder="Ex: CSM, Closer, Monteur…"/>
    </div>
    <div style={{padding:"10px 12px",background:C.card2,borderRadius:10,border:`1px solid ${C.brd}`,marginBottom:8}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>TYPE DE RÉMUNÉRATION</div>
    <div style={{display:"flex",gap:6,marginBottom:8}}>
    {[{v:"fixed",l:"💰 Fixe / mois",c:C.b},{v:"percent",l:"📊 % du contrat",c:C.o}].map(opt=>
    <button key={opt.v} onClick={()=>setEditTm({...editTm,payType:opt.v})} style={{flex:1,padding:"8px 10px",borderRadius:8,border:`1.5px solid ${editTm.payType===opt.v?opt.c:C.brd}`,background:editTm.payType===opt.v?opt.c+"15":C.card,color:editTm.payType===opt.v?opt.c:C.td,fontWeight:editTm.payType===opt.v?700:500,fontSize:11,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>{opt.l}</button>
    )}
    </div>
    <Inp label={editTm.payType==="fixed"?"Montant fixe":"Pourcentage"} value={editTm.amount} onChange={v=>setEditTm({...editTm,amount:pf(v)})} type="number" suffix={editTm.payType==="fixed"?"€/mois":"%"}/>
    {editTm.payType==="percent"&&<div style={{padding:"6px 8px",background:C.oD,borderRadius:6,fontSize:10,color:C.o,marginTop:4}}>Ce membre touche {editTm.amount}% du CA des contrats qu'il gère</div>}
    </div>
    {socId==="all"&&<Sel label="Affectation" value={editTm.socId} onChange={v=>setEditTm({...editTm,socId:v})} options={[{v:"holding",l:"🏢 Holding"},...socs.filter(s=>s.stat==="active"||s.stat==="lancement").map(s=>({v:s.id,l:s.nom}))]}/>}
    <Inp label="Notes" value={editTm.notes} onChange={v=>setEditTm({...editTm,notes:v})} placeholder="Détails, scope, horaires…"/>
    <div style={{display:"flex",gap:8,marginTop:12}}>
    <Btn onClick={()=>saveTm2(editTm)}>Sauver</Btn>
    {team.some(t=>t.id===editTm.id)&&<Btn v="secondary" onClick={()=>{deleteTm(editTm.id);setEditTm(null);}}>🗑 Supprimer</Btn>}
    <Btn v="secondary" onClick={()=>setEditTm(null)}>Annuler</Btn>
    </div>
   </>}
  </Modal>
 </div>;
}
export function SubsTeamBadge({subs,team,socId,reps}){
 const cM2=curM();
 const mySubs=socId?subs.filter(s=>s.socId===socId):subs;
 const myTeam=socId?team.filter(t=>t.socId===socId):team;
 const totalS=mySubs.reduce((a,s)=>a+subMonthly(s),0);
 const totalT=myTeam.reduce((a,t)=>{const ca=t.socId!=="holding"?pf(gr(reps,t.socId,cM2)?.ca):0;return a+teamMonthly(t,ca);},0);
 const total=totalS+totalT;
 if(total===0)return null;
 return <span style={{fontSize:8,color:C.r,background:C.rD,padding:"1px 5px",borderRadius:8,fontWeight:600}}>🔄 {fmt(total)}€/m</span>;
}
export function ClientsPanelSafe(props){return <ErrorBoundary label="Erreur dans la page Clients"><ClientsPanelInner {...props}/></ErrorBoundary>;}
export function ConversationsPanelSafe(props){return <ErrorBoundary label="Erreur dans les conversations"><ConversationsPanel {...props}/></ErrorBoundary>;}
export function SubsTeamPanelSafe(props){return <ErrorBoundary label="Erreur dans Abonnements & Équipe"><SubsTeamPanel {...props}/></ErrorBoundary>;}
export function MeetingModeSafe(props){return <ErrorBoundary label="Erreur dans le mode réunion"><MeetingMode {...props}/></ErrorBoundary>;}
export function PulseFormSafe(props){return <ErrorBoundary label="Erreur dans le formulaire Pulse"><PulseForm {...props}/></ErrorBoundary>;}
export function DealFlowSafe(props){return <ErrorBoundary label="Erreur dans le Deal Flow"><DealFlow {...props}/></ErrorBoundary>;}
export function ClientsPanelInner({soc,clients,saveClients,ghlData,socBankData,invoices,saveInvoices,stripeData,onSelectClient}){
 const[editCl,setEditCl]=useState(null);const[cl360Tab,setCl360Tab]=useState("infos");const[filter,setFilter]=useState("all");const[stageFilter,setStageFilter]=useState("all");const[invView,setInvView]=useState(null);
 const[sending,setSending]=useState(null);const[search,setSearch]=useState("");const[selPipeline,setSelPipeline]=useState("all");const[sort,setSort]=useState("recent");
 const allPipelines=ghlData?.[soc.id]?.pipelines||[];
 const selPipelineStages=selPipeline==="all"?(allPipelines[0]?.stages||[]):(allPipelines.find(p=>p.id===selPipeline)?.stages||[]);
 const rawGhl=ghlData?.[soc.id]?.ghlClients||[];
 const manualClients=clients.filter(c=>c.socId===soc.id);
 const manualGhlIds=new Set(manualClients.map(c=>c.ghlId).filter(Boolean));
 const ghlClients=rawGhl.filter(gc=>!manualGhlIds.has(gc.ghlId||gc.id)).map(gc=>({...gc,socId:soc.id,_fromGHL:true}));
 const myClients=[...manualClients,...ghlClients];
 const myInvoices=(invoices||[]).filter(inv=>inv.socId===soc.id);
 const active=myClients.filter(c=>c.status==="active");
 const byType=t=>myClients.filter(c=>c.billing?.type===t);
 const mrrFixed=byType("fixed").filter(c=>c.status==="active").reduce((a,c)=>a+Number(c.billing?.amount||0),0);
 const mrrPercent=byType("percent").filter(c=>c.status==="active").reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 const oneoffThisMonth=byType("oneoff").filter(c=>{const d=c.billing?.paidDate;if(!d)return false;return d.startsWith(curM());}).reduce((a,c)=>a+Number(c.billing?.amount||0),0);
 const oneoffTotal=byType("oneoff").reduce((a,c)=>a+Number(c.billing?.amount||0),0);
 const totalMRR=mrrFixed+mrrPercent;
 const totalPortfolio=myClients.reduce((a,c)=>a+clientTotalValue(c),0);
 const avgDealValue=myClients.length?Math.round(totalPortfolio/myClients.length):0;
 const churnCount=myClients.filter(c=>c.status==="churned").length;
 const churnRate=myClients.length>0?Math.round(churnCount/myClients.length*100):0;
 const invDraft=myInvoices.filter(i=>i.status==="draft");
 const invSent=myInvoices.filter(i=>i.status==="sent");
 const invPaid=myInvoices.filter(i=>i.status==="paid");
 const invOverdue=myInvoices.filter(i=>i.status==="overdue");
 const totalFacture=myInvoices.reduce((a,i)=>a+i.amount,0);
 const totalEncaisse=invPaid.reduce((a,i)=>a+i.amount,0);
 const totalAttente=invSent.concat(invDraft).reduce((a,i)=>a+i.amount,0);
 const endingSoon=myClients.filter(c=>{const r=commitmentRemaining(c);return r!==null&&r<=2&&r>0&&c.status==="active";});
 const allOppsAll=Object.values(ghlData||{}).flatMap(d=>(d?.opportunities||[]));
 const allOpps=selPipeline==="all"?allOppsAll:allOppsAll.filter(o=>o.pipelineId===selPipeline);
 const uniqueStages=[...new Set(allOpps.map(o=>o.stage).filter(Boolean))];
 const ghlIdsInStage=stageFilter==="all"?null:new Set(allOpps.filter(o=>o.stage===stageFilter).map(o=>o.id));
 const afterType=filter==="all"?myClients:filter.startsWith("stage_")?myClients.filter(c=>{const st=filter.replace("stage_","");return allOpps.some(o=>o.stage===st&&o.contact?.id===c.ghlId);}):filter==="no_stage"?myClients.filter(c=>!allOpps.some(o=>o.contact?.id===c.ghlId)):filter==="type_fixed"?myClients.filter(c=>c.billing?.type==="fixed"):filter==="type_percent"?myClients.filter(c=>c.billing?.type==="percent"):filter==="type_hybrid"?myClients.filter(c=>c.billing?.type==="hybrid"):filter==="type_oneoff"?myClients.filter(c=>c.billing?.type==="oneoff"):myClients;
 const afterStage=stageFilter==="all"?afterType:afterType.filter(c=>{if(!c.ghlId)return false;const opps2=allOpps.filter(o=>o.stage===stageFilter);return opps2.some(o=>o.name===c.name||o.email===c.email||o.id===c.ghlId);});
 const filteredRaw=search.trim()===""?afterStage:afterStage.filter(c=>{const q=search.toLowerCase();return(c.name||"").toLowerCase().includes(q)||(c.email||"").toLowerCase().includes(q)||(c.phone||"").includes(q)||(c.contact||"").toLowerCase().includes(q)||(c.notes||"").toLowerCase().includes(q);});
 const clientBankTotals=useMemo(()=>{const m={};const txs=socBankData?.transactions||[];filteredRaw.forEach(cl=>{const cn=(cl.name||"").toLowerCase().trim();const tot=txs.filter(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;const desc=(leg.description||tx.reference||"").toLowerCase();if(cn.length>2&&desc.includes(cn))return true;const pts=cn.split(/\s+/).filter(p=>p.length>2);return pts.length>=2&&pts.every(p=>desc.includes(p));}).reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);m[cl.id]=tot;});return m;},[filteredRaw,socBankData?.transactions]);
 const filtered=useMemo(()=>{const arr=[...filteredRaw];if(sort==="alpha")arr.sort((a,b)=>(a.name||"").localeCompare(b.name||"","fr"));else if(sort==="collected")arr.sort((a,b)=>(clientBankTotals[b.id]||0)-(clientBankTotals[a.id]||0));else if(sort==="oldest")arr.sort((a,b)=>new Date(a.at||a.createdAt||0)-new Date(b.at||b.createdAt||0));else arr.sort((a,b)=>new Date(b.at||b.createdAt||0)-new Date(a.at||a.createdAt||0));return arr;},[filteredRaw,sort,clientBankTotals]);
 const exportCSV=()=>{const hdr="Nom,Entreprise,Email,Téléphone,Domaine,Statut,Type facturation,Montant,Date ajout";const rows=filtered.map(c=>{const b=c.billing||{};return[c.name||"",c.company||"",c.email||"",c.phone||"",c.domain||"",c.status||"",b.type||"",b.amount||"",c.at?new Date(c.at).toLocaleDateString("fr-FR"):""].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",");});const csv=hdr+"\n"+rows.join("\n");const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`clients_${soc.nom}_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);};
 const addClient=(type)=>{
  const base={id:uid(),socId:soc.id,name:"",contact:"",email:"",phone:"",status:"active",notes:"",ghlId:"",stripeId:"",at:new Date().toISOString()};
  if(type==="fixed")base.billing={type:"fixed",amount:0,freq:"monthly",commitment:0,startDate:new Date().toISOString().slice(0,10)};
  else if(type==="percent")base.billing={type:"percent",percent:0,basis:"ca",startDate:new Date().toISOString().slice(0,10)};
  else if(type==="hybrid")base.billing={type:"hybrid",amount:0,freq:"monthly",percent:0,basis:"ca",commitment:0,startDate:new Date().toISOString().slice(0,10)};
  else base.billing={type:"oneoff",amount:0,product:"",deliveredDate:"",paidDate:"",installments:1};
  setEditCl(base);
 };
 const saveCl=(cl)=>{
  const isNew=!clients.some(c=>c.id===cl.id);
  const idx=clients.findIndex(x=>x.id===cl.id);
  if(idx>=0){const nc=[...clients];nc[idx]=cl;saveClients(nc);}else saveClients([...clients,cl]);
  // GHL bidirectional sync
  const loc=soc.ghlLocationId;
  if(loc&&cl.ghlId){
   ghlUpdateContact(loc,cl.ghlId,{
    firstName:(cl.name||"").split(" ")[0],
    lastName:(cl.name||"").split(" ").slice(1).join(" "),
    email:cl.email,phone:cl.phone,
    tags:[...(cl.notes?cl.notes.split(",").map(t=>t.trim()):[]),...(cl.domain?[`domaine:${cl.domain}`]:[])].filter(Boolean)
   });
  }else if(loc&&!cl.ghlId&&!cl._fromGHL){
   ghlCreateContact(loc,{
    firstName:(cl.name||"").split(" ")[0],
    lastName:(cl.name||"").split(" ").slice(1).join(" "),
    email:cl.email,phone:cl.phone,name:cl.name
   }).then(res2=>{
    if(res2?.contact?.id){
     const updated=clients.map(c=>c.id===cl.id?{...c,ghlId:res2.contact.id}:c);
     saveClients(updated);
    }
   });
  }
  const b=cl.billing;
  const needsInvoices=(b?.type==="fixed"&&b.commitment>0)||(b?.type==="oneoff"&&b.amount>0);
  if(needsInvoices){
   const existingForClient=(invoices||[]).filter(i=>i.clientId===cl.id);
   if(isNew||existingForClient.length===0){
    const newInvs=generateInvoices(cl,soc.nom);
    const apiKey=soc.ghlKey;
    if(apiKey){
    newInvs.forEach(async(inv)=>{
    const ghlId=await ghlCreateInvoice(apiKey,inv,cl);
    if(ghlId)inv.ghlInvoiceId=ghlId;
    });
    }
    const allInvs=[...(invoices||[]).filter(i=>i.clientId!==cl.id),...newInvs];
    saveInvoices(allInvs);
   }
  }
  setEditCl(null);
 };
 const deleteCl=(id)=>{
  saveClients(clients.filter(c=>c.id!==id));
  saveInvoices((invoices||[]).filter(i=>i.clientId!==id));
  setEditCl(null);
 };
 const regenInvoices=(cl)=>{
  const newInvs=generateInvoices(cl,soc.nom);
  const allInvs=[...(invoices||[]).filter(i=>i.clientId!==cl.id),...newInvs];
  saveInvoices(allInvs);
 };
 const sendInvoice=async(inv)=>{
  setSending(inv.id);
  const apiKey=soc.ghlKey;
  let ghlOk=false;
  if(apiKey&&inv.ghlInvoiceId){ghlOk=await ghlSendInvoice(apiKey,inv.ghlInvoiceId);}
  const updated=(invoices||[]).map(i=>i.id===inv.id?{...i,status:"sent",sentAt:new Date().toISOString()}:i);
  saveInvoices(updated);
  setSending(null);
 };
 const markPaid=(inv)=>{
  const updated=(invoices||[]).map(i=>i.id===inv.id?{...i,status:"paid",paidAt:new Date().toISOString()}:i);
  saveInvoices(updated);
 };
 const cancelInvoice=(inv)=>{
  const updated=(invoices||[]).map(i=>i.id===inv.id?{...i,status:"cancelled"}:i);
  saveInvoices(updated);
 };
 const clientInvoices=(clId)=>(invoices||[]).filter(i=>i.clientId===clId).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 if(myClients.length===0)return <div style={{textAlign:"center",padding:40}}>
  <div style={{fontSize:40,marginBottom:12}}>👥</div>
  <div style={{fontSize:32,marginBottom:8}}>🚀</div><div style={{fontWeight:700,fontSize:15,marginBottom:6,color:C.t}}>Aucun client pour le moment</div>
  <div style={{color:C.td,fontSize:12,marginBottom:16}}>Connectez GHL ou ajoutez des clients manuellement</div>
  <div style={{display:"flex",gap:8,justifyContent:"center"}}>
   <Btn small onClick={()=>addClient("fixed")}>+ Forfait</Btn>
   <Btn small v="secondary" onClick={()=>addClient("percent")}>+ %</Btn>
   <Btn small v="secondary" onClick={()=>addClient("hybrid")}>+ Fixe+%</Btn>
   <Btn small v="secondary" onClick={()=>addClient("oneoff")}>+ One-off</Btn>
  </div>
  </div>;
 return <div>
  <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:6,marginBottom:12}}>
   <Card accent={C.acc} style={{padding:"10px 12px",textAlign:"center"}} delay={1}>
    <div style={{color:C.td,fontSize:8,fontWeight:700,letterSpacing:.5}}>MRR TOTAL</div>
    <div style={{fontWeight:900,fontSize:20,color:C.acc}}>{fmt(totalMRR)}€</div>
    <div style={{fontSize:8,color:C.td}}>Forfaits: {fmt(mrrFixed)}€ · %: {fmt(mrrPercent)}€</div>
   </Card>
   <Card style={{padding:"10px 12px",textAlign:"center"}} delay={2}>
    <div style={{color:C.td,fontSize:8,fontWeight:700,letterSpacing:.5}}>CLIENTS ACTIFS</div>
    <div style={{fontWeight:900,fontSize:20,color:C.g}}>{active.length}</div>
    <div style={{fontSize:8,color:C.td}}>{myClients.length} total · Churn {churnRate}%</div>
   </Card>
   <Card style={{padding:"10px 12px",textAlign:"center"}} delay={3}>
    <div style={{color:C.td,fontSize:8,fontWeight:700,letterSpacing:.5}}>ONE-OFF CE MOIS</div>
    <div style={{fontWeight:900,fontSize:20,color:C.b}}>{fmt(oneoffThisMonth)}€</div>
    <div style={{fontSize:8,color:C.td}}>Total vendu: {fmt(oneoffTotal)}€</div>
   </Card>
   <Card style={{padding:"10px 12px",textAlign:"center"}} delay={4}>
    <div style={{color:C.td,fontSize:8,fontWeight:700,letterSpacing:.5}}>VALEUR MOY.</div>
    <div style={{fontWeight:900,fontSize:20,color:C.t}}>{fmt(avgDealValue)}€</div>
    <div style={{fontSize:8,color:C.td}}>par client</div>
   </Card>
  </div>
  {totalMRR>0&&<Card style={{padding:14,marginBottom:12}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>RÉPARTITION DES REVENUS</div>
   <div style={{display:"flex",gap:2,height:8,borderRadius:4,overflow:"hidden",marginBottom:8}}>
    {mrrFixed>0&&<div style={{width:`${pct(mrrFixed,totalMRR+oneoffThisMonth)}%`,background:C.acc,borderRadius:3,transition:"width .3s"}}/>}
    {mrrPercent>0&&<div style={{width:`${pct(mrrPercent,totalMRR+oneoffThisMonth)}%`,background:C.v,borderRadius:3,transition:"width .3s"}}/>}
    {oneoffThisMonth>0&&<div style={{width:`${pct(oneoffThisMonth,totalMRR+oneoffThisMonth)}%`,background:C.b,borderRadius:3,transition:"width .3s"}}/>}
   </div>
   <div style={{display:"flex",gap:12}}>
    {[{l:"Forfaits fixes",v:mrrFixed,c:C.acc,n:byType("fixed").filter(c=>c.status==="active").length},
    {l:"% CA/bénéfice",v:mrrPercent,c:C.v,n:byType("percent").filter(c=>c.status==="active").length},
    {l:"One-off (mois)",v:oneoffThisMonth,c:C.b,n:byType("oneoff").filter(c=>{const d=c.billing?.paidDate;return d&&d.startsWith(curM());}).length}
    ].map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{width:8,height:8,borderRadius:2,background:s.c}}/>
    <span style={{fontSize:9,color:C.td}}>{s.l}: <strong style={{color:s.c}}>{fmt(s.v)}€</strong> ({s.n})</span>
    </div>)}
   </div>
  </Card>}
  {(()=>{const domains={};myClients.forEach(c=>{const d=(c.domain||"").trim();if(d)domains[d]=(domains[d]||0)+1;});const sorted=Object.entries(domains).sort((a,b)=>b[1]-a[1]);if(sorted.length===0)return null;const DCOLS=["#60a5fa","#FFAA00","#34d399","#f43f5e","#a78bfa","#fb923c","#14b8a6","#eab308","#ec4899","#6366f1"];return <Card style={{padding:14,marginBottom:12}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>🏢 DOMAINES D'ACTIVITÉ</div>
   <div style={{display:"flex",gap:2,height:8,borderRadius:4,overflow:"hidden",marginBottom:8}}>
    {sorted.map(([d,n],i)=><div key={d} style={{width:`${Math.round(n/myClients.length*100)}%`,background:DCOLS[i%DCOLS.length],borderRadius:3,transition:"width .3s"}}/>)}
   </div>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    {sorted.map(([d,n],i)=><span key={d} style={{fontSize:9,padding:"2px 8px",borderRadius:6,background:DCOLS[i%DCOLS.length]+"18",color:DCOLS[i%DCOLS.length],fontWeight:600,border:`1px solid ${DCOLS[i%DCOLS.length]}33`}}>{d}: {n}</span>)}
   </div>
  </Card>;})()}
  {endingSoon.length>0&&<Card accent={C.o} style={{padding:12,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:6}}>
    <span style={{fontSize:12}}>⚠️</span>
    <span style={{fontWeight:700,fontSize:11,color:C.o}}>Engagements qui se terminent bientôt</span>
   </div>
   {endingSoon.map(cl=>{const r=commitmentRemaining(cl);const end=commitmentEnd(cl);
    return <div key={cl.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",fontSize:10}}>
    <span style={{fontWeight:600,color:C.t}}>{cl.name}</span>
    <span style={{color:C.o,fontWeight:700}}>{r} mois restant{r>1?"s":""}</span>
    <span style={{color:C.td,fontSize:8}}>fin {end?.toLocaleDateString("fr-FR",{month:"short",year:"numeric"})}</span>
    <span style={{color:C.td,fontSize:9,marginLeft:"auto"}}>{fmt(cl.billing?.amount)}€/m</span>
    </div>;
   })}
  </Card>}
  {myInvoices.length>0&&<Card accent={C.b} style={{padding:14,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:14}}>🧾</span>
    <span style={{fontWeight:800,fontSize:12}}>Facturation</span>
    {!soc.ghlLocationId&&!soc.ghlKey&&<span style={{fontSize:7,color:C.o,background:C.oD,padding:"1px 5px",borderRadius:4}}>Mode local</span>}
    {(soc.ghlLocationId||soc.ghlKey)&&<span style={{fontSize:7,color:C.g,background:C.gD,padding:"1px 5px",borderRadius:4}}>GHL connecté</span>}
    </div>
    <button onClick={()=>setInvView(invView?"":"all")} style={{background:"none",border:"none",color:C.acc,fontSize:9,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>{invView?"Masquer":"Voir toutes"}</button>
   </div>
   <div className="rg4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
    <div style={{textAlign:"center",padding:"6px 4px",background:C.bg,borderRadius:6}}>
    <div style={{fontWeight:900,fontSize:16,color:C.g}}>{fmt(totalEncaisse)}€</div>
    <div style={{fontSize:7,color:C.td,fontWeight:600}}>ENCAISSÉ</div>
    </div>
    <div style={{textAlign:"center",padding:"6px 4px",background:C.bg,borderRadius:6}}>
    <div style={{fontWeight:900,fontSize:16,color:C.b}}>{fmt(totalAttente)}€</div>
    <div style={{fontSize:7,color:C.td,fontWeight:600}}>EN ATTENTE</div>
    </div>
    <div style={{textAlign:"center",padding:"6px 4px",background:C.bg,borderRadius:6}}>
    <div style={{fontWeight:900,fontSize:16,color:C.td}}>{invDraft.length}</div>
    <div style={{fontSize:7,color:C.td,fontWeight:600}}>BROUILLONS</div>
    </div>
    <div style={{textAlign:"center",padding:"6px 4px",background:invOverdue.length>0?C.rD:C.bg,borderRadius:6}}>
    <div style={{fontWeight:900,fontSize:16,color:invOverdue.length>0?C.r:C.td}}>{invOverdue.length}</div>
    <div style={{fontSize:7,color:invOverdue.length>0?C.r:C.td,fontWeight:600}}>EN RETARD</div>
    </div>
   </div>
   {totalFacture>0&&<div style={{display:"flex",gap:1,height:6,borderRadius:3,overflow:"hidden",marginBottom:6}}>
    {invPaid.length>0&&<div style={{width:`${pct(invPaid.reduce((a,i)=>a+i.amount,0),totalFacture)}%`,background:C.g,borderRadius:2,transition:"width .3s"}}/>}
    {invSent.length>0&&<div style={{width:`${pct(invSent.reduce((a,i)=>a+i.amount,0),totalFacture)}%`,background:C.b,borderRadius:2,transition:"width .3s"}}/>}
    {invDraft.length>0&&<div style={{width:`${pct(invDraft.reduce((a,i)=>a+i.amount,0),totalFacture)}%`,background:C.brd,borderRadius:2,transition:"width .3s"}}/>}
    {invOverdue.length>0&&<div style={{width:`${pct(invOverdue.reduce((a,i)=>a+i.amount,0),totalFacture)}%`,background:C.r,borderRadius:2,transition:"width .3s"}}/>}
   </div>}
   {invDraft.length>0&&<div style={{marginTop:6}}>
    <div style={{fontSize:9,color:C.td,fontWeight:700,marginBottom:4}}>📤 Prêtes à envoyer ({invDraft.length})</div>
    {invDraft.slice(0,5).map((inv,i)=>{
    const cl=myClients.find(c=>c.id===inv.clientId);
    return <div key={inv.id} className={`fu d${Math.min(i+1,5)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:C.bg,borderRadius:6,marginBottom:2}}>
    <span style={{fontSize:9}}>📝</span>
    <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontWeight:600,fontSize:10}}>{cl?.name||"Client"}</span>
    <span style={{fontSize:8,color:C.td}}>{inv.description.length>35?inv.description.slice(0,35)+"…":inv.description}</span>
    </div>
    <div style={{fontSize:8,color:C.td}}>Échéance: {new Date(inv.dueDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</div>
    </div>
    <span style={{fontWeight:700,fontSize:11,color:C.t,whiteSpace:"nowrap"}}>{fmt(inv.amount)}€</span>
    <button onClick={(e)=>{e.stopPropagation();sendInvoice(inv);}} disabled={sending===inv.id} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.b}`,background:C.bD,color:C.b,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT,opacity:sending===inv.id?.5:1,transition:"all .15s"}}>
    {sending===inv.id?"Envoi…":"Envoyer"}
    </button>
    </div>;
    })}
    {invDraft.length>5&&<div style={{fontSize:8,color:C.td,textAlign:"center",marginTop:2}}>+ {invDraft.length-5} autres brouillons</div>}
   </div>}
   {invOverdue.length>0&&<div style={{marginTop:6}}>
    <div style={{fontSize:9,color:C.r,fontWeight:700,marginBottom:4}}>⚠️ En retard ({invOverdue.length})</div>
    {invOverdue.map((inv,i)=>{
    const cl=myClients.find(c=>c.id===inv.clientId);
    const days=Math.round((new Date()-new Date(inv.dueDate))/(864e5));
    return <div key={inv.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:C.rD,borderRadius:6,marginBottom:2}}>
    <span style={{fontSize:9}}>⚠️</span>
    <div style={{flex:1,minWidth:0}}>
    <span style={{fontWeight:600,fontSize:10,color:C.r}}>{cl?.name||"Client"}</span>
    <span style={{fontSize:8,color:C.r,marginLeft:4}}>{days}j de retard</span>
    </div>
    <span style={{fontWeight:700,fontSize:11,color:C.r}}>{fmt(inv.amount)}€</span>
    <button onClick={()=>markPaid(inv)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.g}`,background:C.gD,color:C.g,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Marquer payée</button>
    </div>;
    })}
   </div>}
  </Card>}
  {invView&&<Card style={{padding:14,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
    <span style={{fontWeight:800,fontSize:12}}>🧾 Toutes les factures ({myInvoices.length})</span>
    <div style={{display:"flex",gap:4}}>
    {["all",...myClients.map(c=>c.id)].map(v=>{
    const lbl=v==="all"?"Tous":myClients.find(c=>c.id===v)?.name?.slice(0,12)||"?";
    return <button key={v} onClick={()=>setInvView(v)} style={{padding:"2px 8px",borderRadius:4,fontSize:8,fontWeight:invView===v?700:500,border:`1px solid ${invView===v?C.acc:C.brd}`,background:invView===v?C.accD:"transparent",color:invView===v?C.acc:C.td,cursor:"pointer",fontFamily:FONT}}>{lbl}</button>;
    })}
    </div>
   </div>
   {(invView==="all"?myInvoices:myInvoices.filter(i=>i.clientId===invView)).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).map((inv,i)=>{
    const cl=myClients.find(c=>c.id===inv.clientId);const st=INV_STATUS[inv.status]||INV_STATUS.draft;
    return <div key={inv.id} className={`fu d${Math.min(i+1,10)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:st.bg,borderRadius:6,border:`1px solid ${st.c}15`,marginBottom:2}}>
    <span style={{fontSize:10}}>{st.icon}</span>
    <div style={{width:28,textAlign:"center"}}><span style={{fontSize:7,color:st.c,fontWeight:700,background:st.c+"18",padding:"1px 4px",borderRadius:3}}>{st.l}</span></div>
    <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontWeight:600,fontSize:10}}>{cl?.name||"?"}</span>
    <span style={{fontSize:7,color:C.td,fontFamily:"monospace"}}>{inv.number}</span>
    {inv.totalInstallments>1&&<span style={{fontSize:7,color:C.b,background:C.bD,padding:"0px 4px",borderRadius:3}}>{inv.installment}/{inv.totalInstallments}</span>}
    </div>
    <div style={{fontSize:8,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inv.description}</div>
    </div>
    <div style={{textAlign:"right",flexShrink:0}}>
    <div style={{fontWeight:700,fontSize:11,color:C.t}}>{fmt(inv.amount)}€</div>
    <div style={{fontSize:7,color:C.td}}>{new Date(inv.dueDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</div>
    </div>
    <div style={{display:"flex",gap:2,flexShrink:0}}>
    {inv.status==="draft"&&<button onClick={()=>sendInvoice(inv)} disabled={sending===inv.id} style={{padding:"2px 6px",borderRadius:4,border:`1px solid ${C.b}`,background:C.bD,color:C.b,fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:FONT,opacity:sending===inv.id?.5:1}}>{sending===inv.id?"…":"📤 Envoyer"}</button>}
    {(inv.status==="sent"||inv.status==="overdue")&&<button onClick={()=>markPaid(inv)} style={{padding:"2px 6px",borderRadius:4,border:`1px solid ${C.g}`,background:C.gD,color:C.g,fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>✅ Payée</button>}
    {inv.status!=="paid"&&inv.status!=="cancelled"&&<button onClick={()=>cancelInvoice(inv)} style={{padding:"2px 6px",borderRadius:4,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,fontSize:8,cursor:"pointer",fontFamily:FONT}}>✗</button>}
    </div>
    </div>;
   })}
  </Card>}
  <div style={{marginBottom:10}}>
   <div style={{position:"relative",marginBottom:8}}>
    <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.td}}>🔍</span>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un client ou prospect..." style={{width:"100%",padding:"10px 12px 10px 36px",borderRadius:10,border:`1px solid ${search?C.acc+"66":C.brd}`,background:"var(--sc-card-a4)",color:C.t,fontSize:12,fontFamily:FONT,outline:"none",boxSizing:"border-box",transition:"border-color .2s"}}/>
    {search&&<button onClick={()=>setSearch("")} aria-label="Effacer la recherche" style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:14}}>✕</button>}
   </div>
   <div style={{display:"flex",gap:6,marginBottom:8}}>
    <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card,color:C.t,fontSize:11,fontFamily:FONT}}>
     <option value="recent">Récent</option>
     <option value="alpha">Alphabétique</option>
     <option value="collected">💰 Plus collecté</option>
     <option value="oldest">Ancien</option>
    </select>
    <button onClick={exportCSV} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card,color:C.t,fontSize:11,fontFamily:FONT,cursor:"pointer",fontWeight:600}}>📥 Exporter</button>
   </div>
   {allPipelines.length>1&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
    <span style={{fontSize:9,color:C.td,fontWeight:700}}>PIPELINE :</span>
    {[{id:"all",name:"Toutes"},...allPipelines].map(p=><button key={p.id} onClick={()=>{setSelPipeline(p.id);setFilter("all");}} style={{padding:"4px 12px",borderRadius:6,fontSize:9,fontWeight:selPipeline===p.id?700:500,border:`1px solid ${selPipeline===p.id?C.acc:C.brd}`,background:selPipeline===p.id?C.accD:"transparent",color:selPipeline===p.id?C.acc:C.td,cursor:"pointer",fontFamily:FONT}}>{p.name}</button>)}
   </div>}
   <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
   {[{v:"all",l:`Tous (${myClients.length})`},
    ...(selPipelineStages.map((st,i)=>{const count=myClients.filter(c=>allOpps.some(o=>o.stage===st&&o.contact?.id===c.ghlId));return{v:`stage_${st}`,l:`${st} (${count.length})`,c:GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]};})),
    {v:"no_stage",l:`Sans étape (${myClients.filter(c=>!allOpps.some(o=>o.contact?.id===c.ghlId)).length})`},
    {v:"type_fixed",l:`💰 Fixe (${byType("fixed").length})`},{v:"type_percent",l:`📊 % (${byType("percent").length})`},{v:"type_hybrid",l:`💎 Fixe+% (${byType("hybrid").length})`},{v:"type_oneoff",l:`🎯 One-off (${byType("oneoff").length})`}
   ].map(f2=>{const isStage=f2.v.startsWith("stage_");const stColor=isStage?f2.c:null;
    return <button key={f2.v} onClick={()=>setFilter(f2.v)} style={{padding:"4px 10px",borderRadius:6,fontSize:9,fontWeight:filter===f2.v?700:500,border:`1px solid ${filter===f2.v?(stColor||C.acc):C.brd}`,background:filter===f2.v?(stColor||C.acc)+"22":"transparent",color:filter===f2.v?(stColor||C.acc):C.td,cursor:"pointer",fontFamily:FONT}}>{f2.l}</button>;
   })}
   <div style={{marginLeft:"auto",display:"flex",gap:4}}>
    <Btn small onClick={()=>addClient("fixed")}>+ Forfait</Btn>
    <Btn small v="secondary" onClick={()=>addClient("percent")}>+ %</Btn>
    <Btn small v="secondary" onClick={()=>addClient("hybrid")}>+ Fixe+%</Btn>
    <Btn small v="secondary" onClick={()=>addClient("oneoff")}>+ One-off</Btn>
   </div>
  </div>
  </div>
  {filtered.length===0&&<div style={{textAlign:"center",padding:30,color:C.td}}><div style={{fontSize:24,marginBottom:6}}>👥</div>{search?"Aucun résultat pour \""+search+"\"":"Aucun client pour le moment"}</div>}
  {filtered.map((cl,i)=>{
   const b=cl.billing||{};const bt=b.type?BILL_TYPES[b.type]:null;const cs=CLIENT_STATUS[cl.status]||CLIENT_STATUS.active;
   const monthly=clientMonthlyRevenue(cl);const cr=commitmentRemaining(cl);
   const clInvs=clientInvoices(cl.id);const clDraft=clInvs.filter(x=>x.status==="draft").length;const clPaid=clInvs.filter(x=>x.status==="paid").length;const clOverdue=clInvs.filter(x=>x.status==="overdue").length;
   return <Card key={cl.id} accent={bt?.c||C.td} style={{marginBottom:4,padding:"12px 14px",cursor:"pointer"}} delay={Math.min(i+1,8)} onClick={()=>{setEditCl({...cl});if(onSelectClient)onSelectClient(cl);}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
    <div style={{width:36,height:36,borderRadius:9,background:(bt?.c||C.td)+"18",border:`1.5px solid ${(bt?.c||C.td)}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{bt?.icon||"👤"}</div>
    <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
    <span style={{fontWeight:700,fontSize:12}}>{cl.name||"Sans nom"}</span>
    <span title={cl.ghlId?"Synced avec GHL":"Local uniquement"} style={{fontSize:8,cursor:"default"}}>{cl.ghlId?"✅":"⚠️"}</span>
    <HealthBadge score={calcClientHealthScore(cl,socBankData,ghlData,soc)}/>
    {cl.status==="prospect"&&(()=>{const lscore=(()=>{let s=0;if((cl.source||"").toLowerCase().includes("organic"))s+=20;const added=new Date(cl.at||cl.createdAt||0);const days=Math.floor((Date.now()-added.getTime())/864e5);s+=days<7?30:days<30?15:0;const cn5=(cl.name||"").toLowerCase();const calls5=(ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.contactName||e.title||"").toLowerCase().includes(cn5)).length;s+=Math.min(30,calls5*10);if(cl.email)s+=10;if(cl.phone)s+=10;return clamp(s,0,100);})();const lc=lscore>70?"#34d399":lscore>=40?"#FFAA00":"#f87171";const lt=lscore>70?"Chaud":lscore>=40?"Tiède":"Froid";return <span style={{fontSize:7,fontWeight:700,color:lc,background:lc+"18",padding:"1px 5px",borderRadius:8}}>{lscore>70?"🟢":lscore>=40?"🟡":"🔴"} {lt} ({lscore})</span>;})()}
    {(()=>{if(cl.status!=="active")return null;const cn3=(cl.name||"").toLowerCase().trim();const excl4=EXCLUDED_ACCOUNTS[soc.id]||[];const now45c=Date.now()-45*864e5;const now30c=Date.now()-30*864e5;const hasPayment=(socBankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0||isExcludedTx(tx,excl4))return false;return new Date(tx.created_at).getTime()>now45c&&(leg.description||tx.reference||"").toLowerCase().includes(cn3);});const calEvts2=(ghlData?.[soc.id]?.calendarEvents||[]);const hasCall=calEvts2.some(e=>new Date(e.startTime||0).getTime()>now30c&&(e.contactName||e.title||"").toLowerCase().includes(cn3));const endDate=commitmentEnd(cl);const endsClose=endDate&&(endDate.getTime()-Date.now())<60*864e5;if((!hasPayment||!hasCall)&&endsClose)return <span style={{fontSize:7,color:C.r,background:C.rD,padding:"1px 5px",borderRadius:8,fontWeight:700}}>⚠️ Risque</span>;return null;})()}
    <span style={{fontSize:7,color:cs.c,background:cs.c+"18",padding:"1px 5px",borderRadius:8,fontWeight:700}}>{cs.icon} {cs.l}</span>
    {bt&&<span style={{fontSize:7,color:bt.c,background:bt.c+"18",padding:"1px 5px",borderRadius:8}}>{bt.l}</span>}
    {cl.domain&&<span style={{fontSize:7,color:"#60a5fa",background:"#60a5fa18",padding:"1px 5px",borderRadius:8,fontWeight:600}}>🏢 {cl.domain}</span>}
    {(()=>{const d=cl.at||cl.createdAt;if(!d)return null;const days=Math.floor((Date.now()-new Date(d).getTime())/(1000*60*60*24));const lbl=days<30?`${days}j`:days<365?`${Math.floor(days/30)}m`:`${Math.floor(days/365)}a${Math.floor((days%365)/30)}m`;const isP=cl.status==="prospect";const isC=cl.status==="churned";const col=isP?"#fb923c":isC?C.r:C.g;const txt=isP?"⏳ Pipeline "+lbl:isC?"❌ Perdu il y a "+lbl:"✅ Client depuis "+lbl;return <span style={{fontSize:7,color:col,background:col+"18",padding:"1px 5px",borderRadius:8,fontWeight:600}}>{txt}</span>;})()}
    {clInvs.length>0&&<span style={{fontSize:7,color:C.td,background:C.card2,padding:"1px 5px",borderRadius:8}}>📄{clInvs.length}</span>}
    {clDraft>0&&<span style={{fontSize:7,color:C.acc,background:C.accD,padding:"1px 4px",borderRadius:4,fontWeight:700}}>{clDraft} à envoyer</span>}
    {clOverdue>0&&<span style={{fontSize:7,color:C.r,background:C.rD,padding:"1px 4px",borderRadius:4,fontWeight:700}}>⚠ {clOverdue} en retard</span>}
    {clInvs.length>0&&<span style={{fontSize:7,color:C.b,background:C.bD,padding:"1px 5px",borderRadius:8}}>🧾 {clPaid}/{clInvs.length}</span>}
    {(()=>{if(cl.status!=="active"||(b.type!=="fixed"&&b.type!=="hybrid"))return null;const cn=(cl.name||"").toLowerCase().trim();const txs=(socBankData?.transactions||[]);const now45=Date.now()-45*864e5;const hasRecent=txs.some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;const txDate=new Date(tx.created_at||tx.date||0).getTime();if(txDate<now45)return false;const desc=(leg.description||tx.reference||"").toLowerCase();if(cn.length>2&&desc.includes(cn))return true;const pts=cn.split(/\s+/).filter(p=>p.length>2);return pts.length>=2&&pts.every(p=>desc.includes(p));});if(!hasRecent)return <span style={{fontSize:7,color:C.r,background:C.rD,padding:"1px 5px",borderRadius:8,fontWeight:700}}>⚠️ Pas de paiement depuis 45j+</span>;return null;})()}
    {clOverdue>0&&<span style={{fontSize:7,color:C.r,background:C.rD,padding:"1px 5px",borderRadius:8,fontWeight:700}}>⚠ {clOverdue} retard</span>}
    {clDraft>0&&<span style={{fontSize:7,color:C.td,background:C.card2,padding:"1px 5px",borderRadius:8}}>{clDraft} brouillon{clDraft>1?"s":""}</span>}
    </div>
    {(cl.contact||cl.company||cl.email)&&<div style={{color:C.td,fontSize:9,marginTop:1}}>{cl.company&&<span style={{fontWeight:600,color:"#60a5fa"}}>{cl.company}</span>}{cl.company&&(cl.contact||cl.email)?" · ":""}{cl.contact||""}{cl.email?` · ${cl.email}`:""}</div>}
    {(()=>{const cn6=(cl.name||"").toLowerCase().trim();const calEvts6=(ghlData?.[soc.id]?.calendarEvents||[]);const txs6=(socBankData?.transactions||[]);let lastDate=null;calEvts6.forEach(e=>{if((e.contactName||e.title||"").toLowerCase().includes(cn6)){const d=new Date(e.startTime||0);if(!lastDate||d>lastDate)lastDate=d;}});txs6.forEach(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return;const desc=(leg.description||tx.reference||"").toLowerCase();if(cn6.length>2&&desc.includes(cn6)){const d=new Date(tx.created_at);if(!lastDate||d>lastDate)lastDate=d;}});if(!lastDate)return <div style={{fontSize:8,color:C.tm,marginTop:1}}>Aucune interaction</div>;const diffMs=Date.now()-lastDate.getTime();const diffH=Math.floor(diffMs/36e5);const diffD=Math.floor(diffMs/864e5);const txt=diffD===0?`il y a ${diffH}h`:`il y a ${diffD}j`;const col=diffD<14?C.td:diffD<30?C.o:C.r;return <div style={{fontSize:8,color:col,marginTop:1,fontWeight:diffD>=14?600:400}}>Dernier contact : {txt}</div>;})()}
    {cl.notes&&<div style={{color:C.td,fontSize:9,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cl.notes}</div>}
    <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
    {b.type==="fixed"&&<>
    <span style={{fontSize:9,color:C.acc,fontWeight:700}}>{fmt(b.amount)}€/{b.freq==="annual"?"an":"mois"}</span>
    {b.commitment>0&&<span style={{fontSize:8,color:C.td}}>Engagement {b.commitment} mois{cr!==null?` · ${cr} restant${cr>1?"s":""}`:""}</span>}
    {!b.commitment&&<span style={{fontSize:8,color:C.o}}>Sans engagement</span>}
    </>}
    {b.type==="percent"&&<>
    {cl.company&&<span style={{fontSize:9,color:"#60a5fa",fontWeight:700}}>{cl.company}</span>}
    {!cl.company&&cl.clientCA>0&&<span style={{fontSize:8,color:C.td}}>CA client: {fmt(cl.clientCA)}€</span>}
    </>}
    {b.type==="hybrid"&&<>
    {cl.company?<span style={{fontSize:9,color:"#60a5fa",fontWeight:700}}>{cl.company}</span>:<span style={{fontSize:9,color:"#ec4899",fontWeight:700}}>{fmt(b.amount)}€/mois + {b.percent}% {b.basis==="benefice"?"bénéf.":"CA"}</span>}
    </>}
    {b.type==="oneoff"&&<>
    <span style={{fontSize:9,color:C.b,fontWeight:700}}>{fmt(b.amount)}€</span>
    {b.product&&<span style={{fontSize:8,color:C.td}}>{b.product}</span>}
    {b.paidDate&&<span style={{fontSize:8,color:C.g}}>Payé le {new Date(b.paidDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>}
    </>}
    </div>
    </div>
    <div style={{textAlign:"right",flexShrink:0}}>
    {b.type&&(b.type==="fixed"||b.type==="hybrid")&&<>
    <div style={{fontWeight:900,fontSize:16,color:bt?.c||C.td}}>{fmt(monthly)}€</div>
    <div style={{fontSize:8,color:C.td}}>/ mois</div>
    </>}
    {b.type&&b.type==="percent"&&<>
    <div style={{fontWeight:900,fontSize:16,color:bt?.c||C.td}}>{b.percent}%</div>
    <div style={{fontSize:8,color:C.td}}>{b.basis==="benefice"?"du bénéfice":"du CA"}</div>
    </>}
    {b.type&&b.type==="oneoff"&&<>
    <div style={{fontWeight:900,fontSize:16,color:bt?.c||C.td}}>{fmt(b.amount)}€</div>
    <div style={{fontSize:8,color:C.td}}>one-off</div>
    </>}
    {(()=>{const cn=(cl.name||"").toLowerCase().trim();const txs=(socBankData?.transactions||[]);const revTot=txs.filter(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;const desc=(leg.description||tx.reference||"").toLowerCase();if(cn.length>2&&desc.includes(cn))return true;const pts=cn.split(/\s+/).filter(p=>p.length>2);return pts.length>=2&&pts.every(p=>desc.includes(p));}).reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);const stripeTot=getStripeTotal(getStripeChargesForClient(stripeData,cl));const tot=revTot+stripeTot;if(tot<=0)return null;return <div style={{marginTop:3,padding:"2px 6px",background:C.gD,borderRadius:4,fontSize:8,fontWeight:700,color:C.g}}>💰 {fmt(tot)}€ collecté{stripeTot>0?" (dont "+fmt(stripeTot)+"€ Stripe)":""}</div>;})()}
    </div>
    </div>
   </Card>;
  })}
  {myInvoices.length>0&&<>
   <div style={{marginTop:16,marginBottom:4,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:14}}>📄</span>
    <span style={{fontWeight:800,fontSize:13}}>Facturation</span>
    <span style={{fontSize:9,color:C.td}}>{myInvoices.length} factures</span>
    </div>
    <button onClick={()=>setInvView(invView?"":"all")} style={{background:"none",border:"none",color:C.acc,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{invView?"Masquer les factures":"Voir toutes les factures"}</button>
   </div>
   <div className="rg4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
    <div style={{padding:"8px 10px",background:C.gD,borderRadius:8,textAlign:"center"}}>
    <div style={{fontWeight:900,fontSize:16,color:C.g}}>{fmt(totalEncaisse)}€</div>
    <div style={{fontSize:8,color:C.g,fontWeight:600}}>Encaissé ({invPaid.length})</div>
    </div>
    <div style={{padding:"8px 10px",background:C.oD,borderRadius:8,textAlign:"center"}}>
    <div style={{fontWeight:900,fontSize:16,color:C.o}}>{fmt(invSent.reduce((a,i)=>a+i.amount,0))}€</div>
    <div style={{fontSize:8,color:C.o,fontWeight:600}}>Envoyé ({invSent.length})</div>
    </div>
    <div style={{padding:"8px 10px",background:C.card2,borderRadius:8,textAlign:"center"}}>
    <div style={{fontWeight:900,fontSize:16,color:C.td}}>{fmt(invDraft.reduce((a,i)=>a+i.amount,0))}€</div>
    <div style={{fontSize:8,color:C.td,fontWeight:600}}>Brouillon ({invDraft.length})</div>
    </div>
    {invOverdue.length>0&&<div style={{padding:"8px 10px",background:C.rD,borderRadius:8,textAlign:"center"}}>
    <div style={{fontWeight:900,fontSize:16,color:C.r}}>{fmt(invOverdue.reduce((a,i)=>a+i.amount,0))}€</div>
    <div style={{fontSize:8,color:C.r,fontWeight:600}}>En retard ({invOverdue.length})</div>
    </div>}
    {invOverdue.length===0&&<div style={{padding:"8px 10px",background:C.gD,borderRadius:8,textAlign:"center"}}>
    <div style={{fontWeight:900,fontSize:16,color:C.g}}>{fmt(totalFacture)}€</div>
    <div style={{fontSize:8,color:C.g,fontWeight:600}}>Total facturé</div>
    </div>}
   </div>
   {totalFacture>0&&<div style={{marginBottom:12}}>
    <div style={{display:"flex",gap:2,height:6,borderRadius:3,overflow:"hidden"}}>
    <div style={{width:`${pct(totalEncaisse,totalFacture)}%`,background:C.g,borderRadius:3,transition:"width .3s"}}/>
    <div style={{width:`${pct(invSent.reduce((a,i)=>a+i.amount,0),totalFacture)}%`,background:C.o,borderRadius:3,transition:"width .3s"}}/>
    <div style={{width:`${pct(invDraft.reduce((a,i)=>a+i.amount,0),totalFacture)}%`,background:C.brd,borderRadius:3,transition:"width .3s"}}/>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
    <span style={{fontSize:8,color:C.g}}>{pct(totalEncaisse,totalFacture)}% encaissé</span>
    <span style={{fontSize:8,color:C.td}}>{fmt(totalFacture-totalEncaisse)}€ restant</span>
    </div>
   </div>}
   {invView&&<>
    {myClients.map(cl=>{
    const clInvs=clientInvoices(cl.id);
    if(clInvs.length===0)return null;
    const clPaid=clInvs.filter(i=>i.status==="paid").reduce((a,i)=>a+i.amount,0);
    const clTotal=clInvs.reduce((a,i)=>a+i.amount,0);
    return <div key={cl.id} style={{marginBottom:10}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,padding:"4px 0"}}>
    <span style={{fontWeight:700,fontSize:11,color:C.t}}>{cl.name}</span>
    <span style={{fontSize:8,color:C.td}}>—</span>
    <span style={{fontSize:9,color:C.g,fontWeight:600}}>{fmt(clPaid)}€ / {fmt(clTotal)}€</span>
    <div style={{flex:1,height:3,background:C.brd,borderRadius:2,overflow:"hidden",marginLeft:4}}>
    <div style={{height:"100%",width:`${pct(clPaid,clTotal)}%`,background:C.g,borderRadius:2}}/>
    </div>
    </div>
    {clInvs.map((inv,j)=>{
    const ist=INV_STATUS[inv.status]||INV_STATUS.draft;
    const isLate=inv.status==="overdue";
    return <div key={inv.id} className={`fu d${Math.min(j+1,6)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:ist.bg||C.card,borderRadius:8,border:`1px solid ${isLate?C.r+"44":C.brd}`,marginBottom:2}}>
    <span style={{fontSize:10,flexShrink:0}}>{ist.icon}</span>
    <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontWeight:600,fontSize:10,color:C.t}}>{inv.description}</span>
    {inv.totalInstallments>1&&<span style={{fontSize:7,color:C.b,background:C.bD,padding:"1px 4px",borderRadius:4}}>{inv.installment}/{inv.totalInstallments}</span>}
    </div>
    <div style={{display:"flex",gap:8,marginTop:1}}>
    <span style={{fontSize:8,color:C.td}}>N° {inv.number}</span>
    <span style={{fontSize:8,color:isLate?C.r:C.td}}>Éch. {new Date(inv.dueDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</span>
    {inv.sentAt&&<span style={{fontSize:8,color:C.o}}>Envoyé {new Date(inv.sentAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>}
    {inv.paidAt&&<span style={{fontSize:8,color:C.g}}>Payé {new Date(inv.paidAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>}
    {inv.ghlInvoiceId&&<span style={{fontSize:7,color:C.acc,background:C.accD,padding:"1px 4px",borderRadius:3}}>GHL ✓</span>}
    </div>
    </div>
    <div style={{fontWeight:800,fontSize:13,color:ist.c,whiteSpace:"nowrap"}}>{fmt(inv.amount)}€</div>
    <div style={{display:"flex",gap:2,flexShrink:0}}>
    {inv.status==="draft"&&<button onClick={(e)=>{e.stopPropagation();sendInvoice(inv);}} disabled={sending===inv.id} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.acc}`,background:C.accD,color:C.acc,fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:FONT,opacity:sending===inv.id?.5:1}} title="Envoyer au client">{sending===inv.id?"⏳":"📩 Envoyer"}</button>}
    {inv.status==="sent"&&<button onClick={(e)=>{e.stopPropagation();markPaid(inv);}} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.g}`,background:C.gD,color:C.g,fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:FONT}} title="Marquer comme payé">✅ Payé</button>}
    {inv.status==="overdue"&&<>
    <button onClick={(e)=>{e.stopPropagation();sendInvoice(inv);}} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.o}`,background:C.oD,color:C.o,fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:FONT}} title="Relancer">📩 Relancer</button>
    <button onClick={(e)=>{e.stopPropagation();markPaid(inv);}} style={{padding:"3px 6px",borderRadius:5,border:`1px solid ${C.g}`,background:C.gD,color:C.g,fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>✅</button>
    </>}
    {(inv.status==="draft"||inv.status==="sent")&&<button onClick={(e)=>{e.stopPropagation();cancelInvoice(inv);}} style={{padding:"3px 5px",borderRadius:5,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,fontSize:8,cursor:"pointer",fontFamily:FONT}} title="Annuler">✗</button>}
    </div>
    </div>;
    })}
    </div>;
    })}
    {invDraft.length>0&&<Card accent={C.acc} style={{padding:12,marginTop:8}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div>
    <div style={{fontWeight:700,fontSize:11,color:C.acc}}>{invDraft.length} facture{invDraft.length>1?"s":""} en brouillon</div>
    <div style={{fontSize:9,color:C.td}}>Total : {fmt(invDraft.reduce((a,i)=>a+i.amount,0))}€ — Prêtes à être envoyées</div>
    </div>
    <Btn small onClick={async()=>{for(const inv of invDraft){await sendInvoice(inv);}}}>📩 Tout envoyer</Btn>
    </div>
    </Card>}
   </>}
  </>}
  {myInvoices.length===0&&myClients.length>0&&<Card style={{padding:16,marginTop:12,textAlign:"center"}}>
   <div style={{fontSize:24,marginBottom:4}}>📄</div>
   <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>Aucune facture générée</div>
   <div style={{color:C.td,fontSize:10,marginBottom:10}}>Ajoute un client avec engagement ou paiement en plusieurs fois pour générer automatiquement les factures</div>
  </Card>}
  <Modal open={!!editCl} onClose={()=>{setEditCl(null);setCl360Tab("infos");}} title={editCl?.name?"Modifier client":"Nouveau client"} wide>
   {editCl&&(()=>{
    const b=editCl.billing||{type:"fixed"};const bt=BILL_TYPES[b.type];
    return <>
    {/* Client 360° Tabs */}
    <div style={{display:"flex",gap:0,marginBottom:12,borderBottom:`1px solid ${C.brd}`}}>
    {[{k:"infos",l:"📋 Infos"},{k:"timeline",l:"📅 Timeline"},{k:"paiements",l:"💰 Paiements"}].map(t=><button key={t.k} onClick={()=>setCl360Tab(t.k)} style={{padding:"8px 16px",background:cl360Tab===t.k?C.accD:"transparent",border:"none",borderBottom:cl360Tab===t.k?`2px solid ${C.acc}`:"2px solid transparent",color:cl360Tab===t.k?C.acc:C.td,fontWeight:cl360Tab===t.k?700:500,fontSize:11,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>{t.l}</button>)}
    </div>
    {cl360Tab==="timeline"&&(()=>{
     const clName360=(editCl.name||"").toLowerCase().trim();
     const convos360=(ghlData?.[soc.id]?.conversations||[]).filter(cv=>(cv.contactName||cv.contact?.name||"").toLowerCase().includes(clName360));
     const txs360=(socBankData?.transactions||[]).filter(tx=>{const desc=(tx.legs?.[0]?.description||tx.reference||"").toLowerCase();return clName360.length>2&&desc.includes(clName360);});
     const events360=[...convos360.map(cv=>({date:cv.lastMessageDate||cv.dateUpdated||cv.dateAdded||"",icon:"💬",label:cv.contactName||"Conversation",desc:(cv.lastMessageBody||"").slice(0,80),color:C.b})),...txs360.map(tx=>({date:tx.created_at||"",icon:((tx.legs?.[0]?.amount||0)>0?"💰":"💸"),label:`${(tx.legs?.[0]?.amount||0)>0?"+":""}${fmt(tx.legs?.[0]?.amount||0)}€`,desc:tx.legs?.[0]?.description||tx.reference||"Transaction",color:(tx.legs?.[0]?.amount||0)>0?C.g:C.r}))].sort((a,b)=>new Date(b.date)-new Date(a.date));
     return <div style={{maxHeight:400,overflowY:"auto",marginBottom:12}}>
      {events360.length===0&&<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucun événement trouvé</div>}
      {events360.map((ev,i)=><div key={i} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:`1px solid ${C.brd}08`}}>
       <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><span style={{fontSize:14}}>{ev.icon}</span><div style={{width:2,flex:1,background:C.brd}}/></div>
       <div style={{flex:1}}><div style={{fontWeight:700,fontSize:11,color:ev.color}}>{ev.label}</div><div style={{fontSize:10,color:C.td}}>{ev.desc}</div><div style={{fontSize:8,color:C.tm,marginTop:2}}>{ev.date?ago(ev.date):""}</div></div>
      </div>)}
     </div>;
    })()}
    {cl360Tab==="paiements"&&(()=>{
     const clName360p=(editCl.name||"").toLowerCase().trim();const clEmail360p=(editCl.email||"").toLowerCase().trim();
     const matchedTx=(socBankData?.transactions||[]).filter(tx=>{const leg=tx.legs?.[0];if(!leg)return false;const desc=(leg.description||tx.reference||"").toLowerCase();return(clName360p.length>2&&desc.includes(clName360p))||(clEmail360p.length>3&&desc.includes(clEmail360p));});
     const totalIn=matchedTx.filter(tx=>(tx.legs?.[0]?.amount||0)>0).reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);
     const totalOut=Math.abs(matchedTx.filter(tx=>(tx.legs?.[0]?.amount||0)<0).reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0));
     return <div style={{marginBottom:12}}>
      <div style={{display:"flex",gap:12,marginBottom:12}}>
       <div style={{flex:1,padding:12,background:C.gD,borderRadius:10,textAlign:"center"}}><div style={{fontSize:8,color:C.g,fontWeight:700}}>REÇU</div><div style={{fontWeight:900,fontSize:18,color:C.g}}>{fmt(totalIn)}€</div></div>
       <div style={{flex:1,padding:12,background:C.rD,borderRadius:10,textAlign:"center"}}><div style={{fontSize:8,color:C.r,fontWeight:700}}>ENVOYÉ</div><div style={{fontWeight:900,fontSize:18,color:C.r}}>{fmt(totalOut)}€</div></div>
      </div>
      <div style={{maxHeight:300,overflowY:"auto"}}>{matchedTx.length===0&&<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucune transaction trouvée</div>}
      {matchedTx.map((tx,i)=>{const leg=tx.legs?.[0]||{};const isIn=(leg.amount||0)>0;return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:isIn?C.gD:C.rD,borderRadius:6,marginBottom:2}}>
       <span style={{fontSize:10}}>{isIn?"💰":"💸"}</span>
       <div style={{flex:1,minWidth:0}}><div style={{fontSize:10,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{leg.description||tx.reference||"—"}</div></div>
       <span style={{fontWeight:800,fontSize:11,color:isIn?C.g:C.r}}>{isIn?"+":""}{fmt(leg.amount||0)}€</span>
       <span style={{fontSize:8,color:C.td}}>{tx.created_at?new Date(tx.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}):"—"}</span>
      </div>;})}
      </div>
     </div>;
    })()}
    {cl360Tab==="infos"&&<>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,padding:"6px 10px",background:editCl.ghlId?C.gD:C.oD,borderRadius:8,border:`1px solid ${editCl.ghlId?C.g+"33":C.o+"33"}`}}>
    <span style={{fontSize:12}}>{editCl.ghlId?"✅":"⚠️"}</span>
    <span style={{fontSize:10,fontWeight:600,color:editCl.ghlId?C.g:C.o}}>{editCl.ghlId?"Synced avec GHL":"Local uniquement"}</span>
    {editCl.ghlId&&<span style={{fontSize:8,color:C.td,marginLeft:"auto",fontFamily:"monospace"}}>{editCl.ghlId.slice(0,12)}…</span>}
    </div>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Nom du contact" value={editCl.name} onChange={v=>setEditCl({...editCl,name:v})} placeholder="Ex: Marion Pothin"/>
    <Inp label="Entreprise" value={editCl.company||""} onChange={v=>setEditCl({...editCl,company:v})} placeholder="Ex: Studio Fitness Paris"/>
    </div>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Email" value={editCl.email} onChange={v=>setEditCl({...editCl,email:v})} placeholder="email@client.com"/>
    <Inp label="Téléphone" value={editCl.phone} onChange={v=>setEditCl({...editCl,phone:v})} placeholder="06..."/>
    </div>
    {(()=>{const DOMAINS=["Fitness","Immobilier","E-commerce","Restaurant","Coaching","Beauté / Bien-être","Santé","BTP / Construction","Formation","Marketing / Agence","SaaS / Tech","Juridique","Finance","Transport","Mode","Autre"];const allDomains=[...new Set([...DOMAINS,...myClients.map(c=>(c.domain||"").trim()).filter(Boolean)])].sort();const cur=editCl.domain||"";return <div><label style={{fontSize:9,fontWeight:700,color:C.td,marginBottom:2,display:"block"}}>Domaine d'activité</label><select value={cur} onChange={e=>setEditCl({...editCl,domain:e.target.value})} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}><option value="">— Sélectionner —</option>{allDomains.map(d=><option key={d} value={d}>{d}</option>)}</select></div>;})()}
    <div style={{padding:"10px 12px",background:C.card2,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>TYPE DE FACTURATION</div>
    <div style={{display:"flex",gap:4,marginBottom:10}}>
    {Object.entries(BILL_TYPES).map(([k,v])=>
    <button key={k} onClick={()=>setEditCl({...editCl,billing:{...editCl.billing,type:k}})} style={{flex:1,padding:"8px 6px",borderRadius:8,border:`1.5px solid ${b.type===k?v.c:C.brd}`,background:b.type===k?v.c+"15":C.card,color:b.type===k?v.c:C.td,fontWeight:b.type===k?700:500,fontSize:10,cursor:"pointer",fontFamily:FONT,transition:"all .15s",textAlign:"center"}}>
    <div style={{fontSize:14,marginBottom:2}}>{v.icon}</div>{v.l}
    </button>
    )}
    </div>
    {b.type==="fixed"&&<>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Montant" value={b.amount} onChange={v=>setEditCl({...editCl,billing:{...b,amount:pf(v)}})} type="number" suffix="€"/>
    <Sel label="Fréquence" value={b.freq||"monthly"} onChange={v=>setEditCl({...editCl,billing:{...b,freq:v}})} options={[{v:"monthly",l:"Mensuel"},{v:"annual",l:"Annuel"}]}/>
    </div>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Engagement (mois)" value={b.commitment||0} onChange={v=>setEditCl({...editCl,billing:{...b,commitment:pf(v)}})} type="number" suffix="mois"/>
    <Inp label="Date de début" value={b.startDate||""} onChange={v=>setEditCl({...editCl,billing:{...b,startDate:v}})} type="date"/>
    </div>
    {b.amount>0&&b.commitment>0&&<div style={{padding:"8px 10px",background:C.accD,borderRadius:6,fontSize:10,color:C.acc,fontWeight:600,marginTop:4}}>
    Valeur contrat : {fmt(b.amount*b.commitment)}€ sur {b.commitment} mois{commitmentRemaining(editCl)!==null?` · ${commitmentRemaining(editCl)} mois restants`:""}
    <div style={{fontSize:8,color:C.td,fontWeight:400,marginTop:2}}>🧾 {b.commitment} factures brouillon seront créées automatiquement, une par mois{soc.ghlKey?" (envoi vers GHL)":""}</div>
    </div>}
    {b.amount>0&&!b.commitment&&<div style={{padding:"6px 8px",background:C.oD,borderRadius:6,fontSize:10,color:C.o,marginTop:4}}>Sans engagement — résiliable à tout moment</div>}
    </>}
    {b.type==="percent"&&<>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Pourcentage" value={b.percent||0} onChange={v=>setEditCl({...editCl,billing:{...b,percent:pf(v)}})} type="number" suffix="%"/>
    <Sel label="Base de calcul" value={b.basis||"ca"} onChange={v=>setEditCl({...editCl,billing:{...b,basis:v}})} options={[{v:"ca",l:"% du CA"},{v:"benefice",l:"% du bénéfice"}]}/>
    </div>
    <Inp label="Date de début" value={b.startDate||""} onChange={v=>setEditCl({...editCl,billing:{...b,startDate:v}})} type="date"/>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="CA mensuel du client" value={editCl.clientCA||""} onChange={v=>setEditCl({...editCl,clientCA:pf(v)})} type="number" suffix="€"/>
    {b.basis==="benefice"&&<Inp label="Charges client" value={editCl.clientCharges||""} onChange={v=>setEditCl({...editCl,clientCharges:pf(v)})} type="number" suffix="€"/>}
    </div>
    {(editCl.clientCA||0)>0&&(b.percent||0)>0&&<div style={{padding:"6px 8px",background:C.vD,borderRadius:6,fontSize:10,color:C.v,fontWeight:600,marginTop:4}}>
    Revenu estimé : {fmt(clientMonthlyRevenue(editCl))}€/mois ({b.percent}% de {b.basis==="benefice"?fmt(Math.max(0,(editCl.clientCA||0)-(editCl.clientCharges||0))):fmt(editCl.clientCA)}€)
    </div>}
    </>}
    {b.type==="hybrid"&&<>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Montant fixe" value={b.amount} onChange={v=>setEditCl({...editCl,billing:{...b,amount:pf(v)}})} type="number" suffix="€"/>
    <Sel label="Fréquence" value={b.freq||"monthly"} onChange={v=>setEditCl({...editCl,billing:{...b,freq:v}})} options={[{v:"monthly",l:"Mensuel"},{v:"annual",l:"Annuel"}]}/>
    </div>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Pourcentage" value={b.percent||0} onChange={v=>setEditCl({...editCl,billing:{...b,percent:pf(v)}})} type="number" suffix="%"/>
    <Sel label="Base de calcul" value={b.basis||"ca"} onChange={v=>setEditCl({...editCl,billing:{...b,basis:v}})} options={[{v:"ca",l:"% du CA"},{v:"benefice",l:"% du bénéfice"}]}/>
    </div>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Engagement (mois)" value={b.commitment||0} onChange={v=>setEditCl({...editCl,billing:{...b,commitment:pf(v)}})} type="number" suffix="mois"/>
    <Inp label="Date de début" value={b.startDate||""} onChange={v=>setEditCl({...editCl,billing:{...b,startDate:v}})} type="date"/>
    </div>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="CA mensuel du client" value={editCl.clientCA||""} onChange={v=>setEditCl({...editCl,clientCA:pf(v)})} type="number" suffix="€"/>
    {b.basis==="benefice"&&<Inp label="Charges client" value={editCl.clientCharges||""} onChange={v=>setEditCl({...editCl,clientCharges:pf(v)})} type="number" suffix="€"/>}
    </div>
    {((b.amount||0)>0||(b.percent||0)>0)&&<div style={{padding:"8px 10px",background:"rgba(236,72,153,.1)",borderRadius:6,fontSize:10,color:"#ec4899",fontWeight:600,marginTop:4}}>
    Fixe: {fmt(b.amount)}€/mois + Variable: {b.percent}% = <strong>{fmt(clientMonthlyRevenue(editCl))}€/mois estimé</strong>
    </div>}
    </>}
    {b.type==="oneoff"&&<>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Montant total" value={b.amount||0} onChange={v=>setEditCl({...editCl,billing:{...b,amount:pf(v)}})} type="number" suffix="€"/>
    <Inp label="Produit / Offre" value={b.product||""} onChange={v=>setEditCl({...editCl,billing:{...b,product:v}})} placeholder="Ex: Accompagnement Pub"/>
    </div>
    <div className="rg3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 10px"}}>
    <Inp label="Nb échéances" value={b.installments||1} onChange={v=>setEditCl({...editCl,billing:{...b,installments:Math.max(1,pf(v))}})} type="number" suffix="x"/>
    <Inp label="Date 1er paiement" value={b.paidDate||""} onChange={v=>setEditCl({...editCl,billing:{...b,paidDate:v}})} type="date"/>
    <Inp label="Date de livraison" value={b.deliveredDate||""} onChange={v=>setEditCl({...editCl,billing:{...b,deliveredDate:v}})} type="date"/>
    </div>
    {(b.installments||1)>1&&b.amount>0&&<div style={{padding:"8px 10px",background:C.bD,borderRadius:6,fontSize:10,color:C.b,fontWeight:600,marginTop:4}}>
    {b.installments} échéances de {fmt(Math.round(b.amount/(b.installments||1)))}€ — Total {fmt(b.amount)}€
    <div style={{fontSize:8,color:C.td,fontWeight:400,marginTop:2}}>Les factures seront créées automatiquement en brouillon, 1 par mois à partir de la date du 1er paiement</div>
    </div>}
    </>}
    </div>
    <Sel label="Statut" value={editCl.status} onChange={v=>setEditCl({...editCl,status:v})} options={Object.entries(CLIENT_STATUS).map(([k,v])=>({v:k,l:`${v.icon} ${v.l}`}))}/>
    <Inp label="Notes" value={editCl.notes} onChange={v=>{setEditCl({...editCl,notes:v});sSet(`scClientNotes_${editCl.id}`,v);}} placeholder="Contexte, détails du deal…"/>
    {editCl.ghlId&&<button onClick={()=>{const loc=soc.ghlLocationId;if(loc&&editCl.ghlId)fetchGHL("notes_create",loc,{contactId:editCl.ghlId,body:editCl.notes||""});}} style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${C.acc}`,background:C.accD,color:C.acc,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT,marginBottom:8}}>📤 Sync notes → GHL</button>}
    {/* Payment tracking - auto-matched */}
    {(()=>{
     const clName=(editCl.name||"").toLowerCase().trim();
     const clEmail=(editCl.email||"").toLowerCase().trim();
     const txs=(socBankData?.transactions||[]);
     const matched=txs.filter(tx=>{
      const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;
      const desc=(leg.description||tx.reference||"").toLowerCase();
      if(clName.length>2&&desc.includes(clName))return true;
      if(clEmail.length>3&&desc.includes(clEmail))return true;
      const nameParts=clName.split(/\s+/).filter(p=>p.length>2);
      if(nameParts.length>=2&&nameParts.every(p=>desc.includes(p)))return true;
      return false;
     }).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
     const total=matched.reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);
     if(matched.length===0)return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
      <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:4}}>💳 SUIVI PAIEMENTS</div>
      <div style={{fontSize:10,color:C.td}}>Aucun paiement détecté pour ce contact</div>
     </div>;
     return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
       <span style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>💳 SUIVI PAIEMENTS ({matched.length})</span>
       <span style={{fontWeight:800,fontSize:12,color:C.g}}>{fmt(total)}€ total</span>
      </div>
      <div style={{maxHeight:180,overflowY:"auto"}}>
      {matched.map((tx,i)=>{const leg=tx.legs?.[0];return <div key={tx.id||i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:i<matched.length-1?`1px solid ${C.brd}`:"none"}}>
       <span style={{width:18,height:18,borderRadius:5,background:C.gD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:C.g,flexShrink:0}}>💰</span>
       <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{leg.description||tx.reference||"—"}</div>
        <div style={{fontSize:8,color:C.td}}>{new Date(tx.created_at).toLocaleDateString("fr-FR")}</div>
       </div>
       <span style={{fontWeight:700,fontSize:11,color:C.g}}>+{fmt(leg.amount)}€</span>
      </div>;})}
      </div>
     </div>;
    })()}
    {/* Activity Timeline */}
    {(()=>{
     const cn=(editCl.name||"").toLowerCase().trim();const ce=(editCl.email||"").toLowerCase().trim();
     const events=[];
     // Bank transactions
     const txs=(socBankData?.transactions||[]);
     txs.forEach(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return;const desc=(leg.description||tx.reference||"").toLowerCase();const pts=cn.split(/\s+/).filter(p=>p.length>2);const match=cn.length>2&&desc.includes(cn)||(pts.length>=2&&pts.every(p=>desc.includes(p)));if(match)events.push({date:tx.created_at,icon:"💰",type:"payment",label:`Paiement reçu: ${fmt(leg.amount)}€`,desc:leg.description||tx.reference||"",color:C.g});});
     // GHL opportunities
     const opps=(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.contact?.id===editCl.ghlId);
     opps.forEach(o=>{events.push({date:o.createdAt||o.updatedAt,icon:o.status==="won"?"✅":o.status==="lost"?"❌":"🎯",type:"deal",label:o.status==="won"?"Deal gagné"+(o.value?` (${fmt(o.value)}€)`:""):o.status==="lost"?"Deal perdu":`Deal: ${o.stage||"En cours"}`,desc:o.name||"",color:o.status==="won"?C.g:o.status==="lost"?C.r:C.acc});});
     // Calendar events
     const calEvts=(ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>{const n=(e.title||e.contactName||"").toLowerCase();return cn.length>2&&n.includes(cn)||ce.length>3&&(e.email||"").toLowerCase().includes(ce);});
     calEvts.forEach(e=>{events.push({date:e.startTime||e.createdAt,icon:"📞",type:"call",label:e.calendarName||"Appel",desc:e.title||e.contactName||"",color:"#14b8a6"});});
     // Contact created
     if(editCl.at)events.push({date:editCl.at,icon:"👤",type:"created",label:"Contact créé",desc:"Ajouté dans le CRM",color:"#60a5fa"});
     events.sort((a,b)=>new Date(b.date)-new Date(a.date));
     if(events.length===0)return null;
     return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
      <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📋 HISTORIQUE D'ACTIVITÉ ({events.length})</div>
      <div style={{maxHeight:200,overflowY:"auto"}}>
      {events.slice(0,20).map((ev,i)=><div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:i<Math.min(events.length,20)-1?`1px solid ${C.brd}`:"none"}}>
       <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
        <span style={{fontSize:12}}>{ev.icon}</span>
        {i<Math.min(events.length,20)-1&&<div style={{width:1,flex:1,background:C.brd}}/>}
       </div>
       <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,fontWeight:600,color:ev.color}}>{ev.label}</div>
        {ev.desc&&<div style={{fontSize:9,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.desc}</div>}
        <div style={{fontSize:8,color:C.td}}>{ev.date?new Date(ev.date).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}):""}</div>
       </div>
      </div>)}
      </div>
     </div>;
    })()}
    {/* Onboarding checklist for recently active clients */}
    {(()=>{
     if(editCl.status!=="active")return null;
     const addedDate=new Date(editCl.at||editCl.createdAt||0);
     const daysSinceAdded=Math.floor((Date.now()-addedDate.getTime())/(864e5));
     if(daysSinceAdded>30)return null;
     const obKey=`scOnboard_${editCl.id}`;
     const stored=JSON.parse(localStorage.getItem(obKey)||"{}");
     const items=[
      {id:"contrat",label:"☐ Contrat signé",icon:"📝"},
      {id:"paiement",label:"☐ Premier paiement reçu",icon:"💰"},
      {id:"integration",label:"☐ Appel d'intégration fait",icon:"📞"},
      {id:"communaute",label:"☐ Accès communauté donné",icon:"🤝"},
     ];
     const done=items.filter(it=>stored[it.id]).length;
     const total=items.length;
     const pctDone=Math.round(done/total*100);
     const toggle=(id)=>{const next={...stored,[id]:!stored[id]};localStorage.setItem(obKey,JSON.stringify(next));sSet(obKey,next);};
     return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.acc}22`,margin:"8px 0"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
       <span style={{color:C.acc,fontSize:9,fontWeight:700,letterSpacing:.8}}>🚀 ONBOARDING — {daysSinceAdded}j</span>
       <span style={{fontSize:10,fontWeight:700,color:pctDone===100?C.g:C.acc}}>{pctDone}%</span>
      </div>
      <div style={{height:5,background:C.brd,borderRadius:3,overflow:"hidden",marginBottom:8}}>
       <div style={{height:"100%",width:`${pctDone}%`,background:pctDone===100?C.g:`linear-gradient(90deg,#FFBF00,#FF9D00)`,borderRadius:3,transition:"width .5s ease"}}/>
      </div>
      {items.map(it=><div key={it.id} onClick={()=>toggle(it.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",cursor:"pointer",borderBottom:`1px solid ${C.brd}08`}}>
       <span style={{width:16,height:16,borderRadius:4,border:`2px solid ${stored[it.id]?C.g:C.brd}`,background:stored[it.id]?C.gD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.g,flexShrink:0}}>{stored[it.id]?"✓":""}</span>
       <span style={{fontSize:10,fontWeight:stored[it.id]?400:600,color:stored[it.id]?C.td:C.t,textDecoration:stored[it.id]?"line-through":"none"}}>{it.icon} {it.label.replace("☐ ","")}</span>
      </div>)}
     </div>;
    })()}
    {/* Stripe payments */}
    {(()=>{
     const stripeCharges=getStripeChargesForClient(stripeData,editCl);
     const stripeTotal=getStripeTotal(stripeCharges);
     if(stripeCharges.length===0)return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
      <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:4}}>💳 PAIEMENTS STRIPE</div>
      <div style={{fontSize:10,color:C.td}}>Aucun paiement Stripe détecté</div>
     </div>;
     return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
       <span style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>💳 PAIEMENTS STRIPE ({stripeCharges.length})</span>
       <span style={{fontWeight:800,fontSize:12,color:C.v}}>{fmt(stripeTotal)}€ total</span>
      </div>
      <div style={{maxHeight:180,overflowY:"auto"}}>
      {stripeCharges.map((ch,i)=>{const amt=Math.round((ch.amount||0)/100);const d=new Date((ch.created||0)*1000);const ok=ch.status==="succeeded";return <div key={ch.id||i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:i<stripeCharges.length-1?`1px solid ${C.brd}`:"none"}}>
       <span style={{width:18,height:18,borderRadius:5,background:ok?C.vD:C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:ok?C.v:C.r,flexShrink:0}}>💳</span>
       <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.description||ch.billing_details?.email||"Paiement Stripe"}</div>
        <div style={{fontSize:8,color:C.td}}>{d.toLocaleDateString("fr-FR")} · {ch.status}</div>
       </div>
       <span style={{fontWeight:700,fontSize:11,color:ok?C.v:C.r}}>{ok?"+":""}{fmt(amt)}€</span>
      </div>;})}
      </div>
     </div>;
    })()}
    {/* LTV Section */}
    {(()=>{
     const clName7=(editCl.name||"").toLowerCase().trim();
     const txs7=(socBankData?.transactions||[]);
     const collected=txs7.filter(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;const desc=(leg.description||tx.reference||"").toLowerCase();if(clName7.length>2&&desc.includes(clName7))return true;const pts=clName7.split(/\s+/).filter(p=>p.length>2);return pts.length>=2&&pts.every(p=>desc.includes(p));}).reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);
     const b7=editCl.billing||{};const monthly7=clientMonthlyRevenue(editCl);
     const ltv=(b7.freq==="monthly"||b7.type==="fixed"||b7.type==="percent"||b7.type==="hybrid")?monthly7*12:collected;
     const ratio=ltv>0?Math.min(100,Math.round(collected/ltv*100)):0;
     return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.acc}22`,margin:"8px 0"}}>
      <div style={{color:C.acc,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:6}}>📊 VALEUR CLIENT (LTV)</div>
      <div style={{fontSize:12,fontWeight:700,color:C.t,marginBottom:6}}>💰 Collecté: {fmt(collected)}€ | LTV estimé: {fmt(ltv)}€</div>
      {ltv>0&&<><div style={{height:6,background:C.brd,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${ratio}%`,background:`linear-gradient(90deg,${C.acc},#FF9D00)`,borderRadius:3,transition:"width .5s ease"}}/></div>
      <div style={{fontSize:8,color:C.td,marginTop:3}}>{ratio}% de la valeur estimée collectée</div></>}
     </div>;
    })()}
    <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:6}}>CONNEXIONS EXTERNES</div>
    <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="ID GoHighLevel" value={editCl.ghlId||""} onChange={v=>setEditCl({...editCl,ghlId:v})} placeholder="Contact/Opportunity ID" small/>
    <Inp label="ID Stripe" value={editCl.stripeId||""} onChange={v=>setEditCl({...editCl,stripeId:v})} placeholder="cus_..." small/>
    </div>
    </div>
    {/* Invoice section for existing clients */}
    {clients.some(c=>c.id===editCl.id)&&(()=>{
    const clInvs=clientInvoices(editCl.id);
    if(clInvs.length===0)return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontSize:10}}>🧾</span>
    <span style={{color:C.td,fontSize:10,fontWeight:600}}>Aucune facture générée</span>
    </div>
    {((b.type==="fixed"&&b.commitment>0)||(b.type==="oneoff"&&b.amount>0))&&<button onClick={()=>regenInvoices(editCl)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.acc}`,background:C.accD,color:C.acc,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Générer les factures</button>}
    </div>
    </div>;
    const paid=clInvs.filter(x=>x.status==="paid").length;
    const total=clInvs.reduce((a,x)=>a+x.amount,0);
    const paidAmt=clInvs.filter(x=>x.status==="paid").reduce((a,x)=>a+x.amount,0);
    return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontSize:10}}>🧾</span>
    <span style={{fontWeight:700,fontSize:10}}>Factures ({paid}/{clInvs.length})</span>
    <span style={{fontSize:9,color:C.g,fontWeight:600}}>{fmt(paidAmt)}€ / {fmt(total)}€</span>
    </div>
    <button onClick={()=>regenInvoices(editCl)} style={{padding:"2px 6px",borderRadius:4,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,fontSize:8,cursor:"pointer",fontFamily:FONT}} title="Regénérer les factures">🔄</button>
    </div>
    <div style={{display:"flex",gap:1,height:4,borderRadius:2,overflow:"hidden",marginBottom:6}}>
    {clInvs.map(inv=>{const st=INV_STATUS[inv.status]||INV_STATUS.draft;
    return <div key={inv.id} style={{flex:1,background:st.c,borderRadius:1,transition:"background .3s"}} title={`${inv.description} — ${st.l} — ${fmt(inv.amount)}€`}/>;
    })}
    </div>
    <div style={{maxHeight:200,overflowY:"auto"}}>
    {clInvs.map(inv=>{const st=INV_STATUS[inv.status]||INV_STATUS.draft;
    return <div key={inv.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 6px",background:st.bg,borderRadius:4,marginBottom:1,fontSize:9}}>
    <span style={{fontSize:8}}>{st.icon}</span>
    <span style={{fontSize:7,color:st.c,fontWeight:700,minWidth:48}}>{st.l}</span>
    <span style={{flex:1,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:9}}>
    {inv.totalInstallments>1&&<strong style={{color:C.b}}>#{inv.installment} </strong>}
    {inv.description.length>30?inv.description.slice(0,30)+"…":inv.description}
    </span>
    <span style={{fontWeight:700,color:C.t,whiteSpace:"nowrap"}}>{fmt(inv.amount)}€</span>
    <span style={{color:C.td,fontSize:7,whiteSpace:"nowrap"}}>{new Date(inv.dueDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
    {inv.status==="draft"&&<button onClick={(e)=>{e.stopPropagation();sendInvoice(inv);}} disabled={sending===inv.id} style={{padding:"1px 5px",borderRadius:3,border:`1px solid ${C.b}`,background:C.bD,color:C.b,fontSize:7,fontWeight:700,cursor:"pointer",fontFamily:FONT,opacity:sending===inv.id?.5:1}}>{sending===inv.id?"…":"Envoyer"}</button>}
    {(inv.status==="sent"||inv.status==="overdue")&&<button onClick={(e)=>{e.stopPropagation();markPaid(inv);}} style={{padding:"1px 5px",borderRadius:3,border:`1px solid ${C.g}`,background:C.gD,color:C.g,fontSize:7,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Payée</button>}
    </div>;
    })}
    </div>
    </div>;
    })()}
    </>}
    <div style={{display:"flex",gap:8,marginTop:12}}>
    <Btn onClick={()=>saveCl(editCl)}>Sauver</Btn>
    {clients.some(c=>c.id===editCl.id)&&<Btn v="secondary" onClick={()=>deleteCl(editCl.id)}>🗑 Supprimer</Btn>}
    <Btn v="secondary" onClick={()=>setEditCl(null)}>Annuler</Btn>
    </div>
    </>;
   })()}
  </Modal>
 </div>;
}/* PROACTIVE INSIGHTS ENGINE */
export function genInsights(evo,hs,rw,myActions,soc,reps,allM){
 const ins=[];const last=evo.length>0?evo[evo.length-1]:null;const prev=evo.length>1?evo[evo.length-2]:null;
 if(!last)return ins;
 if(prev){
  const caD=last.ca-prev.ca;const caPct=prev.ca>0?Math.round(caD/prev.ca*100):0;
  if(caPct<-15)ins.push({type:"danger",icon:"📉",title:`CA en baisse de ${Math.abs(caPct)}%`,desc:`Votre CA est passé de ${fmt(prev.ca)}€ à ${fmt(last.ca)}€. ${last.charges>prev.charges?"Vos charges ont aussi augmenté.":"Vos charges sont stables, c'est le revenu qui baisse."}`,tip:"Analysez quels clients ou canaux ont baissé"});
  else if(caPct>20)ins.push({type:"success",icon:"🚀",title:`Croissance de +${caPct}% ce mois`,desc:`CA de ${fmt(last.ca)}€ contre ${fmt(prev.ca)}€ le mois dernier. Belle progression !`,tip:"Identifiez ce qui a fonctionné pour reproduire"});
  const margeDiff=last.margePct-prev.margePct;
  if(margeDiff<-10)ins.push({type:"warning",icon:"💸",title:`Marge en chute de ${Math.abs(margeDiff)} points`,desc:`Marge à ${last.margePct}% contre ${prev.margePct}%. ${last.salaire>prev.salaire?"Votre rémunération a augmenté.":last.chargesOps>prev.chargesOps?"Charges opérationnelles en hausse.":"Vos charges globales pèsent plus lourd."}`,tip:"Passez en revue vos postes de dépenses"});
  if(last.leads>0&&prev.leads>0){
   const closR=last.leadsClos>0?Math.round(last.leadsClos/last.leads*100):0;
   const prevClosR=prev.leadsClos>0?Math.round(prev.leadsClos/prev.leads*100):0;
   if(closR<prevClosR-10)ins.push({type:"warning",icon:"🎯",title:`Taux closing en baisse: ${closR}% vs ${prevClosR}%`,desc:"Vos leads convertissent moins bien",tip:"Revoyez votre process commercial ou la qualité des leads"});
  }
 }
 if(rw&&rw.months<3)ins.push({type:"danger",icon:"⚠",title:`Runway critique: ${rw.months} mois`,desc:`Votre trésorerie de ${fmt(last.treso)}€ ne couvre que ${rw.months} mois de charges.`,tip:"Réduisez les dépenses non-essentielles ou accélérez l'encaissement"});
 else if(rw&&rw.months>=9)ins.push({type:"success",icon:"💪",title:`Runway confortable: ${rw.months} mois`,desc:"Vous avez une marge de manœuvre pour investir",tip:"Envisagez un investissement en croissance (ads, recrutement, outils)"});
 if(last.chargesOps>0&&last.ca>0&&last.chargesOps/last.ca>0.3)ins.push({type:"warning",icon:"⚙",title:"Charges opé élevées ("+pct(last.chargesOps,last.ca)+"%)",desc:`${fmt(last.chargesOps)}€ en logiciels/outils sur ${fmt(last.ca)}€ de CA`,tip:"Auditez vos abonnements, certains sont peut-être sous-utilisés"});
 const lateAct=myActions.filter(a=>!a.done&&a.deadline&&a.deadline<curM());
 if(lateAct.length>=3)ins.push({type:"warning",icon:"📋",title:`${lateAct.length} actions en retard`,desc:"Des actions stratégiques ne sont pas réalisées à temps",tip:"Priorisez ou réévaluez les actions non-pertinentes"});
 if(evo.length>=3){const last3=evo.slice(-3);const allUp=last3.every((d,i)=>i===0||d.ca>=last3[i-1].ca);if(allUp)ins.push({type:"success",icon:"📈",title:"3 mois de croissance consécutive",desc:`CA en hausse depuis ${last3[0].mois}`,tip:"Momentum positif — maintenez votre stratégie actuelle"});}
 return ins.slice(0,4);
}

/* ANONYMOUS BENCHMARK */
/* ANONYMOUS BENCHMARK */
export function calcBenchmark(soc,reps,socs,cM2){
 const actS=socs.filter(s=>s.stat==="active");if(actS.length<2)return null;
 const vals=actS.map(s=>{const r=gr(reps,s.id,cM2);if(!r)return null;const ca=pf(r.ca),ch=pf(r.charges),marg=ca>0?Math.round((ca-ch)/ca*100):0;const hs2=healthScore(s,reps);return{id:s.id,ca,marge:marg,score:hs2.score,treso:pf(r.tresoSoc)};}).filter(Boolean);
 if(vals.length<2)return null;
 const me=vals.find(v=>v.id===soc.id);if(!me)return null;
 const rank=(arr,val)=>{const sorted=[...arr].sort((a,b)=>a-b);const pos=sorted.indexOf(val);return pos>=0?Math.round((pos+1)/sorted.length*100):50;};
 const metrics=[
  {label:"CA",value:fmt(me.ca)+"€",pctile:rank(vals.map(v=>v.ca),me.ca),color:C.acc},
  {label:"Marge",value:me.marge+"%",pctile:rank(vals.map(v=>v.marge),me.marge),color:me.marge>0?C.g:C.r},
  {label:"Score santé",value:me.score+"/100",pctile:rank(vals.map(v=>v.score),me.score),color:me.score>=70?C.g:me.score>=40?C.o:C.r},
  {label:"Trésorerie",value:fmt(me.treso)+"€",pctile:rank(vals.map(v=>v.treso),me.treso),color:C.b},
 ];
 const median=(arr)=>{const s=[...arr].sort((a,b)=>a-b);const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;};
 return{metrics,total:actS.length,medianCA:median(vals.map(v=>v.ca)),medianScore:median(vals.map(v=>v.score))};
}

/* CONTEXTUAL PLAYBOOKS */
/* CONTEXTUAL PLAYBOOKS */
export function getPlaybooks(evo,hs,rw,clients){
 const tips=[];const last=evo.length>0?evo[evo.length-1]:null;if(!last)return tips;
 const prev=evo.length>1?evo[evo.length-2]:null;
 if(hs.margin<10)tips.push({icon:"💰",title:"Optimiser ma rentabilité",items:["Identifiez les 3 postes de charges les plus élevés","Négociez vos tarifs fournisseurs (annuel vs mensuel)","Calculez le coût réel de chaque outil vs sa valeur","Augmentez vos prix si votre marge <20%"],color:C.g});
 if(hs.retention<10)tips.push({icon:"🔒",title:"Améliorer ma rétention client",items:["Contactez chaque client perdu pour comprendre pourquoi","Mettez en place un onboarding client structuré","Créez un check-in trimestriel avec vos top clients","Proposez des engagements annuels à prix avantageux"],color:C.b});
 if(last.leads>0&&last.leadsClos>0&&last.leadsClos/last.leads<0.15)tips.push({icon:"🎯",title:"Améliorer mon taux de closing",items:["Qualifiez mieux vos leads avant le premier contact","Raccourcissez votre cycle de vente (max 2 relances)","Préparez des cas clients / témoignages","Testez l'offre d'essai ou la démo gratuite"],color:C.o});
 if(rw&&rw.months<6)tips.push({icon:"⚡",title:"Sécuriser ma trésorerie",items:["Facturez immédiatement, pas à 30 jours","Proposez un escompte pour paiement anticipé","Reportez les investissements non-urgents","Diversifiez vos sources de revenus"],color:C.r});
 if(hs.growth<10&&prev)tips.push({icon:"📈",title:"Relancer ma croissance",items:["Lancez une campagne de referral avec vos clients actuels","Testez un nouveau canal d'acquisition (pub, partenariats)","Proposez un upsell / cross-sell à vos clients existants","Créez du contenu qui attire vos prospects idéaux"],color:C.v});
 return tips.slice(0,3);
}

/* PERSONAL GOALS */
const DEFAULT_GOALS=[
 {id:"ca",label:"CA mensuel",icon:"💰",unit:"€",field:"ca"},
 {id:"clients",label:"Nouveaux clients",icon:"👥",unit:"",field:"clients"},
 {id:"marge",label:"Marge minimum",icon:"📊",unit:"%",field:null},
 {id:"treso",label:"Trésorerie cible",icon:"🏦",unit:"€",field:"tresoSoc"},
];

export function GoalEditor({goals,setGoals,evo}){
 const last=evo.length>0?evo[evo.length-1]:null;
 return <div style={{marginBottom:14}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>🎯 MES OBJECTIFS DU MOIS</div>
  </div>
  <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
  {DEFAULT_GOALS.map(g=>{
   const goal=goals[g.id]||0;const current=g.id==="marge"?(last?last.margePct:0):g.field&&last?last[g.field]||0:0;
   const progress=goal>0?Math.min(100,Math.round(current/goal*100)):0;
   const hit=goal>0&&current>=goal;
   return <div key={g.id} className="fu" style={{background:C.card,border:`1px solid ${hit?C.g:C.brd}`,borderRadius:10,padding:"10px 12px",transition:"all .2s"}}>
    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
     <span style={{fontSize:12}}>{g.icon}</span>
     <span style={{fontSize:9,color:C.td,fontWeight:600,flex:1}}>{g.label}</span>
     {hit&&<span style={{fontSize:10,color:C.g}}>✓</span>}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
     <input value={goal||""} onChange={e=>{const v=parseInt(e.target.value)||0;setGoals(p=>({...p,[g.id]:v}));}} placeholder="Objectif" type="number" style={{width:60,background:C.card2,border:`1px solid ${C.brd}`,borderRadius:5,color:C.t,fontSize:11,padding:"3px 6px",fontFamily:FONT,outline:"none"}}/>
     <span style={{fontSize:8,color:C.td}}>{g.unit}</span>
     <div style={{flex:1,textAlign:"right"}}>
      <span style={{fontSize:12,fontWeight:800,color:hit?C.g:goal>0?C.t:C.td}}>{g.id==="marge"?current+"%":fmt(current)}{g.id!=="marge"&&g.unit?g.unit:""}</span>
     </div>
    </div>
    {goal>0&&<div style={{marginTop:6}}>
     <div style={{height:3,background:C.brd,borderRadius:2,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${progress}%`,background:hit?C.g:progress>60?C.acc:C.o,borderRadius:2,transition:"width .4s"}}/>
     </div>
     <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{fontSize:7,color:C.td}}>{progress}%</span></div>
    </div>}
   </div>;
  })}
  </div>
 </div>;
}

/* CELEBRATION OVERLAY */
/* CELEBRATION OVERLAY */
export function CelebrationOverlay({milestone,onClose}){
 const[show,setShow]=useState(true);
 useEffect(()=>{const t=setTimeout(()=>{setShow(false);setTimeout(onClose,400);},5000);return()=>clearTimeout(t);},[]);
 const colors=["#FFAA00","#34d399","#60a5fa","#a78bfa","#fb923c","#f87171"];
 return <div style={{position:"fixed",inset:0,zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.7)",opacity:show?1:0,transition:"opacity .4s",pointerEvents:"auto"}} onClick={()=>{setShow(false);setTimeout(onClose,400);}}>
  {/* Confetti */}
  {Array.from({length:30}).map((_,i)=><div key={i} style={{position:"fixed",left:`${Math.random()*100}%`,top:-20,width:8+Math.random()*8,height:8+Math.random()*8,background:colors[i%colors.length],borderRadius:Math.random()>.5?"50%":"2px",animation:`confetti ${2+Math.random()*2}s ease-in ${Math.random()*.8}s both`,transform:`rotate(${Math.random()*360}deg)`}}/>)}
  {/* Card */}
  <div onClick={e=>e.stopPropagation()} style={{background:`linear-gradient(135deg,${C.card} 0%,#1a1a2c 100%)`,border:`2px solid ${C.acc}44`,borderRadius:20,padding:"32px 28px",maxWidth:340,textAlign:"center",animation:"celebIn .5s cubic-bezier(.16,1,.3,1) both",boxShadow:`0 0 60px rgba(255,170,0,.15)`}}>
   <div style={{fontSize:48,marginBottom:12,animation:"celebGlow 2s ease infinite"}}>{milestone.icon}</div>
   <div style={{color:C.acc,fontSize:10,fontWeight:700,letterSpacing:1.5,marginBottom:4}}>FÉLICITATIONS ! 🎉</div>
   <div style={{fontWeight:900,fontSize:20,color:C.t,marginBottom:6,fontFamily:FONT}}>{milestone.label}</div>
   <div style={{fontSize:12,color:C.td,lineHeight:1.5,marginBottom:16}}>Nouveau trophée débloqué par <strong style={{color:C.acc}}>Scale Corp</strong> — votre progression est remarquable !</div>
   <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:16}}>
    {["🥉","🥈","🥇","💎","👑"].map((t,i)=><span key={i} style={{fontSize:i<=(milestone.tier||0)?20:14,opacity:i<=(milestone.tier||0)?1:.2,transition:"all .3s",transitionDelay:`${i*.1}s`}}>{t}</span>)}
   </div>
   <button onClick={()=>{setShow(false);setTimeout(onClose,400);}} style={{background:`linear-gradient(135deg,${C.acc},#FF9D00)`,color:"#0a0a0f",border:"none",borderRadius:10,padding:"10px 24px",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:FONT}}>Continuer →</button>
  </div>
 </div>;
}

/* MEETING PREP */
/* MEETING PREP */
export function MeetingPrepView({soc,evo,myActions,myJournal,pulses,hs,rw,milestones,cM2,insights}){
 const last=evo.length>0?evo[evo.length-1]:null;const prev=evo.length>1?evo[evo.length-2]:null;
 const actionsDone=myActions.filter(a=>a.done);const actionsOpen=myActions.filter(a=>!a.done);
 const recentPulses=Object.entries(pulses).filter(([k])=>k.startsWith(soc.id+"_")).map(([k,v])=>({week:k.replace(soc.id+"_",""),...v})).sort((a,b)=>b.week.localeCompare(a.week)).slice(0,4);
 const newMilestones=milestones.filter(m=>m.unlocked).slice(-3);
 return <div>
  <div className="fu" style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"14px 16px",background:`linear-gradient(135deg,${C.card} 0%,#1a1a2c 100%)`,borderRadius:14,border:`1px solid ${C.acc}22`}}>
   <span style={{fontSize:24}}>📋</span>
   <div><div style={{fontWeight:800,fontSize:14,color:C.t}}>Prépa point mensuel</div><div style={{fontSize:10,color:C.td}}>Résumé auto-généré pour votre RDV avec Scale Corp</div></div>
  </div>
  {/* Situation */}
  <Sect title="Situation actuelle">
   <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:6,marginBottom:10}}>
    <KPI label="CA" value={last?`${fmt(last.ca)}€`:"—"} accent={C.acc} icon="💰" small/>
    <KPI label="Marge" value={last?`${last.margePct}%`:"—"} accent={last&&last.marge>=0?C.g:C.r} icon="📊" small/>
    <KPI label="Score" value={`${hs.grade} (${hs.score})`} accent={hs.color} icon="❤" small/>
    {rw&&<KPI label="Runway" value={`${rw.months}m`} accent={rw.months<3?C.r:rw.months<6?C.o:C.g} icon="⏳" small/>}
   </div>
   {prev&&<div style={{padding:"8px 10px",background:C.card2,borderRadius:8,fontSize:10,color:C.td,lineHeight:1.5}}>
    Variation CA : <strong style={{color:last.ca>=prev.ca?C.g:C.r}}>{last.ca>=prev.ca?"+":"−"}{prev.ca>0?pct(Math.abs(last.ca-prev.ca),prev.ca):0}%</strong> · Marge : <strong style={{color:last.margePct>=prev.margePct?C.g:C.r}}>{last.margePct>=prev.margePct?"+":"−"}{Math.abs(last.margePct-prev.margePct)} pts</strong>
   </div>}
  </Sect>
  {/* Insights / alertes */}
  {insights.length>0&&<Sect title="Points d'attention">
   {insights.map((ins,i)=><div key={i} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:i<insights.length-1?`1px solid ${C.brd}08`:"none"}}>
    <span style={{fontSize:14}}>{ins.icon}</span>
    <div><div style={{fontWeight:600,fontSize:11,color:ins.type==="danger"?C.r:ins.type==="warning"?C.o:C.g}}>{ins.title}</div><div style={{fontSize:9,color:C.td,marginTop:1}}>{ins.tip}</div></div>
   </div>)}
  </Sect>}
  {/* Actions */}
  <Sect title={`Actions (${actionsDone.length} faites / ${actionsOpen.length} en cours)`}>
   {actionsOpen.length>0&&<div style={{marginBottom:8}}>{actionsOpen.slice(0,5).map(a=><div key={a.id} style={{fontSize:10,color:C.t,padding:"3px 0",display:"flex",gap:5}}>
    <span style={{color:a.deadline<cM2?C.r:C.o}}>○</span><span>{a.text}</span>{a.deadline<cM2&&<span style={{fontSize:8,color:C.r,fontWeight:600}}>retard</span>}
   </div>)}</div>}
   {actionsDone.length>0&&<div style={{borderTop:`1px solid ${C.brd}`,paddingTop:6}}>{actionsDone.slice(-3).map(a=><div key={a.id} style={{fontSize:10,color:C.td,padding:"2px 0"}}><span style={{color:C.g}}>✓</span> {a.text}</div>)}</div>}
   {actionsOpen.length===0&&actionsDone.length===0&&<div style={{fontSize:10,color:C.td}}>Aucune action en cours</div>}
  </Sect>
  {/* Pulses */}
  {recentPulses.length>0&&<Sect title="Mood récent">
   <div style={{display:"flex",gap:6}}>
   {recentPulses.map((p,i)=><div key={i} style={{flex:1,textAlign:"center",padding:"6px 4px",background:C.card2,borderRadius:8}}>
    <div style={{fontSize:16}}>{"😫😕😐🙂😄"[clamp(p.mood-1,0,4)]}</div>
    <div style={{fontSize:8,color:C.td,marginTop:2}}>{p.mood}/5</div>
    {p.win&&<div style={{fontSize:7,color:C.g,marginTop:2,lineHeight:1.2}}>{p.win.slice(0,30)}</div>}
   </div>)}
   </div>
  </Sect>}
  {/* Milestones disabled */}
  {/* Questions à préparer */}
  <Sect title="Questions à poser">
   <div style={{padding:"10px 12px",background:C.card2,borderRadius:8,color:C.td,fontSize:10,lineHeight:1.7}}>
    <div>• Quels sont mes 3 leviers prioritaires pour le prochain mois ?</div>
    <div>• Y a-t-il des synergies avec d'autres sociétés du portfolio ?</div>
    {rw&&rw.months<6&&<div>• Stratégie pour renforcer ma trésorerie ?</div>}
    {actionsOpen.length>3&&<div>• Peut-on reprioriser mes actions (j'en ai {actionsOpen.length} en parallèle) ?</div>}
    <div>• Quelles ressources Scale Corp sont sous-exploitées ?</div>
   </div>
  </Sect>
 </div>;
}

export function CollapsibleSection({title,icon,children,defaultOpen=false}){
 const[open,setOpen]=useState(defaultOpen);
 return <div style={{marginBottom:8,border:`1px solid ${C.brd}`,borderRadius:10,overflow:"hidden",background:C.card2}}>
  <button onClick={()=>setOpen(!open)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 12px",border:"none",background:"transparent",cursor:"pointer",fontFamily:FONT,textAlign:"left"}}>
   <span style={{fontSize:12}}>{icon}</span>
   <span style={{flex:1,fontWeight:600,fontSize:11,color:C.t}}>{title}</span>
   <span style={{fontSize:9,color:C.td,transition:"transform .2s",transform:open?"rotate(90deg)":"rotate(0)"}}>▶</span>
  </button>
  <div style={{maxHeight:open?500:0,overflow:"hidden",transition:"max-height .25s ease",opacity:open?1:0}}>
   <div style={{padding:"0 12px 10px"}}>{children}</div>
  </div>
 </div>;
}

export function SocSettingsPanel({soc,save,socs,clients}){
 const[form,setForm]=useState({nom:soc.nom,porteur:soc.porteur,act:soc.act,color:soc.color,logo:soc.logo||"",email:soc.email||"",phone:soc.phone||"",desc:soc.desc||"",logoUrl:soc.logoUrl||"",brandColor:soc.brandColor||"",brandColorSecondary:soc.brandColorSecondary||"",portalEnabled:soc.portalEnabled||false});
 const[saved,setSaved]=useState(false);
 const fileRef=useRef(null);
 const doSave=()=>{const updated=socs.map(s=>s.id===soc.id?{...s,...form}:s);save(updated,null,null);setSaved(true);setTimeout(()=>setSaved(false),2500);};
 const handleLogoUpload=(e)=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith("image/"))return;if(file.size>2*1024*1024){showToast("Image trop lourde (max 2 Mo)", "error");return;}const reader=new FileReader();reader.onload=(ev)=>{setForm(f=>({...f,logoUrl:ev.target.result}));};reader.readAsDataURL(file);};
 const accent=form.brandColor||form.color;
 const accent2=form.brandColorSecondary||"";
 return <Sect title="⚙️ Paramètres" sub={soc.nom}>
  {saved&&<div style={{background:C.gD,border:`1px solid ${C.g}22`,borderRadius:8,padding:"8px 12px",marginBottom:12,color:C.g,fontSize:11,fontWeight:700}}>✅ Paramètres sauvegardés</div>}
  {/* Branding section */}
  <Card style={{padding:16,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}><span style={{fontSize:16}}>🎨</span><div><div style={{fontWeight:800,fontSize:13,color:C.t}}>Branding</div><div style={{fontSize:10,color:C.td}}>Personnalisez l'apparence de votre espace</div></div></div>
   {/* Logo upload */}
   <div style={{marginBottom:14}}>
    <label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:6,letterSpacing:.3}}>Logo / Photo de profil</label>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
     <div style={{width:64,height:64,borderRadius:32,background:accent+"15",border:`2px dashed ${accent}44`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,cursor:"pointer",transition:"border-color .2s"}} onClick={()=>fileRef.current?.click()} onMouseEnter={e=>e.currentTarget.style.borderColor=accent} onMouseLeave={e=>e.currentTarget.style.borderColor=accent+"44"}>
      {form.logoUrl?<img src={form.logoUrl} alt={form.nom||"Logo société"} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:10,color:C.td,textAlign:"center",lineHeight:1.2}}>📷<br/>Cliquer</span>}
     </div>
     <div style={{flex:1}}>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={handleLogoUpload} style={{display:"none"}}/>
      <Btn small v="secondary" onClick={()=>fileRef.current?.click()}>📁 Choisir une image</Btn>
      <div style={{fontSize:9,color:C.tm,marginTop:4}}>JPEG ou PNG, max 2 Mo</div>
      {form.logoUrl&&<Btn small v="ghost" onClick={()=>setForm({...form,logoUrl:""})} style={{marginTop:4,fontSize:9}}>✕ Supprimer le logo</Btn>}
     </div>
    </div>
    <Inp label="Ou URL externe" value={form.logoUrl.startsWith("data:")?"":(form.logoUrl||"")} onChange={v=>setForm({...form,logoUrl:v})} placeholder="https://..." small note="Laisser vide pour utiliser le fichier uploadé"/>
   </div>
   {/* Color pickers */}
   <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
    <div>
     <label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:4,letterSpacing:.3}}>Couleur principale</label>
     <div style={{display:"flex",alignItems:"center",gap:8}}>
      <input type="color" value={form.brandColor||form.color} onChange={e=>setForm({...form,brandColor:e.target.value})} style={{width:36,height:28,border:`1px solid ${C.brd}`,borderRadius:8,background:C.bg,cursor:"pointer",padding:1}}/>
      <span style={{fontSize:10,color:C.td,fontFamily:"monospace"}}>{form.brandColor||form.color}</span>
      {form.brandColor&&<Btn small v="ghost" onClick={()=>setForm({...form,brandColor:""})} style={{fontSize:8,padding:"2px 6px"}}>Reset</Btn>}
     </div>
    </div>
    <div>
     <label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:4,letterSpacing:.3}}>Couleur secondaire <span style={{fontWeight:400,color:C.tm}}>(optionnel)</span></label>
     <div style={{display:"flex",alignItems:"center",gap:8}}>
      <input type="color" value={form.brandColorSecondary||"#60a5fa"} onChange={e=>setForm({...form,brandColorSecondary:e.target.value})} style={{width:36,height:28,border:`1px solid ${C.brd}`,borderRadius:8,background:C.bg,cursor:"pointer",padding:1}}/>
      <span style={{fontSize:10,color:C.td,fontFamily:"monospace"}}>{form.brandColorSecondary||"—"}</span>
      {form.brandColorSecondary&&<Btn small v="ghost" onClick={()=>setForm({...form,brandColorSecondary:""})} style={{fontSize:8,padding:"2px 6px"}}>Reset</Btn>}
     </div>
    </div>
   </div>
   {/* Preview */}
   <div style={{background:C.bg,border:`1px solid ${C.brd}`,borderRadius:10,padding:14}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>APERÇU</div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
     <div style={{width:36,height:36,borderRadius:18,background:accent+"22",border:`2px solid ${accent}44`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
      {form.logoUrl?<img src={form.logoUrl} alt={form.nom||"Logo société"} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:14,fontWeight:900,color:accent}}>{(form.nom||"?")[0]}</span>}
     </div>
     <div><div style={{fontWeight:800,fontSize:13,color:accent}}>{form.nom||"Ma société"}</div><div style={{fontSize:9,color:C.td}}>{form.porteur}</div></div>
    </div>
    <div style={{display:"flex",gap:8}}>
     <div style={{flex:1,background:C.card,border:`1px solid ${accent}33`,borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:8,color:C.td}}>KPI</div><div style={{fontWeight:800,fontSize:14,color:accent}}>12 500€</div></div>
     <div style={{flex:1,background:C.card,border:`1px solid ${(accent2||C.b)}33`,borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:8,color:C.td}}>KPI 2</div><div style={{fontWeight:800,fontSize:14,color:accent2||C.b}}>8 200€</div></div>
    </div>
   </div>
  </Card>
  {/* Monthly CA Goal */}
  <Card style={{padding:16,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{fontSize:16}}>🎯</span><div><div style={{fontWeight:800,fontSize:13,color:C.t}}>Objectif mensuel</div><div style={{fontSize:10,color:C.td}}>Utilisé dans le Dashboard pour le ring de progression</div></div></div>
   <Inp label="Objectif CA mensuel (€)" value={soc.obj||""} onChange={v=>{const updated=socs.map(s=>s.id===soc.id?{...s,obj:pf(v)}:s);save(updated,null,null);}} type="number" suffix="€" placeholder="Ex: 10000"/>
  </Card>
  {/* 📣 Meta Ads Data */}
  <Card style={{padding:16,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{fontSize:16}}>📣</span><div><div style={{fontWeight:800,fontSize:13,color:C.t}}>Publicité Meta</div><div style={{fontSize:10,color:C.td}}>Renseignez vos données publicitaires mensuelles</div></div></div>
   {(()=>{
    const now=new Date();const monthOpts=[];for(let i=0;i<7;i++){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;monthOpts.push({v:k,l:ml(k)});}
    const[metaMonth,setMetaMonth]=useState(curM());
    const metaKey=`metaAds_${soc.id}_${metaMonth}`;
    const[metaForm,setMetaForm]=useState(()=>{try{return JSON.parse(localStorage.getItem(metaKey))||{spend:0,impressions:0,clicks:0,leads:0,revenue:0};}catch{return{spend:0,impressions:0,clicks:0,leads:0,revenue:0};}});
    const[metaSaved,setMetaSaved]=useState(false);
    const loadMeta=(mo)=>{setMetaMonth(mo);try{const raw=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${mo}`));setMetaForm(raw||{spend:0,impressions:0,clicks:0,leads:0,revenue:0});}catch{setMetaForm({spend:0,impressions:0,clicks:0,leads:0,revenue:0});}};
    const saveMeta=()=>{try{localStorage.setItem(metaKey,JSON.stringify(metaForm));sSet(metaKey,metaForm);sbUpsert('meta_ads',{society_id:soc.id,month:metaMonth,...metaForm});}catch{}setMetaSaved(true);setTimeout(()=>setMetaSaved(false),2000);};
    return <>
     <Sel label="Mois" value={metaMonth} onChange={loadMeta} options={monthOpts}/>
     <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
      <Inp label="Dépenses pub (€)" type="number" value={metaForm.spend||""} onChange={v=>setMetaForm({...metaForm,spend:pf(v)})} suffix="€"/>
      <Inp label="Impressions" type="number" value={metaForm.impressions||""} onChange={v=>setMetaForm({...metaForm,impressions:parseInt(v)||0})}/>
      <Inp label="Clics" type="number" value={metaForm.clicks||""} onChange={v=>setMetaForm({...metaForm,clicks:parseInt(v)||0})}/>
      <Inp label="Leads" type="number" value={metaForm.leads||""} onChange={v=>setMetaForm({...metaForm,leads:parseInt(v)||0})}/>
      <Inp label="Revenue généré (€)" type="number" value={metaForm.revenue||""} onChange={v=>setMetaForm({...metaForm,revenue:pf(v)})} suffix="€"/>
     </div>
     {metaSaved&&<div style={{background:C.gD,border:`1px solid ${C.g}22`,borderRadius:8,padding:"6px 10px",marginBottom:8,color:C.g,fontSize:10,fontWeight:700}}>✅ Données Meta sauvegardées</div>}
     <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <Btn small onClick={saveMeta}>💾 Sauvegarder Meta</Btn>
      <span style={{fontSize:9,color:C.td}}>💡 Bientôt automatisé via l'API Meta Ads</span>
     </div>
    </>;
   })()}
  </Card>
  {/* 📊 Données Sales */}
  <Card style={{padding:16,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{fontSize:16}}>📊</span><div><div style={{fontWeight:800,fontSize:13,color:C.t}}>Données Sales</div><div style={{fontSize:10,color:C.td}}>No-show mensuels et données complémentaires</div></div></div>
   {(()=>{
    const now=new Date();const monthOpts=[];for(let i=0;i<7;i++){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;monthOpts.push({v:k,l:ml(k)});}
    const[salesMonth,setSalesMonth]=useState(curM());
    const[noShowVal,setNoShowVal]=useState(()=>parseInt(localStorage.getItem(`salesNoShow_${soc.id}_${curM()}`)||"0"));
    const[salesSaved,setSalesSaved]=useState(false);
    const loadSales=(mo)=>{setSalesMonth(mo);setNoShowVal(parseInt(localStorage.getItem(`salesNoShow_${soc.id}_${mo}`)||"0"));};
    const saveSales=()=>{localStorage.setItem(`salesNoShow_${soc.id}_${salesMonth}`,String(noShowVal));setSalesSaved(true);setTimeout(()=>setSalesSaved(false),2000);};
    return <>
     <Sel label="Mois" value={salesMonth} onChange={loadSales} options={monthOpts}/>
     <Inp label="Nombre de no-show" type="number" value={noShowVal||""} onChange={v=>setNoShowVal(parseInt(v)||0)}/>
     {salesSaved&&<div style={{background:C.gD,border:`1px solid ${C.g}22`,borderRadius:8,padding:"6px 10px",marginBottom:8,color:C.g,fontSize:10,fontWeight:700}}>✅ Données Sales sauvegardées</div>}
     <Btn small onClick={saveSales}>💾 Sauvegarder Sales</Btn>
    </>;
   })()}
  </Card>
  {/* Theme Presets */}
  <Card style={{padding:16,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{fontSize:16}}>🎨</span><div><div style={{fontWeight:800,fontSize:13,color:C.t}}>Presets de couleur</div><div style={{fontSize:10,color:C.td}}>Choisissez un thème pré-défini</div></div></div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(80px,1fr))",gap:8}}>
    {[{n:"Doré",c:"#FFAA00"},{n:"Bleu",c:"#3b82f6"},{n:"Vert",c:"#22c55e"},{n:"Violet",c:"#8b5cf6"},{n:"Rose",c:"#ec4899"},{n:"Turquoise",c:"#14b8a6"},{n:"Orange",c:"#f97316"},{n:"Rouge",c:"#ef4444"}].map(p=><button key={p.c} onClick={()=>setForm(f=>({...f,brandColor:p.c}))} style={{padding:"10px 6px",borderRadius:10,border:`2px solid ${form.brandColor===p.c?p.c:C.brd}`,background:form.brandColor===p.c?p.c+"15":"transparent",cursor:"pointer",textAlign:"center",transition:"all .2s"}}>
     <div style={{width:24,height:24,borderRadius:12,background:p.c,margin:"0 auto 4px",boxShadow:`0 2px 8px ${p.c}44`}}/>
     <div style={{fontSize:9,fontWeight:form.brandColor===p.c?700:500,color:form.brandColor===p.c?p.c:C.td}}>{p.n}</div>
    </button>)}
   </div>
  </Card>
  {/* Data Export */}
  <Card style={{padding:16,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{fontSize:16}}>📤</span><div><div style={{fontWeight:800,fontSize:13,color:C.t}}>Export de données</div><div style={{fontSize:10,color:C.td}}>Téléchargez toutes vos données</div></div></div>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    <Btn small v="secondary" onClick={()=>{
     const myCl=(clients||[]).filter(c2=>c2.socId===soc.id);
     const hdr="Nom,Email,Téléphone,Statut,Type,Montant,Domaine";
     const rows=myCl.map(c2=>[c2.name||"",c2.email||"",c2.phone||"",c2.status||"",c2.billing?.type||"",c2.billing?.amount||"",c2.domain||""].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(","));
     const csv=hdr+"\n"+rows.join("\n");const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`clients_${soc.nom}_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
    }}>📥 Clients (CSV)</Btn>
    <Btn small v="secondary" onClick={()=>{
     const allData={societe:{nom:soc.nom,porteur:soc.porteur,act:soc.act},clients:(clients||[]).filter(c2=>c2.socId===soc.id),tasks:manualTasks||[],exportedAt:new Date().toISOString()};
     const blob=new Blob([JSON.stringify(allData,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`export_${soc.nom}_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
    }}>📥 Tout (JSON)</Btn>
   </div>
  </Card>
  {/* Client Portal */}
  <Card style={{padding:16,marginTop:12}}>
   <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><span style={{fontSize:16}}>🌐</span><div><div style={{fontWeight:800,fontSize:13,color:C.t}}>Portail Client</div><div style={{fontSize:10,color:C.td}}>Partagez un accès lecture seule à vos clients</div></div></div>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
    <span style={{fontSize:11,color:C.t}}>Activer le portail client</span>
    <button onClick={()=>setForm(f=>({...f,portalEnabled:!f.portalEnabled}))} style={{width:40,height:22,borderRadius:11,border:"none",background:form.portalEnabled?C.g:C.brd,cursor:"pointer",position:"relative",transition:"background .2s"}}><div style={{width:18,height:18,borderRadius:9,background:"white",position:"absolute",top:2,left:form.portalEnabled?20:2,transition:"left .2s"}}/></button>
   </div>
   {form.portalEnabled&&<div style={{background:C.bg,borderRadius:8,padding:10,border:`1px solid ${C.brd}`}}>
    <div style={{fontSize:10,color:C.td,marginBottom:6}}>Liens partageables par client :</div>
    {(clients||[]).filter(c2=>c2.socId===soc.id&&c2.status==="active").slice(0,5).map(c2=><div key={c2.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.brd}08`}}>
     <span style={{fontSize:10,color:C.t}}>{c2.name}</span>
     <button onClick={()=>{navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}#portal/${soc.id}/${c2.id}`);}} style={{padding:"2px 8px",borderRadius:6,border:`1px solid ${C.brd}`,background:"transparent",color:C.acc,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>📋 Copier</button>
    </div>)}
   </div>}
  </Card>
  <Btn onClick={doSave}>💾 Sauvegarder</Btn>
 </Sect>;
}
/* NOTIFICATION CENTER (Porteur) */
/* NOTIFICATION CENTER (Porteur) */
export function genPorteurNotifications(soc,reps,socBank,ghlData,clients,allM){
 const notifs=[];const cm=curM();const pm=prevM(cm);
 const r=gr(reps,soc.id,cm);const rp=gr(reps,soc.id,pm);
 const bankData=socBank?.[soc.id];
 const ca=pf(r?.ca);const prevCa=pf(rp?.ca);
 const balance=bankData?.balance||0;
 const excluded=EXCLUDED_ACCOUNTS[soc.id]||[];
 // Recent positive transactions > 100€
 if(bankData?.transactions){
  bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg||isExcludedTx(t,excluded))return false;return leg.amount>100;}).slice(0,3).forEach(t=>{
   const leg=t.legs?.[0];
   notifs.push({id:"tx_"+t.id,icon:"💰",msg:`Paiement reçu: +${fmt(leg.amount)}€`,time:t.created_at,type:"success",tab:5});
  });
 }
 // CA trend
 if(prevCa>0&&ca>prevCa){const pctG=Math.round((ca-prevCa)/prevCa*100);notifs.push({id:"ca_trend",icon:"📈",msg:`CA en hausse de ${pctG}% vs mois dernier`,time:new Date().toISOString(),type:"success",tab:0});}
 // Low treasury
 if(balance>0&&balance<2000)notifs.push({id:"treso_low",icon:"⚠️",msg:`Trésorerie basse: ${fmt(balance)}€`,time:new Date().toISOString(),type:"warning",tab:5});
 // Won deals from GHL
 const gd=ghlData?.[soc.id];
 if(gd?.stats?.wonDeals>0)notifs.push({id:"deals_won",icon:"🎯",msg:`${gd.stats.wonDeals} deal${gd.stats.wonDeals>1?"s":""} gagné${gd.stats.wonDeals>1?"s":""}!`,time:gd.lastSync||new Date().toISOString(),type:"success",tab:2});
 // Commitment ending soon
 (clients||[]).filter(c=>c.socId===soc.id&&c.status==="active").forEach(c=>{
  const rem=commitmentRemaining(c);
  if(rem!==null&&rem<=2&&rem>0)notifs.push({id:"commit_"+c.id,icon:"📅",msg:`Fin d'engagement proche: ${c.name} (${rem} mois)`,time:new Date().toISOString(),type:"warning",tab:9});
 });
 // Upcoming RDVs today
 const calEvts=gd?.calendarEvents||[];const todayStr=new Date().toISOString().slice(0,10);
 const todayEvts=calEvts.filter(e=>(e.startTime||"").startsWith(todayStr)&&new Date(e.startTime)>new Date());
 if(todayEvts.length>0)notifs.push({id:"rdv_today",icon:"📅",msg:`${todayEvts.length} RDV aujourd'hui`,time:new Date().toISOString(),type:"info",tab:11});
 // New leads recently
 const ghlCl=gd?.ghlClients||[];const recent24h=ghlCl.filter(c=>new Date(c.at||0).getTime()>Date.now()-864e5);
 if(recent24h.length>0)notifs.push({id:"new_leads_24h",icon:"🟢",msg:`${recent24h.length} nouveau${recent24h.length>1?"x":""} lead${recent24h.length>1?"s":""}`,time:new Date().toISOString(),type:"info",tab:2});
 return notifs.sort((a,b)=>new Date(b.time)-new Date(a.time));
}
export function NotificationCenter({notifications,open,onClose,onNavigate}){
 const[readIds,setReadIds]=useState(()=>{try{return JSON.parse(localStorage.getItem("notif_read")||"[]");}catch{return[];}});
 const[dismissedIds,setDismissedIds]=useState(()=>{try{return JSON.parse(localStorage.getItem("notif_dismissed")||"[]");}catch{return[];}});
 const markRead=(id)=>{const n=[...new Set([...readIds,id])];setReadIds(n);localStorage.setItem("notif_read",JSON.stringify(n));};
 const markAllRead=()=>{const n=[...new Set([...readIds,...visible.map(x=>x.id)])];setReadIds(n);localStorage.setItem("notif_read",JSON.stringify(n));};
 const dismiss=(id)=>{const n=[...new Set([...dismissedIds,id])];setDismissedIds(n);localStorage.setItem("notif_dismissed",JSON.stringify(n));};
 const clearAll=()=>{const n=[...new Set([...dismissedIds,...visible.map(x=>x.id)])];setDismissedIds(n);localStorage.setItem("notif_dismissed",JSON.stringify(n));};
 const visible=notifications.filter(n=>!dismissedIds.includes(n.id));
 const handleClick=(n)=>{markRead(n.id);if(n.tab!=null&&onNavigate){onNavigate(n.tab);onClose();}};
 if(!open)return null;
 return <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.4)",animation:"fadeIn .2s ease"}}>
  <div onClick={e=>e.stopPropagation()} style={{position:"fixed",top:0,right:0,width:360,maxWidth:"92vw",height:"100vh",background:C.card,borderLeft:`1px solid ${C.brd}`,boxShadow:"-8px 0 40px rgba(0,0,0,.3)",animation:"slideInRight .25s cubic-bezier(.22,1,.36,1)",overflowY:"auto",padding:"20px 16px"}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
    <h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.t,fontFamily:FONT_TITLE}}>🔔 Notifications</h3>
    <button onClick={onClose} aria-label="Fermer" style={{background:"none",border:`1px solid ${C.brd}`,borderRadius:8,color:C.td,cursor:"pointer",fontSize:12,padding:"4px 10px",fontFamily:FONT}}>✕</button>
   </div>
   {visible.length>0&&<div style={{display:"flex",gap:6,marginBottom:14}}>
    <button onClick={markAllRead} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background=C.card2;e.currentTarget.style.color=C.t;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.td;}}>✓ Tout lu</button>
    <button onClick={clearAll} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background=C.rD;e.currentTarget.style.color=C.r;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.td;}}>🗑 Tout effacer</button>
   </div>}
   {visible.length===0&&<div style={{textAlign:"center",padding:40,color:C.td}}><div style={{fontSize:32,marginBottom:10}}>✅</div><div style={{fontSize:13,fontWeight:600}}>Aucune notification</div><div style={{fontSize:10,marginTop:4,opacity:.7}}>Tu es à jour !</div></div>}
   {visible.map((n,i)=>{
    const cMap={success:C.g,warning:C.o,info:C.b};const accent=cMap[n.type]||C.b;
    const isRead=readIds.includes(n.id);const hasNav=n.tab!=null;
    return <div key={n.id} onClick={()=>handleClick(n)} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",background:isRead?"transparent":accent+"08",border:`1px solid ${isRead?C.brd:accent+"22"}`,borderRadius:12,marginBottom:8,opacity:isRead?0.55:1,cursor:hasNav?"pointer":"default",transition:"all .25s cubic-bezier(.22,1,.36,1)",transform:"translateX(0)"}} onMouseEnter={e=>{if(hasNav){e.currentTarget.style.transform="translateX(-2px)";e.currentTarget.style.borderColor=accent+"55";e.currentTarget.style.boxShadow=`0 2px 12px ${accent}15`;}}} onMouseLeave={e=>{e.currentTarget.style.transform="translateX(0)";e.currentTarget.style.borderColor=isRead?C.brd:accent+"22";e.currentTarget.style.boxShadow="none";}}>
     <div style={{width:36,height:36,borderRadius:10,background:accent+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{n.icon}</div>
     <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:12,fontWeight:isRead?500:700,color:C.t,lineHeight:1.4}}>{n.msg}</div>
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
       <span style={{fontSize:9,color:C.td}}>{ago(n.time)}</span>
       {hasNav&&!isRead&&<span style={{fontSize:8,fontWeight:700,color:accent,background:accent+"15",padding:"1px 6px",borderRadius:4}}>Voir →</span>}
      </div>
     </div>
     <button onClick={e=>{e.stopPropagation();dismiss(n.id);}} aria-label="Fermer" style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:14,padding:"2px 4px",flexShrink:0,lineHeight:1,transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color=C.r} onMouseLeave={e=>e.currentTarget.style.color=C.td}>✕</button>
    </div>;
   })}
  </div>
 </div>;
}
/* AI CHAT FOR PORTEUR */
/* AI CHAT FOR PORTEUR */
export function PorteurAIChat({soc,reps,allM,socBank,ghlData,clients,embedded}){
 const[open,setOpen]=useState(false);const[msgs,setMsgs]=useState([]);const[typing,setTyping]=useState(false);const[revealIdx,setRevealIdx]=useState(-1);const[revealLen,setRevealLen]=useState(0);const[inputVal,setInputVal]=useState("");const ref=useRef(null);const inputRef=useRef(null);
 const cm=curM();const pm=prevM(cm);
 const parseNum=(s)=>{const m2=s.match(/(\d+[\s.,]?\d*)/);return m2?parseFloat(m2[1].replace(/\s/g,"").replace(",",".")):null;};
 const computeAnswer=(q)=>{
  const ql=q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const r=gr(reps,soc.id,cm);const rp=gr(reps,soc.id,pm);
  const ca=pf(r?.ca);const prevCa=pf(rp?.ca);const ch=pf(r?.charges);
  const marge=ca-ch;const margePct=ca>0?Math.round(marge/ca*100):0;
  const trend=prevCa>0?Math.round((ca-prevCa)/prevCa*100):0;
  const balance=socBank?.[soc.id]?.balance||0;
  const myCl=(clients||[]).filter(c=>c.socId===soc.id);
  const activeCl=myCl.filter(c=>c.status==="active");
  const churnedCl=myCl.filter(c=>c.status==="churned");
  const bankData=socBank?.[soc.id];
  const gd=ghlData?.[soc.id];
  const opps=gd?.opportunities||[];
  const calEvts=gd?.calendarEvents||[];
  const ghlCl=gd?.ghlClients||[];
  const stats=gd?.stats;
  const mrr=activeCl.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
  const monthGoal=pf(soc.obj)||0;
  const excluded=EXCLUDED_ACCOUNTS[soc.id]||[];
  const monthTxns=(bankData?.transactions||[]).filter(t=>{const leg=t.legs?.[0];if(!leg||isExcludedTx(t,excluded))return false;return(t.created_at||"").startsWith(cm);});

  // analyse — full breakdown
  if(ql.match(/^analyse/)){
   const convRate2=pf(r?.leads)>0?Math.round(pf(r?.leadsClos)/pf(r?.leads)*100):0;
   const openO2=opps.filter(o=>o.status==="open");const wonO2=opps.filter(o=>o.status==="won");
   const pVal2=openO2.reduce((a,o)=>a+(o.value||0),0);
   return `🔍 **Analyse complète — ${soc.nom}**\n\n💰 **Chiffre d'affaires**\n• CA mois : ${fmt(ca)}€ ${trend>0?"📈 +":"📉 "}${trend}%\n• Charges : ${fmt(ch)}€\n• Marge : ${fmt(marge)}€ (${margePct}%)\n• Trésorerie : ${fmt(balance)}€\n\n📈 **Conversion**\n• Leads : ${pf(r?.leads)||ghlCl.length}\n• Taux conversion : ${convRate2}%\n• CPL : ${pf(r?.pub)>0&&pf(r?.leads)>0?fmt(Math.round(pf(r?.pub)/pf(r?.leads)))+"€":"—"}\n\n🔄 **Pipeline**\n• ${openO2.length} deals ouverts (${fmt(pVal2)}€)\n• ${wonO2.length} gagnés\n• Valeur moy. : ${fmt(stats?.avgDealSize||0)}€\n\n👥 **Clients**\n• ${activeCl.length} actifs · MRR ${fmt(mrr)}€\n• ${churnedCl.length} perdus\n• Rétention : ${myCl.length>0?Math.round((1-churnedCl.length/myCl.length)*100):100}%`;
  }
  // risques — at-risk clients
  if(ql.match(/^risques?$|clients?.*risque/)){
   const now30=Date.now()-30*864e5;const now14d=Date.now()-14*864e5;
   const txsR=bankData?.transactions||[];
   const risks=activeCl.map(c=>{
    const cn=(c.name||"").toLowerCase().trim();const flags=[];
    const hasPaid=txsR.some(tx=>{const leg=tx.legs?.[0];return leg&&leg.amount>0&&new Date(tx.created_at||0).getTime()>now30&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});
    if(!hasPaid)flags.push("💸 Impayé >30j");
    const lastEvt=(calEvts||[]).filter(e=>(e.title||e.contactName||"").toLowerCase().includes(cn)).sort((a,b)=>new Date(b.startTime||0)-new Date(a.startTime||0))[0];
    if(!lastEvt||new Date(lastEvt.startTime||0).getTime()<now14d)flags.push("📞 Pas d'interaction >14j");
    const rem=commitmentRemaining(c);if(rem!==null&&rem<=2)flags.push(`⏰ ${rem} mois restant`);
    return{name:c.name,flags,rev:clientMonthlyRevenue(c)};
   }).filter(c=>c.flags.length>0).sort((a,b)=>b.flags.length-a.flags.length);
   if(risks.length===0)return `✅ **Aucun client à risque !**\n\nTous les clients sont en bonne santé.`;
   return `⚠️ **Clients à risque — ${soc.nom}**\n\n${risks.slice(0,8).map(c=>`• **${c.name}** (${fmt(c.rev)}€/mois)\n  ${c.flags.join(" · ")}`).join("\n\n")}\n\n🔴 ${risks.length} client${risks.length>1?"s":""} nécessitent une action`;
  }
  // opportunités — upsell & cross-sell
  if(ql.match(/^opportunites?$|upsell|cross.?sell/)){
   const lowTier=activeCl.filter(c=>clientMonthlyRevenue(c)<500&&clientMonthlyRevenue(c)>0);
   const singleService=activeCl.filter(c=>!c.services||c.services?.length<=1);
   const openO3=opps.filter(o=>o.status==="open");
   const pVal3=openO3.reduce((a,o)=>a+(o.value||0),0);
   const upsellPot=lowTier.reduce((a,c)=>a+(500-clientMonthlyRevenue(c)),0);
   return `🎯 **Opportunités — ${soc.nom}**\n\n📈 **Upsell** (clients <500€/mois)\n${lowTier.length>0?lowTier.slice(0,5).map(c=>`• ${c.name} — ${fmt(clientMonthlyRevenue(c))}€ → potentiel +${fmt(500-clientMonthlyRevenue(c))}€`).join("\n"):"Aucun client à upseller"}\n💰 Potentiel upsell : ~${fmt(upsellPot)}€/mois\n\n🔄 **Cross-sell** (clients mono-service)\n${singleService.length>0?`• ${singleService.length} clients sur 1 seul service`:"Tous les clients sont multi-services"}\n\n🔥 **Pipeline actif**\n• ${openO3.length} prospects en cours (${fmt(pVal3)}€)\n\n💡 Focus: relance les ${lowTier.length} clients sous 500€ et propose un upgrade.`;
  }

  // aide/help
  if(ql.match(/^aide$|^help$|comment.*fonctionne|que.*peux/)){
   return `🤖 **Commandes disponibles**\n\n📋 **résumé** — Vue d'ensemble complète\n📊 **CA ce mois** — Chiffre d'affaires\n🔍 **analyse** — Analyse complète (CA, conversion, pipeline, clients)\n⚠️ **risques** — Clients à risque (impayés, inactifs)\n🎯 **opportunités** — Upsell & cross-sell\n🔮 **prévision** — Forecast T+3\n🌡️ **météo / santé** — Score santé business\n👥 **combien de clients actifs** — Comptage\n💸 **qui n'a pas payé** — Impayés\n📅 **prochains RDV** — Agenda\n🏅 **top clients** — Meilleurs clients\n🔄 **pipeline** — État du pipeline\n⚖️ **compare** — Mois vs précédent\n💸 **dépenses** — Charges par catégorie\n📈 **conversion** — Taux de conversion\n💰 **rentabilité** — ROAS & marges\n🎯 **objectif** — Progression objectifs\n📈 **évolution CA** — Tendance mensuelle\n\n💡 Tu peux aussi poser des questions libres !`;
  }
  // météo business
  if(ql.match(/meteo|sante.*business|weather|comment.*va/)){
   const score=ca>0?(margePct>30?5:margePct>15?4:margePct>5?3:margePct>0?2:1):1;
   const emojis=["","😫","😟","😐","🙂","🔥"];
   const labels=["","Critique","Fragile","Stable","En forme","On fire"];
   return `🌡️ **Météo Business — ${soc.nom}**\n\n${emojis[score]} **${labels[score]}**\n\n• CA : ${fmt(ca)}€ ${trend>0?"📈":"📉"} (${trend>0?"+":""}${trend}%)\n• Marge : ${margePct}%\n• Trésorerie : ${fmt(balance)}€ ${balance>5000?"✅":"⚠️"}\n• Clients : ${activeCl.length} actifs\n• MRR : ${fmt(mrr)}€\n\n${score>=4?"🎉 Tout va bien, continue sur cette lancée !":score>=3?"👍 Stable, quelques optimisations possibles.":"⚠️ Attention, des actions correctives sont nécessaires."}`;
  }
  // objectif
  if(ql.match(/objectif|goal|progression|target/)){
   if(!monthGoal)return `🎯 **Objectif non défini**\n\nDemande à l'admin de configurer ton objectif mensuel.`;
   const pctGoal=Math.round(ca/monthGoal*100);
   const remaining=Math.max(0,monthGoal-ca);
   const daysLeft=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate()-new Date().getDate();
   const dailyNeeded=daysLeft>0?Math.round(remaining/daysLeft):remaining;
   return `🎯 **Objectif — ${ml(cm)}**\n\n📊 Progression : **${fmt(ca)}€ / ${fmt(monthGoal)}€** (${pctGoal}%)\n${"█".repeat(Math.min(20,Math.round(pctGoal/5)))}${"░".repeat(Math.max(0,20-Math.round(pctGoal/5)))} ${pctGoal}%\n\n${remaining>0?`• Reste : ${fmt(remaining)}€\n• ${daysLeft} jours restants\n• Besoin : ~${fmt(dailyNeeded)}€/jour`:"✅ Objectif atteint ! 🎉"}\n\n${pctGoal>=100?"🔥 Bravo !":pctGoal>=75?"👍 Presque ! Dernière ligne droite.":pctGoal>=50?"📈 Mi-chemin, accélère.":"⚠️ En retard, focus sur les quick wins."}`;
  }
  // rentabilité / ROAS
  if(ql.match(/rentabilite|roas|marge.*analyse|margin/)){
   const pub=pf(r?.pub);const leads2=pf(r?.leads);const cpl=leads2>0?Math.round(pub/leads2):0;
   const roas=pub>0?Math.round(ca/pub*100)/100:0;
   return `💰 **Rentabilité — ${soc.nom}**\n\n📊 CA : ${fmt(ca)}€\n📉 Charges : ${fmt(ch)}€\n📈 Marge : ${fmt(marge)}€ (**${margePct}%**)\n\n🎯 Pub dépensée : ${fmt(pub)}€\n📞 Leads : ${leads2}\n💵 CPL : ${cpl>0?fmt(cpl)+"€":"—"}\n📈 ROAS : ${roas>0?roas+"x":"—"}\n\n${margePct>30?"🟢 Excellente rentabilité":margePct>15?"🟡 Rentabilité correcte":margePct>0?"🟠 Marge faible":"🔴 Non rentable — action urgente"}`;
  }
  // évolution du CA
  if(ql.match(/evolution.*ca|tendance.*ca|historique.*ca|ca.*evolution/)){
   const last6=allM.slice(-6);
   const data=last6.map(m=>{const rv=gr(reps,soc.id,m);return{m:ml(m),ca:pf(rv?.ca)};});
   return `📈 **Évolution CA — ${soc.nom}**\n\n${data.map(d=>{const bar="█".repeat(Math.min(15,Math.round(d.ca/(Math.max(...data.map(x=>x.ca))||1)*15)));return`• ${d.m} : ${fmt(d.ca)}€ ${bar}`;}).join("\n")}\n\n${trend>0?"📈 Tendance haussière":"📉 Tendance baissière"} (${trend>0?"+":""}${trend}% vs mois précédent)`;
  }
  // combien de [X] — generic count
  if(ql.match(/combien.*client.*actif|clients actifs|nombre.*client/)){
   return `👥 **Clients actifs — ${soc.nom}**\n\n✅ ${activeCl.length} clients actifs\n📊 MRR : ${fmt(mrr)}€/mois\n❌ ${churnedCl.length} clients perdus\n📈 Rétention : ${myCl.length>0?Math.round((1-churnedCl.length/myCl.length)*100):100}%`;
  }
  if(ql.match(/combien.*lead|nombre.*lead|leads.*total/)){
   return `📞 **Leads — ${soc.nom}**\n\n🎯 Total leads : ${pf(r?.leads)||ghlCl.length}\n📊 Leads contactés : ${pf(r?.leadsContact)||0}\n✅ Leads clos : ${pf(r?.leadsClos)||0}\n📈 Taux conversion : ${pf(r?.leads)>0?Math.round(pf(r?.leadsClos)/pf(r?.leads)*100):0}%`;
  }
  if(ql.match(/combien de/)){
   const num=parseNum(ql);
   if(ql.includes("deal")||ql.includes("opportun"))return `🔄 ${opps.length} opportunités au total (${opps.filter(o=>o.status==="open").length} ouvertes)`;
   if(ql.includes("rdv")||ql.includes("rendez"))return `📅 ${calEvts.filter(e=>new Date(e.startTime||0)>new Date()).length} RDV à venir`;
   if(ql.includes("facture")||ql.includes("transaction"))return `🧾 ${monthTxns.length} transactions ce mois`;
  }
  // liste/montre les [X]
  if(ql.match(/^(liste|montre|affiche|donne|voir)\s/)){
   if(ql.match(/client/)){
    if(activeCl.length===0)return `👥 Aucun client enregistré.`;
    return `👥 **Liste clients — ${soc.nom}**\n\n${myCl.slice(0,10).map(c=>`• **${c.name}** — ${CLIENT_STATUS[c.status]?.icon||""} ${CLIENT_STATUS[c.status]?.l||c.status} · ${fmt(clientMonthlyRevenue(c))}€/mois`).join("\n")}${myCl.length>10?`\n\n… et ${myCl.length-10} autres`:""}`;
   }
   if(ql.match(/lead|contact/)){
    return `📞 **Contacts GHL — ${soc.nom}**\n\n${ghlCl.slice(0,10).map(c=>`• ${c.name||c.email||"Sans nom"} ${c.phone?"📱":"📧"}`).join("\n")}${ghlCl.length>10?`\n\n… et ${ghlCl.length-10} autres`:""}`;
   }
   if(ql.match(/depense|charge|transaction/)){
    const recent=monthTxns.filter(t=>(t.legs?.[0]?.amount||0)<0).slice(0,10);
    return `💸 **Dernières dépenses**\n\n${recent.map(t=>`• ${t.reference||t.description||"—"} : **${fmt(Math.abs(t.legs?.[0]?.amount||0))}€**`).join("\n")||"Aucune dépense trouvée."}`;
   }
  }
  // quel client [condition]
  if(ql.match(/quel.*client.*plus.*pay|client.*plus.*cher/)){
   const sorted3=activeCl.map(c=>({name:c.name,rev:clientMonthlyRevenue(c)})).sort((a,b)=>b.rev-a.rev);
   if(sorted3.length===0)return "👥 Aucun client trouvé.";
   return `💰 **Client qui paie le plus**\n\n🥇 **${sorted3[0].name}** — ${fmt(sorted3[0].rev)}€/mois${sorted3.length>1?`\n🥈 ${sorted3[1].name} — ${fmt(sorted3[1].rev)}€/mois`:""}${sorted3.length>2?`\n🥉 ${sorted3[2].name} — ${fmt(sorted3[2].rev)}€/mois`:""}`;
  }
  if(ql.match(/client.*plus de (\d+)|client.*>\s*(\d+)/)){
   const threshold=parseNum(ql)||500;
   const filtered=activeCl.filter(c=>clientMonthlyRevenue(c)>threshold);
   return `👥 **Clients > ${fmt(threshold)}€/mois**\n\n${filtered.length>0?filtered.map(c=>`• **${c.name}** — ${fmt(clientMonthlyRevenue(c))}€/mois`).join("\n"):"Aucun client au-dessus de ce seuil."}\n\n📊 ${filtered.length} client${filtered.length>1?"s":""} trouvé${filtered.length>1?"s":""}`;
  }
  if(ql.match(/ca.*mois|chiffre.*affaire|mon ca|revenue/)){
   return `📊 **CA — ${ml(cm)}**\n\nCA ce mois : ${fmt(ca)}€${monthGoal>0?` / ${fmt(monthGoal)}€ (${Math.round(ca/monthGoal*100)}%)`:""}\n${prevCa>0?`Mois précédent : ${fmt(prevCa)}€\nTendance : ${trend>0?"📈 +":"📉 "}${trend}%\n`:""}\nMarge : ${fmt(marge)}€ (${margePct}%)\nTrésorerie : ${fmt(balance)}€\n\n${trend>10?"🔥 Excellent momentum !":trend<-10?"⚠️ Baisse détectée, identifie les causes.":"📊 Stabilité."}`;
  }
  if(ql.match(/pas paye|impaye|n'a pas paye|retard.*paiement|facture/)){
   const txs=bankData?.transactions||[];const now45=Date.now()-45*864e5;
   const unpaid=activeCl.filter(cl=>{if(!cl.billing||cl.billing.type==="oneoff")return false;const cn=(cl.name||"").toLowerCase().trim();return!txs.some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;return new Date(tx.created_at||0).getTime()>now45&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});});
   if(unpaid.length===0)return `✅ **Aucun impayé !**\n\nTous tes clients actifs ont payé dans les 45 derniers jours.`;
   return `⚠️ **Clients sans paiement (+45j)**\n\n${unpaid.map(c=>`• ${c.name} — ${fmt(clientMonthlyRevenue(c))}€/mois`).join("\n")}\n\n💡 ${unpaid.length} client${unpaid.length>1?"s":""} à relancer`;
  }
  if(ql.match(/prochain.*rdv|rendez.vous|agenda|prochains rdv/)){
   const now=new Date();const upcoming=calEvts.filter(e=>new Date(e.startTime||0)>now).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime)).slice(0,5);
   if(upcoming.length===0)return `📅 **Aucun RDV à venir**`;
   return `📅 **Prochains RDV**\n\n${upcoming.map(e=>`• ${new Date(e.startTime).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})} ${new Date(e.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})} — ${e.title||e.contactName||"RDV"}`).join("\n")}`;
  }
  if(ql.match(/top client|meilleur.*client|plus gros/)){
   const withRev=activeCl.map(c=>({name:c.name,rev:clientMonthlyRevenue(c)})).filter(c=>c.rev>0).sort((a,b)=>b.rev-a.rev).slice(0,5);
   if(withRev.length===0){const wonO=opps.filter(o=>o.status==="won").sort((a,b)=>(b.value||0)-(a.value||0)).slice(0,5);if(wonO.length>0)return `🏅 **Top deals gagnés**\n\n${wonO.map((o,i)=>`${i+1}. ${o.name||o.contact?.name||"—"} — ${fmt(o.value||0)}€`).join("\n")}`;return `🏅 Pas assez de données clients.`;}
   return `🏅 **Top clients par revenu**\n\n${withRev.map((c,i)=>`${["🥇","🥈","🥉","4️⃣","5️⃣"][i]} ${c.name} — ${fmt(c.rev)}€/mois`).join("\n")}\n\n💰 Total MRR top 5 : ${fmt(withRev.reduce((a,c)=>a+c.rev,0))}€`;
  }
  if(ql.match(/taux.*conversion|conversion rate/)){
   const cbt=stats?.callsByType||{};const strat=Object.entries(cbt).filter(([n])=>!n.toLowerCase().includes("intégration")&&!n.toLowerCase().includes("integration")).reduce((a,[,v])=>a+v,0);
   const integ=Object.entries(cbt).filter(([n])=>n.toLowerCase().includes("intégration")||n.toLowerCase().includes("integration")).reduce((a,[,v])=>a+v,0);
   const rate=strat>0?Math.round(integ/strat*100):0;
   return `📈 **Taux de conversion**\n\n🎯 ${rate}%\n📞 Appels strat : ${strat}\n🤝 Intégrations : ${integ}\n\n${rate>30?"🔥 Excellent taux !":rate>15?"👍 Correct, continue !":"⚠️ À améliorer — travaille ton closing."}`;
  }
  if(ql.match(/client.*retard|retard|en retard|alerte/)){
   const atRisk=myCl.filter(c=>{const rem=commitmentRemaining(c);return rem!==null&&rem<=2;});
   return `⚠️ **Alertes clients**\n\n${atRisk.length>0?atRisk.map(c=>`• ${c.name} — ${commitmentRemaining(c)} mois restant`).join("\n"):`✅ Aucun engagement critique`}\n\n👥 ${activeCl.length} actifs · ❌ ${churnedCl.length} perdus`;
  }
  if(ql.match(/pipeline|combien.*pipeline|opportunite/)){
   const openO=opps.filter(o=>o.status==="open");const pVal=openO.reduce((a,o)=>a+(o.value||0),0);const wonO=opps.filter(o=>o.status==="won");
   return `🔄 **Pipeline — ${soc.nom}**\n\n🎯 ${openO.length} deals actifs — ${fmt(pVal)}€\n✅ ${wonO.length} gagnés — ${fmt(wonO.reduce((a,o)=>a+(o.value||0),0))}€\n❌ ${opps.filter(o=>o.status==="lost").length} perdus\n\n💰 Valeur moyenne : ${fmt(stats?.avgDealSize||0)}€`;
  }
  if(ql.match(/resume|brief|recap|résumé|synthese|vue.*ensemble/)){
   const openO=opps.filter(o=>o.status==="open");const pVal=openO.reduce((a,o)=>a+(o.value||0),0);
   return `📋 **Résumé — ${soc.nom} — ${ml(cm)}**\n\n💰 CA : ${fmt(ca)}€${monthGoal>0?` / ${fmt(monthGoal)}€ (${Math.round(ca/monthGoal*100)}%)`:""}\n📉 Charges : ${fmt(ch)}€\n📊 Marge : ${fmt(marge)}€ (${margePct}%)\n🏦 Trésorerie : ${fmt(balance)}€\n\n👥 ${activeCl.length} clients actifs · MRR ${fmt(mrr)}€\n🔄 Pipeline : ${openO.length} deals (${fmt(pVal)}€)\n📅 ${calEvts.filter(e=>new Date(e.startTime||0)>new Date()).length} RDV à venir\n🟢 ${ghlCl.length} contacts GHL\n\n${trend>0?"📈 Tendance positive !":"📉 Surveille la tendance."}`;
  }
  if(ql.match(/depense|charge|cout/)){
   const catTotals={};
   if(bankData?.transactions){bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg||isExcludedTx(t,excluded))return false;return(t.created_at||"").startsWith(cm)&&leg.amount<0;}).forEach(t=>{const cat=categorizeTransaction(t);const amt=Math.abs(t.legs?.[0]?.amount||0);catTotals[cat.label]=(catTotals[cat.label]||0)+amt;});}
   const sorted2=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
   return `💸 **Dépenses — ${ml(cm)}**\n\nTotal : ${fmt(ch)}€\nTrésorerie : ${fmt(balance)}€\n\n${sorted2.length>0?"Par catégorie :\n"+sorted2.slice(0,5).map(([k,v])=>`  • ${k} : ${fmt(v)}€`).join("\n"):"Pas assez de données."}\n\n${balance<2000?"⚠️ Trésorerie basse.":"✅ Trésorerie OK."}`;
  }
  if(ql.match(/compare|comparer|vs|versus/)){
   const mPrev=prevM(cm);const rPrev=gr(reps,soc.id,mPrev);const caPrev2=pf(rPrev?.ca);const chPrev2=pf(rPrev?.charges);
   const margePrev2=caPrev2-chPrev2;const margePctPrev=caPrev2>0?Math.round(margePrev2/caPrev2*100):0;
   return `📊 **Comparaison ${ml(mPrev)} vs ${ml(cm)}**\n\n|  | ${ml(mPrev)} | ${ml(cm)} | Δ |\n|---|---|---|---|\n| **CA** | ${fmt(caPrev2)}€ | ${fmt(ca)}€ | ${trend>0?"+":""}${trend}% |\n| **Charges** | ${fmt(chPrev2)}€ | ${fmt(ch)}€ | ${chPrev2>0?(ch>chPrev2?"↑":"↓")+" "+Math.abs(Math.round((ch-chPrev2)/chPrev2*100))+"%":"—"} |\n| **Marge** | ${fmt(margePrev2)}€ (${margePctPrev}%) | ${fmt(marge)}€ (${margePct}%) | ${marge>margePrev2?"📈":"📉"} |\n| **Tréso** | ${fmt(pf(rp?.tresoSoc))}€ | ${fmt(balance)}€ | — |`;
  }
  if(ql.match(/meilleur.*client|best.*client|plus.*rentable/)){
   const withCol=activeCl.map(c=>{const cn=(c.name||"").toLowerCase().trim();const col=(bankData?.transactions||[]).filter(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;return(leg.description||tx.reference||"").toLowerCase().includes(cn);}).reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);return{name:c.name,rev:clientMonthlyRevenue(c),col};}).sort((a,b)=>b.col-a.col).slice(0,5);
   if(withCol.length===0)return "🏅 Pas assez de données pour identifier le meilleur client.";
   return `🏅 **Meilleur${withCol.length>1?"s":""} client${withCol.length>1?"s":""}**\n\n${withCol.map((c,i)=>`${["🥇","🥈","🥉","4️⃣","5️⃣"][i]} **${c.name}** — ${fmt(c.col)}€ collecté · ${fmt(c.rev)}€/mois`).join("\n")}`;
  }
  if(ql.match(/prevision|prévision|prochain.*mois|forecast/)){
   const proj2=project(reps,soc.id,allM);
   if(!proj2)return "📈 Pas assez de données pour projeter. Il faut au moins 2 mois de données.";
   return `📈 **Prévision T+3**\n\n${proj2.map((v,i)=>`• ${ml(nextM(i===0?cm:nextM(i===1?cm:nextM(cm))))} : **${fmt(v)}€**`).join("\n")}\n\n⚠️ Basé sur la tendance des 3 derniers mois.`;
  }
  if(ql.match(/combien.*depens|depens.*en|categ/)){
   const catTotals2={};
   if(bankData?.transactions){bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg||isExcludedTx(t,excluded))return false;return(t.created_at||"").startsWith(cm)&&leg.amount<0;}).forEach(t=>{const cat=categorizeTransaction(t);const amt=Math.abs(t.legs?.[0]?.amount||0);catTotals2[cat.label]=(catTotals2[cat.label]||0)+amt;});}
   const s3=Object.entries(catTotals2).sort((a,b)=>b[1]-a[1]);
   return `💸 **Dépenses par catégorie — ${ml(cm)}**\n\n${s3.map(([k,v])=>`• **${k}** : ${fmt(v)}€`).join("\n")}\n\nTotal : **${fmt(s3.reduce((a,[,v])=>a+v,0))}€**`;
  }
  // qui/quel generic
  if(ql.match(/^qui\s|^quel\s|^quels\s|^quand\s/)){
   if(ql.match(/qui.*pay|qui.*rapport/))return `💰 **Revenus clients ce mois**\n\n${activeCl.slice(0,8).map(c=>`• ${c.name} — ${fmt(clientMonthlyRevenue(c))}€/mois`).join("\n")||"Aucun client."}`;
   if(ql.match(/quand.*prochain|quand.*rdv/)){const now=new Date();const next2=calEvts.filter(e=>new Date(e.startTime||0)>now).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime))[0];return next2?`📅 Prochain RDV : **${new Date(next2.startTime).toLocaleDateString("fr-FR")} ${new Date(next2.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}** — ${next2.title||"RDV"}`:"📅 Aucun RDV prévu.";}
  }
  // Fuzzy fallback — try to match keywords
  const keywords={client:["client","clients"],vente:["vente","ventes","chiffre"],argent:["argent","paiement","paye","encaisse"],rdv:["rdv","rendez","meeting","call","appel"],lead:["lead","leads","prospect"],dépense:["depense","depenses","cout","charge"]};
  for(const[cat,words] of Object.entries(keywords)){
   if(words.some(w=>ql.includes(w))){
    if(cat==="client")return computeAnswer("combien de clients actifs");
    if(cat==="vente"||cat==="argent")return computeAnswer("CA ce mois");
    if(cat==="rdv")return computeAnswer("prochains RDV");
    if(cat==="lead")return computeAnswer("combien de leads");
    if(cat==="dépense")return computeAnswer("dépenses");
   }
  }
  return `🤖 Je n'ai pas trouvé de réponse exacte pour "${q.slice(0,40)}${q.length>40?"...":""}"\n\n💡 **Essaie** :\n• « résumé » — Vue d'ensemble\n• « CA ce mois » — Chiffre d'affaires\n• « analyse » — Analyse complète\n• « risques » — Clients à risque\n• « impayés » — Qui n'a pas payé\n• « pipeline » — État du pipeline\n• « aide » — Toutes les commandes`;
 };
 const SUGGESTIONS=[{q:"Résumé",icon:"📋"},{q:"Analyse",icon:"🔍"},{q:"CA ce mois",icon:"📊"},{q:"Impayés",icon:"💸"},{q:"Pipeline",icon:"🔄"},{q:"Risques",icon:"⚠️"},{q:"Prochains RDV",icon:"📅"},{q:"Top clients",icon:"🏅"}];
 const ask=(q)=>{
  if(!q.trim())return;
  const trimmed=q.trim();
  setMsgs(prev=>{const n=[...prev,{role:"user",content:trimmed}];return n.length>20?n.slice(-20):n;});
  setTyping(true);setInputVal("");
  const answer=computeAnswer(trimmed);
  setTimeout(()=>{setTyping(false);setMsgs(prev=>{const newMsgs=[...prev,{role:"assistant",content:answer}];const capped=newMsgs.length>20?newMsgs.slice(-20):newMsgs;setRevealIdx(capped.length-1);setRevealLen(0);return capped;});},400);
 };
 useEffect(()=>{
  if(revealIdx<0||revealIdx>=msgs.length)return;
  const full=msgs[revealIdx]?.content||"";
  if(revealLen>=full.length){setRevealIdx(-1);return;}
  const t=setTimeout(()=>setRevealLen(prev=>Math.min(prev+6,full.length)),8);
  return()=>clearTimeout(t);
 },[revealIdx,revealLen,msgs]);
 useEffect(()=>{ref.current?.scrollTo({top:ref.current.scrollHeight,behavior:"smooth"});},[msgs,revealLen,typing]);
 useEffect(()=>{if(open)setTimeout(()=>inputRef.current?.focus(),300);},[open]);
 // Embedded mode = fullscreen mobile AI, no bubble needed
 if(embedded){
  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
   <div ref={ref} style={{flex:1,overflowY:"auto",padding:14}}>
    {msgs.length===0&&<div style={{textAlign:"center",padding:"24px 10px"}}><div style={{fontSize:40,marginBottom:12}}>🤖</div><div style={{fontSize:15,fontWeight:700,color:C.t,marginBottom:4}}>Bienvenue !</div><div style={{fontSize:12,color:C.td,marginBottom:20}}>Pose-moi n'importe quelle question sur tes données.</div>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{SUGGESTIONS.map((q,i)=><button key={i} onClick={()=>ask(q.q)} style={{padding:"12px 10px",borderRadius:14,border:`1px solid ${C.brd}`,background:C.card2,color:C.t,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:6,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.acc;e.currentTarget.style.background=C.accD;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.background=C.card2;}}><span style={{fontSize:18}}>{q.icon}</span><span style={{textAlign:"left"}}>{q.q}</span></button>)}</div>
    </div>}
    {msgs.map((m,i)=>{
     const isRevealing=i===revealIdx;
     const displayContent=isRevealing?m.content.slice(0,revealLen):m.content;
     return <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:10,animation:"fu .25s ease both"}}>
      <div style={{maxWidth:"88%",padding:"12px 16px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?`linear-gradient(135deg,${C.acc}22,${C.acc}11)`:C.card2,border:`1px solid ${m.role==="user"?C.acc+"33":C.brd}`,fontSize:13,lineHeight:1.7,color:C.t,whiteSpace:"pre-wrap"}}>
       {m.role==="assistant"&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}><span style={{fontSize:12}}>🤖</span><span style={{fontWeight:700,fontSize:9,color:C.v}}>ASSISTANT</span></div>}
       {displayContent}{isRevealing&&<span style={{animation:"pulse 1s infinite",color:C.acc}}>▎</span>}
      </div>
     </div>;
    })}
    {typing&&<div style={{padding:"12px 14px",background:C.card2,borderRadius:"14px 14px 14px 4px",border:`1px solid ${C.brd}`,display:"inline-flex",alignItems:"center",gap:6,animation:"fu .2s ease both"}}>
     <span style={{fontSize:12}}>🤖</span>
     <span className="typing-dots"><span></span><span></span><span></span></span>
    </div>}
   </div>
   <div style={{padding:"10px 14px",borderTop:`1px solid ${C.brd}`,background:"rgba(6,6,11,.6)"}}>
    {msgs.length>0&&<div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap",overflowX:"auto"}}>{SUGGESTIONS.map((q,i)=><button key={i} onClick={()=>ask(q.q)} style={{padding:"4px 10px",borderRadius:14,fontSize:10,fontWeight:600,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap"}}>{q.icon} {q.q}</button>)}</div>}
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
     <input ref={inputRef} value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask(inputVal);}}} placeholder="Posez votre question..." style={{flex:1,padding:"12px 16px",borderRadius:14,border:`1px solid ${C.brd}`,background:"rgba(6,6,11,.6)",color:C.t,fontSize:14,fontFamily:FONT,outline:"none"}}/>
     <button onClick={()=>ask(inputVal)} disabled={!inputVal.trim()} style={{width:44,height:44,borderRadius:14,border:"none",background:inputVal.trim()?`linear-gradient(135deg,${C.acc},#FF9D00)`:`${C.card2}`,color:inputVal.trim()?"#0a0a0f":C.td,fontSize:18,cursor:inputVal.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>↑</button>
    </div>
   </div>
  </div>;
 }
 // Desktop floating bubble — hidden on mobile via CSS
 if(!open)return <div className="ai-desktop-bubble" onClick={()=>setOpen(true)} style={{position:"fixed",bottom:24,right:24,width:56,height:56,borderRadius:28,background:`linear-gradient(135deg,${C.v},${C.acc})`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:`0 4px 20px ${C.acc}44`,zIndex:800,fontSize:24,animation:"fl 3s ease-in-out infinite",transition:"transform .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>🤖</div>;
 return <div className="ai-chat-panel" style={{position:"fixed",bottom:24,right:24,width:420,maxWidth:"95vw",height:550,maxHeight:"80vh",background:"var(--sc-card-a9)",backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",border:"1px solid var(--sc-w08)",borderRadius:20,boxShadow:"0 12px 48px rgba(0,0,0,.5)",zIndex:800,display:"flex",flexDirection:"column",animation:"slideInUp .3s ease",overflow:"hidden"}}>
  <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.brd}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:`linear-gradient(135deg,${C.card2},${C.card})`}}>
   <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>🤖</span><div><div style={{fontWeight:800,fontSize:13,color:C.t}}>Assistant IA</div><div style={{fontSize:9,color:C.td}}>{soc.nom} · Tape "aide" pour les commandes</div></div></div>
   <div style={{display:"flex",gap:4}}>
    <button onClick={()=>setMsgs([])} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.td,padding:"2px 6px",borderRadius:6}} title="Effacer l'historique">🗑</button>
    <button onClick={()=>setOpen(false)} aria-label="Fermer" style={{background:"none",border:`1px solid ${C.brd}`,cursor:"pointer",fontSize:12,color:C.td,padding:"2px 8px",borderRadius:6,fontFamily:FONT}}>✕</button>
   </div>
  </div>
  <div ref={ref} style={{flex:1,overflowY:"auto",padding:14}}>
   {msgs.length===0&&<div style={{textAlign:"center",padding:"24px 10px"}}><div style={{fontSize:32,marginBottom:10}}>🤖</div><div style={{fontSize:13,fontWeight:700,color:C.t,marginBottom:4}}>Bienvenue !</div><div style={{fontSize:11,color:C.td,marginBottom:16}}>Pose-moi n'importe quelle question sur tes données.</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>{SUGGESTIONS.map((q,i)=><button key={i} onClick={()=>ask(q.q)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${C.brd}`,background:C.card2,color:C.t,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:5,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.acc;e.currentTarget.style.background=C.accD;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.background=C.card2;}}><span style={{fontSize:14}}>{q.icon}</span>{q.q}</button>)}</div>
   </div>}
   {msgs.map((m,i)=>{
    const isRevealing=i===revealIdx;
    const displayContent=isRevealing?m.content.slice(0,revealLen):m.content;
    return <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:10,animation:"fu .25s ease both"}}>
     <div style={{maxWidth:"88%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?`linear-gradient(135deg,${C.acc}22,${C.acc}11)`:C.card2,border:`1px solid ${m.role==="user"?C.acc+"33":C.brd}`,fontSize:11,lineHeight:1.7,color:C.t,whiteSpace:"pre-wrap"}}>
      {m.role==="assistant"&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}><span style={{fontSize:12}}>🤖</span><span style={{fontWeight:700,fontSize:9,color:C.v}}>ASSISTANT</span></div>}
      {displayContent}{isRevealing&&<span style={{animation:"pulse 1s infinite",color:C.acc}}>▎</span>}
     </div>
    </div>;
   })}
   {typing&&<div style={{padding:"12px 14px",background:C.card2,borderRadius:"14px 14px 14px 4px",border:`1px solid ${C.brd}`,display:"inline-flex",alignItems:"center",gap:6,animation:"fu .2s ease both"}}>
    <span style={{fontSize:12}}>🤖</span>
    <span className="typing-dots"><span></span><span></span><span></span></span>
   </div>}
  </div>
  <div style={{padding:"10px 14px",borderTop:`1px solid ${C.brd}`,background:"var(--sc-input-a5)"}}>
   {msgs.length>0&&<div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>{SUGGESTIONS.map((q,i)=><button key={i} onClick={()=>ask(q.q)} style={{padding:"2px 8px",borderRadius:12,fontSize:8,fontWeight:600,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.acc;e.currentTarget.style.color=C.acc;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.td;}}>{q.icon} {q.q}</button>)}</div>}
   <div style={{display:"flex",gap:8,alignItems:"center"}}>
    <input ref={inputRef} value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask(inputVal);}}} placeholder="Posez votre question..." style={{flex:1,padding:"10px 14px",borderRadius:12,border:`1px solid ${C.brd}`,background:"var(--sc-input-a6)",backdropFilter:"blur(10px)",color:C.t,fontSize:12,fontFamily:FONT,outline:"none",transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor=C.acc+"66"} onBlur={e=>e.target.style.borderColor=C.brd}/>
    <button onClick={()=>ask(inputVal)} disabled={!inputVal.trim()} style={{width:38,height:38,borderRadius:12,border:"none",background:inputVal.trim()?`linear-gradient(135deg,${C.acc},#FF9D00)`:`${C.card2}`,color:inputVal.trim()?"#0a0a0f":C.td,fontSize:16,cursor:inputVal.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",flexShrink:0}}>↑</button>
   </div>
  </div>
 </div>;
}
/* ADMIN LEADERBOARD CARD */
/* ADMIN LEADERBOARD CARD */
export function LeaderboardCard({socs,reps,allM,actions,pulses,socBank}){
 const cm=curM();const pm=prevM(cm);
 const ranked=socs.filter(s=>s.stat==="active"&&s.id!=="eco").map(s=>{
  const r=gr(reps,s.id,cm);const rp=gr(reps,s.id,pm);
  const ca=pf(r?.ca);const prevCa=pf(rp?.ca);
  const trend=prevCa>0?Math.round((ca-prevCa)/prevCa*100):0;
  return{soc:s,ca,trend,porteur:s.porteur};
 }).sort((a,b)=>b.ca-a.ca);
 const maxCA=ranked.length>0?ranked[0].ca:1;
 const medals=["🥇","🥈","🥉"];
 return <Card style={{padding:16}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>🏆</span><span style={{fontWeight:800,fontSize:14,fontFamily:FONT_TITLE}}>Classement CA — {ml(cm)}</span></div>
  </div>
  {ranked.map((r,i)=>{
   const w=maxCA>0?Math.max(5,Math.round(r.ca/maxCA*100)):0;
   const isTop3=i<3;
   return <div key={r.soc.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:4,background:isTop3?C.accD:C.card2,border:`1px solid ${isTop3?C.acc+"33":C.brd}`,borderRadius:10}}>
    <span style={{fontWeight:900,fontSize:isTop3?18:14,width:28,textAlign:"center"}}>{isTop3?medals[i]:i+1}</span>
    <span style={{width:6,height:6,borderRadius:3,background:r.soc.color,flexShrink:0}}/>
    <div style={{flex:1,minWidth:0}}>
     <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
      <span style={{fontWeight:700,fontSize:12}}>{r.soc.nom}</span>
      <span style={{fontSize:9,color:C.td}}>{r.porteur}</span>
      {r.trend!==0&&<span style={{fontSize:9,fontWeight:700,color:r.trend>0?C.g:C.r}}>{r.trend>0?"↑":"↓"}{Math.abs(r.trend)}%</span>}
     </div>
     <div style={{height:6,background:C.brd,borderRadius:3,overflow:"hidden"}}>
      <div className="pg" style={{height:"100%",width:`${w}%`,background:isTop3?`linear-gradient(90deg,${C.acc},#FF9D00)`:r.soc.color,borderRadius:3,"--w":`${w}%`}}/>
     </div>
    </div>
    <span style={{fontWeight:900,fontSize:14,color:isTop3?C.acc:C.t,minWidth:60,textAlign:"right"}}>{fmt(r.ca)}€</span>
   </div>;
  })}
  {ranked.length===0&&<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucune donnée ce mois</div>}
 </Card>;
}
/* PORTEUR DASHBOARD */
/* PORTEUR DASHBOARD */
export function PulseDashWidget({soc,existing,savePulse,hold}){
 const w=curW();
 const[mood,setMood]=useState(existing?.mood??-1);
 const[win,setWin]=useState(existing?.win||"");
 const[blocker,setBlocker]=useState(existing?.blocker||"");
 const[conf,setConf]=useState(existing?.conf??3);
 const[sent,setSent]=useState(false);
 const submit=()=>{
  const pulse={mood,win,blocker,conf,at:new Date().toISOString()};
  savePulse(`${soc.id}_${w}`,pulse);setSent(true);
  if(hold?.slack?.enabled&&hold.slack.notifyPulse){slackSend(hold.slack,buildPulseSlackMsg(soc,pulse));}
 };
 if(existing&&!sent)return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.35s"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
   <span style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:.8,fontFamily:FONT_TITLE}}>⚡ PULSE DE LA SEMAINE</span>
   <span style={{fontSize:9,color:C.g,fontWeight:600}}>✓ Envoyé</span>
  </div>
  <div style={{display:"flex",alignItems:"center",gap:14}}>
   <span style={{fontSize:32}}>{MOODS[existing.mood]}</span>
   <div style={{flex:1}}>
    <div style={{fontWeight:700,fontSize:12,marginBottom:2}}>🏆 {existing.win}</div>
    {existing.blocker&&<div style={{fontSize:11,color:C.r}}>🚧 {existing.blocker}</div>}
   </div>
   <div style={{textAlign:"center"}}><div style={{fontWeight:800,fontSize:18,color:[C.r,C.o,C.td,C.b,C.g][existing.conf-1]}}>{existing.conf}/5</div><div style={{fontSize:8,color:C.td}}>Confiance</div></div>
  </div>
 </div>;
 if(sent)return <div className="fade-up" style={{background:"rgba(52,211,153,.08)",backdropFilter:"blur(20px)",border:"1px solid rgba(52,211,153,.15)",borderRadius:16,padding:16,marginBottom:20,textAlign:"center"}}>
  <span style={{fontSize:28}}>✅</span><div style={{fontWeight:700,fontSize:13,color:C.g,marginTop:4}}>Pulse envoyé !</div>
 </div>;
 return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.35s"}}>
  <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>⚡ COMMENT ÇA VA CETTE SEMAINE ?</div>
  <div style={{display:"flex",gap:6,marginBottom:10}}>{MOODS.map((e,i)=><button key={i} onClick={()=>setMood(i)} style={{fontSize:20,padding:"4px 7px",borderRadius:8,border:`2px solid ${mood===i?C.acc:C.brd}`,background:mood===i?C.accD:"transparent",cursor:"pointer",transition:"all .15s"}}>{e}</button>)}</div>
  <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
   <div><label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3}}>🏆 Victoire</label><input value={win} onChange={e=>setWin(e.target.value)} placeholder="Ta win de la semaine" style={{width:"100%",padding:"7px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/></div>
   <div><label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3}}>🚧 Blocage <span style={{fontWeight:400,color:C.tm}}>(optionnel)</span></label><input value={blocker} onChange={e=>setBlocker(e.target.value)} placeholder="Un frein ?" style={{width:"100%",padding:"7px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/></div>
  </div>
  <div style={{display:"flex",alignItems:"center",gap:10}}>
   <span style={{fontSize:10,color:C.td,fontWeight:600}}>Confiance</span>
   <input type="range" min={1} max={5} value={conf} onChange={e=>setConf(parseInt(e.target.value))} style={{flex:1}}/>
   <span style={{fontWeight:800,fontSize:13,color:[C.r,C.o,C.td,C.b,C.g][conf-1],minWidth:24}}>{conf}/5</span>
   <button onClick={submit} disabled={mood<0||!win.trim()} style={{padding:"7px 16px",borderRadius:8,border:"none",background:mood>=0&&win.trim()?C.acc:C.brd,color:mood>=0&&win.trim()?"#000":C.td,fontWeight:700,fontSize:11,cursor:mood>=0&&win.trim()?"pointer":"default",fontFamily:FONT,transition:"all .15s"}}>Envoyer ⚡</button>
  </div>
 </div>;
}
export function PorteurDashboard({soc,reps,allM,socBank,ghlData,setPTab,pulses,savePulse,hold,clients,stripeData}){
 const cmNow=curM();
 const[selectedMonth,setSelectedMonth]=useState(cmNow);
 const[viewPeriod,setViewPeriod]=useState("month"); // month | quarter | year
 const cm=selectedMonth;
 const report=gr(reps,soc.id,cm);
 const bankData=socBank?.[soc.id];const acc2=soc.brandColor||soc.color||C.acc;
 const excluded=EXCLUDED_ACCOUNTS[soc.id]||[];
 // Period months for aggregation
 const periodMonths=useMemo(()=>{
  if(viewPeriod==="month")return[cm];
  if(viewPeriod==="quarter"){const [y,m]=cm.split("-").map(Number);const qStart=Math.floor((m-1)/3)*3+1;return[0,1,2].map(i=>`${y}-${String(qStart+i).padStart(2,"0")}`);}
  const y=cm.split("-")[0];return Array.from({length:12},(_,i)=>`${y}-${String(i+1).padStart(2,"0")}`);
 },[cm,viewPeriod]);
 const periodLabel=viewPeriod==="month"?ml(cm):viewPeriod==="quarter"?(()=>{const[y,m]=cm.split("-").map(Number);const q=Math.ceil(m/3);return`T${q} ${y}`;})():`Année ${cm.split("-")[0]}`;
 // Available months
 const availableMonths=useMemo(()=>{
  const months=new Set(allM||[]);
  months.add(cmNow);
  if(bankData?.transactions)bankData.transactions.forEach(t=>{if(t.created_at){const d=new Date(t.created_at);months.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}});
  if(bankData?.monthly)Object.keys(bankData.monthly).forEach(m=>months.add(m));
  return[...months].sort().reverse();
 },[allM,bankData,cmNow]);
 const isCurrentMonth=cm===cmNow;
 // Bank financials (aggregated by period)
 const bankFinancials=useMemo(()=>{
  if(!bankData?.transactions)return{income:0,expense:0,incomeTxs:[],expenseTxs:[]};
  const monthTxs=bankData.transactions.filter(t=>{const ca2=t.created_at||"";return periodMonths.some(m=>ca2.startsWith(m))&&!isExcludedTx(t,excluded);});
  const incomeTxs=monthTxs.filter(t=>(t.legs?.[0]?.amount||0)>0);
  const expenseTxs=monthTxs.filter(t=>(t.legs?.[0]?.amount||0)<0);
  const income=incomeTxs.reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0);
  const expense=Math.abs(expenseTxs.reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0));
  return{income:Math.round(income),expense:Math.round(expense),incomeTxs,expenseTxs};
 },[bankData,soc.id,periodMonths]);
 const ca=bankFinancials.income||pf(report?.ca);
 const charges=bankFinancials.expense||pf(report?.charges);
 const marge=ca-charges;const margePct=ca>0?Math.round(marge/ca*100):0;
 const treso=bankData?.balance||0;
 const myClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active");
 const churnedClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="churned");
 const prevu=myClients.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 const prevuPct=prevu>0?Math.round(ca/prevu*100):0;
 const prevuColor=prevuPct>=100?C.g:prevuPct>=80?C.o:C.r;
 // GHL data
 const gd=ghlData?.[soc.id];
 const ghlStats=gd?.stats;
 const ghlOpps=gd?.opportunities||[];
 const ghlCl=gd?.ghlClients||[];
 const calEvts=gd?.calendarEvents||[];
 const cbt=ghlStats?.callsByType||{};
 const stratCalls=Object.entries(cbt).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
 const wonOpps=ghlOpps.filter(o=>o.status==="won");
 const openOpps=ghlOpps.filter(o=>o.status==="open");
 const pipelineValue=openOpps.reduce((a,o)=>a+(o.value||0),0);
 const wonValue=wonOpps.reduce((a,o)=>a+(o.value||0),0);
 // No-show
 const totalEvts=calEvts.length;
 const noShowEvts=calEvts.filter(e=>(e.status||"").toLowerCase().match(/cancel|no.show/)).length;
 const noShowPct=totalEvts>0?Math.round(noShowEvts/totalEvts*100):0;
 // Avg days to conversion
 const avgDaysConv=useMemo(()=>{
  if(wonOpps.length===0)return null;
  let total=0,cnt=0;
  wonOpps.forEach(o=>{const created=o.createdAt;const won=o.updatedAt||o.createdAt;if(created&&won){const diff=Math.max(0,Math.round((new Date(won)-new Date(created))/864e5));total+=diff;cnt++;}});
  return cnt>0?Math.round(total/cnt):null;
 },[wonOpps]);
 // Conversion rate
 const convRate=stratCalls>0?Math.round(wonOpps.length/stratCalls*100):0;
 // Avg client value
 const avgClientVal=myClients.length>0?Math.round(ca/myClients.length):0;
 // Expense breakdown (pie data)
 const[catVersion,setCatVersion]=useState(0);
 useEffect(()=>{const key=`scTxCat_${soc.id}`;const h=()=>setCatVersion(v=>v+1);window.addEventListener("storage",h);const orig=localStorage.setItem;const wrapped=function(k,v){orig.call(localStorage,k,v);if(k===key)setCatVersion(c=>c+1);};localStorage.setItem=wrapped;return()=>{window.removeEventListener("storage",h);localStorage.setItem=orig;};},[soc.id]);
 const txCatOverrides=useMemo(()=>{try{return JSON.parse(localStorage.getItem(`scTxCat_${soc.id}`)||"{}");}catch{return {};}},[soc.id,catVersion]);
 const getCatForTx=useCallback((tx)=>{if(txCatOverrides[tx.id]){const found=TX_CATEGORIES.find(c=>c.id===txCatOverrides[tx.id]);if(found)return found;}return categorizeTransaction(tx);},[txCatOverrides]);
 const pieData=useMemo(()=>{
  const catTotals={};
  if(bankData?.transactions){
   bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(isExcludedTx(t,excluded))return false;return(t.created_at||"").startsWith(cm)&&leg.amount<0;}).forEach(t=>{
    const cat=getCatForTx(t);const amt=Math.abs(t.legs?.[0]?.amount||0);
    if(cat.id!=="revenus"&&cat.id!=="transfert")catTotals[cat.label]=(catTotals[cat.label]||0)+amt;
   });
  }
  return Object.entries(catTotals).map(([name,value])=>({name,value:Math.round(value)})).sort((a,b)=>b.value-a.value);
 },[bankData,cm,excluded,getCatForTx]);
 const PIE_COLORS=[C.r,C.o,C.b,C.v,"#ec4899","#14b8a6",C.acc,"#8b5cf6"];
 // Top 5 clients with cumul, duration, avg
 const top5Clients=useMemo(()=>{
  const allCl=[...myClients,...churnedClients];
  const withRev=allCl.map(c=>{
   const rev=clientMonthlyRevenue(c);
   const startDate=c.startDate||c.at||c.createdAt||c.dateAdded;
   const start=startDate?new Date(startDate):null;
   const durMonths=start?Math.max(1,Math.round((Date.now()-start.getTime())/864e5/30)):null;
   // Cumul from bank transactions
   const cn=(c.name||"").toLowerCase().trim();const excl2=EXCLUDED_ACCOUNTS[soc.id]||[];
   const matchedTxs=(bankData?.transactions||[]).filter(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl2.includes(leg.account_id))return false;const desc=(leg.description||tx.reference||"").toLowerCase();return cn.length>2&&desc.includes(cn);});
   const cumul=matchedTxs.reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);
   const avgMonthly=durMonths?Math.round(cumul/durMonths):rev;
   return{...c,revenue:rev,durationMonths:durMonths,cumul:Math.round(cumul),avgMonthly,domain:c.domain||""};
  }).filter(c=>c.cumul>0||c.revenue>0).sort((a,b)=>b.cumul-a.cumul).slice(0,5);
  if(withRev.length>0)return withRev;
  return wonOpps.sort((a,b)=>(b.value||0)-(a.value||0)).slice(0,5).map(o=>({name:o.name||o.contact?.name||"—",revenue:o.value||0,durationMonths:null,cumul:o.value||0,avgMonthly:o.value||0,domain:"",billing:{type:"fixed"}}));
 },[myClients,churnedClients,wonOpps,bankData,soc.id]);
 // Funnel data — 4 fixed stages
 const funnelData=useMemo(()=>{
  const allStages=gd?.pipelines?.[0]?.stages||[];
  const totalLeads=ghlCl.length;
  const stratCalls2=calEvts.filter(e=>!/int[eé]g/i.test(e.title||"")&&!/int[eé]g/i.test(e.calendarName||"")).length;
  const integCalls2=calEvts.filter(e=>/int[eé]g/i.test(e.title||"")||/int[eé]g/i.test(e.calendarName||"")).length;
  const clientsActifs=myClients.length;
  return[
   {stage:"Prospect",count:totalLeads,color:"#60a5fa",icon:"👤"},
   {stage:"Appel Découverte",count:stratCalls2,color:C.acc,icon:"📞"},
   {stage:"Appel Intégration",count:integCalls2,color:C.v,icon:"🤝"},
   {stage:"Client",count:clientsActifs,color:C.g,icon:"✅"}
  ];
 },[gd,ghlCl,calEvts,myClients]);
 // Meta Ads data
 const metaAds=useMemo(()=>{try{return JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${cm}`));}catch{return null;}},[soc.id,cm]);
 // Previous month comparison
 const prevMonthKey=prevM(cm);const prevReport=gr(reps,soc.id,prevMonthKey);
 const prevBankFin=useMemo(()=>{
  if(!bankData?.transactions)return{income:0,expense:0};
  const pTxs=bankData.transactions.filter(t=>(t.created_at||"").startsWith(prevMonthKey)&&!isExcludedTx(t,excluded));
  const inc=pTxs.filter(t=>(t.legs?.[0]?.amount||0)>0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0);
  const exp=Math.abs(pTxs.filter(t=>(t.legs?.[0]?.amount||0)<0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0));
  return{income:Math.round(inc),expense:Math.round(exp)};
 },[bankData,prevMonthKey,excluded]);
 const prevCA=prevBankFin.income||pf(prevReport?.ca);
 const prevCharges=prevBankFin.expense||pf(prevReport?.charges);
 const trendCA=prevCA>0?Math.round((ca-prevCA)/prevCA*100):null;
 const trendCharges=prevCharges>0?Math.round((charges-prevCharges)/prevCharges*100):null;
 const trendMarge=prevCA>0?(()=>{const pm=prevCA-prevCharges;const pPct=prevCA>0?Math.round(pm/prevCA*100):0;return margePct-pPct;})():null;
 const TrendArrow=({val})=>{if(val===null||val===undefined||val===0)return null;const up=val>0;return <span style={{fontSize:9,fontWeight:800,color:up?C.g:C.r,marginLeft:4}}>{up?"↑":"↓"}{Math.abs(val)}%</span>;};
 const TrendArrowInv=({val})=>{if(val===null||val===undefined||val===0)return null;const up=val>0;return <span style={{fontSize:9,fontWeight:800,color:up?C.r:C.g,marginLeft:4}}>{up?"↑":"↓"}{Math.abs(val)}%</span>;};
 // Conseil du jour IA — removed
 // Expand states for mini-lists
 const[showIncome,setShowIncome]=useState(false);
 const[showExpenses,setShowExpenses]=useState(false);
 // Section style
 const secTitle={fontSize:11,fontWeight:900,letterSpacing:2,marginBottom:16,fontFamily:FONT_TITLE,display:"flex",alignItems:"center",gap:8};
 const kpiCard={padding:"16px 14px",textAlign:"center"};
 const KPI=({label,value,sub,accent,icon})=><div className="glass-card-static" style={kpiCard}>
  {icon&&<div style={{fontSize:16,marginBottom:4}}>{icon}</div>}
  <div style={{color:C.td,fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4,fontFamily:FONT_TITLE}}>{label}</div>
  <div style={{fontSize:22,fontWeight:900,color:accent||C.t,lineHeight:1}}>{value}</div>
  {sub&&<div style={{marginTop:4,fontSize:9,fontWeight:600,color:C.td}}>{sub}</div>}
 </div>;
 const selS2={background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.t,padding:"6px 10px",fontSize:11,fontFamily:FONT,outline:"none",cursor:"pointer"};
 return <div className="fu">
  {/* Stripe-style period selector */}
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
   <div style={{display:"flex",alignItems:"center",gap:6}}>
    <button onClick={()=>{const idx=availableMonths.indexOf(cm);if(idx<availableMonths.length-1)setSelectedMonth(availableMonths[idx+1]);}} style={{background:"none",border:`1px solid ${C.brd}`,borderRadius:8,color:C.td,cursor:"pointer",padding:"6px 10px",fontSize:14,fontFamily:FONT}}>‹</button>
    <select value={cm} onChange={e=>setSelectedMonth(e.target.value)} style={selS2}>
     {availableMonths.map(m=><option key={m} value={m}>{ml(m)}{m===cmNow?" (actuel)":""}</option>)}
    </select>
    <button onClick={()=>{const idx=availableMonths.indexOf(cm);if(idx>0)setSelectedMonth(availableMonths[idx-1]);}} style={{background:"none",border:`1px solid ${C.brd}`,borderRadius:8,color:C.td,cursor:"pointer",padding:"6px 10px",fontSize:14,fontFamily:FONT}}>›</button>
   </div>
   <div style={{display:"flex",gap:0,background:C.card2,borderRadius:8,border:`1px solid ${C.brd}`,overflow:"hidden"}}>
    {[{id:"month",label:"Mois"},{id:"quarter",label:"Trimestre"},{id:"year",label:"Année"}].map(p=><button key={p.id} onClick={()=>setViewPeriod(p.id)} style={{padding:"6px 14px",fontSize:10,fontWeight:viewPeriod===p.id?800:500,color:viewPeriod===p.id?C.acc:C.td,background:viewPeriod===p.id?C.accD:"transparent",border:"none",cursor:"pointer",fontFamily:FONT,transition:"all .15s",borderRight:`1px solid ${C.brd}`}}>{p.label}</button>)}
   </div>
   {!isCurrentMonth&&<button onClick={()=>setSelectedMonth(cmNow)} style={{background:C.accD,border:`1px solid ${C.acc}33`,borderRadius:8,color:C.acc,cursor:"pointer",padding:"5px 12px",fontSize:10,fontWeight:600,fontFamily:FONT}}>Mois actuel</button>}
  </div>
  {viewPeriod!=="month"&&<div style={{marginBottom:12,padding:"8px 14px",background:C.accD,borderRadius:10,border:`1px solid ${C.acc}22`,display:"flex",alignItems:"center",gap:6}}>
   <span style={{fontSize:12}}>📊</span><span style={{fontSize:11,fontWeight:700,color:C.acc}}>{periodLabel}</span><span style={{fontSize:9,color:C.td}}>· {periodMonths.length} mois agrégés</span>
  </div>}
  {/* Treasury Alert */}
  {treso>0&&treso<2000&&isCurrentMonth&&<div className="fu" style={{padding:"12px 16px",marginBottom:12,borderRadius:12,background:treso<500?"rgba(248,113,113,.12)":"rgba(251,146,60,.1)",border:`1px solid ${treso<500?"rgba(248,113,113,.3)":"rgba(251,146,60,.25)"}`,display:"flex",alignItems:"center",gap:10}}>
   <span style={{fontSize:22}}>{treso<500?"🚨":"⚠️"}</span>
   <div style={{flex:1}}><div style={{fontWeight:800,fontSize:12,color:treso<500?C.r:C.o}}>Trésorerie basse : {fmt(treso)}€</div><div style={{fontSize:10,color:C.td}}>
    {charges>0?`Au rythme actuel (${fmt(charges)}€/mois de charges), il vous reste ~${Math.max(1,Math.floor(treso/charges))} mois de runway`:"Pensez à alimenter votre compte"}
   </div></div>
  </div>}
  {/* Unpaid invoices alert */}
  {(()=>{const myCl2=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active"&&c.billing&&c.billing.type!=="oneoff");const txs2=socBank?.[soc.id]?.transactions||[];const now45=Date.now()-45*864e5;const unpaid=myCl2.filter(cl=>{const cn=(cl.name||"").toLowerCase().trim();return!txs2.some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;return new Date(tx.created_at||tx.date||0).getTime()>now45&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});});return unpaid.length>0?<div className="fu" style={{padding:"10px 14px",marginBottom:12,borderRadius:12,background:"rgba(251,146,60,.08)",border:"1px solid rgba(251,146,60,.2)",display:"flex",alignItems:"center",gap:8}}>
   <span style={{fontSize:18}}>💸</span>
   <div style={{flex:1}}><span style={{fontWeight:700,fontSize:11,color:C.o}}>{unpaid.length} facture{unpaid.length>1?"s":""} impayée{unpaid.length>1?"s":""}:</span><span style={{fontSize:10,color:C.td,marginLeft:4}}>{unpaid.slice(0,3).map(c=>c.name).join(", ")}{unpaid.length>3?` et ${unpaid.length-3} autres`:""}</span></div>
   <button onClick={()=>setPTab(20)} style={{padding:"4px 10px",borderRadius:8,border:`1px solid ${C.o}33`,background:C.oD,color:C.o,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT,flexShrink:0}}>Voir →</button>
  </div>:null;})()}
  {/* Monthly objective progress */}
  {soc.obj>0&&isCurrentMonth&&<div className="glass-card-static fu" style={{padding:16,marginBottom:14}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
    <span style={{fontSize:10,fontWeight:700,color:C.td,letterSpacing:.5,fontFamily:FONT_TITLE}}>🎯 OBJECTIF MENSUEL</span>
    <span style={{fontSize:10,color:C.td}}>{(()=>{const daysInMonth=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate();const daysPassed=new Date().getDate();return`J${daysPassed}/${daysInMonth} (${Math.round(daysPassed/daysInMonth*100)}% du mois)`;})()}</span>
   </div>
   <div style={{display:"flex",alignItems:"flex-end",gap:10,marginBottom:8}}>
    <div style={{flex:1}}>
     <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
      <span style={{fontWeight:900,fontSize:18,color:ca>=soc.obj?C.g:ca>=soc.obj*0.7?C.acc:C.o}}>{fmt(ca)}€</span>
      <span style={{fontSize:11,color:C.td,fontWeight:600}}>/ {fmt(soc.obj)}€</span>
     </div>
     <div style={{height:8,background:C.brd,borderRadius:4,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${Math.min(100,Math.round(ca/soc.obj*100))}%`,background:ca>=soc.obj?`linear-gradient(90deg,${C.g},#22d3ee)`:ca>=soc.obj*0.7?`linear-gradient(90deg,${C.acc},#FF9D00)`:C.o,borderRadius:4,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/>
     </div>
    </div>
    <span style={{fontSize:20,fontWeight:900,color:ca>=soc.obj?C.g:ca>=soc.obj*0.7?C.acc:C.o}}>{Math.round(ca/soc.obj*100)}%</span>
   </div>
   {ca<soc.obj&&<div style={{fontSize:10,color:C.td}}>Reste {fmt(soc.obj-ca)}€ pour atteindre l'objectif</div>}
   {ca>=soc.obj&&<div style={{fontSize:10,color:C.g,fontWeight:700}}>Objectif atteint ! +{fmt(ca-soc.obj)}€ au-dessus</div>}
  </div>}
  {/* Prévisionnel */}
  {prevu>0&&<div className="glass-card-static" style={{padding:20,marginBottom:16}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:8,fontFamily:FONT_TITLE}}>📊 PRÉVISIONNEL</div>
    <div style={{display:"flex",gap:16,marginBottom:8}}>
     <div><div style={{fontSize:8,color:C.td}}>Prévu</div><div style={{fontWeight:900,fontSize:18,color:C.acc}}>{fmt(prevu)}€</div></div>
     <div><div style={{fontSize:8,color:C.td}}>Réalisé</div><div style={{fontWeight:900,fontSize:18,color:prevuColor}}>{fmt(ca)}€</div></div>
     <div><div style={{fontSize:8,color:C.td}}>%</div><div style={{fontWeight:900,fontSize:18,color:prevuColor}}>{prevuPct}%</div></div>
    </div>
    <div style={{height:6,background:C.brd,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(prevuPct,100)}%`,background:prevuColor,borderRadius:3,transition:"width .5s ease"}}/></div>
  </div>}

  {/* ===== BANDEAU 1 — FINANCES ===== */}
  <div style={{marginBottom:28}}>
   <div style={secTitle}><span style={{color:acc2}}>💰</span><span style={{color:C.t}}>FINANCES</span></div>
   <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:16}}>
    <div className="glass-card-static" style={kpiCard}>
     <div style={{color:C.td,fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4,fontFamily:FONT_TITLE}}>CA {periodLabel}</div>
     <div style={{fontSize:22,fontWeight:900,color:acc2,lineHeight:1,cursor:"pointer"}} onClick={()=>setShowIncome(!showIncome)}>{fmt(ca)}€<TrendArrow val={trendCA}/></div>
     <div style={{fontSize:8,color:C.acc,cursor:"pointer",marginTop:4}} onClick={()=>setShowIncome(!showIncome)}>{showIncome?"▲ masquer":"▼ détails"}</div>
     {showIncome&&<div className="slide-down" style={{marginTop:8,textAlign:"left",maxHeight:140,overflow:"auto"}}>
      {bankFinancials.incomeTxs.slice(0,5).map((tx,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.brd}`,fontSize:9}}>
       <span style={{color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"65%"}}>{tx.legs?.[0]?.description||tx.reference||"—"}</span>
       <span style={{color:C.g,fontWeight:700}}>+{fmt(tx.legs?.[0]?.amount||0)}€</span>
      </div>)}
      {bankFinancials.incomeTxs.length===0&&<div style={{fontSize:9,color:C.td}}>Aucun encaissement</div>}
     </div>}
    </div>
    <div className="glass-card-static" style={kpiCard}>
     <div style={{color:C.td,fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4,fontFamily:FONT_TITLE}}>Charges</div>
     <div style={{fontSize:22,fontWeight:900,color:C.r,lineHeight:1,cursor:"pointer"}} onClick={()=>setShowExpenses(!showExpenses)}>{fmt(charges)}€<TrendArrowInv val={trendCharges}/></div>
     <div style={{fontSize:8,color:C.r,cursor:"pointer",marginTop:4}} onClick={()=>setShowExpenses(!showExpenses)}>{showExpenses?"▲ masquer":"▼ détails"}</div>
     {showExpenses&&<div className="slide-down" style={{marginTop:8,textAlign:"left",maxHeight:140,overflow:"auto"}}>
      {bankFinancials.expenseTxs.slice(0,5).map((tx,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.brd}`,fontSize:9}}>
       <span style={{color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"65%"}}>{tx.legs?.[0]?.description||tx.reference||"—"}</span>
       <span style={{color:C.r,fontWeight:700}}>{fmt(tx.legs?.[0]?.amount||0)}€</span>
      </div>)}
      {bankFinancials.expenseTxs.length===0&&<div style={{fontSize:9,color:C.td}}>Aucune charge</div>}
     </div>}
    </div>
    <KPI label="Marge" value={`${fmt(marge)}€`} sub={<>{margePct}% de marge{trendMarge!==null&&trendMarge!==0&&<span style={{color:trendMarge>0?C.g:C.r,fontWeight:800}}> {trendMarge>0?"↑":"↓"}{Math.abs(trendMarge)}pts</span>}</>} accent={marge>=0?C.g:C.r}/>
    <KPI label="Trésorerie" value={`${fmt(treso)}€`} sub={charges>0?`~${Math.max(1,Math.floor(treso/charges))} mois de runway`:null} accent={treso<1000?C.r:treso<3000?C.o:C.b}/>
   </div>
   {/* Répartition des dépenses - donut */}
   {pieData.length>0&&<div className="glass-card-static" style={{padding:18}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>📊 RÉPARTITION DES DÉPENSES</div>
    <div style={{display:"flex",alignItems:"center",height:180}}>
     <div style={{width:"45%",height:180}}><ResponsiveContainer><PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} strokeWidth={0}>{pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><Tooltip content={<CTip/>}/></PieChart></ResponsiveContainer></div>
     <div style={{flex:1,paddingLeft:8}}>{(()=>{const total=pieData.reduce((a,d)=>a+d.value,0);return pieData.slice(0,6).map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><span style={{width:8,height:8,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0}}/><span style={{flex:1,fontSize:10,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</span><span style={{fontSize:9,color:C.tm,marginRight:4}}>{total>0?Math.round(d.value/total*100):0}%</span><span style={{fontWeight:700,fontSize:10,color:C.t}}>{fmt(d.value)}€</span></div>);})()}</div>
    </div>
   </div>}
   {/* Monthly breakdown chart (quarter/year view) */}
   {viewPeriod!=="month"&&(()=>{
    const chartData=periodMonths.map(m=>{
     const txs2=bankData?.transactions?.filter(t=>(t.created_at||"").startsWith(m)&&!isExcludedTx(t,excluded))||[];
     const inc=txs2.filter(t=>(t.legs?.[0]?.amount||0)>0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0);
     const exp=Math.abs(txs2.filter(t=>(t.legs?.[0]?.amount||0)<0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0));
     return{mois:ml(m),CA:Math.round(inc),Charges:Math.round(exp),Marge:Math.round(inc-exp)};
    }).filter(d=>d.CA>0||d.Charges>0);
    if(chartData.length<2)return null;
    return <div className="glass-card-static" style={{padding:18,marginTop:12}}>
     <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📈 ÉVOLUTION MENSUELLE ({periodLabel})</div>
     <div style={{height:180}}>
      <ResponsiveContainer><ComposedChart data={chartData}>
       <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
       <XAxis dataKey="mois" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
       <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/>
       <Tooltip content={<CTip/>}/>
       <Bar dataKey="CA" fill={C.acc} radius={[4,4,0,0]} name="CA"/>
       <Bar dataKey="Charges" fill={C.r+"88"} radius={[4,4,0,0]} name="Charges"/>
       <Line type="monotone" dataKey="Marge" stroke={C.g} strokeWidth={2} dot={{fill:C.g,r:3}} name="Marge"/>
      </ComposedChart></ResponsiveContainer>
     </div>
    </div>;
   })()}
  </div>

  {/* ===== BANDEAU 2 — SALES ===== */}
  <div style={{marginBottom:28}}>
   <div style={secTitle}><span style={{color:"#34d399"}}>📞</span><span style={{color:C.t}}>SALES</span></div>
   <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:16}}>
    <KPI label="Prospects total" value={String(ghlCl.length)} accent="#60a5fa" icon="👥"/>
    <KPI label="Valorisation pipeline" value={`${fmt(pipelineValue)}€`} accent={C.acc} icon="🎯"/>
    <KPI label="Clients actifs" value={String(myClients.length)} accent={C.g} icon="✅"/>
    <KPI label="Clients perdus" value={String(churnedClients.length)} accent={C.r} icon="❌"/>
    <KPI label="Nombre d'appels" value={String(totalEvts)} accent="#14b8a6" icon="📅"/>
    <KPI label="Closing" value={String(wonOpps.length)} sub={wonValue>0?`${fmt(wonValue)}€`:null} accent={C.g} icon="🏆"/>
    <KPI label="Taux de conversion" value={`${convRate}%`} sub={stratCalls>0?`${wonOpps.length}/${stratCalls}`:null} accent="#a78bfa" icon="📈"/>
    <KPI label="Valeur moy. client" value={`${fmt(avgClientVal)}€`} accent={C.acc} icon="💎"/>
    <KPI label="No-show" value={`${noShowPct}%`} sub={totalEvts>0?`${noShowEvts}/${totalEvts}`:null} accent={C.r} icon="🚫"/>
    <KPI label="Jours avant conversion" value={avgDaysConv!==null?`${avgDaysConv}j`:"—"} accent={C.o} icon="⏱️"/>
   </div>
   {/* Funnel de conversion — horizontal */}
   <div className="glass-card-static" style={{padding:18,marginBottom:12}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>🔄 FUNNEL DE CONVERSION</div>
    <div style={{display:"flex",alignItems:"center",gap:0}}>
     {funnelData.map((f,i)=>{const conv=i>0&&funnelData[i-1].count>0?Math.round(f.count/funnelData[i-1].count*100):null;
      return <Fragment key={i}>
       {i>0&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"0 4px",flexShrink:0}}>
        <span style={{fontSize:14,color:C.td}}>→</span>
        {conv!==null&&<span style={{fontSize:8,fontWeight:800,color:conv>=50?C.g:conv>=25?C.o:C.r}}>{conv}%</span>}
       </div>}
       <div style={{flex:1,background:`linear-gradient(135deg,${f.color}18,${f.color}30)`,border:`1px solid ${f.color}55`,borderRadius:12,padding:"14px 10px",textAlign:"center"}}>
        <div style={{fontSize:16,marginBottom:4}}>{f.icon}</div>
        <div style={{fontWeight:900,fontSize:22,color:f.color}}>{f.count}</div>
        <div style={{fontSize:9,color:C.td,fontWeight:600,marginTop:2}}>{f.stage}</div>
       </div>
      </Fragment>;
     })}
    </div>
   </div>
   {/* Top 5 clients */}
   {top5Clients.length>0&&<div className="glass-card-static" style={{padding:18}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>🏅 TOP 5 CLIENTS</div>
    {top5Clients.map((c,i)=><div key={c.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<top5Clients.length-1?`1px solid ${C.brd}`:"none"}}>
     <span style={{width:24,height:24,borderRadius:8,background:i===0?"linear-gradient(135deg,#FFBF00,#FF9D00)":i===1?"linear-gradient(135deg,#c0c0c0,#a0a0a0)":i===2?"linear-gradient(135deg,#cd7f32,#a0622e)":C.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:i<3?"#0a0a0f":C.td,flexShrink:0}}>{i+1}</span>
     <div style={{flex:1,minWidth:0}}>
      <div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name||"—"}</div>
      <div style={{fontSize:9,color:C.td,display:"flex",gap:6,flexWrap:"wrap"}}>
       {c.durationMonths!==null&&<span>📅 {c.durationMonths} mois</span>}
       {c.domain&&<span>🏢 {c.domain}</span>}
       <span>~{fmt(c.avgMonthly)}€/mois</span>
      </div>
     </div>
     <div style={{textAlign:"right"}}>
      <div style={{fontWeight:800,fontSize:13,color:acc2}}>{fmt(c.cumul)}€</div>
      <div style={{fontSize:8,color:C.td}}>cumulé</div>
     </div>
    </div>)}
   </div>}
  </div>

  {/* ===== BANDEAU 3 — PUBLICITÉ ===== */}
  <div style={{marginBottom:20}}>
   <div style={secTitle}><span style={{color:"#f472b6"}}>📣</span><span style={{color:C.t}}>PUBLICITÉ</span></div>
   {metaAds?<>
    <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:16}}>
     <KPI label="Prospects Ads" value={String(metaAds.leads||0)} accent="#60a5fa" icon="🎯"/>
     <KPI label="Appels bookés Ads" value={String(metaAds.bookings||metaAds.calls||0)} accent="#14b8a6" icon="📞"/>
     <KPI label="CPL" value={metaAds.cpl?`${fmt(metaAds.cpl)}€`:"—"} accent={C.o} icon="💰"/>
     <KPI label="CPC" value={metaAds.cpc?`${fmt(metaAds.cpc)}€`:"—"} accent={C.b} icon="🖱️"/>
     <KPI label="CPM" value={metaAds.cpm?`${fmt(metaAds.cpm)}€`:"—"} accent="#8b5cf6" icon="📊"/>
     <KPI label="Coût par appel" value={metaAds.costPerCall||metaAds.cpa?`${fmt(metaAds.costPerCall||metaAds.cpa)}€`:"—"} accent={C.r} icon="📱"/>
     <KPI label="ROAS" value={metaAds.revenue&&metaAds.spend?`${(metaAds.revenue/metaAds.spend).toFixed(1)}x`:"—"} accent={C.g} icon="📈"/>
    </div>
    {/* Budget dépensé */}
    {metaAds.spend>0&&<div className="glass-card-static" style={{padding:14,marginBottom:12}}>
     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:10,fontWeight:700,color:C.td}}>Budget dépensé</span>
      <span style={{fontSize:14,fontWeight:900,color:"#f472b6"}}>{fmt(metaAds.spend)}€</span>
     </div>
    </div>}
    {/* Meilleures créatives */}
    {metaAds.creatives&&metaAds.creatives.length>0&&<div className="glass-card-static" style={{padding:18}}>
     <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>🎨 MEILLEURES CRÉATIVES</div>
     <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
      {metaAds.creatives.slice(0,4).map((cr,i)=><div key={i} className="glass-card-static" style={{padding:12}}>
       <div style={{fontWeight:700,fontSize:11,color:C.t,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cr.name||`Créative ${i+1}`}</div>
       <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {cr.spend!=null&&<span style={{fontSize:9,color:C.td}}>Dépensé: <strong style={{color:C.t}}>{fmt(cr.spend)}€</strong></span>}
        {cr.leads!=null&&<span style={{fontSize:9,color:C.td}}>Leads: <strong style={{color:C.g}}>{cr.leads}</strong></span>}
        {cr.cpl!=null&&<span style={{fontSize:9,color:C.td}}>CPL: <strong style={{color:C.o}}>{fmt(cr.cpl)}€</strong></span>}
        {cr.roas!=null&&<span style={{fontSize:9,color:C.td}}>ROAS: <strong style={{color:C.g}}>{cr.roas.toFixed(1)}x</strong></span>}
       </div>
      </div>)}
     </div>
    </div>}
   </>:<div className="glass-card-static" style={{padding:20,textAlign:"center"}}>
    <div style={{fontSize:24,marginBottom:8}}>📣</div>
    <div style={{fontSize:11,color:C.td}}>Aucune donnée Meta Ads pour ce mois</div>
    <div style={{fontSize:9,color:C.td,marginTop:4}}>Les données apparaîtront automatiquement si connectées</div>
   </div>}
  </div>
 </div>;
}/* ===== INBOX PANEL ===== */
/* ===== INBOX PANEL ===== */
export function InboxPanel({soc,ghlData,socBankData,clients}){
 const[filter,setFilter]=useState("all");const[timeF,setTimeF]=useState("today");
 const[readIds,setReadIds]=useState(()=>{try{return JSON.parse(localStorage.getItem(`inbox_read_${soc.id}`)||"[]");}catch{return[];}});
 const markRead=(id)=>{const n=[...readIds,id];setReadIds(n);try{localStorage.setItem(`inbox_read_${soc.id}`,JSON.stringify(n));}catch{}};
 const items=useMemo(()=>{
  const now=new Date();const todayStr=now.toISOString().slice(0,10);
  const weekAgo=new Date(now-7*864e5);const monthAgo=new Date(now-30*864e5);
  const all=[];
  const gd=ghlData?.[soc.id];
  // Leads
  (gd?.ghlClients||[]).forEach(c=>{const d=new Date(c.at||c.dateAdded||0);all.push({id:"lead_"+c.id,type:"lead",icon:"🟢",desc:`Nouveau lead: ${c.name||c.email||"—"}`,date:d,action:"Contacter",actionTab:9});});
  // Payments
  (socBankData?.transactions||[]).filter(t=>(t.legs?.[0]?.amount||0)>0).forEach(t=>{const d=new Date(t.created_at||t.date||0);const amt=Math.abs(t.legs?.[0]?.amount||0);const desc=t.legs?.[0]?.description||t.reference||"Paiement";all.push({id:"pay_"+t.id,type:"payment",icon:"💰",desc:`${desc}: +${fmt(amt)}€`,date:d,action:"Voir"});});
  // Calendar events
  (gd?.calendarEvents||[]).forEach(e=>{const d=new Date(e.startTime||0);all.push({id:"rdv_"+e.id,type:"rdv",icon:"📅",desc:`RDV: ${e.title||e.contactName||"—"}`,date:d,action:"Détails"});});
  // Won/lost deals
  (gd?.opportunities||[]).filter(o=>o.status==="won"||o.status==="lost").forEach(o=>{const d=new Date(o.updatedAt||o.createdAt||0);all.push({id:"deal_"+o.id,type:"deal",icon:o.status==="won"?"🏆":"❌",desc:`Deal ${o.status==="won"?"gagné":"perdu"}: ${o.name||"—"} (${fmt(o.value||0)}€)`,date:d});});
  // Filter by time
  const cutoff=timeF==="today"?new Date(todayStr):timeF==="week"?weekAgo:monthAgo;
  return all.filter(i=>i.date>=cutoff).filter(i=>filter==="all"||i.type===filter).sort((a,b)=>b.date-a.date);
 },[soc.id,ghlData,socBankData,filter,timeF]);
 const filters=[{v:"all",l:"Tout"},{v:"lead",l:"Leads"},{v:"payment",l:"Paiements"},{v:"rdv",l:"RDV"},{v:"deal",l:"Deals"}];
 const timeFilters=[{v:"today",l:"Aujourd'hui"},{v:"week",l:"Cette semaine"},{v:"month",l:"Ce mois"}];
 return <Sect title="📥 Inbox" sub="Feed d'activité">
  <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>{filters.map(f2=><button key={f2.v} onClick={()=>setFilter(f2.v)} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${filter===f2.v?C.acc+"66":C.brd}`,background:filter===f2.v?C.accD:"transparent",color:filter===f2.v?C.acc:C.td,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{f2.l}</button>)}</div>
  <div style={{display:"flex",gap:4,marginBottom:12}}>{timeFilters.map(f2=><button key={f2.v} onClick={()=>setTimeF(f2.v)} style={{padding:"3px 8px",borderRadius:12,border:`1px solid ${timeF===f2.v?C.b+"66":C.brd}`,background:timeF===f2.v?C.bD:"transparent",color:timeF===f2.v?C.b:C.td,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{f2.l}</button>)}</div>
  {items.length===0&&<Card><div style={{textAlign:"center",padding:30,color:C.td}}><div style={{fontSize:28,marginBottom:6}}>📭</div><div style={{fontSize:12}}>Aucune activité pour cette période</div><div style={{fontSize:10,marginTop:4,opacity:.7}}>Changez la période ou le filtre pour voir plus</div></div></Card>}
  {items.map(it=>{const isRead=readIds.includes(it.id);return <div key={it.id} className="fu" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:isRead?"transparent":"rgba(255,170,0,.03)",borderRadius:10,border:`1px solid ${isRead?C.brd:"rgba(255,170,0,.12)"}`,marginBottom:4,transition:"all .2s"}}>
   <span style={{fontSize:16,flexShrink:0}}>{it.icon}</span>
   <div style={{flex:1,minWidth:0}}>
    <div style={{fontSize:12,fontWeight:isRead?500:700,color:isRead?C.td:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.desc}</div>
    <div style={{fontSize:9,color:C.td}}>{ago(it.date)}</div>
   </div>
   {!isRead&&<button onClick={()=>markRead(it.id)} aria-label="Marquer comme lu" style={{padding:"3px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card,color:C.td,fontSize:9,cursor:"pointer",fontFamily:FONT}}>✓ Lu</button>}
  </div>;})}
 </Sect>;
}

/* ===== AGENDA PANEL ===== */
/* ===== AGENDA PANEL ===== */
export function AgendaPanel({soc,ghlData}){
 const[viewMode,setViewMode]=useState("week");
 const[currentDate,setCurrentDate]=useState(new Date());
 const[showModal,setShowModal]=useState(false);
 const[modalData,setModalData]=useState({title:"",start:"",end:"",emails:[""],isEdit:false,eventId:null});
 const[viewEvt,setViewEvt]=useState(null);
 const[dragEvt,setDragEvt]=useState(null);
 const calEvts=ghlData?.[soc.id]?.calendarEvents||[];
 const socKey=soc.ghlLocationId||soc.id;

 const weekStart=useMemo(()=>{const d=new Date(currentDate);d.setDate(d.getDate()-d.getDay()+1);d.setHours(0,0,0,0);return d;},[currentDate]);
 const weekDays=useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return d;}),[weekStart]);
 const monthStart=useMemo(()=>new Date(currentDate.getFullYear(),currentDate.getMonth(),1),[currentDate]);
 const monthDays=useMemo(()=>{const days=[];const first=new Date(monthStart);const startDay=first.getDay()||7;for(let i=1-startDay;i<=42-(startDay);i++){const d=new Date(monthStart);d.setDate(d.getDate()+i-1+1);days.push(d);if(days.length>=35&&d.getMonth()!==monthStart.getMonth())break;}return days.slice(0,42);},[monthStart]);

 const eventsForDay=(d)=>{const ds=d.toISOString().slice(0,10);return calEvts.filter(e=>(e.startTime||"").startsWith(ds));};
 const nav=(dir)=>{const d=new Date(currentDate);if(viewMode==="week")d.setDate(d.getDate()+dir*7);else d.setMonth(d.getMonth()+dir);setCurrentDate(d);};
 const fmtTime=(iso)=>{try{return new Date(iso).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});}catch{return"";}};
 const fmtDay2=(d)=>d.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric"});
 const fmtMonth2=(d)=>d.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
 const isToday=(d)=>d.toISOString().slice(0,10)===new Date().toISOString().slice(0,10);

 const validEmails=()=>modalData.emails.filter(e=>e.trim()&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()));
 const createEvent=async()=>{if(!modalData.title||!modalData.start)return;
  if(validEmails().length===0){showToast("⚠️ Au moins un email participant valide est requis","warning");return;}
  const emailList=validEmails();
  try{await fetch("/api/ghl",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"calendar_create_event",locationId:socKey,title:modalData.title,startTime:new Date(modalData.start).toISOString(),endTime:modalData.end?new Date(modalData.end).toISOString():new Date(new Date(modalData.start).getTime()+3600000).toISOString(),email:emailList[0],attendees:emailList})});showToast("✅ RDV créé","success");}catch{showToast("❌ Erreur création RDV","error");}
  setShowModal(false);setModalData({title:"",start:"",end:"",emails:[""],isEdit:false,eventId:null});};
 const updateEvent=async()=>{if(!modalData.title||!modalData.start||!modalData.eventId)return;
  const emailList=validEmails();
  try{await fetch("/api/ghl",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"calendar_update_event",locationId:socKey,eventId:modalData.eventId,title:modalData.title,startTime:new Date(modalData.start).toISOString(),endTime:modalData.end?new Date(modalData.end).toISOString():new Date(new Date(modalData.start).getTime()+3600000).toISOString(),email:emailList[0]||undefined,attendees:emailList.length>0?emailList:undefined})});showToast("✅ RDV modifié","success");}catch{showToast("❌ Erreur modification","error");}
  setShowModal(false);setModalData({title:"",start:"",end:"",emails:[""],isEdit:false,eventId:null});};
 const openEventDetail=(ev)=>setViewEvt(ev);
 const openEditFromView=()=>{if(!viewEvt)return;const st=new Date(viewEvt.startTime);const en=viewEvt.endTime?new Date(viewEvt.endTime):new Date(st.getTime()+3600000);
  setModalData({title:viewEvt.title||viewEvt.contactName||"",start:new Date(st.getTime()-st.getTimezoneOffset()*60000).toISOString().slice(0,16),end:new Date(en.getTime()-en.getTimezoneOffset()*60000).toISOString().slice(0,16),emails:[viewEvt.contactEmail||viewEvt.email||""],isEdit:true,eventId:viewEvt.id});setViewEvt(null);setShowModal(true);};
 const deleteEvent=async(evtId)=>{try{await fetch("/api/ghl",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"calendar_delete_event",locationId:socKey,eventId:evtId})});showToast("🗑️ RDV supprimé","success");}catch{showToast("❌ Erreur","error");}setViewEvt(null);};
 const moveEvent=async(evtId,newDate)=>{const evt=calEvts.find(e=>e.id===evtId);if(!evt)return;
  const oldStart=new Date(evt.startTime);const oldEnd=new Date(evt.endTime||oldStart.getTime()+3600000);const diff=newDate.getTime()-new Date(oldStart.toISOString().slice(0,10)).getTime();
  try{await fetch("/api/ghl",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"calendar_update_event",locationId:socKey,eventId:evtId,startTime:new Date(oldStart.getTime()+diff).toISOString(),endTime:new Date(oldEnd.getTime()+diff).toISOString()})});showToast("📅 RDV déplacé","success");}catch{showToast("❌ Erreur","error");}};
 const genMeetLink=()=>{const code=Math.random().toString(36).slice(2,12);return`https://meet.google.com/${code.slice(0,3)}-${code.slice(3,7)}-${code.slice(7)}`;};
const extractMeetLink=(evt)=>{if(!evt)return null;if(evt.meetingLocation&&/meet\.google\.com/i.test(evt.meetingLocation))return evt.meetingLocation.trim();if(evt.locationUrl&&/meet\.google\.com/i.test(evt.locationUrl))return evt.locationUrl.trim();if(evt.location&&/meet\.google\.com/i.test(evt.location))return evt.location.match(/https?:\/\/meet\.google\.com\/[a-z0-9-]+/i)?.[0]||null;const t=evt.title||"";const m=t.match(/https?:\/\/meet\.google\.com\/[a-z0-9-]+/i);return m?m[0]:null;};
const displayTitle=(evt)=>{if(!evt)return"RDV";const t=evt.title||evt.contactName||"RDV";return t.replace(/\s*—?\s*https?:\/\/meet\.google\.com\/[a-z0-9-]+/i,"").trim()||evt.contactName||"RDV";};

 const hours=Array.from({length:14},(_,i)=>i+7);
 const evtStyle={padding:"3px 6px",borderRadius:6,background:"linear-gradient(135deg,#14b8a622,#14b8a633)",border:"1px solid #14b8a655",marginBottom:2,cursor:"grab",fontSize:9};

 return <Sect title="📅 Agenda" sub="Calendrier & rendez-vous" right={<div style={{display:"flex",gap:4,alignItems:"center"}}>
  <Btn small v={viewMode==="week"?"primary":"ghost"} onClick={()=>setViewMode("week")}>Semaine</Btn>
  <Btn small v={viewMode==="month"?"primary":"ghost"} onClick={()=>setViewMode("month")}>Mois</Btn>
  <Btn small onClick={()=>{setModalData({title:"",start:"",end:"",emails:[""],isEdit:false,eventId:null});setShowModal(true);}}>+ RDV</Btn>
 </div>}>
  {/* Navigation */}
  <div className="glass-card-static" style={{padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
   <button onClick={()=>nav(-1)} style={{background:"none",border:"none",color:C.acc,cursor:"pointer",fontSize:18,padding:4}}>‹</button>
   <span style={{fontWeight:800,fontSize:13,color:C.t,fontFamily:FONT_TITLE}}>{viewMode==="week"?`Semaine du ${fmtDay2(weekStart)}`:`${fmtMonth2(monthStart)}`}</span>
   <button onClick={()=>nav(1)} style={{background:"none",border:"none",color:C.acc,cursor:"pointer",fontSize:18,padding:4}}>›</button>
  </div>

  {/* Week view — responsive: list on mobile, grid on desktop */}
  {viewMode==="week"&&<>
   {/* Mobile: day-by-day list */}
   <div className="agenda-mobile-week" style={{display:"none"}}>
    {weekDays.map((d,i)=>{const dayEvts=eventsForDay(d);const today=isToday(d);
     return <div key={i} className="glass-card-static" style={{padding:12,marginBottom:8,borderLeft:today?`3px solid ${C.acc}`:"3px solid transparent"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:dayEvts.length>0?8:0}}>
       <div><span style={{fontSize:13,fontWeight:900,color:today?C.acc:C.t}}>{d.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"short"})}</span>{today&&<span style={{fontSize:9,color:C.acc,marginLeft:6,fontWeight:700,background:C.accD,padding:"1px 6px",borderRadius:6}}>Aujourd'hui</span>}</div>
       <span style={{fontSize:10,color:C.td,fontWeight:600}}>{dayEvts.length} RDV</span>
      </div>
      {dayEvts.length===0&&<div style={{color:C.td,fontSize:11,fontStyle:"italic"}}>Aucun rendez-vous</div>}
      {dayEvts.map(ev=><div key={ev.id} onClick={()=>openEventDetail(ev)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"linear-gradient(135deg,#14b8a612,#14b8a622)",border:"1px solid #14b8a633",borderRadius:10,marginBottom:4,cursor:"pointer"}}>
       <div style={{fontWeight:800,fontSize:12,color:"#14b8a6",flexShrink:0,minWidth:42}}>{fmtTime(ev.startTime)}</div>
       <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:700,fontSize:12,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>{displayTitle(ev)}{extractMeetLink(ev)&&<span title="Google Meet" style={{fontSize:12,flexShrink:0}}>🎥</span>}</div>
        {ev.contactName&&<div style={{fontSize:10,color:C.td}}>{ev.contactName}</div>}
       </div>
       {ev.status&&<span style={{fontSize:8,fontWeight:700,padding:"2px 6px",borderRadius:6,background:ev.status.toLowerCase().includes("confirm")?C.gD:C.rD,color:ev.status.toLowerCase().includes("confirm")?C.g:C.r}}>{ev.status.toLowerCase().includes("confirm")?"Confirmé":"Annulé"}</span>}
      </div>)}
     </div>;
    })}
   </div>
   {/* Desktop: full week grid */}
   <div className="agenda-desktop-week glass-card-static" style={{padding:0,overflow:"auto"}}>
    <div style={{display:"grid",gridTemplateColumns:`60px repeat(7,1fr)`,minWidth:700}}>
     <div style={{padding:8,borderBottom:`1px solid ${C.brd}`,borderRight:`1px solid ${C.brd}`}}/>
     {weekDays.map((d,i)=><div key={i} style={{padding:"8px 4px",textAlign:"center",borderBottom:`1px solid ${C.brd}`,borderRight:i<6?`1px solid ${C.brd}`:"none",background:isToday(d)?"rgba(255,170,0,.08)":"transparent"}}>
      <div style={{fontSize:9,fontWeight:700,color:isToday(d)?C.acc:C.td,textTransform:"uppercase"}}>{d.toLocaleDateString("fr-FR",{weekday:"short"})}</div>
      <div style={{fontSize:14,fontWeight:900,color:isToday(d)?C.acc:C.t}}>{d.getDate()}</div>
     </div>)}
     {hours.map(h=><Fragment key={h}>
      <div style={{padding:"4px 8px",fontSize:9,color:C.td,fontWeight:600,borderRight:`1px solid ${C.brd}`,borderBottom:`1px solid ${C.brd}22`,textAlign:"right"}}>{String(h).padStart(2,"0")}:00</div>
      {weekDays.map((d,di)=>{const dayEvts=eventsForDay(d).filter(e=>{const eh=new Date(e.startTime).getHours();return eh===h;});
       return <div key={di} style={{padding:2,borderRight:di<6?`1px solid ${C.brd}`:"none",borderBottom:`1px solid ${C.brd}22`,minHeight:36,background:isToday(d)?"rgba(255,170,0,.03)":"transparent"}}
        onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragEvt){const target=new Date(d);target.setHours(h,0,0,0);moveEvent(dragEvt,target);setDragEvt(null);}}}>
        {dayEvts.map(ev=><div key={ev.id} draggable onDragStart={()=>setDragEvt(ev.id)} onClick={()=>openEventDetail(ev)} style={{...evtStyle,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.background="linear-gradient(135deg,#14b8a633,#14b8a644)"} onMouseLeave={e=>e.currentTarget.style.background="linear-gradient(135deg,#14b8a622,#14b8a633)"}>
         <div style={{fontWeight:700,color:"#14b8a6",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fmtTime(ev.startTime)} {displayTitle(ev)}{extractMeetLink(ev)?" 🎥":""}</div>
         {ev.contactName&&<div style={{color:C.td,fontSize:8}}>{ev.contactName}</div>}
        </div>)}
       </div>;})}
     </Fragment>)}
    </div>
   </div>
   <style>{`@media(max-width:768px){.agenda-mobile-week{display:block !important}.agenda-desktop-week{display:none !important}}@media(min-width:769px){.agenda-mobile-week{display:none !important}}`}</style>
  </>}

  {/* Month view */}
  {viewMode==="month"&&<div className="glass-card-static" style={{padding:8}}>
   <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
    {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d=><div key={d} style={{padding:6,textAlign:"center",fontSize:9,fontWeight:700,color:C.td}}>{d}</div>)}
    {monthDays.map((d,i)=>{const inMonth=d.getMonth()===monthStart.getMonth();const evts=eventsForDay(d);
     return <div key={i} style={{padding:4,minHeight:70,border:`1px solid ${C.brd}22`,borderRadius:6,background:isToday(d)?"rgba(255,170,0,.06)":inMonth?"transparent":"rgba(0,0,0,.2)",opacity:inMonth?1:.4}}
      onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragEvt){const target=new Date(d);target.setHours(9,0,0,0);moveEvent(dragEvt,target);setDragEvt(null);}}}>
      <div style={{fontSize:11,fontWeight:isToday(d)?900:600,color:isToday(d)?C.acc:C.t,marginBottom:2}}>{d.getDate()}</div>
      {evts.slice(0,3).map(ev=><div key={ev.id} draggable onDragStart={()=>setDragEvt(ev.id)} onClick={(e)=>{e.stopPropagation();openEventDetail(ev);}} style={{padding:"1px 4px",borderRadius:4,background:"#14b8a622",border:"1px solid #14b8a644",marginBottom:1,fontSize:8,color:"#14b8a6",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer",transition:"background .15s"}} onMouseEnter={e2=>e2.currentTarget.style.background="#14b8a633"} onMouseLeave={e2=>e2.currentTarget.style.background="#14b8a622"}>
       {fmtTime(ev.startTime)} {ev.contactName||displayTitle(ev)}{extractMeetLink(ev)?" 🎥":""}
      </div>)}
      {evts.length>3&&<div style={{fontSize:7,color:C.td,textAlign:"center"}}>+{evts.length-3}</div>}
     </div>;})}
   </div>
  </div>}

  {/* Modal view event detail */}
  {viewEvt&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={()=>setViewEvt(null)}>
   <div className="fade-up glass-card-static" style={{padding:24,borderRadius:16,maxWidth:420,width:"90%"}} onClick={e=>e.stopPropagation()}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
     <div style={{fontWeight:800,fontSize:14,color:C.t,fontFamily:FONT_TITLE}}>📅 Détails du RDV</div>
     <button onClick={()=>setViewEvt(null)} aria-label="Fermer" style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:16}}>✕</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
     <div style={{padding:12,background:C.card2,borderRadius:10,border:`1px solid ${C.brd}`}}>
      <div style={{fontWeight:800,fontSize:14,color:"#14b8a6",marginBottom:4}}>{displayTitle(viewEvt)}</div>
      {viewEvt.contactName&&<div style={{fontSize:11,color:C.t,display:"flex",alignItems:"center",gap:4}}>👤 {viewEvt.contactName}</div>}
      {(viewEvt.contactEmail||viewEvt.email)&&<div style={{fontSize:10,color:C.td,display:"flex",alignItems:"center",gap:4}}>📧 {viewEvt.contactEmail||viewEvt.email}</div>}
      {viewEvt.contactPhone&&<div style={{fontSize:10,color:C.td,display:"flex",alignItems:"center",gap:4}}>📱 {viewEvt.contactPhone}</div>}
      {extractMeetLink(viewEvt)&&<a href={extractMeetLink(viewEvt)} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:6,padding:"6px 12px",borderRadius:8,background:"linear-gradient(135deg,#00897B22,#00897B44)",border:"1px solid #00897B55",color:"#26a69a",fontSize:11,fontWeight:700,fontFamily:FONT,textDecoration:"none",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="linear-gradient(135deg,#00897B33,#00897B55)";e.currentTarget.style.transform="translateY(-1px)";}} onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(135deg,#00897B22,#00897B44)";e.currentTarget.style.transform="translateY(0)";}}><span style={{fontSize:14}}>🎥</span> Rejoindre Google Meet</a>}
     </div>
     <div style={{display:"flex",gap:10}}>
      <div style={{flex:1,padding:10,background:C.card2,borderRadius:8,border:`1px solid ${C.brd}`}}>
       <div style={{fontSize:8,color:C.td,fontWeight:600,marginBottom:2}}>DÉBUT</div>
       <div style={{fontSize:12,fontWeight:700,color:C.t}}>{viewEvt.startTime?new Date(viewEvt.startTime).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"}):""}</div>
       <div style={{fontSize:11,color:C.acc}}>{fmtTime(viewEvt.startTime)}</div>
      </div>
      <div style={{flex:1,padding:10,background:C.card2,borderRadius:8,border:`1px solid ${C.brd}`}}>
       <div style={{fontSize:8,color:C.td,fontWeight:600,marginBottom:2}}>FIN</div>
       <div style={{fontSize:12,fontWeight:700,color:C.t}}>{viewEvt.endTime?new Date(viewEvt.endTime).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"}):""}</div>
       <div style={{fontSize:11,color:C.acc}}>{viewEvt.endTime?fmtTime(viewEvt.endTime):""}</div>
      </div>
     </div>
     {viewEvt.status&&<div style={{padding:"6px 10px",borderRadius:8,background:viewEvt.status.toLowerCase().includes("confirm")?C.gD:viewEvt.status.toLowerCase().match(/cancel|no.show/)?C.rD:C.bD,border:`1px solid ${viewEvt.status.toLowerCase().includes("confirm")?C.g+"33":viewEvt.status.toLowerCase().match(/cancel|no.show/)?C.r+"33":C.b+"33"}`}}>
      <span style={{fontSize:10,fontWeight:700,color:viewEvt.status.toLowerCase().includes("confirm")?C.g:viewEvt.status.toLowerCase().match(/cancel|no.show/)?C.r:C.b}}>{viewEvt.status}</span>
     </div>}
     {viewEvt.calendarName&&<div style={{fontSize:9,color:C.td}}>📅 {viewEvt.calendarName}</div>}
     <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
      <Btn small v="ghost" onClick={()=>{deleteEvent(viewEvt.id);}} style={{color:C.r}}>🗑 Supprimer</Btn>
      <Btn small onClick={openEditFromView}>✏️ Modifier</Btn>
     </div>
    </div>
   </div>
  </div>}
  {/* Modal création/édition RDV */}
  {showModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={()=>setShowModal(false)}>
   <div className="fade-up glass-card-static" style={{padding:24,borderRadius:16,maxWidth:440,width:"90%"}} onClick={e=>e.stopPropagation()}>
    <div style={{fontWeight:800,fontSize:14,color:C.t,marginBottom:16,fontFamily:FONT_TITLE}}>📅 {modalData.isEdit?"Modifier le":"Nouveau"} rendez-vous</div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
     <input value={modalData.title} onChange={e=>setModalData(p=>({...p,title:e.target.value}))} placeholder="Titre du RDV *" style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:12,fontFamily:FONT,outline:"none"}}/>
     <div style={{display:"flex",gap:8}}>
      <div style={{flex:1}}><label style={{fontSize:9,color:C.td,fontWeight:600}}>Début *</label><input type="datetime-local" value={modalData.start} onChange={e=>setModalData(p=>({...p,start:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/></div>
      <div style={{flex:1}}><label style={{fontSize:9,color:C.td,fontWeight:600}}>Fin</label><input type="datetime-local" value={modalData.end} onChange={e=>setModalData(p=>({...p,end:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/></div>
     </div>
     <div>
      <label style={{fontSize:9,color:C.td,fontWeight:600,display:"flex",alignItems:"center",gap:4,marginBottom:4}}>Participants (email) * <span style={{color:C.r,fontSize:8}}>requis</span></label>
      {modalData.emails.map((email,ei)=><div key={ei} style={{display:"flex",gap:6,marginBottom:4}}>
       <input value={email} onChange={e=>{const n=[...modalData.emails];n[ei]=e.target.value;setModalData(p=>({...p,emails:n}));}} placeholder={`email${ei>0?" "+(ei+1):""} @...`} type="email" style={{flex:1,padding:"8px 12px",borderRadius:8,border:`1px solid ${email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?C.r:C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
       {modalData.emails.length>1&&<button onClick={()=>{const n=modalData.emails.filter((_,j)=>j!==ei);setModalData(p=>({...p,emails:n}));}} aria-label="Supprimer cet email" style={{background:"none",border:"none",color:C.r,cursor:"pointer",fontSize:14,padding:"0 4px"}}>✕</button>}
      </div>)}
      <button onClick={()=>setModalData(p=>({...p,emails:[...p.emails,""]}))} style={{background:"none",border:`1px dashed ${C.brd}`,borderRadius:8,color:C.acc,cursor:"pointer",fontSize:10,fontWeight:600,padding:"4px 12px",fontFamily:FONT,width:"100%",marginTop:2}}>+ Ajouter un participant</button>
     </div>
     <div style={{display:"flex",gap:8}}>
      <Btn small onClick={()=>{const link=genMeetLink();setModalData(p=>({...p,title:(p.title?p.title+" — ":"")+link}));showToast("🔗 Lien Meet ajouté","success");}}>🎥 Google Meet</Btn>
     </div>
     <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
      <Btn small v="ghost" onClick={()=>setShowModal(false)}>Annuler</Btn>
      <Btn small onClick={modalData.isEdit?updateEvent:createEvent}>{modalData.isEdit?"💾 Sauvegarder":"Créer le RDV"}</Btn>
     </div>
    </div>
   </div>
  </div>}
 </Sect>;
}

/* ===== CONVERSATIONS PANEL ===== */
/* ===== CONVERSATIONS PANEL ===== */
const MSG_TYPE_ICONS={SMS:"📱",Email:"📧",WhatsApp:"💬",GMB:"📍",FB:"👤",IG:"📸",Live_Chat:"🌐",Custom:"💬",TYPE_PHONE:"📱",TYPE_EMAIL:"📧",TYPE_INSTAGRAM:"📸",TYPE_FACEBOOK:"👤",TYPE_WHATSAPP:"💬",TYPE_LIVE_CHAT:"🌐",TYPE_ACTIVITY_OPPORTUNITY:"⚙️",TYPE_ACTIVITY_CONTACT:"⚙️",TYPE_CALL:"📞"};
const MSG_TYPE_LABEL=(t)=>MSG_TYPE_ICONS[t]||"💬";
const MSG_TYPE_NAME={TYPE_PHONE:"SMS",TYPE_EMAIL:"Email",TYPE_INSTAGRAM:"Instagram",TYPE_FACEBOOK:"Messenger",TYPE_WHATSAPP:"WhatsApp",TYPE_LIVE_CHAT:"Live Chat",TYPE_ACTIVITY_OPPORTUNITY:"Système",TYPE_ACTIVITY_CONTACT:"Système",TYPE_CALL:"Appel",SMS:"SMS",Email:"Email",WhatsApp:"WhatsApp",IG:"Instagram",FB:"Messenger"};
const isSystemMsg=(m)=>{const t=(m.messageType||m.type||"").toString();return t.includes("ACTIVITY")||t==="28"||m.source==="system"||/opportunity|contact.*created|status.*changed|stage.*changed/i.test(m.body||"");};
function fmtDate(d){if(!d)return"";try{const dt=new Date(d);const now=new Date();const diff=now-dt;if(diff<6e4)return"À l'instant";if(diff<36e5)return Math.floor(diff/6e4)+"min";if(diff<864e5&&dt.toDateString()===now.toDateString())return dt.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});if(diff<1728e5)return"Hier "+dt.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});return dt.toLocaleDateString("fr-FR",{day:"numeric",month:"short"});}catch{return"";}}

export function ConversationsPanel({soc}){
 const socKey=soc.ghlLocationId;
 const[convos,setConvos]=useState([]);const[selConvo,setSelConvo]=useState(null);const[msgs,setMsgs]=useState([]);const[msgInput,setMsgInput]=useState("");const[loading,setLoading]=useState(false);const[msgsLoading,setMsgsLoading]=useState(false);const[error,setError]=useState(null);const[search,setSearch]=useState("");const[sendType,setSendType]=useState("SMS");const[sending,setSending]=useState(false);const[sentOk,setSentOk]=useState(false);const[mobileShowThread,setMobileShowThread]=useState(false);const[channelFilter,setChannelFilter]=useState("all");
 const msgsEndRef=useRef(null);const listPollRef=useRef(null);const msgsPollRef=useRef(null);

 const fetchConvos=useCallback((quiet)=>{if(!socKey)return;if(!quiet){setLoading(true);setError(null);}
  fetch("/api/ghl",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"conversations_list",locationId:socKey})}).then(r=>{if(!r.ok)throw new Error("API error");return r.json();}).then(d=>{setConvos(Array.isArray(d.conversations)?d.conversations:Array.isArray(d)?d:[]);}).catch(()=>{if(!quiet)setError("Impossible de charger les conversations");}).finally(()=>{if(!quiet)setLoading(false);});
 },[socKey]);

 useEffect(()=>{fetchConvos(false);listPollRef.current=setInterval(()=>fetchConvos(true),30000);return()=>clearInterval(listPollRef.current);},[fetchConvos]);

 const loadMsgs=useCallback((c)=>{setSelConvo(c);setMsgs([]);setMsgsLoading(true);setMobileShowThread(true);setSendType(c.type||c.lastMessageType||"SMS");shouldScrollRef.current=true;
  fetch("/api/ghl",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"conversations_messages",locationId:socKey,conversationId:c.id})}).then(r=>r.json()).then(d=>{const raw=d.messages;const m=Array.isArray(raw)?raw:Array.isArray(raw?.messages)?raw.messages:Array.isArray(d)?d:[];setMsgs(m.slice().reverse());}).catch(()=>setMsgs([])).finally(()=>setMsgsLoading(false));
 },[socKey]);

 // Poll messages every 30s
 useEffect(()=>{clearInterval(msgsPollRef.current);if(!selConvo)return;
  msgsPollRef.current=setInterval(()=>{fetch("/api/ghl",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"conversations_messages",locationId:socKey,conversationId:selConvo.id})}).then(r=>r.json()).then(d=>{const raw=d.messages;const m=Array.isArray(raw)?raw:Array.isArray(raw?.messages)?raw.messages:Array.isArray(d)?d:[];setMsgs(m.slice().reverse());}).catch(()=>{});},30000);
  return()=>clearInterval(msgsPollRef.current);
 },[selConvo,socKey]);

 // Scroll to bottom only on first load or send (not poll)
 const shouldScrollRef=useRef(false);
 useEffect(()=>{if(shouldScrollRef.current){msgsEndRef.current?.scrollIntoView({behavior:"smooth"});shouldScrollRef.current=false;}},[msgs]);

 const sendMsg=()=>{if(!msgInput.trim()||!selConvo||sending)return;setSending(true);setSentOk(false);
  fetch("/api/ghl",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"conversation_send",locationId:socKey,type:sendType,contactId:selConvo.contactId||selConvo.id,message:msgInput})}).then(r=>{if(!r.ok)throw new Error();shouldScrollRef.current=true;setMsgs(p=>[...p,{body:msgInput,direction:"outbound",type:sendType,dateAdded:new Date().toISOString()}]);setMsgInput("");setSentOk(true);setTimeout(()=>setSentOk(false),2000);}).catch(()=>{}).finally(()=>setSending(false));
 };

 const filtered=useMemo(()=>{let f=convos;if(channelFilter!=="all")f=f.filter(c=>(c.type||c.lastMessageType||"").toUpperCase().includes(channelFilter));const s=search.toLowerCase().trim();if(s)f=f.filter(c=>(c.contactName||c.fullName||c.email||"").toLowerCase().includes(s));return f;},[convos,search,channelFilter]);
 const sorted=useMemo(()=>[...filtered].sort((a,b)=>new Date(b.lastMessageDate||b.dateUpdated||0)-new Date(a.lastMessageDate||a.dateUpdated||0)),[filtered]);
 const totalUnread=convos.reduce((a,c)=>a+(c.unreadCount||0),0);

 // Avatar color from name hash
 const avatarColor=(name)=>{let h=0;for(let i=0;i<(name||"").length;i++){h=name.charCodeAt(i)+((h<<5)-h);}const colors=["#6366f1","#ec4899","#14b8a6","#f59e0b","#8b5cf6","#06b6d4","#ef4444","#22c55e","#3b82f6","#f97316"];return colors[Math.abs(h)%colors.length];};
 const avatarLetter=(name)=>(name||"?")[0].toUpperCase();

 const CHANNELS=[{k:"all",icon:"💬"},{k:"PHONE",icon:"📱"},{k:"EMAIL",icon:"📧"},{k:"INSTAGRAM",icon:"📸"},{k:"FB",icon:"👤"},{k:"WHATSAPP",icon:"💬"}];
 const channelCount=(k)=>k==="all"?convos.length:convos.filter(c=>(c.type||c.lastMessageType||"").toUpperCase().includes(k)).length;

 if(!socKey)return <div style={{padding:30,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>📡</div><div style={{fontWeight:700,fontSize:13,marginBottom:6,color:C.t}}>GHL non configuré</div><div style={{color:C.td,fontSize:11}}>Ajoute l'ID GoHighLevel (Location ID) dans les paramètres de cette société pour activer les conversations.</div></div>;

 const listPanel=<div style={{width:"100%",maxWidth:320,minHeight:0,overflow:"hidden",padding:0,display:"flex",flexDirection:"column",flexShrink:0,background:"var(--sc-card-a5)",borderRight:`1px solid ${C.brd}`}}>
  {/* Search */}
  <div style={{padding:"12px 12px 0"}}>
   <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{width:"100%",padding:"8px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:"var(--sc-w04)",color:C.t,fontSize:11,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/>
  </div>
  {/* Channel tabs */}
  <div style={{display:"flex",gap:0,padding:"0 4px",marginTop:8,borderBottom:`1px solid ${C.brd}`,overflowX:"auto",scrollbarWidth:"none",msOverflowStyle:"none"}}>
   {CHANNELS.map(ch=>{const cnt=channelCount(ch.k);const active=channelFilter===ch.k;return <button key={ch.k} onClick={()=>setChannelFilter(ch.k)} style={{padding:"8px 12px",border:"none",borderBottom:active?`2px solid ${C.acc}`:"2px solid transparent",background:"transparent",color:active?C.acc:C.td,fontSize:12,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:3,flexShrink:0,transition:"color .15s",opacity:cnt>0||ch.k==="all"?1:0.35}}><span>{ch.icon}</span><span style={{fontSize:9,fontWeight:700}}>{cnt}</span></button>;})}
  </div>
  {/* Contact list */}
  <div style={{flex:1,overflow:"auto"}}>
   {loading&&<div style={{padding:20,textAlign:"center",color:C.td,fontSize:11}}>Chargement...</div>}
   {!loading&&sorted.length===0&&!error&&<div style={{padding:30,textAlign:"center",color:C.td}}><div style={{fontSize:28,marginBottom:6}}>💬</div><div style={{fontSize:11}}>Aucune conversation pour le moment</div><div style={{fontSize:10,marginTop:4,opacity:.7}}>Les nouvelles conversations apparaîtront ici</div></div>}
   {sorted.map((c,i)=>{const unread=c.unreadCount||0;const name=c.contactName||c.fullName||c.email||"Contact";const typeIcon=MSG_TYPE_LABEL(c.type||c.lastMessageType);const active=selConvo?.id===c.id;const bgCol=avatarColor(name);return <div key={c.id||i} className="conv-contact-item" role="button" tabIndex={0} aria-label={`Conversation avec ${name}${unread>0?`, ${unread} non lu${unread>1?"s":""}`:""}`} onClick={()=>loadMsgs(c)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();loadMsgs(c);}}} style={{padding:"10px 12px",borderBottom:`1px solid var(--sc-w04)`,cursor:"pointer",background:"transparent",borderLeft:active?`3px solid ${C.acc}`:"3px solid transparent",transition:"all .15s",display:"flex",alignItems:"center",gap:10}}>
    {/* Avatar */}
    <div style={{position:"relative",flexShrink:0}}>
     <div style={{width:38,height:38,borderRadius:19,background:bgCol,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff"}}>{avatarLetter(name)}</div>
     <span style={{position:"absolute",bottom:-1,right:-1,fontSize:10,lineHeight:1}}>{typeIcon}</span>
    </div>
    {/* Content */}
    <div style={{flex:1,minWidth:0}}>
     <div style={{display:"flex",alignItems:"center",gap:4}}>
      <div style={{fontWeight:unread?800:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,color:C.t}}>{name}</div>
      <span style={{fontSize:9,color:C.tm,flexShrink:0,whiteSpace:"nowrap"}}>{fmtDate(c.lastMessageDate||c.dateUpdated)}</span>
     </div>
     <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
      <div style={{fontSize:10,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{c.lastMessageBody||c.snippet||"—"}</div>
      {unread>0&&<span style={{width:unread>9?"auto":8,height:8,minWidth:8,padding:unread>9?"0 4px":0,borderRadius:8,background:"#ef4444",color:"#fff",fontSize:7,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1}}>{unread>1?unread:""}</span>}
     </div>
    </div>
   </div>;})}
  </div>
 </div>;

 const SEND_CHANNELS=[{k:"SMS",icon:"📱"},{k:"Email",icon:"📧"},{k:"WhatsApp",icon:"💬"}];

 const threadPanel=<div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,minHeight:0,overflow:"hidden",background:"var(--sc-card-a3)"}}>
  {!selConvo&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:C.td}}>
   <div style={{fontSize:48,opacity:.3}}>💬</div><div style={{fontSize:14,fontWeight:600,opacity:.5}}>Sélectionnez une conversation</div>
  </div>}
  {selConvo&&<>
   {/* Contact header */}
   <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.brd}`,display:"flex",alignItems:"center",gap:10}}>
    <div className="conv-back-btn" role="button" tabIndex={0} aria-label="Retour à la liste" style={{display:"none",cursor:"pointer",fontSize:20,marginRight:2,color:C.acc}} onClick={()=>setMobileShowThread(false)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setMobileShowThread(false);}}}>←</div>
    <div style={{width:34,height:34,borderRadius:17,background:avatarColor(selConvo.contactName||selConvo.fullName||"C"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>{avatarLetter(selConvo.contactName||selConvo.fullName||"C")}</div>
    <div style={{flex:1,minWidth:0}}>
     <div style={{display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontWeight:700,fontSize:13,color:C.t}}>{selConvo.contactName||selConvo.fullName||"Contact"}</span>
      <span style={{fontSize:9,padding:"1px 6px",borderRadius:6,background:"var(--sc-w06)",color:C.td}}>{MSG_TYPE_LABEL(selConvo.type||selConvo.lastMessageType)} {MSG_TYPE_NAME[selConvo.type||selConvo.lastMessageType]||""}</span>
     </div>
     <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
      {selConvo.phone&&<span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:"var(--sc-w05)",color:C.td}}>📱 {selConvo.phone}</span>}
      {(selConvo.email||selConvo.contactEmail)&&<span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:"var(--sc-w05)",color:C.td}}>📧 {selConvo.email||selConvo.contactEmail}</span>}
     </div>
    </div>
    <a href={`https://app.gohighlevel.com/v2/location/${socKey}/conversations/${selConvo.id}`} target="_blank" rel="noopener noreferrer" style={{fontSize:10,padding:"5px 10px",borderRadius:8,background:"var(--sc-w06)",color:C.acc,textDecoration:"none",fontWeight:600,flexShrink:0}}>GHL ↗</a>
   </div>
   {/* Messages */}
   <div style={{flex:1,overflow:"auto",padding:14}}>
    {msgsLoading&&<div style={{textAlign:"center",padding:20}} className="conv-typing"><span/><span/><span/></div>}
    {!msgsLoading&&msgs.length===0&&<div style={{textAlign:"center",padding:30,color:C.td}}><div style={{fontSize:28,marginBottom:6}}>📭</div><div style={{fontSize:11}}>Aucun message dans cette conversation</div><div style={{fontSize:10,marginTop:4,opacity:.7}}>Envoyez le premier message ci-dessous !</div></div>}
    {msgs.map((m,i)=>{const out=(m.direction||m.meta?.email?.direction||m.source)==="outbound"||m.source==="workflow"||m.source==="app";const mType=m.type||m.messageType||"";const sys=isSystemMsg(m);const channelIcon=MSG_TYPE_LABEL(m.messageType||mType);const channelName=MSG_TYPE_NAME[m.messageType||mType]||"";const channelColors={SMS:"#3b82f6",Email:"#8b5cf6",WhatsApp:"#22c55e",Instagram:"#ec4899",Messenger:"#3b82f6","Live Chat":"#06b6d4",Appel:"#f59e0b",Système:"#6b7280"};const pillBg=(channelColors[channelName]||"#6b7280")+"22";const pillColor=channelColors[channelName]||"#6b7280";
     if(sys)return <div key={m.id||i} style={{display:"flex",justifyContent:"center",marginBottom:10,animation:"convFadeIn .3s ease"}}>
      <div style={{maxWidth:"70%",padding:"4px 14px",borderRadius:20,background:"rgba(113,113,122,.08)",fontSize:10,color:C.td,textAlign:"center",fontStyle:"italic"}}>
       ⚙️ {m.body||m.text||"—"} <span style={{fontSize:8,opacity:.6}}>· {fmtDate(m.dateAdded)}</span>
      </div>
     </div>;
     return <div key={m.id||i} style={{display:"flex",justifyContent:out?"flex-end":"flex-start",marginBottom:10,animation:"convFadeIn .3s ease"}}>
     <div style={{maxWidth:"72%",padding:"10px 14px",borderRadius:out?"16px 16px 4px 16px":"16px 16px 16px 4px",background:out?"linear-gradient(135deg,#FFBF00,#FF9D00)":"var(--sc-w04)",color:out?"#0a0a0f":C.t,fontSize:12,lineHeight:"1.5"}}>
      {channelName&&<div style={{marginBottom:4}}><span style={{fontSize:8,padding:"2px 6px",borderRadius:8,background:out?"rgba(0,0,0,.1)":pillBg,color:out?"rgba(0,0,0,.55)":pillColor,fontWeight:700}}>{channelIcon} {channelName}</span></div>}
      {m.meta?.email?.subject&&<div style={{fontWeight:700,fontSize:12,marginBottom:4,color:out?"rgba(0,0,0,.75)":C.t}}>{m.meta.email.subject}</div>}
      <div style={{whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{m.body||m.text||"—"}</div>
      <div style={{fontSize:8,color:out?"rgba(0,0,0,.45)":C.tm,marginTop:4,textAlign:"right"}}>{fmtDate(m.dateAdded)}</div>
     </div>
    </div>;})}
    <div ref={msgsEndRef}/>
   </div>
   {/* Compose */}
   <div style={{padding:"8px 12px",borderTop:`1px solid ${C.brd}`,display:"flex",gap:8,alignItems:"flex-end"}}>
    <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
     {SEND_CHANNELS.map(ch=><button key={ch.k} onClick={()=>setSendType(ch.k)} style={{width:28,height:28,borderRadius:8,border:sendType===ch.k?`2px solid ${C.acc}`:`1px solid ${C.brd}`,background:sendType===ch.k?"rgba(255,170,0,.12)":"transparent",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"all .15s"}}>{ch.icon}</button>)}
    </div>
    <textarea value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}} placeholder="Message..." rows={2} style={{flex:1,padding:"8px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:"var(--sc-w04)",color:C.t,fontSize:12,fontFamily:FONT,outline:"none",resize:"none",minHeight:44,maxHeight:120,lineHeight:"1.5"}}/>
    <button className="conv-send-btn" onClick={sendMsg} disabled={sending||!msgInput.trim()} style={{width:38,height:38,borderRadius:10,border:"none",background:(!msgInput.trim()||sending)?"var(--sc-w06)":"linear-gradient(135deg,#FFBF00,#FF9D00)",color:(!msgInput.trim()||sending)?C.tm:"#0a0a0f",fontSize:16,cursor:(!msgInput.trim()||sending)?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>{sending?"⏳":"➤"}</button>
   </div>
   {sentOk&&<div style={{padding:"4px 8px",textAlign:"center",fontSize:10,color:C.g,background:C.gD}}>✓ Message envoyé</div>}
  </>}
 </div>;

 return <div className="conv-root" style={{margin:"-16px -16px 0",maxWidth:"none",width:"calc(100% + 32px)",height:"calc(100vh - 60px)",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
  {error&&<div style={{padding:"8px 12px",background:C.rD,border:`1px solid ${C.r}33`,fontSize:11,color:C.r,flexShrink:0}}>{error}</div>}
  <div className="conv-layout" style={{display:"flex",flex:1,overflow:"hidden",background:"rgba(10,10,15,.6)",minHeight:0}}>
   <div className="conv-list-wrap" style={{display:"flex",flexShrink:0}}>{listPanel}</div>
   <div className="conv-thread-wrap" style={{flex:1,display:"flex",minWidth:0,minHeight:0}}>{threadPanel}</div>
  </div>
  <style>{`
   @keyframes convFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
   @keyframes convBounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
   .conv-contact-item:hover{background:var(--sc-w04)!important}
   .conv-typing span{display:inline-block;width:6px;height:6px;border-radius:50%;background:${C.td};margin:0 2px;animation:convBounce 1.4s infinite ease-in-out both}.conv-typing span:nth-child(1){animation-delay:-.32s}.conv-typing span:nth-child(2){animation-delay:-.16s}
   .conv-root *::-webkit-scrollbar{width:4px}.conv-root *::-webkit-scrollbar-track{background:transparent}.conv-root *::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}
   .conv-send-btn:active{transform:scale(.92)}
   .conv-root{box-sizing:border-box;}
   .conv-list-wrap>div{height:100%!important;max-height:100%!important;}
   .conv-thread-wrap>div{height:100%!important;max-height:100%!important;}
   @media(max-width:640px){
    .conv-layout{flex-direction:column;height:auto!important;}
    .conv-list-wrap{display:${mobileShowThread&&selConvo?"none":"flex"}!important;width:100%!important;height:100vh!important;}
    .conv-thread-wrap{display:${!mobileShowThread||!selConvo?"none":"flex"}!important;height:100vh!important;}
    .conv-back-btn{display:block!important;}
   }
  `}</style>
 </div>;
}

/* ===== TODO PANEL ===== */
/* ===== TODO PANEL ===== */
export function TodoPanel({soc,ghlData,socBankData,clients}){
 const[manualTasks,setManualTasks]=useState(()=>{try{return JSON.parse(localStorage.getItem(`todo_${soc.id}`)||"[]");}catch{return[];}});
 const[doneIds,setDoneIds]=useState(()=>{try{return JSON.parse(localStorage.getItem(`todo_done_${soc.id}`)||"[]");}catch{return[];}});
 const[newTask,setNewTask]=useState("");
 const saveDone=(ids)=>{setDoneIds(ids);try{localStorage.setItem(`todo_done_${soc.id}`,JSON.stringify(ids));}catch{}};
 const saveManual=(tasks)=>{setManualTasks(tasks);try{localStorage.setItem(`todo_${soc.id}`,JSON.stringify(tasks));}catch{}};
 const toggleDone=(id)=>{const n=doneIds.includes(id)?doneIds.filter(x=>x!==id):[...doneIds,id];saveDone(n);};
 const addTask=()=>{if(!newTask.trim())return;saveManual([...manualTasks,{id:uid(),text:newTask.trim(),priority:"normal",at:new Date().toISOString()}]);setNewTask("");};
 const autoTasks=useMemo(()=>{
  const tasks=[];const now=new Date();const todayStr=now.toISOString().slice(0,10);
  // Today's calendar events
  (ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.startTime||"").startsWith(todayStr)).forEach(e=>{const t=new Date(e.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});tasks.push({id:"cal_"+e.id,text:`Appel avec ${e.contactName||e.title||"client"} à ${t}`,priority:"urgent",auto:true});});
  // Unpaid clients (>45 days)
  const myCl=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active");
  const txs=socBankData?.transactions||[];const now45=Date.now()-45*864e5;
  myCl.forEach(cl=>{if(!cl.billing||cl.billing.type==="oneoff")return;const cn=(cl.name||"").toLowerCase().trim();const hasRecent=txs.some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;const txDate=new Date(tx.created_at||tx.date||0).getTime();if(txDate<now45)return false;const desc=(leg.description||tx.reference||"").toLowerCase();return cn.length>2&&desc.includes(cn);});if(!hasRecent)tasks.push({id:"unpaid_"+cl.id,text:`Relancer ${cl.name} — facture impayée`,priority:"urgent",auto:true});});
  // Recent leads (<48h)
  const h48=Date.now()-48*36e5;
  (ghlData?.[soc.id]?.ghlClients||[]).filter(c=>{const d=new Date(c.at||c.dateAdded||0).getTime();return d>h48;}).forEach(c=>{tasks.push({id:"newlead_"+c.id,text:`Nouveau lead: ${c.name||c.email||"—"} — à contacter`,priority:"important",auto:true});});
  // Expiring contracts
  myCl.forEach(cl=>{const end=commitmentEnd(cl);if(end){const days=Math.round((end-now)/(864e5));if(days>0&&days<=30)tasks.push({id:"expiry_"+cl.id,text:`Contrat ${cl.name} expire dans ${days} jours`,priority:days<=7?"urgent":"important",auto:true});}});
  return tasks;
 },[soc.id,ghlData,socBankData,clients]);
 const allTasks=[...autoTasks,...manualTasks.map(t=>({...t,auto:false}))];
 const priorityIcon={urgent:"🔴",important:"🟡",normal:"🟢"};
 const priorityOrder={urgent:0,important:1,normal:2};
 const sorted=[...allTasks].sort((a,b)=>(priorityOrder[a.priority]||2)-(priorityOrder[b.priority]||2));
 return <Sect title="✅ Actions du jour" sub="Tâches automatiques & manuelles">
  <div style={{display:"flex",gap:6,marginBottom:12}}>
   <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTask();}} placeholder="Ajouter une tâche..." style={{flex:1,padding:"8px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
   <Btn small onClick={addTask}>+ Ajouter</Btn>
  </div>
  {sorted.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucune tâche</div></Card>}
  {sorted.map(t=>{const done=doneIds.includes(t.id);return <div key={t.id} className="fu" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:done?C.card:"var(--sc-card-a6)",borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
   <div onClick={()=>toggleDone(t.id)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${done?C.g:C.brd}`,background:done?C.gD:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{done&&<span style={{color:C.g,fontSize:11}}>✓</span>}</div>
   <span style={{fontSize:12,flexShrink:0}}>{priorityIcon[t.priority]||"🟢"}</span>
   <div style={{flex:1,fontSize:12,fontWeight:done?400:600,color:done?C.td:C.t,textDecoration:done?"line-through":"none"}}>{t.text}</div>
   {t.auto&&<span style={{fontSize:8,color:C.td,background:C.card2,padding:"1px 5px",borderRadius:6}}>auto</span>}
   {!t.auto&&<button onClick={()=>saveManual(manualTasks.filter(m=>m.id!==t.id))} aria-label="Supprimer la tâche" style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:10,padding:"2px 4px"}}>✕</button>}
  </div>;})}
 </Sect>;
}

/* ===== PIPELINE KANBAN PANEL ===== */
/* ===== PIPELINE KANBAN PANEL ===== */
export function PipelineKanbanPanel({soc,ghlData}){
 const gd=ghlData?.[soc.id];const opps=gd?.opportunities||[];const stages=gd?.pipelines?.[0]?.stages||[];
 const[dragId,setDragId]=useState(null);
 const stageNames=stages.length>0?stages.map(s=>s.name||s):["Nouveau","Contacté","Qualifié","Proposition","Gagné"];
 const byStage=useMemo(()=>{const m={};stageNames.forEach(s=>{m[s]=opps.filter(o=>o.stage===s);});const unmatched=opps.filter(o=>!stageNames.includes(o.stage));if(unmatched.length>0)m["Autre"]=unmatched;return m;},[opps,stageNames]);
 const moveOpp=(oppId,newStage)=>{
  const socKey=soc.ghlLocationId||soc.id;
  fetch(`/api/ghl?action=opportunity_update&loc=${socKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:oppId,stageId:newStage})}).catch(()=>{});
 };
 return <Sect title="🔄 Pipeline Kanban" sub="Opportunités par étape">
  <div style={{display:"flex",gap:8,overflow:"auto",paddingBottom:8}}>
   {Object.entries(byStage).map(([stage,cards],si)=><div key={stage} style={{minWidth:180,flex:"1 0 180px"}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragId){moveOpp(dragId,stage);setDragId(null);}}}>
    <div style={{padding:"8px 10px",borderRadius:"10px 10px 0 0",background:GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]+"22",borderBottom:`2px solid ${GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}`,marginBottom:4}}>
     <div style={{fontWeight:700,fontSize:11,color:GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}}>{stage}</div>
     <div style={{fontSize:9,color:C.td}}>{cards.length} deal{cards.length>1?"s":""}</div>
    </div>
    {cards.map(o=><div key={o.id} draggable onDragStart={()=>setDragId(o.id)} className="glass-card-static" style={{padding:10,marginBottom:4,cursor:"grab",borderLeft:`3px solid ${GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}`}}>
     <div style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name||o.contact?.name||"—"}</div>
     <div style={{fontSize:10,fontWeight:800,color:C.acc,marginTop:2}}>{fmt(o.value||0)}€</div>
     <div style={{fontSize:8,color:C.td,marginTop:2}}>{o.createdAt?ago(o.createdAt):""}</div>
    </div>)}
    {cards.length===0&&<div style={{padding:16,textAlign:"center",color:C.tm,fontSize:10,border:`1px dashed ${C.brd}`,borderRadius:8}}>Vide</div>}
   </div>)}
  </div>
 </Sect>;
}

/* ===== RESSOURCES PANEL ===== */
/* ===== RESSOURCES PANEL ===== */
export function RessourcesPanel({soc,clients}){
 const[resources,setResources]=useState(()=>{try{return JSON.parse(localStorage.getItem(`resources_${soc.id}`)||"[]");}catch{return[];}});
 const[newR,setNewR]=useState({title:"",url:"",clientId:"",type:"video"});
 const saveRes=(r)=>{setResources(r);try{localStorage.setItem(`resources_${soc.id}`,JSON.stringify(r));}catch{}};
 const addRes=()=>{if(!newR.title||!newR.url)return;saveRes([...resources,{...newR,id:uid(),at:new Date().toISOString()}]);setNewR({title:"",url:"",clientId:"",type:"video"});};
 const delRes=(id)=>saveRes(resources.filter(r=>r.id!==id));
 const myCl=(clients||[]).filter(c=>c.socId===soc.id);
 const byClient=useMemo(()=>{const m={};resources.forEach(r=>{const k=r.clientId||"general";if(!m[k])m[k]=[];m[k].push(r);});return m;},[resources]);
 const typeIcons={video:"🎬",loom:"📹",tella:"📹",skool:"🎓",notion:"📝",link:"🔗"};
 return <Sect title="📹 Ressources" sub="Vidéos, liens & documents">
  <Card style={{marginBottom:12}}>
   <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
    <input value={newR.title} onChange={e=>setNewR({...newR,title:e.target.value})} placeholder="Titre" style={{flex:"1 1 120px",padding:"6px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
    <input value={newR.url} onChange={e=>setNewR({...newR,url:e.target.value})} placeholder="URL" style={{flex:"2 1 200px",padding:"6px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
    <select value={newR.type} onChange={e=>setNewR({...newR,type:e.target.value})} style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT}}>
     <option value="video">🎬 Vidéo</option><option value="loom">📹 Loom</option><option value="tella">📹 Tella</option><option value="skool">🎓 Skool</option><option value="notion">📝 Notion</option><option value="link">🔗 Lien</option>
    </select>
    <select value={newR.clientId} onChange={e=>setNewR({...newR,clientId:e.target.value})} style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT}}>
     <option value="">Général</option>{myCl.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
    <Btn small onClick={addRes}>+ Ajouter</Btn>
   </div>
  </Card>
  {Object.entries(byClient).map(([clientId,items])=>{const cl=myCl.find(c=>c.id===clientId);return <div key={clientId} style={{marginBottom:12}}>
   <div style={{fontSize:11,fontWeight:700,color:C.t,marginBottom:4}}>{cl?`👤 ${cl.name}`:"📁 Général"}</div>
   {items.map(r=><div key={r.id} className="fu" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"var(--sc-card-a6)",borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
    <span style={{fontSize:14}}>{typeIcons[r.type]||"🔗"}</span>
    <div style={{flex:1,minWidth:0}}>
     <a href={r.url} target="_blank" rel="noopener noreferrer" style={{fontWeight:600,fontSize:11,color:C.b,textDecoration:"none"}}>{r.title}</a>
     <div style={{fontSize:8,color:C.td}}>{r.type} · {r.at?ago(r.at):""}</div>
    </div>
    <button onClick={()=>delRes(r.id)} aria-label="Supprimer la ressource" style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:10}}>✕</button>
   </div>)}
  </div>;})}
  {resources.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucune ressource ajoutée</div></Card>}
 </Sect>;
}

/* ===== ACTIVITE PANEL (merged Inbox + Todo) ===== */
/* ===== ACTIVITE PANEL (merged Inbox + Todo) ===== */
export function ActivitePanel({soc,ghlData,socBankData,clients}){
 const[manualTasks,setManualTasks]=useState(()=>{try{return JSON.parse(localStorage.getItem(`todo_${soc.id}`)||"[]");}catch{return[];}});
 const[doneIds,setDoneIds]=useState(()=>{try{return JSON.parse(localStorage.getItem(`todo_done_${soc.id}`)||"[]");}catch{return[];}});
 const[newTask,setNewTask]=useState("");
 const[newDeadline,setNewDeadline]=useState("");
 const[newPriority,setNewPriority]=useState("normal");
 const[newRecurrence,setNewRecurrence]=useState("");
 const[taskFilter,setTaskFilter]=useState("all"); // all|pending|done
 const[readIds,setReadIds]=useState(()=>{try{return JSON.parse(localStorage.getItem(`inbox_read_${soc.id}`)||"[]");}catch{return[];}});
 const[,forceUpdate]=useState(0);
 useEffect(()=>{const iv=setInterval(()=>forceUpdate(x=>x+1),60000);return()=>clearInterval(iv);},[]);
 const saveDone=(ids)=>{setDoneIds(ids);try{localStorage.setItem(`todo_done_${soc.id}`,JSON.stringify(ids));sSet(`todo_done_${soc.id}`,ids);}catch{}};
 const saveManual=(tasks)=>{setManualTasks(tasks);try{localStorage.setItem(`todo_${soc.id}`,JSON.stringify(tasks));sSet(`todo_${soc.id}`,tasks);}catch{}};
 const toggleDone=(id)=>{const n=doneIds.includes(id)?doneIds.filter(x=>x!==id):[...doneIds,id];saveDone(n);};
 const addTask=()=>{if(!newTask.trim())return;saveManual([...manualTasks,{id:uid(),text:newTask.trim(),priority:newPriority,at:new Date().toISOString(),deadline:newDeadline||null,recurrence:newRecurrence||null}]);setNewTask("");setNewDeadline("");setNewPriority("normal");setNewRecurrence("");};
 // Recurrence check: recreate recurring tasks if completed
 useEffect(()=>{
  const now=new Date();const today=now.toISOString().slice(0,10);
  const updated=[...manualTasks];let changed=false;
  manualTasks.filter(t=>t.recurrence&&doneIds.includes(t.id)).forEach(t=>{
   const lastDone=t.lastRecreated||t.at;const last=new Date(lastDone);
   let shouldRecreate=false;
   if(t.recurrence==="daily"&&(now-last)>864e5)shouldRecreate=true;
   if(t.recurrence==="weekly"&&(now-last)>7*864e5)shouldRecreate=true;
   if(t.recurrence==="monthly"&&(now-last)>28*864e5)shouldRecreate=true;
   if(shouldRecreate){
    const newT={...t,id:uid(),at:now.toISOString(),lastRecreated:now.toISOString()};
    updated.push(newT);changed=true;
   }
  });
  if(changed)saveManual(updated);
 },[]);
 const deadlineLabel=(dl)=>{if(!dl)return null;const diff=new Date(dl).getTime()-Date.now();if(diff<0)return{text:"Expiré",color:C.r};const mins=Math.floor(diff/60000);if(mins<60)return{text:`${mins}min`,color:C.o};const hrs=Math.floor(mins/60);const rm=mins%60;if(hrs<24)return{text:`${hrs}h${rm>0?String(rm).padStart(2,"0"):""}`,color:hrs<2?C.o:C.g};const days=Math.floor(hrs/24);return{text:`${days}j`,color:C.g};};
 const markRead=(id)=>{const n=[...readIds,id];setReadIds(n);try{localStorage.setItem(`inbox_read_${soc.id}`,JSON.stringify(n));}catch{}};
 // Auto tasks
 const autoTasks=useMemo(()=>{
  const tasks=[];const now=new Date();const todayStr=now.toISOString().slice(0,10);
  (ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.startTime||"").startsWith(todayStr)).forEach(e=>{const t=new Date(e.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});tasks.push({id:"cal_"+e.id,text:`📞 Appel avec ${e.contactName||e.title||"client"} à ${t}`,priority:"urgent",auto:true});});
  const myCl=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active");
  const txs=socBankData?.transactions||[];const now45=Date.now()-45*864e5;
  myCl.forEach(cl=>{if(!cl.billing||cl.billing.type==="oneoff")return;const cn=(cl.name||"").toLowerCase().trim();const hasRecent=txs.some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;return new Date(tx.created_at||tx.date||0).getTime()>now45&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});if(!hasRecent)tasks.push({id:"unpaid_"+cl.id,text:`💸 Relancer ${cl.name} — facture impayée`,priority:"urgent",auto:true});});
  const h48=Date.now()-48*36e5;
  (ghlData?.[soc.id]?.ghlClients||[]).filter(c=>new Date(c.at||c.dateAdded||0).getTime()>h48).forEach(c=>{tasks.push({id:"newlead_"+c.id,text:`🟢 Nouveau lead: ${c.name||c.email||"—"} — à contacter`,priority:"important",auto:true});});
  myCl.forEach(cl=>{const end=commitmentEnd(cl);if(end){const days=Math.round((end-now)/(864e5));if(days>0&&days<=30)tasks.push({id:"expiry_"+cl.id,text:`📋 Contrat ${cl.name} expire dans ${days} jours`,priority:days<=7?"urgent":"important",auto:true});}});
  return tasks;
 },[soc.id,ghlData,socBankData,clients]);
 const allTasks=[...autoTasks,...manualTasks.map(t=>({...t,auto:false}))];
 const priorityIcon={urgent:"🔴",important:"🟡",normal:"🟢"};
 const priorityOrder={urgent:0,important:1,normal:2};
 // Sort by: priority first, then by deadline (expired first, then soonest), then by date
 const sorted=[...allTasks].sort((a,b)=>{
  const pa=(priorityOrder[a.priority]||2);const pb=(priorityOrder[b.priority]||2);
  if(pa!==pb)return pa-pb;
  // Both same priority — sort by deadline
  const dlA=a.deadline?new Date(a.deadline).getTime():Infinity;
  const dlB=b.deadline?new Date(b.deadline).getTime():Infinity;
  if(dlA!==dlB)return dlA-dlB;
  return new Date(b.at||0)-new Date(a.at||0);
 });
 // Filter tasks
 const filteredTasks=taskFilter==="all"?sorted:taskFilter==="pending"?sorted.filter(t=>!doneIds.includes(t.id)):sorted.filter(t=>doneIds.includes(t.id));
 // Activity feed = completed tasks only
 const feedItems=useMemo(()=>{
  return sorted.filter(t=>doneIds.includes(t.id)).map(t=>({id:t.id,icon:"✅",desc:t.text,date:new Date()})).slice(0,30);
 },[sorted,doneIds]);
 // Productivité semaine
 const weekKey=`prod_${soc.id}_${curW()}`;
 const[weekDone,setWeekDone]=useState(()=>{try{return parseInt(localStorage.getItem(weekKey)||"0");}catch{return 0;}});
 useEffect(()=>{const cnt=sorted.filter(t=>doneIds.includes(t.id)).length;setWeekDone(cnt);try{localStorage.setItem(weekKey,String(cnt));}catch{}},[doneIds,sorted]);
 const weekTotal=sorted.length;const weekPct=weekTotal>0?Math.round(weekDone/weekTotal*100):0;
 const pendingCount=sorted.filter(t=>!doneIds.includes(t.id)).length;
 const urgentCount=sorted.filter(t=>!doneIds.includes(t.id)&&t.priority==="urgent").length;
 const expiredCount=sorted.filter(t=>!doneIds.includes(t.id)&&t.deadline&&new Date(t.deadline)<new Date()).length;
 return <Sect title="⚡ Activité" sub="Tâches & feed d'activité">
  {/* Productivité semaine */}
  <div className="glass-card-static" style={{padding:14,marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
   <span style={{fontSize:20}}>📊</span>
   <div style={{flex:1}}>
    <div style={{fontSize:11,fontWeight:700,color:C.t}}>Cette semaine: {weekDone} tâches complétées / {weekTotal} total ({weekPct}%)</div>
    <div style={{height:5,background:C.brd,borderRadius:3,overflow:"hidden",marginTop:4}}><div style={{height:"100%",width:`${weekPct}%`,background:weekPct>=80?C.g:weekPct>=50?C.acc:C.o,borderRadius:3,transition:"width .5s ease"}}/></div>
   </div>
  </div>
  {/* Tasks section */}
  <div className="glass-card-static" style={{padding:16,marginBottom:16}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
    <span style={{fontSize:11,fontWeight:800,color:C.acc,fontFamily:FONT_TITLE}}>📋 TÂCHES DU JOUR</span>
    <span style={{fontSize:9,color:C.td}}>{sorted.filter(t=>!doneIds.includes(t.id)).length} restantes</span>
   </div>
   <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
    <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTask();}} placeholder="Ajouter une tâche..." style={{flex:"1 1 140px",padding:"7px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
    <input type="datetime-local" value={newDeadline} onChange={e=>setNewDeadline(e.target.value)} style={{padding:"7px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT,outline:"none",minWidth:130}}/>
    <select value={newPriority} onChange={e=>setNewPriority(e.target.value)} style={{padding:"7px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT,outline:"none"}}>
     <option value="normal">🟢 Normal</option><option value="important">🟡 Important</option><option value="urgent">🔴 Urgent</option>
    </select>
    <select value={newRecurrence} onChange={e=>setNewRecurrence(e.target.value)} style={{padding:"7px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT,outline:"none"}}>
     <option value="">Unique</option><option value="daily">Quotidien</option><option value="weekly">Hebdo</option><option value="monthly">Mensuel</option>
    </select>
    <Btn small onClick={addTask}>+</Btn>
   </div>
   {/* Filters */}
   <div style={{display:"flex",gap:4,marginBottom:10}}>
    {[{k:"all",l:`Toutes (${sorted.length})`},{k:"pending",l:`À faire (${pendingCount})`},{k:"done",l:`Faites (${weekDone})`}].map(f=><button key={f.k} onClick={()=>setTaskFilter(f.k)} style={{padding:"4px 10px",borderRadius:8,border:`1px solid ${taskFilter===f.k?C.acc+"44":C.brd}`,background:taskFilter===f.k?C.accD:"transparent",color:taskFilter===f.k?C.acc:C.td,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{f.l}</button>)}
    {urgentCount>0&&<span style={{padding:"4px 8px",borderRadius:8,background:C.rD,color:C.r,fontSize:9,fontWeight:700}}>🔴 {urgentCount} urgente{urgentCount>1?"s":""}</span>}
    {expiredCount>0&&<span style={{padding:"4px 8px",borderRadius:8,background:C.rD,color:C.r,fontSize:9,fontWeight:700}}>⏰ {expiredCount} expirée{expiredCount>1?"s":""}</span>}
   </div>
   {filteredTasks.map(t=>{const done=doneIds.includes(t.id);return <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:done?"transparent":"var(--sc-card-a6)",borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3,opacity:done?.5:1}}>
    <div onClick={()=>toggleDone(t.id)} style={{width:16,height:16,borderRadius:4,border:`2px solid ${done?C.g:C.brd}`,background:done?C.gD:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{done&&<span style={{color:C.g,fontSize:9}}>✓</span>}</div>
    <span style={{fontSize:11,flexShrink:0}}>{priorityIcon[t.priority]||"🟢"}</span>
    <div style={{flex:1,fontSize:11,fontWeight:done?400:600,color:done?C.td:C.t,textDecoration:done?"line-through":"none"}}>{t.text}</div>
    {(()=>{const dl=deadlineLabel(t.deadline);return dl?<span style={{fontSize:8,fontWeight:800,color:dl.color,background:dl.color+"18",padding:"1px 5px",borderRadius:6,flexShrink:0}}>⏱{dl.text}</span>:null;})()}
    {t.auto&&<span style={{fontSize:8,color:C.td,background:C.card2,padding:"1px 5px",borderRadius:6}}>auto</span>}
    {t.recurrence&&<span style={{fontSize:8,color:C.b,background:C.bD,padding:"1px 5px",borderRadius:6}}>🔄 {t.recurrence==="daily"?"quotidien":t.recurrence==="weekly"?"hebdo":"mensuel"}</span>}
    {/* Actions 1-clic */}
    {t.auto&&t.id.startsWith("cal_")&&<button onClick={(e)=>{e.stopPropagation();const cName=t.text.replace(/^📞 Appel avec /,"").replace(/ à .*$/,"");const cl2=(clients||[]).find(c=>c.socId===soc.id&&(c.name||"").toLowerCase().includes(cName.toLowerCase()));if(cl2?.phone)window.open(`tel:${cl2.phone}`);else if(soc.ghlLocationId)window.open(`https://app.gohighlevel.com/v2/location/${soc.ghlLocationId}/calendar`);}} style={{padding:"2px 6px",borderRadius:5,border:`1px solid ${C.b}`,background:C.bD,color:C.b,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>📞</button>}
    {t.auto&&(t.id.startsWith("unpaid_")||t.id.startsWith("newlead_"))&&<button onClick={(e)=>{e.stopPropagation();const clId=t.id.split("_").slice(1).join("_");const cl2=(clients||[]).find(c=>c.id===clId)||(ghlData?.[soc.id]?.ghlClients||[]).find(c=>(c.id||c.ghlId)===clId);if(cl2)showToast(`💬 ${cl2.name||"—"} · ${cl2.email||"—"} · ${cl2.phone||"—"}`, "info");}} style={{padding:"2px 6px",borderRadius:5,border:`1px solid ${C.o}`,background:C.oD,color:C.o,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>💬</button>}
    {!t.auto&&<button onClick={()=>saveManual(manualTasks.filter(m=>m.id!==t.id))} aria-label="Supprimer la tâche" style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:10}}>✕</button>}
   </div>;})}
   {sorted.length===0&&<div style={{textAlign:"center",padding:12,color:C.td,fontSize:11}}>✅ Aucune tâche</div>}
  </div>
  {/* Activity feed */}
  <div className="glass-card-static" style={{padding:16}}>
   <div style={{fontSize:11,fontWeight:800,color:C.b,fontFamily:FONT_TITLE,marginBottom:10}}>✅ TÂCHES RÉALISÉES</div>
   <div style={{maxHeight:400,overflowY:"auto"}}>
    {feedItems.map(it=>{const isRead=readIds.includes(it.id);return <div key={it.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:isRead?"transparent":"rgba(255,170,0,.03)",borderRadius:8,border:`1px solid ${isRead?C.brd:"rgba(255,170,0,.12)"}`,marginBottom:3}}>
     <span style={{fontSize:14,flexShrink:0}}>{it.icon}</span>
     <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:11,fontWeight:isRead?400:600,color:isRead?C.td:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.desc}</div>
      <div style={{fontSize:9,color:C.td}}>{ago(it.date)}</div>
     </div>
     {!isRead&&<button onClick={()=>markRead(it.id)} style={{padding:"2px 6px",borderRadius:6,border:`1px solid ${C.brd}`,background:C.card,color:C.td,fontSize:8,cursor:"pointer",fontFamily:FONT}}>✓</button>}
    </div>;})}
    {feedItems.length===0&&<div style={{textAlign:"center",padding:16,color:C.td,fontSize:11}}>Aucune activité récente</div>}
   </div>
  </div>
 </Sect>;
}

/* ===== CLIENTS UNIFIED PANEL (Clients + Conversations + Pipeline toggle) ===== */
/* ===== CLIENTS UNIFIED PANEL (Clients + Conversations + Pipeline toggle) ===== */
export function ClientsUnifiedPanel({soc,clients,saveClients,ghlData,socBankData,invoices,saveInvoices,stripeData}){
 const[viewMode,setViewMode]=useState("list");
 const[selClient,setSelClient]=useState(null);
 const[convos,setConvos]=useState([]);const[convoMsgs,setConvoMsgs]=useState([]);const[convoLoading,setConvoLoading]=useState(false);const[msgInput,setMsgInput]=useState("");
 const[clientSearch,setClientSearch]=useState("");
 const[msgTemplates]=useState([
  {label:"Relance paiement",icon:"💰",text:"Bonjour {{name}}, j'espère que vous allez bien. Je me permets de vous rappeler que le paiement de {{amount}}€ est en attente. Pourriez-vous procéder au règlement ? Merci !"},
  {label:"Suivi mensuel",icon:"📊",text:"Bonjour {{name}}, voici votre bilan mensuel. N'hésitez pas si vous avez des questions. À bientôt !"},
  {label:"Rappel RDV",icon:"📅",text:"Bonjour {{name}}, petit rappel pour notre rendez-vous prévu prochainement. Confirmez-vous votre disponibilité ?"},
  {label:"Bienvenue",icon:"👋",text:"Bienvenue {{name}} ! Ravi de vous compter parmi nos clients. N'hésitez pas à me contacter si vous avez la moindre question."},
 ]);
 const socKey=soc.ghlLocationId||soc.id;
 // Client health score
 const calcClientHealth=(cl)=>{
  let score=100;const txs2=socBankData?.transactions||[];const cn=(cl.name||"").toLowerCase().trim();
  // Payment regularity (-30 if no payment in 45 days)
  const recentPay=txs2.find(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;return new Date(tx.created_at||0)>new Date(Date.now()-45*864e5)&&cn.length>2&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});
  if(!recentPay&&cl.billing?.type!=="oneoff")score-=30;
  // Engagement remaining
  const rem=commitmentRemaining(cl);if(rem!==null&&rem<=1)score-=20;if(rem!==null&&rem<=0)score-=15;
  // Activity (if churned or no recent interaction)
  if(cl.status==="churned")score-=50;
  return Math.max(0,Math.min(100,score));
 };
 const HealthBadge=({score:s})=>{const color=s>=80?C.g:s>=50?C.o:C.r;const label=s>=80?"Sain":s>=50?"Attention":"À risque";return <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:6,background:color+"18",color,border:`1px solid ${color}33`}}>{s>=80?"💚":s>=50?"🟡":"🔴"} {label} ({s}%)</span>;};
 // Churn alerts
 const myClients=(clients||[]).filter(c=>c.socId===soc.id);
 const atRiskClients=myClients.filter(c=>c.status==="active"&&calcClientHealth(c)<50);
 const recentChurned=myClients.filter(c=>c.status==="churned");
 // Load conversations for selected client
 useEffect(()=>{
  if(!selClient)return;setConvoLoading(true);setConvos([]);setConvoMsgs([]);
  const contactId=selClient.ghlId||selClient.id;
  fetch("/api/ghl",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"conversations_list",locationId:socKey,contactId})}).then(r=>r.json()).then(d=>{const cvs=Array.isArray(d.conversations)?d.conversations:Array.isArray(d)?d:[];setConvos(cvs);
   if(cvs.length>0){const c=cvs[0];
    fetch("/api/ghl",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"conversations_messages",locationId:socKey,conversationId:c.id})}).then(r2=>r2.json()).then(d2=>{const msgs=Array.isArray(d2.messages)?d2.messages:Array.isArray(d2)?d2:[];setConvoMsgs(msgs);}).catch(()=>{});}
  }).catch(()=>{}).finally(()=>setConvoLoading(false));
 },[selClient,socKey]);
 const sendMsg=()=>{if(!msgInput.trim()||!selClient||convos.length===0)return;
  fetch("/api/ghl",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"conversation_send",locationId:socKey,type:"Email",contactId:selClient.ghlId||selClient.id,message:msgInput})}).then(()=>{setConvoMsgs(p=>[...p,{body:msgInput,direction:"outbound",dateAdded:new Date().toISOString()}]);setMsgInput("");}).catch(()=>{});
 };
 // Pipeline data — simplified 3 categories
 const gd=ghlData?.[soc.id];const opps=gd?.opportunities||[];const stages=gd?.pipelines?.[0]?.stages||[];
 const stageNames=stages.length>0?stages.map(s=>s.name||s):["Nouveau","Contacté","Qualifié","Proposition","Gagné"];
 const txs=socBankData?.transactions||[];
 const simplifiedPipeline=useMemo(()=>{
  const attenteOpps=opps.filter(o=>o.status==="open"||o.status==="pending");
  const clientsOpps=opps.filter(o=>o.status==="won");
  const perdusOpps=opps.filter(o=>o.status==="lost"||o.status==="abandoned");
  // Cumul encaissements for won clients
  const clientsCumul=clientsOpps.reduce((acc,o)=>{
   const cn=(o.name||o.contact?.name||"").toLowerCase().trim();
   const matched=txs.filter(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;return cn.length>2&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});
   return acc+matched.reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);
  },0);
  // Montant mensuel perdu cumulé
  const perdusMensuel=perdusOpps.reduce((acc,o)=>acc+(o.value||0),0);
  return{
   "Valorisation Prospects":{opps:attenteOpps,value:attenteOpps.reduce((a,o)=>a+(o.value||0),0),color:"#60a5fa",icon:"✍️",valueSub:"Valeur des opportunités"},
   "Clients":{opps:clientsOpps,value:clientsCumul,color:C.g,icon:"✅",valueSub:"Encaissés cumulés"},
   "Perdus":{opps:perdusOpps,value:perdusMensuel,color:C.r,icon:"❌",valueSub:"Mensuel perdu cumulé"}
  };
 },[opps,txs]);
 // Find pipeline stage for a client
 const clientStage=(cl)=>{const opp=opps.find(o=>(o.contact?.name||"").toLowerCase()===(cl.name||"").toLowerCase()||o.contact?.email===cl.email);return opp?{stage:opp.stage,value:opp.value,status:opp.status}:null;};
 if(viewMode==="kanban"){
  return <Sect title="👥 Clients" sub="Vue Pipeline simplifiée" right={<div style={{display:"flex",gap:4}}><Btn small v={viewMode==="list"?"primary":"ghost"} onClick={()=>setViewMode("list")}>📋 Liste</Btn><Btn small v={viewMode==="kanban"?"primary":"ghost"} onClick={()=>setViewMode("kanban")}>🔄 Kanban</Btn></div>}>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
    {Object.entries(simplifiedPipeline).map(([cat,data])=><div key={cat} className="fade-up" style={{background:"var(--sc-card-a4)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:`1px solid ${data.color}33`,borderRadius:14,overflow:"hidden"}}>
     <div style={{padding:"12px 14px",background:`${data.color}15`,borderBottom:`2px solid ${data.color}55`}}>
      <div style={{fontWeight:800,fontSize:12,color:data.color}}>{data.icon} {cat}</div>
      <div style={{fontSize:10,color:C.td,marginTop:2}}>{data.opps.length} opportunité{data.opps.length>1?"s":""}</div>
      <div style={{fontWeight:900,fontSize:18,color:data.color,marginTop:4}}>{fmt(data.value)}€</div>
      <div style={{fontSize:8,color:C.td}}>{data.valueSub}</div>
     </div>
     <div style={{padding:8,maxHeight:320,overflowY:"auto"}}>
      {data.opps.map(o=><div key={o.id} className="glass-card-static" style={{padding:10,marginBottom:4,cursor:"pointer",borderLeft:`3px solid ${data.color}`}} onClick={()=>{const cl=(clients||[]).find(c=>(c.name||"").toLowerCase()===(o.name||o.contact?.name||"").toLowerCase());if(cl)setSelClient(cl);}}>
       <div style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name||o.contact?.name||"—"}</div>
       <div style={{fontSize:10,fontWeight:800,color:data.color,marginTop:2}}>{fmt(o.value||0)}€</div>
       <div style={{fontSize:8,color:C.td,marginTop:2}}>{o.createdAt?ago(o.createdAt):""}</div>
      </div>)}
      {data.opps.length===0&&<div style={{padding:16,textAlign:"center",color:C.tm,fontSize:10,border:`1px dashed ${C.brd}`,borderRadius:8}}>Vide</div>}
     </div>
    </div>)}
   </div>
  </Sect>;
 }
 return <div>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
   <div><h2 style={{color:C.t,fontSize:13,fontWeight:800,margin:0,fontFamily:FONT_TITLE}}>👥 CLIENTS</h2><p style={{color:C.td,fontSize:10,margin:"1px 0 0"}}>Portefeuille & conversations</p></div>
   <div style={{display:"flex",gap:4}}><Btn small v={viewMode==="list"?"primary":"ghost"} onClick={()=>setViewMode("list")}>📋 Liste</Btn><Btn small v={viewMode==="kanban"?"primary":"ghost"} onClick={()=>setViewMode("kanban")}>🔄 Kanban</Btn></div>
  </div>
  {/* Churn alerts */}
  {atRiskClients.length>0&&<div className="fu" style={{padding:"10px 14px",marginBottom:12,borderRadius:12,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",display:"flex",alignItems:"center",gap:8}}>
   <span style={{fontSize:18}}>🚨</span>
   <div style={{flex:1}}>
    <span style={{fontWeight:700,fontSize:11,color:C.r}}>{atRiskClients.length} client{atRiskClients.length>1?"s":""} à risque de churn</span>
    <span style={{fontSize:10,color:C.td,marginLeft:4}}>{atRiskClients.slice(0,3).map(c=>c.name).join(", ")}</span>
   </div>
  </div>}
  {/* Client search */}
  <div style={{marginBottom:12}}>
   <input value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="🔍 Rechercher un client..." style={{width:"100%",padding:"8px 14px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:12,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/>
  </div>
  {/* Pipeline summary cards */}
  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
   {Object.entries(simplifiedPipeline).map(([cat,data])=><div key={cat} className="glass-card-static" style={{padding:16,textAlign:"center",borderTop:`3px solid ${data.color}`}}>
    <div style={{fontSize:16,marginBottom:4}}>{data.icon}</div>
    <div style={{fontWeight:800,fontSize:11,color:data.color,marginBottom:2}}>{cat}</div>
    <div style={{fontWeight:900,fontSize:22,color:data.color,lineHeight:1}}>{fmt(data.value)}€</div>
    <div style={{fontSize:8,color:C.td,marginTop:4}}>{data.valueSub}</div>
    <div style={{fontSize:9,color:C.td,marginTop:2}}>{data.opps.length} opportunité{data.opps.length>1?"s":""}</div>
   </div>)}
  </div>
  <div style={{display:"flex",gap:12}}>
   <div style={{flex:1,minWidth:0}}>
    <ClientsPanelSafe soc={soc} clients={clients} saveClients={saveClients} ghlData={ghlData} socBankData={socBankData} invoices={invoices} saveInvoices={saveInvoices} stripeData={stripeData} onSelectClient={setSelClient}/>
   </div>
   {selClient&&<div className="si" style={{width:340,maxWidth:"95vw",flexShrink:0,background:"var(--sc-card-a6)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid var(--sc-w08)",borderRadius:16,padding:16,maxHeight:"80vh",overflowY:"auto",position:"sticky",top:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
     <div style={{fontWeight:800,fontSize:14,color:C.t}}>{selClient.name||"Client"}</div>
     <button onClick={()=>setSelClient(null)} aria-label="Fermer" style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:14}}>✕</button>
    </div>
    {(()=>{const ps=clientStage(selClient);return ps?<div style={{padding:"6px 10px",borderRadius:8,background:C.accD,border:`1px solid ${C.acc}33`,marginBottom:10}}>
     <div style={{fontSize:9,color:C.td,fontWeight:600}}>Pipeline</div>
     <div style={{fontWeight:700,fontSize:12,color:C.acc}}>{ps.stage} {ps.status==="won"?"✅":ps.status==="lost"?"❌":""}</div>
     {ps.value>0&&<div style={{fontSize:10,color:C.t}}>{fmt(ps.value)}€</div>}
    </div>:null;})()}
    <div style={{padding:"6px 10px",borderRadius:8,background:C.card2,marginBottom:10}}>
     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
       <div style={{fontSize:9,color:C.td,fontWeight:600}}>Status</div>
       <div style={{fontWeight:600,fontSize:11,color:(CLIENT_STATUS[selClient.status]||{}).c||C.td}}>{(CLIENT_STATUS[selClient.status]||{}).l||selClient.status}</div>
      </div>
      <HealthBadge score={calcClientHealth(selClient)}/>
     </div>
     {selClient.billing&&<div style={{fontSize:10,color:C.t,marginTop:2}}>{fmt(clientMonthlyRevenue(selClient))}€/mois</div>}
    </div>
    <div style={{fontSize:10,fontWeight:800,color:C.v,marginBottom:6,fontFamily:FONT_TITLE}}>💬 CONVERSATIONS</div>
    {convoLoading&&<div style={{color:C.td,fontSize:10,padding:8}}>Chargement...</div>}
    {!convoLoading&&convoMsgs.length===0&&<div style={{color:C.td,fontSize:10,padding:8}}>Aucune conversation</div>}
    <div style={{maxHeight:250,overflowY:"auto",marginBottom:8}}>
     {convoMsgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.direction==="outbound"?"flex-end":"flex-start",marginBottom:4}}>
      <div style={{maxWidth:"85%",padding:"6px 10px",borderRadius:10,background:m.direction==="outbound"?"linear-gradient(135deg,#FFBF00,#FF9D00)":"var(--sc-w06)",color:m.direction==="outbound"?"#0a0a0f":C.t,fontSize:10}}>
       <div>{m.body||m.text||"—"}</div>
       <div style={{fontSize:7,color:m.direction==="outbound"?"rgba(0,0,0,.5)":C.tm,marginTop:1}}>{m.dateAdded?ago(m.dateAdded):""}</div>
      </div>
     </div>)}
    </div>
    <div style={{display:"flex",gap:4}}>
     <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMsg();}} placeholder="Message..." style={{flex:1,padding:"6px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT,outline:"none"}}/>
    </div>
    {/* Message templates */}
    <div style={{display:"flex",gap:3,marginTop:4,flexWrap:"wrap"}}>
     {msgTemplates.map((t,i)=><button key={i} onClick={()=>setMsgInput(t.text.replace(/\{\{name\}\}/g,selClient.name||"").replace(/\{\{amount\}\}/g,selClient.billing?String(clientMonthlyRevenue(selClient)):""))} style={{padding:"2px 6px",borderRadius:6,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,fontSize:7,fontWeight:600,cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap"}}>{t.icon} {t.label}</button>)}
     <Btn small onClick={sendMsg}>→</Btn>
    </div>
   </div>}
  </div>
 </div>;
}

/* ===== CLIENT HEALTH SCORE ===== */
/* ===== CLIENT HEALTH SCORE ===== */
export function calcClientHealthScore(cl,socBankData,ghlData,soc){
 let score=0;
 // Payments on time (+40)
 if(cl.status==="active"&&cl.billing){
  const cn=(cl.name||"").toLowerCase().trim();const txs=socBankData?.transactions||[];const now45=Date.now()-45*864e5;
  const hasRecent=txs.some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;const txDate=new Date(tx.created_at||tx.date||0).getTime();return txDate>now45&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});
  if(hasRecent)score+=40;
 }
 // Regular calls (+30)
 const evts=ghlData?.[soc.id]?.calendarEvents||[];const cn2=(cl.name||"").toLowerCase();
 const callCount=evts.filter(e=>(e.contactName||e.title||"").toLowerCase().includes(cn2)).length;
 if(callCount>=3)score+=30;else if(callCount>=1)score+=15;
 // Contract active (+20)
 if(cl.status==="active")score+=20;
 // Recent interaction (+10)
 const ghlCl=ghlData?.[soc.id]?.ghlClients||[];const match=ghlCl.find(gc=>(gc.name||"").toLowerCase()===cn2||(gc.ghlId||gc.id)===(cl.ghlId));
 if(match){const lastAct=new Date(match.at||match.dateAdded||0);if(Date.now()-lastAct.getTime()<30*864e5)score+=10;}
 return clamp(score,0,100);
}
export function HealthBadge({score}){
 const color=score>70?C.g:score>=40?C.o:C.r;
 const label=score>70?"Sain":score>=40?"À suivre":"Critique";
 return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:12,background:color+"18",border:`1.5px solid ${color}55`,flexShrink:0}}>
  <span style={{width:8,height:8,borderRadius:4,background:color,boxShadow:`0 0 4px ${color}66`}}/>
  <span style={{fontSize:9,fontWeight:800,color}}>{score}</span>
  <span style={{fontSize:7,color,fontWeight:600}}>{label}</span>
 </span>;
}

/* ===== SALES PANEL ===== */
/* ===== SALES PANEL ===== */
export function SalesPanel({soc,ghlData,socBankData,clients,reps,setPTab}){
 const[salesCat,setSalesCat]=useState("overview");
 const cm=curM();const pm2=prevM(cm);
 const gd=ghlData?.[soc.id];const calEvts=gd?.calendarEvents||[];const opps=gd?.opportunities||[];const ghlCl=gd?.ghlClients||[];
 const bankData=socBankData;const myClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active");
 const excluded=EXCLUDED_ACCOUNTS[soc.id]||[];
 // Generate 12 months of data
 const now12=new Date();const months12=[];for(let i=11;i>=0;i--){const d=new Date(now12.getFullYear(),now12.getMonth()-i,1);months12.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}
 const getSalesMonth=(mo)=>{
  let metaD=null;try{metaD=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${mo}`));}catch{}
  const spend=metaD?.spend||0;const leads=metaD?.leads||0;
  const moEvts=calEvts.filter(e=>(e.startTime||"").startsWith(mo));
  const stratCalls=moEvts.filter(e=>!/int[eé]g/i.test(e.title||"")&&!/int[eé]g/i.test(e.calendarName||"")).length;
  const integCalls=moEvts.filter(e=>/int[eé]g/i.test(e.title||"")||/int[eé]g/i.test(e.calendarName||"")).length;
  const noShowManual=parseInt(localStorage.getItem(`salesNoShow_${soc.id}_${mo}`)||"0");
  const noShowCal=moEvts.filter(e=>{const st=(e.status||"").toLowerCase();return st.includes("no_show")||st.includes("no-show")||st.includes("cancelled");}).length;
  const noShow=noShowManual||noShowCal;
  const wonMonth=opps.filter(o=>o.status==="won"&&(o.updatedAt||o.createdAt||"").startsWith(mo));
  const wonCount=wonMonth.length;const wonVal=wonMonth.reduce((a,o)=>a+(o.value||0),0);
  const totalCalls=stratCalls+integCalls;
  return{mo,spend,leads,totalCalls,stratCalls,integCalls,noShow,wonCount,wonVal,cpl:leads>0?spend/leads:0,cpa:totalCalls>0?spend/totalCalls:0,cpv:wonCount>0?spend/wonCount:0};
 };
 const salesData=months12.map(getSalesMonth);const last6=salesData.slice(-6);
 const cur=salesData[salesData.length-1];
 // Totals
 const totalLeads=ghlCl.length;const totalCallsAll=calEvts.length;
 const stratCallsAll=calEvts.filter(e=>!/int[eé]g/i.test(e.title||"")&&!/int[eé]g/i.test(e.calendarName||"")).length;
 const confirmedCalls=calEvts.filter(e=>(e.status||"").toLowerCase().includes("confirmed")||(e.status||"").toLowerCase().includes("completed")).length;
 const noShowAll=calEvts.filter(e=>{const st=(e.status||"").toLowerCase();return st.includes("no_show")||st.includes("no-show");}).length;
 const wonAll=opps.filter(o=>o.status==="won");const wonValAll=wonAll.reduce((a,o)=>a+(o.value||0),0);
 const activeBillingTotal=myClients.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 const caContracte=wonValAll+activeBillingTotal;
 const closingRate=stratCallsAll>0?((wonAll.length/stratCallsAll)*100):0;
 const noShowRate=totalCallsAll>0?((noShowAll/totalCallsAll)*100):0;
 const panierMoyen=wonAll.length>0?caContracte/wonAll.length:0;
 // Avg cycle
 const cycleDays=(()=>{let total=0,cnt=0;wonAll.forEach(o=>{const cid=o.contact?.id;const cl=ghlCl.find(c=>c.ghlId===cid);const created=cl?.at||o.createdAt;const won2=o.updatedAt||o.createdAt;if(created&&won2){total+=Math.max(0,Math.round((new Date(won2)-new Date(created))/(864e5)));cnt++;}});return cnt>0?Math.round(total/cnt):0;})();
 // Meta ads spend for cross-ref
 const totalAdSpend=months12.reduce((a,mo)=>{try{const d=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${mo}`));return a+(d?.spend||0);}catch{return a;}},0);
 // Pipeline stages
 const pipelines=gd?.pipelines||[];const stages=pipelines[0]?.stages||[];
 const openOpps=opps.filter(o=>o.status==="open");
 // Charts
 const chartEvol=last6.map(d=>({month:ml(d.mo).split(" ")[0],leads:d.leads,appels:d.totalCalls,ventes:d.wonVal}));
 const chartAcq=last6.map(d=>({month:ml(d.mo).split(" ")[0],cpl:Math.round(d.cpl*100)/100,cpa:Math.round(d.cpa*100)/100,cpv:Math.round(d.cpv*100)/100}));
 const chartCalls=last6.map(d=>({month:ml(d.mo).split(" ")[0],appels:d.totalCalls,noshow:d.noShow}));
 // Pie
 const pieWon=opps.filter(o=>o.status==="won").length;const pieLost=opps.filter(o=>o.status==="lost").length;const pieOpen=opps.filter(o=>o.status==="open").length;
 const pieNoShow=noShowAll;const pieCancelled=calEvts.filter(e=>(e.status||"").toLowerCase()==="cancelled").length;
 const pieData=[{name:"Deal",value:pieWon,color:"#34d399"},{name:"No-show",value:pieNoShow,color:"#f472b6"},{name:"Follow-up",value:pieOpen,color:"#60a5fa"},{name:"Perdu",value:pieLost,color:"#fb923c"},{name:"Annulé",value:pieCancelled,color:"#6b7280"}].filter(d=>d.value>0);
 const pieTotal=pieData.reduce((a,d)=>a+d.value,0);
 // Sources
 const srcMap={};ghlCl.forEach(c=>{const src=c.source||"Inconnu";srcMap[src.trim()||"Inconnu"]=(srcMap[src.trim()||"Inconnu"]||0)+1;});
 const sources=Object.entries(srcMap).sort((a,b)=>b[1]-a[1]);
 const srcColors=["#60a5fa","#FFAA00","#34d399","#fb923c","#a78bfa","#f43f5e","#14b8a6","#ec4899"];
 // Funnel conversion rates by stage
 const funnelStages=stages.length>0?stages:["Lead","Qualifié","Appel","Négociation","Gagné"];
 const funnelCounts=funnelStages.map(st=>{if(st.toLowerCase().includes("gagn")||st.toLowerCase().includes("won"))return wonAll.length;return opps.filter(o=>o.stage===st&&o.status==="open").length+wonAll.filter(o=>o.stage===st).length;});
 // Closer performance
 const closerMap={};calEvts.forEach(e=>{const assignee=e.assignedTo||e.calendarName||"Closer";closerMap[assignee]=(closerMap[assignee]||0)+1;});
 const closers=Object.entries(closerMap).map(([name,calls])=>{const deals=wonAll.filter(o=>{const evts=calEvts.filter(e=>(e.assignedTo||e.calendarName||"")==name&&o.contact&&(e.contactName||"").toLowerCase().includes((o.contact.name||"").toLowerCase().slice(0,5)));return evts.length>0;}).length;const rev=wonAll.filter(o=>{const evts=calEvts.filter(e=>(e.assignedTo||e.calendarName||"")==name&&o.contact&&(e.contactName||"").toLowerCase().includes((o.contact.name||"").toLowerCase().slice(0,5)));return evts.length>0;}).reduce((a,o)=>a+(o.value||0),0);return{name:name.replace(/ - .*$/,"").trim(),calls,deals,convRate:calls>0?Math.round(deals/calls*100):0,revenue:rev};}).sort((a,b)=>b.revenue-a.revenue);
 // Recent activities
 const activities=useMemo(()=>{
  const all=[];
  wonAll.forEach(o=>all.push({icon:"🤝",text:`Deal conclu: ${o.name||o.contact?.name||"—"} — ${fmt(o.value||0)}€`,date:o.updatedAt||o.createdAt}));
  calEvts.slice(-30).forEach(e=>all.push({icon:"📞",text:`Appel: ${e.contactName||e.title||"—"}`,date:e.startTime}));
  ghlCl.filter(c=>new Date(c.at||0).getTime()>Date.now()-30*864e5).forEach(c=>all.push({icon:"👤",text:`Nouveau lead: ${c.name||c.email||"—"}`,date:c.at}));
  return all.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,20);
 },[wonAll,calEvts,ghlCl]);
 // Table averages
 const avgCpl=salesData.filter(d=>d.cpl>0).reduce((a,d)=>a+d.cpl,0)/(salesData.filter(d=>d.cpl>0).length||1);
 const avgCpa=salesData.filter(d=>d.cpa>0).reduce((a,d)=>a+d.cpa,0)/(salesData.filter(d=>d.cpa>0).length||1);
 const avgCpv=salesData.filter(d=>d.cpv>0).reduce((a,d)=>a+d.cpv,0)/(salesData.filter(d=>d.cpv>0).length||1);
 const costCellColor=(val,avg)=>!val||!avg?C.td:val<=avg*0.85?C.g:val>=avg*1.15?C.r:C.t;
 const kpis=[
  {label:"Total Leads",value:String(totalLeads),icon:"🎯",color:"#60a5fa"},
  {label:"Appels réservés",value:String(totalCallsAll),icon:"📅",color:"#818cf8"},
  {label:"Appels effectués",value:String(confirmedCalls||totalCallsAll),icon:"📞",color:C.b},
  {label:"No-show",value:String(noShowAll),icon:"🚫",color:C.r},
  {label:"Deals conclus",value:String(wonAll.length),icon:"🏆",color:C.g},
  {label:"CA Contracté",value:`${fmt(caContracte)}€`,icon:"💎",color:C.acc},
  {label:"Taux closing",value:`${closingRate.toFixed(1)}%`,icon:"📊",color:closingRate>30?C.g:closingRate>15?C.o:C.r},
  {label:"Taux no-show",value:`${noShowRate.toFixed(1)}%`,icon:"📉",color:noShowRate<15?C.g:noShowRate<30?C.o:C.r},
  {label:"Panier moyen",value:`${fmt(panierMoyen)}€`,icon:"🛒",color:C.v},
  {label:"Cycle moyen",value:cycleDays>0?`${cycleDays}j`:"—",icon:"⏱️",color:C.o},
 ];
 // Lost deals analysis
 const lostDeals=opps.filter(o=>o.status==="lost");
 const lostValue=lostDeals.reduce((a,o)=>a+(o.value||0),0);
 // Stagnant leads (no activity in 14 days)
 const stagnantLeads=ghlCl.filter(c=>{const lastActivity=c.at||c.dateAdded||c.lastActivity;if(!lastActivity)return true;return(Date.now()-new Date(lastActivity).getTime())>14*864e5;});
 // Closing prediction — average days to close per lead
 const avgCloseTime=cycleDays||21;
 const predictedClosings=openOpps.filter(o=>{const created=new Date(o.createdAt||0);const daysSince=Math.round((Date.now()-created)/864e5);return daysSince>=avgCloseTime*0.7;}).length;
 // Previous month comparison for sales KPIs
 const prevMonthSales=salesData[salesData.length-2];
 const curMonthSales=salesData[salesData.length-1];
 const salesTrend=(cur2,prev2)=>prev2>0?Math.round((cur2-prev2)/prev2*100):null;
 const SALES_CATS=[{id:"overview",label:"Vue d'ensemble",icon:"📊"},{id:"pipeline",label:"Pipeline",icon:"🎯"},{id:"charts",label:"Graphiques",icon:"📈"},{id:"performance",label:"Performance",icon:"🏅"},{id:"insights",label:"Insights",icon:"💡"},{id:"data",label:"Données",icon:"📋"}];
 return <div className="fu">
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
   <div><div style={{fontSize:9,fontWeight:700,color:C.acc,letterSpacing:1.5,fontFamily:FONT_TITLE}}>📞 SALES — {soc.nom}</div><div style={{fontSize:11,color:C.td,marginTop:2}}>Données GHL × Meta × Revolut</div></div>
   <select value={salesCat} onChange={e=>setSalesCat(e.target.value)} style={{padding:"8px 14px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.card,color:C.t,fontSize:12,fontWeight:600,fontFamily:FONT,cursor:"pointer",outline:"none",minWidth:160}}>
    {SALES_CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
   </select>
  </div>
  {/* KPIs - always visible */}
  <div className="kpi-grid-responsive" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}}>
   {kpis.map((k,i)=><div key={i} className="fade-up glass-card-static" style={{padding:"10px 6px",textAlign:"center",animationDelay:`${i*0.03}s`}}>
    <div style={{fontSize:14,marginBottom:2}}>{k.icon}</div>
    <div style={{fontWeight:900,fontSize:16,color:k.color,lineHeight:1.1}}>{k.value}</div>
    <div style={{fontSize:7,fontWeight:700,color:C.td,marginTop:4,letterSpacing:.3,fontFamily:FONT_TITLE}}>{k.label}</div>
   </div>)}
  </div>
  {/* Pipeline Kanban */}
  {(salesCat==="overview"||salesCat==="pipeline")&&stages.length>0&&<div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.2s",overflow:"auto"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📊 PIPELINE KANBAN</div>
   <div style={{display:"flex",gap:10,minWidth:stages.length*180}}>
    {stages.map((stage,si)=>{const stageOpps=openOpps.filter(o=>o.stage===stage);const stageVal=stageOpps.reduce((a,o)=>a+(o.value||0),0);
     return <div key={si} style={{flex:1,minWidth:160}}>
      <div style={{padding:"8px 10px",borderRadius:"10px 10px 0 0",background:GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]+"22",borderBottom:`2px solid ${GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}`}}>
       <div style={{fontWeight:800,fontSize:11,color:GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}}>{stage}</div>
       <div style={{fontSize:9,color:C.td}}>{stageOpps.length} deals · {fmt(stageVal)}€</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4,padding:"6px 0",maxHeight:300,overflowY:"auto"}}>
       {stageOpps.slice(0,8).map(o=><div key={o.id} style={{padding:"8px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`}}>
        <div style={{fontWeight:600,fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name||o.contact?.name||"—"}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:3}}>
         <span style={{fontSize:9,color:C.td}}>{o.createdAt?new Date(o.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}):""}</span>
         <span style={{fontWeight:800,fontSize:10,color:C.acc}}>{o.value>0?`${fmt(o.value)}€`:""}</span>
        </div>
       </div>)}
       {stageOpps.length>8&&<div style={{textAlign:"center",fontSize:9,color:C.td,padding:4}}>+{stageOpps.length-8} autres</div>}
      </div>
     </div>;
    })}
   </div>
  </div>}
  {/* Charts */}
  {(salesCat==="overview"||salesCat==="charts")&&<div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginBottom:20}}>
   {/* Evolution leads/appels/ventes */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.25s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📈 LEADS / APPELS / VENTES — 6 MOIS</div>
    <div style={{height:220}}><ResponsiveContainer><ComposedChart data={chartEvol} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis yAxisId="left" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis yAxisId="right" orientation="right" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/>
     <Tooltip content={<CTip/>}/>
     <Bar yAxisId="left" dataKey="leads" fill="#60a5fa" name="Leads" radius={[4,4,0,0]} barSize={14}/>
     <Bar yAxisId="left" dataKey="appels" fill="#818cf8" name="Appels" radius={[4,4,0,0]} barSize={14}/>
     <Line yAxisId="right" type="monotone" dataKey="ventes" stroke={C.g} strokeWidth={2.5} dot={{r:3}} name="CA Ventes (€)"/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </ComposedChart></ResponsiveContainer></div>
   </div>
   {/* Coûts d'acquisition */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.3s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📉 COÛTS D'ACQUISITION</div>
    <div style={{height:220}}><ResponsiveContainer><LineChart data={chartAcq} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}€`}/>
     <Tooltip content={<CTip/>}/>
     <Line type="monotone" dataKey="cpl" stroke="#60a5fa" strokeWidth={2.5} dot={{r:4}} name="CPL"/>
     <Line type="monotone" dataKey="cpa" stroke="#22d3ee" strokeWidth={2.5} dot={{r:4}} name="Coût/appel"/>
     <Line type="monotone" dataKey="cpv" stroke="#eab308" strokeWidth={2.5} dot={{r:4}} name="Coût/closing"/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </LineChart></ResponsiveContainer></div>
   </div>
   {/* Appels vs No-show */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.35s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 APPELS VS NO-SHOW</div>
    <div style={{height:220}}><ResponsiveContainer><BarChart data={chartCalls} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} allowDecimals={false}/>
     <Tooltip content={<CTip/>}/>
     <Bar dataKey="appels" fill="#60a5fa" name="Appels" radius={[4,4,0,0]} barSize={20}/>
     <Bar dataKey="noshow" fill="#f472b6" name="No-show" radius={[4,4,0,0]} barSize={20}/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </BarChart></ResponsiveContainer></div>
   </div>
   {/* Résultats appels Pie */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.4s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>🍩 RÉSULTATS DES APPELS</div>
    {pieData.length>0?<div style={{display:"flex",alignItems:"center",height:220}}>
     <div style={{width:"55%",height:200}}><ResponsiveContainer><PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} strokeWidth={0} animationDuration={1000}>{pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
     <div style={{flex:1,paddingLeft:8}}>{pieData.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><span style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0}}/><span style={{fontSize:10,color:C.td}}>{d.name}</span><span style={{fontWeight:700,fontSize:10,color:C.t,marginLeft:"auto"}}>{d.value} ({pieTotal>0?Math.round(d.value/pieTotal*100):0}%)</span></div>)}</div>
    </div>:<div style={{textAlign:"center",padding:40,color:C.td,fontSize:11}}>Pas de données</div>}
   </div>
   {/* Sources des leads */}
   {sources.length>0&&<div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.45s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 SOURCES DES LEADS</div>
    <div style={{height:220}}><ResponsiveContainer><BarChart data={sources.slice(0,8).map(([s,c])=>({source:s,count:c}))} layout="vertical" margin={{top:5,right:10,left:60,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis type="number" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} allowDecimals={false}/>
     <YAxis type="category" dataKey="source" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} width={55}/>
     <Tooltip content={<CTip/>}/>
     <Bar dataKey="count" name="Leads" radius={[0,4,4,0]} barSize={16}>{sources.slice(0,8).map((_,i)=><Cell key={i} fill={srcColors[i%srcColors.length]}/>)}</Bar>
    </BarChart></ResponsiveContainer></div>
   </div>}
   {/* Funnel conversion par étape */}
   {funnelStages.length>0&&<div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.5s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📈 CONVERSION PAR ÉTAPE</div>
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
     {funnelStages.map((st,i)=>{const count=i<funnelCounts.length?funnelCounts[i]:0;const maxC=Math.max(1,...funnelCounts);const w=Math.max(20,Math.round(count/maxC*100));const conv=i>0&&funnelCounts[i-1]>0?Math.round(count/funnelCounts[i-1]*100):null;
      return <Fragment key={i}>
       {i>0&&conv!==null&&<div style={{fontSize:9,color:C.td,fontWeight:700,textAlign:"center",padding:"2px 0"}}>↓ <span style={{color:conv>=50?C.g:conv>=25?C.o:C.r,fontWeight:800}}>{conv}%</span></div>}
       <div style={{width:`${w}%`,margin:"0 auto",background:`linear-gradient(135deg,${GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]}18,${GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]}30)`,border:`1px solid ${GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]}55`,borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
        <span style={{fontWeight:900,fontSize:16,color:GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]}}>{count}</span>
        <span style={{fontSize:10,color:C.td,fontWeight:600,marginLeft:6}}>{st}</span>
       </div>
      </Fragment>;
     })}
    </div>
   </div>}
  </div>}
  {/* Performance Closer */}
  {(salesCat==="overview"||salesCat==="performance")&&closers.length>0&&<div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.55s"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>🏅 PERFORMANCE CLOSER{closers.length>1?"S":""}</div>
   {closers.length>1?<table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
    <thead><tr style={{borderBottom:`2px solid ${C.brd}`}}>
     {["Closer","Appels","Deals","Taux conv.","CA généré"].map((h,i)=><th key={i} style={{padding:"6px",textAlign:i===0?"left":"right",color:C.td,fontWeight:700,fontSize:8,fontFamily:FONT_TITLE}}>{h}</th>)}
    </tr></thead>
    <tbody>{closers.map((cl2,i)=><tr key={i} style={{borderBottom:`1px solid ${C.brd}`}}>
     <td style={{padding:"6px",fontWeight:700,color:i===0?C.acc:C.t}}>{i===0?"🥇 ":i===1?"🥈 ":i===2?"🥉 ":""}{cl2.name}</td>
     <td style={{padding:"6px",textAlign:"right"}}>{cl2.calls}</td>
     <td style={{padding:"6px",textAlign:"right",color:C.g,fontWeight:700}}>{cl2.deals}</td>
     <td style={{padding:"6px",textAlign:"right",color:cl2.convRate>30?C.g:cl2.convRate>15?C.o:C.r,fontWeight:700}}>{cl2.convRate}%</td>
     <td style={{padding:"6px",textAlign:"right",fontWeight:800,color:C.acc}}>{fmt(cl2.revenue)}€</td>
    </tr>)}</tbody>
   </table>:<div className="rg4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
    {[{l:"Appels ce mois",v:String(cur.totalCalls),c:C.b},{l:"Deals conclus",v:String(cur.wonCount),c:C.g},{l:"Taux conversion",v:`${cur.stratCalls>0?Math.round(cur.wonCount/cur.stratCalls*100):0}%`,c:C.v},{l:"CA généré",v:`${fmt(cur.wonVal)}€`,c:C.acc}].map((s,i)=>
     <div key={i} style={{textAlign:"center",padding:12,background:s.c+"10",borderRadius:10,border:`1px solid ${s.c}22`}}>
      <div style={{fontWeight:900,fontSize:20,color:s.c}}>{s.v}</div>
      <div style={{fontSize:8,color:C.td,fontWeight:700,marginTop:4,fontFamily:FONT_TITLE}}>{s.l}</div>
     </div>
    )}
   </div>}
  </div>}
  {/* Dernières activités */}
  {(salesCat==="overview"||salesCat==="performance")&&<div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.6s"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📜 DERNIÈRES ACTIVITÉS SALES</div>
   {activities.length===0?<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucune activité récente</div>:
    activities.map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<activities.length-1?`1px solid ${C.brd}`:"none"}}>
     <span style={{fontSize:14}}>{a.icon}</span>
     <div style={{flex:1,fontSize:11,fontWeight:600,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.text}</div>
     <span style={{fontSize:9,color:C.td,flexShrink:0}}>{a.date?ago(a.date):""}</span>
    </div>)
   }
  </div>}
  {/* ===== INSIGHTS TAB ===== */}
  {(salesCat==="overview"||salesCat==="insights")&&<div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginBottom:20}}>
   {/* Stagnant leads alert */}
   {stagnantLeads.length>0&&<div className="fade-up glass-card-static" style={{padding:16,borderLeft:`3px solid ${C.o}`}}>
    <div style={{fontSize:9,fontWeight:700,color:C.o,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>⚠️ LEADS STAGNANTS ({stagnantLeads.length})</div>
    <div style={{fontSize:11,color:C.td,marginBottom:8}}>{stagnantLeads.length} lead{stagnantLeads.length>1?"s":""} sans activité depuis 14+ jours</div>
    {stagnantLeads.slice(0,5).map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:"var(--sc-card-a6)",borderRadius:8,marginBottom:3}}>
     <span style={{fontSize:12}}>👤</span>
     <div style={{flex:1,fontSize:11,fontWeight:600,color:C.t}}>{c.name||c.email||"—"}</div>
     <span style={{fontSize:9,color:C.o}}>Inactif depuis {Math.round((Date.now()-new Date(c.at||c.dateAdded||0))/864e5)}j</span>
    </div>)}
    {stagnantLeads.length>5&&<div style={{fontSize:9,color:C.td,textAlign:"center",marginTop:4}}>… et {stagnantLeads.length-5} autres</div>}
   </div>}
   {/* Lost deals analysis */}
   {lostDeals.length>0&&<div className="fade-up glass-card-static" style={{padding:16,borderLeft:`3px solid ${C.r}`}}>
    <div style={{fontSize:9,fontWeight:700,color:C.r,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>❌ DEALS PERDUS — ANALYSE</div>
    <div style={{display:"flex",gap:16,marginBottom:10}}>
     <div><div style={{fontSize:8,color:C.td}}>Deals perdus</div><div style={{fontWeight:900,fontSize:18,color:C.r}}>{lostDeals.length}</div></div>
     <div><div style={{fontSize:8,color:C.td}}>Valeur perdue</div><div style={{fontWeight:900,fontSize:18,color:C.r}}>{fmt(lostValue)}€</div></div>
     <div><div style={{fontSize:8,color:C.td}}>Taux de perte</div><div style={{fontWeight:900,fontSize:18,color:C.o}}>{opps.length>0?Math.round(lostDeals.length/opps.length*100):0}%</div></div>
    </div>
    {lostDeals.slice(0,5).map((o,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:"rgba(248,113,113,.05)",borderRadius:8,border:`1px solid ${C.r}15`,marginBottom:3}}>
     <span style={{fontSize:11}}>❌</span>
     <div style={{flex:1,fontSize:11,fontWeight:600,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name||o.contact?.name||"—"}</div>
     <span style={{fontWeight:700,fontSize:10,color:C.r}}>{o.value>0?`${fmt(o.value)}€`:""}</span>
     <span style={{fontSize:9,color:C.td}}>{o.updatedAt?ago(o.updatedAt):""}</span>
    </div>)}
   </div>}
   {/* Closing prediction */}
   <div className="fade-up glass-card-static" style={{padding:16,borderLeft:`3px solid ${C.g}`}}>
    <div style={{fontSize:9,fontWeight:700,color:C.g,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>🔮 PRÉDICTION DE CLOSING</div>
    <div style={{display:"flex",gap:16,marginBottom:8}}>
     <div><div style={{fontSize:8,color:C.td}}>Cycle moyen</div><div style={{fontWeight:900,fontSize:18,color:C.o}}>{avgCloseTime>0?`${avgCloseTime}j`:"—"}</div></div>
     <div><div style={{fontSize:8,color:C.td}}>Proches du closing</div><div style={{fontWeight:900,fontSize:18,color:C.g}}>{predictedClosings}</div></div>
     <div><div style={{fontSize:8,color:C.td}}>Valeur estimée</div><div style={{fontWeight:900,fontSize:18,color:C.acc}}>{fmt(openOpps.filter(o=>{const d=Math.round((Date.now()-new Date(o.createdAt||0))/864e5);return d>=avgCloseTime*0.7;}).reduce((a,o)=>a+(o.value||0),0))}€</div></div>
    </div>
    <div style={{fontSize:10,color:C.td}}>Basé sur le cycle de vente moyen de {avgCloseTime} jours, {predictedClosings} opportunité{predictedClosings>1?"s":""} devrai{predictedClosings>1?"en":""}t closer prochainement.</div>
   </div>
   {/* Monthly trends vs previous */}
   {prevMonthSales&&<div className="fade-up glass-card-static" style={{padding:16,borderLeft:`3px solid ${C.b}`}}>
    <div style={{fontSize:9,fontWeight:700,color:C.b,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>📊 TENDANCES VS MOIS PRÉCÉDENT</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8}}>
     {[{l:"Leads",c:curMonthSales.leads,p:prevMonthSales.leads},{l:"Appels",c:curMonthSales.totalCalls,p:prevMonthSales.totalCalls},{l:"Deals",c:curMonthSales.wonCount,p:prevMonthSales.wonCount},{l:"CA Ventes",c:curMonthSales.wonVal,p:prevMonthSales.wonVal,isCurrency:true}].map((m,i)=>{
      const trend=salesTrend(m.c,m.p);const isUp=trend!==null&&trend>0;
      return <div key={i} style={{padding:10,background:"var(--sc-card-a6)",borderRadius:10,border:`1px solid ${C.brd}`}}>
       <div style={{fontSize:8,color:C.td,fontWeight:600,marginBottom:4}}>{m.l}</div>
       <div style={{display:"flex",alignItems:"flex-end",gap:4}}>
        <span style={{fontWeight:900,fontSize:16,color:C.t}}>{m.isCurrency?`${fmt(m.c)}€`:m.c}</span>
        {trend!==null&&trend!==0&&<span style={{fontSize:9,fontWeight:800,color:isUp?C.g:C.r}}>{isUp?"↑":"↓"}{Math.abs(trend)}%</span>}
       </div>
       <div style={{fontSize:8,color:C.td}}>vs {m.isCurrency?`${fmt(m.p)}€`:m.p} mois dernier</div>
      </div>;
     })}
    </div>
   </div>}
  </div>}
  {/* Cross-referencing */}
  {(salesCat==="overview"||salesCat==="data")&&totalAdSpend>0&&<div className="fade-up glass-card-static" style={{padding:16,marginBottom:20,animationDelay:"0.65s",borderLeft:`3px solid ${C.v}`}}>
   <div style={{fontSize:9,fontWeight:700,color:C.v,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>🔗 CROISEMENT DONNÉES</div>
   <div style={{fontSize:11,color:C.t,fontWeight:600}}>Budget pub: {fmt(totalAdSpend)}€ → {totalLeads} leads → {totalCallsAll} appels → {wonAll.length} clients = CPL {totalLeads>0?(totalAdSpend/totalLeads).toFixed(2):"-"}€, CPA {wonAll.length>0?(totalAdSpend/wonAll.length).toFixed(2):"-"}€</div>
  </div>}
  {/* Data Table */}
  {(salesCat==="overview"||salesCat==="data")&&<div className="fade-up glass-card-static" style={{padding:18,overflow:"auto",animationDelay:"0.7s"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📋 TABLEAU RÉCAPITULATIF — 12 MOIS</div>
   <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,minWidth:900}}>
    <thead><tr style={{borderBottom:`2px solid ${C.brd}`}}>
     {["Mois","Leads","Appels","No-show","Tx NS","Deals","CA","Panier moy","CPL","Coût/appel","Coût/closing","Tx closing"].map((h,i)=>
      <th key={i} style={{padding:"8px 4px",textAlign:i===0?"left":"right",color:C.td,fontWeight:700,fontSize:7,letterSpacing:.5,fontFamily:FONT_TITLE}}>{h}</th>
     )}
    </tr></thead>
    <tbody>
     {salesData.map((d,i)=>{const nsRate=d.totalCalls>0?Math.round(d.noShow/d.totalCalls*100):0;const clRate=d.stratCalls>0?Math.round(d.wonCount/d.stratCalls*100):0;const pm2=d.wonCount>0?Math.round(d.wonVal/d.wonCount):0;
      return <tr key={d.mo} style={{borderBottom:`1px solid ${C.brd}`,background:i%2===0?"transparent":"var(--sc-w015)"}}>
       <td style={{padding:"6px 4px",fontWeight:700,color:C.t,fontSize:10}}>{ml(d.mo)}</td>
       <td style={{padding:"6px 4px",textAlign:"right",fontWeight:600}}>{d.leads||"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",fontWeight:600}}>{d.totalCalls||"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:d.noShow>0?C.r:C.td,fontWeight:600}}>{d.noShow||"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:nsRate>20?C.r:nsRate>10?C.o:C.g,fontWeight:600}}>{nsRate>0?`${nsRate}%`:"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:C.g,fontWeight:700}}>{d.wonCount||"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:C.g,fontWeight:700}}>{d.wonVal>0?`${fmt(d.wonVal)}€`:"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",fontWeight:600}}>{pm2>0?`${fmt(pm2)}€`:"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:costCellColor(d.cpl,avgCpl),fontWeight:600}}>{d.cpl>0?`${d.cpl.toFixed(0)}€`:"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:costCellColor(d.cpa,avgCpa),fontWeight:600}}>{d.cpa>0?`${d.cpa.toFixed(0)}€`:"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:costCellColor(d.cpv,avgCpv),fontWeight:600}}>{d.cpv>0?`${d.cpv.toFixed(0)}€`:"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:clRate>30?C.g:clRate>15?C.o:C.r,fontWeight:700}}>{clRate>0?`${clRate}%`:"—"}</td>
      </tr>;
     })}
     <tr style={{borderTop:`2px solid ${C.acc}`,fontWeight:800}}>
      <td style={{padding:"8px 4px",color:C.acc}}>TOTAL</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{salesData.reduce((a,d)=>a+d.leads,0)}</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{salesData.reduce((a,d)=>a+d.totalCalls,0)}</td>
      <td style={{padding:"8px 4px",textAlign:"right",color:C.r}}>{salesData.reduce((a,d)=>a+d.noShow,0)}</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>—</td>
      <td style={{padding:"8px 4px",textAlign:"right",color:C.g}}>{salesData.reduce((a,d)=>a+d.wonCount,0)}</td>
      <td style={{padding:"8px 4px",textAlign:"right",color:C.g}}>{fmt(salesData.reduce((a,d)=>a+d.wonVal,0))}€</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{fmt(panierMoyen)}€</td>
      <td colSpan={4} style={{padding:"8px 4px",textAlign:"center",color:C.td,fontSize:9}}>Moyennes</td>
     </tr>
    </tbody>
   </table>
  </div>}
 </div>;
}

/* ===== PUBLICITE PANEL ===== */
/* ===== PUBLICITE PANEL ===== */
export function PublicitePanel({soc,ghlData,socBankData,clients,reps,setPTab}){
 const cm=curM();
 const gd=ghlData?.[soc.id];const opps=gd?.opportunities||[];const calEvts=gd?.calendarEvents||[];const ghlCl=gd?.ghlClients||[];
 const myClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active");
 const wonAll=opps.filter(o=>o.status==="won");
 const[budgetSim,setBudgetSim]=useState(1000);
 // 12 months of meta ads data
 const now12=new Date();const months12=[];for(let i=11;i>=0;i--){const d=new Date(now12.getFullYear(),now12.getMonth()-i,1);months12.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}
 const getMetaMonth=(mo)=>{
  let raw=null;try{raw=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${mo}`));}catch{}
  // Persist to Supabase if not already
  if(raw&&!raw._synced){try{sSet(`metaAds_${soc.id}_${mo}`,raw);raw._synced=true;}catch{}}
  const spend=raw?.spend||0,imp=raw?.impressions||0,clk=raw?.clicks||0,lds=raw?.leads||0,rev=raw?.revenue||0;
  const moWon=opps.filter(o=>o.status==="won"&&(o.updatedAt||o.createdAt||"").startsWith(mo));
  const wonVal=moWon.reduce((a,o)=>a+(o.value||0),0);const wonCount=moWon.length;
  return{mo,spend,impressions:imp,clicks:clk,leads:lds,revenue:rev||wonVal,
   cpl:lds>0?spend/lds:0,cpc:clk>0?spend/clk:0,cpm:imp>0?(spend/imp)*1000:0,
   ctr:imp>0?(clk/imp)*100:0,roas:spend>0?(rev||wonVal)/spend:0,
   cpa:wonCount>0?spend/wonCount:0,wonCount,wonVal};
 };
 const metaData=months12.map(getMetaMonth);const last6=metaData.slice(-6);
 // Totals
 const totSpend=metaData.reduce((a,d)=>a+d.spend,0);const totImp=metaData.reduce((a,d)=>a+d.impressions,0);
 const totClk=metaData.reduce((a,d)=>a+d.clicks,0);const totLeads=metaData.reduce((a,d)=>a+d.leads,0);
 const totRev=metaData.reduce((a,d)=>a+d.revenue,0);
 const totCtr=totImp>0?(totClk/totImp)*100:0;const totCpm=totImp>0?(totSpend/totImp)*1000:0;
 const totCpc=totClk>0?totSpend/totClk:0;const totCpl=totLeads>0?totSpend/totLeads:0;
 const totRoas=totSpend>0?totRev/totSpend:0;
 const totWon=metaData.reduce((a,d)=>a+d.wonCount,0);const totCpa=totWon>0?totSpend/totWon:0;
 const hasData=metaData.some(d=>d.spend>0);
 // Benchmarks
 const[benchmarks]=useState(()=>{try{return JSON.parse(localStorage.getItem(`benchmarks_${soc.id}`)||'{"cpl":20,"cpc":1.5,"ctr":1.5}');}catch{return{cpl:20,cpc:1.5,ctr:1.5};}});
 // Funnel
 const stratCallsAll=calEvts.filter(e=>!/int[eé]g/i.test(e.title||"")&&!/int[eé]g/i.test(e.calendarName||"")).length;
 let landingVisitors=totClk;try{months12.forEach(mo=>{const lv=localStorage.getItem(`metaLanding_${soc.id}_${mo}`);if(lv)landingVisitors+=parseInt(lv)||0;});}catch{}
 const funnelSteps=[
  {label:"Impressions",count:totImp,color:"#60a5fa"},
  {label:"Clics",count:totClk,color:"#818cf8"},
  {label:"Landing page",count:landingVisitors||totClk,color:"#a78bfa"},
  {label:"Leads",count:totLeads,color:"#FFAA00"},
  {label:"MQL / Appels",count:stratCallsAll,color:"#fb923c"},
  {label:"Clients",count:wonAll.length,color:"#34d399"},
 ];
 const kpis=[
  {label:"Budget dépensé",value:`${fmt(totSpend)}€`,icon:"💰",color:"#f472b6"},
  {label:"Impressions",value:fK(totImp),icon:"👁️",color:"#60a5fa"},
  {label:"Clics",value:fK(totClk),icon:"👆",color:"#818cf8"},
  {label:"CTR",value:`${totCtr.toFixed(2)}%`,icon:"📊",color:totCtr>1.5?C.g:totCtr>0.8?C.o:C.r},
  {label:"CPM",value:`${totCpm.toFixed(2)}€`,icon:"📡",color:C.o},
  {label:"CPC",value:`${totCpc.toFixed(2)}€`,icon:"🖱️",color:totCpc<benchmarks.cpc?C.g:C.r},
  {label:"Leads",value:String(totLeads),icon:"🎯",color:"#fb923c"},
  {label:"CPL",value:`${totCpl.toFixed(2)}€`,icon:"💎",color:totCpl<benchmarks.cpl?C.g:C.r},
  {label:"ROAS",value:`${totRoas.toFixed(2)}x`,icon:"📈",color:totRoas>=2?C.g:totRoas>=1?C.o:C.r},
  {label:"CPA",value:totCpa>0?`${totCpa.toFixed(2)}€`:"—",icon:"🏆",color:C.v},
 ];
 // Charts
 const chartBudget=last6.map(d=>({month:ml(d.mo).split(" ")[0],budget:d.spend,leads:d.leads,revenue:d.revenue}));
 const chartCosts=last6.map(d=>({month:ml(d.mo).split(" ")[0],cpl:Math.round(d.cpl*100)/100,cpc:Math.round(d.cpc*100)/100,cpm:Math.round(d.cpm*100)/100}));
 const chartArea=last6.map(d=>({month:ml(d.mo).split(" ")[0],impressions:d.impressions,clics:d.clicks,leads:d.leads}));
 const chartRoas=last6.map(d=>({month:ml(d.mo).split(" ")[0],roas:Math.round(d.roas*100)/100,seuil:1}));
 const chartCtr=last6.map(d=>({month:ml(d.mo).split(" ")[0],ctr:Math.round(d.ctr*100)/100}));
 // Pie budget by month
 const pieMonths=last6.filter(d=>d.spend>0).map(d=>({name:ml(d.mo),value:Math.round(d.spend)}));
 const PIE_COLORS=["#f472b6","#60a5fa","#FFAA00","#34d399","#a78bfa","#fb923c"];
 // ROI calculator
 const roasDisplay=totRoas;
 const avgLeadsPerMonth=totLeads/(metaData.filter(d=>d.spend>0).length||1);
 const avgClientsPerMonth=totWon/(metaData.filter(d=>d.spend>0).length||1);
 const panierMoyenPub2=totWon>0?totRev/totWon:0;
 const breakEvenLeads=totCpl>0&&avgClientsPerMonth>0&&panierMoyenPub2>0?Math.ceil(totSpend/(panierMoyenPub2*avgClientsPerMonth/avgLeadsPerMonth)):0;
 if(!hasData)return <div className="fu" style={{padding:"40px 0",textAlign:"center"}}>
  <div style={{fontSize:48,marginBottom:12}}>📣</div>
  <div style={{fontWeight:800,fontSize:16,color:C.t,marginBottom:4}}>Publicité Meta</div>
  <div style={{fontSize:12,color:C.td,marginBottom:16}}>Aucune donnée publicitaire — Renseignez vos données Meta Ads dans les Paramètres</div>
  <button onClick={()=>setPTab(12)} style={{padding:"8px 20px",borderRadius:10,border:`1px solid ${C.acc}44`,background:C.accD,color:C.acc,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>⚙️ Aller aux Paramètres</button>
 </div>;
 return <div className="fu">
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
   <div><div style={{fontSize:9,fontWeight:700,color:C.acc,letterSpacing:1.5,fontFamily:FONT_TITLE}}>📣 PUBLICITÉ — {soc.nom}</div><div style={{fontSize:11,color:C.td,marginTop:2}}>Données Meta Ads × GHL</div></div>
   <button onClick={()=>setPTab(12)} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.acc}44`,background:C.accD,color:C.acc,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>✏️ Modifier les données</button>
  </div>
  {/* KPIs */}
  <div className="kpi-grid-responsive" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
   {kpis.map((k,i)=><div key={i} className="fade-up glass-card-static kpi-shimmer" style={{padding:16,textAlign:"center",animationDelay:`${i*0.05}s`,position:"relative",overflow:"hidden"}}>
    <div style={{fontSize:18,marginBottom:4}}>{k.icon}</div>
    <div style={{fontWeight:900,fontSize:18,color:k.color,lineHeight:1}}>{k.value}</div>
    <div style={{fontSize:8,fontWeight:700,color:C.td,marginTop:6,letterSpacing:.5,fontFamily:FONT_TITLE}}>{k.label}</div>
   </div>)}
  </div>
  {/* Charts 2-col */}
  <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginBottom:20}}>
   {/* Budget vs Leads vs Revenue */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.2s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📈 BUDGET VS LEADS VS REVENUE</div>
    <div style={{height:220}}><ResponsiveContainer><ComposedChart data={chartBudget} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis yAxisId="left" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/>
     <YAxis yAxisId="right" orientation="right" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <Tooltip content={<CTip/>}/>
     <Bar yAxisId="left" dataKey="budget" fill="#f472b6" name="Budget (€)" radius={[4,4,0,0]} barSize={16}/>
     <Bar yAxisId="right" dataKey="leads" fill="#fb923c" name="Leads" radius={[4,4,0,0]} barSize={16}/>
     <Line yAxisId="left" type="monotone" dataKey="revenue" stroke={C.g} strokeWidth={2.5} dot={{r:3}} name="Revenue (€)"/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </ComposedChart></ResponsiveContainer></div>
   </div>
   {/* Evolution CPL/CPC/CPM */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.25s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📉 ÉVOLUTION CPL / CPC / CPM</div>
    <div style={{height:220}}><ResponsiveContainer><LineChart data={chartCosts} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}€`}/>
     <Tooltip content={<CTip/>}/>
     <Line type="monotone" dataKey="cpl" stroke="#60a5fa" strokeWidth={2.5} dot={{r:4}} name="CPL"/>
     <Line type="monotone" dataKey="cpc" stroke="#22d3ee" strokeWidth={2.5} dot={{r:4}} name="CPC"/>
     <Line type="monotone" dataKey="cpm" stroke="#eab308" strokeWidth={2.5} dot={{r:4}} name="CPM"/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </LineChart></ResponsiveContainer></div>
   </div>
   {/* Impressions vs Clics vs Leads (Area) */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.3s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 IMPRESSIONS / CLICS / LEADS</div>
    <div style={{height:220}}><ResponsiveContainer><AreaChart data={chartArea} margin={{top:5,right:10,left:0,bottom:5}}>
     <defs>
      <linearGradient id="gImp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3}/><stop offset="100%" stopColor="#60a5fa" stopOpacity={0.02}/></linearGradient>
      <linearGradient id="gClk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity={0.3}/><stop offset="100%" stopColor="#818cf8" stopOpacity={0.02}/></linearGradient>
     </defs>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>fK(v)}/>
     <Tooltip content={<CTip/>}/>
     <Area type="monotone" dataKey="impressions" stroke="#60a5fa" fill="url(#gImp)" name="Impressions" stackId="1"/>
     <Area type="monotone" dataKey="clics" stroke="#818cf8" fill="url(#gClk)" name="Clics" stackId="2"/>
     <Area type="monotone" dataKey="leads" stroke="#FFAA00" fill="rgba(255,170,0,.1)" name="Leads" stackId="3"/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </AreaChart></ResponsiveContainer></div>
   </div>
   {/* Budget répartition Pie */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.35s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>🍩 RÉPARTITION BUDGET PAR MOIS</div>
    {pieMonths.length>0?<div style={{display:"flex",alignItems:"center",height:220}}>
     <div style={{width:"55%",height:200}}><ResponsiveContainer><PieChart><Pie data={pieMonths} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} strokeWidth={0} animationDuration={1000}>{pieMonths.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
     <div style={{flex:1,paddingLeft:8}}>{pieMonths.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><span style={{width:8,height:8,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0}}/><span style={{flex:1,fontSize:9,color:C.td}}>{d.name}</span><span style={{fontWeight:700,fontSize:9,color:C.t}}>{fmt(d.value)}€</span></div>)}</div>
    </div>:<div style={{textAlign:"center",padding:40,color:C.td,fontSize:11}}>Pas de données</div>}
   </div>
   {/* ROAS evolution */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.4s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📈 ÉVOLUTION ROAS</div>
    <div style={{height:220}}><ResponsiveContainer><LineChart data={chartRoas} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}x`}/>
     <Tooltip content={<CTip/>}/>
     <Line type="monotone" dataKey="seuil" stroke={C.r} strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Seuil (1x)"/>
     <Line type="monotone" dataKey="roas" stroke={C.g} strokeWidth={2.5} dot={{r:4}} name="ROAS"/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </LineChart></ResponsiveContainer></div>
   </div>
   {/* CTR evolution */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.45s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 ÉVOLUTION CTR</div>
    <div style={{height:220}}><ResponsiveContainer><BarChart data={chartCtr} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
     <Tooltip content={<CTip/>}/>
     <Bar dataKey="ctr" fill="#818cf8" name="CTR (%)" radius={[4,4,0,0]} barSize={24}/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </BarChart></ResponsiveContainer></div>
   </div>
  </div>
  {/* Funnel publicitaire */}
  <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.5s"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>🔄 FUNNEL PUBLICITAIRE</div>
   <div style={{display:"flex",flexDirection:"column",gap:0}}>
    {funnelSteps.map((f,i)=>{const maxCount=Math.max(1,...funnelSteps.map(s=>s.count));const w=Math.max(15,Math.round(f.count/maxCount*100));const conv=i>0&&funnelSteps[i-1].count>0?((f.count/funnelSteps[i-1].count)*100).toFixed(1):null;const costPer=totSpend>0&&f.count>0?(totSpend/f.count).toFixed(2):null;
     return <Fragment key={i}>
      {i>0&&conv&&<div style={{fontSize:9,color:C.td,fontWeight:700,textAlign:"center",padding:"3px 0"}}>↓ {conv}%{costPer&&<span style={{marginLeft:6,color:C.acc,fontSize:8}}>({costPer}€/unité)</span>}</div>}
      <div style={{width:`${w}%`,margin:"0 auto",background:`linear-gradient(135deg,${f.color}22,${f.color}11)`,border:`1px solid ${f.color}44`,borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
       <span style={{fontWeight:900,fontSize:20,color:f.color}}>{f.count>1000?fK(f.count):f.count}</span>
       <span style={{fontSize:10,color:C.td,fontWeight:600,marginLeft:8}}>{f.label}</span>
      </div>
     </Fragment>;
    })}
   </div>
  </div>
  {/* ROI Calculator + Benchmarks */}
  <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
   <div className="fade-up glass-card-static" style={{padding:22,animationDelay:"0.55s",borderLeft:`3px solid ${totRoas>=1?C.g:C.r}`}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>💰 ROI CALCULATOR</div>
    <div style={{textAlign:"center",marginBottom:12}}>
     <div style={{fontSize:12,color:C.td,marginBottom:4}}>Pour 1€ dépensé →</div>
     <div style={{fontWeight:900,fontSize:40,color:totRoas>=2?C.g:totRoas>=1?C.o:C.r,lineHeight:1}}>{roasDisplay.toFixed(2)}€</div>
     <div style={{fontSize:10,color:totRoas>=1?C.g:C.r,fontWeight:600,marginTop:4}}>{totRoas>=1?"✅ Rentable":"⚠️ Non rentable"}</div>
    </div>
    {avgLeadsPerMonth>0&&<div style={{fontSize:10,color:C.td,borderTop:`1px solid ${C.brd}`,paddingTop:8}}>
     <div>📊 ~{Math.round(avgLeadsPerMonth)} leads/mois en moyenne</div>
     <div>👥 ~{avgClientsPerMonth.toFixed(1)} clients/mois</div>
     {panierMoyenPub2>0&&<div>🛒 Panier moyen: {fmt(panierMoyenPub2)}€</div>}
     {totSpend>0&&<div style={{marginTop:6,fontWeight:600,color:C.acc}}>💡 Si budget ×2 → ~{Math.round(avgLeadsPerMonth*2)} leads, ~{Math.round(avgClientsPerMonth*2)} clients</div>}
    </div>}
   </div>
   <div className="fade-up glass-card-static" style={{padding:22,animationDelay:"0.6s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 BENCHMARKS SECTEUR</div>
    {[{l:"CPL moyen",v:`${benchmarks.cpl}€`,yours:`${totCpl.toFixed(2)}€`,ok:totCpl<=benchmarks.cpl},{l:"CPC moyen",v:`${benchmarks.cpc}€`,yours:`${totCpc.toFixed(2)}€`,ok:totCpc<=benchmarks.cpc},{l:"CTR moyen",v:`${benchmarks.ctr}%`,yours:`${totCtr.toFixed(2)}%`,ok:totCtr>=benchmarks.ctr}].map((b,i)=>
     <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:i<2?`1px solid ${C.brd}`:"none"}}>
      <span style={{fontSize:11,color:C.td}}>{b.l}: <strong style={{color:C.t}}>{b.v}</strong></span>
      <span style={{fontSize:11,fontWeight:700,color:b.ok?C.g:C.r}}>Vous: {b.yours} {b.ok?"✅":"⚠️"}</span>
     </div>
    )}
    <div style={{fontSize:9,color:C.td,marginTop:8}}>Modifiable dans ⚙️ Paramètres</div>
   </div>
  </div>
  {/* Budget Simulator */}
  <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,borderLeft:`3px solid ${C.v}`}}>
   <div style={{fontSize:9,fontWeight:700,color:C.v,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>🧮 SIMULATEUR DE BUDGET</div>
   <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
    <span style={{fontSize:12,color:C.td,fontWeight:600}}>Budget :</span>
    <input type="range" min={100} max={10000} step={100} value={budgetSim} onChange={e=>setBudgetSim(parseInt(e.target.value))} style={{flex:1}}/>
    <span style={{fontWeight:900,fontSize:16,color:C.v,minWidth:80,textAlign:"right"}}>{fmt(budgetSim)}€</span>
   </div>
   {totCpl>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
    <div style={{padding:12,background:C.card2,borderRadius:10,textAlign:"center"}}>
     <div style={{fontSize:8,color:C.td,fontWeight:600}}>Leads estimés</div>
     <div style={{fontWeight:900,fontSize:20,color:"#60a5fa"}}>{Math.round(budgetSim/totCpl)}</div>
    </div>
    <div style={{padding:12,background:C.card2,borderRadius:10,textAlign:"center"}}>
     <div style={{fontSize:8,color:C.td,fontWeight:600}}>Appels estimés</div>
     <div style={{fontWeight:900,fontSize:20,color:"#14b8a6"}}>{Math.round(budgetSim/totCpl*(stratCallsAll/Math.max(1,totLeads)))}</div>
    </div>
    <div style={{padding:12,background:C.card2,borderRadius:10,textAlign:"center"}}>
     <div style={{fontSize:8,color:C.td,fontWeight:600}}>Clients estimés</div>
     <div style={{fontWeight:900,fontSize:20,color:C.g}}>{Math.max(1,Math.round(budgetSim/totCpl*(wonAll.length/Math.max(1,totLeads))))}</div>
    </div>
    <div style={{padding:12,background:C.card2,borderRadius:10,textAlign:"center"}}>
     <div style={{fontSize:8,color:C.td,fontWeight:600}}>Revenue estimé</div>
     <div style={{fontWeight:900,fontSize:20,color:C.acc}}>{fmt(Math.round(budgetSim*totRoas))}€</div>
    </div>
   </div>}
   {totCpl===0&&<div style={{textAlign:"center",padding:10,color:C.td,fontSize:11}}>Pas assez de données pour simuler. Ajoutez vos données Meta dans les Paramètres.</div>}
   {/* Smart recommendations based on data */}
   {totCpl>0&&<div style={{marginTop:14,padding:14,background:`linear-gradient(135deg,${C.v}08,${C.acc}08)`,borderRadius:12,border:`1px solid ${C.v}22`}}>
    <div style={{fontSize:9,fontWeight:700,color:C.v,letterSpacing:1,marginBottom:8,fontFamily:FONT_TITLE}}>💡 RECOMMANDATIONS</div>
    {(()=>{
     const recs=[];
     const estLeads=Math.round(budgetSim/totCpl);const estClients=Math.max(1,Math.round(estLeads*(wonAll.length/Math.max(1,totLeads))));const estRev=Math.round(budgetSim*totRoas);const roi=estRev-budgetSim;
     if(totRoas>=2)recs.push({icon:"🚀",text:`ROAS excellent (${totRoas.toFixed(1)}x) — Envisagez d'augmenter le budget à ${fmt(Math.round(budgetSim*1.5))}€ pour maximiser l'acquisition`,color:C.g});
     else if(totRoas>=1)recs.push({icon:"📈",text:`ROAS positif (${totRoas.toFixed(1)}x) — Optimisez les créatives avant d'augmenter le budget`,color:C.o});
     else recs.push({icon:"⚠️",text:`ROAS négatif (${totRoas.toFixed(1)}x) — Réduisez le budget et travaillez l'offre/ciblage`,color:C.r});
     if(totCpl>benchmarks.cpl*1.5)recs.push({icon:"💰",text:`CPL élevé (${totCpl.toFixed(0)}€ vs ${benchmarks.cpl}€ benchmark) — Testez de nouveaux audiences et créatives`,color:C.r});
     if(totCtr<0.8)recs.push({icon:"🎨",text:`CTR bas (${totCtr.toFixed(2)}%) — Travaillez les visuels et les accroches publicitaires`,color:C.o});
     const callConv=stratCallsAll>0&&totLeads>0?stratCallsAll/totLeads:0;
     if(callConv<0.3&&totLeads>5)recs.push({icon:"📞",text:`Seulement ${Math.round(callConv*100)}% des leads bookent un appel — Améliorez le tunnel de conversion (landing page, relances)`,color:C.o});
     const closeRate=wonAll.length>0&&stratCallsAll>0?wonAll.length/stratCallsAll:0;
     if(closeRate>0.25)recs.push({icon:"🏆",text:`Taux de closing fort (${Math.round(closeRate*100)}%) — Investissez plus en pub, votre process de vente convertit bien`,color:C.g});
     const optimalBudget=totRoas>=1?Math.round(totSpend/(metaData.filter(d=>d.spend>0).length||1)*1.3):Math.round(totSpend/(metaData.filter(d=>d.spend>0).length||1)*0.7);
     recs.push({icon:"🎯",text:`Budget optimal recommandé : ${fmt(optimalBudget)}€/mois basé sur vos performances`,color:C.acc});
     return recs.map((r,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0",borderBottom:i<recs.length-1?`1px solid ${C.brd}08`:"none"}}>
      <span style={{fontSize:12,flexShrink:0}}>{r.icon}</span>
      <span style={{fontSize:10,color:r.color,fontWeight:600,lineHeight:1.4}}>{r.text}</span>
     </div>);
    })()}
   </div>}
  </div>
  {/* Cross-referencing */}
  <div className="fade-up glass-card-static" style={{padding:16,marginBottom:20,animationDelay:"0.65s",borderLeft:`3px solid ${C.v}`}}>
   <div style={{fontSize:9,fontWeight:700,color:C.v,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>🔗 CROISEMENT DONNÉES</div>
   <div style={{fontSize:11,color:C.t,fontWeight:600}}>{totLeads} leads générés → {stratCallsAll} appels bookés → {wonAll.length} deals → {fmt(totRev)}€ CA = ROAS {totRoas.toFixed(2)}x</div>
  </div>
  {/* Data Table */}
  <div className="fade-up glass-card-static" style={{padding:18,overflow:"auto",animationDelay:"0.7s"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📋 TABLEAU RÉCAPITULATIF — 12 MOIS</div>
   <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,minWidth:900}}>
    <thead><tr style={{borderBottom:`2px solid ${C.brd}`}}>
     {["Mois","Budget","Impressions","Clics","CTR","CPM","CPC","Leads","CPL","Revenue","ROAS","CPA"].map((h,i)=>
      <th key={i} style={{padding:"8px 4px",textAlign:i===0?"left":"right",color:C.td,fontWeight:700,fontSize:7,letterSpacing:.5,fontFamily:FONT_TITLE}}>{h}</th>
     )}
    </tr></thead>
    <tbody>
     {metaData.map((d,i)=><tr key={d.mo} style={{borderBottom:`1px solid ${C.brd}`,background:i%2===0?"transparent":"var(--sc-w015)"}}>
      <td style={{padding:"6px 4px",fontWeight:700,color:C.t,fontSize:10}}>{ml(d.mo)}</td>
      <td style={{padding:"6px 4px",textAlign:"right",color:"#f472b6",fontWeight:600}}>{d.spend>0?`${fmt(d.spend)}€`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right"}}>{d.impressions>0?fK(d.impressions):"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right"}}>{d.clicks>0?String(d.clicks):"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right",color:d.ctr>benchmarks.ctr?C.g:d.ctr>0?C.r:C.td,fontWeight:600}}>{d.ctr>0?`${d.ctr.toFixed(1)}%`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right"}}>{d.cpm>0?`${d.cpm.toFixed(0)}€`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right",color:d.cpc>0&&d.cpc<=benchmarks.cpc?C.g:d.cpc>0?C.r:C.td,fontWeight:600}}>{d.cpc>0?`${d.cpc.toFixed(2)}€`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right",fontWeight:600}}>{d.leads>0?String(d.leads):"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right",color:d.cpl>0&&d.cpl<=benchmarks.cpl?C.g:d.cpl>0?C.r:C.td,fontWeight:600}}>{d.cpl>0?`${d.cpl.toFixed(0)}€`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right",color:C.g,fontWeight:700}}>{d.revenue>0?`${fmt(d.revenue)}€`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right",color:d.roas>=2?C.g:d.roas>=1?C.o:d.roas>0?C.r:C.td,fontWeight:700}}>{d.roas>0?`${d.roas.toFixed(2)}x`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right"}}>{d.cpa>0?`${d.cpa.toFixed(0)}€`:"—"}</td>
     </tr>)}
     <tr style={{borderTop:`2px solid ${C.acc}`,fontWeight:800}}>
      <td style={{padding:"8px 4px",color:C.acc}}>TOTAL</td>
      <td style={{padding:"8px 4px",textAlign:"right",color:"#f472b6"}}>{fmt(totSpend)}€</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{fK(totImp)}</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{fK(totClk)}</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{totCtr.toFixed(1)}%</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{totCpm.toFixed(0)}€</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{totCpc.toFixed(2)}€</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{totLeads}</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{totCpl.toFixed(0)}€</td>
      <td style={{padding:"8px 4px",textAlign:"right",color:C.g}}>{fmt(totRev)}€</td>
      <td style={{padding:"8px 4px",textAlign:"right",color:totRoas>=1?C.g:C.r}}>{totRoas.toFixed(2)}x</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{totCpa>0?`${totCpa.toFixed(0)}€`:"—"}</td>
     </tr>
    </tbody>
   </table>
  </div>
 </div>;
}

export function SocieteView({soc,reps,allM,save,onLogout,actions,journal,pulses,saveAJ,savePulse,socBankData,syncSocBank,okrs,saveOkrs,kb,saveKb,socs,subs,saveSubs,team,saveTeam,clients,saveClients,ghlData,invoices,saveInvoices,hold,onTour,onThemeToggle,stripeData,adminBack}){
 const cM2=curM();const[pTab,setPTab]=useState(0);const[mo,setMo]=useState(cM2);
 const[f,setF]=useState(()=>gr(reps,soc.id,cM2)||{...BF});const[done,setDone]=useState(false);const[showPub,setShowPub]=useState(false);const[jText,setJText]=useState("");
 const[mobileAIOpen,setMobileAIOpen]=useState(false);

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
  <NotificationCenter notifications={porteurNotifs} open={notifOpen} onClose={()=>setNotifOpen(false)} onNavigate={setPTab}/>
  {/* Mobile Header */}
  <div className="mobile-header" style={{display:"none",position:"fixed",top:0,left:0,right:0,zIndex:100,background:"var(--sc-card-a8)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid var(--sc-w06)",padding:"10px 16px",alignItems:"center",gap:10}}>
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
  {pTab===0&&<><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
  </div>
  <PorteurDashboard soc={soc} reps={reps} allM={allM} socBank={socBankData?{[soc.id]:socBankData}:{}} ghlData={ghlData} setPTab={setPTab} soc2={soc} clients={clients} pulses={pulses} savePulse={savePulse} hold={hold} stripeData={stripeData}/>
  <CAForecast soc={soc} reps={reps} allM={allM} socBank={socBankData?{[soc.id]:socBankData}:{}}/>
  </>}
  {pTab===5&&<><SocBankWidget bankData={socBankData} onSync={()=>syncSocBank(soc.id)} soc={soc}/>
   <SubsTeamPanel socs={[soc]} subs={subs} saveSubs={saveSubs} team={team} saveTeam={saveTeam} socId={soc.id} reps={reps} socBankData={socBankData}/>
  </>}
  {pTab===9&&<ErrorBoundary label="Pipeline"><PipelinePanel soc={soc} ghlData={ghlData}/></ErrorBoundary>}
  {pTab===20&&<ErrorBoundary label="Clients"><NewClientsPanel soc={soc} clients={clients} saveClients={saveClients} ghlData={ghlData} socBankData={socBankData} invoices={invoices} saveInvoices={saveInvoices} stripeData={stripeData}/></ErrorBoundary>}
  {pTab===21&&<ErrorBoundary label="Prestataires"><PrestatairesPanel soc={soc} team={team} saveTeam={saveTeam} clients={clients} reps={reps}/></ErrorBoundary>}
  {pTab===22&&<ErrorBoundary label="Santé"><SantePanel soc={soc} reps={reps} allM={allM} socBankData={socBankData} ghlData={ghlData} clients={clients} hold={hold} team={team}/></ErrorBoundary>}
  {pTab===14&&<ErrorBoundary label="Conversations"><ConversationsPanel soc={soc}/></ErrorBoundary>}
  {pTab===13&&<ErrorBoundary label="Rapports"><RapportsPanel soc={soc} socBankData={socBankData} ghlData={ghlData} clients={clients} reps={reps} allM={allM} hold={hold}/></ErrorBoundary>}
  {pTab===11&&<ErrorBoundary label="Agenda"><AgendaStats soc={soc} ghlData={ghlData}/><AgendaPanel soc={soc} ghlData={ghlData}/></ErrorBoundary>}
  {pTab===12&&<SocSettingsPanel soc={soc} save={save} socs={socs} clients={clients}/>}
  {pTab===1&&<ErrorBoundary label="Activité"><ActivitePanel soc={soc} ghlData={ghlData} socBankData={socBankData} clients={clients}/></ErrorBoundary>}
  {pTab===2&&<ErrorBoundary label="Sales"><SalesPanel soc={soc} ghlData={ghlData} socBankData={socBankData} clients={clients} reps={reps} setPTab={setPTab}/></ErrorBoundary>}
  {pTab===3&&<ErrorBoundary label="Publicité"><PublicitePanel soc={soc} ghlData={ghlData} socBankData={socBankData} clients={clients} reps={reps} setPTab={setPTab}/></ErrorBoundary>}
  </div>
  </div>
  {/* Mobile AI Fullscreen Panel */}
  {mobileAIOpen&&<div className="mobile-ai-fullscreen fi" style={{position:"fixed",inset:0,zIndex:250,background:"rgba(6,6,11,.97)",backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",display:"flex",flexDirection:"column"}}>
   <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.brd}`,display:"flex",alignItems:"center",gap:10,background:"linear-gradient(135deg,rgba(167,139,250,.08),rgba(255,170,0,.08))"}}>
    <div style={{width:36,height:36,borderRadius:18,background:"linear-gradient(135deg,#a78bfa,#FFAA00)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20}}>🤖</span></div>
    <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14,color:C.t}}>Assistant IA</div><div style={{fontSize:10,color:C.td}}>{soc.nom} · Tape "aide" pour les commandes</div></div>
    <button onClick={()=>setMobileAIOpen(false)} style={{background:"rgba(255,255,255,.06)",border:`1px solid ${C.brd}`,borderRadius:10,color:C.td,cursor:"pointer",fontSize:14,padding:"6px 12px",fontFamily:FONT}}>✕</button>
   </div>
   <div style={{flex:1,overflow:"hidden"}}><PorteurAIChat soc={soc} reps={reps} allM={allM} socBank={socBankData?{[soc.id]:socBankData}:{}} ghlData={ghlData} clients={clients} embedded={true}/></div>
  </div>}
  <MobileBottomNav items={SB_PORTEUR} activeTab={pTab} setTab={setPTab} onAIToggle={()=>setMobileAIOpen(!mobileAIOpen)} aiOpen={mobileAIOpen}/>
 </div>;
}
/* ADMIN VALROW */
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
 <Sect title="Impact"><div className="rg3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
  <Card style={{padding:14,textAlign:"center"}}><div style={{color:C.td,fontSize:10,fontWeight:700}}>FLUX</div><div style={{fontWeight:800,fontSize:20,color:C.g}}>{fmt(hcSim.tIn)}€</div><div style={{color:C.td,fontSize:10}}>actuel: {fmt(hcReal.tIn)}€</div></Card>
  <Card style={{padding:14,textAlign:"center"}}><div style={{color:C.td,fontSize:10,fontWeight:700}}>DISPO</div><div style={{fontWeight:800,fontSize:20,color:C.acc}}>{fmt(hcSim.dispo)}€</div><div style={{color:C.td,fontSize:10}}>actuel: {fmt(hcReal.dispo)}€</div></Card>
  <Card style={{padding:14,textAlign:"center"}}><div style={{color:C.td,fontSize:10,fontWeight:700}}>/ FONDATEUR</div><div style={{fontWeight:800,fontSize:20,color:diff>=0?C.g:C.r}}>{fmt(hcSim.pf)}€</div><div style={{color:diff>=0?C.g:C.r,fontSize:11,fontWeight:600}}>{diff>=0?"+":""}{fmt(diff)}€</div></Card>
 </div></Sect></>;
}
/* ONBOARDING SYSTEM */
const OB_STEPS=[
 {id:"welcome",icon:"👋",label:"Bienvenue",title:"Bienvenue dans l'incubateur Scale Corp",sub:"Avant d'accéder à la plateforme, configurons votre espace en quelques étapes."},
 {id:"company",icon:"🏢",label:"Entreprise",title:"Profil de votre entreprise",sub:"Ces informations seront visibles sur votre fiche dans le portfolio."},
 {id:"team",icon:"👥",label:"Équipe",title:"Votre équipe fondatrice",sub:"Présentez les personnes clés de votre projet."},
 {id:"metrics",icon:"📊",label:"Métriques",title:"Vos métriques actuelles",sub:"Point de départ pour suivre votre progression."},
 {id:"goals",icon:"🎯",label:"Objectifs",title:"Objectifs d'incubation",sub:"Définissez ce que vous souhaitez accomplir."},
 {id:"legal",icon:"📋",label:"Légal",title:"Documents & engagements",sub:"Conditions du programme et validation."},
 {id:"prefs",icon:"⚙️",label:"Préférences",title:"Configuration du compte",sub:"Personnalisez votre expérience."},
 {id:"recap",icon:"✅",label:"Récap",title:"Tout est prêt !",sub:"Vérifiez vos informations."},
];
const OB_SECTORS=["Media Buying","Copywriting","Vidéo / Contenu","Design / Branding","Formation","E-commerce","Consulting","SaaS","Coaching","Import / Export","Autre"];
const OB_GOALS=["Atteindre 10K€/mois de CA","Automatiser le delivery","Recruter les premiers talents","Structurer les processus","Développer l'acquisition client","Diversifier les revenus","Construire une marque forte","Optimiser la rentabilité"];

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

export function OnboardingWizard({onComplete,onSkip,hold}){
 const[step,setStep]=useState(0);const[anim,setAnim]=useState(false);const ref=useRef(null);
 const[form,setForm]=useState({companyName:"",sector:"",website:"",foundedDate:"",description:"",city:"",country:"",founderName:"",founderRole:"",founderEmail:"",founderPhone:"",cofounderName:"",cofounderRole:"",currentMRR:"",teamSize:"",fundingStage:"",goals:[],customGoal:"",timeline:"12",acceptTerms:false,acceptReporting:false,acceptMentorship:false,notifEmail:true,notifSlack:false,notifWeekly:true,dashPublic:false});
 const up=(k,v)=>setForm(p=>({...p,[k]:v}));
 const go=t=>{if(anim)return;setAnim(true);setTimeout(()=>{setStep(t);setAnim(false);if(ref.current)ref.current.scrollTop=0;},180);};
 const canNext=()=>{switch(step){case 0:return true;case 1:return form.companyName&&form.sector&&form.description;case 2:return form.founderName&&form.founderRole&&form.founderEmail;case 3:return form.fundingStage;case 4:return form.goals.length>0;case 5:return form.acceptTerms&&form.acceptReporting;case 6:return true;case 7:return true;default:return true;}};
 const prog=step/(OB_STEPS.length-1)*100;
 const stp=OB_STEPS[step];

 const renderStep=()=>{
  switch(step){
   case 0:return <div>
    <div style={{padding:"24px 20px",borderRadius:14,marginBottom:20,background:`linear-gradient(135deg,${C.card2},${C.brd}22)`,border:`1px solid ${C.brd}`,position:"relative",overflow:"hidden"}}>
     <div style={{position:"absolute",top:-30,right:-30,width:110,height:110,borderRadius:"50%",background:C.accD,filter:"blur(30px)"}}/>
     <div style={{fontSize:36,marginBottom:12}}>🚀</div>
     <h2 style={{fontFamily:FONT,fontSize:19,fontWeight:800,marginBottom:8,margin:0,color:C.t}}>Prêt à rejoindre l'aventure ?</h2>
     <p style={{color:C.td,lineHeight:1.6,fontSize:13,margin:"8px 0 0"}}>En quelques minutes, vous allez configurer votre espace sur la plateforme Scale Corp. Ce processus est obligatoire pour accéder à l'ensemble des outils.</p>
    </div>
    <div style={{marginBottom:16}}>
     <div style={{fontSize:13,fontWeight:700,color:C.t,marginBottom:10}}>Ce qui vous attend :</div>
     {[["🏢","Profil entreprise","Informations essentielles de votre activité"],["👥","Équipe fondatrice","Contacts clés pour la communication"],["📊","Métriques de départ","KPIs actuels comme point de référence"],["🎯","Objectifs","Vos ambitions pour le programme"],["📋","Engagements","Conditions et validation"],["⚙️","Préférences","Notifications et visibilité"]].map(([ic,t,d],i)=>
      <div key={i} style={{display:"flex",gap:10,padding:"9px 12px",background:C.bg,borderRadius:9,border:`1px solid ${C.brd}`,marginBottom:5}}>
       <span style={{fontSize:18}}>{ic}</span><div><div style={{fontWeight:700,fontSize:12,color:C.t}}>{t}</div><div style={{fontSize:11,color:C.td}}>{d}</div></div></div>)}
    </div>
    <div style={{padding:"11px 14px",borderRadius:9,background:C.accD,border:`1px solid ${C.acc}33`,fontSize:12,color:C.acc,lineHeight:1.5}}>💡 <strong>Conseil :</strong> Préparez vos métriques clés (CA, équipe) et les infos de votre contact principal. ~5 minutes.</div>
   </div>;

   case 1:return <div>
    <div style={{padding:"11px 14px",borderRadius:9,background:C.accD,border:`1px solid ${C.acc}33`,marginBottom:18,fontSize:12,color:C.acc,lineHeight:1.5}}>
     <strong>📌</strong> Ces infos constituent votre fiche d'identité dans le portfolio, visible par l'équipe Scale Corp.
    </div>
    <ObInp label="Nom de l'entreprise" required value={form.companyName} onChange={v=>up("companyName",v)} placeholder="Ex: MonBusiness SAS"/>
    <ObSelect label="Secteur d'activité" required value={form.sector} onChange={v=>up("sector",v)} options={OB_SECTORS} placeholder="Sélectionnez..."/>
    <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <ObInp label="Site web" value={form.website} onChange={v=>up("website",v)} placeholder="https://..."/>
     <ObInp label="Date de création" type="date" value={form.foundedDate} onChange={v=>up("foundedDate",v)}/>
    </div>
    <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <ObInp label="Ville" value={form.city} onChange={v=>up("city",v)} placeholder="Ex: Saint-Denis"/>
     <ObInp label="Pays" value={form.country} onChange={v=>up("country",v)} placeholder="Ex: France"/>
    </div>
    <ObTextArea label="Description courte" value={form.description} onChange={v=>up("description",v)} placeholder="Décrivez votre activité en 2-3 phrases..." info="Elevator pitch pour le portfolio"/>
    <div style={{fontSize:10,color:C.td,textAlign:"right",marginTop:-8}}>{form.description.length}/300</div>
   </div>;

   case 2:return <div>
    <div style={{padding:"11px 14px",borderRadius:9,background:C.accD,border:`1px solid ${C.acc}33`,marginBottom:18,fontSize:12,color:C.acc,lineHeight:1.5}}>
     <strong>📌</strong> Le contact principal recevra toutes les communications de l'incubateur.
    </div>
    <div style={{fontSize:13,fontWeight:700,color:C.t,marginBottom:10}}>Contact principal *</div>
    <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <ObInp label="Nom complet" required value={form.founderName} onChange={v=>up("founderName",v)} placeholder="Prénom Nom"/>
     <ObInp label="Rôle" required value={form.founderRole} onChange={v=>up("founderRole",v)} placeholder="Ex: CEO"/>
    </div>
    <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <ObInp label="Email" required type="email" value={form.founderEmail} onChange={v=>up("founderEmail",v)} placeholder="email@entreprise.com"/>
     <ObInp label="Téléphone" value={form.founderPhone} onChange={v=>up("founderPhone",v)} placeholder="+262 6..."/>
    </div>
    <div style={{fontSize:13,fontWeight:700,color:C.t,margin:"16px 0 8px"}}>Associé(e) <span style={{fontWeight:400,color:C.td,fontSize:11}}>(optionnel)</span></div>
    <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <ObInp label="Nom" value={form.cofounderName} onChange={v=>up("cofounderName",v)} placeholder="Prénom Nom"/>
     <ObInp label="Rôle" value={form.cofounderRole} onChange={v=>up("cofounderRole",v)} placeholder="Ex: COO"/>
    </div>
   </div>;

   case 3:return <div>
    <div style={{padding:"11px 14px",borderRadius:9,background:C.accD,border:`1px solid ${C.acc}33`,marginBottom:18,fontSize:12,color:C.acc,lineHeight:1.5}}>
     <strong>📌</strong> "Photo de départ" dans l'incubateur — référence pour mesurer votre progression.
    </div>
    <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <ObInp label="CA mensuel actuel (€)" type="number" value={form.currentMRR} onChange={v=>up("currentMRR",v)} placeholder="Ex: 5000" info="Revenu mensuel actuel"/>
     <ObInp label="Taille de l'équipe" type="number" value={form.teamSize} onChange={v=>up("teamSize",v)} placeholder="Ex: 3"/>
    </div>
    <ObSelect label="Stade de développement" required value={form.fundingStage} onChange={v=>up("fundingStage",v)} options={["Idée / Lancement","Premiers revenus","Croissance","Stabilisé","Bootstrapped"]} placeholder="Sélectionner..."/>
    <div style={{padding:"11px 14px",borderRadius:9,background:C.gD,border:`1px solid ${C.g}33`,marginTop:12,fontSize:12,color:C.g,lineHeight:1.5}}>🔒 Vos données sont confidentielles — partagées uniquement avec l'équipe Scale Corp.</div>
   </div>;

   case 4:return <div>
    <div style={{padding:"11px 14px",borderRadius:9,background:C.accD,border:`1px solid ${C.acc}33`,marginBottom:18,fontSize:12,color:C.acc,lineHeight:1.5}}>
     <strong>📌</strong> Vos objectifs orientent le programme : mentoring, ressources et critères de succès.
    </div>
    <div style={{fontSize:12,fontWeight:600,color:C.td,marginBottom:8}}>Objectifs prioritaires * <span style={{fontWeight:400}}>(1 à 4)</span></div>
    <ObTag selected={form.goals} onToggle={g=>up("goals",form.goals.includes(g)?form.goals.filter(x=>x!==g):[...form.goals,g])} options={OB_GOALS}/>
    {form.goals.length>4&&<div style={{fontSize:11,color:C.o,marginTop:8}}>⚠ Maximum 4 recommandé</div>}
    <div style={{marginTop:16}}><ObTextArea label="Objectif personnalisé" value={form.customGoal} onChange={v=>up("customGoal",v)} placeholder="Un objectif spécifique à votre situation..." rows={2}/></div>
    <div style={{fontSize:12,fontWeight:600,color:C.td,marginBottom:8}}>Horizon temporel</div>
    <div style={{display:"flex",gap:8}}>{["6","12","18","24"].map(m=><button key={m} onClick={()=>up("timeline",m)}
     style={{flex:1,padding:"10px 8px",borderRadius:9,border:`1.5px solid ${form.timeline===m?C.acc:C.brd}`,background:form.timeline===m?C.accD:"transparent",color:form.timeline===m?C.acc:C.td,fontWeight:form.timeline===m?700:400,fontSize:13,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>{m} mois</button>)}</div>
   </div>;

   case 5:return <div>
    <div style={{padding:"11px 14px",borderRadius:9,background:C.accD,border:`1px solid ${C.acc}33`,marginBottom:18,fontSize:12,color:C.acc,lineHeight:1.5}}>
     <strong>📌</strong> Lisez et acceptez les conditions pour participer au programme.
    </div>
    <div style={{padding:"14px 16px",borderRadius:11,background:C.bg,border:`1px solid ${C.brd}`,marginBottom:12}}>
     <div style={{fontWeight:700,fontSize:13,color:C.t,marginBottom:8}}>📜 Conditions générales</div>
     <div style={{maxHeight:120,overflowY:"auto",fontSize:11.5,color:C.td,lineHeight:1.6,padding:"10px 12px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:10}}>
      <p style={{margin:"0 0 6px"}}><strong>1. Durée</strong> — L'incubation dure de 6 à 24 mois selon le profil.</p>
      <p style={{margin:"0 0 6px"}}><strong>2. Engagements</strong> — Participation aux sessions mensuelles, mise à jour des métriques.</p>
      <p style={{margin:"0 0 6px"}}><strong>3. Confidentialité</strong> — Vos données restent confidentielles.</p>
      <p style={{margin:"0 0 6px"}}><strong>4. Propriété intellectuelle</strong> — Votre IP reste votre propriété.</p>
      <p style={{margin:0}}><strong>5. Résiliation</strong> — Préavis de 30 jours de chaque côté.</p>
     </div>
     <ObCheck checked={form.acceptTerms} onChange={v=>up("acceptTerms",v)} label={<span>J'accepte les <strong>conditions générales</strong> du programme <span style={{color:C.r}}>*</span></span>}/>
    </div>
    <div style={{padding:"14px 16px",borderRadius:11,background:C.bg,border:`1px solid ${C.brd}`,marginBottom:12}}>
     <div style={{fontWeight:700,fontSize:13,color:C.t,marginBottom:6}}>📊 Engagement de reporting</div>
     <p style={{fontSize:11.5,color:C.td,lineHeight:1.6,margin:"0 0 10px"}}>Mise à jour mensuelle de vos métriques sur la plateforme.</p>
     <ObCheck checked={form.acceptReporting} onChange={v=>up("acceptReporting",v)} label={<span>Je m'engage au reporting <strong>mensuel</strong> <span style={{color:C.r}}>*</span></span>}/>
    </div>
    <div style={{padding:"14px 16px",borderRadius:11,background:C.bg,border:`1px solid ${C.brd}`}}>
     <div style={{fontWeight:700,fontSize:13,color:C.t,marginBottom:6}}>🤝 Mentorship</div>
     <p style={{fontSize:11.5,color:C.td,lineHeight:1.6,margin:"0 0 10px"}}>Optionnel : point mensuel de 30 min avec un mentor expert.</p>
     <ObCheck checked={form.acceptMentorship} onChange={v=>up("acceptMentorship",v)} label="Je souhaite participer au mentorship (recommandé)"/>
    </div>
   </div>;

   case 6:return <div>
    <div style={{padding:"11px 14px",borderRadius:9,background:C.accD,border:`1px solid ${C.acc}33`,marginBottom:18,fontSize:12,color:C.acc,lineHeight:1.5}}>
     <strong>📌</strong> Paramètres modifiables à tout moment depuis les réglages.
    </div>
    <div style={{fontSize:13,fontWeight:700,color:C.t,marginBottom:10}}>🔔 Notifications</div>
    <ObCheck checked={form.notifEmail} onChange={v=>up("notifEmail",v)} label="Notifications par email (milestones, rappels, invitations)"/>
    <ObCheck checked={form.notifSlack} onChange={v=>up("notifSlack",v)} label="Intégration Slack (notifications temps réel)"/>
    <ObCheck checked={form.notifWeekly} onChange={v=>up("notifWeekly",v)} label="Digest hebdomadaire (résumé + actualités)"/>
    <div style={{fontSize:13,fontWeight:700,color:C.t,margin:"18px 0 10px"}}>👁️ Visibilité</div>
    <div style={{padding:"14px 16px",borderRadius:11,background:C.bg,border:`1px solid ${C.brd}`}}>
     <ObCheck checked={form.dashPublic} onChange={v=>up("dashPublic",v)} label="Rendre mon profil visible aux autres entreprises du portfolio"/>
     <div style={{padding:"8px 12px",borderRadius:8,background:C.accD,border:`1px solid ${C.acc}22`,fontSize:11,color:C.acc,lineHeight:1.5,marginTop:6}}>💡 Si activé : nom, secteur et description visibles. Métriques financières toujours privées.</div>
    </div>
   </div>;

   case 7:return <div>
    <div style={{padding:"11px 14px",borderRadius:9,background:C.gD,border:`1px solid ${C.g}33`,marginBottom:18,fontSize:12,color:C.g,lineHeight:1.5}}>
     <strong>✅ Dernière étape !</strong> Vérifiez ci-dessous. Modifiable à tout moment après validation.
    </div>
    {[
     ["🏢","Entreprise",form.companyName?<><div><strong>{form.companyName}</strong> · {form.sector||"—"}</div>{form.city&&<div style={{fontSize:11,color:C.td}}>📍 {form.city}{form.country?`, ${form.country}`:""}</div>}{form.description&&<div style={{fontSize:11,color:C.td,fontStyle:"italic",marginTop:2}}>"{form.description.slice(0,80)}{form.description.length>80?"...":""}"</div>}</>:null],
     ["👥","Contact",form.founderName?<><div><strong>{form.founderName}</strong> — {form.founderRole}</div><div style={{fontSize:11,color:C.td}}>📧 {form.founderEmail}</div>{form.cofounderName&&<div style={{fontSize:11,color:C.td}}>Associé : {form.cofounderName}</div>}</>:null],
     ["📊","Métriques",<><div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,fontSize:11}}><span>CA : <strong>{form.currentMRR?`${Number(form.currentMRR).toLocaleString()}€`:"—"}</strong></span><span>Équipe : <strong>{form.teamSize||"—"}</strong></span><span>Stade : <strong>{form.fundingStage||"—"}</strong></span></div></>],
     ["🎯","Objectifs",<><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{form.goals.map(g=><span key={g} style={{padding:"3px 9px",borderRadius:10,background:C.accD,color:C.acc,fontSize:10,fontWeight:600}}>{g}</span>)}</div><div style={{fontSize:11,color:C.td,marginTop:3}}>⏱ Horizon : {form.timeline} mois</div></>],
     ["📋","Engagements",<div style={{fontSize:11}}><div>CGU : {form.acceptTerms?"✅":"❌"} · Reporting : {form.acceptReporting?"✅":"❌"} · Mentorship : {form.acceptMentorship?"✅":"⬜"}</div></div>],
     ["⚙️","Préférences",<div style={{fontSize:11}}><div>Email : {form.notifEmail?"✅":"⬜"} · Slack : {form.notifSlack?"✅":"⬜"} · Digest : {form.notifWeekly?"✅":"⬜"}</div><div>Profil : {form.dashPublic?"👁️ Public":"🔒 Privé"}</div></div>],
    ].map(([ic,title,content],i)=><div key={i} style={{padding:"10px 14px",background:C.bg,borderRadius:9,border:`1px solid ${C.brd}`,marginBottom:6}}>
     <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:content?5:0}}><span style={{fontSize:16}}>{ic}</span><span style={{fontWeight:700,fontSize:12,color:C.t}}>{title}</span></div>
     {content&&<div style={{paddingLeft:30,color:C.t,fontSize:12}}>{content}</div>}
    </div>)}
   </div>;
   default:return null;
  }
 };

 return <div className="glass-bg" style={{minHeight:"100vh",display:"flex",fontFamily:FONT,color:C.t}}>
  <style>{CSS}{`@keyframes obSlide{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}@keyframes obPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,170,0,.4)}70%{box-shadow:0 0 0 8px rgba(255,170,0,0)}}`}</style>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
  {/* Sidebar stepper */}
  <div className="ob-sidebar" style={{width:220,minHeight:"100vh",background:C.card,borderRight:`1px solid ${C.brd}`,padding:"28px 16px",display:"flex",flexDirection:"column"}}>
   <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:28}}>
    <div style={{width:32,height:32,background:hold?.brand?.logoUrl?"transparent":`linear-gradient(135deg,${hold?.brand?.accentColor||C.acc},#FF9D00)`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#0a0a0f",overflow:"hidden"}}>{hold?.brand?.logoUrl?<img src={hold.brand.logoUrl} alt={hold?.brand?.name||"Logo"} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(hold?.brand?.logoLetter||"S")}</div>
    <div><div style={{fontWeight:800,fontSize:13,letterSpacing:.5}}>{hold?.brand?.name||"L'INCUBATEUR ECS"}</div><div style={{color:C.td,fontSize:9}}>Onboarding</div></div>
   </div>
   <div style={{flex:1}}>
    {OB_STEPS.map((s,i)=>{const done=i<step,curr=i===step;return <button key={s.id} onClick={()=>{if(i<step)go(i);}}
     style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 10px",marginBottom:2,borderRadius:8,border:"none",background:curr?C.accD:"transparent",cursor:i<=step?"pointer":"default",fontFamily:FONT,transition:"all .15s",opacity:i>step?.4:1}}>
     <div style={{width:26,height:26,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:done?11:13,fontWeight:700,background:done?C.g+"22":curr?C.accD:"transparent",color:done?C.g:curr?C.acc:C.td,border:done?`1.5px solid ${C.g}44`:curr?`1.5px solid ${C.acc}44`:`1.5px solid ${C.brd}`}}>{done?"✓":s.icon}</div>
     <span style={{fontSize:11,fontWeight:curr?700:400,color:curr?C.acc:done?C.t:C.td}}>{s.label}</span>
    </button>;})}
   </div>
   <div style={{padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.brd}`}}>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.td,marginBottom:4}}><span>Progression</span><span>{Math.round(prog)}%</span></div>
    <div style={{height:4,background:C.brd,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${prog}%`,background:`linear-gradient(90deg,${C.acc},#FF9D00)`,borderRadius:4,transition:"width .3s ease"}}/></div>
   </div>
   {onSkip&&<button onClick={onSkip} style={{marginTop:8,width:"100%",padding:"8px",borderRadius:7,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,fontSize:10,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>← Retour à la connexion</button>}
  </div>
  {/* Content */}
  <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
   <div style={{padding:"20px 28px",borderBottom:`1px solid ${C.brd}`,background:C.card}}>
    <div style={{fontSize:9,fontWeight:700,color:C.acc,letterSpacing:1,marginBottom:3}}>ÉTAPE {step+1}/{OB_STEPS.length}</div>
    <h1 style={{margin:0,fontSize:20,fontWeight:800,color:C.t}}>{stp.title}</h1>
    <p style={{margin:"4px 0 0",color:C.td,fontSize:12}}>{stp.sub}</p>
   </div>
   <div ref={ref} className="ob-content" style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
    <div style={{maxWidth:540,margin:"0 auto",animation:anim?"none":"obSlide .3s cubic-bezier(.16,1,.3,1)"}}>{renderStep()}</div>
   </div>
   <div style={{padding:"14px 28px",borderTop:`1px solid ${C.brd}`,background:C.card,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <button onClick={()=>{if(step>0)go(step-1);}} disabled={step===0}
     style={{padding:"9px 20px",borderRadius:9,border:`1px solid ${C.brd}`,background:"transparent",color:step>0?C.t:C.tm,fontSize:12,fontWeight:600,cursor:step>0?"pointer":"default",fontFamily:FONT}}>← Retour</button>
    {step<OB_STEPS.length-1?
     <button onClick={()=>{if(canNext())go(step+1);}} disabled={!canNext()}
      style={{padding:"9px 24px",borderRadius:9,border:"none",background:canNext()?`linear-gradient(135deg,${C.acc},#FF9D00)`:"#1a1a2c",color:canNext()?"#0a0a0f":C.tm,fontSize:12,fontWeight:700,cursor:canNext()?"pointer":"default",fontFamily:FONT,boxShadow:canNext()?`0 4px 16px ${C.accD}`:"none",animation:canNext()?"obPulse 2s infinite":"none"}}>Continuer →</button>
    :<button onClick={()=>{if(form.acceptTerms&&form.acceptReporting&&form.companyName&&form.founderName)onComplete(form);}}
      disabled={!(form.acceptTerms&&form.acceptReporting&&form.companyName&&form.founderName)}
      style={{padding:"9px 24px",borderRadius:9,border:"none",background:(form.acceptTerms&&form.acceptReporting&&form.companyName&&form.founderName)?`linear-gradient(135deg,${C.g},#16a34a)`:"#1a1a2c",color:(form.acceptTerms&&form.acceptReporting&&form.companyName&&form.founderName)?"#fff":C.tm,fontSize:12,fontWeight:700,cursor:(form.acceptTerms&&form.acceptReporting&&form.companyName&&form.founderName)?"pointer":"default",fontFamily:FONT,display:"flex",alignItems:"center",gap:6,boxShadow:(form.acceptTerms&&form.acceptReporting&&form.companyName&&form.founderName)?`0 4px 16px ${C.gD}`:"none"}}>🚀 Accéder à la plateforme</button>
    }
   </div>
  </div>
 </div>;
}

/* TUTORIAL SYSTEM — SPOTLIGHT TOUR */
/* TUTORIAL SYSTEM — SPOTLIGHT TOUR */
export const TOUR_ADMIN=[
 {target:"admin-nav",tab:0,title:"Navigation",icon:"🧭",desc:"La sidebar à gauche organise la plateforme en 6 sections clés : Dashboard, Portfolio, Finance, Commercial, AI Copilot et Ressources. Cliquez sur une section pour déplier ses sous-modules. Tout est accessible en un clic.",pos:"right",highlight:C.acc},
 {target:"admin-kpis",tab:0,title:"KPIs en temps réel",icon:"💰",desc:"Vue instantanée de la santé financière du groupe. CA total, marge nette, rémunération des fondateurs, disponible et trésorerie. Ces chiffres se recalculent automatiquement à chaque rapport soumis par une société.",pos:"bottom",highlight:C.acc},
 {target:"admin-alerts",tab:0,title:"Alertes intelligentes",icon:"🔔",desc:"Le système détecte automatiquement les risques : rapports en retard, trésorerie basse, chute de CA, actions non terminées. Chaque alerte est priorisée par criticité (danger, warning, info).",pos:"bottom",highlight:C.o},
 {target:"admin-feed",tab:0,title:"Fil d'activité",icon:"⚡",desc:"Chronologie des dernières actions du portfolio : rapports soumis, pulse check-ins, milestones débloqués. Gardez un œil sur l'activité sans vérifier chaque société.",pos:"right",highlight:C.b},
 {target:"admin-leaderboard",tab:0,title:"Classement & grades",icon:"🏆",desc:"Les sociétés sont classées par score composite (CA, croissance, rentabilité, engagement). Le grade A à F donne un aperçu instantané. Cliquez pour accéder au détail.",pos:"left",highlight:C.acc},
 {target:"admin-okr-actions",tab:0,title:"OKRs & Actions",icon:"🎯",desc:"À gauche : progression des objectifs trimestriels (OKR) avec barres d'avancement auto-synchro. À droite : actions prioritaires ouvertes avec détection des retards.",pos:"top",highlight:C.g},
 {target:"admin-portfolio",tab:0,title:"Cartes Portfolio",icon:"📋",desc:"Chaque carte = une société active. CA, trésorerie, grade santé, milestones débloqués, runway estimé. Les données viennent des rapports mensuels et des connexions bancaires.",pos:"top",highlight:C.v},
 {target:"admin-milestones",tab:0,title:"Milestones",icon:"🏅",desc:"Progression de chaque société vers ses trophées : clubs CA (1K, 5K, 10K…), streaks de croissance, ancienneté, rentabilité. Le système débloque automatiquement les achievements.",pos:"top",highlight:C.acc},
 {target:"admin-tab-1",tab:1,title:"Sociétés",icon:"📋",desc:"Dans la section Portfolio : ajoutez, modifiez et suivez chaque société incubée. PIN d'accès, couleur, porteur, objectifs, intégrations API. C'est le cœur de configuration de l'incubateur.",pos:"right",highlight:C.b},
 {target:"admin-tab-2",tab:2,title:"Analytique",icon:"📊",desc:"Section Portfolio > Analytique : comparez les performances entre sociétés avec des graphiques interactifs. Répartition du CA, évolution mensuelle, matrice de risque.",pos:"right",highlight:C.v},
 {target:"admin-tab-5",tab:5,title:"AI Copilot",icon:"🤖",desc:"Votre assistant IA dédié. Posez n'importe quelle question sur votre portfolio : analyses, comparaisons, recommandations. Il a accès à toutes vos données en temps réel.",pos:"right",highlight:"#a78bfa"},
 {target:"admin-tab-6",tab:6,title:"Pipeline",icon:"◎",desc:"Section Commercial > Pipeline : gérez les nouveaux projets de l'idée à la signature. 4 étapes : Idée, Évaluation, Due Diligence, Signé.",pos:"right",highlight:C.b},
 {target:"admin-tab-10",tab:10,title:"Synergies",icon:"🤝",desc:"Section Commercial > Synergies : cartographiez les referrals et collaborations entre sociétés. Suivez le CA généré par les synergies internes.",pos:"right",highlight:C.v},
 {target:"admin-tab-13",tab:13,title:"Charges & Équipe",icon:"🔄",desc:"Section Finance > Charges : centralisez abonnements et membres d'équipe de chaque société. Coût mensuel total, répartition par catégorie.",pos:"right",highlight:C.r},
];

export const TOUR_PORTEUR=[
 {target:"porteur-nav",tab:10,title:"Votre espace",icon:"🧭",desc:"La sidebar organise vos modules : Accueil (vue d'ensemble), Rapport, Performance, Suivi, Banque, Clients et Ressources.",pos:"right",highlight:C.acc},
 {target:"porteur-tab-10",tab:10,title:"Accueil",icon:"◉",desc:"Votre tableau de bord personnel : nudges d'actions à faire, KPIs du mois, évolution du CA, trophées et activité récente. Tout en un coup d'œil.",pos:"right",highlight:C.acc},
 {target:"porteur-tab-0",tab:0,title:"Rapport mensuel",icon:"📊",desc:"Renseignez CA, charges, clients et trésorerie chaque mois. Les champs avancés (détail charges, funnel, pub) sont dans des sections dépliables.",pos:"right",highlight:C.o},
 {target:"porteur-tab-1",tab:1,title:"Statistiques",icon:"📈",desc:"Performance > Stats : KPIs, score de santé A-F, graphes CA/marge. Les détails (finances, prévisions, funnel) se déplient à la demande.",pos:"right",highlight:C.g},
 {target:"porteur-tab-2",tab:2,title:"Activité",icon:"✅",desc:"Suivi > Activité : vos actions à faire, journal stratégique et historique fusionnés en un seul fil chronologique.",pos:"right",highlight:C.b},
 {target:"porteur-tab-4",tab:4,title:"Pulse hebdomadaire",icon:"💓",desc:"Suivi > Pulse : mood, victoire, blocage et confiance chaque semaine. Signal rapide pour Scale Corp.",pos:"right",highlight:C.o},
 {target:"porteur-tab-6",tab:6,title:"Milestones",icon:"🏆",desc:"Performance > Milestones : achievements automatiques, 5 tiers de Bronze à Diamant.",pos:"right",highlight:C.acc},
 {target:"porteur-tab-9",tab:9,title:"Gestion Clients",icon:"👥",desc:"Portefeuille clients : statuts, historique, facturation. Gérez le cycle de vie client.",pos:"right",highlight:C.o},
];

export function TutorialOverlay({steps,onFinish,onSkip,setActiveTab}){
 const[idx,setIdx]=useState(0);
 const[rect,setRect]=useState(null);
 const[tipPos,setTipPos]=useState({x:0,y:0,side:"bottom"});
 const[ready,setReady]=useState(false);
 const[transitioning,setTransitioning]=useState(false);
 const prevTab=useRef(null);
 const s=steps[idx];const isLast=idx===steps.length-1;

 const measure=useCallback(()=>{
  const el=document.querySelector(`[data-tour="${s.target}"]`);
  if(!el){setRect(null);setReady(true);return;}
  el.scrollIntoView({behavior:"smooth",block:"nearest"});
  setTimeout(()=>{
   const r=el.getBoundingClientRect();
   const pad=6;
   const spotlight={x:r.left-pad,y:r.top-pad,w:r.width+pad*2,h:r.height+pad*2};
   setRect(spotlight);
   /* Tooltip positioning */
   const tipW=380,tipH=200;const vw=window.innerWidth,vh=window.innerHeight;
   let tx,ty,side=s.pos||"bottom";
   if(side==="bottom"){tx=spotlight.x+spotlight.w/2-tipW/2;ty=spotlight.y+spotlight.h+14;}
   else if(side==="top"){tx=spotlight.x+spotlight.w/2-tipW/2;ty=spotlight.y-tipH-14;}
   else if(side==="right"){tx=spotlight.x+spotlight.w+14;ty=spotlight.y+spotlight.h/2-tipH/2;}
   else if(side==="left"){tx=spotlight.x-tipW-14;ty=spotlight.y+spotlight.h/2-tipH/2;}
   /* Clamp to viewport */
   if(tx<12)tx=12;if(tx+tipW>vw-12)tx=vw-tipW-12;
   if(ty<12)ty=12;if(ty+tipH>vh-12){ty=spotlight.y-tipH-14;side="top";}
   if(ty<12){ty=spotlight.y+spotlight.h+14;side="bottom";}
   setTipPos({x:tx,y:ty,side});
   setReady(true);
  },100);
 },[s]);

 const goToStep=(newIdx)=>{
  setReady(false);setTransitioning(true);
  const newStep=steps[newIdx];
  if(prevTab.current!==newStep.tab){setActiveTab(newStep.tab);prevTab.current=newStep.tab;}
  setIdx(newIdx);
  setTimeout(()=>{setTransitioning(false);},80);
 };

 useEffect(()=>{
  prevTab.current=s.tab;setActiveTab(s.tab);
  const t=setTimeout(measure,250);
  const onR=()=>measure();window.addEventListener("resize",onR);
  return()=>{clearTimeout(t);window.removeEventListener("resize",onR);};
 },[idx,measure,s.tab]);

 useEffect(()=>{
  const onK=e=>{if(e.key==="Escape")onSkip();if(e.key==="ArrowRight"&&!isLast)goToStep(idx+1);if(e.key==="ArrowLeft"&&idx>0)goToStep(idx-1);};
  window.addEventListener("keydown",onK);return()=>window.removeEventListener("keydown",onK);
 },[idx,isLast]);

 const spotStyle=rect?{position:"fixed",left:rect.x,top:rect.y,width:rect.w,height:rect.h,borderRadius:10,boxShadow:`0 0 0 9999px rgba(0,0,0,.62)`,border:`2px solid ${s.highlight}88`,zIndex:10000,transition:"all .45s cubic-bezier(.4,0,.2,1)",pointerEvents:"none"}:{position:"fixed",left:"50%",top:"50%",width:0,height:0,borderRadius:"50%",boxShadow:"0 0 0 9999px rgba(0,0,0,.62)",zIndex:10000,pointerEvents:"none"};

 const arrowSide=tipPos.side;

 return <div style={{position:"fixed",inset:0,zIndex:9999,fontFamily:FONT,pointerEvents:"none"}}>
  <style>{`@keyframes tourPulse{0%,100%{box-shadow:0 0 0 9999px rgba(0,0,0,.62),0 0 0 0 ${s.highlight}44}50%{box-shadow:0 0 0 9999px rgba(0,0,0,.62),0 0 16px 4px ${s.highlight}33}}@keyframes tourTipIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
  {/* Spotlight cutout */}
  <div style={{...spotStyle,animation:ready?"tourPulse 2.5s ease infinite":"none"}}/>
  {/* Clickable backdrop */}
  <div style={{position:"fixed",inset:0,zIndex:10001,pointerEvents:"auto",cursor:"pointer"}} onClick={e=>{
   if(rect){const{clientX:cx,clientY:cy}=e;const inSpot=cx>=rect.x&&cx<=rect.x+rect.w&&cy>=rect.y&&cy<=rect.y+rect.h;if(inSpot)return;}
   /* Click outside spotlight = skip */
  }}/>
  {/* Tooltip card */}
  {ready&&<div style={{position:"fixed",left:tipPos.x,top:tipPos.y,width:380,maxWidth:"95vw",zIndex:10002,pointerEvents:"auto",animation:"tourTipIn .35s cubic-bezier(.16,1,.3,1) both",opacity:transitioning?0:1,transition:"opacity .15s"}}>
   <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:14,overflow:"hidden",boxShadow:`0 20px 50px rgba(0,0,0,.45), 0 0 0 1px ${s.highlight}18`}}>
    {/* Arrow */}
    {rect&&arrowSide==="bottom"&&<div style={{position:"absolute",top:-7,left:"50%",marginLeft:-7,width:14,height:14,background:C.card,border:`1px solid ${C.brd}`,borderRight:"none",borderBottom:"none",transform:"rotate(45deg)",zIndex:1}}/>}
    {rect&&arrowSide==="top"&&<div style={{position:"absolute",bottom:-7,left:"50%",marginLeft:-7,width:14,height:14,background:C.card,border:`1px solid ${C.brd}`,borderLeft:"none",borderTop:"none",transform:"rotate(45deg)",zIndex:1}}/>}
    {/* Accent bar */}
    <div style={{height:3,background:`linear-gradient(90deg,${s.highlight},${s.highlight}44)`}}/>
    {/* Header */}
    <div style={{padding:"14px 18px 10px",display:"flex",alignItems:"center",gap:10}}>
     <div style={{width:36,height:36,borderRadius:9,background:`${s.highlight}15`,border:`1.5px solid ${s.highlight}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{s.icon}</div>
     <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:8,fontWeight:700,color:s.highlight,letterSpacing:1,marginBottom:1}}>{idx+1} / {steps.length}</div>
      <div style={{fontSize:15,fontWeight:800,color:C.t,lineHeight:1.2}}>{s.title}</div>
     </div>
    </div>
    {/* Body */}
    <div style={{padding:"2px 18px 14px"}}><p style={{margin:0,fontSize:12.5,color:C.td,lineHeight:1.65}}>{s.desc}</p></div>
    {/* Footer */}
    <div style={{padding:"10px 18px",borderTop:`1px solid ${C.brd}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:C.bg+"44"}}>
     {/* Mini progress bar */}
     <div style={{flex:1,maxWidth:120,height:4,background:C.brd,borderRadius:2,overflow:"hidden",marginRight:12}}><div style={{height:"100%",width:`${(idx+1)/steps.length*100}%`,background:`linear-gradient(90deg,${s.highlight},${s.highlight}88)`,borderRadius:2,transition:"width .4s ease"}}/></div>
     <div style={{display:"flex",gap:6,alignItems:"center"}}>
      <button onClick={onSkip} style={{padding:"5px 10px",borderRadius:6,border:"none",background:"transparent",color:C.td,fontSize:10,cursor:"pointer",fontFamily:FONT}}>Passer</button>
      {idx>0&&<button onClick={()=>goToStep(idx-1)} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${C.brd}`,background:"transparent",color:C.t,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>←</button>}
      <button onClick={()=>{if(isLast)onFinish();else goToStep(idx+1);}}
       style={{padding:"6px 16px",borderRadius:6,border:"none",background:isLast?`linear-gradient(135deg,${C.g},#16a34a)`:`linear-gradient(135deg,${s.highlight},${s.highlight}cc)`,color:isLast?"#fff":"#0a0a0f",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT,boxShadow:`0 2px 8px ${s.highlight}33`}}>{isLast?"✨ C'est parti !":"Suivant →"}</button>
     </div>
    </div>
   </div>
  </div>}
  {/* Keyboard hint */}
  {ready&&<div style={{position:"fixed",bottom:14,left:"50%",transform:"translateX(-50%)",zIndex:10002,pointerEvents:"none",display:"flex",gap:8,alignItems:"center"}}>
   {[["←","Précédent"],["→","Suivant"],["Esc","Quitter"]].map(([k,l])=><div key={k} style={{display:"flex",alignItems:"center",gap:4}}><span style={{padding:"2px 6px",borderRadius:4,background:C.card,border:`1px solid ${C.brd}`,fontSize:9,fontWeight:700,color:C.td,fontFamily:"monospace"}}>{k}</span><span style={{fontSize:8,color:C.tm}}>{l}</span></div>)}
  </div>}
 </div>;
}

/* SIDEBAR NAVIGATION */
/* SIDEBAR NAVIGATION */
export const SB_ADMIN=[
 {id:"dash",icon:"◉",label:"Dashboard",tab:0,accent:C.acc},
 {id:"societes",icon:"🏢",label:"Sociétés",tab:1,accent:C.b},
 {id:"finances",icon:"💰",label:"Finances",tab:2,accent:C.g},
 {id:"clients",icon:"👥",label:"Clients",tab:3,accent:C.o},
 {id:"sales",icon:"📞",label:"Sales",tab:15,accent:"#34d399"},
 {id:"pub",icon:"📣",label:"Publicité",tab:16,accent:"#f472b6"},
 {id:"rapports",icon:"📋",label:"Rapports",tab:17,accent:C.v},
 {id:"access",icon:"🔐",label:"Accès",tab:14,accent:"#f59e0b"},
 {id:"params",icon:"⚙️",label:"Paramètres",tab:18,accent:C.td},
 {id:"pulse",icon:"⚡",label:"PULSE",tab:99,accent:"#FFAA00"},
];

export const SB_PORTEUR=[
 {id:"dashboard",icon:"📊",label:"Dashboard",tab:0,accent:C.acc},
 {id:"bank",icon:"🏦",label:"Finances",tab:5,accent:C.g},
 {id:"sales",icon:"📞",label:"Sales",tab:2,accent:"#34d399"},
 {id:"publicite",icon:"📣",label:"Publicité",tab:3,accent:"#f472b6"},
 {id:"pipeline",icon:"🎯",label:"Pipeline",tab:9,accent:C.o},
 {id:"clients",icon:"👥",label:"Clients",tab:20,accent:C.b},
 {id:"prestataires",icon:"🛠️",label:"Prestataires",tab:21,accent:"#ec4899"},
 {id:"agenda",icon:"📅",label:"Agenda",tab:11,accent:"#14b8a6"},
 {id:"sante",icon:"🩺",label:"Santé",tab:22,accent:C.g},
 {id:"conversations",icon:"💬",label:"Conversations",tab:14,accent:C.b},
 {id:"rapports",icon:"📋",label:"Rapports",tab:13,accent:C.v},
 {id:"settings",icon:"⚙️",label:"Paramètres",tab:12,accent:C.td},
];

export function Sidebar({items,activeTab,setTab,brandTitle,brandSub,onLogout,onTour,extra,dataTourPrefix,brand,onThemeToggle,installPrompt,adminBack}){
 const[exp,setExp]=useState(()=>{
  const init={};items.forEach(g=>{if(g.children&&g.children.some(c=>c.tab===activeTab))init[g.id]=true;});return init;
 });
 useEffect(()=>{items.forEach(g=>{if(g.children&&g.children.some(c=>c.tab===activeTab))setExp(p=>({...p,[g.id]:true}));});},[activeTab]);
 const isAct=t=>t===activeTab;
 const grpAct=g=>g.children?g.children.some(c=>c.tab===activeTab):false;

 return <aside data-tour={`${dataTourPrefix}-nav`} className="glass-sidebar" style={{width:210,minWidth:210,height:"100vh",position:"sticky",top:0,display:"flex",flexDirection:"column",fontFamily:FONT,overflow:"hidden",zIndex:50}}>
  <div style={{padding:"16px 14px 14px",borderBottom:`1px solid ${C.brd}`,display:"flex",alignItems:"center",gap:9}}>
   <div style={{width:30,height:30,background:brand?.logoUrl?"transparent":`linear-gradient(135deg,${brand?.accentColor||C.acc},#FF9D00)`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#0a0a0f",boxShadow:`0 2px 8px ${(brand?.accentColor||C.acc)}44`,flexShrink:0,overflow:"hidden"}}>{brand?.logoUrl?<img src={brand.logoUrl} alt={brandTitle||"Logo"} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(brand?.logoLetter||brandTitle?.[0]||"S")}</div>
   <div style={{minWidth:0}}><div style={{fontWeight:800,fontSize:12,letterSpacing:.5,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:FONT_TITLE}}>{brandTitle}</div><div style={{fontSize:8,color:C.td}}>{brandSub}</div></div>
  </div>
  <nav style={{flex:1,overflow:"auto",padding:"8px 6px 8px 6px"}}>
   {items.map(g=>{
    const hasK=!!g.children;const open=exp[g.id];const gA=hasK?grpAct(g):isAct(g.tab);
    return <div key={g.id} style={{marginBottom:1}}>
     <button data-tour={!hasK?`${dataTourPrefix}-tab-${g.tab}`:undefined} onClick={()=>{if(hasK){setExp(p=>({...p,[g.id]:!p[g.id]}));if(!open&&g.children[0])setTab(g.children[0].tab);}else setTab(g.tab);}}
      style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:10,border:"none",background:gA?"rgba(255,170,0,.08)":"transparent",color:gA?C.t:C.td,fontSize:11,fontWeight:gA?700:500,cursor:"pointer",fontFamily:FONT,transition:"all .25s cubic-bezier(.4,0,.2,1)",borderLeft:gA?`2.5px solid ${g.accent||C.acc}`:"2.5px solid transparent",textAlign:"left",boxShadow:gA?`0 0 16px ${(g.accent||C.acc)}12`:"none"}}
      onMouseEnter={e=>{if(!gA)e.currentTarget.style.background=C.card2;}} onMouseLeave={e=>{if(!gA)e.currentTarget.style.background="transparent";}}>
      <span style={{fontSize:14,width:20,textAlign:"center",flexShrink:0}}>{g.icon}</span>
      <span style={{flex:1}}>{g.label}</span>
      {hasK&&<span style={{fontSize:7,color:C.td,transition:"transform .2s",transform:open?"rotate(90deg)":"rotate(0)"}}>▶</span>}
     </button>
     {hasK&&<div style={{marginLeft:16,borderLeft:`1px solid ${open?g.accent+"33":C.brd}`,paddingLeft:0,overflow:"hidden",maxHeight:open?200:0,transition:"max-height .25s ease, opacity .2s",opacity:open?1:0}}>
      {g.children.map(c=>{
       const cA=isAct(c.tab);
       return <button key={c.tab} data-tour={`${dataTourPrefix}-tab-${c.tab}`} onClick={()=>setTab(c.tab)}
        style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"5px 8px 5px 10px",borderRadius:0,borderRight:"none",borderTop:"none",borderBottom:"none",borderLeft:cA?`2px solid ${g.accent||C.acc}`:"2px solid transparent",background:cA?(g.accent||C.acc)+"15":"transparent",color:cA?C.t:C.tm,fontSize:10,fontWeight:cA?600:400,cursor:"pointer",fontFamily:FONT,transition:"all .12s",textAlign:"left"}}
        onMouseEnter={e=>{if(!cA)e.currentTarget.style.background=C.card2;}} onMouseLeave={e=>{if(!cA)e.currentTarget.style.background="transparent";}}>
        <span style={{fontSize:11,width:16,textAlign:"center"}}>{c.icon}</span>
        <span style={{flex:1}}>{c.label}</span>
        {cA&&<span style={{width:5,height:5,borderRadius:3,background:g.accent||C.acc,flexShrink:0}}/>}
       </button>;
      })}
     </div>}
    </div>;
   })}
  </nav>
  {extra&&<div style={{padding:"6px 10px",borderTop:`1px solid ${C.brd}`}}>{extra}</div>}
  <div style={{padding:"6px 6px 10px",borderTop:extra?"none":`1px solid ${C.brd}`,display:"flex",flexDirection:"column",gap:1}}>
   {onThemeToggle&&<button onClick={onThemeToggle} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,border:"none",background:"transparent",color:C.td,fontSize:10,cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background=C.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
    <span style={{fontSize:12}}>{getTheme()==="light"?"🌙":"☀️"}</span><span>{getTheme()==="light"?"Mode sombre":"Mode clair"}</span>
   </button>}
   {(installPrompt||window.__pwaPrompt)&&<button onClick={()=>{(installPrompt||window.__pwaPrompt)?.prompt();}} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,border:"none",background:"transparent",color:C.acc,fontSize:10,cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background=C.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
    <span style={{fontSize:12}}>📱</span><span>Installer l'app</span>
   </button>}
   {adminBack&&<button onClick={adminBack} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,border:"none",background:C.accD,color:C.acc,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"background .12s",marginBottom:2}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,170,0,.2)"} onMouseLeave={e=>e.currentTarget.style.background=C.accD}>
    <span style={{fontSize:12}}>←</span><span>Retour Admin</span>
   </button>}
   <button onClick={()=>{if(typeof adminBack==="function")adminBack();else onLogout();}} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,border:"none",background:"transparent",color:C.td,fontSize:10,cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"background .12s"}} onMouseEnter={e=>{e.currentTarget.style.background=C.rD;e.currentTarget.style.color=C.r;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.td;}}>
    <span style={{fontSize:12}}>↩</span><span>Déconnexion</span>
   </button>
  </div>
 </aside>;
}

/* ===== WAVE 2 GAME-CHANGERS ===== */

/* 5. WAR ROOM */
/* 5. WAR ROOM */
export function AdminClientsTab({clients,socs}){
 const[clSearch,setClSearch]=useState("");const[clSort,setClSort]=useState("ca");
 const allCl=(clients||[]);const activeAll=allCl.filter(c=>c.status==="active");const churnedAll=allCl.filter(c=>c.status==="churned");
 const totalMRR=activeAll.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 const filtered=allCl.filter(c=>!clSearch||c.name?.toLowerCase().includes(clSearch.toLowerCase())||socs.find(s=>s.id===c.socId)?.nom?.toLowerCase().includes(clSearch.toLowerCase()));
 const sorted=[...filtered].sort((a,b)=>{if(clSort==="ca")return clientMonthlyRevenue(b)-clientMonthlyRevenue(a);if(clSort==="society")return(a.socId||"").localeCompare(b.socId||"");return(a.name||"").localeCompare(b.name||"");});
 return <><div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE,marginBottom:14}}>👥 Clients — Toutes sociétés</div>
  <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:14}}>
   <KPI label="Total clients" value={allCl.length} accent={C.b} icon="👥" delay={1}/>
   <KPI label="Actifs" value={activeAll.length} accent={C.g} icon="✅" delay={2}/>
   <KPI label="Perdus" value={churnedAll.length} accent={C.r} icon="❌" delay={3}/>
   <KPI label="MRR Global" value={`${fmt(totalMRR)}€`} accent={C.acc} icon="💰" delay={4}/>
   <KPI label="LTV Moyen" value={activeAll.length>0?`${fmt(Math.round(totalMRR/activeAll.length*12))}€`:"—"} accent={C.v} icon="📊" delay={5}/>
  </div>
  <div style={{display:"flex",gap:8,marginBottom:12}}>
   <input value={clSearch} onChange={e=>setClSearch(e.target.value)} placeholder="🔍 Rechercher un client..." style={{flex:1,padding:"8px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
   <select value={clSort} onChange={e=>setClSort(e.target.value)} style={{padding:"8px 10px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT,outline:"none"}}><option value="ca">Trier par CA</option><option value="society">Par société</option><option value="name">Par nom</option></select>
  </div>
  {sorted.slice(0,30).map((c,i)=>{const s=socs.find(x=>x.id===c.socId);const rev=clientMonthlyRevenue(c);return <div key={c.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.card,borderRadius:10,border:`1px solid ${C.brd}`,marginBottom:3}}>
   <span style={{width:6,height:6,borderRadius:3,background:s?.color||C.td,flexShrink:0}}/>
   <div style={{flex:1,minWidth:0}}><span style={{fontWeight:600,fontSize:11}}>{c.name}</span>
    <span style={{fontSize:8,color:s?.color||C.td,background:(s?.color||C.td)+"15",padding:"1px 6px",borderRadius:6,marginLeft:6,fontWeight:600}}>{s?.nom||"?"}</span>
   </div>
   <span style={{fontSize:9,color:C.td}}>{CLIENT_STATUS[c.status]?.l||c.status}</span>
   <span style={{fontWeight:700,fontSize:11,color:C.acc,minWidth:50,textAlign:"right"}}>{fmt(rev)}€</span>
  </div>;})}
  {sorted.length>30&&<div style={{color:C.td,fontSize:10,textAlign:"center",padding:8}}>… et {sorted.length-30} autres clients</div>}
 </>;
}
/* 7. SYNERGIES AUTOMATIQUES */
/* 7. SYNERGIES AUTOMATIQUES */
export function SynergiesAutoPanel({socs,reps,clients,ghlData}){
 const cm=curM();
 const[statuses,setStatuses]=useState(()=>{try{return JSON.parse(localStorage.getItem("synergies_auto_status"))||{};}catch{return{};}});
 const saveStatus=(id,st)=>{const ns={...statuses,[id]:st};setStatuses(ns);try{localStorage.setItem("synergies_auto_status",JSON.stringify(ns));sSet("synergies_auto_status",ns);}catch{}};
 const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 const synergies=useMemo(()=>{const syns=[];
  // 1. Client overlap
  const clientsBySoc={};actS.forEach(s=>{clientsBySoc[s.id]=(clients||[]).filter(c=>c.socId===s.id).map(c=>({...c,socNom:s.nom}));});
  const allCls=Object.values(clientsBySoc).flat();
  const seen={};allCls.forEach(c=>{const key=normalizeStr(c.name||c.email||"");if(!key)return;if(!seen[key])seen[key]=[];seen[key].push(c);});
  Object.entries(seen).filter(([,arr])=>arr.length>1).forEach(([,arr])=>{const names=[...new Set(arr.map(c=>c.socNom))];if(names.length>1)syns.push({id:`overlap_${arr[0].name}`,icon:"🔗",desc:`${arr[0].name} est client chez ${names.join(" ET ")}`,socs:names,value:2000,type:"overlap"});});
  // 2. Domain match
  const domainsBySoc={};actS.forEach(s=>{const cls=(clients||[]).filter(c=>c.socId===s.id);const doms={};cls.forEach(c=>{if(c.domain){doms[c.domain]=(doms[c.domain]||0)+1;}});domainsBySoc[s.id]={nom:s.nom,act:s.act,domains:doms};});
  actS.forEach(s1=>{actS.forEach(s2=>{if(s1.id>=s2.id)return;const d1=domainsBySoc[s1.id];const d2=domainsBySoc[s2.id];
   Object.entries(d1.domains).forEach(([dom,count])=>{if(count>=2&&(d2.act||"").toLowerCase().includes(dom.toLowerCase().slice(0,4))){syns.push({id:`domain_${s1.id}_${s2.id}_${dom}`,icon:"💡",desc:`${s1.nom} a ${count} clients ${dom} — ${s2.nom} pourrait les accompagner en ${s2.act}`,socs:[s1.nom,s2.nom],value:count*1500,type:"domain"});}});
  });});
  // 3. Performance gap
  actS.forEach(s1=>{actS.forEach(s2=>{if(s1.id>=s2.id)return;
   const r1=gr(reps,s1.id,cm);const r2=gr(reps,s2.id,cm);if(!r1||!r2)return;
   const l1=pf(r1.leads);const c1=pf(r1.leadsClos);const l2=pf(r2.leads);const c2=pf(r2.leadsClos);
   const conv1=l1>0?c1/l1:0;const conv2=l2>0?c2/l2:0;
   if(conv1>0&&conv2>0&&conv1/conv2>1.8){syns.push({id:`perf_${s1.id}_${s2.id}`,icon:"⚡",desc:`Le closer de ${s1.nom} convertit ${Math.round(conv1/conv2)}× mieux que ${s2.nom} — organise un partage de process`,socs:[s1.nom,s2.nom],value:3000,type:"performance"});}
   else if(conv2>0&&conv1>0&&conv2/conv1>1.8){syns.push({id:`perf_${s2.id}_${s1.id}`,icon:"⚡",desc:`Le closer de ${s2.nom} convertit ${Math.round(conv2/conv1)}× mieux que ${s1.nom} — organise un partage de process`,socs:[s2.nom,s1.nom],value:3000,type:"performance"});}
  });});
  // 4. Peak correlation
  actS.forEach(s1=>{actS.forEach(s2=>{if(s1.id>=s2.id)return;
   const r1=gr(reps,s1.id,cm);const r2=gr(reps,s2.id,cm);
   if(r1&&r2&&pf(r1.leads)>5&&pf(r2.leads)>5){syns.push({id:`peak_${s1.id}_${s2.id}`,icon:"📊",desc:`${s1.nom} et ${s2.nom} ont des pics simultanés — mutualisez le budget pub`,socs:[s1.nom,s2.nom],value:1500,type:"peak"});}
  });});
  // 5. Revenue opportunity (upsell)
  (clients||[]).filter(c=>c.status==="active"&&clientMonthlyRevenue(c)<800&&clientMonthlyRevenue(c)>0).slice(0,3).forEach(c=>{const s=socs.find(x=>x.id===c.socId);if(s)syns.push({id:`upsell_${c.id}`,icon:"💰",desc:`${c.name} chez ${s.nom} paie ${fmt(clientMonthlyRevenue(c))}€/mois — potentiel upsell`,socs:[s.nom],value:2500,type:"upsell"});});
  return syns.sort((a,b)=>b.value-a.value);
 },[actS,clients,reps,ghlData,cm]);
 const statusOpts=["","vu","en_cours","fait"];const statusLabels={"":"—","vu":"👁 Vu","en_cours":"🔄 En cours","fait":"✅ Fait"};
 const statusColors={"":"transparent","vu":C.bD,"en_cours":C.oD,"fait":C.gD};
 return <Sect title="🤝 SYNERGIES DÉTECTÉES" sub={`${synergies.length} opportunités identifiées`}>
  {synergies.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Pas encore assez de données pour détecter des synergies</div></Card>}
  {synergies.map((s,i)=>{const st=statuses[s.id]||"";const borderColor=s.value>=2500?"#FFAA00":s.value>=1500?"#60a5fa":"#71717a";
   return <Card key={s.id} style={{padding:14,marginBottom:6,borderLeft:`3px solid ${borderColor}`}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
     <span style={{fontSize:18}}>{s.icon}</span>
     <div style={{flex:1}}>
      <div style={{fontSize:11,fontWeight:600,lineHeight:1.4,marginBottom:4}}>{s.desc}</div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
       {s.socs.map(n=><span key={n} style={{fontSize:8,padding:"2px 6px",borderRadius:4,background:C.accD,color:C.acc,fontWeight:600}}>{n}</span>)}
       <span style={{fontSize:9,color:C.g,fontWeight:700}}>~{fmt(s.value)}€</span>
      </div>
     </div>
     <select value={st} onChange={e=>saveStatus(s.id,e.target.value)} style={{fontSize:9,padding:"3px 6px",borderRadius:6,border:`1px solid ${C.brd}`,background:statusColors[st]||C.bg,color:C.t,fontFamily:FONT,cursor:"pointer"}}>
      {statusOpts.map(o=><option key={o} value={o}>{statusLabels[o]}</option>)}
     </select>
    </div>
   </Card>;})}
 </Sect>;
}

/* 8. WIDGET EMBED */
/* 8. WIDGET EMBED */
export function WidgetEmbed({soc,clients}){
 const[widgetTheme,setWidgetTheme]=useState("dark");
 const activeClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active").length;
 const embedCode=`<iframe src="https://scale-corp.vercel.app/#widget/${soc.id}" width="300" height="200" style="border:none;border-radius:12px;"></iframe>`;
 const[copied,setCopied]=useState(false);
 return <Card style={{padding:16,marginTop:12}}>
  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>📱</span><span style={{fontWeight:700,fontSize:12}}>Widget Porteur</span></div>
  {/* Preview */}
  <div style={{marginBottom:12}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:6}}>APERÇU</div>
   <WidgetCard soc={soc} clientCount={activeClients} theme={widgetTheme}/>
  </div>
  {/* Theme toggle */}
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
   <span style={{fontSize:10,color:C.td}}>Thème:</span>
   {["dark","light"].map(t=><button key={t} onClick={()=>setWidgetTheme(t)} style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${widgetTheme===t?C.acc+"44":C.brd}`,background:widgetTheme===t?C.accD:"transparent",color:widgetTheme===t?C.acc:C.td,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{t==="dark"?"🌙 Dark":"☀️ Light"}</button>)}
  </div>
  {/* Embed code */}
  <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:4}}>CODE EMBED</div>
  <div style={{position:"relative"}}>
   <pre style={{background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,padding:"8px 10px",fontSize:9,color:C.t,overflowX:"auto",whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{embedCode}</pre>
   <button onClick={()=>{navigator.clipboard?.writeText(embedCode);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{position:"absolute",top:6,right:6,padding:"3px 8px",borderRadius:4,border:`1px solid ${C.brd}`,background:C.card,color:copied?C.g:C.td,fontSize:9,cursor:"pointer",fontFamily:FONT}}>{copied?"✅ Copié":"📋 Copier"}</button>
  </div>
 </Card>;
}

export function WidgetCard({soc,clientCount,theme}){
 const isDark=theme==="dark";
 const bg=isDark?"rgba(14,14,22,.85)":"rgba(255,255,255,.9)";
 const txt=isDark?"#e4e4e7":"#1a1a1a";const sub=isDark?"#71717a":"#666";const brd=isDark?"rgba(255,255,255,.08)":"rgba(0,0,0,.08)";
 return <div style={{width:280,padding:16,background:bg,backdropFilter:"blur(20px)",border:`1px solid ${brd}`,borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,.2)"}}>
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
   {soc.logoUrl?<img src={soc.logoUrl} alt={soc.nom||"Logo société"} style={{width:32,height:32,borderRadius:8,objectFit:"cover"}}/>:
    <div style={{width:32,height:32,borderRadius:8,background:(soc.brandColor||soc.color)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:soc.brandColor||soc.color}}>{(soc.nom||"?")[0]}</div>}
   <div><div style={{fontWeight:800,fontSize:13,color:txt,fontFamily:FONT_TITLE}}>{soc.nom}</div><div style={{fontSize:9,color:sub}}>{soc.act}</div></div>
  </div>
  <div style={{fontSize:11,color:txt,marginBottom:6}}>🔥 <strong>{clientCount}</strong> clients accompagnés ce mois</div>
  <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:6,background:"rgba(255,170,0,.12)",border:"1px solid rgba(255,170,0,.2)"}}>
   <span style={{fontSize:10}}>⭐</span><span style={{fontSize:9,fontWeight:700,color:"#FFAA00"}}>Score ECS™</span>
  </div>
  <div style={{marginTop:8,borderTop:`1px solid ${brd}`,paddingTop:6,textAlign:"center"}}>
   <span style={{fontSize:8,color:sub}}>Propulsé par </span><span style={{fontSize:8,color:"#FFAA00",fontWeight:700}}>L'Incubateur ECS</span>
  </div>
 </div>;
}

export function WidgetRenderer({socId,socs,clients}){
 const soc=socs.find(s=>s.id===socId);
 if(!soc)return <div style={{padding:20,textAlign:"center",color:"#71717a",fontSize:12}}>Société introuvable</div>;
 const activeClients=(clients||[]).filter(c=>c.socId===socId&&c.status==="active").length;
 return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",fontFamily:FONT}}>
  <WidgetCard soc={soc} clientCount={activeClients} theme="dark"/>
 </div>;
}

/* ═══════════════════════════ PULSE — Live Monitoring Dashboard ═══════════════════════════ */
/* ============ CLIENT PORTAL ============ */
export function ClientPortal({socId,clientId,socs,clients,ghlData}){
 const soc=socs.find(s=>s.id===socId);
 const client=(clients||[]).find(c=>c.id===clientId&&c.socId===socId);
 if(!soc||!client)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,fontFamily:FONT,color:C.td}}>Portail introuvable</div>;
 const gd=ghlData?.[socId];
 const calEvts=(gd?.calendarEvents||[]).filter(e=>new Date(e.startTime||0)>new Date()).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime));
 const nextCall=calEvts[0];
 const statusInfo=CLIENT_STATUS[client.status]||{l:client.status,c:C.td,icon:"?"};
 const monthsSince=sinceMonths(client.startDate);
 const totalMonths=client.billing?.commitment||12;
 const progress=Math.min(100,Math.round(monthsSince/totalMonths*100));
 const accent=soc.brandColor||soc.color||C.acc;
 return <div className="glass-bg" style={{minHeight:"100vh",fontFamily:FONT,padding:"40px 16px",display:"flex",justifyContent:"center"}}>
  <style>{CSS}</style>
  <div style={{width:"100%",maxWidth:500}}>
   <div className="glass-card-static" style={{padding:28,textAlign:"center",marginBottom:16}}>
    <div style={{width:64,height:64,borderRadius:32,background:accent+"22",border:`2px solid ${accent}44`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:accent,marginBottom:12}}>{(soc.nom||"?")[0]}</div>
    <div style={{fontSize:20,fontWeight:900,color:C.t}}>{client.name}</div>
    <div style={{fontSize:12,color:C.td,marginTop:4}}>{soc.nom} · {soc.act}</div>
    <div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:8,padding:"4px 12px",borderRadius:20,background:statusInfo.c+"18",color:statusInfo.c,fontSize:11,fontWeight:700}}>{statusInfo.icon} {statusInfo.l}</div>
   </div>
   {nextCall&&<div className="glass-card-static" style={{padding:18,marginBottom:16}}>
    <div style={{fontWeight:700,fontSize:12,color:C.t,marginBottom:8}}>📅 Prochain rendez-vous</div>
    <div style={{fontSize:14,fontWeight:800,color:C.acc}}>{new Date(nextCall.startTime).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div>
    <div style={{fontSize:12,color:C.td,marginTop:2}}>{new Date(nextCall.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})} — {nextCall.title||"RDV"}</div>
   </div>}
   <div className="glass-card-static" style={{padding:18,marginBottom:16}}>
    <div style={{fontWeight:700,fontSize:12,color:C.t,marginBottom:8}}>📊 Progression</div>
    <div style={{background:C.brd,borderRadius:6,height:10,overflow:"hidden",marginBottom:6}}><div style={{height:"100%",borderRadius:6,background:`linear-gradient(90deg,${accent},${accent}cc)`,width:`${progress}%`,transition:"width 1s ease"}}/></div>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.td}}><span>{monthsSince} mois</span><span>{progress}%</span><span>{totalMonths} mois</span></div>
   </div>
   {client.billing&&<div className="glass-card-static" style={{padding:18,marginBottom:16}}>
    <div style={{fontWeight:700,fontSize:12,color:C.t,marginBottom:8}}>💳 Facturation</div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
     <span style={{fontSize:13,color:C.t}}>{fmt(clientMonthlyRevenue(client))}€/{client.billing?.freq==="yearly"?"an":"mois"}</span>
     <span style={{padding:"3px 10px",borderRadius:12,background:C.gD,color:C.g,fontSize:10,fontWeight:700}}>✅ Actif</span>
    </div>
   </div>}
   <div style={{textAlign:"center",marginTop:20}}>
    <a href={`mailto:${soc.email||""}`} style={{display:"inline-block",padding:"12px 28px",borderRadius:12,background:`linear-gradient(135deg,${accent},${accent}cc)`,color:"#0a0a0f",fontSize:13,fontWeight:800,textDecoration:"none",fontFamily:FONT}}>📧 Contacter {soc.nom}</a>
   </div>
   <div style={{textAlign:"center",marginTop:24,fontSize:10,color:C.tm}}>Propulsé par L'Incubateur ECS</div>
  </div>
 </div>;
}

/* ============ INVESTOR BOARD ============ */
/* ============ INVESTOR BOARD ============ */
export function InvestorBoard({socs,reps,allM,hold,pin:inputPin}){
 const[authed,setAuthed]=useState(false);
 const[pinInput,setPinInput]=useState("");
 const boardPin=hold?.boardPin||"investor";
 const cm=curM();const pm=prevM(cm);
 useEffect(()=>{if(inputPin===boardPin)setAuthed(true);},[inputPin,boardPin]);
 if(!authed)return <div className="glass-bg" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
  <style>{CSS}</style>
  <div className="glass-card-static" style={{padding:32,textAlign:"center",width:340,maxWidth:"95vw"}}>
   <div style={{fontSize:40,marginBottom:12}}>🔒</div>
   <div style={{fontWeight:800,fontSize:16,color:C.t,marginBottom:4}}>Investor Board</div>
   <div style={{fontSize:11,color:C.td,marginBottom:16}}>Entrez le code d'accès</div>
   <input value={pinInput} onChange={e=>setPinInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&pinInput===boardPin)setAuthed(true);}} placeholder="Code PIN" type="password" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:14,fontFamily:FONT,textAlign:"center",outline:"none",marginBottom:12}}/>
   <button onClick={()=>{if(pinInput===boardPin)setAuthed(true);}} style={{width:"100%",padding:"10px 0",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.acc},#FF9D00)`,color:"#0a0a0f",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FONT}}>Accéder</button>
  </div>
 </div>;
 const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 const totalCA=actS.reduce((a,s)=>a+pf(gr(reps,s.id,cm)?.ca),0);
 const prevTotalCA=actS.reduce((a,s)=>a+pf(gr(reps,s.id,pm)?.ca),0);
 const growthPct=prevTotalCA>0?Math.round((totalCA-prevTotalCA)/prevTotalCA*100):0;
 return <div className="glass-bg" style={{minHeight:"100vh",fontFamily:FONT,padding:"32px 24px"}}>
  <style>{CSS}</style>
  <div style={{maxWidth:900,margin:"0 auto"}}>
   <div style={{textAlign:"center",marginBottom:32}}>
    <div style={{fontSize:14,fontWeight:700,color:C.acc,letterSpacing:2,marginBottom:4}}>INVESTOR BOARD</div>
    <div style={{fontSize:28,fontWeight:900,color:C.t,fontFamily:FONT_TITLE}}>{hold?.name||"L'Incubateur ECS"}</div>
    <div style={{fontSize:12,color:C.td,marginTop:4}}>{ml(cm)}</div>
   </div>
   <div className="admin-stats-row" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:32}}>
    {[{l:"Sociétés",v:actS.length,c:C.b},{l:"CA Total",v:fmt(totalCA)+"€",c:C.g},{l:"Croissance",v:`${growthPct>=0?"+":""}${growthPct}%`,c:growthPct>=0?C.g:C.r}].map((k,i)=><div key={i} className="glass-card-static admin-card" style={{padding:24,textAlign:"center"}}><div style={{fontSize:32,fontWeight:900,color:k.c,fontFamily:FONT_TITLE}}>{k.v}</div><div style={{fontSize:11,color:C.td,marginTop:6}}>{k.l}</div></div>)}
   </div>
   <div className="admin-grid rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:16}}>
    {actS.map(s=>{const sCa=pf(gr(reps,s.id,cm)?.ca);const sPrev=pf(gr(reps,s.id,pm)?.ca);const sTrend=sPrev>0?Math.round((sCa-sPrev)/sPrev*100):0;const hs=healthScore(s,reps);
     return <div key={s.id} className="glass-card" style={{padding:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
       <div style={{width:36,height:36,borderRadius:18,background:s.color+"22",border:`1.5px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:s.color}}>{(s.nom||"?")[0]}</div>
       <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14,color:C.t}}>{s.nom}</div><div style={{fontSize:10,color:C.td}}>{s.act}</div></div>
       <GradeBadge grade={hs.grade} color={hs.color}/>
      </div>
      <div style={{fontSize:22,fontWeight:900,color:C.t}}>{fmt(sCa)}€</div>
      <div style={{fontSize:11,color:sTrend>=0?C.g:C.r,fontWeight:700,marginTop:2}}>{sTrend>=0?"📈 +":"📉 "}{sTrend}%</div>
     </div>;
    })}
   </div>
   <div style={{textAlign:"center",marginTop:40,fontSize:11,color:C.tm}}>Propulsé par L'Incubateur ECS</div>
  </div>
 </div>;
}



/* MAIN APP */

