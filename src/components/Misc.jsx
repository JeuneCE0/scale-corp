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
import { GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal } from "./UI.jsx";

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

export const CHALLENGE_TEMPLATES=[
 {id:"c_double",title:"🔥 Doublé",desc:"Doubler son CA vs mois dernier",metric:"ca_growth",target:100,unit:"%",icon:"🔥"},
 {id:"c_margin",title:"💎 Marge d'or",desc:"Atteindre 60%+ de marge",metric:"margin",target:60,unit:"%",icon:"💎"},
 {id:"c_pipeline",title:"🎯 Pipeline monstre",desc:"Pipeline > 2× CA",metric:"pipeline_ratio",target:200,unit:"%",icon:"🎯"},
 {id:"c_streak",title:"📈 Série verte",desc:"3 mois consécutifs de hausse",metric:"growth_streak",target:3,unit:"mois",icon:"📈"},
 {id:"c_reports",title:"📊 Exemplaire",desc:"Rapport soumis avant le 5 du mois",metric:"early_report",target:1,unit:"",icon:"📊"},
 {id:"c_pulse",title:"⚡ Ultra-connecté",desc:"Pulse envoyé chaque semaine ce mois",metric:"pulse_count",target:4,unit:"",icon:"⚡"},
];
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
