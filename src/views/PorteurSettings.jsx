import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "../utils/index.jsx";
// Destructure commonly used utilities for readability
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;

import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";

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
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
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
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
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
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
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
