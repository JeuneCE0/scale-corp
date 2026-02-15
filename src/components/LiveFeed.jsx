import React, { useMemo } from "react";
import { C, ago, fmt } from "../shared.jsx";

export function LiveFeed({socs,reps,allM,ghlData,socBank,clients,maxEvents=50}){
 const events=useMemo(()=>{
  const evts=[];const now=Date.now();
  (socs||[]).forEach(s=>{
   const gd=ghlData?.[s.id];
   (gd?.opportunities||[]).forEach(o=>{
    if(o.status==="won")evts.push({ts:o.updatedAt||o.createdAt,icon:"✅",desc:`Deal gagné: ${o.name||o.contact?.name||"—"}`,amt:o.value||0,soc:s,type:"won"});
    if(o.status==="lost")evts.push({ts:o.updatedAt||o.createdAt,icon:"❌",desc:`Deal perdu: ${o.name||o.contact?.name||"—"}`,soc:s,type:"lost"});
   });
   (gd?.calendarEvents||[]).filter(e=>e.startTime).forEach(e=>{
    evts.push({ts:e.startTime,icon:"📞",desc:`RDV: ${e.title||e.contactName||"Appel"}`,soc:s,type:"call"});
   });
   (gd?.ghlClients||[]).slice(0,5).forEach(c=>{
    evts.push({ts:c.dateAdded||c.createdAt,icon:"👤",desc:`Nouveau lead: ${c.name||c.email||"Contact"}`,soc:s,type:"lead"});
   });
   const bk=socBank?.[s.id];
   (bk?.transactions||[]).slice(0,10).forEach(tx=>{
    const leg=tx.legs?.[0];if(!leg)return;
    if(leg.amount>0)evts.push({ts:tx.created_at,icon:"💰",desc:`Paiement reçu: ${tx.reference||leg.description||"—"}`,amt:leg.amount,soc:s,type:"payment"});
   });
  });
  return evts.filter(e=>e.ts).sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,maxEvents);
 },[socs,ghlData,socBank]);
 if(events.length===0)return <div style={{color:C.td,fontSize:11,textAlign:"center",padding:20}}>Aucune activité récente</div>;
 return <div style={{maxHeight:400,overflowY:"auto"}}>{events.map((e,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderBottom:`1px solid ${C.brd}08`,animation:`slideInRight .3s ease ${i*0.03}s both`}}>
  <span style={{fontSize:16,flexShrink:0}}>{e.icon}</span>
  <div style={{flex:1,minWidth:0}}>
   <div style={{fontSize:11,color:C.t,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.desc}</div>
   <div style={{display:"flex",gap:6,alignItems:"center",marginTop:2}}>
    <span style={{fontSize:9,color:C.td}}>{e.ts?ago(e.ts):""}</span>
    <span style={{fontSize:8,fontWeight:700,color:e.soc?.color||C.acc,background:(e.soc?.color||C.acc)+"18",padding:"1px 5px",borderRadius:4}}>{e.soc?.nom||""}</span>
   </div>
  </div>
  {e.amt?<span style={{fontWeight:700,fontSize:11,color:C.g,whiteSpace:"nowrap"}}>+{fmt(e.amt)}€</span>:null}
 </div>)}</div>;
}
