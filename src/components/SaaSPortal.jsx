import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { C, FONT, FONT_TITLE, fmt, fK, uid, ago, pct, pf, curM, ml, sSet, MN } from "../shared.jsx";
import { Btn, Card, Inp, Sel, Sect, Modal, Toggle, KPI, PBar } from "../components.jsx";

/* Lazy-load heavy sub-panels */
const ClientBilling = lazy(() => import("./ClientBilling.jsx").then(m => ({ default: m.ClientBilling })));
const ClientOnboarding = lazy(() => import("./ClientOnboarding.jsx").then(m => ({ default: m.ClientOnboarding })));
const ClientSettingsPanel = lazy(() => import("./ClientSettingsPanel.jsx").then(m => ({ default: m.ClientSettingsPanel })));
const DataHealth = lazy(() => import("./DataHealthPanel.jsx").then(m => ({ default: m.DataHealth })));

const LF = <div style={{textAlign:"center",padding:40,color:C.td,fontSize:11}}>Chargement...</div>;

const SK = "scCpState";
function load(k,d){try{const s=localStorage.getItem(k);return s?{...d,...JSON.parse(s)}:d;}catch{return d;}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));sSet(k,v);}catch{}}

/* ====== HEALTH RING (SVG) ====== */
function HealthRing({score,size=80}){
 const r=(size-8)/2,circ=2*Math.PI*r,pct2=Math.max(0,Math.min(100,score)),offset=circ-(pct2/100)*circ;
 const color=score>=70?C.g:score>=40?C.o:C.r;
 return<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
  <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.brd} strokeWidth={6}/>
  <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{transition:"stroke-dashoffset .8s ease"}}/>
 </svg>;
}

/* ====== MINI SPARKLINE (SVG) ====== */
function Sparkline({values,color,width=120,height=32}){
 if(!values||values.length<2)return null;
 const mx=Math.max(...values,1);const mn=Math.min(...values,0);const range=mx-mn||1;
 const pts=values.map((v,i)=>`${(i/(values.length-1))*width},${height-((v-mn)/range)*(height-4)-2}`).join(" ");
 return<svg width={width} height={height} style={{display:"block"}}>
  <defs><linearGradient id={`sp_${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
  <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#sp_${color.replace("#","")})`}/>
  <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
 </svg>;
}

/* ====== OVERVIEW TAB ====== */
function OverviewTab({client,data,onNav}){
 const cM=curM();
 const fin=data.finances||{};const curFin=fin[cM]||{};
 const ca=pf(curFin.ca);const charges=pf(curFin.charges||((pf(curFin.chargesFixes))+(pf(curFin.chargesVar))));
 const profit=ca-charges;
 const pm=(()=>{const[y,m]=cM.split("-").map(Number);const p=m===1?12:m-1;return`${m===1?y-1:y}-${String(p).padStart(2,"0")}`;})();
 const prevCA=pf((fin[pm]||{}).ca);const evoCA=prevCA?((ca-prevCA)/prevCA*100):0;
 const prevCharges=pf((fin[pm]||{}).charges||((pf((fin[pm]||{}).chargesFixes))+(pf((fin[pm]||{}).chargesVar))));const evoCharges=prevCharges?((charges-prevCharges)/prevCharges*100):0;
 const health=data.health||{score:0,items:[]};
 const alerts=data.alerts||[];
 const tasks=data.tasks||[];
 const openTasks=tasks.filter(t=>!t.done).length;
 const contacts=data.contacts||[];
 const deals=data.deals||[];
 const events=data.events||[];
 const ads=data.ads||{};const curAds=ads[cM]||{};
 const margin=ca>0?((profit/ca)*100):0;

 /* 6 months data for sparklines */
 const months6=Array.from({length:6}).map((_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
 const caHistory=months6.map(k=>pf((fin[k]||{}).ca));
 const chargesHistory=months6.map(k=>{const f=fin[k]||{};return pf(f.charges||((pf(f.chargesFixes))+(pf(f.chargesVar))));});
 const profitHistory=months6.map((k,i)=>caHistory[i]-chargesHistory[i]);

 const upcomingEvents=events.filter(e=>e.date>=new Date().toISOString().slice(0,10)).slice(0,3);
 const today=new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 const hr=new Date().getHours();const greeting=hr<12?"Bonjour":hr<18?"Bon après-midi":"Bonsoir";

 const QUICK_ACTIONS=[
  {icon:"👥",label:"Nouveau contact",desc:"Ajouter au CRM",tab:1},
  {icon:"💰",label:"Saisir finances",desc:"Données du mois",tab:2},
  {icon:"📅",label:"Planifier",desc:"Ajouter un événement",tab:3},
  {icon:"🔬",label:"Data Health",desc:"Vérifier la qualité",tab:7},
 ];

 const pipelineTotal=deals.reduce((s,d)=>s+pf(d.value),0);
 const wonDeals=deals.filter(d=>d.stage==="Gagné");
 const wonTotal=wonDeals.reduce((s,d)=>s+pf(d.value),0);

 return<>
  {/* ========== WELCOME BANNER ========== */}
  <div style={{background:`linear-gradient(135deg,${C.acc}12,${C.b}08,${C.v}06)`,borderRadius:16,padding:"20px 24px",marginBottom:20,border:`1px solid ${C.acc}18`,position:"relative",overflow:"hidden"}}>
   <div style={{position:"absolute",top:-30,right:-20,width:140,height:140,borderRadius:"50%",background:`radial-gradient(circle,${C.acc}08,transparent 70%)`,pointerEvents:"none"}}/>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
    <div>
     <div style={{fontSize:22,fontWeight:900,fontFamily:FONT_TITLE,marginBottom:2}}>{greeting}, {client.company||"Mon entreprise"} 👋</div>
     <div style={{fontSize:12,color:C.td}}>{today}</div>
     <div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap"}}>
      {contacts.length>0&&<span style={{padding:"3px 10px",borderRadius:20,background:`${C.b}15`,color:C.b,fontSize:10,fontWeight:600}}>{contacts.length} contact{contacts.length>1?"s":""}</span>}
      {deals.length>0&&<span style={{padding:"3px 10px",borderRadius:20,background:`${C.g}15`,color:C.g,fontSize:10,fontWeight:600}}>{deals.length} deal{deals.length>1?"s":""} en cours</span>}
      {upcomingEvents.length>0&&<span style={{padding:"3px 10px",borderRadius:20,background:`${C.o}15`,color:C.o,fontSize:10,fontWeight:600}}>{upcomingEvents.length} événement{upcomingEvents.length>1?"s":""} à venir</span>}
     </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
     <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <HealthRing score={health.score} size={68}/>
      <div style={{position:"absolute",display:"flex",flexDirection:"column",alignItems:"center"}}>
       <div style={{fontWeight:900,fontSize:16,fontFamily:FONT_TITLE,color:health.score>=70?C.g:health.score>=40?C.o:C.r}}>{health.score}</div>
       <div style={{fontSize:7,color:C.td,fontWeight:600}}>SANTÉ</div>
      </div>
     </div>
    </div>
   </div>
  </div>

  {/* ========== KPI CARDS WITH SPARKLINES ========== */}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:20}}>
   <Card style={{padding:"14px 16px",position:"relative",overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
     <div>
      <div style={{fontSize:9,color:C.td,fontWeight:600,textTransform:"uppercase",letterSpacing:.8}}>CA du mois</div>
      <div style={{fontSize:22,fontWeight:900,fontFamily:FONT_TITLE,color:C.g,marginTop:2}}>{fmt(ca)}€</div>
      {evoCA!==0&&<div style={{fontSize:10,fontWeight:700,color:evoCA>0?C.g:C.r,marginTop:2}}>{evoCA>0?"▲":"▼"} {Math.abs(evoCA).toFixed(1)}% vs mois dernier</div>}
     </div>
     <div style={{opacity:.7}}><Sparkline values={caHistory} color={C.g}/></div>
    </div>
   </Card>
   <Card style={{padding:"14px 16px",position:"relative",overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
     <div>
      <div style={{fontSize:9,color:C.td,fontWeight:600,textTransform:"uppercase",letterSpacing:.8}}>Charges</div>
      <div style={{fontSize:22,fontWeight:900,fontFamily:FONT_TITLE,color:C.r,marginTop:2}}>{fmt(charges)}€</div>
      {evoCharges!==0&&<div style={{fontSize:10,fontWeight:700,color:evoCharges<0?C.g:C.r,marginTop:2}}>{evoCharges>0?"▲":"▼"} {Math.abs(evoCharges).toFixed(1)}%</div>}
     </div>
     <div style={{opacity:.7}}><Sparkline values={chargesHistory} color={C.r}/></div>
    </div>
   </Card>
   <Card style={{padding:"14px 16px",position:"relative",overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
     <div>
      <div style={{fontSize:9,color:C.td,fontWeight:600,textTransform:"uppercase",letterSpacing:.8}}>Résultat net</div>
      <div style={{fontSize:22,fontWeight:900,fontFamily:FONT_TITLE,color:profit>=0?C.g:C.r,marginTop:2}}>{fmt(profit)}€</div>
      <div style={{fontSize:10,fontWeight:600,color:C.td,marginTop:2}}>Marge {margin.toFixed(1)}%</div>
     </div>
     <div style={{opacity:.7}}><Sparkline values={profitHistory} color={profit>=0?C.g:C.r}/></div>
    </div>
   </Card>
  </div>

  {/* ========== ALERTS ========== */}
  {alerts.filter(a=>!a.dismissed).length>0&&<div style={{marginBottom:16}}>
   <div style={{fontWeight:700,fontSize:12,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
    <span style={{width:8,height:8,borderRadius:4,background:C.r,animation:"sp 2s ease infinite"}}/>
    Alertes actives
    <span style={{padding:"1px 8px",borderRadius:10,background:`${C.r}18`,color:C.r,fontSize:9,fontWeight:700}}>{alerts.filter(a=>!a.dismissed).length}</span>
   </div>
   {alerts.filter(a=>!a.dismissed).slice(0,4).map(a=><Card key={a.id} style={{marginBottom:4,padding:"10px 14px"}} accent={a.severity==="critical"?C.r:a.severity==="warning"?C.o:C.b}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
     <span style={{fontSize:14}}>{a.severity==="critical"?"🔴":a.severity==="warning"?"🟡":"🔵"}</span>
     <div style={{flex:1}}>
      <div style={{fontWeight:700,fontSize:11}}>{a.title}</div>
      <div style={{fontSize:10,color:C.td}}>{a.message}</div>
     </div>
     <span style={{fontSize:9,color:C.td}}>{ago(a.at)}</span>
    </div>
   </Card>)}
  </div>}

  {/* ========== QUICK ACTIONS ========== */}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginBottom:20}}>
   {QUICK_ACTIONS.map(a=><button key={a.label} onClick={()=>onNav?.(a.tab)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,border:`1px solid ${C.brd}`,background:C.card,cursor:"pointer",fontFamily:FONT,transition:"all .2s",textAlign:"left"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.acc+"55";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.15)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
    <span style={{fontSize:20}}>{a.icon}</span>
    <div>
     <div style={{fontWeight:700,fontSize:11,color:C.t}}>{a.label}</div>
     <div style={{fontSize:9,color:C.td}}>{a.desc}</div>
    </div>
   </button>)}
  </div>

  {/* ========== MAIN GRID: Revenue chart + Pipeline + Activity ========== */}
  <div className="saas-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
   {/* Revenue bar chart */}
   <Card style={{padding:16}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
     <div style={{fontWeight:700,fontSize:12}}>Évolution CA</div>
     <div style={{fontSize:9,color:C.td}}>6 derniers mois</div>
    </div>
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:110}}>
     {months6.map((k,i)=>{
      const v=caHistory[i];const maxV=Math.max(...caHistory,1);const d=new Date(k+"-01");
      const isCurrentMonth=k===cM;
      return<div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
       <div style={{fontSize:8,color:isCurrentMonth?C.acc:C.td,fontWeight:isCurrentMonth?700:600}}>{v>0?fK(v):"—"}</div>
       <div style={{width:"100%",borderRadius:6,height:`${Math.max(6,(v/maxV)*85)}px`,background:isCurrentMonth?`linear-gradient(to top,${C.acc},#FF9D00)`:`linear-gradient(to top,${C.g}88,${C.g}44)`,transition:"height .4s ease",boxShadow:isCurrentMonth?`0 4px 12px ${C.acc}33`:"none"}}/>
       <div style={{fontSize:8,color:isCurrentMonth?C.acc:C.td,fontWeight:isCurrentMonth?700:400}}>{MN[d.getMonth()]?.slice(0,3)}</div>
      </div>;
     })}
    </div>
    {ca===0&&<div style={{textAlign:"center",padding:"8px 0 0",fontSize:10,color:C.td}}>
     <button onClick={()=>onNav?.(2)} style={{background:"none",border:"none",color:C.acc,cursor:"pointer",fontFamily:FONT,fontSize:10,fontWeight:600}}>→ Saisir vos données financières</button>
    </div>}
   </Card>

   {/* Pipeline summary */}
   <Card style={{padding:16}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
     <div style={{fontWeight:700,fontSize:12}}>Pipeline commercial</div>
     <button onClick={()=>onNav?.(2)} style={{background:"none",border:"none",color:C.b,cursor:"pointer",fontFamily:FONT,fontSize:9,fontWeight:600}}>Voir tout →</button>
    </div>
    {deals.length>0?<>
     <div style={{display:"flex",gap:6,marginBottom:12}}>
      <div style={{flex:1,padding:"10px 12px",borderRadius:10,background:`${C.b}10`,textAlign:"center"}}>
       <div style={{fontSize:18,fontWeight:900,fontFamily:FONT_TITLE,color:C.b}}>{deals.length}</div>
       <div style={{fontSize:8,color:C.td,fontWeight:600}}>DEALS</div>
      </div>
      <div style={{flex:1,padding:"10px 12px",borderRadius:10,background:`${C.g}10`,textAlign:"center"}}>
       <div style={{fontSize:18,fontWeight:900,fontFamily:FONT_TITLE,color:C.g}}>{fmt(pipelineTotal)}€</div>
       <div style={{fontSize:8,color:C.td,fontWeight:600}}>PIPELINE</div>
      </div>
      <div style={{flex:1,padding:"10px 12px",borderRadius:10,background:`${C.acc}10`,textAlign:"center"}}>
       <div style={{fontSize:18,fontWeight:900,fontFamily:FONT_TITLE,color:C.acc}}>{fmt(wonTotal)}€</div>
       <div style={{fontSize:8,color:C.td,fontWeight:600}}>GAGNÉS</div>
      </div>
     </div>
     {/* Pipeline stages bar */}
     <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",gap:1}}>
      {["Prospect","Qualification","Proposition","Négociation","Gagné","Perdu"].map((s,i)=>{
       const cnt=deals.filter(d=>d.stage===s).length;if(!cnt)return null;
       const colors=[C.td,C.b,C.o,"#f59e0b",C.g,C.r];
       return<div key={s} style={{flex:cnt,background:colors[i],borderRadius:2,transition:"flex .3s"}} title={`${s}: ${cnt}`}/>;
      })}
     </div>
     <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
      {["Prospect","Qualification","Proposition","Négociation","Gagné","Perdu"].map((s,i)=>{
       const cnt=deals.filter(d=>d.stage===s).length;if(!cnt)return null;
       const colors=[C.td,C.b,C.o,"#f59e0b",C.g,C.r];
       return<span key={s} style={{fontSize:8,color:colors[i],fontWeight:600}}>{s} ({cnt})</span>;
      })}
     </div>
    </>:<div style={{textAlign:"center",padding:"24px 12px"}}>
     <div style={{fontSize:32,marginBottom:8}}>📊</div>
     <div style={{fontSize:11,color:C.td,marginBottom:8}}>Pas encore de deals dans le pipeline</div>
     <button onClick={()=>onNav?.(2)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:`${C.b}18`,color:C.b,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Créer un deal →</button>
    </div>}
   </Card>
  </div>

  {/* ========== SECOND ROW: Health + Activity ========== */}
  <div className="saas-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
   {/* System health */}
   <Card style={{padding:16}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
     <div style={{fontWeight:700,fontSize:12}}>Santé du système</div>
     <button onClick={()=>onNav?.(7)} style={{background:"none",border:"none",color:C.g,cursor:"pointer",fontFamily:FONT,fontSize:9,fontWeight:600}}>Data Health →</button>
    </div>
    {(health.items||[]).length>0?(health.items||[]).slice(0,5).map((h,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<4?`1px solid ${C.brd}08`:"none"}}>
     <span style={{width:10,height:10,borderRadius:5,background:h.status==="ok"?C.g:h.status==="warning"?C.o:C.r,boxShadow:`0 0 6px ${h.status==="ok"?C.g:h.status==="warning"?C.o:C.r}44`}}/>
     <span style={{flex:1,fontSize:10,fontWeight:500}}>{h.label}</span>
     <span style={{padding:"2px 8px",borderRadius:6,fontSize:8,fontWeight:700,background:`${h.status==="ok"?C.g:h.status==="warning"?C.o:C.r}15`,color:h.status==="ok"?C.g:h.status==="warning"?C.o:C.r}}>{h.status==="ok"?"OK":h.status==="warning"?"Attention":"Erreur"}</span>
    </div>):<div style={{textAlign:"center",padding:"20px 12px"}}>
     <div style={{fontSize:28,marginBottom:6}}>🔬</div>
     <div style={{fontSize:11,color:C.td,marginBottom:4}}>Aucune donnée de santé</div>
     <div style={{fontSize:9,color:C.td}}>Saisissez des données pour activer le monitoring automatique</div>
    </div>}
   </Card>

   {/* Activity & Upcoming */}
   <Card style={{padding:16}}>
    <div style={{fontWeight:700,fontSize:12,marginBottom:12}}>Activité récente & à venir</div>
    {(upcomingEvents.length>0||tasks.length>0)?<div>
     {upcomingEvents.map(e=>{
      const ET=[{v:"meeting",icon:"📅",c:C.b},{v:"call",icon:"📞",c:C.g},{v:"deadline",icon:"⏰",c:C.r},{v:"task",icon:"📋",c:C.o}];
      const t=ET.find(t2=>t2.v===e.type)||{icon:"📌",c:C.td};
      return<div key={e.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.brd}08`}}>
       <div style={{width:28,height:28,borderRadius:8,background:`${t.c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{t.icon}</div>
       <div style={{flex:1}}>
        <div style={{fontWeight:600,fontSize:11}}>{e.title}</div>
        <div style={{fontSize:9,color:C.td}}>{new Date(e.date).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}{e.time?` · ${e.time}`:""}</div>
       </div>
       <span style={{padding:"2px 6px",borderRadius:4,fontSize:8,fontWeight:600,background:`${t.c}12`,color:t.c}}>À venir</span>
      </div>;
     })}
     {tasks.filter(t=>!t.done).slice(0,3).map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.brd}08`}}>
      <div style={{width:28,height:28,borderRadius:8,background:`${C.o}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📋</div>
      <div style={{flex:1}}>
       <div style={{fontWeight:600,fontSize:11}}>{t.title}</div>
       {t.deadline&&<div style={{fontSize:9,color:C.td}}>{t.deadline}</div>}
      </div>
      <span style={{padding:"2px 6px",borderRadius:4,fontSize:8,fontWeight:600,background:`${C.o}12`,color:C.o}}>Tâche</span>
     </div>)}
    </div>:<div style={{textAlign:"center",padding:"20px 12px"}}>
     <div style={{fontSize:28,marginBottom:6}}>📅</div>
     <div style={{fontSize:11,color:C.td,marginBottom:8}}>Rien de planifié pour l'instant</div>
     <button onClick={()=>onNav?.(3)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:`${C.o}18`,color:C.o,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Planifier un événement →</button>
    </div>}
   </Card>
  </div>

  {/* ========== THIRD ROW: CRM overview + Ads summary ========== */}
  <div className="saas-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
   {/* CRM overview */}
   <Card style={{padding:16}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
     <div style={{fontWeight:700,fontSize:12}}>Contacts CRM</div>
     <button onClick={()=>onNav?.(1)} style={{background:"none",border:"none",color:C.b,cursor:"pointer",fontFamily:FONT,fontSize:9,fontWeight:600}}>Voir tous →</button>
    </div>
    {contacts.length>0?<>
     <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>
      {[{v:"prospect",l:"Prospects",c:C.b},{v:"lead",l:"Leads",c:C.o},{v:"client",l:"Clients",c:C.g},{v:"churned",l:"Perdus",c:C.r},{v:"partner",l:"Partenaires",c:C.v}].map(s=>{
       const cnt=contacts.filter(c2=>c2.status===s.v).length;
       return<div key={s.v} style={{padding:"6px 10px",borderRadius:8,background:`${s.c}10`,textAlign:"center",minWidth:60}}>
        <div style={{fontSize:14,fontWeight:900,fontFamily:FONT_TITLE,color:s.c}}>{cnt}</div>
        <div style={{fontSize:7,color:C.td,fontWeight:600,textTransform:"uppercase"}}>{s.l}</div>
       </div>;
      })}
     </div>
     {/* Recent contacts */}
     {contacts.slice(0,3).map(c2=><div key={c2.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.brd}08`}}>
      <div style={{width:24,height:24,borderRadius:6,background:`${C.b}18`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:10,color:C.b}}>{(c2.name||"?")[0].toUpperCase()}</div>
      <div style={{flex:1,minWidth:0}}>
       <div style={{fontWeight:600,fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c2.name}</div>
       <div style={{fontSize:8,color:C.td}}>{c2.company||c2.email||"—"}</div>
      </div>
      <span style={{padding:"1px 6px",borderRadius:4,fontSize:7,fontWeight:600,background:`${({prospect:C.b,lead:C.o,client:C.g,churned:C.r,partner:C.v})[c2.status]||C.td}15`,color:({prospect:C.b,lead:C.o,client:C.g,churned:C.r,partner:C.v})[c2.status]||C.td}}>{c2.status}</span>
     </div>)}
    </>:<div style={{textAlign:"center",padding:"20px 12px"}}>
     <div style={{fontSize:28,marginBottom:6}}>👥</div>
     <div style={{fontSize:11,color:C.td,marginBottom:8}}>Pas encore de contacts</div>
     <button onClick={()=>onNav?.(1)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:`${C.b}18`,color:C.b,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Ajouter un contact →</button>
    </div>}
   </Card>

   {/* Ads summary */}
   <Card style={{padding:16}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
     <div style={{fontWeight:700,fontSize:12}}>Publicité du mois</div>
     <button onClick={()=>onNav?.(2)} style={{background:"none",border:"none",color:"#f472b6",cursor:"pointer",fontFamily:FONT,fontSize:9,fontWeight:600}}>Détails →</button>
    </div>
    {pf(curAds.spend)>0?(()=>{
     const sp=pf(curAds.spend);const imp=pf(curAds.impressions);const cl=pf(curAds.clicks);const cv=pf(curAds.conversions);const rev=pf(curAds.revenue);
     const roas=sp?(rev/sp):0;const ctr=imp?((cl/imp)*100):0;
     return<>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
       <div style={{padding:"8px 10px",borderRadius:8,background:`${C.r}10`}}>
        <div style={{fontSize:16,fontWeight:900,fontFamily:FONT_TITLE,color:C.r}}>{fmt(sp)}€</div>
        <div style={{fontSize:7,color:C.td,fontWeight:600}}>DÉPENSES</div>
       </div>
       <div style={{padding:"8px 10px",borderRadius:8,background:`${C.g}10`}}>
        <div style={{fontSize:16,fontWeight:900,fontFamily:FONT_TITLE,color:C.g}}>{roas.toFixed(1)}x</div>
        <div style={{fontSize:7,color:C.td,fontWeight:600}}>ROAS</div>
       </div>
      </div>
      <div style={{display:"flex",gap:12,fontSize:9,color:C.td}}>
       <span><b style={{color:C.t}}>{fK(imp)}</b> impressions</span>
       <span><b style={{color:C.t}}>{cl}</b> clics</span>
       <span>CTR <b style={{color:ctr>2?C.g:C.o}}>{ctr.toFixed(1)}%</b></span>
      </div>
     </>;
    })():<div style={{textAlign:"center",padding:"20px 12px"}}>
     <div style={{fontSize:28,marginBottom:6}}>📣</div>
     <div style={{fontSize:11,color:C.td,marginBottom:8}}>Pas de données publicitaires ce mois</div>
     <button onClick={()=>onNav?.(2)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:"#f472b618",color:"#f472b6",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Saisir les dépenses →</button>
    </div>}
   </Card>
  </div>

  {/* ========== TASKS ========== */}
  <Card style={{padding:16}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
    <div style={{fontWeight:700,fontSize:12}}>Tâches</div>
    <span style={{padding:"2px 8px",borderRadius:10,background:`${C.b}15`,color:C.b,fontSize:9,fontWeight:700}}>{openTasks} en cours</span>
   </div>
   {tasks.length>0?tasks.slice(0,6).map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.brd}08`}}>
    <span style={{width:20,height:20,borderRadius:6,border:`2px solid ${t.done?C.g:C.brd}`,background:t.done?C.g:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0}}>{t.done?"✓":""}</span>
    <span style={{flex:1,fontSize:11,fontWeight:500,textDecoration:t.done?"line-through":"none",color:t.done?C.td:C.t}}>{t.title}</span>
    {t.deadline&&<span style={{fontSize:9,color:C.td,padding:"2px 6px",borderRadius:4,background:C.card2+"44"}}>{t.deadline}</span>}
   </div>):<div style={{textAlign:"center",padding:"16px 12px",color:C.td,fontSize:11}}>Aucune tâche pour le moment</div>}
  </Card>
 </>;
}

/* ====== CRM TAB ====== */
function CRMTab({data,setData}){
 const contacts=data.contacts||[];const[search,setSearch]=useState("");const[showAdd,setShowAdd]=useState(false);
 const[nf,setNf]=useState({name:"",email:"",phone:"",company:"",status:"prospect",note:""});
 const STS=[{v:"prospect",l:"Prospect"},{v:"lead",l:"Lead"},{v:"client",l:"Client"},{v:"churned",l:"Perdu"},{v:"partner",l:"Partenaire"}];
 const SC={prospect:C.b,lead:C.o,client:C.g,churned:C.r,partner:C.v};

 const add=()=>{
  if(!nf.name)return;
  const c={...nf,id:uid(),createdAt:new Date().toISOString()};
  const nd={...data,contacts:[c,...contacts]};setData(nd);sv(SK,nd);setShowAdd(false);setNf({name:"",email:"",phone:"",company:"",status:"prospect",note:""});
 };
 const del=(id)=>{const nd={...data,contacts:contacts.filter(c=>c.id!==id)};setData(nd);sv(SK,nd);};
 const filtered=contacts.filter(c=>{if(!search)return true;const s=search.toLowerCase();return(c.name||"").toLowerCase().includes(s)||(c.email||"").toLowerCase().includes(s)||(c.company||"").toLowerCase().includes(s);});

 return<>
  <div style={{fontWeight:900,fontSize:20,fontFamily:FONT_TITLE,marginBottom:4}}>CRM</div>
  <div style={{fontSize:11,color:C.td,marginBottom:16}}>Gestion des contacts et pipeline commercial</div>
  <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
   {STS.map(s=><KPI key={s.v} label={s.l} value={contacts.filter(c=>c.status===s.v).length} accent={SC[s.v]} small/>)}
  </div>
  <div style={{display:"flex",gap:8,marginBottom:14}}>
   <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un contact..." style={{flex:1,padding:"8px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
   <Btn small onClick={()=>setShowAdd(true)}>+ Contact</Btn>
  </div>
  {filtered.length===0&&<Card style={{padding:"40px 20px"}}><div style={{textAlign:"center"}}>
   <div style={{fontSize:40,marginBottom:12}}>👥</div>
   <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Aucun contact</div>
   <div style={{color:C.td,fontSize:11,marginBottom:16,maxWidth:300,margin:"0 auto 16px"}}>Commencez à construire votre base de contacts en ajoutant vos premiers prospects et clients.</div>
   <Btn small onClick={()=>setShowAdd(true)}>Ajouter un contact</Btn>
  </div></Card>}
  {filtered.map(c=><Card key={c.id} style={{marginBottom:4,padding:"10px 14px"}}>
   <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
    <div style={{width:32,height:32,borderRadius:8,background:`${SC[c.status]||C.b}22`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:SC[c.status]||C.b}}>{(c.name||"?")[0].toUpperCase()}</div>
    <div style={{flex:1,minWidth:120}}>
     <div style={{fontWeight:700,fontSize:12}}>{c.name}</div>
     <div style={{fontSize:10,color:C.td}}>{c.email}{c.company?` · ${c.company}`:""}</div>
    </div>
    <span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:600,background:`${SC[c.status]}18`,color:SC[c.status]}}>{STS.find(s=>s.v===c.status)?.l||c.status}</span>
    {c.phone&&<span style={{fontSize:9,color:C.td}}>📞 {c.phone}</span>}
    <button onClick={()=>del(c.id)} style={{padding:"3px 6px",borderRadius:4,border:`1px solid ${C.r}33`,background:"transparent",color:C.r,fontSize:9,cursor:"pointer",fontFamily:FONT}}>×</button>
   </div>
   {c.note&&<div style={{marginTop:4,fontSize:10,color:C.td,paddingLeft:40}}>{c.note}</div>}
  </Card>)}
  <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Nouveau contact">
   <Inp label="Nom complet *" value={nf.name} onChange={v=>setNf({...nf,name:v})} placeholder="Jean Dupont"/>
   <Inp label="Email" value={nf.email} onChange={v=>setNf({...nf,email:v})} placeholder="jean@company.com" type="email"/>
   <Inp label="Téléphone" value={nf.phone} onChange={v=>setNf({...nf,phone:v})} placeholder="+33 6 12 34 56 78"/>
   <Inp label="Entreprise" value={nf.company} onChange={v=>setNf({...nf,company:v})} placeholder="Acme Corp"/>
   <Sel label="Statut" value={nf.status} onChange={v=>setNf({...nf,status:v})} options={STS}/>
   <Inp label="Notes" value={nf.note} onChange={v=>setNf({...nf,note:v})} textarea placeholder="Notes libres..."/>
   <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={add}>Ajouter</Btn><Btn v="secondary" onClick={()=>setShowAdd(false)}>Annuler</Btn></div>
  </Modal>
 </>;
}

/* ====== DATA TAB (Finances / Sales / Publicité) ====== */
function DataTab({data,setData}){
 const[sub,setSub]=useState(0);
 const SUBS=[{l:"Finances",icon:"💰",accent:C.g},{l:"Sales",icon:"📞",accent:C.b},{l:"Publicité",icon:"📣",accent:"#f472b6"}];
 const fin=data.finances||{};const ads=data.ads||{};const cM=curM();const curFin=fin[cM]||{};const curAds=ads[cM]||{};

 const uFin=(f,v)=>{const nf={...fin,[cM]:{...curFin,[f]:v}};const nd={...data,finances:nf};setData(nd);sv(SK,nd);};
 const uAds=(f,v)=>{const na={...ads,[cM]:{...curAds,[f]:v}};const nd={...data,ads:na};setData(nd);sv(SK,nd);};

 return<>
  <div style={{fontWeight:900,fontSize:20,fontFamily:FONT_TITLE,marginBottom:4}}>Data</div>
  <div style={{fontSize:11,color:C.td,marginBottom:16}}>Finances, ventes et publicité</div>
  <div style={{display:"flex",gap:4,marginBottom:16}}>
   {SUBS.map((s,i)=><button key={i} onClick={()=>setSub(i)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:`1px solid ${sub===i?s.accent+"55":C.brd}`,background:sub===i?s.accent+"15":"transparent",color:sub===i?C.t:C.td,fontSize:11,fontWeight:sub===i?700:500,cursor:"pointer",fontFamily:FONT}}><span>{s.icon}</span>{s.l}</button>)}
  </div>

  {/* FINANCES */}
  {sub===0&&<>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:16}}>
    <KPI label="CA mensuel" value={fmt(pf(curFin.ca))+"€"} accent={C.g} icon="💰"/>
    <KPI label="Charges fixes" value={fmt(pf(curFin.chargesFixes))+"€"} accent={C.o} icon="🏢"/>
    <KPI label="Charges variables" value={fmt(pf(curFin.chargesVar))+"€"} accent={C.r} icon="📦"/>
    <KPI label="Trésorerie" value={fmt(pf(curFin.tresorerie))+"€"} accent={C.b} icon="🏦"/>
   </div>
   <Sect title={`Saisie — ${ml(cM)}`}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <Inp label="Chiffre d'affaires (€)" value={curFin.ca||""} onChange={v=>uFin("ca",v)} type="number" placeholder="0"/>
     <Inp label="Charges fixes (€)" value={curFin.chargesFixes||""} onChange={v=>uFin("chargesFixes",v)} type="number" placeholder="0"/>
     <Inp label="Charges variables (€)" value={curFin.chargesVar||""} onChange={v=>uFin("chargesVar",v)} type="number" placeholder="0"/>
     <Inp label="Trésorerie (€)" value={curFin.tresorerie||""} onChange={v=>uFin("tresorerie",v)} type="number" placeholder="0"/>
    </div>
   </Sect>
   <Sect title="Historique" sub="6 derniers mois">
    <div style={{overflowX:"auto"}}>
     <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
      <thead><tr style={{borderBottom:`1px solid ${C.brd}`}}>
       <th style={{textAlign:"left",padding:"6px 8px",color:C.td}}>Mois</th>
       <th style={{textAlign:"right",padding:"6px 8px",color:C.g}}>CA</th>
       <th style={{textAlign:"right",padding:"6px 8px",color:C.r}}>Charges</th>
       <th style={{textAlign:"right",padding:"6px 8px",color:C.b}}>Résultat</th>
      </tr></thead>
      <tbody>{Array.from({length:6}).map((_,i)=>{
       const d=new Date();d.setMonth(d.getMonth()-i);
       const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
       const f2=fin[k]||{};const ca2=pf(f2.ca);const ch=pf(f2.charges||((pf(f2.chargesFixes))+(pf(f2.chargesVar))));
       return<tr key={k} style={{borderBottom:`1px solid ${C.brd}08`}}>
        <td style={{padding:"6px 8px",fontWeight:500}}>{ml(k)}</td>
        <td style={{padding:"6px 8px",textAlign:"right",color:C.g}}>{fmt(ca2)}€</td>
        <td style={{padding:"6px 8px",textAlign:"right",color:C.r}}>{fmt(ch)}€</td>
        <td style={{padding:"6px 8px",textAlign:"right",color:ca2-ch>=0?C.g:C.r,fontWeight:600}}>{fmt(ca2-ch)}€</td>
       </tr>;
      })}</tbody>
     </table>
    </div>
   </Sect>
  </>}

  {/* SALES */}
  {sub===1&&(()=>{
   const deals=data.deals||[];const stages=["Prospect","Qualification","Proposition","Négociation","Gagné","Perdu"];
   const STAGE_C=[C.td,C.b,C.o,"#f59e0b",C.g,C.r];
   return<>
    <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
     {stages.map((s,i)=><KPI key={s} label={s} value={deals.filter(d=>d.stage===s).length} accent={STAGE_C[i]} small/>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:`repeat(${stages.length},minmax(130px,1fr))`,gap:6,overflowX:"auto"}}>
     {stages.map((s,i)=><div key={s} style={{padding:8,background:C.card2+"33",borderRadius:10,minHeight:200}}>
      <div style={{fontWeight:700,fontSize:10,color:STAGE_C[i],marginBottom:8,textAlign:"center"}}>{s} ({deals.filter(d=>d.stage===s).length})</div>
      {deals.filter(d=>d.stage===s).map(d=><Card key={d.id} style={{marginBottom:4,padding:"8px 10px"}}>
       <div style={{fontWeight:600,fontSize:10}}>{d.name}</div>
       <div style={{fontSize:9,color:C.td}}>{d.company||"—"}</div>
       {d.value&&<div style={{fontSize:10,fontWeight:700,color:C.g,marginTop:2}}>{fmt(d.value)}€</div>}
      </Card>)}
     </div>)}
    </div>
   </>;
  })()}

  {/* PUBLICITÉ */}
  {sub===2&&(()=>{
   const sp=pf(curAds.spend);const imp=pf(curAds.impressions);const cl=pf(curAds.clicks);const cv=pf(curAds.conversions);const rev=pf(curAds.revenue);
   const ctr=imp?((cl/imp)*100):0;const cpc=cl?(sp/cl):0;const roas=sp?(rev/sp):0;const cpa=cv?(sp/cv):0;
   return<>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:16}}>
     <KPI label="Dépenses" value={fmt(sp)+"€"} accent={C.r} icon="💸"/>
     <KPI label="Impressions" value={fK(imp)} accent={C.b} icon="👁"/>
     <KPI label="CTR" value={ctr.toFixed(2)+"%"} accent={ctr>2?C.g:C.o} icon="📊"/>
     <KPI label="CPC" value={cpc.toFixed(2)+"€"} accent={C.b} icon="💰"/>
     <KPI label="Conversions" value={cv} accent={C.g} icon="🎯"/>
     <KPI label="ROAS" value={roas.toFixed(2)+"x"} accent={roas>=3?C.g:roas>=1?C.o:C.r} icon="📈"/>
    </div>
    <Sect title={`Saisie pub — ${ml(cM)}`}>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
      <Inp label="Budget (€)" value={curAds.spend||""} onChange={v=>uAds("spend",v)} type="number"/>
      <Inp label="Impressions" value={curAds.impressions||""} onChange={v=>uAds("impressions",v)} type="number"/>
      <Inp label="Clics" value={curAds.clicks||""} onChange={v=>uAds("clicks",v)} type="number"/>
      <Inp label="Conversions" value={curAds.conversions||""} onChange={v=>uAds("conversions",v)} type="number"/>
      <Inp label="Revenu (€)" value={curAds.revenue||""} onChange={v=>uAds("revenue",v)} type="number"/>
      <Inp label="Source" value={curAds.source||""} onChange={v=>uAds("source",v)} placeholder="Meta, Google..."/>
     </div>
    </Sect>
    <Card style={{padding:14,marginTop:12}}>
     <div style={{fontWeight:700,fontSize:11,marginBottom:8}}>📌 Règle : Source des dépenses Ads</div>
     <div style={{fontSize:10,color:C.td,lineHeight:1.6}}>
      <b style={{color:C.b}}>Business Manager</b> pour la précision (attribution par campagne).
      <b style={{color:C.v}}> Revolut</b> en validation croisée. Écart &gt; 5% = investigation requise.
     </div>
    </Card>
   </>;
  })()}
 </>;
}

/* ====== AGENDA TAB ====== */
function AgendaTab({data,setData}){
 const events=data.events||[];const[showAdd,setShowAdd]=useState(false);
 const[nf,setNf]=useState({title:"",date:"",time:"",type:"meeting",desc:""});
 const ET=[{v:"meeting",l:"Réunion",icon:"📅",color:C.b},{v:"call",l:"Appel",icon:"📞",color:C.g},{v:"deadline",l:"Deadline",icon:"⏰",color:C.r},{v:"task",l:"Tâche",icon:"📋",color:C.o},{v:"other",l:"Autre",icon:"📌",color:C.td}];

 const add=()=>{
  if(!nf.title||!nf.date)return;
  const ev={...nf,id:uid(),createdAt:new Date().toISOString()};
  const nd={...data,events:[ev,...events].sort((a,b)=>new Date(a.date)-new Date(b.date))};setData(nd);sv(SK,nd);setShowAdd(false);setNf({title:"",date:"",time:"",type:"meeting",desc:""});
 };
 const rm=(id)=>{const nd={...data,events:events.filter(e=>e.id!==id)};setData(nd);sv(SK,nd);};
 const today=new Date().toISOString().slice(0,10);
 const upcoming=events.filter(e=>e.date>=today);const past=events.filter(e=>e.date<today);

 return<>
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
   <div style={{flex:1}}>
    <div style={{fontWeight:900,fontSize:20,fontFamily:FONT_TITLE}}>Agenda</div>
    <div style={{fontSize:11,color:C.td}}>Réunions, deadlines et événements</div>
   </div>
   <Btn small onClick={()=>setShowAdd(true)}>+ Événement</Btn>
  </div>
  <Sect title="À venir" sub={`${upcoming.length} événement(s)`}>
   {upcoming.length===0&&<Card style={{padding:"40px 20px"}}><div style={{textAlign:"center"}}>
    <div style={{fontSize:40,marginBottom:12}}>📅</div>
    <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Aucun événement à venir</div>
    <div style={{color:C.td,fontSize:11,marginBottom:16,maxWidth:300,margin:"0 auto 16px"}}>Planifiez vos réunions, appels et deadlines pour ne rien manquer.</div>
    <Btn small onClick={()=>setShowAdd(true)}>Créer un événement</Btn>
   </div></Card>}
   {upcoming.map(e=>{const t=ET.find(t2=>t2.v===e.type)||ET[4];
    return<Card key={e.id} style={{marginBottom:4,padding:"10px 14px"}} accent={t.color}>
     <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:16}}>{t.icon}</span>
      <div style={{flex:1}}>
       <div style={{fontWeight:700,fontSize:12}}>{e.title}</div>
       <div style={{fontSize:10,color:C.td}}>{new Date(e.date).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}{e.time?` à ${e.time}`:""}</div>
       {e.desc&&<div style={{fontSize:10,color:C.td,marginTop:2}}>{e.desc}</div>}
      </div>
      <button onClick={()=>rm(e.id)} style={{padding:"3px 6px",borderRadius:4,border:`1px solid ${C.r}33`,background:"transparent",color:C.r,fontSize:9,cursor:"pointer",fontFamily:FONT}}>×</button>
     </div>
    </Card>;
   })}
  </Sect>
  {past.length>0&&<Sect title="Passés" sub={`${past.length}`}>
   {past.slice(0,10).map(e=>{const t=ET.find(t2=>t2.v===e.type)||ET[4];
    return<Card key={e.id} style={{marginBottom:3,padding:"8px 12px",opacity:.6}}>
     <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:14}}>{t.icon}</span>
      <div style={{flex:1}}><div style={{fontWeight:600,fontSize:11}}>{e.title}</div><div style={{fontSize:9,color:C.td}}>{new Date(e.date).toLocaleDateString("fr-FR")}</div></div>
     </div>
    </Card>;
   })}
  </Sect>}
  <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Nouvel événement">
   <Inp label="Titre *" value={nf.title} onChange={v=>setNf({...nf,title:v})} placeholder="Réunion client..."/>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
    <Inp label="Date *" value={nf.date} onChange={v=>setNf({...nf,date:v})} type="date"/>
    <Inp label="Heure" value={nf.time} onChange={v=>setNf({...nf,time:v})} type="time"/>
   </div>
   <Sel label="Type" value={nf.type} onChange={v=>setNf({...nf,type:v})} options={ET}/>
   <Inp label="Description" value={nf.desc} onChange={v=>setNf({...nf,desc:v})} textarea placeholder="Détails..."/>
   <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={add}>Créer</Btn><Btn v="secondary" onClick={()=>setShowAdd(false)}>Annuler</Btn></div>
  </Modal>
 </>;
}

/* ====== MAIN PORTAL EXPORT ====== */
const TABS=[
 {id:0,label:"Overview",icon:"📊",accent:C.acc},
 {id:1,label:"CRM",icon:"👥",accent:C.b},
 {id:2,label:"Data",icon:"💾",accent:C.g},
 {id:3,label:"Agenda",icon:"📅",accent:C.o},
 {id:4,label:"Paramètres",icon:"⚙️",accent:C.td},
 {id:5,label:"Facturation",icon:"💳",accent:C.v},
 {id:6,label:"Onboarding",icon:"🚀",accent:"#f59e0b"},
 {id:7,label:"Data Health",icon:"🔬",accent:C.g},
];

export function SaaSClientPortal({previewMode}){
 const[tab,setTab]=useState(previewMode?0:6);
 const[data,setData]=useState(()=>load(SK,{contacts:[],finances:{},deals:[],ads:{},events:[],tasks:[],alerts:[],health:{score:0,items:[]},onboarding:null,billing:null}));
 const client=data.client||{company:"",siret:"",tva:"",address:"",email:"",phone:"",plan:"starter",billing:"monthly"};
 const setClient=(c)=>{const nd={...data,client:c};setData(nd);sv(SK,nd);};
 const isOnb=!!(data.onboarding?.completed);

 useEffect(()=>{if(!isOnb&&!previewMode&&tab!==6&&tab!==5)setTab(6);},[isOnb,previewMode,tab]);

 /* Hide onboarding tab once completed */
 const visibleTabs=isOnb?TABS.filter(t=>t.id!==6):TABS;

 return<div>
  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
   <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.acc},#FF9D00)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:"#0a0a0f"}}>{(client.company||"C")[0].toUpperCase()}</div>
   <div>
    <div style={{fontWeight:900,fontSize:18,fontFamily:FONT_TITLE}}>{client.company||"Client Portal"}</div>
    <div style={{fontSize:10,color:C.td}}>Template SaaS — Espace client B2B</div>
   </div>
   {previewMode&&<span style={{marginLeft:"auto",padding:"4px 10px",borderRadius:6,background:C.oD,color:C.o,fontSize:9,fontWeight:700}}>MODE PREVIEW</span>}
  </div>

  <div className="saas-tabs" style={{display:"flex",gap:3,marginBottom:20,overflowX:"auto",padding:"2px 0",borderBottom:`1px solid ${C.brd}`,paddingBottom:8}}>
   {visibleTabs.map(t=>{const a=tab===t.id;
    return<button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:"none",background:a?t.accent+"18":"transparent",color:a?C.t:C.td,fontSize:10,fontWeight:a?700:500,cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap",flexShrink:0,borderBottom:a?`2px solid ${t.accent}`:"2px solid transparent"}}>
     <span style={{fontSize:12}}>{t.icon}</span><span>{t.label}</span>
    </button>;
   })}
  </div>

  {tab===0&&<OverviewTab client={client} data={data} onNav={setTab}/>}
  {tab===1&&<CRMTab data={data} setData={setData}/>}
  {tab===2&&<DataTab data={data} setData={setData}/>}
  {tab===3&&<AgendaTab data={data} setData={setData}/>}
  {tab===4&&<Suspense fallback={LF}><ClientSettingsPanel data={data} setData={setData} client={client} setClient={setClient}/></Suspense>}
  {tab===5&&<Suspense fallback={LF}><ClientBilling data={data} setData={setData} client={client} setClient={setClient} onSuccess={()=>setTab(6)}/></Suspense>}
  {tab===6&&<Suspense fallback={LF}><ClientOnboarding data={data} setData={setData} client={client} setClient={setClient} onComplete={()=>setTab(0)}/></Suspense>}
  {tab===7&&<Suspense fallback={LF}><DataHealth data={data} setData={setData}/></Suspense>}
 </div>;
}
