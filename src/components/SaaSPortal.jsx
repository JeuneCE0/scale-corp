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

/* ====== OVERVIEW TAB ====== */
function OverviewTab({client,data}){
 const cM=curM();
 const fin=data.finances||{};const curFin=fin[cM]||{};
 const ca=pf(curFin.ca);const charges=pf(curFin.charges||((pf(curFin.chargesFixes))+(pf(curFin.chargesVar))));
 const profit=ca-charges;
 const pm=(()=>{const[y,m]=cM.split("-").map(Number);const p=m===1?12:m-1;return`${m===1?y-1:y}-${String(p).padStart(2,"0")}`;})();
 const prevCA=pf((fin[pm]||{}).ca);const evoCA=prevCA?((ca-prevCA)/prevCA*100):0;
 const health=data.health||{score:0,items:[]};
 const alerts=data.alerts||[];
 const tasks=data.tasks||[];
 const openTasks=tasks.filter(t=>!t.done).length;

 return<>
  <div style={{fontWeight:900,fontSize:20,fontFamily:FONT_TITLE,marginBottom:4}}>
   Bienvenue, {client.company||"Mon entreprise"}
  </div>
  <div style={{fontSize:11,color:C.td,marginBottom:20}}>
   Vue d'ensemble — {new Date().toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}
  </div>

  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:20}}>
   <KPI label="CA du mois" value={fmt(ca)+"€"} sub={evoCA!==0?`${evoCA>0?"+":""}${evoCA.toFixed(1)}%`:undefined} accent={C.g} icon="💰"/>
   <KPI label="Charges" value={fmt(charges)+"€"} accent={C.r} icon="📉"/>
   <KPI label="Résultat net" value={fmt(profit)+"€"} accent={profit>=0?C.g:C.r} icon="📊"/>
   <KPI label="Score santé" value={`${health.score}/100`} accent={health.score>=70?C.g:health.score>=40?C.o:C.r} icon="❤️"/>
   <KPI label="Tâches ouvertes" value={openTasks} accent={C.b} icon="📋"/>
   <KPI label="Alertes" value={alerts.filter(a=>!a.dismissed).length} accent={C.o} icon="⚠️"/>
  </div>

  {alerts.filter(a=>!a.dismissed).length>0&&<Sect title="Alertes actives" sub={`${alerts.filter(a=>!a.dismissed).length} alerte(s)`}>
   {alerts.filter(a=>!a.dismissed).slice(0,5).map(a=><Card key={a.id} style={{marginBottom:4,padding:"10px 14px"}} accent={a.severity==="critical"?C.r:a.severity==="warning"?C.o:C.b}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
     <span style={{fontSize:14}}>{a.severity==="critical"?"🔴":a.severity==="warning"?"🟡":"🔵"}</span>
     <div style={{flex:1}}>
      <div style={{fontWeight:700,fontSize:11}}>{a.title}</div>
      <div style={{fontSize:10,color:C.td}}>{a.message}</div>
     </div>
     <span style={{fontSize:9,color:C.td}}>{ago(a.at)}</span>
    </div>
   </Card>)}
  </Sect>}

  <div className="saas-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
   <Card style={{padding:16}}>
    <div style={{fontWeight:700,fontSize:12,marginBottom:12}}>Évolution CA (6 derniers mois)</div>
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:100}}>
     {Array.from({length:6}).map((_,i)=>{
      const d=new Date();d.setMonth(d.getMonth()-5+i);
      const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const v=pf((fin[k]||{}).ca);const maxV=Math.max(...Array.from({length:6}).map((_,j)=>{const d2=new Date();d2.setMonth(d2.getMonth()-5+j);const k2=`${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,"0")}`;return pf((fin[k2]||{}).ca);}),1);
      return<div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
       <div style={{fontSize:8,color:C.td,fontWeight:600}}>{fK(v)}</div>
       <div style={{width:"100%",background:`linear-gradient(to top,${C.g},${C.g}88)`,borderRadius:4,height:`${Math.max(4,(v/maxV)*80)}px`,transition:"height .3s"}}/>
       <div style={{fontSize:8,color:C.td}}>{MN[d.getMonth()]?.slice(0,3)}</div>
      </div>;
     })}
    </div>
   </Card>
   <Card style={{padding:16}}>
    <div style={{fontWeight:700,fontSize:12,marginBottom:12}}>Santé du système</div>
    {(health.items||[]).slice(0,5).map((h,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:i<4?`1px solid ${C.brd}08`:"none"}}>
     <span style={{width:8,height:8,borderRadius:4,background:h.status==="ok"?C.g:h.status==="warning"?C.o:C.r}}/>
     <span style={{flex:1,fontSize:10,fontWeight:500}}>{h.label}</span>
     <span style={{fontSize:9,color:h.status==="ok"?C.g:h.status==="warning"?C.o:C.r,fontWeight:600}}>{h.status==="ok"?"OK":h.status==="warning"?"Attention":"Erreur"}</span>
    </div>)}
    {(health.items||[]).length===0&&<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucune donnée</div>}
   </Card>
  </div>

  <Sect title="Tâches récentes" sub={`${openTasks} en cours`}>
   {tasks.length===0&&<Card><div style={{textAlign:"center",padding:16,color:C.td,fontSize:11}}>Aucune tâche</div></Card>}
   {tasks.slice(0,8).map(t=><Card key={t.id} style={{marginBottom:3,padding:"8px 12px"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
     <span style={{width:18,height:18,borderRadius:5,border:`2px solid ${t.done?C.g:C.brd}`,background:t.done?C.gD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.g}}>{t.done?"✓":""}</span>
     <span style={{flex:1,fontSize:11,fontWeight:500,textDecoration:t.done?"line-through":"none",color:t.done?C.td:C.t}}>{t.title}</span>
     {t.deadline&&<span style={{fontSize:9,color:C.td}}>{t.deadline}</span>}
    </div>
   </Card>)}
  </Sect>
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
  {filtered.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucun contact</div></Card>}
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
   {upcoming.length===0&&<Card><div style={{textAlign:"center",padding:16,color:C.td,fontSize:11}}>Aucun événement</div></Card>}
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
   {TABS.map(t=>{const a=tab===t.id;
    return<button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:"none",background:a?t.accent+"18":"transparent",color:a?C.t:C.td,fontSize:10,fontWeight:a?700:500,cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap",flexShrink:0,borderBottom:a?`2px solid ${t.accent}`:"2px solid transparent"}}>
     <span style={{fontSize:12}}>{t.icon}</span><span>{t.label}</span>
    </button>;
   })}
  </div>

  {tab===0&&<OverviewTab client={client} data={data}/>}
  {tab===1&&<CRMTab data={data} setData={setData}/>}
  {tab===2&&<DataTab data={data} setData={setData}/>}
  {tab===3&&<AgendaTab data={data} setData={setData}/>}
  {tab===4&&<Suspense fallback={LF}><ClientSettingsPanel data={data} setData={setData} client={client} setClient={setClient}/></Suspense>}
  {tab===5&&<Suspense fallback={LF}><ClientBilling data={data} setData={setData} client={client} setClient={setClient} onSuccess={()=>setTab(6)}/></Suspense>}
  {tab===6&&<Suspense fallback={LF}><ClientOnboarding data={data} setData={setData} client={client} setClient={setClient} onComplete={()=>setTab(0)}/></Suspense>}
  {tab===7&&<Suspense fallback={LF}><DataHealth data={data} setData={setData}/></Suspense>}
 </div>;
}
