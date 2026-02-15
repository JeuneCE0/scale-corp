import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "../utils/index.jsx";
// Destructure commonly used utilities for readability
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;

import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "./ui.jsx";

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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <ObInp label="Site web" value={form.website} onChange={v=>up("website",v)} placeholder="https://..."/>
     <ObInp label="Date de création" type="date" value={form.foundedDate} onChange={v=>up("foundedDate",v)}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <ObInp label="Nom complet" required value={form.founderName} onChange={v=>up("founderName",v)} placeholder="Prénom Nom"/>
     <ObInp label="Rôle" required value={form.founderRole} onChange={v=>up("founderRole",v)} placeholder="Ex: CEO"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <ObInp label="Email" required type="email" value={form.founderEmail} onChange={v=>up("founderEmail",v)} placeholder="email@entreprise.com"/>
     <ObInp label="Téléphone" value={form.founderPhone} onChange={v=>up("founderPhone",v)} placeholder="+262 6..."/>
    </div>
    <div style={{fontSize:13,fontWeight:700,color:C.t,margin:"16px 0 8px"}}>Associé(e) <span style={{fontWeight:400,color:C.td,fontSize:11}}>(optionnel)</span></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <ObInp label="Nom" value={form.cofounderName} onChange={v=>up("cofounderName",v)} placeholder="Prénom Nom"/>
     <ObInp label="Rôle" value={form.cofounderRole} onChange={v=>up("cofounderRole",v)} placeholder="Ex: COO"/>
    </div>
   </div>;

   case 3:return <div>
    <div style={{padding:"11px 14px",borderRadius:9,background:C.accD,border:`1px solid ${C.acc}33`,marginBottom:18,fontSize:12,color:C.acc,lineHeight:1.5}}>
     <strong>📌</strong> "Photo de départ" dans l'incubateur — référence pour mesurer votre progression.
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
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
     ["📊","Métriques",<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,fontSize:11}}><span>CA : <strong>{form.currentMRR?`${Number(form.currentMRR).toLocaleString()}€`:"—"}</strong></span><span>Équipe : <strong>{form.teamSize||"—"}</strong></span><span>Stade : <strong>{form.fundingStage||"—"}</strong></span></div></>],
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
  <div style={{width:220,minHeight:"100vh",background:C.card,borderRight:`1px solid ${C.brd}`,padding:"28px 16px",display:"flex",flexDirection:"column"}}>
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
   <div ref={ref} style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
    <div style={{maxWidth:540,animation:anim?"none":"obSlide .3s cubic-bezier(.16,1,.3,1)"}}>{renderStep()}</div>
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
