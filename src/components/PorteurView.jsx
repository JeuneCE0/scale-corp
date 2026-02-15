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
import { Btn, Sect, Card, CTip } from "./UI.jsx";

import { ClientsPanelSafe, PulseForm, SubsTeamPanel, SubsTeamBadge, GamificationPanel, MilestonesCompact, CollapsibleSection, GoalEditor, CelebrationOverlay, MeetingPrepView, genInsights, calcBenchmark, getPlaybooks, SocSettingsPanel, OnboardingWizard, TutorialOverlay, Sidebar, SocieteView, WarRoom } from "./Misc.jsx";
import { SocBankWidget, BankingTransactions, categorizeTransaction } from "./Banking.jsx";
import { RapportsPanel } from "./Reports.jsx";
import { AIWeeklyCoach } from "./AI.jsx";
import { calcSmartAlerts, SmartAlertsPanel, BenchmarkRadar } from "./AdminDashboard.jsx";
import { SubsTeamPanel as _STP } from "./Misc.jsx";
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

