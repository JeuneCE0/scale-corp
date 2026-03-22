import React, { useState, useMemo } from "react";
import { C, curM, fmt, project, commitmentRemaining } from "../shared.jsx";

export function PredictionsCard({soc,reps,allM,clients,ghlData,socBank}){
 const[expanded,setExpanded]=useState(false);
 const cm=curM();
 const proj=project(reps,soc?.id,allM);
 const myCl=(clients||[]).filter(c=>c.socId===soc?.id);
 const activeCl=myCl.filter(c=>c.status==="active");
 const gd=ghlData?.[soc?.id];
 const opps=gd?.opportunities||[];
 const openOpps=opps.filter(o=>o.status==="open");
 const wonOpps=opps.filter(o=>o.status==="won");
 const convRate=opps.length>0?wonOpps.length/opps.length:0;
 const expectedNew=Math.round(openOpps.length*convRate);
 const churnRisks=useMemo(()=>{
  const bk=socBank?.[soc?.id];
  return activeCl.map(c=>{
   let risk=0;const cn=(c.name||"").toLowerCase().trim();
   const calEvts=gd?.calendarEvents||[];const lastCall=calEvts.filter(e=>(e.title||e.contactName||"").toLowerCase().includes(cn)).sort((a,b)=>new Date(b.startTime||0)-new Date(a.startTime||0))[0];
   const daysSinceInteraction=lastCall?Math.floor((Date.now()-new Date(lastCall.startTime).getTime())/864e5):30;
   if(daysSinceInteraction>30)risk+=40;else if(daysSinceInteraction>14)risk+=20;
   const txs=(bk?.transactions||[]).filter(t=>{const leg=t.legs?.[0];return leg&&leg.amount>0&&(leg.description||t.reference||"").toLowerCase().includes(cn);});
   if(txs.length===0)risk+=30;else if(txs.length<3)risk+=10;
   const rem=commitmentRemaining(c);if(rem!==null&&rem<=1)risk+=20;else if(rem!==null&&rem<=3)risk+=10;
   return{name:c.name,risk:Math.min(100,risk),confidence:risk>50?"🔴":risk>25?"🟡":"🟢"};
  }).sort((a,b)=>b.risk-a.risk);
 },[activeCl,gd,socBank,soc]);
 const forecastConf=proj?"🟢":"🔴";
 const newClConf=opps.length>5?"🟢":opps.length>0?"🟡":"🔴";
 return <div className="glass-card-static fu d5" style={{padding:14,marginBottom:10,cursor:"pointer"}} onClick={()=>setExpanded(!expanded)}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
   <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>🔮</span><div><div style={{fontWeight:800,fontSize:13,color:C.t}}>Prédictions</div><div style={{fontSize:9,color:C.td}}>Forecast, churn, croissance</div></div></div>
   <span style={{fontSize:10,color:C.td}}>{expanded?"▲":"▼"}</span>
  </div>
  {expanded&&<div style={{marginTop:14,animation:"slideDown .3s ease both"}}>
   <div style={{padding:10,background:C.bg,borderRadius:10,marginBottom:8,border:`1px solid ${C.brd}`}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span>{forecastConf}</span><span style={{fontWeight:700,fontSize:11,color:C.t}}>CA prochain mois</span></div>
    <div style={{fontSize:20,fontWeight:900,color:C.acc}}>{proj?fmt(proj[0])+"€":"— données insuffisantes"}</div>
    {proj&&<div style={{fontSize:9,color:C.td,marginTop:2}}>T+2: {fmt(proj[1])}€ · T+3: {fmt(proj[2])}€</div>}
   </div>
   <div style={{padding:10,background:C.bg,borderRadius:10,marginBottom:8,border:`1px solid ${C.brd}`}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span>{newClConf}</span><span style={{fontWeight:700,fontSize:11,color:C.t}}>Nouveaux clients attendus</span></div>
    <div style={{fontSize:20,fontWeight:900,color:C.b}}>{expectedNew}</div>
    <div style={{fontSize:9,color:C.td}}>Basé sur {openOpps.length} prospects × {Math.round(convRate*100)}% taux conversion</div>
   </div>
   {churnRisks.length>0&&<div style={{padding:10,background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`}}>
    <div style={{fontWeight:700,fontSize:11,color:C.t,marginBottom:6}}>Risque churn</div>
    {churnRisks.slice(0,5).map((c,i)=><div key={c.name} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderBottom:`1px solid ${C.brd}08`}}>
     <span>{c.confidence}</span>
     <span style={{flex:1,fontSize:10,color:C.t}}>{c.name}</span>
     <span style={{fontSize:10,fontWeight:700,color:c.risk>50?C.r:c.risk>25?C.o:C.g}}>{c.risk}%</span>
    </div>)}
   </div>}
  </div>}
 </div>;
}
