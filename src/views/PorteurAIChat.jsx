import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "../utils/index.jsx";
// Destructure commonly used utilities for readability
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;

import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";

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
 return <div className="ai-chat-panel" style={{position:"fixed",bottom:24,right:24,width:420,maxWidth:"95vw",height:550,maxHeight:"80vh",background:"var(--sc-card-a9)",backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",border:"1px solid var(--sc-w08)",borderRadius:20,boxShadow:"0 12px 48px rgba(0,0,0,.5)",zIndex:800,display:"flex",flexDirection:"column",animation:"slideInUp .3s ease",overflow:"hidden"}}>
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
