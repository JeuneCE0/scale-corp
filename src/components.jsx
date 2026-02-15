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

export function Badge({s}){const m={active:[C.gD,C.g,"Active"],lancement:[C.oD,C.o,"Lancement"],signature:[C.bD,C.b,"Signature"],inactive:[C.rD,C.r,"Inactive"]};const[bg2,c2,l]=m[s]||m.inactive;return <span style={{background:bg2,color:c2,padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:700,letterSpacing:.5}}>{l}</span>;}
export function IncubBadge({incub}){if(!incub)return null;const lbl=sinceLbl(incub);return <span style={{background:C.vD,color:C.v,padding:"2px 7px",borderRadius:20,fontSize:9,fontWeight:600}}>📅 {lbl}</span>;}
export function GradeBadge({grade,color,size="sm"}){const s=size==="lg"?{w:32,h:32,fs:16,r:9,bw:2}:{w:22,h:22,fs:11,r:6,bw:1.5};return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:s.w,height:s.h,borderRadius:s.r,background:color+"15",color,fontWeight:900,fontSize:s.fs,border:`${s.bw}px solid ${color}33`,flexShrink:0}}>{grade}</span>;}
export function KPI({label,value,sub,accent,small,delay=0,icon}){
 return <div className={`fu d${delay} glass-card-static`} style={{padding:small?"10px 12px":"16px 18px",flex:"1 1 130px",minWidth:small?90:120,transition:"all .3s cubic-bezier(.4,0,.2,1)"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=`${accent||C.acc}33`;e.currentTarget.style.boxShadow=`0 0 20px ${(accent||C.acc)}15`;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.06)";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,.3)";e.currentTarget.style.transform="translateY(0)";}}>
  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}>{icon&&<span style={{fontSize:11}}>{icon}</span>}<span style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",fontFamily:FONT_TITLE}}>{label}</span></div>
  <div style={{fontSize:small?16:28,fontWeight:900,color:accent||C.t,lineHeight:1.1}}>{value}</div>
  {sub&&<div style={{color:C.td,fontSize:9,marginTop:3}}>{sub}</div>}
 </div>;
}
export function PBar({value,max,color,h=5}){const w=clamp(pct(value,max),0,100);return <div style={{background:C.brd,borderRadius:h,height:h,overflow:"hidden"}}><div className="pg" style={{background:color||C.acc,height:"100%",width:`${w}%`,"--w":`${w}%`,borderRadius:h}}/></div>;}
export function Btn({children,onClick,v="primary",small,style:sx,disabled,full}){
 const t={primary:{background:`linear-gradient(135deg,#FFBF00,#FF9D00)`,color:"#0a0a0f",boxShadow:"0 0 20px rgba(255,170,0,.2)"},secondary:{background:"rgba(255,255,255,.03)",color:C.t,border:"1px solid rgba(255,255,255,.08)",backdropFilter:"blur(10px)"},ghost:{background:"transparent",color:C.td,border:"1px solid rgba(255,255,255,.04)"},danger:{background:"rgba(248,113,113,.1)",color:C.r,border:"1px solid rgba(248,113,113,.15)"},success:{background:"rgba(52,211,153,.1)",color:C.g,border:"1px solid rgba(52,211,153,.15)"},ai:{background:`linear-gradient(135deg,${C.v},${C.acc})`,color:"#0a0a0f",boxShadow:`0 0 20px rgba(167,139,250,.2)`}};
 return <button className="ba" disabled={disabled} onClick={onClick} style={{border:"none",borderRadius:10,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:FONT,opacity:disabled?0.35:1,padding:small?"5px 10px":"9px 18px",fontSize:small?10:12,width:full?"100%":"auto",letterSpacing:.3,...t[v],...sx}}>{children}</button>;
}
export function Inp({label,value,onChange,type="text",placeholder,suffix,textarea,small,note,onKeyDown}){
 return <div style={{marginBottom:small?6:10}}>
  {label&&<label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3,letterSpacing:.3}}>{label}</label>}
  <div className="glass-input" style={{display:"flex",alignItems:"center",borderRadius:10,overflow:"hidden"}} onFocus={e=>{e.currentTarget.style.borderColor="rgba(255,170,0,.3)";e.currentTarget.style.boxShadow="0 0 16px rgba(255,170,0,.08)";}} onBlur={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.06)";e.currentTarget.style.boxShadow="none";}}>
   {textarea?<textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={2} style={{flex:1,background:"transparent",border:"none",color:C.t,padding:"7px 10px",fontSize:12,fontFamily:FONT,outline:"none",resize:"vertical"}}/>
    :<input type={type} value={value==null?"":value} onChange={e=>onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} style={{flex:1,background:"transparent",border:"none",color:C.t,padding:small?"6px 10px":"8px 10px",fontSize:12,fontFamily:FONT,outline:"none",width:"100%"}}/>}
   {suffix&&<span style={{padding:"0 8px 0 2px",color:C.td,fontSize:11,flexShrink:0}}>{suffix}</span>}
  </div>{note&&<div style={{color:C.tm,fontSize:9,marginTop:2}}>{note}</div>}</div>;
}
export function Sel({label,value,onChange,options}){return <div style={{marginBottom:10}}>{label&&<label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3,letterSpacing:.3}}>{label}</label>}<select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.t,padding:"8px 10px",fontSize:12,fontFamily:FONT,outline:"none"}}>{options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>;}
export function Sect({children,title,sub,right}){return <div className="fu" style={{marginTop:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8,flexWrap:"wrap",gap:4}}><div>{title&&<h2 style={{color:C.t,fontSize:13,fontWeight:800,margin:0,letterSpacing:1,textTransform:"uppercase",fontFamily:FONT_TITLE}}>{title}</h2>}{sub&&<p style={{color:C.td,fontSize:10,margin:"1px 0 0"}}>{sub}</p>}</div>{right}</div>{children}</div>;}
export function Card({children,style:sx,onClick,accent,delay=0}){return <div className={`fu d${Math.min(delay,8)} ${onClick?"glass-card":"glass-card-static"}`} onClick={onClick} style={{padding:14,cursor:onClick?"pointer":"default",...(accent?{borderLeft:`3px solid ${accent}`}:{}),...sx}} >{children}</div>;}
export function Modal({open,onClose,title,children,wide}){if(!open)return null;return <div className="fi" onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"28px 14px",overflowY:"auto",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}><div className="mi glass-modal" onClick={e=>e.stopPropagation()} style={{borderRadius:18,padding:22,width:wide?700:440,maxWidth:"100%"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.t}}>{title}</h3><Btn v="ghost" small onClick={onClose}>✕</Btn></div>{children}</div></div>;}
export function CTip({active,payload,label}){if(!active||!payload)return null;return <div style={{background:"rgba(14,14,22,.85)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"8px 12px",boxShadow:"0 8px 32px rgba(0,0,0,.5)"}}><div style={{color:C.t,fontWeight:700,fontSize:9,marginBottom:3}}>{label}</div>{payload.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,marginBottom:1}}><span style={{width:4,height:4,borderRadius:2,background:p.color}}/><span style={{color:C.td,fontSize:9}}>{p.name}:</span><span style={{color:C.t,fontSize:9,fontWeight:600}}>{fmt(p.value)}€</span></div>)}</div>;}
export function Toggle({on,onToggle,label}){return <div onClick={onToggle} style={{display:"inline-flex",alignItems:"center",gap:7,cursor:"pointer",padding:"5px 10px",borderRadius:8,background:on?C.accD:C.card2,border:`1px solid ${on?C.acc+"66":C.brd}`,transition:"all .15s"}}><div style={{width:26,height:14,borderRadius:7,background:on?C.acc:C.brd,position:"relative",transition:"background .2s"}}><div style={{width:10,height:10,borderRadius:5,background:on?"#0a0a0f":C.td,position:"absolute",top:2,left:on?14:2,transition:"left .2s"}}/></div><span style={{fontSize:10,fontWeight:600,color:on?C.acc:C.td}}>{label}</span></div>;}
export function ActionItem({a,socs,onToggle,onDelete}){const s=socs.find(x=>x.id===a.socId);const late=!a.done&&a.deadline<curM();return <div className="fu" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:8,border:`1px solid ${late?C.r+"44":C.brd}`,marginBottom:3}}><div onClick={()=>onToggle(a.id)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${a.done?C.g:C.brd}`,background:a.done?C.gD:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{a.done&&<span style={{color:C.g,fontSize:11}}>✓</span>}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:a.done?C.td:C.t,textDecoration:a.done?"line-through":"none"}}>{a.text}</div><div style={{fontSize:10,color:late?C.r:C.td}}>{s&&<><span style={{width:5,height:5,borderRadius:3,background:s.color,display:"inline-block",marginRight:4}}/>{s.nom} · </>}{ml(a.deadline)}{late&&" ⚠ En retard"}</div></div>{onDelete&&<Btn v="ghost" small onClick={()=>onDelete(a.id)} style={{fontSize:9,padding:"2px 6px"}}>✕</Btn>}</div>;}
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
export function MeetingMode({socs,reps,hold,actions,pulses,allM,onExit}){
 const cM2=curM();const actS=socs.filter(s=>s.stat==="active");const hc=calcH(socs,reps,hold,cM2);
 const[step,setStep]=useState(0);const[timer,setTimer]=useState(0);const[running,setRunning]=useState(false);const[notes,setNotes]=useState("");
 const steps=[{title:"Vue d'ensemble",icon:"📊"},{title:"Alertes & Actions",icon:"⚠"},...actS.map(s=>({title:s.nom,icon:"🏢",soc:s})),{title:"Décisions & Prochaines étapes",icon:"✅"}];
 useEffect(()=>{let id;if(running)id=setInterval(()=>setTimer(t=>t+1),1e3);return()=>clearInterval(id);},[running]);
 const fmtT=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
 return <div className="glass-bg" style={{minHeight:"100vh",fontFamily:FONT,color:C.t}}>
  <style>{CSS}</style>
  <div style={{background:"rgba(14,14,22,.7)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.06)",padding:"14px 20px"}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div><div style={{color:C.acc,fontSize:10,fontWeight:700,letterSpacing:2}}>MODE RÉUNION</div><h1 style={{margin:0,fontSize:18,fontWeight:900}}>{hold?.brand?.name||"Scale Corp"} — {ml(cM2)}</h1></div>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
    <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,fontVariantNumeric:"tabular-nums",color:running?C.g:C.t}}>{fmtT(timer)}</div><div style={{display:"flex",gap:4,marginTop:4}}><Btn small v={running?"danger":"success"} onClick={()=>setRunning(!running)}>{running?"⏸":"▶"}</Btn><Btn small v="ghost" onClick={()=>setTimer(0)}>↻</Btn></div></div>
    <Btn v="ghost" onClick={onExit}>✕ Quitter</Btn>
    </div>
   </div>
   <div style={{display:"flex",gap:2,marginTop:12,overflowX:"auto"}}>{steps.map((s,i)=><button key={i} onClick={()=>setStep(i)} style={{padding:"8px 14px",borderRadius:8,fontSize:11,fontWeight:step===i?700:500,border:"none",background:step===i?C.acc+"22":"transparent",color:step===i?C.acc:C.td,cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap"}}>{s.icon} {s.title}</button>)}</div>
  </div>
  <div className="page-wrap" style={{padding:"20px 30px",maxWidth:900,margin:"0 auto"}}>
   {step===0&&<div className="si">
    <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14}}>
    <KPI label="CA Groupe" value={`${fmt(actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca),0))}€`} accent={C.acc}/><KPI label="Marge" value={`${fmt(actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca)-pf(gr(reps,s.id,cM2)?.charges),0))}€`} accent={C.g}/><KPI label="/ Fondateur" value={`${fmt(hc.pf)}€`} accent={C.o}/><KPI label="Pipeline" value={`${fmt(socs.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.pipeline),0))}€`} accent={C.b}/>
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:16}}>{actS.map(s=>{const hs=healthScore(s,reps);const r=gr(reps,s.id,cM2);
     const myCl=(clients||[]).filter(c=>c.socId===s.id&&c.status==="active");const chCl=(clients||[]).filter(c=>c.socId===s.id&&c.status==="churned").length;const totCl=myCl.length+chCl;
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
    <div style={{width:40,height:40,borderRadius:10,background:`${s.color}22`,border:`2px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:18,color:s.color,overflow:"hidden"}}>{s.logoUrl?<img src={s.logoUrl} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:s.nom[0]}</div>
    <div style={{flex:1}}><div style={{fontWeight:900,fontSize:18}}>{s.nom}</div><div style={{color:C.td,fontSize:11,display:"flex",gap:6,alignItems:"center"}}><span>{s.porteur} — {s.act}</span>{s.incub&&<span style={{color:C.v,fontSize:9,background:C.vD,padding:"1px 6px",borderRadius:8}}>📅 {sinceLbl(s.incub)}</span>}</div></div>
    <GradeBadge grade={hs.grade} color={hs.color} size="lg"/>
    </div>
    <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
    <KPI label="CA" value={r?`${fmt(r.ca)}€`:"—"} accent={C.acc} small/><KPI label="Marge" value={r?`${fmt(pf(r.ca)-pf(r.charges))}€`:"—"} accent={C.g} small/>
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
  <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:10}}>{DEAL_STAGES.map((stage,si)=><div key={si} style={{minWidth:170,flex:"1 1 170px"}}>
   <div style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:6,textAlign:"center"}}>{stage}</div>
   {deals.filter(d=>d.stage===si).map(d=><Card key={d.id} style={{marginBottom:5,padding:"10px 12px",cursor:"pointer"}} onClick={()=>setEdit({...d})}>
    <div style={{fontWeight:700,fontSize:12,marginBottom:2}}>{d.nom}</div>
    <div style={{fontSize:10,color:C.td}}>{d.contact}</div>
    {d.value>0&&<div style={{fontSize:11,fontWeight:700,color:C.acc,marginTop:2}}>{fmt(d.value)}€/mois</div>}
    <div style={{display:"flex",gap:3,marginTop:6}}>{si>0&&<Btn v="ghost" small onClick={e=>{e.stopPropagation();move(d.id,-1);}}>←</Btn>}{si<DEAL_STAGES.length-1&&<Btn v="ghost" small onClick={e=>{e.stopPropagation();move(d.id,1);}}>→</Btn>}</div>
   </Card>)}
  </div>)}</div>
  <Modal open={!!edit} onClose={()=>setEdit(null)} title={edit?.nom||"Nouveau deal"}>
   {edit&&<><Inp label="Nom société" value={edit.nom} onChange={v=>setEdit({...edit,nom:v})}/><Inp label="Contact" value={edit.contact} onChange={v=>setEdit({...edit,contact:v})}/><Inp label="Valeur estimée" value={edit.value} onChange={v=>setEdit({...edit,value:pf(v)})} type="number" suffix="€/mois"/><Sel label="Étape" value={edit.stage} onChange={v=>setEdit({...edit,stage:parseInt(v)})} options={DEAL_STAGES.map((s,i)=>({v:i,l:s}))}/><Inp label="Notes" value={edit.notes} onChange={v=>setEdit({...edit,notes:v})} textarea/>
   <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={saveDeal}>Sauver</Btn><Btn v="secondary" onClick={()=>setEdit(null)}>Annuler</Btn>{deals.find(d=>d.id===edit.id)&&<Btn v="danger" onClick={()=>{del(edit.id);setEdit(null);}} style={{marginLeft:"auto"}}>Supprimer</Btn>}</div></>}
  </Modal>
 </>;
}
/* BANKING - REVOLUT */
export const TX_CATEGORIES=[
 {id:"all",label:"Toutes",icon:""},
 {id:"revenus",label:"💰 Revenus",icon:"💰"},
 {id:"loyer",label:"🏠 Loyer",icon:"🏠"},
 {id:"pub",label:"📢 Publicité",icon:"📢"},
 {id:"abonnements",label:"💻 Abonnements",icon:"💻"},
 {id:"equipe",label:"👥 Équipe",icon:"👥"},
 {id:"transfert",label:"🏦 Transfert interne",icon:"🏦"},
 {id:"autres",label:"📦 Autres dépenses",icon:"📦"},
 {id:"dividendes",label:"🏛️ Dividendes Holding",icon:"🏛️"},
];
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
  {filtered.length===0&&<div className="fu" style={{textAlign:"center",padding:40,color:C.td}}>Aucun résultat</div>}
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
/* ===== GAMIFICATION XP & BADGES ===== */
/* ===== GAMIFICATION XP & BADGES ===== */
export function GamificationPanel({soc,ca,myClients,streak,reps,allM,ghlData}){
 const BADGES=[
  {id:"first_client",label:"Premier Client 🎉",desc:"Signe ton premier client",check:(ctx)=>ctx.activeClients>=1},
  {id:"10k_club",label:"10K€ Club 💰",desc:"Atteins 10 000€ de CA mensuel",check:(ctx)=>ctx.ca>=10000},
  {id:"streak_7",label:"Streak 7j 🔥",desc:"7 jours de connexion consécutifs",check:(ctx)=>ctx.streakCount>=7},
  {id:"retention_100",label:"100% Rétention 🏆",desc:"Zéro churn ce mois",check:(ctx)=>ctx.activeClients>0&&ctx.churnedClients===0},
  {id:"pipeline_king",label:"Pipeline King 👑",desc:"5+ opportunités ouvertes",check:(ctx)=>ctx.openOpps>=5},
  {id:"zero_churn",label:"Zero Churn 🛡️",desc:"Aucun client perdu en 3 mois",check:(ctx)=>ctx.churn3m===0&&ctx.activeClients>0},
  {id:"early_bird",label:"Early Bird ☀️",desc:"Connecté avant 8h",check:(ctx)=>ctx.earlyLogin},
 ];
 const ctx=useMemo(()=>{
  const activeClients=(myClients||[]).filter(c=>c.status==="active").length;
  const churnedClients=(myClients||[]).filter(c=>c.status==="churned").length;
  const gd=ghlData?.[soc.id]||{};
  const openOpps=(gd.opportunities||[]).filter(o=>o.status==="open").length;
  const churn3m=0; // simplified
  const earlyLogin=new Date().getHours()<8;
  const streakCount=streak?.count||0;
  return{ca:ca||0,activeClients,churnedClients,openOpps,churn3m,earlyLogin,streakCount};
 },[ca,myClients,ghlData,soc.id,streak]);

 const[unlockedBadges,setUnlockedBadges]=useState(()=>{try{return JSON.parse(localStorage.getItem(`scBadges_${soc.id}`)||"[]");}catch{return[];}});
 const[celebBadge,setCelebBadge]=useState(null);

 useEffect(()=>{
  const newUnlocked=[...unlockedBadges];let changed=false;
  BADGES.forEach(b=>{if(!newUnlocked.includes(b.id)&&b.check(ctx)){newUnlocked.push(b.id);changed=true;setCelebBadge(b);}});
  if(changed){setUnlockedBadges(newUnlocked);try{localStorage.setItem(`scBadges_${soc.id}`,JSON.stringify(newUnlocked));sSet(`scBadges_${soc.id}`,JSON.stringify(newUnlocked));}catch{}}
 },[ctx]);

 useEffect(()=>{if(celebBadge){const t=setTimeout(()=>setCelebBadge(null),3000);return()=>clearTimeout(t);}},[celebBadge]);

 // XP calculation
 const xp=useMemo(()=>{
  let pts=0;pts+=Math.min(400,Math.round((ctx.ca||0)/25));pts+=ctx.activeClients*50;pts+=(ctx.streakCount||0)*10;pts+=unlockedBadges.length*100;
  const level=Math.floor(pts/500)+1;const xpInLevel=pts%500;
  return{pts,level,xpInLevel,nextLevel:500};
 },[ctx,unlockedBadges]);

 return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.33s"}}>
  <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>🎮 GAMIFICATION — NIVEAU {xp.level}</div>
  {/* XP Bar */}
  <div style={{marginBottom:14}}>
   <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
    <span style={{fontSize:10,fontWeight:700,color:C.acc}}>⭐ {xp.pts} XP</span>
    <span style={{fontSize:9,color:C.td}}>Niveau {xp.level} → {xp.level+1}</span>
   </div>
   <div style={{height:8,background:C.brd,borderRadius:4,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${Math.round(xp.xpInLevel/xp.nextLevel*100)}%`,background:`linear-gradient(90deg,${C.acc},#FF9D00)`,borderRadius:4,transition:"width .5s ease"}}/>
   </div>
  </div>
  {/* Badge Grid */}
  <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:6}}>
   {BADGES.map(b=>{const unlocked=unlockedBadges.includes(b.id);return <div key={b.id} style={{padding:"10px 6px",borderRadius:10,border:`1px solid ${unlocked?C.acc+"44":C.brd}`,background:unlocked?C.accD:"transparent",textAlign:"center",opacity:unlocked?1:0.4,transition:"all .3s"}}>
    <div style={{fontSize:20,marginBottom:2,filter:unlocked?"none":"grayscale(1)"}}>{b.label.split(" ").pop()}</div>
    <div style={{fontSize:8,fontWeight:700,color:unlocked?C.acc:C.td}}>{b.label.replace(/\s*[^\w\s]+$/,"").trim()}</div>
    {!unlocked&&<div style={{fontSize:7,color:C.tm,marginTop:2}}>🔒</div>}
   </div>;})}
  </div>
  {/* Celebration overlay */}
  {celebBadge&&<div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.6)",animation:"fi .3s ease"}}>
   <div style={{textAlign:"center",animation:"celebIn .5s cubic-bezier(.16,1,.3,1)",padding:40}}>
    <div style={{fontSize:64,marginBottom:8}}>{celebBadge.label.split(" ").pop()}</div>
    <div style={{fontWeight:900,fontSize:18,color:C.acc,marginBottom:4}}>Badge Débloqué !</div>
    <div style={{fontSize:14,color:C.t,fontWeight:600}}>{celebBadge.label}</div>
    <div style={{fontSize:11,color:C.td,marginTop:4}}>{celebBadge.desc}</div>
   </div>
  </div>}
 </div>;
}
/* ===== INBOX UNIFIÉE ===== */
/* ===== INBOX UNIFIÉE ===== */
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
export const CHALLENGE_TEMPLATES=[
 {id:"c_double",title:"🔥 Doublé",desc:"Doubler son CA vs mois dernier",metric:"ca_growth",target:100,unit:"%",icon:"🔥"},
 {id:"c_margin",title:"💎 Marge d'or",desc:"Atteindre 60%+ de marge",metric:"margin",target:60,unit:"%",icon:"💎"},
 {id:"c_pipeline",title:"🎯 Pipeline monstre",desc:"Pipeline > 2× CA",metric:"pipeline_ratio",target:200,unit:"%",icon:"🎯"},
 {id:"c_streak",title:"📈 Série verte",desc:"3 mois consécutifs de hausse",metric:"growth_streak",target:3,unit:"mois",icon:"📈"},
 {id:"c_reports",title:"📊 Exemplaire",desc:"Rapport soumis avant le 5 du mois",metric:"early_report",target:1,unit:"",icon:"📊"},
 {id:"c_pulse",title:"⚡ Ultra-connecté",desc:"Pulse envoyé chaque semaine ce mois",metric:"pulse_count",target:4,unit:"",icon:"⚡"},
];
/* ABONNEMENTS & ÉQUIPE PANEL */
/* ABONNEMENTS & ÉQUIPE PANEL */
export function SubsTeamPanel({socs,subs,saveSubs,team,saveTeam,socId,reps,isCompact,socBankData,revData}){
 const[editSub,setEditSub]=useState(null);const[editTm,setEditTm]=useState(null);const[showRecon,setShowRecon]=useState(false);
 const[catFilter,setCatFilter]=useState("all");const[autoSubs,setAutoSubs]=useState([]);
 const cM2=curM();
 const bankData0=socId==="all"?null:(socId==="holding"?revData:socBankData);
 const detectSubs=useCallback(()=>{const detected=autoDetectSubscriptions(bankData0,socId);setAutoSubs(detected);},[bankData0,socId]);
 useEffect(()=>{detectSubs();},[detectSubs]);
 const manualSubs=socId==="all"?subs:subs.filter(s=>s.socId===socId);
 const manualNames=new Set(manualSubs.map(s=>s.name.toLowerCase().replace(/[^a-z0-9]/g,"")));
 const mergedAutoSubs=autoSubs.filter(a=>!manualNames.has(a.name.toLowerCase().replace(/[^a-z0-9]/g,"")));
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
 const deleteSub=(id)=>saveSubs(subs.filter(s=>s.id!==id));
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
   {mySubs.length===0&&<div style={{color:C.td,fontSize:11,padding:12,textAlign:"center"}}>Aucun abonnement</div>}
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
   {myTeam.length===0&&<div style={{color:C.td,fontSize:11,padding:12,textAlign:"center"}}>Aucun membre</div>}
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
    {subs.some(s=>s.id===editSub.id)&&<Btn v="secondary" onClick={()=>{deleteSub(editSub.id);setEditSub(null);}}>🗑 Supprimer</Btn>}
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
export function ChallengesPanel({socs,reps,allM,pulses,challenges,saveChallenges}){
 const cM2=curM();const pm=prevM(cM2);const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 const[editing,setEditing]=useState(false);
 const scored=useMemo(()=>{
  return(challenges||[]).filter(c=>c.month===cM2||c.month===pm).map(ch=>{
   const tmpl=CHALLENGE_TEMPLATES.find(t=>t.id===ch.templateId)||{};
   const scores=actS.map(s=>{
    const r=gr(reps,s.id,ch.month),rp=gr(reps,s.id,prevM(ch.month));
    const ca=pf(r?.ca),caPrev=pf(rp?.ca),ch2=pf(r?.charges);
    let val=0;
    if(tmpl.metric==="ca_growth")val=caPrev>0?Math.round((ca-caPrev)/caPrev*100):0;
    else if(tmpl.metric==="margin")val=ca>0?Math.round((ca-ch2)/ca*100):0;
    else if(tmpl.metric==="pipeline_ratio")val=ca>0?Math.round(pf(r?.pipeline)/ca*100):0;
    else if(tmpl.metric==="pulse_count")val=Object.keys(pulses).filter(k=>k.startsWith(s.id+"_")&&k.includes(ch.month.replace("-",""))).length;
    else if(tmpl.metric==="growth_streak"){let str=0;const mi=allM.indexOf(ch.month);if(mi>0)for(let i=mi;i>0;i--){const rc=pf(gr(reps,s.id,allM[i])?.ca),rcc=pf(gr(reps,s.id,allM[i-1])?.ca);if(rc>rcc)str++;else break;}val=str;}
    return{soc:s,value:val,achieved:val>=(tmpl.target||0)};
   }).sort((a,b)=>b.value-a.value);
   return{...ch,...tmpl,scores,winner:scores[0]};
  });
 },[challenges,reps,pulses,actS,allM,cM2,pm]);
 const launchChallenge=(tmplId)=>{
  const nc={id:uid(),templateId:tmplId,month:cM2,createdAt:new Date().toISOString()};
  saveChallenges([...(challenges||[]),nc]);
 };
 return <>
  {scored.filter(c=>c.month===cM2).length>0&&<Sect title={`Challenges — ${ml(cM2)}`}>
   {scored.filter(c=>c.month===cM2).map((ch,i)=>
    <Card key={ch.id} accent={C.acc} style={{marginBottom:8,padding:14}} delay={Math.min(i+1,6)}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
    <span style={{fontSize:24}}>{ch.icon}</span>
    <div style={{flex:1}}>
    <div style={{fontWeight:800,fontSize:14}}>{ch.title}</div>
    <div style={{color:C.td,fontSize:10}}>{ch.desc} — cible: {ch.target}{ch.unit}</div>
    </div>
    </div>
    {ch.scores.map((sc,si)=>
    <div key={sc.soc.id} className={`fu d${Math.min(si+1,8)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:si===0?C.accD:C.card,borderRadius:6,border:`1px solid ${si===0?C.acc+"44":C.brd}`,marginBottom:2}}>
    <span style={{fontWeight:800,fontSize:12,color:si===0?C.acc:si===1?"#C0C0C0":si===2?"#CD7F32":C.td,width:16}}>{si+1}</span>
    <span style={{width:5,height:5,borderRadius:3,background:sc.soc.color}}/>
    <span style={{flex:1,fontWeight:600,fontSize:11}}>{sc.soc.nom}</span>
    <span style={{fontWeight:800,fontSize:12,color:sc.achieved?C.g:C.td}}>{sc.value}{ch.unit}</span>
    {sc.achieved&&<span style={{fontSize:8,color:C.g,background:C.gD,padding:"1px 5px",borderRadius:6,fontWeight:600}}>✓</span>}
    </div>
    )}
    </Card>
   )}
  </Sect>}
  {scored.filter(c=>c.month!==cM2).length>0&&<Sect title="Historique">
   {scored.filter(c=>c.month!==cM2).map((ch,i)=>
    <div key={ch.id} className={`fu d${Math.min(i+1,6)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
    <span style={{fontSize:14}}>{ch.icon}</span>
    <div style={{flex:1}}><span style={{fontWeight:600,fontSize:11}}>{ch.title}</span><span style={{color:C.td,fontSize:9,marginLeft:6}}>{ml(ch.month)}</span></div>
    {ch.winner&&<><span style={{width:4,height:4,borderRadius:2,background:ch.winner.soc.color}}/><span style={{fontWeight:700,fontSize:10,color:C.acc}}>🏆 {ch.winner.soc.nom}</span></>}
    </div>
   )}
  </Sect>}
  <Sect title="Lancer un challenge" sub="Choisir un défi pour ce mois">
   <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:6}}>
    {CHALLENGE_TEMPLATES.map(tmpl=>{
    const active=(challenges||[]).some(c=>c.templateId===tmpl.id&&c.month===cM2);
    return <div key={tmpl.id} className="fu ba" onClick={active?undefined:()=>launchChallenge(tmpl.id)} style={{padding:12,background:active?C.gD:C.card,border:`1px solid ${active?C.g+"44":C.brd}`,borderRadius:10,cursor:active?"default":"pointer",textAlign:"center",opacity:active?0.6:1}}>
    <div style={{fontSize:20,marginBottom:4}}>{tmpl.icon}</div>
    <div style={{fontWeight:700,fontSize:10,color:active?C.g:C.t}}>{tmpl.title.replace(/^. /,"")}</div>
    <div style={{fontSize:8,color:C.td,marginTop:2}}>{tmpl.desc}</div>
    {active&&<div style={{fontSize:7,color:C.g,marginTop:3,fontWeight:700}}>ACTIF</div>}
    </div>;
    })}
   </div>
  </Sect>
 </>;
}
/* 5. AI WEEKLY COACH */
/* CLIENTS PANEL (per-société CRM) */
export function ClientsPanelSafe(props){return <ErrorBoundary label="Erreur dans la page Clients"><ClientsPanelInner {...props}/></ErrorBoundary>;}
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
  <div style={{fontWeight:700,fontSize:15,marginBottom:6,color:C.t}}>Aucun client</div>
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
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un client ou prospect..." style={{width:"100%",padding:"10px 12px 10px 36px",borderRadius:10,border:`1px solid ${search?C.acc+"66":C.brd}`,background:"rgba(14,14,22,0.4)",color:C.t,fontSize:12,fontFamily:FONT,outline:"none",boxSizing:"border-box",transition:"border-color .2s"}}/>
    {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:14}}>✕</button>}
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
    {(()=>{if(cl.status!=="active")return null;const cn3=(cl.name||"").toLowerCase().trim();const excl4=EXCLUDED_ACCOUNTS[soc.id]||[];const now45c=Date.now()-45*864e5;const now30c=Date.now()-30*864e5;const hasPayment=(socBankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl4.includes(leg.account_id))return false;return new Date(tx.created_at).getTime()>now45c&&(leg.description||tx.reference||"").toLowerCase().includes(cn3);});const calEvts2=(ghlData?.[soc.id]?.calendarEvents||[]);const hasCall=calEvts2.some(e=>new Date(e.startTime||0).getTime()>now30c&&(e.contactName||e.title||"").toLowerCase().includes(cn3));const endDate=commitmentEnd(cl);const endsClose=endDate&&(endDate.getTime()-Date.now())<60*864e5;if((!hasPayment||!hasCall)&&endsClose)return <span style={{fontSize:7,color:C.r,background:C.rD,padding:"1px 5px",borderRadius:8,fontWeight:700}}>⚠️ Risque</span>;return null;})()}
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
 const handleLogoUpload=(e)=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith("image/"))return;if(file.size>2*1024*1024){alert("Image trop lourde (max 2 Mo)");return;}const reader=new FileReader();reader.onload=(ev)=>{setForm(f=>({...f,logoUrl:ev.target.result}));};reader.readAsDataURL(file);};
 const accent=form.brandColor||form.color;
 const accent2=form.brandColorSecondary||"";
 return <Sect title="⚙️ Paramètres" sub={soc.nom}>
  {saved&&<div style={{background:C.gD,border:`1px solid ${C.g}22`,borderRadius:8,padding:"8px 12px",marginBottom:12,color:C.g,fontSize:11,fontWeight:700}}>✅ Paramètres sauvegardés</div>}
  <Card style={{padding:16,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
    <div style={{width:56,height:56,borderRadius:28,background:accent+"22",border:`2px solid ${accent}44`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
     {form.logoUrl?<img src={form.logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:form.logo?<img src={form.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:24,fontWeight:900,color:accent}}>{(form.nom||"?")[0]}</span>}
    </div>
    <div style={{flex:1}}>
     <div style={{fontWeight:800,fontSize:16,color:C.t}}>{form.nom||"Sans nom"}</div>
     <div style={{fontSize:11,color:C.td}}>{form.act} · {form.porteur}</div>
    </div>
   </div>
   <Inp label="Nom de la société" value={form.nom} onChange={v=>setForm({...form,nom:v})}/>
   <Inp label="Activité" value={form.act} onChange={v=>setForm({...form,act:v})}/>
   <Inp label="Porteur (fondateur)" value={form.porteur} onChange={v=>setForm({...form,porteur:v})}/>
   <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Email" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder="contact@..."/>
    <Inp label="Téléphone" value={form.phone} onChange={v=>setForm({...form,phone:v})} placeholder="+33..."/>
   </div>
   <Inp label="Description" value={form.desc} onChange={v=>setForm({...form,desc:v})} placeholder="Décrivez l'activité de la société..."/>
  </Card>
  {/* Branding section */}
  <Card style={{padding:16,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}><span style={{fontSize:16}}>🎨</span><div><div style={{fontWeight:800,fontSize:13,color:C.t}}>Branding</div><div style={{fontSize:10,color:C.td}}>Personnalisez l'apparence de votre espace</div></div></div>
   {/* Logo upload */}
   <div style={{marginBottom:14}}>
    <label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:6,letterSpacing:.3}}>Logo / Photo de profil</label>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
     <div style={{width:64,height:64,borderRadius:32,background:accent+"15",border:`2px dashed ${accent}44`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,cursor:"pointer",transition:"border-color .2s"}} onClick={()=>fileRef.current?.click()} onMouseEnter={e=>e.currentTarget.style.borderColor=accent} onMouseLeave={e=>e.currentTarget.style.borderColor=accent+"44"}>
      {form.logoUrl?<img src={form.logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:10,color:C.td,textAlign:"center",lineHeight:1.2}}>📷<br/>Cliquer</span>}
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
      {form.logoUrl?<img src={form.logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:14,fontWeight:900,color:accent}}>{(form.nom||"?")[0]}</span>}
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
  bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(excluded.includes(leg.account_id))return false;return leg.amount>100;}).slice(0,3).forEach(t=>{
   const leg=t.legs?.[0];
   notifs.push({id:"tx_"+t.id,icon:"💰",msg:`Paiement reçu: +${fmt(leg.amount)}€`,time:t.created_at,type:"success"});
  });
 }
 // CA trend
 if(prevCa>0&&ca>prevCa){const pctG=Math.round((ca-prevCa)/prevCa*100);notifs.push({id:"ca_trend",icon:"📈",msg:`CA en hausse de ${pctG}% vs mois dernier`,time:new Date().toISOString(),type:"success"});}
 // Low treasury
 if(balance>0&&balance<2000)notifs.push({id:"treso_low",icon:"⚠️",msg:`Trésorerie basse: ${fmt(balance)}€`,time:new Date().toISOString(),type:"warning"});
 // Won deals from GHL
 const gd=ghlData?.[soc.id];
 if(gd?.stats?.wonDeals>0)notifs.push({id:"deals_won",icon:"🎯",msg:`${gd.stats.wonDeals} deal${gd.stats.wonDeals>1?"s":""} gagné${gd.stats.wonDeals>1?"s":""}!`,time:gd.lastSync||new Date().toISOString(),type:"success"});
 // Commitment ending soon
 (clients||[]).filter(c=>c.socId===soc.id&&c.status==="active").forEach(c=>{
  const rem=commitmentRemaining(c);
  if(rem!==null&&rem<=2&&rem>0)notifs.push({id:"commit_"+c.id,icon:"📅",msg:`Fin d'engagement proche: ${c.name} (${rem} mois)`,time:new Date().toISOString(),type:"warning"});
 });
 return notifs.sort((a,b)=>new Date(b.time)-new Date(a.time));
}
export function NotificationCenter({notifications,open,onClose}){
 const[readIds,setReadIds]=useState(()=>{try{return JSON.parse(localStorage.getItem("notif_read")||"[]");}catch{return[];}});
 const[dismissedIds,setDismissedIds]=useState(()=>{try{return JSON.parse(localStorage.getItem("notif_dismissed")||"[]");}catch{return[];}});
 const markRead=(id)=>{const n=[...new Set([...readIds,id])];setReadIds(n);localStorage.setItem("notif_read",JSON.stringify(n));};
 const markAllRead=()=>{const n=[...new Set([...readIds,...visible.map(x=>x.id)])];setReadIds(n);localStorage.setItem("notif_read",JSON.stringify(n));};
 const dismiss=(id)=>{const n=[...new Set([...dismissedIds,id])];setDismissedIds(n);localStorage.setItem("notif_dismissed",JSON.stringify(n));};
 const clearAll=()=>{const n=[...new Set([...dismissedIds,...visible.map(x=>x.id)])];setDismissedIds(n);localStorage.setItem("notif_dismissed",JSON.stringify(n));};
 const visible=notifications.filter(n=>!dismissedIds.includes(n.id));
 if(!open)return null;
 return <div className="fi" onClick={onClose} style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.4)"}}>
  <div onClick={e=>e.stopPropagation()} style={{position:"fixed",top:0,right:0,width:340,maxWidth:"90vw",height:"100vh",background:"rgba(14,14,22,.85)",backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",borderLeft:"1px solid rgba(255,255,255,.06)",boxShadow:"-4px 0 40px rgba(0,0,0,.5)",animation:"slideInRight .3s ease",overflowY:"auto",padding:20}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
    <h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.t,fontFamily:FONT_TITLE}}>🔔 Notifications</h3>
    <Btn v="ghost" small onClick={onClose}>✕</Btn>
   </div>
   {visible.length>0&&<div style={{display:"flex",gap:6,marginBottom:12}}>
    <Btn small v="ghost" onClick={markAllRead}>✓ Tout marquer comme lu</Btn>
    <Btn small v="ghost" onClick={clearAll}>🗑 Effacer tout</Btn>
   </div>}
   {visible.length===0&&<div style={{textAlign:"center",padding:30,color:C.td}}><div style={{fontSize:28,marginBottom:8}}>✅</div><div style={{fontSize:12}}>Aucune notification</div></div>}
   {visible.map((n,i)=>{
    const bgMap={success:C.gD,warning:C.oD,info:C.bD};const cMap={success:C.g,warning:C.o,info:C.b};
    const isRead=readIds.includes(n.id);
    return <div key={n.id} onClick={()=>markRead(n.id)} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",background:bgMap[n.type]||C.card2,border:`1px solid ${(cMap[n.type]||C.brd)}18`,borderRadius:10,marginBottom:6,opacity:isRead?0.5:1,cursor:"pointer",transition:"opacity .2s"}}>
     <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{n.icon}</span>
     <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:12,fontWeight:600,color:C.t,lineHeight:1.4}}>{n.msg}</div>
      <div style={{fontSize:9,color:C.td,marginTop:3}}>{ago(n.time)}</div>
     </div>
     <button onClick={e=>{e.stopPropagation();dismiss(n.id);}} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:14,padding:"2px 4px",flexShrink:0,lineHeight:1}}>✕</button>
    </div>;
   })}
  </div>
 </div>;
}
/* AI CHAT FOR PORTEUR */
/* AI CHAT FOR PORTEUR */
export function PorteurAIChat({soc,reps,allM,socBank,ghlData,clients}){
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
  const monthTxns=(bankData?.transactions||[]).filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(excluded.includes(leg.account_id))return false;return(t.created_at||"").startsWith(cm);});

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
   if(bankData?.transactions){bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(excluded.includes(leg.account_id))return false;return(t.created_at||"").startsWith(cm)&&leg.amount<0;}).forEach(t=>{const cat=categorizeTransaction(t);const amt=Math.abs(t.legs?.[0]?.amount||0);catTotals[cat.label]=(catTotals[cat.label]||0)+amt;});}
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
   if(bankData?.transactions){bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(excluded.includes(leg.account_id))return false;return(t.created_at||"").startsWith(cm)&&leg.amount<0;}).forEach(t=>{const cat=categorizeTransaction(t);const amt=Math.abs(t.legs?.[0]?.amount||0);catTotals2[cat.label]=(catTotals2[cat.label]||0)+amt;});}
   const s3=Object.entries(catTotals2).sort((a,b)=>b[1]-a[1]);
   return `💸 **Dépenses par catégorie — ${ml(cm)}**\n\n${s3.map(([k,v])=>`• **${k}** : ${fmt(v)}€`).join("\n")}\n\nTotal : **${fmt(s3.reduce((a,[,v])=>a+v,0))}€**`;
  }
  // qui/quel generic
  if(ql.match(/^qui\s|^quel\s|^quels\s|^quand\s/)){
   if(ql.match(/qui.*pay|qui.*rapport/))return `💰 **Revenus clients ce mois**\n\n${activeCl.slice(0,8).map(c=>`• ${c.name} — ${fmt(clientMonthlyRevenue(c))}€/mois`).join("\n")||"Aucun client."}`;
   if(ql.match(/quand.*prochain|quand.*rdv/)){const now=new Date();const next2=calEvts.filter(e=>new Date(e.startTime||0)>now).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime))[0];return next2?`📅 Prochain RDV : **${new Date(next2.startTime).toLocaleDateString("fr-FR")} ${new Date(next2.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}** — ${next2.title||"RDV"}`:"📅 Aucun RDV prévu.";}
  }
  return `🤖 Je n'ai pas compris ta question.\n\nEssaie :\n• « combien de clients actifs »\n• « CA ce mois »\n• « qui n'a pas payé »\n• « prochains RDV »\n• « résumé »\n• « aide » pour voir toutes les commandes`;
 };
 const SUGGESTIONS=[{q:"Résumé",icon:"📋"},{q:"CA ce mois",icon:"📊"},{q:"Impayés",icon:"💸"},{q:"RDV",icon:"📅"},{q:"Objectif",icon:"🎯"},{q:"Météo",icon:"🌡️"}];
 const ask=(q)=>{
  if(!q.trim())return;
  const trimmed=q.trim();
  setMsgs(prev=>{const n=[...prev,{role:"user",content:trimmed}];return n.length>20?n.slice(-20):n;});
  setTyping(true);setInputVal("");
  const answer=computeAnswer(trimmed);
  setTimeout(()=>{setTyping(false);setMsgs(prev=>{const newMsgs=[...prev,{role:"assistant",content:answer}];const capped=newMsgs.length>20?newMsgs.slice(-20):newMsgs;setRevealIdx(capped.length-1);setRevealLen(0);return capped;});},800);
 };
 useEffect(()=>{
  if(revealIdx<0||revealIdx>=msgs.length)return;
  const full=msgs[revealIdx]?.content||"";
  if(revealLen>=full.length){setRevealIdx(-1);return;}
  const t=setTimeout(()=>setRevealLen(prev=>Math.min(prev+3,full.length)),15);
  return()=>clearTimeout(t);
 },[revealIdx,revealLen,msgs]);
 useEffect(()=>{ref.current?.scrollTo({top:ref.current.scrollHeight,behavior:"smooth"});},[msgs,revealLen,typing]);
 useEffect(()=>{if(open)setTimeout(()=>inputRef.current?.focus(),300);},[open]);
 if(!open)return <div onClick={()=>setOpen(true)} style={{position:"fixed",bottom:24,right:24,width:56,height:56,borderRadius:28,background:`linear-gradient(135deg,${C.v},${C.acc})`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:`0 4px 20px ${C.acc}44`,zIndex:800,fontSize:24,animation:"fl 3s ease-in-out infinite",transition:"transform .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>🤖</div>;
 return <div style={{position:"fixed",bottom:24,right:24,width:420,maxWidth:"92vw",height:550,maxHeight:"80vh",background:"rgba(14,14,22,.9)",backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,boxShadow:"0 12px 48px rgba(0,0,0,.5)",zIndex:800,display:"flex",flexDirection:"column",animation:"slideInUp .3s ease",overflow:"hidden"}}>
  <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.brd}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:`linear-gradient(135deg,${C.card2},${C.card})`}}>
   <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>🤖</span><div><div style={{fontWeight:800,fontSize:13,color:C.t}}>Assistant IA</div><div style={{fontSize:9,color:C.td}}>{soc.nom} · Tape "aide" pour les commandes</div></div></div>
   <div style={{display:"flex",gap:4}}>
    <button onClick={()=>setMsgs([])} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.td,padding:"2px 6px",borderRadius:6}} title="Effacer l'historique">🗑</button>
    <button onClick={()=>setOpen(false)} style={{background:"none",border:`1px solid ${C.brd}`,cursor:"pointer",fontSize:12,color:C.td,padding:"2px 8px",borderRadius:6,fontFamily:FONT}}>✕</button>
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
  <div style={{padding:"10px 14px",borderTop:`1px solid ${C.brd}`,background:"rgba(6,6,11,.5)"}}>
   {msgs.length>0&&<div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>{SUGGESTIONS.map((q,i)=><button key={i} onClick={()=>ask(q.q)} style={{padding:"2px 8px",borderRadius:12,fontSize:8,fontWeight:600,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.acc;e.currentTarget.style.color=C.acc;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.td;}}>{q.icon} {q.q}</button>)}</div>}
   <div style={{display:"flex",gap:8,alignItems:"center"}}>
    <input ref={inputRef} value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask(inputVal);}}} placeholder="Posez votre question..." style={{flex:1,padding:"10px 14px",borderRadius:12,border:`1px solid ${C.brd}`,background:"rgba(6,6,11,.6)",backdropFilter:"blur(10px)",color:C.t,fontSize:12,fontFamily:FONT,outline:"none",transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor=C.acc+"66"} onBlur={e=>e.target.style.borderColor=C.brd}/>
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
 const cm=curM();const report=gr(reps,soc.id,cm);
 const bankData=socBank?.[soc.id];const acc2=soc.brandColor||soc.color||C.acc;
 const ca=report?pf(report.ca):0;const charges=report?pf(report.charges):0;
 const marge=ca-charges;const margePct=ca>0?Math.round(marge/ca*100):0;
 const treso=bankData?.balance||0;
 const pm=prevM(cm);const prevReport=gr(reps,soc.id,pm);
 const prevCa=prevReport?pf(prevReport.ca):0;
 const caTrend=prevCa>0?Math.round((ca-prevCa)/prevCa*100):0;
 // Last 6 months chart data
 const chartData=useMemo(()=>{
  const months=[];let m=cm;for(let i=0;i<6;i++){months.unshift(m);m=prevM(m);}
  return months.map(mo=>{const r=gr(reps,soc.id,mo);return{month:ml(mo).split(" ")[0],ca:r?pf(r.ca):0,charges:r?pf(r.charges):0};});
 },[reps,soc.id,cm]);
 const maxVal=Math.max(1,...chartData.map(d=>Math.max(d.ca,d.charges)));
 // Recent transactions
 const excluded=EXCLUDED_ACCOUNTS[soc.id]||[];
 const recentTx=useMemo(()=>{
  if(!bankData?.transactions)return[];
  return bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(excluded.includes(leg.account_id))return false;return true;}).slice(0,5);
 },[bankData,excluded]);
 // GHL stats
 const ghlStats=ghlData?.[soc.id]?.stats;
 const ghlStages=ghlData?.[soc.id]?.pipelines?.[0]?.stages||[];
 const ghlOpps=ghlData?.[soc.id]?.opportunities||[];
 // N vs N-1 comparisons
 const prevCharges=prevReport?pf(prevReport.charges):0;
 const chargesTrend=prevCharges>0?Math.round((charges-prevCharges)/prevCharges*100):0;
 const prevMarge=prevCa-prevCharges;
 const margeTrend=prevMarge>0?Math.round((marge-prevMarge)/Math.abs(prevMarge)*100):0;
 const prevTreso=prevReport?pf(prevReport.tresoSoc):0;
 const tresoTrend=prevTreso>0?Math.round((treso-prevTreso)/prevTreso*100):0;
 // Prévisionnel
 const myClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active");
 const prevu=myClients.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 const realise=ca;
 const prevuPct=prevu>0?Math.round(realise/prevu*100):0;
 const prevuColor=prevuPct>=100?C.g:prevuPct>=80?C.o:C.r;
 // Performance score
 const perfScore=useMemo(()=>{
  let s=0;
  // CA vs objectif (40pts)
  if(soc.obj>0)s+=Math.min(40,Math.round(ca/soc.obj*40));
  else if(ca>0)s+=20;
  // Conversion rate (20pts)
  const gd=ghlData?.[soc.id];const stratCalls=Object.entries(gd?.stats?.callsByType||{}).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const integCalls=Object.entries(gd?.stats?.callsByType||{}).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const convRate=stratCalls>0?integCalls/stratCalls:0;
  s+=Math.min(20,Math.round(convRate*20));
  // Active clients ratio (20pts)
  const totalContacts=gd?.ghlClients?.length||1;
  s+=Math.min(20,Math.round(myClients.length/totalContacts*20));
  // Payment on time ratio (20pts)
  const excl2=EXCLUDED_ACCOUNTS[soc.id]||[];
  const now45=Date.now()-45*864e5;
  const onTime=myClients.filter(c=>{const cn=(c.name||"").toLowerCase().trim();return(bankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl2.includes(leg.account_id))return false;return new Date(tx.created_at).getTime()>now45&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});}).length;
  s+=myClients.length>0?Math.round(onTime/myClients.length*20):0;
  return clamp(s,0,100);
 },[ca,soc,ghlData,myClients,bankData]);
 const perfColor=perfScore>70?C.g:perfScore>=40?C.o:C.r;
 // Smart alerts
 const[dismissedAlerts,setDismissedAlerts]=useState(()=>{try{return JSON.parse(localStorage.getItem(`scAlertsDismiss_${soc.id}`)||"[]");}catch{return[];}});
 const smartAlerts=useMemo(()=>{
  const alerts=[];const gd2=ghlData?.[soc.id];const now3=Date.now();const excl3=EXCLUDED_ACCOUNTS[soc.id]||[];
  // Impayés >45j
  myClients.forEach(c=>{const cn=(c.name||"").toLowerCase().trim();const now45b=now3-45*864e5;
   const hasRecent=(bankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl3.includes(leg.account_id))return false;return new Date(tx.created_at).getTime()>now45b&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});
   if(!hasRecent&&c.billing){const days=Math.round((now3-now45b)/864e5);alerts.push({id:`unpaid_${c.id}`,icon:"🔴",text:`${c.name} impayé depuis 45j+`,priority:1});}
  });
  // Contrats expirant <30j
  myClients.forEach(c=>{const end=commitmentEnd(c);if(end){const dLeft=Math.round((end.getTime()-now3)/864e5);if(dLeft>0&&dLeft<30)alerts.push({id:`expiry_${c.id}`,icon:"🟡",text:`${c.name} expire dans ${dLeft}j`,priority:2});}});
  // Nouveaux leads <48h
  const h48=now3-48*36e5;
  (gd2?.ghlClients||[]).filter(c2=>new Date(c2.at||c2.dateAdded||0).getTime()>h48).slice(0,3).forEach(c2=>{alerts.push({id:`lead_${c2.ghlId||c2.id}`,icon:"🔵",text:`Nouveau lead: ${c2.name||c2.email||"—"}`,priority:3});});
  // Deals gagnés <7j
  const d7=now3-7*864e5;
  (gd2?.opportunities||[]).filter(o=>o.status==="won"&&new Date(o.updatedAt||o.createdAt||0).getTime()>d7).slice(0,2).forEach(o=>{alerts.push({id:`won_${o.id}`,icon:"🟢",text:`Deal gagné: ${o.name||o.contact?.name||"—"}`,priority:4});});
  return alerts.filter(a=>!dismissedAlerts.includes(a.id)).sort((a,b)=>a.priority-b.priority);
 },[ghlData,myClients,bankData,dismissedAlerts]);
 const dismissAlert=(id)=>{const next=[...dismissedAlerts,id];setDismissedAlerts(next);try{localStorage.setItem(`scAlertsDismiss_${soc.id}`,JSON.stringify(next));}catch{}};
 // Trésorerie chart data (6 months from bank)
 const tresoChartData=useMemo(()=>{
  const months2=[];let m2=cm;for(let i=0;i<6;i++){months2.unshift(m2);m2=prevM(m2);}
  const exclB=EXCLUDED_ACCOUNTS[soc.id]||[];
  return months2.map(mo=>{
   const txs=(bankData?.transactions||[]).filter(t=>{const leg=t.legs?.[0];return leg&&!exclB.includes(leg.account_id)&&(t.created_at||"").startsWith(mo);});
   const entrees=txs.filter(t=>(t.legs?.[0]?.amount||0)>0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0);
   const sorties=Math.abs(txs.filter(t=>(t.legs?.[0]?.amount||0)<0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0));
   return{month:ml(mo).split(" ")[0],entrees:Math.round(entrees),sorties:Math.round(sorties),marge:Math.round(entrees-sorties)};
  });
 },[bankData,cm,soc.id]);
 // Funnel data
 const funnelData=useMemo(()=>{
  const gd3=ghlData?.[soc.id];if(!gd3)return[];
  const totalLeads=gd3.ghlClients?.length||0;
  const cbt=gd3.stats?.callsByType||{};
  const stratCalls2=Object.entries(cbt).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const integCalls2=Object.entries(cbt).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const clientsActifs=myClients.length;
  return[{stage:"Leads",count:totalLeads,color:"#60a5fa"},{stage:"Appel strat.",count:stratCalls2,color:C.acc},{stage:"Intégration",count:integCalls2,color:C.v},{stage:"Client actif",count:clientsActifs,color:C.g}];
 },[ghlData,myClients]);
 // Mobile detection
 const[isMobile,setIsMobile]=useState(typeof window!=="undefined"&&window.innerWidth<600);
 useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<600);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
 const kpis=[
  {label:"CA du mois",value:`${fmt(ca)}€`,trend:caTrend,accent:acc2},
  {label:"Charges",value:`${fmt(charges)}€`,trend2:chargesTrend,accent:C.r},
  {label:"Marge",value:`${fmt(marge)}€`,sub:`${margePct}%`,trend2:margeTrend,accent:marge>=0?C.g:C.r},
  {label:"Trésorerie",value:`${fmt(treso)}€`,trend2:tresoTrend,accent:soc.brandColorSecondary||C.b},
  ...(()=>{const now=new Date();const mKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;const monthCharges=(stripeData?.charges||[]).filter(ch=>{if(ch.status!=="succeeded")return false;const d=new Date((ch.created||0)*1000);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`===mKey;});const tot=monthCharges.reduce((a,c)=>a+Math.round((c.amount||0)/100),0);return tot>0?[{label:"💳 Revenus Stripe",value:`${fmt(tot)}€`,accent:C.v}]:[];})(),
 ];
 // Mobile quick check mode
 if(isMobile){
  const mobileKpis=[
   {label:"CA mois",value:`${fmt(ca)}€`,accent:acc2},
   {label:"Trésorerie",value:`${fmt(treso)}€`,accent:C.b},
   {label:"Leads semaine",value:String((ghlData?.[soc.id]?.ghlClients||[]).filter(c=>{const d=new Date(c.at||c.dateAdded||0);return Date.now()-d.getTime()<7*864e5;}).length),accent:C.v},
   {label:"RDV aujourd'hui",value:String((ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.startTime||"").startsWith(new Date().toISOString().slice(0,10))).length),accent:C.o},
  ];
  return <div className="fu" style={{padding:"8px 0"}}>
   <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
    {mobileKpis.map((k,i)=><div key={i} className="glass-card-static" style={{padding:20,textAlign:"center"}}>
     <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>{k.label}</div>
     <div style={{fontSize:28,fontWeight:900,color:k.accent,lineHeight:1}}>{k.value}</div>
    </div>)}
   </div>
   {smartAlerts.slice(0,2).map((a,i)=><div key={a.id} className="glass-card-static" style={{padding:12,marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
    <span style={{fontSize:14}}>{a.icon}</span>
    <span style={{flex:1,fontSize:11,fontWeight:600,color:C.t}}>{a.text}</span>
    <button onClick={()=>dismissAlert(a.id)} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:12}}>✕</button>
   </div>)}
  </div>;
 }
 // Streak tracking
 const streak=useMemo(()=>{
  const key=`streak_${soc.id}`;
  try{
   const raw=JSON.parse(localStorage.getItem(key)||"null");
   const today=new Date().toISOString().slice(0,10);
   const yesterday=new Date(Date.now()-864e5).toISOString().slice(0,10);
   if(!raw){const v={lastLogin:today,count:1};localStorage.setItem(key,JSON.stringify(v));return v;}
   if(raw.lastLogin===today)return raw;
   if(raw.lastLogin===yesterday){const v={lastLogin:today,count:raw.count+1};localStorage.setItem(key,JSON.stringify(v));return v;}
   const v={lastLogin:today,count:1};localStorage.setItem(key,JSON.stringify(v));return v;
  }catch{return{lastLogin:"",count:1};}
 },[soc.id]);
 // Météo Business
 const meteo=useMemo(()=>{
  const critAlerts=smartAlerts.filter(a=>a.priority===1).length;
  const allAlertCount=smartAlerts.length;
  const unpaidCount=myClients.filter(c=>{const cn=(c.name||"").toLowerCase().trim();const now45x=Date.now()-45*864e5;return c.billing&&!(bankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;return new Date(tx.created_at).getTime()>now45x&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});}).length;
  const convRateM=(()=>{const gd=ghlData?.[soc.id];const cbt=gd?.stats?.callsByType||{};const s2=Object.entries(cbt).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);const i2=Object.entries(cbt).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);return s2>0?Math.round(i2/s2*100):0;})();
  const caTrendM=prevCa>0?Math.round((ca-prevCa)/prevCa*100):0;
  if(perfScore>75&&critAlerts===0)return{emoji:"☀️",text:"Tout roule !",sub:`CA ${caTrendM>=0?"+":""}${caTrendM}%, ${unpaidCount} impayé${unpaidCount>1?"s":""}`,glow:"rgba(52,211,153,.15)",color:C.g,border:"linear-gradient(135deg,#34d399,#22c55e)"};
  if((perfScore>=50&&perfScore<=75)||allAlertCount<=2)return{emoji:"⛅",text:"Quelques points d'attention",sub:`${unpaidCount>0?unpaidCount+" impayé"+(unpaidCount>1?"s":""):"Conversion "+convRateM+"%"}`,glow:"rgba(251,146,60,.15)",color:C.o,border:"linear-gradient(135deg,#FFAA00,#fb923c)"};
  if((perfScore>=30&&perfScore<50)||allAlertCount>=3)return{emoji:"🌧️",text:"Vigilance requise",sub:`${unpaidCount} impayé${unpaidCount>1?"s":""}, conversion ${convRateM>0?convRateM+"%":"en baisse"}`,glow:"rgba(248,113,113,.15)",color:C.r,border:"linear-gradient(135deg,#fb923c,#f87171)"};
  return{emoji:"⛈️",text:"Actions urgentes nécessaires",sub:`${critAlerts} alerte${critAlerts>1?"s":""} critique${critAlerts>1?"s":""}`,glow:"rgba(248,113,113,.25)",color:C.r,border:"linear-gradient(135deg,#f87171,#dc2626)"};
 },[perfScore,smartAlerts]);
 // Conseil du jour IA
 const conseilDuJour=useMemo(()=>{
  const dayOfMonth=new Date().getDate();const tips=[];
  // Clients sans appels >20j
  const calEvts=ghlData?.[soc.id]?.calendarEvents||[];
  const now20=Date.now()-20*864e5;
  const noCallClients=myClients.filter(cl=>{const cn=(cl.name||"").toLowerCase();return !calEvts.some(e=>new Date(e.startTime||0).getTime()>now20&&(e.contactName||e.title||"").toLowerCase().includes(cn));});
  if(noCallClients.length>0){const top3=noCallClients.slice(0,3);top3.forEach(cl=>{const days=Math.round((Date.now()-now20)/864e5);tips.push({text:`💡 Appelle ${cl.name||"ce client"} — pas de contact depuis ${days}j`,action:"clients"});});}
  // Conversion rate
  const gd=ghlData?.[soc.id];const cbt=gd?.stats?.callsByType||{};
  const stratC=Object.entries(cbt).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const integC=Object.entries(cbt).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const convR=stratC>0?Math.round(integC/stratC*100):0;
  if(convR>0)tips.push({text:`💡 Ton taux de conversion est à ${convR}% — ${convR>30?"continue comme ça !":"essaie d'améliorer ton pitch"}`,action:null});
  // New untouched leads
  const h48=Date.now()-48*36e5;
  const newLeads=(gd?.ghlClients||[]).filter(c2=>new Date(c2.at||c2.dateAdded||0).getTime()>h48).length;
  if(newLeads>0)tips.push({text:`💡 ${newLeads} lead${newLeads>1?"s":""} ${newLeads>1?"attendent":"attend"} une réponse depuis 48h`,action:"clients"});
  // Payment gaps
  const excl5=EXCLUDED_ACCOUNTS[soc.id]||[];const now45b=Date.now()-45*864e5;
  const unpaid=myClients.filter(cl=>{const cn=(cl.name||"").toLowerCase().trim();return !(bankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl5.includes(leg.account_id))return false;return new Date(tx.created_at).getTime()>now45b&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});}).length;
  const unpaidClients2=myClients.filter(cl=>{const cn=(cl.name||"").toLowerCase().trim();return !(bankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl5.includes(leg.account_id))return false;return new Date(tx.created_at).getTime()>now45b&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});});
  if(unpaid>0){unpaidClients2.slice(0,2).forEach(cl=>{tips.push({text:`💡 Relance ${cl.name||"client"} — aucun paiement détecté depuis 45j+`,action:"clients"});});}
  // Contract expirations
  const expiring=myClients.filter(cl=>{const end=commitmentEnd(cl);return end&&(end.getTime()-Date.now())<30*864e5&&(end.getTime()-Date.now())>0;}).length;
  const expiringClients=myClients.filter(cl=>{const end=commitmentEnd(cl);return end&&(end.getTime()-Date.now())<30*864e5&&(end.getTime()-Date.now())>0;});
  if(expiring>0){expiringClients.slice(0,2).forEach(cl=>{tips.push({text:`💡 Contrat ${cl.name||"client"} expire dans ${commitmentRemaining(cl)}j — renouvellement ?`,action:"clients"});});}
  if(tips.length===0)tips.push({text:"💡 Tout semble en ordre — continue sur ta lancée !",action:null});
  return tips;
 },[soc.id,ghlData,myClients,bankData]);
 return <div className="fu">
  {/* Météo Business + Streak */}
  <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"stretch"}}>
   <div style={{flex:1,padding:3,borderRadius:18,background:meteo.border||"linear-gradient(135deg,#34d399,#22c55e)"}}>
    <div className="glass-card-static" style={{padding:"20px 24px",display:"flex",alignItems:"center",gap:16,borderRadius:15,boxShadow:`0 0 30px ${meteo.glow}`}}>
     <span style={{fontSize:64,lineHeight:1,animation:"weatherPulse 3s ease-in-out infinite",display:"inline-block"}}>{meteo.emoji}</span>
     <div>
      <div style={{fontWeight:900,fontSize:16,color:meteo.color,marginBottom:2}}>{meteo.text}</div>
      <div style={{fontSize:11,color:C.t,fontWeight:500,opacity:.8}}>{meteo.sub}</div>
      <div style={{fontSize:9,color:C.td,marginTop:4}}>Score: {perfScore}/100 · {smartAlerts.length} alerte{smartAlerts.length>1?"s":""}</div>
     </div>
    </div>
   </div>
   <div className="glass-card-static" style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:8,minWidth:80}}>
    <span style={{fontSize:28}}>🔥</span>
    <div><div style={{fontWeight:900,fontSize:20,color:C.acc}}>{streak.count}j</div>{streak.count>=7&&<div style={{fontSize:9,color:C.acc,fontWeight:600}}>semaine !</div>}</div>
   </div>
  </div>
  {/* Conseil du jour IA */}
  {(()=>{
   const[tipIdx,setTipIdx]=useState(0);
   const tips=conseilDuJour;const tip=tips[tipIdx%tips.length]||{text:"",action:null};
   return <div className="glass-card-static" style={{padding:"14px 18px",marginBottom:16,borderLeft:`3px solid ${C.acc}`,background:"rgba(255,170,0,.04)"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
     <div style={{flex:1,fontSize:12,fontWeight:600,color:C.t}}>{tip.text}</div>
     <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
      {tips.length>1&&<>
       <button onClick={()=>setTipIdx(Math.max(0,tipIdx-1))} style={{background:"none",border:"none",color:tipIdx>0?C.acc:C.tm,cursor:tipIdx>0?"pointer":"default",fontSize:14,padding:2}}>‹</button>
       <span style={{fontSize:9,color:C.td,fontWeight:600,minWidth:28,textAlign:"center"}}>{tipIdx%tips.length+1}/{tips.length}</span>
       <button onClick={()=>setTipIdx(Math.min(tips.length-1,tipIdx+1))} style={{background:"none",border:"none",color:tipIdx<tips.length-1?C.acc:C.tm,cursor:tipIdx<tips.length-1?"pointer":"default",fontSize:14,padding:2}}>›</button>
      </>}
      {tip.action&&<button onClick={()=>setPTab(tip.action==="clients"?3:0)} style={{background:C.accD,border:`1px solid ${C.acc}44`,borderRadius:6,color:C.acc,fontSize:9,fontWeight:700,padding:"3px 8px",cursor:"pointer",fontFamily:FONT}}>→</button>}
     </div>
    </div>
   </div>;
  })()}
  {/* Smart Alerts */}
  {smartAlerts.length>0&&<div style={{marginBottom:16}}>
   {smartAlerts.slice(0,3).map((a,i)=>{const borderColor=a.priority===1?C.r:a.priority===2?C.o:a.priority===3?C.b:C.g;const actionTab=a.text.includes("impayé")||a.text.includes("expire")||a.text.includes("lead")?3:1;
    return <div key={a.id} className={`glass-card-static slide-down`} style={{padding:"10px 14px",marginBottom:4,display:"flex",alignItems:"center",gap:8,borderLeft:`3px solid ${borderColor}`,animationDelay:`${i*0.08}s`}}>
     <span style={{fontSize:14}}>{a.icon}</span>
     <span style={{flex:1,fontSize:11,fontWeight:600,color:C.t}}>{a.text}</span>
     <button onClick={()=>setPTab(actionTab)} style={{background:borderColor+"18",border:`1px solid ${borderColor}33`,borderRadius:6,color:borderColor,fontSize:9,fontWeight:700,padding:"3px 8px",cursor:"pointer",fontFamily:FONT}}>Voir</button>
     <button onClick={()=>dismissAlert(a.id)} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:12,padding:2}}>✕</button>
    </div>;
   })}
   {smartAlerts.length>3&&<button onClick={()=>setPTab(1)} style={{background:"none",border:"none",color:C.acc,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT,marginTop:4}}>Voir tout ({smartAlerts.length}) →</button>}
  </div>}
  {/* Performance Score + Prévisionnel row */}
  <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:12,marginBottom:16}}>
   {(()=>{
    const[displayScore,setDisplayScore]=useState(0);
    const[showBreakdown,setShowBreakdown]=useState(false);
    useEffect(()=>{let frame=0;const target=perfScore;const duration=40;const step=()=>{frame++;const progress=Math.min(frame/duration,1);const eased=1-Math.pow(1-progress,3);setDisplayScore(Math.round(eased*target));if(frame<duration)requestAnimationFrame(step);};requestAnimationFrame(step);},[perfScore]);
    const caScore=soc.obj>0?Math.min(40,Math.round(ca/soc.obj*40)):ca>0?20:0;
    const gd9=ghlData?.[soc.id];const s2=Object.entries(gd9?.stats?.callsByType||{}).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);const i2=Object.entries(gd9?.stats?.callsByType||{}).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);const convScore=Math.min(20,s2>0?Math.round(i2/s2*20):0);
    const clientScore=Math.min(20,Math.round(myClients.length/Math.max(1,gd9?.ghlClients?.length||1)*20));
    const payScore=perfScore-caScore-convScore-clientScore;
    const gradientColor=perfScore>70?"#34d399":perfScore>=40?"#FFAA00":"#f87171";
    return <div className="glass-card-static" style={{padding:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minWidth:110,position:"relative",cursor:"pointer"}} onMouseEnter={()=>setShowBreakdown(true)} onMouseLeave={()=>setShowBreakdown(false)}>
     <div style={{position:"relative",width:80,height:80,marginBottom:6}}>
      <svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="33" fill="none" stroke={C.brd} strokeWidth="6"/><circle cx="40" cy="40" r="33" fill="none" stroke={gradientColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${displayScore*2.073} 207.3`} transform="rotate(-90 40 40)" style={{transition:"stroke-dasharray .6s ease, stroke .4s ease"}}/></svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:22,color:gradientColor}}>{displayScore}</div>
     </div>
     <div style={{fontSize:8,fontWeight:700,color:C.td,letterSpacing:.5,textAlign:"center",fontFamily:FONT_TITLE}}>SCORE PERFORMANCE</div>
     {showBreakdown&&<div style={{position:"absolute",bottom:-60,left:"50%",transform:"translateX(-50%)",background:"rgba(14,14,22,.95)",border:`1px solid ${C.brd}`,borderRadius:10,padding:"8px 12px",zIndex:10,whiteSpace:"nowrap",boxShadow:"0 8px 32px rgba(0,0,0,.6)",fontSize:9,color:C.td}}>
      <div>CA: <strong style={{color:C.acc}}>{caScore}/40</strong> | Conv: <strong style={{color:C.v}}>{convScore}/20</strong></div>
      <div>Clients: <strong style={{color:C.b}}>{clientScore}/20</strong> | Paiements: <strong style={{color:C.g}}>{Math.max(0,payScore)}/20</strong></div>
     </div>}
    </div>;
   })()}
   {prevu>0&&<div className="glass-card-static" style={{padding:20}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:8,fontFamily:FONT_TITLE}}>📊 PRÉVISIONNEL</div>
    <div style={{display:"flex",gap:16,marginBottom:8}}>
     <div><div style={{fontSize:8,color:C.td}}>Prévu</div><div style={{fontWeight:900,fontSize:18,color:C.acc}}>{fmt(prevu)}€</div></div>
     <div><div style={{fontSize:8,color:C.td}}>Réalisé</div><div style={{fontWeight:900,fontSize:18,color:prevuColor}}>{fmt(realise)}€</div></div>
     <div><div style={{fontSize:8,color:C.td}}>%</div><div style={{fontWeight:900,fontSize:18,color:prevuColor}}>{prevuPct}%</div></div>
    </div>
    <div style={{height:6,background:C.brd,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(prevuPct,100)}%`,background:prevuColor,borderRadius:3,transition:"width .5s ease"}}/></div>
   </div>}
  </div>
  {/* Hero KPIs */}
  {(()=>{
   const sparkData=useMemo(()=>{
    const months=[];let m=cm;for(let i=0;i<6;i++){months.unshift(m);m=prevM(m);}
    return{
     ca:months.map(mo=>pf(gr(reps,soc.id,mo)?.ca)),
     charges:months.map(mo=>pf(gr(reps,soc.id,mo)?.charges)),
     marge:months.map(mo=>pf(gr(reps,soc.id,mo)?.ca)-pf(gr(reps,soc.id,mo)?.charges)),
     treso:months.map(mo=>{const bd=socBank?.[soc.id];return bd?.monthly?.[mo]?bd.monthly[mo].income-bd.monthly[mo].expense:0;}),
    };
   },[reps,soc.id,cm,socBank]);
   const Sparkline=({data,color})=>{if(!data||data.every(v=>v===0))return null;const max=Math.max(...data,1);const min=Math.min(...data,0);const range=max-min||1;const w=48,h=18;const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*h}`).join(" ");return <svg width={w} height={h} style={{marginLeft:6,flexShrink:0}}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".6"/></svg>;};
   const sparkKeys=["ca","charges","marge","treso"];
   return <div className="kpi-grid-responsive rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
    {kpis.map((k,i)=><div key={i} className="fade-up glass-card-static kpi-shimmer" style={{padding:22,animationDelay:`${i*0.1}s`,position:"relative",overflow:"hidden",transition:"all .3s cubic-bezier(.4,0,.2,1)"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=`${k.accent||C.acc}33`;e.currentTarget.style.boxShadow=`0 0 28px ${(k.accent||C.acc)}18`;e.currentTarget.style.transform="translateY(-3px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.06)";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,.3)";e.currentTarget.style.transform="translateY(0)";}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8,fontFamily:FONT_TITLE}}>{k.label}</div>
      {i<4&&<Sparkline data={sparkData[sparkKeys[i]]} color={k.accent||C.acc}/>}
     </div>
     <div style={{fontSize:30,fontWeight:900,color:k.accent||C.t,lineHeight:1}}>{k.value}</div>
     {k.trend!==undefined&&k.trend!==0&&<div style={{marginTop:6,fontSize:11,fontWeight:700,color:k.trend>0?C.g:C.r}}>{k.trend>0?"▲":"▼"} {Math.abs(k.trend)}% vs N-1</div>}
     {k.trend2!==undefined&&k.trend2!==0&&<div style={{marginTop:4,fontSize:11,fontWeight:700,color:k.trend2>0?(k.label==="Charges"?C.r:C.g):(k.label==="Charges"?C.g:C.r)}}>{k.trend2>0?"▲":"▼"} {Math.abs(k.trend2)}% vs N-1</div>}
     {k.sub&&!k.trend&&!k.trend2&&<div style={{marginTop:6,fontSize:11,fontWeight:700,color:k.accent}}>{k.sub}</div>}
     {k.sub&&(k.trend||k.trend2)&&<div style={{marginTop:2,fontSize:10,fontWeight:600,color:k.accent,opacity:.7}}>{k.sub}</div>}
    </div>)}
   </div>;
  })()}
  {/* Trésorerie évolutive chart */}
  {tresoChartData.some(d=>d.entrees>0||d.sorties>0)&&<div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.25s"}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📈 TRÉSORERIE ÉVOLUTIVE — 6 MOIS</div>
   <div style={{height:220}}>
    <ResponsiveContainer>
     <AreaChart data={tresoChartData} margin={{top:5,right:10,left:0,bottom:5}}>
      <defs>
       <linearGradient id={`gradEnt_${soc.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.g} stopOpacity={0.3}/><stop offset="100%" stopColor={C.g} stopOpacity={0.02}/></linearGradient>
       <linearGradient id={`gradSort_${soc.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.r} stopOpacity={0.3}/><stop offset="100%" stopColor={C.r} stopOpacity={0.02}/></linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
      <XAxis dataKey="month" tick={{fill:C.td,fontSize:10}} axisLine={false} tickLine={false}/>
      <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/>
      <Tooltip content={<CTip/>}/>
      <Area type="monotone" dataKey="entrees" stroke={C.g} strokeWidth={2} fill={`url(#gradEnt_${soc.id})`} name="Entrées" animationDuration={1000}/>
      <Area type="monotone" dataKey="sorties" stroke={C.r} strokeWidth={2} fill={`url(#gradSort_${soc.id})`} name="Sorties" animationDuration={1000}/>
      <Line type="monotone" dataKey="marge" stroke={C.acc} strokeWidth={2.5} dot={false} name="Marge" animationDuration={1000}/>
      <Legend wrapperStyle={{fontSize:10}}/>
     </AreaChart>
    </ResponsiveContainer>
   </div>
  </div>}
  {/* Mini Funnel */}
  {funnelData.length>0&&funnelData[0].count>0&&<div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.3s"}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>🔄 FUNNEL DE CONVERSION</div>
   <div style={{display:"flex",flexDirection:"column",gap:0}}>
    {funnelData.map((f,i)=>{const maxW=funnelData[0].count||1;const w=Math.max(25,Math.round(f.count/maxW*100));const conv=i>0&&funnelData[i-1].count>0?Math.round(f.count/funnelData[i-1].count*100):null;
     const val=(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.status==="open").reduce((a,o)=>a+o.value,0);
     return <Fragment key={i}>
      {i>0&&<div style={{fontSize:9,color:C.td,fontWeight:700,textAlign:"center",padding:"3px 0"}}>↓ <span style={{color:conv>=50?C.g:conv>=25?C.o:C.r,fontWeight:800}}>{conv}%</span></div>}
      <div style={{width:`${w}%`,margin:"0 auto",background:`linear-gradient(135deg,${f.color}18,${f.color}30)`,border:`1px solid ${f.color}55`,borderRadius:10,padding:"12px 14px",textAlign:"center",animation:`barExpand .6s ease ${i*0.12}s both`,["--target-w"]:`${w}%`}}>
       <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span style={{fontWeight:900,fontSize:20,color:f.color}}>{f.count}</span>
        <span style={{fontSize:11,color:C.td,fontWeight:600}}>{f.stage}</span>
        {i===1&&val>0&&<span style={{fontSize:9,color:C.acc,fontWeight:700,background:C.accD,padding:"2px 6px",borderRadius:6}}>{fmt(val)}€</span>}
       </div>
      </div>
     </Fragment>;
    })}
   </div>
  </div>}
  {/* Parcours Client Visuel */}
  <ParcoursClientVisuel ghlData={ghlData} socId={soc.id} myClients={myClients}/>
  {/* Gamification XP & Badges */}
  <GamificationPanel soc={soc} ca={ca} myClients={myClients} streak={streak} reps={reps} allM={allM} ghlData={ghlData}/>
  {/* Quick nav to Sales & Pub tabs */}
  <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
   <div className="fade-up glass-card" onClick={()=>setPTab(2)} style={{padding:18,cursor:"pointer",textAlign:"center",animationDelay:"0.32s",borderTop:`2px solid #34d399`}}>
    <div style={{fontSize:24,marginBottom:6}}>📞</div>
    <div style={{fontWeight:700,fontSize:12,color:C.t}}>Sales</div>
    <div style={{fontSize:10,color:C.td,marginTop:2}}>Pipeline, KPIs, analytics</div>
    {(()=>{const gd2=ghlData?.[soc.id];const won2=(gd2?.opportunities||[]).filter(o=>o.status==="won");return won2.length>0?<div style={{marginTop:6,fontWeight:800,fontSize:14,color:C.g}}>{won2.length} deals · {fmt(won2.reduce((a,o)=>a+(o.value||0),0))}€</div>:null;})()}
   </div>
   <div className="fade-up glass-card" onClick={()=>setPTab(3)} style={{padding:18,cursor:"pointer",textAlign:"center",animationDelay:"0.35s",borderTop:`2px solid #f472b6`}}>
    <div style={{fontSize:24,marginBottom:6}}>📣</div>
    <div style={{fontWeight:700,fontSize:12,color:C.t}}>Publicité</div>
    <div style={{fontSize:10,color:C.td,marginTop:2}}>Meta Ads, ROAS, CPL</div>
    {(()=>{let metaRaw3=null;try{metaRaw3=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${cm}`));}catch{}return metaRaw3?.spend?<div style={{marginTop:6,fontWeight:800,fontSize:14,color:"#f472b6"}}>{fmt(metaRaw3.spend)}€ · ROAS {metaRaw3.revenue&&metaRaw3.spend?(metaRaw3.revenue/metaRaw3.spend).toFixed(1)+"x":"—"}</div>:null;})()}
   </div>
  </div>
  {/* Pulse widget */}
  {(()=>{const w=curW();const existing=pulses?.[`${soc.id}_${w}`];return <PulseDashWidget soc={soc} existing={existing} savePulse={savePulse} hold={hold}/>;})()}
  {/* Today's Agenda Summary + Alerts */}
  <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
   <div className="fade-up glass-card-static" style={{padding:16,animationDelay:"0.3s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.v,letterSpacing:1,marginBottom:8,fontFamily:FONT_TITLE}}>📅 AGENDA DU JOUR</div>
    {(()=>{const now2=new Date();const ts2=now2.toISOString().slice(0,10);const evts2=(ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.startTime||"").startsWith(ts2)).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime)).slice(0,3);
     if(evts2.length===0)return <div style={{color:C.td,fontSize:11}}>Aucun RDV aujourd'hui</div>;
     return evts2.map((e,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:i<evts2.length-1?`1px solid ${C.brd}`:"none"}}>
      <span style={{fontSize:12}}>{/strat/i.test(e.title||"")?"📞":/int[eé]g/i.test(e.title||"")?"🤝":"📅"}</span>
      <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.contactName||e.title||"RDV"}</div><div style={{fontSize:8,color:C.td}}>{new Date(e.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div></div>
     </div>);
    })()}
   </div>
   <div className="fade-up glass-card-static" style={{padding:16,animationDelay:"0.35s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.o,letterSpacing:1,marginBottom:8,fontFamily:FONT_TITLE}}>🔔 ALERTES</div>
    {(()=>{const alerts=[];const gd2=ghlData?.[soc.id];const h48=Date.now()-48*36e5;
     (gd2?.ghlClients||[]).filter(c2=>new Date(c2.at||c2.dateAdded||0).getTime()>h48).slice(0,2).forEach(c2=>{alerts.push({icon:"🟢",text:`Lead: ${c2.name||c2.email||"—"}`});});
     (socBank?.[soc.id]?.transactions||[]).filter(t=>(t.legs?.[0]?.amount||0)>0).slice(0,1).forEach(t=>{alerts.push({icon:"💰",text:`+${fmt(t.legs?.[0]?.amount||0)}€ reçu`});});
     if(alerts.length===0)return <div style={{color:C.td,fontSize:11}}>Rien de nouveau</div>;
     return alerts.map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0"}}><span style={{fontSize:11}}>{a.icon}</span><span style={{fontSize:10,fontWeight:600}}>{a.text}</span></div>);
    })()}
   </div>
  </div>
  {/* Revenue AreaChart (Recharts) */}
  <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.4s"}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📈 ÉVOLUTION CA VS CHARGES — 6 MOIS</div>
   <div style={{height:220}}>
    <ResponsiveContainer>
     <AreaChart data={chartData} margin={{top:5,right:10,left:0,bottom:5}}>
      <defs>
       <linearGradient id={`gradCA_${soc.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={acc2} stopOpacity={0.4}/><stop offset="100%" stopColor={acc2} stopOpacity={0.02}/></linearGradient>
       <linearGradient id={`gradCh_${soc.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.r} stopOpacity={0.3}/><stop offset="100%" stopColor={C.r} stopOpacity={0.02}/></linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
      <XAxis dataKey="month" tick={{fill:C.td,fontSize:10}} axisLine={false} tickLine={false}/>
      <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/>
      <Tooltip content={<CTip/>}/>
      <Area type="monotone" dataKey="ca" stroke={acc2} strokeWidth={2.5} fill={`url(#gradCA_${soc.id})`} name="CA" animationDuration={1200}/>
      <Area type="monotone" dataKey="charges" stroke={C.r} strokeWidth={2} fill={`url(#gradCh_${soc.id})`} name="Charges" animationDuration={1200} animationBegin={300}/>
      <Legend wrapperStyle={{fontSize:10}}/>
     </AreaChart>
    </ResponsiveContainer>
   </div>
  </div>
  {/* Expense Breakdown PieChart */}
  {(()=>{
   const excluded2=EXCLUDED_ACCOUNTS[soc.id]||[];
   const catTotals={};
   if(bankData?.transactions){
    const now2=new Date();const mStart2=new Date(now2.getFullYear(),now2.getMonth(),1);
    bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(excluded2.includes(leg.account_id))return false;return new Date(t.created_at)>=mStart2&&leg.amount<0;}).forEach(t=>{
     const cat=categorizeTransaction(t);const amt=Math.abs(t.legs?.[0]?.amount||0);
     if(cat.id!=="revenus"&&cat.id!=="transfert")catTotals[cat.label]=(catTotals[cat.label]||0)+amt;
    });
   }
   const pieData=Object.entries(catTotals).map(([name,value])=>({name,value:Math.round(value)})).sort((a,b)=>b.value-a.value);
   const PIE_COLORS=[C.r,C.o,C.b,C.v,"#ec4899","#14b8a6",C.acc,"#8b5cf6"];
   if(pieData.length===0)return <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.5s"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📊 RÉPARTITION DES DÉPENSES — {ml(cm)}</div>
    <div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucune donnée de dépenses</div>
   </div>;
   return <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.5s"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📊 RÉPARTITION DES DÉPENSES — {ml(cm)}</div>
    <div style={{display:"flex",alignItems:"center",height:200}}>
     <div style={{width:"50%",height:200}}><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} strokeWidth={0} animationDuration={1000}>{pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><Tooltip content={<CTip/>}/></PieChart></ResponsiveContainer></div>
     <div style={{flex:1,paddingLeft:8}}>{pieData.slice(0,6).map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><span style={{width:8,height:8,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0}}/><span style={{flex:1,fontSize:10,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</span><span style={{fontWeight:700,fontSize:10,color:C.t}}>{fmt(d.value)}€</span></div>)}</div>
    </div>
   </div>;
  })()}
  {/* Pipeline Funnel */}
  {ghlStats&&<div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.6s"}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📊 CHIFFRES CLÉS</div>
   {(()=>{
    const totalContacts=ghlData?.[soc.id]?.ghlClients?.length||0;
    const inPipeline=ghlOpps.filter(o=>o.status==="open").length;
    const wonAll=ghlOpps.filter(o=>o.status==="won");
    const lostAll=ghlOpps.filter(o=>o.status==="lost");
    const wonVal=wonAll.reduce((a,o)=>a+o.value,0);
    const pipeVal=ghlOpps.filter(o=>o.status==="open").reduce((a,o)=>a+o.value,0);
    const cbt=ghlStats.callsByType||{};const stratCalls=Object.entries(cbt).filter(([n])=>!n.toLowerCase().includes("intégration")&&!n.toLowerCase().includes("integration")).reduce((a,[,v])=>a+v,0);
    const integCalls=Object.entries(cbt).filter(([n])=>n.toLowerCase().includes("intégration")||n.toLowerCase().includes("integration")).reduce((a,[,v])=>a+v,0);
    const convRate=stratCalls>0?Math.round(integCalls/stratCalls*100):0;
    const kpis=[
     {icon:"👥",label:"Contacts total",value:totalContacts,color:"#60a5fa"},
     {icon:"🎯",label:"Dans la pipeline",value:inPipeline,sub:fmt(pipeVal)+"€",color:C.acc},
     {icon:"✅",label:"Clients gagnés",value:wonAll.length,sub:fmt(wonVal)+"€",color:C.g},
     {icon:"❌",label:"Clients perdus",value:lostAll.length,color:C.r},
     {icon:"📈",label:"Taux de conversion",value:convRate+"%",sub:stratCalls>0?`${integCalls}/${stratCalls} appels`:null,color:"#a78bfa"},
     ...Object.entries(ghlStats.callsByType||{}).map(([name,count])=>{const isInteg=name.toLowerCase().includes("intégration")||name.toLowerCase().includes("integration");return{icon:isInteg?"🤝":"📞",label:name.replace(/ - LEADX| - .*$/gi,"").trim(),value:count,color:isInteg?"#a78bfa":"#14b8a6"};}),
     {icon:"💰",label:"Valeur moyenne",value:fmt(ghlStats.avgDealSize)+"€",color:C.acc},
     (()=>{const evts=ghlData?.[soc.id]?.calendarEvents||[];const total=evts.length;const noShow=evts.filter(e=>(e.status||"").toLowerCase().includes("cancelled")||(e.status||"").toLowerCase().includes("no_show")||(e.status||"").toLowerCase().includes("no-show")).length;const rate=total>0?Math.round(noShow/total*100):0;return{icon:"🚫",label:"No-show",value:rate+"%",sub:total>0?`${noShow}/${total} RDV`:null,color:C.r};})(),
     (()=>{const wonOpps2=(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.status==="won");const cls2=ghlData?.[soc.id]?.ghlClients||[];if(wonOpps2.length===0)return{icon:"⏱️",label:"Conversion moy.",value:"—",color:C.o};let totalDays=0,count2=0;wonOpps2.forEach(o=>{const cid=o.contact?.id;const cl=cls2.find(c=>c.ghlId===cid);const created=cl?.at||o.createdAt;const won2=o.updatedAt||o.createdAt;if(created&&won2){const diff=Math.max(0,Math.round((new Date(won2)-new Date(created))/(864e5)));totalDays+=diff;count2++;}});const avg2=count2>0?Math.round(totalDays/count2):0;return{icon:"⏱️",label:"Conversion moy.",value:count2>0?`${avg2}j`:"—",sub:count2>0?`sur ${count2} deals`:null,color:C.o};})(),
    ];
    return <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
     {kpis.map((k,i)=><div key={i} style={{padding:"12px 10px",background:k.color+"10",borderRadius:10,border:`1px solid ${k.color}22`,textAlign:"center"}}>
      <div style={{fontSize:18,marginBottom:4}}>{k.icon}</div>
      <div style={{fontWeight:900,fontSize:20,color:k.color}}>{k.value}</div>
      {k.sub&&<div style={{fontSize:9,color:k.color,fontWeight:600,opacity:.8}}>{k.sub}</div>}
      <div style={{fontSize:8,color:C.td,marginTop:2,fontWeight:600}}>{k.label}</div>
     </div>)}
    </div>;
   })()}
  </div>}
  {/* Prospect/Client Evolution Chart */}
  {ghlStats&&(()=>{
   const cls3=ghlData?.[soc.id]?.ghlClients||[];const wonOpps3=(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.status==="won");
   const now3=new Date();const months3=[];for(let i=5;i>=0;i--){const d=new Date(now3.getFullYear(),now3.getMonth()-i,1);months3.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:MN[d.getMonth()]});}
   const evoData=months3.map(mo=>{const prospects=cls3.filter(c=>{const dt=(c.at||c.createdAt||"").slice(0,7);return dt===mo.key;}).length;const clients3=wonOpps3.filter(o=>{const dt=(o.updatedAt||o.createdAt||"").slice(0,7);return dt===mo.key;}).length;return{month:mo.label,prospects,clients:clients3};});
   return <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.65s"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📈 NOUVEAUX PROSPECTS & CLIENTS — 6 MOIS</div>
    <div style={{height:200}}>
     <ResponsiveContainer>
      <AreaChart data={evoData} margin={{top:5,right:10,left:0,bottom:5}}>
       <defs>
        <linearGradient id={`gradP_${soc.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.o} stopOpacity={0.4}/><stop offset="100%" stopColor={C.o} stopOpacity={0.02}/></linearGradient>
        <linearGradient id={`gradCl_${soc.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.g} stopOpacity={0.4}/><stop offset="100%" stopColor={C.g} stopOpacity={0.02}/></linearGradient>
       </defs>
       <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
       <XAxis dataKey="month" tick={{fill:C.td,fontSize:10}} axisLine={false} tickLine={false}/>
       <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} allowDecimals={false}/>
       <Tooltip content={<CTip/>}/>
       <Area type="monotone" dataKey="prospects" stroke={C.o} strokeWidth={2.5} fill={`url(#gradP_${soc.id})`} name="Prospects" animationDuration={1200}/>
       <Area type="monotone" dataKey="clients" stroke={C.g} strokeWidth={2.5} fill={`url(#gradCl_${soc.id})`} name="Clients gagnés" animationDuration={1200} animationBegin={300}/>
       <Legend wrapperStyle={{fontSize:10}}/>
      </AreaChart>
     </ResponsiveContainer>
    </div>
   </div>;
  })()}
  {/* Lead Sources */}
  {ghlStats&&(()=>{
   const cls4=ghlData?.[soc.id]?.ghlClients||[];
   const srcMap={};cls4.forEach(c=>{const src=c.source||c.notes?.split(",").find(t=>t.trim())||"Inconnu";const key=src.trim()||"Inconnu";srcMap[key]=(srcMap[key]||0)+1;});
   const sources=Object.entries(srcMap).sort((a,b)=>b[1]-a[1]);
   const srcColors=["#60a5fa","#FFAA00","#34d399","#fb923c","#a78bfa","#f43f5e","#14b8a6","#ec4899","#eab308","#8b5cf6"];
   if(sources.length===0)return null;
   return <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.7s"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📣 SOURCES DES LEADS</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
     {sources.map(([src,count],i)=><span key={src} style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:700,background:srcColors[i%srcColors.length]+"18",color:srcColors[i%srcColors.length],border:`1px solid ${srcColors[i%srcColors.length]}33`}}>{src} <span style={{fontWeight:900}}>{count}</span></span>)}
    </div>
   </div>;
  })()}
  {/* OKR / Objectifs */}
  {(()=>{
   const okrKey=`okr_${soc.id}`;const stored=JSON.parse(localStorage.getItem(okrKey)||"[]");
   const defaults=[
    {id:"ca",label:"Objectif CA mensuel",target:soc.obj||5000,current:ca,unit:"€",icon:"💰"},
    {id:"clients",label:"Nouveaux clients ce mois",target:5,current:(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.status==="won"&&o.updatedAt&&new Date(o.updatedAt).toISOString().startsWith(curM())).length,unit:"",icon:"🤝"},
    {id:"calls",label:"Appels réalisés ce mois",target:30,current:(ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>e.startTime&&new Date(e.startTime).toISOString().startsWith(curM())).length,unit:"",icon:"📞"},
   ];
   const okrs=defaults.map(d=>{const s=stored.find(x=>x.id===d.id);return{...d,target:s?.target||d.target};});
   return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.55s"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>🎯 OBJECTIFS DU MOIS</div>
    {okrs.map((o,i)=>{const pctV=o.target>0?Math.min(100,Math.round(o.current/o.target*100)):0;const done=pctV>=100;
     return <div key={o.id} style={{marginBottom:i<okrs.length-1?10:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
       <span style={{fontSize:10,fontWeight:600}}>{o.icon} {o.label}</span>
       <span style={{fontSize:10,fontWeight:800,color:done?C.g:pctV>60?C.acc:C.td}}>{o.current}{o.unit} / {o.target}{o.unit} ({pctV}%)</span>
      </div>
      <div style={{height:6,background:C.brd,borderRadius:3,overflow:"hidden"}}>
       <div style={{height:"100%",width:`${pctV}%`,background:done?`linear-gradient(90deg,${C.g},#34d399)`:`linear-gradient(90deg,${acc2},#FF9D00)`,borderRadius:3,transition:"width .5s"}}/>
      </div>
     </div>;
    })}
   </div>;
  })()}
  {/* 🎯 Objectifs CA mensuel */}
  {(()=>{const goal=soc.obj||0;if(!goal)return null;const pctG=ca>0?Math.round(ca/goal*100):0;const prevGoalPct=prevCa>0&&goal?Math.round(prevCa/goal*100):0;const diff=pctG-prevGoalPct;return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.45s"}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
    <span style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:.8}}>🎯 OBJECTIF MENSUEL</span>
    {diff!==0&&<span style={{fontSize:10,fontWeight:700,color:diff>0?C.g:C.r}}>{diff>0?"+":""}{diff}% vs mois dernier</span>}
   </div>
   <div style={{display:"flex",alignItems:"center",gap:14}}>
    <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
     <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="30" fill="none" stroke={C.brd} strokeWidth="6"/><circle cx="36" cy="36" r="30" fill="none" stroke="url(#objGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${Math.min(pctG,100)*1.884} 188.4`} transform="rotate(-90 36 36)" style={{transition:"stroke-dasharray .8s ease"}}/><defs><linearGradient id="objGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFBF00"/><stop offset="100%" stopColor="#FF9D00"/></linearGradient></defs></svg>
     <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:pctG>=100?C.g:C.acc}}>{pctG}%</div>
    </div>
    <div>
     <div style={{fontWeight:900,fontSize:22,color:C.t}}>{fmt(ca)}€ <span style={{fontSize:13,color:C.td,fontWeight:500}}>/ {fmt(goal)}€</span></div>
     <div style={{fontSize:10,color:pctG>=100?C.g:pctG>=60?C.acc:C.td,fontWeight:600,marginTop:2}}>{pctG>=100?"🎉 Objectif atteint !":pctG>=75?"Presque ! Continue comme ça":"En progression..."}</div>
    </div>
   </div>
   <div style={{marginTop:10,height:8,background:C.brd,borderRadius:4,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${Math.min(pctG,100)}%`,background:"linear-gradient(90deg,#FFBF00,#FF9D00)",borderRadius:4,transition:"width .8s ease"}}/>
   </div>
  </div>;})()}
  {/* Quick Actions */}
  <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:12,marginBottom:20}}>
   {[{icon:"👥",title:"Clients",sub:"Portefeuille",tab:9},{icon:"🏦",title:"Banque",sub:"Transactions",tab:5},{icon:"⚙️",title:"Paramètres",sub:"Configurer",tab:12}].map((a,i)=>
    <div key={i} className="fade-up glass-card" onClick={()=>setPTab(a.tab)} style={{padding:18,cursor:"pointer",textAlign:"center",animationDelay:`${0.5+i*0.1}s`}}>
     <div style={{fontSize:24,marginBottom:6}}>{a.icon}</div>
     <div style={{fontWeight:700,fontSize:12,color:C.t}}>{a.title}</div>
     <div style={{fontSize:10,color:C.td,marginTop:2}}>{a.sub}</div>
    </div>
   )}
  </div>
  {/* Recent transactions */}
  {recentTx.length>0&&<div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.8s"}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
    <span style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:.8}}>DERNIÈRES TRANSACTIONS</span>
    <span onClick={()=>setPTab(5)} style={{color:acc2,fontSize:10,fontWeight:600,cursor:"pointer"}}>Voir tout →</span>
   </div>
   {recentTx.map((tx,i)=>{const leg=tx.legs?.[0];if(!leg)return null;const isIn=leg.amount>0;const cat=categorizeTransaction(tx);
    const catColors={"revenus":C.g,"loyer":"#f59e0b","pub":"#ec4899","abonnements":C.b,"equipe":C.o,"transfert":"#6366f1","dividendes":"#7c3aed","autres":C.td};
    return <div key={tx.id||i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<recentTx.length-1?`1px solid ${C.brd}`:"none"}}>
     <span style={{width:22,height:22,borderRadius:6,background:isIn?C.gD:C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:isIn?C.g:C.r,flexShrink:0}}>{cat.icon||"↑"}</span>
     <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{leg.description||tx.reference||"—"}</span><span style={{fontSize:8,padding:"1px 5px",borderRadius:8,background:(catColors[cat.id]||C.td)+"22",color:catColors[cat.id]||C.td,fontWeight:600,flexShrink:0}}>{cat.label}</span></div>
      <div style={{fontSize:9,color:C.td}}>{new Date(tx.created_at).toLocaleDateString("fr-FR")}</div>
     </div>
     <span style={{fontWeight:700,fontSize:11,color:isIn?C.g:C.r}}>{isIn?"+":""}{fmt(leg.amount)}€</span>
    </div>;
   })}
  </div>}
  {/* Pipeline snapshot */}
  {ghlStats&&<div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.9s"}}>
   <div style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:10}}>PIPELINE</div>
   <div style={{display:"flex",gap:12,marginBottom:12}}>
    <div><div style={{fontSize:20,fontWeight:900,color:acc2}}>{fmt(ghlStats.pipelineValue)}€</div><div style={{fontSize:9,color:C.td}}>Valeur pipeline</div></div>
    <div><div style={{fontSize:20,fontWeight:900,color:C.b}}>{ghlStats.openDeals}</div><div style={{fontSize:9,color:C.td}}>Deals actifs</div></div>
    <div><div style={{fontSize:20,fontWeight:900,color:C.g}}>{ghlStats.wonDeals}</div><div style={{fontSize:9,color:C.td}}>Gagnés</div></div>
   </div>
   {ghlStages.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
    {ghlStages.map((stage,i)=>{const count=ghlOpps.filter(o=>o.stage===stage).length;
     return <span key={i} style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:600,background:GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]+"22",color:GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length],border:`1px solid ${GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]}33`}}>{stage}: {count}</span>;
    })}
   </div>}
  </div>}
  {/* Top Clients */}
  {(()=>{
   const ghlCl=ghlData?.[soc.id]?.ghlClients||[];
   const allCl=[...(clients||[]).filter(c=>c.socId===soc.id),...ghlCl.filter(gc=>!(clients||[]).some(c=>c.ghlId===(gc.ghlId||gc.id)))];
   const withRevenue=allCl.map(c=>({...c,revenue:clientMonthlyRevenue(c)})).filter(c=>c.revenue>0).sort((a,b)=>b.revenue-a.revenue).slice(0,5);
   const wonOpps=(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.status==="won").sort((a,b)=>(b.value||0)-(a.value||0)).slice(0,5);
   const topList=withRevenue.length>0?withRevenue:wonOpps.map(o=>({name:o.name||o.contact?.name||"—",revenue:o.value||0,status:"active"}));
   if(topList.length===0)return null;
   return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"1s"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
     <span style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:.8}}>🏅 TOP CLIENTS</span>
     <span onClick={()=>setPTab(9)} style={{color:acc2,fontSize:10,fontWeight:600,cursor:"pointer"}}>Voir tous →</span>
    </div>
    {topList.map((c,i)=><div key={c.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<topList.length-1?`1px solid ${C.brd}`:"none"}}>
     <span style={{width:24,height:24,borderRadius:8,background:i===0?"linear-gradient(135deg,#FFBF00,#FF9D00)":i===1?"linear-gradient(135deg,#c0c0c0,#a0a0a0)":i===2?"linear-gradient(135deg,#cd7f32,#a0622e)":C.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:i<3?"#0a0a0f":C.td,flexShrink:0}}>{i+1}</span>
     <div style={{flex:1,minWidth:0}}>
      <div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name||"—"}</div>
      <div style={{fontSize:9,color:C.td}}>{c.status==="active"?"Client actif":"Prospect"}</div>
     </div>
     <div style={{textAlign:"right"}}>
      <div style={{fontWeight:800,fontSize:13,color:acc2}}>{fmt(c.revenue)}€</div>
      <div style={{fontSize:8,color:C.td}}>/mois</div>
     </div>
    </div>)}
   </div>;
  })()}

  {/* ===== 🧠 ORACLE — Prédictions IA ===== */}
  {(()=>{
   const oraclePredictions=useMemo(()=>{
    const preds=[];const gd=ghlData?.[soc.id];const excl=EXCLUDED_ACCOUNTS[soc.id]||[];const now=Date.now();
    // 1. Churn prediction per active client
    myClients.forEach(cl=>{
     let risk=0;
     const cn=(cl.name||"").toLowerCase().trim();
     // Days since last payment
     const lastPay=(bankData?.transactions||[]).filter(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl.includes(leg.account_id))return false;return(leg.description||tx.reference||"").toLowerCase().includes(cn);}).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
     const daysSincePay=lastPay?Math.round((now-new Date(lastPay.created_at).getTime())/864e5):999;
     if(daysSincePay>45)risk+=40;
     // Days since last call
     const calEvts=gd?.calendarEvents||[];
     const lastCall=calEvts.filter(e=>(e.contactName||e.title||"").toLowerCase().includes(cn)).sort((a,b)=>new Date(b.startTime)-new Date(a.startTime))[0];
     const daysSinceCall=lastCall?Math.round((now-new Date(lastCall.startTime).getTime())/864e5):999;
     if(daysSinceCall>30)risk+=30;
     // Contract ending <60d
     const end=commitmentEnd(cl);if(end&&(end.getTime()-now)<60*864e5&&(end.getTime()-now)>0)risk+=30;
     if(risk>60)preds.push({type:"churn",icon:"⚠️",text:`${cl.name||"Client"} risque de partir — Confiance: ${Math.min(risk,100)}%`,confidence:Math.min(risk,100),action:"Planifier un appel",actionTab:9,priority:risk});
    });
    // 2. CA prediction (last 3 months trend)
    const months3=[];let m3=cm;for(let i=0;i<3;i++){months3.unshift(m3);m3=prevM(m3);}
    const cas3=months3.map(mo=>pf(gr(reps,soc.id,mo)?.ca));
    if(cas3.filter(v=>v>0).length>=2){
     const avg3=cas3.reduce((a,v)=>a+v,0)/cas3.length;
     const trend3=cas3.length>=2&&cas3[0]>0?(cas3[cas3.length-1]-cas3[0])/cas3[0]:0;
     const predicted=Math.round(cas3[cas3.length-1]*(1+trend3/2));
     const margin3=Math.round(Math.abs(trend3)*50+10);
     preds.push({type:"ca",icon:"📈",text:`CA prévu le mois prochain: ${fmt(predicted)}€ (±${margin3}%)`,confidence:Math.max(30,Math.min(85,70-Math.abs(margin3))),action:"Voir les détails",actionTab:0,priority:80});
    }
    // 3. Pipeline prediction
    const pipeVal=(gd?.opportunities||[]).filter(o=>o.status==="open").reduce((a,o)=>a+(o.value||0),0);
    const totalOpps=(gd?.opportunities||[]).length;const wonOpps2=(gd?.opportunities||[]).filter(o=>o.status==="won").length;
    const convR2=totalOpps>0?wonOpps2/totalOpps:0.2;
    if(pipeVal>0){
     const expected=Math.round(pipeVal*convR2);
     preds.push({type:"pipeline",icon:"🎯",text:`${fmt(pipeVal)}€ de deals en cours → ~${fmt(expected)}€ de CA attendu`,confidence:Math.round(convR2*100),action:"Voir pipeline",actionTab:2,priority:70});
    }
    // 4. CPL trend
    const cplMonths=[];let cm2=cm;for(let i=0;i<3;i++){cplMonths.unshift(cm2);cm2=prevM(cm2);}
    const cpls=cplMonths.map(mo=>{try{const raw=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${mo}`));return raw?.cpl||0;}catch{return 0;}});
    if(cpls.filter(v=>v>0).length>=2&&cpls[cpls.length-1]>cpls[0]&&cpls[0]>0){
     preds.push({type:"cpl",icon:"📣",text:`Ton CPL augmente — passe de ${fmt(cpls[0])}€ à ${fmt(cpls[cpls.length-1])}€. Optimise tes audiences`,confidence:75,action:"Voir Pub",actionTab:3,priority:65});
    }
    return preds.sort((a,b)=>b.priority-a.priority).slice(0,4);
   },[myClients,bankData,ghlData,soc.id,reps,cm]);
   if(oraclePredictions.length===0)return null;
   return <div className="fade-up" style={{marginBottom:20,animationDelay:"1.05s"}}>
    <div style={{padding:3,borderRadius:18,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)"}}>
     <div className="glass-card-static" style={{padding:20,borderRadius:15}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
       <span style={{fontSize:10,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"#fff",padding:"2px 8px",borderRadius:10,fontWeight:800}}>🧠</span>
       <span style={{fontSize:11,fontWeight:800,letterSpacing:1,color:C.t,fontFamily:FONT_TITLE}}>ORACLE — PRÉDICTIONS IA</span>
      </div>
      <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
       {oraclePredictions.map((p,i)=><div key={i} className="fu" style={{padding:14,background:"rgba(99,102,241,.06)",border:"1px solid rgba(99,102,241,.15)",borderRadius:12,animationDelay:`${1.1+i*0.08}s`}}>
        <div style={{fontSize:20,marginBottom:6}}>{p.icon}</div>
        <div style={{fontSize:11,fontWeight:600,color:C.t,marginBottom:8,lineHeight:1.4}}>{p.text}</div>
        <div style={{marginBottom:8}}>
         <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:8,color:C.td}}>Confiance</span><span style={{fontSize:8,fontWeight:700,color:p.confidence>70?C.g:p.confidence>40?C.o:C.r}}>{p.confidence}%</span></div>
         <div style={{height:4,background:C.brd,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${p.confidence}%`,background:p.confidence>70?C.g:p.confidence>40?C.o:C.r,borderRadius:2,transition:"width .5s"}}/></div>
        </div>
        <button onClick={()=>setPTab(p.actionTab||0)} style={{width:"100%",padding:"5px 0",borderRadius:8,border:`1px solid rgba(99,102,241,.25)`,background:"rgba(99,102,241,.08)",color:"#818cf8",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>{p.action}</button>
       </div>)}
      </div>
     </div>
    </div>
   </div>;
  })()}

  {/* ===== 📊 SCORE ECS™ (0-1000) ===== */}
  {(()=>{
   const ecsScore=useMemo(()=>{
    const gd=ghlData?.[soc.id];const excl=EXCLUDED_ACCOUNTS[soc.id]||[];const now=Date.now();
    // Payment regularity (0-200)
    const months6=[];let m6=cm;for(let i=0;i<6;i++){months6.unshift(m6);m6=prevM(m6);}
    let paidMonths=0;
    months6.forEach(mo=>{
     const hasPay=(bankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl.includes(leg.account_id))return false;return(tx.created_at||"").startsWith(mo);});
     if(hasPay)paidMonths++;
    });
    const paymentScore=Math.round(paidMonths/Math.max(months6.length,1)*200);
    // CA growth (0-200)
    const pm2=prevM(cm);const prevCa2=pf(gr(reps,soc.id,pm2)?.ca);
    const growthRate=prevCa2>0?(ca-prevCa2)/prevCa2*100:0;
    const caGrowthScore=growthRate>10?200:growthRate>5?150:growthRate>=0?100:50;
    // Client retention (0-200)
    const churnedCl=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="churned").length;
    const totalCl=myClients.length+churnedCl;
    const churnRate=totalCl>0?churnedCl/totalCl:0;
    const retentionScore=Math.round((1-churnRate)*200);
    // Pipeline health (0-150)
    const pipeVal2=(gd?.opportunities||[]).filter(o=>o.status==="open").reduce((a,o)=>a+(o.value||0),0);
    const ratio=ca>0?pipeVal2/ca:0;
    const pipeScore=ratio>=2&&ratio<=4?150:ratio>4?120:ratio>=1?100:50;
    // Lead responsiveness (0-150)
    const calEvts=gd?.calendarEvents||[];const ghlCl2=gd?.ghlClients||[];
    let totalResp=0,countResp=0;
    ghlCl2.slice(0,20).forEach(lead=>{
     const leadDate=new Date(lead.at||lead.dateAdded||0).getTime();if(!leadDate)return;
     const cn2=(lead.name||"").toLowerCase();
     const firstCall=calEvts.filter(e=>(e.contactName||e.title||"").toLowerCase().includes(cn2)&&new Date(e.startTime).getTime()>leadDate).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime))[0];
     if(firstCall){totalResp+=Math.round((new Date(firstCall.startTime).getTime()-leadDate)/36e5);countResp++;}
    });
    const avgResp=countResp>0?totalResp/countResp:72;
    const respScore=avgResp<24?150:avgResp<48?100:50;
    // Diversification (0-100)
    const uniqueClients=myClients.length;
    const divScore=uniqueClients>10?100:uniqueClients>=5?70:40;
    const total=paymentScore+caGrowthScore+retentionScore+pipeScore+respScore+divScore;
    return{total:clamp(total,0,1000),payment:paymentScore,caGrowth:caGrowthScore,retention:retentionScore,pipeline:pipeScore,responsiveness:respScore,diversification:divScore};
   },[bankData,reps,soc.id,ca,cm,ghlData,myClients,clients]);
   const[displayEcs,setDisplayEcs]=useState(0);
   const[showEcsBreak,setShowEcsBreak]=useState(false);
   useEffect(()=>{let f=0;const t=ecsScore.total;const dur=60;const step=()=>{f++;const p=Math.min(f/dur,1);const e2=1-Math.pow(1-p,3);setDisplayEcs(Math.round(e2*t));if(f<dur)requestAnimationFrame(step);};requestAnimationFrame(step);},[ecsScore.total]);
   // Store in Supabase
   useEffect(()=>{sSet(`ecs_score_${soc.id}_${cm}`,{score:ecsScore.total,breakdown:ecsScore,date:new Date().toISOString()}).catch(()=>{});},[ecsScore,soc.id,cm]);
   const ecsColor=ecsScore.total>800?"#34d399":ecsScore.total>600?"#eab308":ecsScore.total>400?"#fb923c":"#f87171";
   const ecsBadge=ecsScore.total>800?"🏆 Elite":ecsScore.total>600?"⭐ Premium":ecsScore.total>400?"📈 Growth":"⚠️ À risque";
   const arcLen=displayEcs/1000*207.3;
   return <div className="fade-up" style={{marginBottom:20,animationDelay:"1.1s"}}>
    <div className="glass-card-static" style={{padding:24,display:"flex",alignItems:"center",gap:24}}>
     <div style={{position:"relative",width:120,height:120,flexShrink:0,cursor:"pointer"}} onClick={()=>setShowEcsBreak(!showEcsBreak)}>
      <svg width="120" height="120" viewBox="0 0 80 80">
       <defs><linearGradient id="ecsGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={ecsColor}/><stop offset="100%" stopColor={ecsScore.total>600?"#FFAA00":ecsColor}/></linearGradient></defs>
       <circle cx="40" cy="40" r="33" fill="none" stroke={C.brd} strokeWidth="5"/>
       <circle cx="40" cy="40" r="33" fill="none" stroke="url(#ecsGrad)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${arcLen} 207.3`} transform="rotate(-90 40 40)" style={{transition:"stroke-dasharray .8s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
       <div style={{fontWeight:900,fontSize:28,color:ecsColor,lineHeight:1}}>{displayEcs}</div>
       <div style={{fontSize:7,fontWeight:700,color:C.td,letterSpacing:.5,marginTop:2}}>Score ECS™</div>
      </div>
     </div>
     <div style={{flex:1}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
       <span style={{fontSize:14}}>{ecsBadge.split(" ")[0]}</span>
       <span style={{fontWeight:900,fontSize:16,color:ecsColor}}>{ecsBadge.split(" ").slice(1).join(" ")}</span>
      </div>
      <div style={{fontSize:10,color:C.td,marginBottom:8}}>Score propriétaire basé sur 6 critères de performance</div>
      {showEcsBreak&&<div className="slide-down rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
       {[{l:"Paiements",v:ecsScore.payment,m:200},{l:"Croissance CA",v:ecsScore.caGrowth,m:200},{l:"Rétention",v:ecsScore.retention,m:200},{l:"Pipeline",v:ecsScore.pipeline,m:150},{l:"Réactivité",v:ecsScore.responsiveness,m:150},{l:"Diversification",v:ecsScore.diversification,m:100}].map((b,i)=><div key={i} style={{fontSize:9,color:C.td}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span>{b.l}</span><span style={{fontWeight:700,color:b.v/b.m>.7?C.g:b.v/b.m>.4?C.o:C.r}}>{b.v}/{b.m}</span></div>
        <div style={{height:3,background:C.brd,borderRadius:2,marginTop:1}}><div style={{height:"100%",width:`${b.v/b.m*100}%`,background:b.v/b.m>.7?C.g:b.v/b.m>.4?C.o:C.r,borderRadius:2}}/></div>
       </div>)}
      </div>}
     </div>
    </div>
   </div>;
  })()}

  {/* ===== 🏆 QUÊTES & MILESTONES ===== */}
  {(()=>{
   const monthlyCA=ca;const activeClients=myClients.length;
   const churnedCl2=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="churned");
   const lastChurnDate=churnedCl2.length>0?Math.max(...churnedCl2.map(c=>new Date(c.churnDate||c.updatedAt||0).getTime())):0;
   const daysSinceLastChurn=lastChurnDate>0?Math.round((Date.now()-lastChurnDate)/864e5):999;
   const gd4=ghlData?.[soc.id];const cbt4=gd4?.stats?.callsByType||{};
   const strat4=Object.entries(cbt4).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
   const integ4=Object.entries(cbt4).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
   const conversionRate=strat4>0?Math.round(integ4/strat4*100):0;
   // Avg response time
   const calEvts4=gd4?.calendarEvents||[];const ghlCl4=gd4?.ghlClients||[];
   let totResp4=0,cntResp4=0;
   ghlCl4.slice(0,20).forEach(lead=>{const ld=new Date(lead.at||lead.dateAdded||0).getTime();if(!ld)return;const cn4=(lead.name||"").toLowerCase();const fc=calEvts4.filter(e=>(e.contactName||e.title||"").toLowerCase().includes(cn4)&&new Date(e.startTime).getTime()>ld).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime))[0];if(fc){totResp4+=Math.round((new Date(fc.startTime).getTime()-ld)/36e5);cntResp4++;}});
   const avgResponseTime=cntResp4>0?totResp4/cntResp4:72;
   const QUESTS=[
    {id:"first_client",title:"Premier Client",desc:"Signe ton premier client",icon:"🎯",done:activeClients>=1},
    {id:"ca_5k",title:"Cap des 5K€",desc:"Atteins 5,000€ de CA mensuel",icon:"💰",done:monthlyCA>=5000},
    {id:"ca_10k",title:"Cap des 10K€",desc:"Atteins 10,000€ de CA mensuel",icon:"🔥",done:monthlyCA>=10000},
    {id:"no_churn_30",title:"Zéro Churn",desc:"30 jours sans perdre de client",icon:"🛡️",done:daysSinceLastChurn>=30},
    {id:"conversion_15",title:"Machine à Closer",desc:"Taux de conversion >15%",icon:"⚡",done:conversionRate>15},
    {id:"response_fast",title:"Speed Demon",desc:"Réponds aux leads en <24h",icon:"🚀",done:avgResponseTime<24},
    {id:"clients_10",title:"Double Digits",desc:"10 clients actifs",icon:"👥",done:activeClients>=10},
    {id:"ca_50k",title:"Légende",desc:"50,000€ de CA mensuel",icon:"🏆",done:monthlyCA>=50000},
   ];
   // Load/save completed quests
   const[completedQuests,setCompletedQuests]=useState(()=>{try{return JSON.parse(localStorage.getItem(`quests_${soc.id}`)||"{}") }catch{return{};}});
   const[celebrating,setCelebrating]=useState(null);
   useEffect(()=>{
    let changed=false;const nq={...completedQuests};
    QUESTS.forEach(q=>{if(q.done&&!nq[q.id]){nq[q.id]=new Date().toISOString();changed=true;setCelebrating(q.id);}});
    if(changed){setCompletedQuests(nq);try{localStorage.setItem(`quests_${soc.id}`,JSON.stringify(nq));}catch{}sSet(`quests_${soc.id}`,nq).catch(()=>{});}
   },[]);
   useEffect(()=>{if(celebrating){const t=setTimeout(()=>setCelebrating(null),3000);return()=>clearTimeout(t);}},[celebrating]);
   const completed=QUESTS.filter(q=>q.done||completedQuests[q.id]).length;
   const tier=completed>=7?"Légende":completed>=5?"Expert":completed>=3?"Confirmé":"Débutant";
   const tierIcon=completed>=7?"🏆":completed>=5?"⚡":completed>=3?"⭐":"🌱";
   return <div className="fade-up" style={{marginBottom:20,animationDelay:"1.15s"}}>
    <div className="glass-card-static" style={{padding:20}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
       <span style={{fontSize:18}}>{tierIcon}</span>
       <div>
        <span style={{fontSize:11,fontWeight:800,letterSpacing:1,color:C.t,fontFamily:FONT_TITLE}}>PROGRESSION</span>
        <div style={{fontSize:9,color:C.acc,fontWeight:700}}>{tier} · {completed}/{QUESTS.length} quêtes</div>
       </div>
      </div>
      <div style={{width:80,height:6,background:C.brd,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${completed/QUESTS.length*100}%`,background:"linear-gradient(90deg,#FFBF00,#FF9D00)",borderRadius:3,transition:"width .5s"}}/></div>
     </div>
     <div className="rg4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
      {QUESTS.map((q,i)=>{const isDone=q.done||!!completedQuests[q.id];const isCeleb=celebrating===q.id;
       return <div key={q.id} style={{padding:12,borderRadius:12,background:isDone?"rgba(255,170,0,.08)":"rgba(255,255,255,.02)",border:`1px solid ${isDone?"rgba(255,170,0,.3)":"rgba(255,255,255,.04)"}`,textAlign:"center",opacity:isDone?1:.45,transition:"all .3s",position:"relative",overflow:"hidden",...(isCeleb?{animation:"celebGlow 1s ease infinite",boxShadow:"0 0 30px rgba(255,170,0,.3)"}:{})}}>
        {isCeleb&&<div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>{["🎉","⭐","✨","🔥","💫"].map((e,j)=><span key={j} style={{position:"absolute",fontSize:14,left:`${20+j*15}%`,top:-10,animation:`confetti 2s ease ${j*0.2}s forwards`}}>{e}</span>)}</div>}
        <div style={{fontSize:22,marginBottom:4}}>{q.icon}</div>
        <div style={{fontSize:9,fontWeight:700,color:isDone?C.acc:C.td}}>{q.title}</div>
        <div style={{fontSize:7,color:C.td,marginTop:2}}>{q.desc}</div>
        {isDone&&completedQuests[q.id]&&<div style={{fontSize:7,color:C.g,marginTop:3}}>✓ {new Date(completedQuests[q.id]).toLocaleDateString("fr-FR")}</div>}
       </div>;
      })}
     </div>
    </div>
   </div>;
  })()}

  {/* ===== 🔮 SIMULATEUR DE CROISSANCE ===== */}
  {(()=>{
   const[showSim,setShowSim]=useState(false);
   const[simObj,setSimObj]=useState(50000);
   const[simConv,setSimConv]=useState(null);
   const[simBudget,setSimBudget]=useState(null);
   const[simScenario,setSimScenario]=useState("realiste");
   const gd5=ghlData?.[soc.id];
   const avgBilling=myClients.length>0?myClients.reduce((a,c)=>a+clientMonthlyRevenue(c),0)/myClients.length:2000;
   const cbt5=gd5?.stats?.callsByType||{};
   const strat5=Object.entries(cbt5).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
   const integ5=Object.entries(cbt5).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
   const baseConv=strat5>0?Math.round(integ5/strat5*100):15;
   const actualConv=simConv!==null?simConv:baseConv;
   let cplRaw=0;try{const raw=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${cm}`));cplRaw=raw?.cpl||25;}catch{cplRaw=25;}
   const currentBudget=(()=>{try{const raw=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${cm}`));return raw?.spend||0;}catch{return 0;}})();
   const currentLeadsPerMonth=(gd5?.ghlClients||[]).filter(c=>{const d=new Date(c.at||c.dateAdded||0);return(Date.now()-d.getTime())<30*864e5;}).length||1;
   const scenarioMult=simScenario==="optimiste"?1.2:simScenario==="pessimiste"?0.8:1;
   const clientsNeeded=Math.ceil(simObj/(avgBilling||1));
   const leadsNeeded=actualConv>0?Math.ceil(clientsNeeded/(actualConv/100)*scenarioMult):clientsNeeded*10;
   const budgetNeeded=simBudget!==null?simBudget:Math.round(leadsNeeded*cplRaw);
   const growthRate=prevCa>0?(ca-prevCa)/prevCa:0.1;
   const timeline=growthRate>0?Math.round((simObj-ca)/(ca*growthRate)*10)/10:0;
   const funnel=[
    {icon:"🎯",label:"Objectif",value:`${fmt(simObj)}€/mois`,sub:null,color:C.acc},
    {icon:"👥",label:"Clients nécessaires",value:String(clientsNeeded),sub:`tu en as ${myClients.length}`,color:C.b},
    {icon:"📞",label:"Leads nécessaires",value:`${fmt(leadsNeeded)}/mois`,sub:`tu en reçois ${currentLeadsPerMonth}/mois`,color:C.v},
    {icon:"📣",label:"Budget pub",value:`${fmt(budgetNeeded)}€/mois`,sub:currentBudget>0?`tu dépenses ${fmt(currentBudget)}€`:null,color:"#ec4899"},
    {icon:"⏱️",label:"Timeline estimée",value:timeline>0?`${timeline} mois`:"—",sub:null,color:C.g},
   ];
   return <>
    <button onClick={()=>setShowSim(true)} className="fade-up glass-card" style={{width:"100%",padding:16,marginBottom:20,cursor:"pointer",textAlign:"center",animationDelay:"1.2s",border:`1px solid rgba(139,92,246,.2)`,background:"rgba(139,92,246,.05)"}}>
     <span style={{fontSize:20}}>🔮</span>
     <div style={{fontWeight:800,fontSize:12,color:"#a78bfa",marginTop:4}}>Simuler ma croissance</div>
     <div style={{fontSize:9,color:C.td}}>Calcule tes objectifs et le plan pour y arriver</div>
    </button>
    {showSim&&<div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)"}} onClick={e=>{if(e.target===e.currentTarget)setShowSim(false);}}>
     <div className="glass-modal si" style={{width:520,maxHeight:"85vh",overflow:"auto",borderRadius:20,padding:28}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
       <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:24}}>🔮</span><span style={{fontWeight:900,fontSize:16,color:C.t}}>Simulateur de Croissance</span></div>
       <button onClick={()=>setShowSim(false)} style={{background:"none",border:"none",color:C.td,fontSize:18,cursor:"pointer"}}>✕</button>
      </div>
      {/* Objectif slider */}
      <div style={{marginBottom:20}}>
       <label style={{fontSize:10,fontWeight:700,color:C.td,letterSpacing:.5}}>🎯 OBJECTIF CA MENSUEL</label>
       <div style={{display:"flex",alignItems:"center",gap:12,marginTop:6}}>
        <input type="range" min={5000} max={200000} step={1000} value={simObj} onChange={e=>setSimObj(Number(e.target.value))} style={{flex:1}}/>
        <span style={{fontWeight:900,fontSize:18,color:C.acc,minWidth:80,textAlign:"right"}}>{fmt(simObj)}€</span>
       </div>
      </div>
      {/* Conversion rate slider */}
      <div style={{marginBottom:20}}>
       <label style={{fontSize:10,fontWeight:700,color:C.td,letterSpacing:.5}}>📈 TAUX DE CONVERSION (%)</label>
       <div style={{display:"flex",alignItems:"center",gap:12,marginTop:6}}>
        <input type="range" min={1} max={50} step={1} value={actualConv} onChange={e=>setSimConv(Number(e.target.value))} style={{flex:1}}/>
        <span style={{fontWeight:900,fontSize:18,color:C.v,minWidth:40,textAlign:"right"}}>{actualConv}%</span>
       </div>
      </div>
      {/* Scenario selector */}
      <div style={{display:"flex",gap:6,marginBottom:20}}>
       {[{v:"pessimiste",l:"Pessimiste 📉"},{v:"realiste",l:"Réaliste 📊"},{v:"optimiste",l:"Optimiste 🚀"}].map(s=><button key={s.v} onClick={()=>setSimScenario(s.v)} style={{flex:1,padding:"6px 0",borderRadius:10,border:`1px solid ${simScenario===s.v?C.acc+"66":C.brd}`,background:simScenario===s.v?C.accD:"transparent",color:simScenario===s.v?C.acc:C.td,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>{s.l}</button>)}
      </div>
      {/* Funnel */}
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
       {funnel.map((f,i)=>{const w=Math.max(40,100-i*15);
        return <Fragment key={i}>
         {i>0&&<div style={{textAlign:"center",padding:"4px 0",fontSize:12,color:C.td}}>↓</div>}
         <div style={{width:`${w}%`,margin:"0 auto",padding:"14px 16px",background:`${f.color}12`,border:`1px solid ${f.color}33`,borderRadius:12,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>{f.icon}</span>
          <div style={{flex:1}}>
           <div style={{fontSize:9,color:C.td,fontWeight:600}}>{f.label}</div>
           <div style={{fontWeight:900,fontSize:16,color:f.color}}>{f.value}</div>
           {f.sub&&<div style={{fontSize:8,color:C.td}}>({f.sub})</div>}
          </div>
         </div>
        </Fragment>;
       })}
      </div>
     </div>
    </div>}
   </>;
  })()}
 </div>;
}
/* ===== INBOX PANEL ===== */
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
  {items.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucune activité pour cette période</div></Card>}
  {items.map(it=>{const isRead=readIds.includes(it.id);return <div key={it.id} className="fu" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:isRead?"transparent":"rgba(255,170,0,.03)",borderRadius:10,border:`1px solid ${isRead?C.brd:"rgba(255,170,0,.12)"}`,marginBottom:4,transition:"all .2s"}}>
   <span style={{fontSize:16,flexShrink:0}}>{it.icon}</span>
   <div style={{flex:1,minWidth:0}}>
    <div style={{fontSize:12,fontWeight:isRead?500:700,color:isRead?C.td:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.desc}</div>
    <div style={{fontSize:9,color:C.td}}>{ago(it.date)}</div>
   </div>
   {!isRead&&<button onClick={()=>markRead(it.id)} style={{padding:"3px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card,color:C.td,fontSize:9,cursor:"pointer",fontFamily:FONT}}>✓ Lu</button>}
  </div>;})}
 </Sect>;
}

/* ===== AGENDA PANEL ===== */
/* ===== AGENDA PANEL ===== */
export function AgendaPanel({soc,ghlData}){
 const[view,setView]=useState("today");
 const events=useMemo(()=>{
  const gd=ghlData?.[soc.id];const evts=(gd?.calendarEvents||[]).map(e=>({...e,start:new Date(e.startTime||0),end:new Date(e.endTime||e.startTime||0)})).sort((a,b)=>a.start-b.start);
  const now=new Date();const todayStr=now.toISOString().slice(0,10);
  if(view==="today")return evts.filter(e=>e.start.toISOString().slice(0,10)===todayStr);
  const weekEnd=new Date(now.getTime()+7*864e5);return evts.filter(e=>e.start>=now&&e.start<=weekEnd);
 },[ghlData,soc.id,view]);
 const todayEvts=useMemo(()=>{const now=new Date();const ts=now.toISOString().slice(0,10);return(ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.startTime||"").startsWith(ts)).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime));},[ghlData,soc.id]);
 const typeIcon=(title)=>/strat/i.test(title||"")?"📞":/int[eé]g/i.test(title||"")?"🤝":"📅";
 return <Sect title="📅 Agenda" sub="Calendrier & RDV">
  <div style={{display:"flex",gap:4,marginBottom:12}}>{[{v:"today",l:"Aujourd'hui"},{v:"week",l:"Cette semaine"}].map(f2=><button key={f2.v} onClick={()=>setView(f2.v)} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${view===f2.v?C.acc+"66":C.brd}`,background:view===f2.v?C.accD:"transparent",color:view===f2.v?C.acc:C.td,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{f2.l}</button>)}</div>
  {todayEvts.length>0&&<Card style={{marginBottom:12,borderLeft:`3px solid ${C.acc}`}}><div style={{fontSize:10,fontWeight:700,color:C.acc,marginBottom:6}}>📌 AUJOURD'HUI — {todayEvts.length} RDV</div>
   {todayEvts.map((e,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:i<todayEvts.length-1?`1px solid ${C.brd}`:"none"}}>
    <span style={{fontSize:14}}>{typeIcon(e.title)}</span>
    <div style={{flex:1}}><div style={{fontWeight:600,fontSize:11}}>{e.title||e.contactName||"RDV"}</div><div style={{fontSize:9,color:C.td}}>{new Date(e.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}{e.contactName?` · ${e.contactName}`:""}</div></div>
    <span style={{fontSize:8,padding:"2px 6px",borderRadius:8,background:(e.status||"").includes("confirmed")?C.gD:C.oD,color:(e.status||"").includes("confirmed")?C.g:C.o,fontWeight:600}}>{(e.status||"prévu").replace("_"," ")}</span>
   </div>)}
  </Card>}
  {events.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucun RDV {view==="today"?"aujourd'hui":"cette semaine"}</div></Card>}
  {events.map((e,i)=>{const dayStr=e.start.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});return <Card key={e.id||i} style={{marginBottom:4}}>
   <div style={{display:"flex",alignItems:"center",gap:10}}>
    <div style={{width:40,textAlign:"center"}}><div style={{fontSize:18}}>{typeIcon(e.title)}</div><div style={{fontSize:8,color:C.td}}>{dayStr}</div></div>
    <div style={{flex:1}}>
     <div style={{fontWeight:700,fontSize:12}}>{e.title||"RDV"}</div>
     <div style={{fontSize:10,color:C.td}}>{e.start.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})} — {e.end.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
     {e.contactName&&<div style={{fontSize:9,color:C.b,marginTop:2}}>👤 {e.contactName}</div>}
    </div>
    <span style={{fontSize:8,padding:"2px 6px",borderRadius:8,background:(e.status||"").includes("confirmed")?C.gD:(e.status||"").includes("cancel")?C.rD:C.oD,color:(e.status||"").includes("confirmed")?C.g:(e.status||"").includes("cancel")?C.r:C.o,fontWeight:600}}>{(e.status||"prévu").replace("_"," ")}</span>
   </div>
  </Card>;})}
 </Sect>;
}

/* ===== CONVERSATIONS PANEL ===== */
/* ===== CONVERSATIONS PANEL ===== */
export function ConversationsPanel({soc}){
 const socKey=soc.ghlLocationId||soc.id;
 const[convos,setConvos]=useState([]);const[selConvo,setSelConvo]=useState(null);const[msgs,setMsgs]=useState([]);const[msgInput,setMsgInput]=useState("");const[loading,setLoading]=useState(false);
 useEffect(()=>{let cancel=false;setLoading(true);
  fetch(`/api/ghl?action=conversations_list&loc=${socKey}`).then(r=>r.json()).then(d=>{if(!cancel)setConvos(d.conversations||d||[]);}).catch(()=>{}).finally(()=>{if(!cancel)setLoading(false);});
  return()=>{cancel=true;};
 },[socKey]);
 const loadMsgs=(c)=>{setSelConvo(c);setMsgs([]);
  fetch(`/api/ghl?action=conversations_messages&loc=${socKey}&conversationId=${c.id}`).then(r=>r.json()).then(d=>setMsgs(d.messages||d||[])).catch(()=>{});
 };
 const sendMsg=()=>{if(!msgInput.trim()||!selConvo)return;
  fetch(`/api/ghl?action=conversation_send&loc=${socKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"Email",contactId:selConvo.contactId||selConvo.id,message:msgInput})}).then(()=>{setMsgs(p=>[...p,{body:msgInput,direction:"outbound",dateAdded:new Date().toISOString()}]);setMsgInput("");}).catch(()=>{});
 };
 return <Sect title="💬 Conversations" sub="Messages GHL">
  <div style={{display:"flex",gap:8,height:480}}>
   <div className="glass-card-static" style={{width:240,overflow:"auto",padding:0}}>
    {loading&&<div style={{padding:20,textAlign:"center",color:C.td,fontSize:11}}>Chargement...</div>}
    {!loading&&convos.length===0&&<div style={{padding:20,textAlign:"center",color:C.td,fontSize:11}}>Aucune conversation</div>}
    {convos.map((c,i)=><div key={c.id||i} onClick={()=>loadMsgs(c)} style={{padding:"10px 12px",borderBottom:`1px solid ${C.brd}`,cursor:"pointer",background:selConvo?.id===c.id?"rgba(255,170,0,.08)":"transparent",transition:"background .15s"}} onMouseEnter={e=>{if(selConvo?.id!==c.id)e.currentTarget.style.background=C.card2;}} onMouseLeave={e=>{if(selConvo?.id!==c.id)e.currentTarget.style.background="transparent";}}>
     <div style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.contactName||c.fullName||c.email||"Contact"}</div>
     <div style={{fontSize:9,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.lastMessageBody||c.snippet||"—"}</div>
     <div style={{fontSize:8,color:C.tm}}>{c.dateUpdated?ago(c.dateUpdated):""}</div>
    </div>)}
   </div>
   <div className="glass-card-static" style={{flex:1,display:"flex",flexDirection:"column",padding:0}}>
    {!selConvo&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.td,fontSize:12}}>Sélectionnez une conversation</div>}
    {selConvo&&<>
     <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.brd}`,fontWeight:700,fontSize:12}}>{selConvo.contactName||selConvo.fullName||"Contact"}</div>
     <div style={{flex:1,overflow:"auto",padding:10}}>
      {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.direction==="outbound"?"flex-end":"flex-start",marginBottom:6}}>
       <div style={{maxWidth:"70%",padding:"8px 12px",borderRadius:12,background:m.direction==="outbound"?"linear-gradient(135deg,#FFBF00,#FF9D00)":"rgba(255,255,255,.06)",color:m.direction==="outbound"?"#0a0a0f":C.t,fontSize:11}}>
        <div>{m.body||m.text||"—"}</div>
        <div style={{fontSize:8,color:m.direction==="outbound"?"rgba(0,0,0,.5)":C.tm,marginTop:2}}>{m.dateAdded?ago(m.dateAdded):""}</div>
       </div>
      </div>)}
     </div>
     <div style={{padding:8,borderTop:`1px solid ${C.brd}`,display:"flex",gap:6}}>
      <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMsg();}} placeholder="Écrire un message..." style={{flex:1,padding:"8px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
      <Btn small onClick={sendMsg}>Envoyer</Btn>
     </div>
    </>}
   </div>
  </div>
 </Sect>;
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
  {sorted.map(t=>{const done=doneIds.includes(t.id);return <div key={t.id} className="fu" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:done?C.card:"rgba(14,14,22,.6)",borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
   <div onClick={()=>toggleDone(t.id)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${done?C.g:C.brd}`,background:done?C.gD:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{done&&<span style={{color:C.g,fontSize:11}}>✓</span>}</div>
   <span style={{fontSize:12,flexShrink:0}}>{priorityIcon[t.priority]||"🟢"}</span>
   <div style={{flex:1,fontSize:12,fontWeight:done?400:600,color:done?C.td:C.t,textDecoration:done?"line-through":"none"}}>{t.text}</div>
   {t.auto&&<span style={{fontSize:8,color:C.td,background:C.card2,padding:"1px 5px",borderRadius:6}}>auto</span>}
   {!t.auto&&<button onClick={()=>saveManual(manualTasks.filter(m=>m.id!==t.id))} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:10,padding:"2px 4px"}}>✕</button>}
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
   {items.map(r=><div key={r.id} className="fu" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"rgba(14,14,22,.6)",borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
    <span style={{fontSize:14}}>{typeIcons[r.type]||"🔗"}</span>
    <div style={{flex:1,minWidth:0}}>
     <a href={r.url} target="_blank" rel="noopener noreferrer" style={{fontWeight:600,fontSize:11,color:C.b,textDecoration:"none"}}>{r.title}</a>
     <div style={{fontSize:8,color:C.td}}>{r.type} · {r.at?ago(r.at):""}</div>
    </div>
    <button onClick={()=>delRes(r.id)} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:10}}>✕</button>
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
 const[readIds,setReadIds]=useState(()=>{try{return JSON.parse(localStorage.getItem(`inbox_read_${soc.id}`)||"[]");}catch{return[];}});
 const saveDone=(ids)=>{setDoneIds(ids);try{localStorage.setItem(`todo_done_${soc.id}`,JSON.stringify(ids));}catch{}};
 const saveManual=(tasks)=>{setManualTasks(tasks);try{localStorage.setItem(`todo_${soc.id}`,JSON.stringify(tasks));}catch{}};
 const toggleDone=(id)=>{const n=doneIds.includes(id)?doneIds.filter(x=>x!==id):[...doneIds,id];saveDone(n);};
 const addTask=()=>{if(!newTask.trim())return;saveManual([...manualTasks,{id:uid(),text:newTask.trim(),priority:"normal",at:new Date().toISOString()}]);setNewTask("");};
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
 const sorted=[...allTasks].sort((a,b)=>(priorityOrder[a.priority]||2)-(priorityOrder[b.priority]||2));
 // Activity feed
 const feedItems=useMemo(()=>{
  const all=[];const gd=ghlData?.[soc.id];
  (gd?.ghlClients||[]).forEach(c=>{const d=new Date(c.at||c.dateAdded||0);all.push({id:"lead_"+c.id,type:"lead",icon:"🟢",desc:`Nouveau lead: ${c.name||c.email||"—"}`,date:d});});
  (socBankData?.transactions||[]).filter(t=>(t.legs?.[0]?.amount||0)>0).forEach(t=>{const d=new Date(t.created_at||t.date||0);const amt=Math.abs(t.legs?.[0]?.amount||0);all.push({id:"pay_"+t.id,type:"payment",icon:"💰",desc:`${t.legs?.[0]?.description||t.reference||"Paiement"}: +${fmt(amt)}€`,date:d});});
  (gd?.calendarEvents||[]).forEach(e=>{const d=new Date(e.startTime||0);all.push({id:"rdv_"+e.id,type:"rdv",icon:"📅",desc:`RDV: ${e.title||e.contactName||"—"}`,date:d});});
  (gd?.opportunities||[]).filter(o=>o.status==="won"||o.status==="lost").forEach(o=>{const d=new Date(o.updatedAt||o.createdAt||0);all.push({id:"deal_"+o.id,type:"deal",icon:o.status==="won"?"🏆":"❌",desc:`Deal ${o.status==="won"?"gagné":"perdu"}: ${o.name||"—"} (${fmt(o.value||0)}€)`,date:d});});
  return all.sort((a,b)=>b.date-a.date).slice(0,30);
 },[soc.id,ghlData,socBankData]);
 // Productivité semaine
 const weekKey=`prod_${soc.id}_${curW()}`;
 const[weekDone,setWeekDone]=useState(()=>{try{return parseInt(localStorage.getItem(weekKey)||"0");}catch{return 0;}});
 useEffect(()=>{const cnt=sorted.filter(t=>doneIds.includes(t.id)).length;setWeekDone(cnt);try{localStorage.setItem(weekKey,String(cnt));}catch{}},[doneIds,sorted]);
 const weekTotal=sorted.length;const weekPct=weekTotal>0?Math.round(weekDone/weekTotal*100):0;
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
   <div style={{display:"flex",gap:6,marginBottom:10}}>
    <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTask();}} placeholder="Ajouter une tâche..." style={{flex:1,padding:"7px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
    <Btn small onClick={addTask}>+</Btn>
   </div>
   {sorted.map(t=>{const done=doneIds.includes(t.id);return <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:done?"transparent":"rgba(14,14,22,.6)",borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3,opacity:done?.5:1}}>
    <div onClick={()=>toggleDone(t.id)} style={{width:16,height:16,borderRadius:4,border:`2px solid ${done?C.g:C.brd}`,background:done?C.gD:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{done&&<span style={{color:C.g,fontSize:9}}>✓</span>}</div>
    <span style={{fontSize:11,flexShrink:0}}>{priorityIcon[t.priority]||"🟢"}</span>
    <div style={{flex:1,fontSize:11,fontWeight:done?400:600,color:done?C.td:C.t,textDecoration:done?"line-through":"none"}}>{t.text}</div>
    {t.auto&&<span style={{fontSize:8,color:C.td,background:C.card2,padding:"1px 5px",borderRadius:6}}>auto</span>}
    {/* Actions 1-clic */}
    {t.auto&&t.id.startsWith("cal_")&&<button onClick={(e)=>{e.stopPropagation();const cName=t.text.replace(/^📞 Appel avec /,"").replace(/ à .*$/,"");const cl2=(clients||[]).find(c=>c.socId===soc.id&&(c.name||"").toLowerCase().includes(cName.toLowerCase()));if(cl2?.phone)window.open(`tel:${cl2.phone}`);else if(soc.ghlLocationId)window.open(`https://app.gohighlevel.com/v2/location/${soc.ghlLocationId}/calendar`);}} style={{padding:"2px 6px",borderRadius:5,border:`1px solid ${C.b}`,background:C.bD,color:C.b,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>📞</button>}
    {t.auto&&(t.id.startsWith("unpaid_")||t.id.startsWith("newlead_"))&&<button onClick={(e)=>{e.stopPropagation();const clId=t.id.split("_").slice(1).join("_");const cl2=(clients||[]).find(c=>c.id===clId)||(ghlData?.[soc.id]?.ghlClients||[]).find(c=>(c.id||c.ghlId)===clId);if(cl2)alert(`💬 Contact: ${cl2.name||"—"}\n📧 ${cl2.email||"—"}\n📱 ${cl2.phone||"—"}`);}} style={{padding:"2px 6px",borderRadius:5,border:`1px solid ${C.o}`,background:C.oD,color:C.o,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>💬</button>}
    {!t.auto&&<button onClick={()=>saveManual(manualTasks.filter(m=>m.id!==t.id))} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:10}}>✕</button>}
   </div>;})}
   {sorted.length===0&&<div style={{textAlign:"center",padding:12,color:C.td,fontSize:11}}>✅ Aucune tâche</div>}
  </div>
  {/* Activity feed */}
  <div className="glass-card-static" style={{padding:16}}>
   <div style={{fontSize:11,fontWeight:800,color:C.b,fontFamily:FONT_TITLE,marginBottom:10}}>📥 ACTIVITÉ RÉCENTE</div>
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
 const socKey=soc.ghlLocationId||soc.id;
 // Load conversations for selected client
 useEffect(()=>{
  if(!selClient)return;setConvoLoading(true);setConvos([]);setConvoMsgs([]);
  const contactId=selClient.ghlId||selClient.id;
  fetch(`/api/ghl?action=conversations_list&loc=${socKey}&contactId=${contactId}`).then(r=>r.json()).then(d=>{setConvos(d.conversations||d||[]);
   if((d.conversations||d||[]).length>0){const c=(d.conversations||d)[0];
    fetch(`/api/ghl?action=conversations_messages&loc=${socKey}&conversationId=${c.id}`).then(r2=>r2.json()).then(d2=>setConvoMsgs(d2.messages||d2||[])).catch(()=>{});}
  }).catch(()=>{}).finally(()=>setConvoLoading(false));
 },[selClient,socKey]);
 const sendMsg=()=>{if(!msgInput.trim()||!selClient||convos.length===0)return;
  fetch(`/api/ghl?action=conversation_send&loc=${socKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"Email",contactId:selClient.ghlId||selClient.id,message:msgInput})}).then(()=>{setConvoMsgs(p=>[...p,{body:msgInput,direction:"outbound",dateAdded:new Date().toISOString()}]);setMsgInput("");}).catch(()=>{});
 };
 // Pipeline data
 const gd=ghlData?.[soc.id];const opps=gd?.opportunities||[];const stages=gd?.pipelines?.[0]?.stages||[];
 const stageNames=stages.length>0?stages.map(s=>s.name||s):["Nouveau","Contacté","Qualifié","Proposition","Gagné"];
 const byStage=useMemo(()=>{const m={};stageNames.forEach(s=>{m[s]=opps.filter(o=>o.stage===s);});return m;},[opps,stageNames]);
 // Find pipeline stage for a client
 const clientStage=(cl)=>{const opp=opps.find(o=>(o.contact?.name||"").toLowerCase()===(cl.name||"").toLowerCase()||o.contact?.email===cl.email);return opp?{stage:opp.stage,value:opp.value,status:opp.status}:null;};
 if(viewMode==="kanban"){
  return <Sect title="👥 Clients" sub="Vue Pipeline Kanban" right={<div style={{display:"flex",gap:4}}><Btn small v={viewMode==="list"?"primary":"ghost"} onClick={()=>setViewMode("list")}>📋 Liste</Btn><Btn small v={viewMode==="kanban"?"primary":"ghost"} onClick={()=>setViewMode("kanban")}>🔄 Kanban</Btn></div>}>
   <div style={{display:"flex",gap:8,overflow:"auto",paddingBottom:8}}>
    {Object.entries(byStage).map(([stage,cards],si)=><div key={stage} style={{minWidth:180,flex:"1 0 180px"}}>
     <div style={{padding:"8px 10px",borderRadius:"10px 10px 0 0",background:GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]+"22",borderBottom:`2px solid ${GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}`,marginBottom:4}}>
      <div style={{fontWeight:700,fontSize:11,color:GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}}>{stage}</div>
      <div style={{fontSize:9,color:C.td}}>{cards.length} deal{cards.length>1?"s":""} · {fmt(cards.reduce((a,o)=>a+(o.value||0),0))}€</div>
     </div>
     {cards.map(o=><div key={o.id} className="glass-card-static" style={{padding:10,marginBottom:4,cursor:"pointer",borderLeft:`3px solid ${GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}`}} onClick={()=>{const cl=(clients||[]).find(c=>(c.name||"").toLowerCase()===(o.name||o.contact?.name||"").toLowerCase());if(cl)setSelClient(cl);}}>
      <div style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name||o.contact?.name||"—"}</div>
      <div style={{fontSize:10,fontWeight:800,color:C.acc,marginTop:2}}>{fmt(o.value||0)}€</div>
      <div style={{fontSize:8,color:C.td,marginTop:2}}>{o.createdAt?ago(o.createdAt):""}</div>
     </div>)}
     {cards.length===0&&<div style={{padding:16,textAlign:"center",color:C.tm,fontSize:10,border:`1px dashed ${C.brd}`,borderRadius:8}}>Vide</div>}
    </div>)}
   </div>
  </Sect>;
 }
 return <div>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
   <div><h2 style={{color:C.t,fontSize:13,fontWeight:800,margin:0,fontFamily:FONT_TITLE}}>👥 CLIENTS</h2><p style={{color:C.td,fontSize:10,margin:"1px 0 0"}}>Portefeuille & conversations</p></div>
   <div style={{display:"flex",gap:4}}><Btn small v={viewMode==="list"?"primary":"ghost"} onClick={()=>setViewMode("list")}>📋 Liste</Btn><Btn small v={viewMode==="kanban"?"primary":"ghost"} onClick={()=>setViewMode("kanban")}>🔄 Kanban</Btn></div>
  </div>
  <div style={{display:"flex",gap:12}}>
   <div style={{flex:1,minWidth:0}}>
    <ClientsPanelSafe soc={soc} clients={clients} saveClients={saveClients} ghlData={ghlData} socBankData={socBankData} invoices={invoices} saveInvoices={saveInvoices} stripeData={stripeData} onSelectClient={setSelClient}/>
   </div>
   {selClient&&<div className="si" style={{width:340,flexShrink:0,background:"rgba(14,14,22,.6)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:16,maxHeight:"80vh",overflowY:"auto",position:"sticky",top:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
     <div style={{fontWeight:800,fontSize:14,color:C.t}}>{selClient.name||"Client"}</div>
     <button onClick={()=>setSelClient(null)} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:14}}>✕</button>
    </div>
    {(()=>{const ps=clientStage(selClient);return ps?<div style={{padding:"6px 10px",borderRadius:8,background:C.accD,border:`1px solid ${C.acc}33`,marginBottom:10}}>
     <div style={{fontSize:9,color:C.td,fontWeight:600}}>Pipeline</div>
     <div style={{fontWeight:700,fontSize:12,color:C.acc}}>{ps.stage} {ps.status==="won"?"✅":ps.status==="lost"?"❌":""}</div>
     {ps.value>0&&<div style={{fontSize:10,color:C.t}}>{fmt(ps.value)}€</div>}
    </div>:null;})()}
    <div style={{padding:"6px 10px",borderRadius:8,background:C.card2,marginBottom:10}}>
     <div style={{fontSize:9,color:C.td,fontWeight:600}}>Status</div>
     <div style={{fontWeight:600,fontSize:11,color:(CLIENT_STATUS[selClient.status]||{}).c||C.td}}>{(CLIENT_STATUS[selClient.status]||{}).l||selClient.status}</div>
     {selClient.billing&&<div style={{fontSize:10,color:C.t,marginTop:2}}>{fmt(clientMonthlyRevenue(selClient))}€/mois</div>}
    </div>
    <div style={{fontSize:10,fontWeight:800,color:C.v,marginBottom:6,fontFamily:FONT_TITLE}}>💬 CONVERSATIONS</div>
    {convoLoading&&<div style={{color:C.td,fontSize:10,padding:8}}>Chargement...</div>}
    {!convoLoading&&convoMsgs.length===0&&<div style={{color:C.td,fontSize:10,padding:8}}>Aucune conversation</div>}
    <div style={{maxHeight:250,overflowY:"auto",marginBottom:8}}>
     {convoMsgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.direction==="outbound"?"flex-end":"flex-start",marginBottom:4}}>
      <div style={{maxWidth:"85%",padding:"6px 10px",borderRadius:10,background:m.direction==="outbound"?"linear-gradient(135deg,#FFBF00,#FF9D00)":"rgba(255,255,255,.06)",color:m.direction==="outbound"?"#0a0a0f":C.t,fontSize:10}}>
       <div>{m.body||m.text||"—"}</div>
       <div style={{fontSize:7,color:m.direction==="outbound"?"rgba(0,0,0,.5)":C.tm,marginTop:1}}>{m.dateAdded?ago(m.dateAdded):""}</div>
      </div>
     </div>)}
    </div>
    <div style={{display:"flex",gap:4}}>
     <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMsg();}} placeholder="Message..." style={{flex:1,padding:"6px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT,outline:"none"}}/>
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
 return <div className="fu">
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
   <div><div style={{fontSize:9,fontWeight:700,color:C.acc,letterSpacing:1.5,fontFamily:FONT_TITLE}}>📞 SALES — {soc.nom}</div><div style={{fontSize:11,color:C.td,marginTop:2}}>Données GHL × Meta × Revolut</div></div>
  </div>
  {/* KPIs */}
  <div className="kpi-grid-responsive" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}}>
   {kpis.map((k,i)=><div key={i} className="fade-up glass-card-static" style={{padding:"10px 6px",textAlign:"center",animationDelay:`${i*0.03}s`}}>
    <div style={{fontSize:14,marginBottom:2}}>{k.icon}</div>
    <div style={{fontWeight:900,fontSize:16,color:k.color,lineHeight:1.1}}>{k.value}</div>
    <div style={{fontSize:7,fontWeight:700,color:C.td,marginTop:4,letterSpacing:.3,fontFamily:FONT_TITLE}}>{k.label}</div>
   </div>)}
  </div>
  {/* Pipeline Kanban */}
  {stages.length>0&&<div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.2s",overflow:"auto"}}>
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
  {/* Charts 2-col */}
  <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginBottom:20}}>
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
  </div>
  {/* Performance Closer */}
  {closers.length>0&&<div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.55s"}}>
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
  <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.6s"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📜 DERNIÈRES ACTIVITÉS SALES</div>
   {activities.length===0?<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucune activité récente</div>:
    activities.map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<activities.length-1?`1px solid ${C.brd}`:"none"}}>
     <span style={{fontSize:14}}>{a.icon}</span>
     <div style={{flex:1,fontSize:11,fontWeight:600,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.text}</div>
     <span style={{fontSize:9,color:C.td,flexShrink:0}}>{a.date?ago(a.date):""}</span>
    </div>)
   }
  </div>
  {/* Cross-referencing */}
  {totalAdSpend>0&&<div className="fade-up glass-card-static" style={{padding:16,marginBottom:20,animationDelay:"0.65s",borderLeft:`3px solid ${C.v}`}}>
   <div style={{fontSize:9,fontWeight:700,color:C.v,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>🔗 CROISEMENT DONNÉES</div>
   <div style={{fontSize:11,color:C.t,fontWeight:600}}>Budget pub: {fmt(totalAdSpend)}€ → {totalLeads} leads → {totalCallsAll} appels → {wonAll.length} clients = CPL {totalLeads>0?(totalAdSpend/totalLeads).toFixed(2):"-"}€, CPA {wonAll.length>0?(totalAdSpend/wonAll.length).toFixed(2):"-"}€</div>
  </div>}
  {/* Data Table */}
  <div className="fade-up glass-card-static" style={{padding:18,overflow:"auto",animationDelay:"0.7s"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📋 TABLEAU RÉCAPITULATIF — 12 MOIS</div>
   <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,minWidth:900}}>
    <thead><tr style={{borderBottom:`2px solid ${C.brd}`}}>
     {["Mois","Leads","Appels","No-show","Tx NS","Deals","CA","Panier moy","CPL","Coût/appel","Coût/closing","Tx closing"].map((h,i)=>
      <th key={i} style={{padding:"8px 4px",textAlign:i===0?"left":"right",color:C.td,fontWeight:700,fontSize:7,letterSpacing:.5,fontFamily:FONT_TITLE}}>{h}</th>
     )}
    </tr></thead>
    <tbody>
     {salesData.map((d,i)=>{const nsRate=d.totalCalls>0?Math.round(d.noShow/d.totalCalls*100):0;const clRate=d.stratCalls>0?Math.round(d.wonCount/d.stratCalls*100):0;const pm2=d.wonCount>0?Math.round(d.wonVal/d.wonCount):0;
      return <tr key={d.mo} style={{borderBottom:`1px solid ${C.brd}`,background:i%2===0?"transparent":"rgba(255,255,255,.015)"}}>
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
  </div>
 </div>;
}

/* ===== PUBLICITE PANEL ===== */
/* ===== PUBLICITE PANEL ===== */
export function PublicitePanel({soc,ghlData,socBankData,clients,reps,setPTab}){
 const cm=curM();
 const gd=ghlData?.[soc.id];const opps=gd?.opportunities||[];const calEvts=gd?.calendarEvents||[];const ghlCl=gd?.ghlClients||[];
 const myClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active");
 const wonAll=opps.filter(o=>o.status==="won");
 // 12 months of meta ads data
 const now12=new Date();const months12=[];for(let i=11;i>=0;i--){const d=new Date(now12.getFullYear(),now12.getMonth()-i,1);months12.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}
 const getMetaMonth=(mo)=>{
  let raw=null;try{raw=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${mo}`));}catch{}
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
     {metaData.map((d,i)=><tr key={d.mo} style={{borderBottom:`1px solid ${C.brd}`,background:i%2===0?"transparent":"rgba(255,255,255,.015)"}}>
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
  {pTab===13&&<ErrorBoundary label="Rapports"><RapportsPanel soc={soc} socBankData={socBankData} ghlData={ghlData} clients={clients} reps={reps} allM={allM} hold={hold}/></ErrorBoundary>}
  {pTab===12&&<SocSettingsPanel soc={soc} save={save} socs={socs} clients={clients}/>}
  {pTab===1&&<ErrorBoundary label="Activité"><ActivitePanel soc={soc} ghlData={ghlData} socBankData={socBankData} clients={clients}/></ErrorBoundary>}
  {pTab===2&&<ErrorBoundary label="Sales"><SalesPanel soc={soc} ghlData={ghlData} socBankData={socBankData} clients={clients} reps={reps} setPTab={setPTab}/></ErrorBoundary>}
  {pTab===3&&<ErrorBoundary label="Publicité"><PublicitePanel soc={soc} ghlData={ghlData} socBankData={socBankData} clients={clients} reps={reps} setPTab={setPTab}/></ErrorBoundary>}
  </div>
  </div>
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
    <div style={{width:32,height:32,background:hold?.brand?.logoUrl?"transparent":`linear-gradient(135deg,${hold?.brand?.accentColor||C.acc},#FF9D00)`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#0a0a0f",overflow:"hidden"}}>{hold?.brand?.logoUrl?<img src={hold.brand.logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(hold?.brand?.logoLetter||"S")}</div>
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
  {ready&&<div style={{position:"fixed",left:tipPos.x,top:tipPos.y,width:380,maxWidth:"92vw",zIndex:10002,pointerEvents:"auto",animation:"tourTipIn .35s cubic-bezier(.16,1,.3,1) both",opacity:transitioning?0:1,transition:"opacity .15s"}}>
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
 {id:"activite",icon:"⚡",label:"Activité",tab:1,accent:C.b},
 {id:"sales",icon:"📞",label:"Sales",tab:2,accent:"#34d399"},
 {id:"publicite",icon:"📣",label:"Publicité",tab:3,accent:"#f472b6"},
 {id:"clients",icon:"👥",label:"Clients",tab:9,accent:C.o},
 {id:"bank",icon:"🏦",label:"Banque",tab:5,accent:C.g},
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
   <div style={{width:30,height:30,background:brand?.logoUrl?"transparent":`linear-gradient(135deg,${brand?.accentColor||C.acc},#FF9D00)`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#0a0a0f",boxShadow:`0 2px 8px ${(brand?.accentColor||C.acc)}44`,flexShrink:0,overflow:"hidden"}}>{brand?.logoUrl?<img src={brand.logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(brand?.logoLetter||brandTitle?.[0]||"S")}</div>
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
export function WarRoom({soc,reps,allM,ghlData,clients,socBank,socs,onClose,readOnly}){
 const cm=curM();const r=gr(reps,soc.id,cm);
 const ca=r?pf(r.ca):0;const leads=r?pf(r.leads):0;const deals=r?pf(r.leadsClos):0;const pipeline=r?pf(r.pipeline):0;
 const[sprint,setSprint]=useState(()=>{try{const s=JSON.parse(localStorage.getItem(`warroom_sprint_${soc.id}`));return s||null;}catch{return null;}});
 const[showSetSprint,setShowSetSprint]=useState(false);
 const[spTitle,setSpTitle]=useState("");const[spTarget,setSpTarget]=useState("");const[spCurrent,setSpCurrent]=useState("");const[spDays,setSpDays]=useState("7");
 const[soundOn,setSoundOn]=useState(false);
 const[tick,setTick]=useState(0);
 useEffect(()=>{const iv=setInterval(()=>setTick(t=>t+1),1000);return()=>clearInterval(iv);},[]);
 const saveSprint=(sp)=>{setSprint(sp);try{localStorage.setItem(`warroom_sprint_${soc.id}`,JSON.stringify(sp));sSet(`warroom_sprint_${soc.id}`,sp);}catch{}};
 const createSprint=()=>{const dl=new Date();dl.setDate(dl.getDate()+parseInt(spDays||7));const sp={title:spTitle,target:parseInt(spTarget)||1,current:parseInt(spCurrent)||0,deadline:dl.toISOString(),socId:soc.id,createdAt:new Date().toISOString()};saveSprint(sp);setShowSetSprint(false);};
 const countdown=useMemo(()=>{if(!sprint?.deadline)return null;const diff=new Date(sprint.deadline)-Date.now();if(diff<=0)return{d:0,h:0,m:0,s:0,expired:true};return{d:Math.floor(diff/864e5),h:Math.floor((diff%864e5)/36e5),m:Math.floor((diff%36e5)/6e4),s:Math.floor((diff%6e4)/1e3),expired:false};},[sprint,tick]);
 const spPct=sprint?Math.min(100,Math.round((sprint.current/Math.max(1,sprint.target))*100)):0;
 // Activity stream
 const activities=useMemo(()=>{const acts=[];const gd=ghlData?.[soc.id];
  (gd?.opportunities||[]).slice(-5).forEach(o=>acts.push({icon:o.status==="won"?"🏆":"📌",text:`${o.name} — ${o.status==="won"?"Deal gagné":"En cours"}`,date:o.updatedAt||o.createdAt}));
  (gd?.calendarEvents||[]).slice(-3).forEach(e=>acts.push({icon:"📞",text:`Appel: ${e.title||e.calendarName||"RDV"}`,date:e.startTime}));
  const txns=(socBank?.[soc.id]?.transactions||[]).slice(0,3);
  txns.forEach(t=>{const leg=t.legs?.[0];if(leg&&leg.amount>0)acts.push({icon:"💰",text:`Paiement reçu: ${fmt(leg.amount)}€`,date:t.created_at});});
  return acts.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8);
 },[ghlData,socBank,soc.id]);
 const shareUrl=`${window.location.origin}${window.location.pathname}#warroom/${soc.id}`;
 const neonGlow="0 0 20px rgba(255,170,0,.3),0 0 60px rgba(255,170,0,.1)";
 const glassPanel={background:"rgba(14,14,22,.7)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,170,0,.15)",borderRadius:16,padding:16,boxShadow:neonGlow};
 return <div style={{position:"fixed",inset:0,zIndex:2000,background:"#06060b",fontFamily:FONT,color:"#e4e4e7",overflow:"auto"}}>
  <style>{`@keyframes neonPulse{0%,100%{text-shadow:0 0 10px rgba(255,170,0,.5)}50%{text-shadow:0 0 20px rgba(255,170,0,.8),0 0 40px rgba(255,170,0,.3)}}
@keyframes ringProgress{from{stroke-dashoffset:283}to{stroke-dashoffset:var(--ring-off,283)}}
@keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.wr-kpi{transition:all .3s;animation:neonPulse 2s ease infinite}`}</style>
  {/* Top bar */}
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid rgba(255,170,0,.15)"}}>
   <div style={{display:"flex",alignItems:"center",gap:10}}>
    <span style={{fontSize:20}}>🎮</span>
    <span style={{fontWeight:900,fontSize:18,fontFamily:FONT_TITLE,color:"#FFAA00",textShadow:"0 0 20px rgba(255,170,0,.5)"}}>WAR ROOM</span>
    <span style={{fontSize:11,color:"#71717a"}}>· {soc.nom}</span>
   </div>
   <div style={{display:"flex",alignItems:"center",gap:8}}>
    <button onClick={()=>setSoundOn(!soundOn)} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"4px 10px",fontSize:10,color:soundOn?"#FFAA00":"#71717a",cursor:"pointer",fontFamily:FONT}}>{soundOn?"🔊":"🔇"} Son</button>
    {!readOnly&&<button onClick={()=>{navigator.clipboard?.writeText(shareUrl);}} style={{background:"rgba(255,170,0,.1)",border:"1px solid rgba(255,170,0,.2)",borderRadius:8,padding:"4px 10px",fontSize:10,color:"#FFAA00",cursor:"pointer",fontFamily:FONT}}>📤 Partager</button>}
    <button onClick={onClose} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"4px 10px",fontSize:10,color:"#e4e4e7",cursor:"pointer",fontFamily:FONT}}>✕ Fermer</button>
   </div>
  </div>
  {/* KPI Ticker */}
  <div className="rg4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,padding:"14px 20px"}}>
   {[{l:"CA",v:`${fmt(ca)}€`,c:"#FFAA00"},{l:"Leads",v:leads,c:"#60a5fa"},{l:"Deals",v:deals,c:"#34d399"},{l:"Pipeline",v:`${fmt(pipeline)}€`,c:"#a78bfa"}].map(k=>
    <div key={k.l} className="wr-kpi" style={{...glassPanel,textAlign:"center",padding:"12px 8px"}}>
     <div style={{fontSize:9,color:"#71717a",fontWeight:700,letterSpacing:1,marginBottom:4}}>{k.l}</div>
     <div style={{fontSize:22,fontWeight:900,color:k.c,textShadow:`0 0 15px ${k.c}66`}}>{k.v}</div>
    </div>)}
  </div>
  {/* Main content */}
  <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,padding:"0 20px 20px"}}>
   {/* Focus Mode - Sprint Ring */}
   <div style={{...glassPanel,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:260}}>
    <svg width="160" height="160" viewBox="0 0 100 100">
     <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,170,0,.1)" strokeWidth="6"/>
     <circle cx="50" cy="50" r="45" fill="none" stroke="#FFAA00" strokeWidth="6" strokeLinecap="round" strokeDasharray="283" style={{"--ring-off":283-283*spPct/100,strokeDashoffset:283-283*spPct/100,filter:"drop-shadow(0 0 8px rgba(255,170,0,.5))",transition:"stroke-dashoffset 1s ease"}} transform="rotate(-90 50 50)"/>
     <text x="50" y="46" textAnchor="middle" fill="#FFAA00" fontSize="22" fontWeight="900" fontFamily={FONT}>{sprint?sprint.current:0}</text>
     <text x="50" y="60" textAnchor="middle" fill="#71717a" fontSize="8" fontFamily={FONT}>/ {sprint?sprint.target:0}</text>
    </svg>
    {sprint&&<div style={{marginTop:10,textAlign:"center"}}>
     <div style={{fontWeight:700,fontSize:13,color:"#e4e4e7",marginBottom:4}}>{sprint.title}</div>
     {countdown&&!countdown.expired&&<div style={{fontSize:12,color:"#FFAA00",fontWeight:600}}>{countdown.d}j {String(countdown.h).padStart(2,"0")}:{String(countdown.m).padStart(2,"0")}:{String(countdown.s).padStart(2,"0")}</div>}
     {countdown?.expired&&<div style={{fontSize:12,color:"#f87171",fontWeight:700}}>⏰ Temps écoulé !</div>}
     {!readOnly&&<div style={{display:"flex",gap:6,marginTop:8,justifyContent:"center"}}>
      <button onClick={()=>{const ns={...sprint,current:Math.min(sprint.target,sprint.current+1)};saveSprint(ns);}} style={{background:"rgba(52,211,153,.15)",border:"1px solid rgba(52,211,153,.3)",borderRadius:6,padding:"4px 12px",fontSize:10,color:"#34d399",cursor:"pointer",fontFamily:FONT}}>+1</button>
      <button onClick={()=>{const ns={...sprint,current:Math.max(0,sprint.current-1)};saveSprint(ns);}} style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.2)",borderRadius:6,padding:"4px 8px",fontSize:10,color:"#f87171",cursor:"pointer",fontFamily:FONT}}>-1</button>
     </div>}
    </div>}
    {!sprint&&!readOnly&&<button onClick={()=>setShowSetSprint(true)} style={{marginTop:12,background:"rgba(255,170,0,.12)",border:"1px solid rgba(255,170,0,.25)",borderRadius:8,padding:"8px 16px",fontSize:11,color:"#FFAA00",cursor:"pointer",fontFamily:FONT,fontWeight:600}}>🎯 Lancer un Sprint</button>}
    {!sprint&&readOnly&&<div style={{marginTop:12,fontSize:11,color:"#71717a"}}>Aucun sprint actif</div>}
   </div>
   {/* Activity Stream */}
   <div style={{...glassPanel,maxHeight:320,overflow:"auto"}}>
    <div style={{fontSize:9,color:"#71717a",fontWeight:700,letterSpacing:1,marginBottom:10}}>📡 ACTIVITÉ EN DIRECT</div>
    {activities.length===0&&<div style={{color:"#71717a",fontSize:11,textAlign:"center",padding:20}}>Aucune activité récente</div>}
    {activities.map((a,i)=><div key={i} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
     <span style={{fontSize:14}}>{a.icon}</span>
     <span style={{flex:1,fontSize:10,color:"#e4e4e7"}}>{a.text}</span>
     <span style={{fontSize:8,color:"#71717a",whiteSpace:"nowrap"}}>{a.date?ago(a.date):""}</span>
    </div>)}
   </div>
  </div>
  {/* Sprint setup modal */}
  {showSetSprint&&<div className="fi" onClick={()=>setShowSetSprint(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:2100,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>
   <div className="si" onClick={e=>e.stopPropagation()} style={{...glassPanel,width:380,maxWidth:"90vw"}}>
    <div style={{fontWeight:800,fontSize:14,marginBottom:12,color:"#FFAA00"}}>🎯 Nouveau Sprint Challenge</div>
    <Inp label="Titre" value={spTitle} onChange={setSpTitle} placeholder="Ex: Signe 3 clients en 7 jours"/>
    <Inp label="Objectif (nombre)" value={spTarget} onChange={setSpTarget} type="number" placeholder="3"/>
    <Inp label="Progression actuelle" value={spCurrent} onChange={setSpCurrent} type="number" placeholder="0"/>
    <Inp label="Durée (jours)" value={spDays} onChange={setSpDays} type="number" placeholder="7"/>
    <div style={{display:"flex",gap:8,marginTop:12}}>
     <Btn onClick={createSprint}>🚀 Lancer</Btn>
     <Btn v="secondary" onClick={()=>setShowSetSprint(false)}>Annuler</Btn>
    </div>
   </div>
  </div>}
 </div>;
}

/* 6. AUTO-PILOT MODE */
/* 6. AUTO-PILOT MODE */
export function AutoPilotSection({soc,clients,ghlData,socBank,reps}){
 const[settings,setSettings]=useState(()=>{try{return JSON.parse(localStorage.getItem(`autopilot_${soc.id}`))||{};}catch{return{};}});
 const[queue,setQueue]=useState(()=>{try{return JSON.parse(localStorage.getItem(`autopilot_queue_${soc.id}`))||[];}catch{return[];}});
 const saveSettings=(s)=>{setSettings(s);try{localStorage.setItem(`autopilot_${soc.id}`,JSON.stringify(s));sSet(`autopilot_${soc.id}`,s);}catch{}};
 const saveQueue=(q)=>{setQueue(q);try{localStorage.setItem(`autopilot_queue_${soc.id}`,JSON.stringify(q));sSet(`autopilot_queue_${soc.id}`,q);}catch{}};
 const cm=curM();const now=Date.now();
 // Generate follow-ups
 const relances=useMemo(()=>{const msgs=[];
  const myClients=(clients||[]).filter(c=>c.socId===soc.id);
  // Clients impayés >30j
  const overdueClients=myClients.filter(c=>{
   if(c.status!=="active")return false;
   const bd=socBank?.[soc.id];if(!bd?.transactions)return false;
   const cn3=(c.name||"").toLowerCase().trim();
   const recent=bd.transactions.some(t=>{const leg=t.legs?.[0];return leg&&leg.amount>0&&new Date(t.created_at).getTime()>now-30*864e5&&(leg.description||t.reference||"").toLowerCase().includes(cn3);});
   return !recent&&clientMonthlyRevenue(c)>0;
  });
  overdueClients.forEach(c=>{const rev=clientMonthlyRevenue(c);msgs.push({id:`rel_pay_${c.id}`,type:"payment",client:c.name,template:`Bonjour ${c.name}, nous n'avons pas reçu votre paiement de ${fmt(rev)}€ pour ce mois. Pourriez-vous vérifier de votre côté ? Merci !`,icon:"💳",priority:"high"});});
  // Leads non contactés >48h
  const gd=ghlData?.[soc.id];
  (gd?.opportunities||[]).filter(o=>o.status==="open"&&new Date(o.createdAt).getTime()<now-48*36e5).slice(0,5).forEach(o=>{msgs.push({id:`rel_lead_${o.id}`,type:"lead",client:o.name,template:`Bonjour ${o.name}, suite à votre demande, je souhaitais prendre quelques minutes pour échanger sur vos besoins. Êtes-vous disponible cette semaine ?`,icon:"📞",priority:"medium"});});
  return msgs;
 },[clients,soc.id,ghlData,socBank]);
 // Smart scheduling
 const slots=useMemo(()=>{const sugg=[];const days=["Lundi","Mardi","Mercredi","Jeudi","Vendredi"];
  const gd=ghlData?.[soc.id];const events=gd?.calendarEvents||[];
  const pendingLeads=(gd?.opportunities||[]).filter(o=>o.status==="open").slice(0,3);
  pendingLeads.forEach((o,i)=>{const day=days[(new Date().getDay()+i+1)%5];const hour=14+i;sugg.push({id:`slot_${i}`,day,hour:`${hour}h-${hour+1}h`,client:o.name});});
  return sugg;
 },[ghlData,soc.id]);
 const approveMsg=(id)=>{const existing=queue.find(q=>q.id===id);if(existing)return;const rel=relances.find(r=>r.id===id);if(rel)saveQueue([...queue,{...rel,status:"approved",approvedAt:new Date().toISOString()}]);};
 const ignoreMsg=(id)=>{saveQueue(queue.filter(q=>q.id!==id));};
 return <div style={{marginTop:16}}>
  <Sect title="🔄 Auto-Pilot" sub="Relances et suggestions automatiques">
   {/* Relances automatiques */}
   <Card style={{padding:14,marginBottom:10}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📨 RELANCES SUGGÉRÉES</div>
    {relances.length===0&&<div style={{color:C.td,fontSize:11,textAlign:"center",padding:12}}>✅ Rien à relancer pour le moment</div>}
    {relances.map((r,i)=>{const inQueue=queue.find(q=>q.id===r.id);
     return <div key={r.id} className={`fu d${Math.min(i+1,8)}`} style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${r.priority==="high"?C.r+"33":C.brd}`,marginBottom:6}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
       <span style={{fontSize:14}}>{r.icon}</span>
       <span style={{fontWeight:700,fontSize:11,flex:1}}>{r.client}</span>
       <span style={{fontSize:8,padding:"2px 6px",borderRadius:4,background:r.priority==="high"?C.rD:C.oD,color:r.priority==="high"?C.r:C.o,fontWeight:700}}>{r.priority==="high"?"Urgent":"Normal"}</span>
      </div>
      <div style={{fontSize:10,color:C.td,lineHeight:1.4,padding:"6px 8px",background:C.card,borderRadius:6,marginBottom:6,fontStyle:"italic"}}>"{r.template}"</div>
      {inQueue?<span style={{fontSize:9,color:C.g,fontWeight:600}}>✅ Approuvé</span>:
       <div style={{display:"flex",gap:6}}>
        <button onClick={()=>approveMsg(r.id)} style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${C.g}33`,background:C.gD,color:C.g,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>✅ Approuver</button>
        <button style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${C.brd}`,background:C.card,color:C.td,fontSize:9,cursor:"pointer",fontFamily:FONT}}>✏️ Modifier</button>
        <button onClick={()=>ignoreMsg(r.id)} style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${C.r}22`,background:C.rD,color:C.r,fontSize:9,cursor:"pointer",fontFamily:FONT}}>❌ Ignorer</button>
       </div>}
     </div>;})}
   </Card>
   {/* Smart Scheduling */}
   <Card style={{padding:14,marginBottom:10}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📅 CRÉNEAUX SUGGÉRÉS</div>
    {slots.length===0&&<div style={{color:C.td,fontSize:11,textAlign:"center",padding:12}}>Pas de suggestions pour le moment</div>}
    {slots.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:C.bg,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:4}}>
     <span style={{fontSize:12}}>📞</span>
     <span style={{flex:1,fontSize:10}}>Créneau libre : <strong>{s.day} {s.hour}</strong> — Suggéré pour relancer <strong style={{color:C.acc}}>{s.client}</strong></span>
     <button style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${C.b}33`,background:C.bD,color:C.b,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Planifier</button>
    </div>)}
   </Card>
   {/* Weekly Auto-Report */}
   <Card style={{padding:14}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
     <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>📊 RAPPORT HEBDO AUTO</div>
     <button onClick={()=>{const ns={...settings,autoReport:!settings.autoReport};saveSettings(ns);}} style={{padding:"3px 10px",borderRadius:12,border:`1px solid ${settings.autoReport?C.g+"33":C.brd}`,background:settings.autoReport?C.gD:"transparent",color:settings.autoReport?C.g:C.td,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{settings.autoReport?"✅ Activé":"Activer"}</button>
    </div>
    <div style={{padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.brd}`,fontSize:10,color:C.td,lineHeight:1.5}}>
     <div style={{fontWeight:700,color:C.t,marginBottom:4}}>Aperçu du rapport :</div>
     <div>📈 CA ce mois : <strong style={{color:C.acc}}>{fmt(pf(gr(reps,soc.id,cm)?.ca))}€</strong></div>
     <div>👥 Clients actifs : <strong>{(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active").length}</strong></div>
     <div>📞 Leads en cours : <strong>{pf(gr(reps,soc.id,cm)?.leads)}</strong></div>
     <div>✅ Deals conclus : <strong style={{color:C.g}}>{pf(gr(reps,soc.id,cm)?.leadsClos)}</strong></div>
     <div style={{marginTop:4,fontSize:9,color:C.tm}}>Généré automatiquement chaque lundi</div>
    </div>
    {queue.length>0&&<div style={{marginTop:8}}>
     <div style={{color:C.td,fontSize:9,fontWeight:700,marginBottom:4}}>📤 FILE D'ATTENTE ({queue.length})</div>
     {queue.map(q=><div key={q.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 6px",fontSize:9,borderBottom:`1px solid ${C.brd}08`}}>
      <span>{q.icon}</span><span style={{flex:1}}>{q.client}</span><span style={{color:C.g,fontWeight:600}}>Prêt à envoyer</span>
     </div>)}
    </div>}
   </Card>
  </Sect>
 </div>;
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
   {soc.logoUrl?<img src={soc.logoUrl} alt="" style={{width:32,height:32,borderRadius:8,objectFit:"cover"}}/>:
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
 if(!soc||!client)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#06060b",fontFamily:FONT,color:"#71717a"}}>Portail introuvable</div>;
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
  <div className="glass-card-static" style={{padding:32,textAlign:"center",width:340}}>
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

export function WarRoomReadOnly({socId,socs,reps,allM,ghlData,clients,socBank}){
 const soc=socs.find(s=>s.id===socId);
 if(!soc)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#06060b",fontFamily:FONT,color:"#71717a"}}>Société introuvable</div>;
 return <WarRoom soc={soc} reps={reps} allM={allM} ghlData={ghlData} clients={clients} socBank={socBank} socs={socs} onClose={()=>{window.location.hash="";window.location.reload();}} readOnly/>;
}

/* MAIN APP */

