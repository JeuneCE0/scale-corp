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


/* ═══════════════════════════ PULSE — Live Monitoring Dashboard ═══════════════════════════ */
export function PulseScreen({socs,reps,allM,ghlData,socBank,hold,clients,onClose}){
 const[now,setNow]=useState(new Date());
 const[refreshing,setRefreshing]=useState(false);
 const[toasts,setToasts]=useState([]);
 const[view,setView]=useState("global");
 const[socFilter,setSocFilter]=useState("all");
 const[timeFilter,setTimeFilter]=useState("mois");
 const[statusFilter,setStatusFilter]=useState("all");
 const[soundOn,setSoundOn]=useState(false);
 const[plusOnes,setPlusOnes]=useState([]);
 const[feedTypeFilter,setFeedTypeFilter]=useState("all");
 const[compareA,setCompareA]=useState(null);
 const[compareB,setCompareB]=useState(null);
 const[meteorActive,setMeteorActive]=useState(false);
 const[pulseRing,setPulseRing]=useState(false);
 const[animatedVals,setAnimatedVals]=useState({ca:0,pipeline:0,mrr:0});
 const prevDataRef=useRef(null);
 const prevProspRef=useRef({});
 const feedRef=useRef(null);
 const audioCtxRef=useRef(null);
 const prevFeedLen=useRef(0);

 useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);

 // Keyboard shortcuts
 useEffect(()=>{const h=e=>{
  if(e.key==="Escape")onClose();
  if(e.key==="f"||e.key==="F"){try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}catch{}}
  if(e.key==="m"||e.key==="M")setSoundOn(p=>!p);
  if(e.key==="r"||e.key==="R"){setRefreshing(true);setTimeout(()=>setRefreshing(false),1000);}
  const viewKeys={"1":"global","2":"pipeline","3":"activity"};
  if(viewKeys[e.key])setView(viewKeys[e.key]);
 };window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);

 const getAudioCtx=useCallback(()=>{if(!audioCtxRef.current)audioCtxRef.current=new(window.AudioContext||window.webkitAudioContext)();return audioCtxRef.current;},[]);
 const playDing=useCallback(()=>{if(!soundOn)return;try{const ctx=getAudioCtx();const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=1200;g.gain.value=0.15;o.start();g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.08);o.stop(ctx.currentTime+0.08);}catch{}},[soundOn,getAudioCtx]);
 const playCash=useCallback(()=>{if(!soundOn)return;try{const ctx=getAudioCtx();[880,1100].forEach(f=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=f;g.gain.value=0.12;o.start();g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.1);o.stop(ctx.currentTime+0.1);});}catch{}},[soundOn,getAudioCtx]);

 const addToast=useCallback((msg,color,soc)=>{const id=Date.now()+Math.random();setToasts(p=>[{id,msg,color,soc},...p].slice(0,3));setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),8000);},[]);
 const triggerMeteor=useCallback(()=>{setMeteorActive(true);setTimeout(()=>setMeteorActive(false),1500);},[]);
 const triggerPulseRing=useCallback(()=>{setPulseRing(true);setTimeout(()=>setPulseRing(false),1200);},[]);

 const sb=socBank||{};const gd=ghlData||{};
 const actS=useMemo(()=>{let s=(socs||[]).filter(s=>s.status!=="archived");if(statusFilter==="active")s=s.filter(x=>x.status==="active");else if(statusFilter==="lancement")s=s.filter(x=>x.status==="lancement");if(socFilter!=="all")s=s.filter(x=>x.id===socFilter);return s;},[socs,statusFilter,socFilter]);
 const allActS=(socs||[]).filter(s=>s.status!=="archived");

 const cM=curM();
 const prevMVal=useMemo(()=>{const d=new Date();d.setMonth(d.getMonth()-1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;},[]);

 const getProspects=(sid)=>{const g=gd[sid];if(!g)return[];return(g.opportunities||g.ghlClients||[]).filter(o=>o?.status==="open"||!o?.status);};
 const totalProspects=useMemo(()=>allActS.reduce((a,s)=>a+getProspects(s.id).length,0),[allActS,gd]);
 const todayStr=now.toISOString().slice(0,10);
 const yesterdayStr=useMemo(()=>{const d=new Date(now);d.setDate(d.getDate()-1);return d.toISOString().slice(0,10);},[now]);
 const prospectsToday=useMemo(()=>allActS.reduce((a,s)=>a+getProspects(s.id).filter(p=>(p.dateAdded||p.createdAt||"").slice(0,10)===todayStr).length,0),[allActS,gd,todayStr]);
 const prospectsYesterday=useMemo(()=>allActS.reduce((a,s)=>a+getProspects(s.id).filter(p=>(p.dateAdded||p.createdAt||"").slice(0,10)===yesterdayStr).length,0),[allActS,gd,yesterdayStr]);
 const deltaProspects=prospectsToday-prospectsYesterday;

 const totalCA=useMemo(()=>allActS.reduce((a,s)=>{const r=gr(reps,s.id,cM);return a+pf(r?.ca);},0),[allActS,reps,cM]);
 const prevCA=useMemo(()=>allActS.reduce((a,s)=>{const r=gr(reps,s.id,prevMVal);return a+pf(r?.ca);},0),[allActS,reps,prevMVal]);
 const totalPipeline=useMemo(()=>allActS.reduce((a,s)=>a+pf(gd[s.id]?.stats?.pipelineValue),0),[allActS,gd]);
 const totalMRR=useMemo(()=>allActS.reduce((a,s)=>{const r=gr(reps,s.id,cM);return a+pf(r?.mrr);},0),[allActS,reps,cM]);

 const totalWon=useMemo(()=>allActS.reduce((a,s)=>a+(gd[s.id]?.opportunities||[]).filter(o=>o?.status==="won").length,0),[allActS,gd]);
 const totalOpps=useMemo(()=>allActS.reduce((a,s)=>a+(gd[s.id]?.opportunities||[]).length,0),[allActS,gd]);
 const convRate=totalOpps>0?((totalWon/totalOpps)*100).toFixed(1):0;
 const avgDeal=totalWon>0?allActS.reduce((a,s)=>a+(gd[s.id]?.opportunities||[]).filter(o=>o?.status==="won").reduce((x,o)=>x+pf(o?.value),0),0)/totalWon:0;

 // Animated counters
 useEffect(()=>{const targets={ca:totalCA,pipeline:totalPipeline,mrr:totalMRR};const start=Date.now();const dur=1200;const anim=()=>{const t=Math.min((Date.now()-start)/dur,1);const ease=1-Math.pow(1-t,3);setAnimatedVals({ca:Math.round(targets.ca*ease),pipeline:Math.round(targets.pipeline*ease),mrr:Math.round(targets.mrr*ease)});if(t<1)requestAnimationFrame(anim);};requestAnimationFrame(anim);},[totalCA,totalPipeline,totalMRR]);

 // Today's payments
 const todayPayments=useMemo(()=>allActS.reduce((a,s)=>{return a+(sb[s.id]?.transactions||[]).filter(tx=>{const leg=tx.legs?.[0];return leg&&pf(leg.amount)>0&&(tx.created_at||tx.createdAt||"").slice(0,10)===todayStr;}).reduce((x,tx)=>x+pf(tx.legs?.[0]?.amount),0);},0),[allActS,sb,todayStr]);

 // Revenue vs expenses ratio
 const totalRevenues=useMemo(()=>allActS.reduce((a,s)=>{const r=gr(reps,s.id,cM);return a+pf(r?.ca);},0),[allActS,reps,cM]);
 const totalExpenses=useMemo(()=>allActS.reduce((a,s)=>{const r=gr(reps,s.id,cM);return a+pf(r?.charges);},0),[allActS,reps,cM]);

 // Business weather
 const bizWeather=useMemo(()=>{const score=totalCA>0&&prevCA>0?(totalCA/prevCA)*100:50;if(score>=120)return{emoji:"☀️",label:"Excellent",color:"#34d399"};if(score>=100)return{emoji:"🌤️",label:"Bien",color:"#60a5fa"};if(score>=80)return{emoji:"⛅",label:"Correct",color:"#FFAA00"};if(score>=60)return{emoji:"🌧️",label:"Attention",color:"#f87171"};return{emoji:"⛈️",label:"Critique",color:"#f87171"};},[totalCA,prevCA]);

 // Detect new prospects → +1 animation + sound
 useEffect(()=>{const cur={};allActS.forEach(s=>{cur[s.id]=getProspects(s.id).length;});const prev=prevProspRef.current;if(Object.keys(prev).length>0){allActS.forEach(s=>{const diff=(cur[s.id]||0)-(prev[s.id]||0);if(diff>0){playDing();triggerPulseRing();for(let i=0;i<diff;i++){const pid=Date.now()+Math.random();setPlusOnes(p=>[...p,{id:pid,socId:s.id}]);setTimeout(()=>setPlusOnes(p=>p.filter(x=>x.id!==pid)),1200);}addToast(`+${diff} prospect(s) — ${s?.name||""}`,`#60a5fa`,s);}});}prevProspRef.current=cur;},[gd]);

 // Detect new payments
 useEffect(()=>{const snap=JSON.stringify(Object.keys(sb).map(k=>(sb[k]?.transactions||[]).length));if(prevDataRef.current&&prevDataRef.current!==snap){playCash();triggerPulseRing();addToast("💰 Nouveau mouvement bancaire","#34d399");}prevDataRef.current=snap;},[sb]);

 // Detect won deals → meteor
 useEffect(()=>{const wonCount=allActS.reduce((a,s)=>a+(gd[s.id]?.opportunities||[]).filter(o=>o?.status==="won").length,0);if(prevDataRef.current&&wonCount>0)triggerMeteor();},[gd]);

 const socCards=useMemo(()=>actS.map(s=>{const r=gr(reps,s.id,cM);const rp=gr(reps,s.id,prevMVal);const ca=pf(r?.ca);const caP=pf(rp?.ca);const prosp=getProspects(s.id).length;const st=s.status==="active"?"🟢":s.status==="lancement"?"🟡":"🔴";const pipVal=pf(gd[s.id]?.stats?.pipelineValue);const lastAct=(sb[s.id]?.transactions||[])[0]?.createdAt||(gd[s.id]?.ghlClients||[])[0]?.dateAdded||"";const hs=healthScore(s,reps);return{id:s.id,name:s?.nom||s?.name||"",porteur:s?.porteur||"",status:st,statusRaw:s.status,ca,caP,prosp,trend:ca>caP?"↑":ca<caP?"↓":"→",bal:pf(sb[s.id]?.balance),pipVal,lastAct,logoUrl:s?.logoUrl||"",brandColor:s?.brandColor||"",color:s?.color||"#FFAA00",grade:hs.grade,gradeColor:hs.color,mrr:pf(r?.mrr)};}).sort((a,b)=>b.ca-a.ca),[actS,reps,cM,prevMVal,gd,sb]);

 const bestId=socCards[0]?.id;

 // Donut data
 const donutData=useMemo(()=>{const total=socCards.reduce((a,c)=>a+c.ca,0)||1;let cumPct=0;return socCards.filter(s=>s.ca>0).map(s=>{const pct=(s.ca/total)*100;const start=cumPct;cumPct+=pct;return{name:s.name,pct,start,color:s.brandColor||s.color||"#FFAA00"};});},[socCards]);
 const donutGradient=useMemo(()=>{if(donutData.length===0)return"conic-gradient(rgba(255,255,255,.1) 0% 100%)";return"conic-gradient("+donutData.map(d=>`${d.color} ${d.start}% ${d.start+d.pct}%`).join(",")+")";} ,[donutData]);

 const feed=useMemo(()=>{const items=[];allActS.forEach(s=>{const excl=EXCLUDED_ACCOUNTS[s.id]||[];(sb[s.id]?.transactions||[]).slice(0,10).forEach(tx=>{const leg=tx.legs?.[0];if(leg&&excl.includes(leg.account_id))return;const desc=leg?.description||tx?.reference||"Transaction";const amt=pf(leg?.amount||tx?.amount);const cat=autoCategorize(desc);const catLabel=cat!=="autre"?` [${cat}]`:"";items.push({ts:tx.created_at||tx.createdAt||"",icon:amt>0?"🤑":"🔻",desc:`${desc}${catLabel}`,amt,color:amt>0?"#34d399":"#f87171",socId:s.id,type:amt>0?"payment":"expense"});});(gd[s.id]?.opportunities||gd[s.id]?.ghlClients||[]).slice(0,5).forEach(c=>{const name=c?.contactName||c?.contact?.name||c?.name||c?.email||"Contact";const isWon=c?.status==="won";const isLost=c?.status==="lost";const icon=isWon?"✅":isLost?"❌":"👤";const label=isWon?"Deal gagné":isLost?"Deal perdu":"Nouveau prospect";items.push({ts:c.dateAdded||c.createdAt||c.updatedAt||"",icon,desc:`${label} - ${name}`,amt:isWon?pf(c?.value):0,color:isWon?"#34d399":isLost?"#f87171":"#60a5fa",socId:s.id,type:isWon?"won":isLost?"lost":"lead"});});(gd[s.id]?.calendarEvents||[]).slice(0,3).forEach(e=>{items.push({ts:e?.startTime||"",icon:"📞",desc:`Appel planifié - ${e?.title||e?.contactName||"RDV"}`,amt:0,color:"#a78bfa",socId:s.id,type:"call"});});});items.sort((a,b)=>new Date(b.ts)-new Date(a.ts));return items.slice(0,50);},[allActS,sb,gd]);

 // Auto-scroll feed on new items
 useEffect(()=>{if(feed.length>prevFeedLen.current&&feedRef.current){feedRef.current.scrollTop=0;}prevFeedLen.current=feed.length;},[feed.length]);

 const filteredFeed=useMemo(()=>feedTypeFilter==="all"?feed:feed.filter(f=>f.type===feedTypeFilter),[feed,feedTypeFilter]);

 const aiTickerItems=useMemo(()=>{const today=new Date().toISOString().slice(0,10);const items=[];let totalIn=0,totalOut=0;allActS.forEach(s=>{const sn=s?.nom||s?.name||"";const logo=s?.logoUrl||"";const color=s?.brandColor||s?.color||"#FFAA00";const opps=gd[s.id]?.opportunities||[];const newP=opps.filter(o=>!o.status&&(o.dateAdded||o.createdAt||"").slice(0,10)===today).length;const calls=(gd[s.id]?.calendarEvents||[]).filter(e=>(e?.startTime||"").slice(0,10)===today).length;const excl=EXCLUDED_ACCOUNTS[s.id]||[];let socIn=0,socOut=0;(sb[s.id]?.transactions||[]).filter(tx=>{const leg=tx.legs?.[0];if(leg&&excl.includes(leg.account_id))return false;return(tx.created_at||tx.createdAt||"").slice(0,10)===today;}).forEach(tx=>{const amt=pf(tx.legs?.[0]?.amount||tx?.amount);if(amt>0)socIn+=amt;else socOut+=Math.abs(amt);});totalIn+=socIn;totalOut+=socOut;const won=opps.filter(o=>o.status==="won"&&(o.updatedAt||"").slice(0,10)===today).length;const lost=opps.filter(o=>o.status==="lost"&&(o.updatedAt||"").slice(0,10)===today).length;const bits=[];if(newP>0)bits.push(`👤 +${newP} prospect${newP>1?"s":""}`);if(calls>0)bits.push(`📞 ${calls} appel${calls>1?"s":""}`);if(socIn>0)bits.push(`🤑 +${fmt(socIn)}€`);if(socOut>0)bits.push(`🔻 -${fmt(socOut)}€`);if(won>0)bits.push(`✅ ${won} deal gagné`);if(lost>0)bits.push(`❌ ${lost} deal perdu`);if(bits.length>0)items.push({sn,logo,color,text:bits.join(" · ")});});const margin=totalIn-totalOut;if(totalIn>0||totalOut>0)items.push({sn:"Global",logo:"",color:"#FFAA00",text:`📊 Solde : ${margin>=0?"+":""}${fmt(margin)}€`});return items;},[allActS,gd,sb]);

 const clock=(tz)=>{try{return now.toLocaleTimeString("fr-FR",{timeZone:tz,hour:"2-digit",minute:"2-digit",second:"2-digit"});}catch{return"--:--:--";}};
 const sparkline=(vals)=>{if(!vals||vals.length<2)return null;const mx=Math.max(...vals,1);const pts=vals.map((v,i)=>`${i*(60/(vals.length-1))},${28-v/mx*24}`).join(" ");return <svg width="60" height="28" style={{display:"block"}}><polyline points={pts} fill="none" stroke="#FFAA00" strokeWidth="1.5" opacity=".7"/></svg>;};
 const caHist=useMemo(()=>(allM||[]).slice(-7).map(m=>allActS.reduce((a,s)=>a+pf(gr(reps,s.id,m)?.ca),0)),[allM,allActS,reps]);
 const mrrHist=useMemo(()=>(allM||[]).slice(-7).map(m=>allActS.reduce((a,s)=>a+pf(gr(reps,s.id,m)?.mrr),0)),[allM,allActS,reps]);

 // Heatmap data: société × last 7 days
 const heatmapData=useMemo(()=>{const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d.toISOString().slice(0,10));}return{days,rows:allActS.map(s=>{const sn=s?.nom||s?.name||"";const cells=days.map(day=>{const txs=(sb[s.id]?.transactions||[]).filter(tx=>(tx.created_at||tx.createdAt||"").slice(0,10)===day);const amt=txs.reduce((a,tx)=>a+pf(tx.legs?.[0]?.amount),0);const leads=(gd[s.id]?.ghlClients||[]).filter(c=>(c.dateAdded||c.createdAt||"").slice(0,10)===day).length;const activity=amt/100+leads;return{day,amt,leads,activity};});return{id:s.id,name:sn,color:s?.color||"#FFAA00",cells};})  };},[allActS,sb,gd]);

 // Timeline data
 const timelineEvents=useMemo(()=>{const evts=[];allActS.forEach(s=>{const sn=s?.nom||s?.name||"";const col=s?.color||"#FFAA00";(gd[s.id]?.opportunities||[]).filter(o=>o?.status==="won").forEach(o=>{evts.push({ts:o.updatedAt||o.createdAt,type:"won",label:`Deal gagné — ${o.name||o.contact?.name||""}`,soc:sn,color:"#34d399",dotColor:col,amt:pf(o?.value)});});(gd[s.id]?.opportunities||[]).filter(o=>o?.status==="lost").forEach(o=>{evts.push({ts:o.updatedAt||o.createdAt,type:"lost",label:`Deal perdu — ${o.name||""}`,soc:sn,color:"#f87171",dotColor:col});});(sb[s.id]?.transactions||[]).slice(0,5).forEach(tx=>{const leg=tx.legs?.[0];if(leg&&pf(leg.amount)>0)evts.push({ts:tx.created_at||tx.createdAt,type:"payment",label:`Paiement — ${leg.description||tx.reference||""}`,soc:sn,color:"#34d399",dotColor:col,amt:pf(leg.amount)});});(gd[s.id]?.calendarEvents||[]).slice(0,3).forEach(e=>{evts.push({ts:e?.startTime,type:"call",label:`Appel — ${e?.title||"RDV"}`,soc:sn,color:"#a78bfa",dotColor:col});});});return evts.filter(e=>e.ts).sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,30);},[allActS,gd,sb]);

 const views=[{k:"global",l:"🌍 Global"},{k:"pipeline",l:"📊 Pipeline"},{k:"activity",l:"📡 Activité"}];
 const timeFilters=[{k:"1j",l:"1j"},{k:"7j",l:"7j"},{k:"30j",l:"30j"},{k:"mois",l:"Mois"}];

 const pill=(active,onClick,label)=><button key={label} onClick={onClick} style={{padding:"5px 14px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:active?"1px solid #FFAA00":"1px solid rgba(255,255,255,.1)",background:active?"rgba(255,170,0,.15)":"rgba(255,255,255,.04)",color:active?"#FFAA00":"#71717a",transition:"all .2s"}}>{label}</button>;

 const GC={background:"rgba(255,255,255,.04)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:20};
 const GCglow={...GC,animation:"card-glow 3s ease infinite"};
 const GChover={...GC,transition:"all .25s ease",cursor:"pointer"};

 const PULSE_CSS=`
  @keyframes pulse-glow{0%,100%{text-shadow:0 0 8px #FFAA00;}50%{text-shadow:0 0 24px #FFAA00,0 0 48px #FFAA0066;}}
  @keyframes slide-in{from{transform:translateX(120%);opacity:0;}to{transform:translateX(0);opacity:1;}}
  @keyframes ticker-scroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
  @keyframes count-up{from{opacity:.3;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  @keyframes card-glow{0%,100%{box-shadow:0 0 12px #FFAA0022;}50%{box-shadow:0 0 28px #FFAA0044,0 0 56px #FFAA0011;}}
  @keyframes globeRotate{0%{transform:translate(-50%,-50%) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(360deg)}}
  @keyframes plusOne{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-60px) scale(1.5)}}
  @keyframes activity-glow{0%,100%{border-color:rgba(255,170,0,.08)}50%{border-color:rgba(255,170,0,.3)}}
  @keyframes particle-float{0%{transform:translateY(100vh) translateX(0) scale(0);opacity:0}10%{opacity:1}90%{opacity:.6}100%{transform:translateY(-10vh) translateX(var(--px-drift)) scale(1);opacity:0}}
  @keyframes pulse-ring-anim{0%{transform:translate(-50%,-50%) scale(.8);opacity:.8;border-width:3px}100%{transform:translate(-50%,-50%) scale(1.5);opacity:0;border-width:1px}}
  @keyframes meteor-streak{0%{transform:translate(-100%,-100%) rotate(-35deg);opacity:1}100%{transform:translate(200vw,200vh) rotate(-35deg);opacity:0}}
  @keyframes breathing{0%,100%{opacity:.015}50%{opacity:.04}}
  @keyframes status-pulse{0%,100%{box-shadow:0 0 0 0 currentColor}50%{box-shadow:0 0 0 6px transparent}}
  @keyframes feed-flash{0%{background:rgba(255,170,0,.15)}100%{background:transparent}}
  @keyframes weather-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes donut-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes heatcell-pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
  .pulse-toast{animation:slide-in .4s ease;}
  .pulse-feed-item{animation:slide-in .3s ease;}
  .pulse-feed-new{animation:feed-flash .8s ease;}
  .pulse-plus1{animation:plusOne 1.2s ease forwards;position:absolute;top:-10px;right:10px;color:#60a5fa;font-weight:900;font-size:18px;pointer-events:none;z-index:10;}
  .pulse-card:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(255,170,0,.12)!important;border-color:rgba(255,170,0,.2)!important;}
  .pulse-particle{position:fixed;width:3px;height:3px;background:#FFAA00;border-radius:50%;pointer-events:none;z-index:0;animation:particle-float var(--px-dur) linear infinite;opacity:0;left:var(--px-left);animation-delay:var(--px-delay);}
 `;

 // Particles data (stable)
 const particles=useMemo(()=>Array.from({length:18},(_,i)=>({id:i,left:`${Math.random()*100}%`,dur:`${12+Math.random()*20}s`,delay:`${Math.random()*15}s`,drift:`${(Math.random()-0.5)*200}px`})),[]);

 const renderKPIs=()=><div style={{display:"flex",flexDirection:"column",gap:12,overflow:"auto"}}>
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>CA Total</div>
   <div style={{fontSize:32,fontWeight:900,color:"#FFAA00",fontFamily:FONT_TITLE}}>{fmt(animatedVals.ca)}€</div>
   <div style={{fontSize:10,color:totalCA>=prevCA?"#34d399":"#f87171",marginTop:4}}>{totalCA>=prevCA?"↑":"↓"} vs M-1 ({fmt(prevCA)}€)</div>
   {sparkline(caHist)}
  </div>
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Prospects</div>
   <div style={{fontSize:28,fontWeight:900,color:"#60a5fa",fontFamily:FONT_TITLE}}>{totalProspects}</div>
   <div style={{fontSize:10,color:deltaProspects>=0?"#34d399":"#f87171",marginTop:4}}>{deltaProspects>=0?"↑":"↓"} {deltaProspects>=0?"+":""}{deltaProspects} aujourd'hui (hier: {prospectsYesterday})</div>
  </div>
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Pipeline</div>
   <div style={{fontSize:24,fontWeight:900,color:"#a78bfa",fontFamily:FONT_TITLE}}>{fmt(animatedVals.pipeline)}€</div>
  </div>
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Conversion</div>
   <div style={{fontSize:22,fontWeight:900,color:"#34d399",fontFamily:FONT_TITLE}}>{convRate}%</div>
   <div style={{fontSize:10,color:"#71717a",marginTop:4}}>Deal moy: {fmt(avgDeal)}€</div>
  </div>
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>MRR</div>
   <div style={{fontSize:22,fontWeight:900,color:"#34d399",fontFamily:FONT_TITLE}}>{fmt(animatedVals.mrr)}€</div>
   {sparkline(mrrHist)}
  </div>
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Sociétés</div>
   <div style={{fontSize:22,fontWeight:900,color:"#e4e4e7",fontFamily:FONT_TITLE}}>{allActS.length}</div>
  </div>
  {/* Revenue vs Expenses bar */}
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Revenus / Dépenses</div>
   <div style={{height:12,borderRadius:6,overflow:"hidden",background:"rgba(255,255,255,.06)",display:"flex"}}>
    <div style={{width:`${totalRevenues+totalExpenses>0?(totalRevenues/(totalRevenues+totalExpenses))*100:50}%`,background:"#34d399",transition:"width .5s"}}/>
    <div style={{flex:1,background:"#f87171"}}/>
   </div>
   <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:9,color:"#71717a"}}><span style={{color:"#34d399"}}>{fK(totalRevenues)}€</span><span style={{color:"#f87171"}}>{fK(totalExpenses)}€</span></div>
  </div>
 </div>;

 const renderSocCards=()=><div className="rg-auto" style={{overflow:"auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12,alignContent:"start"}}>
  {/* Donut chart */}
  {view==="global"&&socCards.length>1&&<div style={{...GC,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gridColumn:"span 1"}}>
   <div style={{width:120,height:120,borderRadius:"50%",background:donutGradient,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:80,height:80,borderRadius:"50%",background:"#030308",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
     <div style={{fontSize:14,fontWeight:900,color:"#FFAA00",fontFamily:FONT_TITLE}}>{fmt(totalCA)}€</div>
     <div style={{fontSize:8,color:"#71717a"}}>CA Total</div>
    </div>
   </div>
   <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>{donutData.map(d=><span key={d.name} style={{fontSize:8,color:d.color}}>● {d.name}</span>)}</div>
  </div>}
  {socCards.map(s=><div key={s.id} className="pulse-card" onClick={()=>{setSocFilter(s.id);setView("detail");}} style={{...(s.id===bestId?GCglow:GChover),position:"relative"}}>
   {plusOnes.filter(p=>p.socId===s.id).map(p=><span key={p.id} className="pulse-plus1">+1</span>)}
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
     {/* Status pulsing dot */}
     <div style={{width:8,height:8,borderRadius:"50%",background:s.statusRaw==="active"?"#34d399":s.statusRaw==="lancement"?"#FFAA00":"#f87171",animation:"status-pulse 2s ease infinite",color:s.statusRaw==="active"?"#34d39944":s.statusRaw==="lancement"?"#FFAA0044":"#f8717144",flexShrink:0}}/>
     {s.logoUrl?<img src={s.logoUrl} alt="" style={{width:24,height:24,borderRadius:8,objectFit:"contain"}}/>:<div style={{width:24,height:24,borderRadius:8,background:(s.brandColor||s.color||"#FFAA00")+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:s.brandColor||s.color||"#FFAA00"}}>{(s.name||"?")[0]}</div>}
     <div style={{fontWeight:800,fontSize:13,fontFamily:FONT_TITLE,color:"#e4e4e7"}}>{s.name}</div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
     {/* Health score badge */}
     <span style={{fontSize:10,fontWeight:800,padding:"2px 6px",borderRadius:6,background:(s.gradeColor||"#71717a")+"22",color:s.gradeColor||"#71717a",fontFamily:FONT_TITLE}}>{s.grade}</span>
     <span style={{fontSize:16,color:s.trend==="↑"?"#34d399":s.trend==="↓"?"#f87171":"#71717a"}}>{s.trend}</span>
    </div>
   </div>
   {s.porteur&&<div style={{fontSize:10,color:"#71717a",marginBottom:6}}>👤 {s.porteur}</div>}
   <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
    <div><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>CA</div><div style={{fontSize:15,fontWeight:700,color:"#FFAA00"}}>{fK(s.ca)}€</div></div>
    <div><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>Prospects</div><div style={{fontSize:15,fontWeight:700,color:"#60a5fa"}}>{s.prosp}</div></div>
    <div><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>Pipeline</div><div style={{fontSize:13,fontWeight:600,color:"#a78bfa"}}>{fK(s.pipVal)}€</div></div>
    <div><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>Solde</div><div style={{fontSize:13,fontWeight:600,color:"#34d399"}}>{fK(s.bal)}€</div></div>
   </div>
   {s.lastAct&&<div style={{fontSize:9,color:"#71717a",marginTop:6}}>⏱ {ago(s.lastAct)}</div>}
   {sparkline(caHist)}
  </div>)}
 </div>;

 const feedTypeButtons=[{k:"all",l:"Tout",icon:"📡"},{k:"payment",l:"Paiements",icon:"💰"},{k:"lead",l:"Prospects",icon:"👤"},{k:"call",l:"Appels",icon:"📞"},{k:"won",l:"Gagnés",icon:"✅"},{k:"lost",l:"Perdus",icon:"❌"}];

 const renderFeed=(full)=><div style={{...GC,overflow:"hidden",display:"flex",flexDirection:"column",padding:0,...(full?{flex:1}:{})}}>
  <div style={{padding:"14px 16px 8px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
   <span style={{fontSize:11,fontWeight:700,color:"#FFAA00",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE}}>📡 Live Activity</span>
   <div style={{display:"flex",gap:4}}>{feedTypeButtons.map(b=><button key={b.k} onClick={()=>setFeedTypeFilter(b.k)} style={{padding:"2px 8px",borderRadius:10,fontSize:10,border:feedTypeFilter===b.k?"1px solid #FFAA00":"1px solid rgba(255,255,255,.06)",background:feedTypeFilter===b.k?"rgba(255,170,0,.12)":"transparent",color:feedTypeFilter===b.k?"#FFAA00":"#71717a",cursor:"pointer"}}>{b.icon}</button>)}</div>
  </div>
  <div ref={feedRef} style={{flex:1,overflow:"auto",padding:"8px 12px"}}>
   {filteredFeed.length===0&&<div style={{color:"#71717a",fontSize:11,textAlign:"center",padding:20}}>Aucune activité récente</div>}
   {filteredFeed.map((f,i)=><div key={i} className={`pulse-feed-item${i===0?" pulse-feed-new":""}`} style={{padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.03)",display:"flex",gap:8,alignItems:"flex-start",fontSize:11}}>
    {(()=>{const fs=allActS.find(x=>x.id===f.socId);return fs?.logoUrl?<img src={fs.logoUrl} alt="" style={{width:16,height:16,borderRadius:5,objectFit:"contain",flexShrink:0,marginTop:1}}/>:<div style={{width:16,height:16,borderRadius:5,background:(fs?.brandColor||fs?.color||f.color)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:fs?.brandColor||fs?.color||f.color,flexShrink:0,marginTop:1}}>{(fs?.nom||"?")[0]}</div>;})()}
    <span>{f.icon}</span>
    <div style={{flex:1}}>
     <div style={{color:"#e4e4e7",lineHeight:1.3}}>{f.desc}</div>
     <div style={{color:"#71717a",fontSize:9,marginTop:2}}>{f.ts?ago(f.ts):""}</div>
    </div>
    {f.amt?<span style={{color:f.color,fontWeight:700,whiteSpace:"nowrap"}}>{f.amt>0?"+":""}{fmt(f.amt)}€</span>:null}
   </div>)}
  </div>
 </div>;

 // Heatmap view
 const renderHeatmap=()=><div style={{flex:1,padding:16,overflow:"auto"}}>
  <div style={{...GC,overflowX:"auto"}}>
   <div style={{fontSize:12,fontWeight:800,color:"#FFAA00",fontFamily:FONT_TITLE,marginBottom:16}}>🗺️ HEATMAP ACTIVITÉ — 7 DERNIERS JOURS</div>
   <div style={{display:"grid",gridTemplateColumns:`120px repeat(${heatmapData.days.length},1fr)`,gap:4,alignItems:"center"}}>
    <div/>
    {heatmapData.days.map(d=><div key={d} style={{fontSize:9,color:"#71717a",textAlign:"center",fontFamily:"monospace"}}>{d.slice(5)}</div>)}
    {heatmapData.rows.map((row,ri)=><React.Fragment key={row.id}>
     <div style={{fontSize:11,color:"#e4e4e7",fontWeight:600,fontFamily:FONT_TITLE,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.name}</div>
     {row.cells.map((c,ci)=>{const maxAct=Math.max(...heatmapData.rows.flatMap(r=>r.cells.map(x=>x.activity)),1);const intensity=c.activity/maxAct;const bg=intensity>0.6?"#34d399":intensity>0.3?"#FFAA00":intensity>0?"#f8717188":"rgba(255,255,255,.04)";return <div key={ci} style={{width:"100%",aspectRatio:"1",borderRadius:4,background:bg,opacity:Math.max(0.2,intensity),animation:`heatcell-pop .3s ease ${(ri*7+ci)*0.03}s both`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:600}}>{c.amt>0?fK(c.amt):c.leads>0?c.leads:""}</div>;})}
    </React.Fragment>)}
   </div>
  </div>
 </div>;

 // Compare view
 const renderCompare=()=>{
  const opts=allActS.map(s=>({id:s.id,name:s?.nom||s?.name||""}));
  const a=socCards.find(s=>s.id===compareA)||socCards[0];
  const b=socCards.find(s=>s.id===compareB)||socCards[1];
  const metrics=[{k:"ca",l:"CA",color:"#FFAA00"},{k:"prosp",l:"Prospects",color:"#60a5fa"},{k:"pipVal",l:"Pipeline",color:"#a78bfa"},{k:"bal",l:"Solde",color:"#34d399"},{k:"mrr",l:"MRR",color:"#34d399"}];
  return <div style={{flex:1,padding:16,overflow:"auto"}}>
   <div style={{...GC}}>
    <div style={{fontSize:12,fontWeight:800,color:"#FFAA00",fontFamily:FONT_TITLE,marginBottom:16}}>⚖️ COMPARAISON</div>
    <div style={{display:"flex",gap:12,marginBottom:20}}>
     <select value={compareA||opts[0]?.id||""} onChange={e=>setCompareA(e.target.value)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#e4e4e7",padding:"6px 12px",fontSize:11,fontFamily:FONT}}>
      {opts.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
     </select>
     <span style={{color:"#FFAA00",fontWeight:900,alignSelf:"center"}}>VS</span>
     <select value={compareB||opts[1]?.id||""} onChange={e=>setCompareB(e.target.value)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#e4e4e7",padding:"6px 12px",fontSize:11,fontFamily:FONT}}>
      {opts.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
     </select>
    </div>
    {a&&b&&metrics.map(m=>{const va=a[m.k]||0;const vb=b[m.k]||0;const mx=Math.max(va,vb,1);return <div key={m.k} style={{marginBottom:14}}>
     <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:6}}>{m.l}</div>
     <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:11,color:"#e4e4e7",fontWeight:700,width:60,textAlign:"right"}}>{fK(va)}</span>
      <div style={{flex:1,height:16,borderRadius:8,background:"rgba(255,255,255,.04)",overflow:"hidden",display:"flex"}}>
       <div style={{width:`${(va/mx)*50}%`,background:m.color,borderRadius:"8px 0 0 8px",transition:"width .5s"}}/>
       <div style={{width:2,background:"#030308"}}/>
       <div style={{width:`${(vb/mx)*50}%`,background:m.color+"88",borderRadius:"0 8px 8px 0",transition:"width .5s",marginLeft:"auto"}}/>
      </div>
      <span style={{fontSize:11,color:"#e4e4e7",fontWeight:700,width:60}}>{fK(vb)}</span>
     </div>
     <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#71717a",marginTop:2}}><span>{a.name}</span><span>{b.name}</span></div>
    </div>;})}
   </div>
  </div>;
 };

 // Timeline view
 const renderTimeline=()=><div style={{flex:1,padding:16,overflow:"auto"}}>
  <div style={{...GC}}>
   <div style={{fontSize:12,fontWeight:800,color:"#FFAA00",fontFamily:FONT_TITLE,marginBottom:16}}>📅 TIMELINE</div>
   <div style={{position:"relative",paddingLeft:24}}>
    <div style={{position:"absolute",left:8,top:0,bottom:0,width:2,background:"rgba(255,170,0,.15)"}}/>
    {timelineEvents.map((ev,i)=><div key={i} style={{position:"relative",marginBottom:16,paddingLeft:20,animation:`slide-in .3s ease ${i*0.05}s both`}}>
     <div style={{position:"absolute",left:-4,top:4,width:12,height:12,borderRadius:"50%",background:ev.dotColor,border:"2px solid #030308",zIndex:1}}/>
     <div style={{fontSize:9,color:"#71717a",fontFamily:"monospace",marginBottom:2}}>{ev.ts?new Date(ev.ts).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):""}</div>
     <div style={{fontSize:12,color:"#e4e4e7",fontWeight:600}}>{ev.label}</div>
     <div style={{display:"flex",gap:8,marginTop:2}}>
      <span style={{fontSize:9,fontWeight:700,color:ev.color,background:ev.color+"18",padding:"1px 6px",borderRadius:4}}>{ev.soc}</span>
      {ev.amt?<span style={{fontSize:9,fontWeight:700,color:"#34d399"}}>+{fmt(ev.amt)}€</span>:null}
     </div>
    </div>)}
    {timelineEvents.length===0&&<div style={{color:"#71717a",fontSize:11,padding:20,textAlign:"center"}}>Aucun événement</div>}
   </div>
  </div>
 </div>;

 const renderMainContent=()=>{
  if(view==="activity")return <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr",gap:16,padding:16,overflow:"hidden",minHeight:0}}>{renderFeed(true)}</div>;
  if(view==="pipeline")return <div style={{flex:1,display:"grid",gridTemplateColumns:"280px 1fr",gap:16,padding:16,overflow:"hidden",minHeight:0}}>
   <div style={{display:"flex",flexDirection:"column",gap:12,overflow:"auto"}}>
    <div style={GC}><div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Total Prospects</div><div style={{fontSize:32,fontWeight:900,color:"#60a5fa",fontFamily:FONT_TITLE}}>{totalProspects}</div><div style={{fontSize:10,color:deltaProspects>=0?"#34d399":"#f87171",marginTop:4}}>{deltaProspects>=0?"+":""}{deltaProspects} aujourd'hui</div></div>
    <div style={GC}><div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Pipeline</div><div style={{fontSize:26,fontWeight:900,color:"#a78bfa",fontFamily:FONT_TITLE}}>{fmt(animatedVals.pipeline)}€</div></div>
    <div style={GC}><div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Conversion</div><div style={{fontSize:26,fontWeight:900,color:"#34d399",fontFamily:FONT_TITLE}}>{convRate}%</div><div style={{fontSize:10,color:"#71717a",marginTop:4}}>{totalWon} gagnés / {totalOpps} total • Moy: {fmt(avgDeal)}€</div></div>
   </div>
   {renderSocCards()}
  </div>;
  // default: global (also handles detail/finance/heatmap/compare/timeline fallback)
  return <div className="pulse-grid" style={{flex:1,display:"grid",gridTemplateColumns:"280px 1fr 300px",gap:16,padding:16,overflow:"hidden",minHeight:0}}>
   <div className="pulse-left">{renderKPIs()}</div>
   <div className="pulse-center">{renderSocCards()}</div>
   <div className="pulse-right">{renderFeed(false)}</div>
  </div>;
 };

 return <div style={{position:"fixed",inset:0,zIndex:9999,background:"#030308",fontFamily:FONT,color:"#e4e4e7",overflow:"hidden",display:"flex",flexDirection:"column"}}>
  <style>{PULSE_CSS}</style>
  {/* BREATHING GLOW */}
  <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 50%, rgba(255,170,0,.03), transparent 70%)",animation:"breathing 8s ease infinite",zIndex:0,pointerEvents:"none"}}/>
  {/* PARTICLES */}
  {particles.map(p=><div key={p.id} className="pulse-particle" style={{"--px-left":p.left,"--px-dur":p.dur,"--px-delay":p.delay,"--px-drift":p.drift}}/>)}
  {/* GLOBE */}
  <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle at 30% 30%, rgba(255,170,0,.08), transparent 60%)",border:"1px solid rgba(255,170,0,.05)",animation:"globeRotate 30s linear infinite",zIndex:0,opacity:.4}}/>
  <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:600,height:600,borderRadius:"50%",border:"1px solid rgba(255,170,0,.03)",animation:"globeRotate 45s linear infinite reverse",zIndex:0}}/>
  <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:500,height:500,borderRadius:"50%",border:"1px solid rgba(255,170,0,.04)",animation:"globeRotate 25s linear infinite",zIndex:0,clipPath:"ellipse(50% 20% at 50% 50%)"}}/>
  <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:500,height:500,borderRadius:"50%",border:"1px solid rgba(255,170,0,.04)",animation:"globeRotate 35s linear infinite reverse",zIndex:0,clipPath:"ellipse(20% 50% at 50% 50%)"}}/>
  <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:460,height:460,borderRadius:"50%",border:"1px solid rgba(255,170,0,.03)",animation:"globeRotate 20s linear infinite",zIndex:0,clipPath:"ellipse(50% 35% at 50% 50%)"}}/>
  {/* PULSE RING */}
  {pulseRing&&<div style={{position:"fixed",top:"50%",left:"50%",width:520,height:520,borderRadius:"50%",border:"2px solid #FFAA00",animation:"pulse-ring-anim 1.2s ease forwards",zIndex:0,pointerEvents:"none"}}/>}
  {/* METEOR */}
  {meteorActive&&<div style={{position:"fixed",top:0,left:0,width:200,height:2,background:"linear-gradient(90deg,transparent,#FFAA00,#fff,transparent)",animation:"meteor-streak 1.5s ease forwards",zIndex:10000,pointerEvents:"none",filter:"blur(1px)"}}/>}
  {/* TOASTS */}
  <div style={{position:"fixed",top:16,right:16,zIndex:10001,display:"flex",flexDirection:"column",gap:8}}>
   {toasts.map(t=><div key={t.id} className="pulse-toast" style={{padding:"10px 18px",borderRadius:10,background:t.color+"22",border:`1px solid ${t.color}44`,color:t.color,fontSize:12,fontWeight:600,backdropFilter:"blur(12px)",display:"flex",alignItems:"center",gap:8}}>{t.soc?(t.soc.logoUrl?<img src={t.soc.logoUrl} alt="" style={{width:18,height:18,borderRadius:6,objectFit:"contain"}}/>:<div style={{width:18,height:18,borderRadius:6,background:(t.soc.brandColor||t.soc.color||t.color)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:t.soc.brandColor||t.soc.color||t.color}}>{(t.soc.nom||t.soc.name||"?")[0]}</div>):null}{t.msg}</div>)}
  </div>
  {/* TOP BAR */}
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 24px",borderBottom:"1px solid rgba(255,255,255,.06)",flexShrink:0,zIndex:1,position:"relative"}}>
   <div style={{display:"flex",alignItems:"center",gap:10}}>
    <span style={{fontSize:22,animation:refreshing?"pulse-glow 1.5s ease infinite":"none",fontFamily:FONT_TITLE,fontWeight:900,color:"#FFAA00",letterSpacing:2}}>⚡ PULSE</span>
    {/* Today's payments badge */}
    {todayPayments>0&&<span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:10,background:"#34d39922",border:"1px solid #34d39944",color:"#34d399"}}>💰 +{fmt(todayPayments)}€ aujourd'hui</span>}
   </div>
   <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
    {views.map((v,i)=>pill(view===v.k,()=>setView(v.k),v.l))}
   </div>
   <div style={{display:"flex",alignItems:"center",gap:16}}>
    <button onClick={()=>setSoundOn(p=>!p)} style={{background:"none",border:"none",fontSize:16,cursor:"pointer",color:soundOn?"#FFAA00":"#71717a"}}>{soundOn?"🔊":"🔇"}</button>
    <div style={{display:"flex",gap:12,fontSize:11,fontFamily:"monospace",color:"#71717a"}}>
     <span>🇦🇪 {clock("Asia/Dubai")}</span><span>🇫🇷 {clock("Europe/Paris")}</span><span>🇹🇭 {clock("Asia/Bangkok")}</span>
    </div>
    <button onClick={onClose} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#71717a",fontSize:16,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
   </div>
  </div>
  {/* FILTER BAR */}
  <div style={{display:"flex",gap:8,padding:"6px 24px",borderBottom:"1px solid rgba(255,255,255,.04)",flexShrink:0,zIndex:1,position:"relative",alignItems:"center"}}>
   <select value={socFilter} onChange={e=>setSocFilter(e.target.value)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#e4e4e7",padding:"4px 10px",fontSize:11,fontFamily:FONT,cursor:"pointer"}}>
    <option value="all">Toutes les sociétés</option>
    {allActS.map(s=><option key={s.id} value={s.id}>{s?.nom||s?.name||s.id}</option>)}
   </select>
   <div style={{display:"flex",gap:4,marginLeft:8}}>
    {timeFilters.map(t=>pill(timeFilter===t.k,()=>setTimeFilter(t.k),t.l))}
   </div>
   <span style={{fontSize:9,color:"#71717a44",marginLeft:"auto"}}>1-3:vues M:son R:refresh</span>
  </div>
  {/* MAIN CONTENT */}
  {renderMainContent()}
  {/* BOTTOM AI TICKER */}
  <div style={{borderTop:"1px solid rgba(255,255,255,.06)",padding:"6px 0",overflow:"hidden",flexShrink:0,background:"rgba(255,170,0,.03)",zIndex:1,position:"relative"}}>
   <div style={{display:"flex",animation:"ticker-scroll 35s linear infinite",whiteSpace:"nowrap",alignItems:"center"}}>
    {[0,1].map(dup=><Fragment key={dup}>{aiTickerItems.map((t,i)=><span key={`${dup}-${i}`} style={{display:"inline-flex",alignItems:"center",gap:5,marginRight:32,fontSize:11,fontFamily:FONT,color:"#FFAA00"}}>
     {t.logo?<img src={t.logo} style={{width:14,height:14,borderRadius:3,objectFit:"cover",flexShrink:0}}/>:<span style={{width:14,height:14,borderRadius:3,background:t.color+"33",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:900,color:t.color,flexShrink:0}}>{(t.sn||"?")[0]}</span>}
     <span style={{fontWeight:700,color:"#e4e4e7"}}>{t.sn}</span>
     <span>{t.text}</span>
    </span>)}</Fragment>)}
   </div>
  </div>
 </div>;
}

/* ============ LIVE ACTIVITY FEED ============ */
/* ============ LIVE ACTIVITY FEED ============ */
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

/* ============ REPLAY MENSUEL ============ */
/* ============ PREDICTIONS & SCORING ============ */
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
 // Churn risk per client
 const churnRisks=useMemo(()=>{
  const bk=socBank?.[soc?.id];
  return activeCl.map(c=>{
   let risk=0;const cn=(c.name||"").toLowerCase().trim();
   // Days since last interaction
   const calEvts=gd?.calendarEvents||[];const lastCall=calEvts.filter(e=>(e.title||e.contactName||"").toLowerCase().includes(cn)).sort((a,b)=>new Date(b.startTime||0)-new Date(a.startTime||0))[0];
   const daysSinceInteraction=lastCall?Math.floor((Date.now()-new Date(lastCall.startTime).getTime())/864e5):30;
   if(daysSinceInteraction>30)risk+=40;else if(daysSinceInteraction>14)risk+=20;
   // Payment regularity
   const txs=(bk?.transactions||[]).filter(t=>{const leg=t.legs?.[0];return leg&&leg.amount>0&&(leg.description||t.reference||"").toLowerCase().includes(cn);});
   if(txs.length===0)risk+=30;else if(txs.length<3)risk+=10;
   // Engagement from commitment
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
    {churnRisks.slice(0,5).map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderBottom:`1px solid ${C.brd}08`}}>
     <span>{c.confidence}</span>
     <span style={{flex:1,fontSize:10,color:C.t}}>{c.name}</span>
     <span style={{fontSize:10,fontWeight:700,color:c.risk>50?C.r:c.risk>25?C.o:C.g}}>{c.risk}%</span>
    </div>)}
   </div>}
  </div>}
 </div>;
}

/* ============ CLIENT PORTAL ============ */
