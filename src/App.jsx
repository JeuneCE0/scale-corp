import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment, createContext, useContext } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart } from "recharts";
const C_DARK={bg:"#06060b",card:"#0e0e16",card2:"#131320",brd:"#1a1a2c",brdL:"#24243a",acc:"#FFAA00",accD:"rgba(255,170,0,.12)",g:"#34d399",gD:"rgba(52,211,153,.1)",r:"#f87171",rD:"rgba(248,113,113,.1)",o:"#fb923c",oD:"rgba(251,146,60,.1)",b:"#60a5fa",bD:"rgba(96,165,250,.1)",t:"#e4e4e7",td:"#71717a",tm:"#3f3f50",v:"#a78bfa",vD:"rgba(167,139,250,.1)"};
const C_LIGHT={bg:"#f5f5f5",card:"#ffffff",card2:"#f0f0f0",brd:"#e0e0e0",brdL:"#d0d0d0",acc:"#FFAA00",accD:"#FFF3D6",g:"#22c55e",gD:"#dcfce7",r:"#ef4444",rD:"#fee2e2",b:"#3b82f6",bD:"#dbeafe",o:"#f97316",oD:"#fff7ed",v:"#8b5cf6",vD:"#ede9fe",t:"#1a1a1a",td:"#666666",tm:"#999999"};
let C=C_DARK;
function getTheme(){try{return localStorage.getItem("scTheme")||"dark";}catch{return"dark";}}
function applyTheme(t){try{localStorage.setItem("scTheme",t);}catch{}C=t==="light"?C_LIGHT:C_DARK;}
applyTheme(getTheme());
const MN=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const curM=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
const ml=k=>{if(!k)return"";const[y,m]=k.split("-");return`${MN[parseInt(m)-1]} ${y}`;};
const fmt=n=>new Intl.NumberFormat("fr-FR").format(Math.round(n||0));
const fK=n=>n>=1e3?`${(n/1e3).toFixed(1).replace(".0","")}K`:String(n);
const pct=(a,b)=>b?Math.round(a/b*100):0;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const prevM=m=>{const[y,mo]=m.split("-").map(Number);const d=new Date(y,mo-2,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
const nextM=m=>{const[y,mo]=m.split("-").map(Number);const d=new Date(y,mo,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
const pf=v=>parseFloat(v)||0;const gr=(reps,id,m)=>reps[`${id}_${m}`]||null;
const FONT="'Teachers',sans-serif";
const FONT_TITLE="'Eurostile','Square721 BT','Arial Black',sans-serif";
const BF={ca:"",charges:"",chargesOps:"",salaire:"",formation:"",clients:"",churn:"",pub:"",leads:"",leadsContact:"",leadsClos:"",notes:"",mrr:"",pipeline:"",tresoSoc:""};
const deadline=m=>{const[y,mo]=m.split("-").map(Number);return new Date(y,mo,5).toLocaleDateString("fr-FR",{day:"numeric",month:"long"});};
const qOf=m=>Math.ceil(parseInt(m.split("-")[1])/3);
const qMonths=m=>{const[y]=m.split("-").map(Number);const s=(qOf(m)-1)*3;return[0,1,2].map(i=>`${y}-${String(s+i+1).padStart(2,"0")}`);};
const qLabel=m=>`T${qOf(m)} ${m.split("-")[0]}`;
const ago=d=>{const s=Math.floor((Date.now()-new Date(d).getTime())/1e3);if(s<60)return"à l'instant";if(s<3600)return`il y a ${Math.floor(s/60)}min`;if(s<86400)return`il y a ${Math.floor(s/3600)}h`;return`il y a ${Math.floor(s/86400)}j`;};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
class ErrorBoundary extends React.Component{constructor(p){super(p);this.state={err:null};}static getDerivedStateFromError(e){return{err:e};}render(){if(this.state.err)return <div style={{padding:20,textAlign:"center",background:C.card,borderRadius:12,border:`1px solid ${C.brd}`}}><div style={{fontSize:28,marginBottom:8}}>⚠️</div><div style={{fontWeight:700,fontSize:13,marginBottom:4,color:C.t}}>{this.props.label||"Erreur"}</div><div style={{color:C.td,fontSize:11}}>{this.state.err.message}</div><button onClick={()=>this.setState({err:null})} style={{marginTop:10,padding:"6px 14px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,cursor:"pointer",fontSize:11}}>Réessayer</button></div>;return this.props.children;}}
const curW=()=>{const d=new Date();const jan1=new Date(d.getFullYear(),0,1);return`${d.getFullYear()}-W${String(Math.ceil(((d-jan1)/864e5+jan1.getDay()+1)/7)).padStart(2,"0")}`;};
const MOODS=["😫","😟","😐","🙂","🔥"];
const sinceLbl=d=>{if(!d)return"";const s=new Date(d),n=new Date();const m=(n.getFullYear()-s.getFullYear())*12+n.getMonth()-s.getMonth();if(m<1)return"Ce mois";if(m===1)return"1 mois";if(m<12)return`${m} mois`;const y=Math.floor(m/12),rm=m%12;return rm>0?`${y}a ${rm}m`:`${y} an${y>1?"s":""}`;};
const sinceMonths=d=>{if(!d)return 0;const s=new Date(d),n=new Date();return(n.getFullYear()-s.getFullYear())*12+n.getMonth()-s.getMonth();};
const CSS=`@import url('https://fonts.googleapis.com/css2?family=Teachers:wght@400;500;600;700;800;900&display=swap');\n*{box-sizing:border-box;margin:0;padding:0}body{margin:0;overflow-x:hidden}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp 0.5s ease forwards;opacity:0}
@keyframes barGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0}to{opacity:1}}@keyframes si{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes bg{from{width:0}to{width:var(--w,100%)}}
@keyframes mi{from{opacity:0;transform:scale(.95) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes sp{to{transform:rotate(360deg)}}@keyframes sh{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
@keyframes gl{0%,100%{border-color:rgba(255,170,0,.1)}50%{border-color:rgba(255,170,0,.35)}}
@keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes typing{0%{opacity:.2}20%{opacity:1}100%{opacity:.2}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes weatherPulse{0%,100%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.08);filter:brightness(1.2)}}
@keyframes shimmerKPI{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-12px);max-height:0}to{opacity:1;transform:translateY(0);max-height:200px}}
@keyframes barExpand{from{width:0%}to{width:var(--target-w,100%)}}
@keyframes fadeTab{from{opacity:0}to{opacity:1}}
@keyframes toastIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes toastOut{from{transform:translateX(0);opacity:1}to{transform:translateX(120%);opacity:0}}
@keyframes churnPulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(248,113,113,.4)}50%{opacity:.85;box-shadow:0 0 8px 2px rgba(248,113,113,.3)}}
@keyframes typingDots{0%{opacity:.2}20%{opacity:1}100%{opacity:.2}}
.typing-dots span{display:inline-block;width:6px;height:6px;border-radius:50%;background:${C.td};margin:0 2px;animation:typingDots 1.4s infinite both}
.typing-dots span:nth-child(2){animation-delay:.2s}
.typing-dots span:nth-child(3){animation-delay:.4s}
.tab-fade{animation:fadeTab .2s ease both}
.slide-down{animation:slideDown .3s ease both}
.kpi-shimmer:hover::after{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,transparent,rgba(255,170,0,.06),transparent);background-size:200% 100%;animation:shimmerKPI 1.5s ease infinite;pointer-events:none}
@keyframes celebIn{0%{opacity:0;transform:scale(.3) translateY(50px)}40%{transform:scale(1.1) translateY(-10px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(120vh) rotate(720deg);opacity:0}}
@keyframes celebGlow{0%,100%{box-shadow:0 0 20px rgba(255,170,0,.15)}50%{box-shadow:0 0 40px rgba(255,170,0,.4),0 0 80px rgba(255,170,0,.15)}}
@keyframes mglow{0%,100%{box-shadow:0 0 3px rgba(255,170,0,.2)}50%{box-shadow:0 0 10px rgba(255,170,0,.4)}}
.fu{animation:fu .35s ease both}.fi{animation:fi .25s ease both}.si{animation:si .3s ease both}
.d1{animation-delay:.03s}.d2{animation-delay:.06s}.d3{animation-delay:.09s}.d4{animation-delay:.12s}.d5{animation-delay:.15s}.d6{animation-delay:.18s}.d7{animation-delay:.21s}.d8{animation-delay:.24s}
.hv{transition:all .18s ease}.hv:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.25)}
.ba{transition:all .12s ease}.ba:hover{transform:translateY(-1px)}.ba:active{transform:scale(.97)}
.mi{animation:mi .25s cubic-bezier(.16,1,.3,1)}.gl{animation:gl 2.5s ease infinite}.fl{animation:fl 3s ease-in-out infinite}
.pg{animation:bg .5s cubic-bezier(.4,0,.2,1) both}
.dots span{animation:typing 1.4s infinite both}.dots span:nth-child(2){animation-delay:.2s}.dots span:nth-child(3){animation-delay:.4s}
@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideInUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes typeReveal{from{max-height:0;opacity:0}to{max-height:600px;opacity:1}}
@media(max-width:768px){.sidebar-desktop{display:none !important}.main-content{margin-left:0 !important}.mobile-header{display:flex !important}.kpi-grid-responsive{grid-template-columns:1fr 1fr !important}.chart-responsive{min-height:180px}.tx-list-mobile .tx-detail{display:none}}
@media(min-width:769px){.mobile-header{display:none !important}}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.brd};border-radius:3px}
input[type=range]{-webkit-appearance:none;background:${C.brd};height:3px;border-radius:4px;outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${C.acc};cursor:pointer;box-shadow:0 2px 6px rgba(255,170,0,.3)}
select{cursor:pointer}select:focus{border-color:${C.acc}44}
button:focus-visible{outline:2px solid ${C.acc}44;outline-offset:2px}
.glass-bg{background:#06060b;background-image:radial-gradient(at 20% 30%,rgba(255,170,0,.03) 0%,transparent 50%),radial-gradient(at 80% 70%,rgba(255,157,0,.02) 0%,transparent 50%),radial-gradient(at 50% 50%,rgba(96,165,250,.015) 0%,transparent 60%)}
.glass-card{background:rgba(14,14,22,.6);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.06);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.3);transition:all .3s cubic-bezier(.4,0,.2,1)}
.glass-card:hover{border-color:rgba(255,170,0,.15);transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
.glass-card-static{background:rgba(14,14,22,.6);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.06);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.3)}
.glass-sidebar{background:rgba(14,14,22,.75);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-right:1px solid rgba(255,255,255,.04)}
.glass-input{background:rgba(6,6,11,.6);border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:all .2s ease}
.glass-input:focus-within{border-color:rgba(255,170,0,.3);box-shadow:0 0 16px rgba(255,170,0,.08)}
.glass-modal{background:rgba(14,14,22,.85);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,.08);box-shadow:0 24px 64px rgba(0,0,0,.6)}
.glow-accent{box-shadow:0 0 20px rgba(255,170,0,.15)}
.glow-accent-strong{box-shadow:0 0 30px rgba(255,170,0,.25),0 4px 16px rgba(0,0,0,.3)}
.glass-btn-ghost{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.glass-btn-ghost:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12)}`;
const DS=[
 {id:"leadx",nom:"LEADX",porteur:"Dayyaan",act:"Media Buying",pT:"benefices",pP:30,stat:"active",color:"#FFAA00",pin:"1001",rec:true,obj:10000,objQ:28000,ghlKey:"",ghlLocationId:"BjQ4DxmWrLl3nCNcjmhE",revToken:"",revEnv:"sandbox",revolutCompany:"leadx",incub:"2025-06-01",slackId:""},
 {id:"copy",nom:"Copywriting",porteur:"Sol",act:"Copywriting",pT:"benefices",pP:20,stat:"active",color:"#60a5fa",pin:"1002",rec:false,obj:15000,objQ:42000,ghlKey:"",ghlLocationId:"2lB0paK192CFU1cLz5eT",revToken:"",revEnv:"sandbox",revolutCompany:"bcs",incub:"2025-03-15",slackId:""},
 {id:"bbp",nom:"BourbonBonsPlans",porteur:"Siméon",act:"Vidéo",pT:"benefices",pP:20,stat:"active",color:"#34d399",pin:"1003",rec:true,obj:8000,objQ:22000,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"2025-08-01",slackId:""},
 {id:"studio",nom:"Studio Branding",porteur:"Pablo",act:"Design",pT:"benefices",pP:20,stat:"active",color:"#fb923c",pin:"1004",rec:false,obj:5000,objQ:14000,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"2025-09-01",slackId:""},
 {id:"eco",nom:"L'Écosystème",porteur:"Scale Corp",act:"Consulting",pT:"ca",pP:100,stat:"active",color:"#a78bfa",pin:"admin",rec:false,obj:7000,objQ:20000,ghlKey:"",ghlLocationId:"NsV7HI2MbE6qHtRp410y",revToken:"",revEnv:"sandbox",revolutCompany:"eco",incub:"2024-01-01",slackId:""},
 {id:"padel",nom:"Padel Académie",porteur:"Louis",act:"Formation",pT:"benefices",pP:20,stat:"lancement",color:"#14b8a6",pin:"1005",rec:false,obj:3000,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"2026-01-15",slackId:""},
 {id:"iphone",nom:"Formation iPhone",porteur:"À définir",act:"Contenu",pT:"benefices",pP:20,stat:"lancement",color:"#8b5cf6",pin:"1006",rec:false,obj:0,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"2026-02-01",slackId:""},
 {id:"import",nom:"Import Auto",porteur:"À définir",act:"Import",pT:"benefices",pP:20,stat:"lancement",color:"#ec4899",pin:"1007",rec:false,obj:0,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"",slackId:""},
 {id:"tennis",nom:"Formation Tennis",porteur:"À définir",act:"Tennis",pT:"benefices",pP:20,stat:"signature",color:"#06b6d4",pin:"1008",rec:false,obj:0,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"",slackId:""},
 {id:"virale",nom:"Vidéo Virale",porteur:"À définir",act:"Vidéo",pT:"benefices",pP:20,stat:"signature",color:"#f43f5e",pin:"1009",rec:false,obj:0,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"",slackId:""},
 {id:"mindset",nom:"Coaching Mindset",porteur:"À définir",act:"Mindset",pT:"benefices",pP:20,stat:"signature",color:"#eab308",pin:"1010",rec:false,obj:0,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"",slackId:""},
];
const DH={logiciels:1200,equipe:300,service:500,cabinet:280,remun:3000,reservePct:30,crm:150,treso:2000,revolutToken:"",revolutEnv:"sandbox",slack:{enabled:false,mode:"bob",webhookUrl:"",botToken:"",channel:"",bobWebhook:"",notifyPulse:true,notifyReport:true,notifyValidation:true,notifyReminders:true},brand:{name:"L'INCUBATEUR ECS",sub:"Plateforme de pilotage",logoUrl:"/logo-ecs.png",logoLetter:"E",accentColor:"#FFAA00",gradientFrom:"#FFBF00",gradientTo:"#FF9D00"}};
const DEAL_STAGES=["Idée","Contact","Négociation","Due Diligence","Signature"];
function mkPrefill(){ return {}; }

function autoGenerateReport(socId, month, socBank, ghlData, subs){
 const sb=socBank?.[socId], gd=ghlData?.[socId];
 const monthly=sb?.monthly?.[month];
 const txns=(sb?.transactions||[]).filter(t=>{const d=t.created_at||t.date||"";return d.startsWith(month);});
 const sumTxns=(keywords)=>Math.abs(txns.filter(t=>{const desc=((t.description||"")+(t.reference||"")).toLowerCase();return keywords.some(k=>desc.includes(k))&&(t.legs?.[0]?.amount||0)<0;}).reduce((a,t)=>a+Math.abs(t.legs?.[0]?.amount||0),0));
 const ca=monthly?.income||0;
 const dividendesHolding=Math.round(Math.abs(txns.filter(t=>{const hasCpty=!!t.legs?.[0]?.counterparty;const single=(t.legs||[]).length===1;const legDesc=((t.legs?.[0]?.description||"")).toLowerCase();return((/dividend/i.test(t.reference||"")&&hasCpty&&single)||(/scale\s*corp/i.test(legDesc)&&hasCpty&&single))&&(t.legs?.[0]?.amount||0)<0;}).reduce((a,t)=>a+Math.abs(t.legs?.[0]?.amount||0),0)));
 const charges=Math.max(0,(monthly?.expense||0)-dividendesHolding);
 const chargesOps=Math.round(sumTxns(["abonnement","subscription","saas","hosting","heroku","vercel","aws","stripe fee"]));
 const salaire=Math.round(sumTxns(["salaire","salary","freelance","prestation"]));
 const pub=Math.round(sumTxns(["facebook","google ads","meta ads","tiktok","pub ","advertising","adwords"]));
 const formation=Math.round(sumTxns(["formation","training","skool","udemy","coursera"]));
 const clients=gd?.stats?.wonDeals||gd?.ghlClients?.filter(c=>c.status==="active")?.length||0;
 const leads=gd?.stats?.totalLeads||0;
 const pipeline=gd?.stats?.pipelineValue||0;
 const tresoSoc=sb?.balance||0;
 const activeClients=gd?.ghlClients?.filter(c=>c.status==="active")||[];
 const mrr=activeClients.reduce((a,c)=>{const b=c.billing;if(!b)return a;if(b.freq==="monthly")return a+pf(b.amount);if(b.freq==="annual")return a+pf(b.amount)/12;return a;},0);
 const prestataire=Math.round(sumTxns(["lucien","prestataire"]));
 return{ca:String(Math.round(ca)),charges:String(Math.round(charges)),prestataireAmount:String(prestataire),chargesOps:String(chargesOps),salaire:String(salaire),formation:String(formation),clients:String(clients),churn:"",pub:String(pub),leads:String(leads),leadsContact:"",leadsClos:String(gd?.stats?.wonDeals||0),notes:"Auto-généré depuis Revolut + GHL",mrr:String(Math.round(mrr)),pipeline:String(Math.round(pipeline)),tresoSoc:String(Math.round(tresoSoc)),dividendesHolding:String(dividendesHolding),ok:false,at:new Date().toISOString(),comment:"",_auto:true};
}
const DEMO_JOURNAL={};
const DEMO_ACTIONS=[];
const DEMO_PULSES={};
const DEMO_DEALS=[];
const curQ=()=>{const d=new Date();return`${d.getFullYear()}-Q${Math.ceil((d.getMonth()+1)/3)}`;};
const DEMO_OKRS=[];
const DEMO_SYNERGIES=[];
const SYN_TYPES={referral:{label:"Referral",icon:"🔗",color:C.b},collab:{label:"Collaboration",icon:"🤝",color:C.v},resource:{label:"Ressource partagée",icon:"📦",color:C.o}};
const SYN_STATUS={active:{label:"En cours",color:C.b},won:{label:"Gagné",color:C.g},lost:{label:"Perdu",color:C.r}};
const SUB_CATS={crm:{l:"CRM/Marketing",icon:"💻",c:C.v},design:{l:"Design",icon:"🎨",c:C.o},comms:{l:"Communication",icon:"💬",c:C.b},iadev:{l:"IA/Dev",icon:"🤖",c:C.g},productivite:{l:"Productivité",icon:"📊",c:C.acc},formation:{l:"Formation/Communauté",icon:"🎓",c:"#f59e0b"},paiement:{l:"Paiement",icon:"💳",c:C.r},abonnement:{l:"Abonnement",icon:"🔄",c:"#8b5cf6"},prestataire:{l:"Prestataire",icon:"👤",c:"#ec4899"},autre:{l:"Autre",icon:"📦",c:C.td}};
const AUTO_CAT_MAP=[
 [/gohighlevel|highlevel|hubspot|mailchimp|convertkit|activecampaign|brevo|sendinblue/i,"crm"],
 [/figma|canva|adobe|photoshop|illustrator|creative cloud/i,"design"],
 [/slack|zoom|google workspace|microsoft 365|microsoft|teams|twilio/i,"comms"],
 [/openai|anthropic|chatgpt|claude|github|vercel|aws|amazon web|heroku|netlify|railway|render/i,"iadev"],
 [/notion|zapier|make\.com|integromat|airtable|clickup|asana|monday/i,"productivite"],
 [/skool|teachable|kajabi|podia|thinkific|circle/i,"formation"],
 [/stripe|revolut|paypal|wise|mollie|gocardless/i,"paiement"],
 [/l.cosyst.me|lecosysteme/i,"abonnement"],
 [/lucien/i,"prestataire"],
];
function autoCategorize(name){for(const[rx,cat]of AUTO_CAT_MAP)if(rx.test(name))return cat;return"autre";}
function autoDetectSubscriptions(bankData,socId){
 if(!bankData?.transactions)return[];
 const excluded=EXCLUDED_ACCOUNTS[socId]||[];
 const txns=bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(excluded.includes(leg.account_id))return false;return leg.amount<0;});
 const byDesc={};
 txns.forEach(t=>{const desc=(t.reference||t.description||t.legs?.[0]?.description||"").trim();const amt=Math.abs(t.legs?.[0]?.amount||0);if(!desc||amt<1)return;const key=desc.toLowerCase().replace(/[^a-z0-9]/g,"");if(!byDesc[key])byDesc[key]={desc,amounts:[],dates:[],key};byDesc[key].amounts.push(Math.round(amt));byDesc[key].dates.push(new Date(t.created_at));});
 const subs=[];
 const KNOWN=[/gohighlevel|highlevel/i,/zapier/i,/slack/i,/notion/i,/stripe/i,/revolut/i,/adobe|creative cloud/i,/figma/i,/skool/i,/convertkit/i,/canva/i,/chatgpt|openai/i,/anthropic|claude/i,/google workspace|google storage/i,/microsoft/i,/aws|amazon web/i,/vercel/i,/github/i,/zoom/i,/hubspot/i,/mailchimp/i,/brevo/i,/heroku/i,/airtable/i,/make\.com/i,/clickup/i];
 Object.values(byDesc).forEach(g=>{
  const isKnown=KNOWN.some(rx=>rx.test(g.desc));
  const amtCounts={};g.amounts.forEach(a=>{amtCounts[a]=(amtCounts[a]||0)+1;});
  const topAmt=Object.entries(amtCounts).sort((a,b)=>b[1]-a[1])[0];
  const recurring=topAmt&&topAmt[1]>=2;
  if(!isKnown&&!recurring)return;
  const amount=parseInt(topAmt[0]);
  const months=g.dates.length;
  const spanMs=g.dates.length>1?Math.max(...g.dates)-Math.min(...g.dates):0;
  const spanMonths=spanMs/(1000*60*60*24*30);
  const freq=amount>500&&spanMonths>6?"annual":"monthly";
  subs.push({id:"auto_"+g.key,socId:socId==="all"?"holding":socId,name:g.desc,amount,freq,cat:autoCategorize(g.desc),start:g.dates.sort((a,b)=>a-b)[0].toISOString().slice(0,10),notes:`Auto-détecté (${months}x trouvé)`,auto:true});
 });
 return subs;
}
const DEMO_SUBS=[];
const DEMO_TEAM=[];
function subMonthly(sub){return sub.freq==="annual"?Math.round(sub.amount/12):sub.amount;}
const BILL_TYPES={
 fixed:{l:"Forfait fixe",icon:"💰",c:C.acc,desc:"Montant fixe mensuel avec ou sans engagement"},
 percent:{l:"% du CA/bénéfice",icon:"📊",c:C.v,desc:"Pourcentage sur le CA ou bénéfice généré"},
 hybrid:{l:"Fixe + %",icon:"💎",c:"#ec4899",desc:"Forfait fixe + pourcentage sur CA ou bénéfice"},
 oneoff:{l:"Prestation unique",icon:"🎯",c:C.b,desc:"Paiement unique (formation, accompagnement)"},
};
const CLIENT_STATUS={active:{l:"Actif",c:C.g,icon:"✓"},paused:{l:"En pause",c:C.o,icon:"⏸"},churned:{l:"Perdu",c:C.r,icon:"✗"},completed:{l:"Terminé",c:C.td,icon:"✓"},prospect:{l:"Prospect",c:C.b,icon:"◌"}};
const DEMO_CLIENTS=[];
function clientMonthlyRevenue(cl){
 const b=cl.billing;if(!b)return 0;
 if(b.type==="fixed"&&cl.status==="active")return Number(b.amount)||0;
 if(b.type==="percent"&&cl.status==="active"){
  const base=b.basis==="benefice"?Math.max(0,(cl.clientCA||0)-(cl.clientCharges||0)):(cl.clientCA||0);
  return Math.round(base*(b.percent||0)/100);
 }
 if(b.type==="hybrid"&&cl.status==="active"){
  const fixed=Number(b.amount)||0;
  const base=b.basis==="benefice"?Math.max(0,(cl.clientCA||0)-(cl.clientCharges||0)):(cl.clientCA||0);
  const pct=Math.round(base*(b.percent||0)/100);
  return fixed+pct;
 }
 return 0;
}
function clientTotalValue(cl){
 const b=cl.billing;if(!b)return 0;
 if(b.type==="oneoff")return Number(b.amount)||0;
 if(b.type==="fixed"){
  const months=b.commitment||1;
  return (Number(b.amount)||0)*months;
 }
 return clientMonthlyRevenue(cl)*12;
}
function commitmentEnd(cl){
 const b=cl.billing;if(!b||b.type!=="fixed"||!b.commitment||!b.startDate)return null;
 const d=new Date(b.startDate);d.setMonth(d.getMonth()+b.commitment);return d;
}
function commitmentRemaining(cl){
 const end=commitmentEnd(cl);if(!end)return null;
 const now=new Date();const m=Math.max(0,Math.round((end-now)/(30*864e5)));return m;
}
const INV_STATUS={
 draft:{l:"Brouillon",c:C.td,icon:"📝",bg:C.card2},
 sent:{l:"Envoyée",c:C.b,icon:"📤",bg:C.bD},
 paid:{l:"Payée",c:C.g,icon:"✅",bg:C.gD},
 overdue:{l:"En retard",c:C.r,icon:"⚠️",bg:C.rD},
 cancelled:{l:"Annulée",c:C.td,icon:"✗",bg:C.card2},
};
function generateInvoices(client,socName){
 const b=client.billing;if(!b)return[];
 const invs=[];const now=new Date();
 const baseNum=`${socName.replace(/\s/g,"").slice(0,4).toUpperCase()}-${now.getFullYear()}`;
 if(b.type==="fixed"&&b.commitment>0){
  const start=b.startDate?new Date(b.startDate):now;
  for(let i=0;i<b.commitment;i++){
   const due=new Date(start);due.setMonth(due.getMonth()+i);
   const monthLabel=due.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
   invs.push({
    id:uid(),clientId:client.id,socId:client.socId,
    number:`${baseNum}-${String(i+1).padStart(3,"0")}`,
    amount:b.amount,
    dueDate:due.toISOString().slice(0,10),
    status:due<now?"paid":"draft",
    description:`${b.freq==="monthly"?"Forfait mensuel":"Forfait annuel"} — ${monthLabel}`,
    ghlInvoiceId:"",createdAt:now.toISOString(),sentAt:"",paidAt:due<now?due.toISOString():"",
    installment:i+1,totalInstallments:b.commitment,
   });
  }
 } else if(b.type==="fixed"&&!b.commitment){
  const due=b.startDate?new Date(b.startDate):now;
  invs.push({
   id:uid(),clientId:client.id,socId:client.socId,
   number:`${baseNum}-001`,amount:b.amount,
   dueDate:due.toISOString().slice(0,10),status:"draft",
   description:`Forfait mensuel — ${due.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}`,
   ghlInvoiceId:"",createdAt:now.toISOString(),sentAt:"",paidAt:"",
   installment:1,totalInstallments:1,
  });
 } else if(b.type==="oneoff"){
  const nParts=b.installments||1;
  const partAmount=Math.round(b.amount/nParts);
  const start=b.paidDate?new Date(b.paidDate):now;
  for(let i=0;i<nParts;i++){
   const due=new Date(start);due.setMonth(due.getMonth()+i);
   invs.push({
    id:uid(),clientId:client.id,socId:client.socId,
    number:`${baseNum}-${String(i+1).padStart(3,"0")}`,
    amount:i===nParts-1?b.amount-partAmount*(nParts-1):partAmount,
    dueDate:due.toISOString().slice(0,10),
    status:i===0&&b.paidDate?"paid":"draft",
    description:nParts>1?`${b.product||"Prestation"} — Échéance ${i+1}/${nParts}`:`${b.product||"Prestation"}`,
    ghlInvoiceId:"",createdAt:now.toISOString(),sentAt:"",paidAt:i===0&&b.paidDate?b.paidDate:"",
    installment:i+1,totalInstallments:nParts,
   });
  }
 } else if(b.type==="percent"){
  const rev=clientMonthlyRevenue(client);
  if(rev>0){
   invs.push({
    id:uid(),clientId:client.id,socId:client.socId,
    number:`${baseNum}-001`,amount:rev,
    dueDate:now.toISOString().slice(0,10),status:"draft",
    description:`${b.percent}% ${b.basis==="benefice"?"du bénéfice":"du CA"} — ${now.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}`,
    ghlInvoiceId:"",createdAt:now.toISOString(),sentAt:"",paidAt:"",
    installment:1,totalInstallments:1,
   });
  }
 }
 return invs;
}
function refreshInvoiceStatuses(invoices){
 const today=new Date().toISOString().slice(0,10);
 return invoices.map(inv=>{
  if(inv.status==="sent"&&inv.dueDate<today)return{...inv,status:"overdue"};
  return inv;
 });
}
async function ghlCreateInvoice(apiKey,invoice,client){
 if(!apiKey)return null;
 try{
  const body={
   name:invoice.description,
   contactId:client.ghlId||"",
   dueDate:invoice.dueDate,
   items:[{name:invoice.description,amount:invoice.amount,qty:1}],
   status:"draft",
   currency:"EUR",
   businessDetails:{name:client.socId},
   invoiceNumber:invoice.number,
  };
  const r=await fetch(`${GHL_BASE}/invoices/`,{
   method:"POST",
   headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
   body:JSON.stringify(body)
  });
  if(!r.ok)throw new Error(`GHL ${r.status}`);
  const data=await r.json();
  return data.id||data.invoiceId||null;
 }catch(e){console.warn("GHL create invoice failed:",e.message);return null;}
}
async function ghlSendInvoice(apiKey,ghlInvoiceId){
 if(!apiKey||!ghlInvoiceId)return false;
 try{
  const r=await fetch(`${GHL_BASE}/invoices/${ghlInvoiceId}/send`,{
   method:"POST",
   headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
  });
  return r.ok;
 }catch(e){console.warn("GHL send invoice failed:",e.message);return false;}
}
function mkDemoInvoices(){ return []; }
function teamMonthly(tm,socCA){return tm.payType==="fixed"?tm.amount:Math.round((socCA||0)*tm.amount/100);}
function normalizeStr(s){return(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");}
function fuzzyMatch(a,b){
 const na=normalizeStr(a),nb=normalizeStr(b);
 if(!na||!nb)return 0;
 if(na===nb)return 1;
 if(na.includes(nb)||nb.includes(na))return .9;
 const ta=a.toLowerCase().split(/\s+/).filter(Boolean),tb=b.toLowerCase().split(/\s+/).filter(Boolean);
 const common=ta.filter(t=>tb.some(u=>u.includes(t)||t.includes(u)));
 return common.length/Math.max(ta.length,tb.length);
}
function matchSubsToRevolut(subs,socBankData,socId){
 if(!socBankData?.transactions)return subs.map(s=>({...s,revMatch:null}));
 const excluded=EXCLUDED_ACCOUNTS[socId]||[];
 const txns=socBankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(excluded.includes(leg.account_id))return false;return leg.amount<0;});
 return subs.map(sub=>{
  if(sub.socId!==socId&&sub.socId!=="holding")return{...sub,revMatch:null};
  const subName=sub.name;const subAmt=sub.amount;
  const matches=txns.filter(tx=>{
   const desc=tx.legs?.[0]?.description||tx.reference||tx.merchant?.name||"";
   const txAmt=Math.abs(tx.legs?.[0]?.amount||0);
   const nameSim=fuzzyMatch(subName,desc);
   const amtDiff=subAmt>0?Math.abs(txAmt-subAmt)/subAmt:1;
   return nameSim>=.5&&amtDiff<.3;
  }).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  if(matches.length===0)return{...sub,revMatch:null};
  const last=matches[0];
  const lastDate=new Date(last.created_at);
  const nextDate=new Date(lastDate);
  if(sub.freq==="annual")nextDate.setFullYear(nextDate.getFullYear()+1);
  else nextDate.setMonth(nextDate.getMonth()+1);
  return{...sub,revMatch:{
   txId:last.id,
   txDesc:last.legs?.[0]?.description||last.reference||"",
   txAmount:Math.abs(last.legs?.[0]?.amount||0),
   lastPayment:lastDate.toISOString(),
   nextPayment:nextDate.toISOString(),
   matchCount:matches.length,
   allTxIds:matches.map(m=>m.id),}};
 });
}
function deduplicatedCharges(totalChargesFromReport,matchedSubs){
 const matchedTotal=matchedSubs.filter(s=>s.revMatch).reduce((a,s)=>a+subMonthly(s),0);
 return{raw:totalChargesFromReport,matchedSubsTotal:matchedTotal,deduped:totalChargesFromReport,note:matchedTotal>0?`${fmt(matchedTotal)}€ d'abos déjà comptés dans Revolut`:""};
}
const KB_CATS={playbook:{label:"📘 Playbooks",color:C.b},template:{label:"📄 Templates",color:C.g},contact:{label:"👤 Contacts",color:C.o},tool:{label:"🔧 Outils",color:C.v},tip:{label:"💡 Tips",color:C.acc}};
const DEMO_KB=[
 {id:"kb1",title:"Playbook Cold Outreach B2B",cat:"playbook",author:"leadx",content:"1. Identifier ICP via LinkedIn Sales Nav\n2. Scraper avec Phantombuster\n3. Séquence 3 emails (J0, J3, J7)\n4. Follow-up LinkedIn J10\n5. Call si ouverture > 40%",tags:["prospection","b2b","email"],date:"2026-01-05",likes:3},
 {id:"kb2",title:"Template Proposition Commerciale",cat:"template",author:"copy",content:"Structure gagnante :\n• Contexte client (montrer qu'on a compris)\n• Problème identifié\n• Solution proposée (3 options)\n• Pricing avec ancrage\n• Garantie + urgence\n• CTA clair",tags:["vente","pricing","template"],date:"2026-01-12",likes:5},
 {id:"kb3",title:"Contact Imprimeur fiable",cat:"contact",author:"bbp",content:"Jean-Marc Dubois — Imprim'Express\njm@imprimexpress.re — 0692 XX XX XX\nTarifs compétitifs, délais 48h, livraison gratuite > 200€",tags:["print","fournisseur"],date:"2026-01-20",likes:2},
 {id:"kb4",title:"Stack Outils recommandée",cat:"tool",author:"eco",content:"• CRM: GoHighLevel (déjà intégré)\n• Compta: Pennylane\n• Design: Figma + Canva Pro\n• Vidéo: CapCut Pro + DaVinci\n• Emailing: Brevo\n• Analytics: Plausible\n• Paiement: Stripe + Revolut Business",tags:["outils","stack","setup"],date:"2025-12-15",likes:7},
 {id:"kb5",title:"Méthode pricing \"Value-Based\"",cat:"tip",author:"copy",content:"Ne jamais pricer au temps passé. Toujours pricer à la valeur créée.\n\nFormule : Prix = 10% de la valeur annuelle que tu génères pour le client.\n\nExemple : tu gères 50K€/an de pub → facture 5K€/mois minimum.",tags:["pricing","mindset"],date:"2026-02-01",likes:4},
 {id:"kb6",title:"Script Appel Découverte",cat:"playbook",author:"leadx",content:"Intro (2min) : Contexte, pourquoi cet appel\nDouleur (5min) : Quel est le plus gros frein à ta croissance ?\nImpact (3min) : Combien ça te coûte de ne rien faire ?\nSolution (5min) : Voici comment on résout ça\nClose (2min) : On démarre quand ?",tags:["vente","appel","closing"],date:"2026-02-08",likes:6},
];
const GHL_STAGES_COLORS=["#60a5fa","#FFAA00","#fb923c","#34d399","#a78bfa","#f43f5e","#14b8a6","#eab308"];
const GHL_BASE="/api/ghl";
function mkGHLDemo(){ return {}; }
async function ghlUpdateContact(locationId,contactId,data){return fetchGHL("contact_update",locationId,{contactId,data});}
async function ghlCreateContact(locationId,data){return fetchGHL("contact_create",locationId,{data});}
async function fetchGHL(action,locationId,params={}){
 try{
  const r=await fetch(GHL_BASE,{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({action,locationId,...params})
  });
  if(!r.ok)throw new Error(`GHL proxy ${r.status}`);return await r.json();
 }catch(e){console.warn("GHL fetch failed:",e.message);return null;}
}
async function syncGHLForSoc(soc){
 if(!soc.ghlLocationId)return null;
 const loc=soc.ghlLocationId;
 const pipData=await fetchGHL("pipelines",loc);
 if(!pipData||!pipData.pipelines)return null;
 const allPipelines=pipData.pipelines||[];
 if(allPipelines.length===0)return null;
 // Fetch opportunities for ALL pipelines
 let allMappedOpps=[];const allPipelinesMeta=[];
 for(const pip of allPipelines){
  const oppData2=await fetchGHL("opportunities",loc,{pipeline_id:pip.id});
  const opps2=(oppData2?.opportunities||[]).map(o=>({
   id:o.id,name:o.contact?.name||o.name||"Sans nom",stage:o.pipelineStageId,
   value:o.monetaryValue||0,email:o.contact?.email||"",phone:o.contact?.phone||"",
   createdAt:o.createdAt,updatedAt:o.updatedAt,status:o.status||"open",source:o.source||"Inconnu",
   pipelineId:pip.id,contact:o.contact
  }));
  const stages2=pip.stages?.map(s2=>s2.name)||[];
  const stageMap2={};pip.stages?.forEach(s2=>{stageMap2[s2.id]=s2.name;});
  const mapped2=opps2.map(o=>({...o,stage:stageMap2[o.stage]||o.stage}));
  allMappedOpps=allMappedOpps.concat(mapped2);
  allPipelinesMeta.push({id:pip.id,name:pip.name,stages:stages2});
 }
 const mappedOpps=allMappedOpps;
 const won=mappedOpps.filter(o=>o.status==="won");const open2=mappedOpps.filter(o=>o.status==="open");
 // Fetch contacts list
 const ctData=await fetchGHL("contacts_list",loc);
 const rawContacts=(ctData?.contacts||[]);
 // Build a map of contactId→opp status from opportunities
 const contactOppStatus={};
 allMappedOpps.forEach(o=>{
  const cid=o.contact?.id;if(!cid)return;
  if(o.status==="won")contactOppStatus[cid]="active";
  else if(o.status==="lost"&&!contactOppStatus[cid])contactOppStatus[cid]="churned";
  else if(!contactOppStatus[cid])contactOppStatus[cid]="prospect";
 });
 const ghlClients=rawContacts.map(c=>({
  id:`ghl_${c.id}`,socId:soc.id,name:c.contactName||[c.firstName,c.lastName].filter(Boolean).join(" ")||"Sans nom",
  contact:c.contactName||[c.firstName,c.lastName].filter(Boolean).join(" ")||"",
  email:c.email||"",phone:c.phone||"",company:c.companyName||"",
  billing:contactOppStatus[c.id]==="active"?{type:"fixed",amount:0,freq:"monthly",commitment:0,startDate:c.dateAdded?.slice(0,10)||""}:null,
  status:contactOppStatus[c.id]||"prospect",
  domain:((c.tags||[]).find(t=>t.startsWith("domaine:"))||"").replace("domaine:",""),
  source:c.source||"",notes:(c.tags||[]).filter(t=>!t.startsWith("domaine:")).join(", "),ghlId:c.id,stripeId:"",at:c.dateAdded||new Date().toISOString()
 }));
 // Fetch calendar events (calls)
 const evData=await fetchGHL("calendar_events",loc,{startTime:Date.now()-365*24*60*60*1000,endTime:Date.now()});
 const calEvents=evData?.events||[];
 return{
  pipelines:allPipelinesMeta,opportunities:mappedOpps,ghlClients,calendarEvents:calEvents,
  stats:{totalLeads:mappedOpps.length,openDeals:open2.length,wonDeals:won.length,
   lostDeals:mappedOpps.filter(o=>o.status==="lost").length,pipelineValue:open2.reduce((a,o)=>a+o.value,0),
   wonValue:won.reduce((a,o)=>a+o.value,0),conversionRate:mappedOpps.length>0?Math.round(won.length/mappedOpps.length*100):0,
   avgDealSize:mappedOpps.length>0?Math.round(mappedOpps.reduce((a,o)=>a+o.value,0)/mappedOpps.length):0,
   totalCalls:calEvents.length,
   callsByType:calEvents.reduce((acc,e)=>{const n=e.calendarName||"Autre";acc[n]=(acc[n]||0)+1;return acc;},{}),
   sourceBreakdown:[]},lastSync:new Date().toISOString(),isDemo:false
 };
}
const SLACK_MODES={
 webhook:{l:"Webhook",desc:"Incoming Webhook URL — simple, pas besoin d'app",icon:"🔗"},
 bot:{l:"Bot Token",desc:"Bot OAuth Token (xoxb-…) — plus de contrôle, peut tagger",icon:"🤖"},
 bob:{l:"Bob (Agent IA)",desc:"Via votre app Bob existante — webhook custom",icon:"🧠"},
};
async function slackWebhookSend(webhookUrl,message){
 if(!webhookUrl)return{ok:false,error:"no_webhook"};
 try{
  const r=await fetch(webhookUrl,{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify(message),
  });
  return{ok:r.ok,status:r.status};
 }catch(e){console.warn("Slack webhook failed:",e.message);return{ok:false,error:e.message};}
}
async function slackBotSend(botToken,channel,message){
 if(!botToken||!channel)return{ok:false,error:"no_bot_config"};
 try{
  const r=await fetch("https://slack.com/api/chat.postMessage",{
   method:"POST",
   headers:{"Authorization":`Bearer ${botToken}`,"Content-Type":"application/json"},
   body:JSON.stringify({channel,...message}),
  });
  const data=await r.json();
  return{ok:data.ok,error:data.error||null,ts:data.ts};
 }catch(e){console.warn("Slack bot failed:",e.message);return{ok:false,error:e.message};}
}
async function slackSend(slackConfig,message){
 if(!slackConfig)return{ok:false,error:"no_config"};
 const mode=slackConfig.mode||"webhook";
 if(mode==="bot"){
  return slackBotSend(slackConfig.botToken,slackConfig.channel,message);
 }
 const url=mode==="bob"?slackConfig.bobWebhook:slackConfig.webhookUrl;
 return slackWebhookSend(url,message);
}
function slackMention(soc){
 if(soc.slackId)return`<@${soc.slackId}>`;
 return`*${soc.porteur}*`;
}
function buildPulseSlackMsg(soc,pulse){
 const moodEmojis=["😫","😟","😐","🙂","🔥"];
 const confColors=["#e74c3c","#f39c12","#95a5a6","#3498db","#2ecc71"];
 return{
  text:`⚡ Pulse hebdo — ${soc.nom}`,
  blocks:[
   {type:"header",text:{type:"plain_text",text:`⚡ Pulse hebdo — ${soc.nom}`,emoji:true}},
   {type:"section",text:{type:"mrkdwn",text:`${slackMention(soc)} a envoyé son pulse`}},
   {type:"section",fields:[
    {type:"mrkdwn",text:`*Mood:* ${moodEmojis[pulse.mood]} (${pulse.mood+1}/5)`},
    {type:"mrkdwn",text:`*Confiance:* ${pulse.conf}/5`},
   ]},
   {type:"section",text:{type:"mrkdwn",text:`*🏆 Victoire:* ${pulse.win}`}},
   ...(pulse.blocker?[{type:"section",text:{type:"mrkdwn",text:`*🚧 Blocage:* ${pulse.blocker}`}}]:[]),
   {type:"context",elements:[{type:"mrkdwn",text:`📅 ${new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})} · ${soc.act}`}]},
  ],
 };
}
function buildReportSlackMsg(soc,report,mo){
 const ca=pf(report.ca),ch=pf(report.charges),marge=ca-ch;
 const margePct=ca>0?Math.round(marge/ca*100):0;
 return{
  text:`📊 Rapport ${ml(mo)} — ${soc.nom}`,
  blocks:[
   {type:"header",text:{type:"plain_text",text:`📊 Rapport mensuel — ${soc.nom}`,emoji:true}},
   {type:"section",text:{type:"mrkdwn",text:`${slackMention(soc)} a soumis son rapport pour *${ml(mo)}*`}},
   {type:"section",fields:[
    {type:"mrkdwn",text:`*💰 CA:* ${fmt(ca)}€`},
    {type:"mrkdwn",text:`*📉 Charges:* ${fmt(ch)}€${pf(report.dividendesHolding)>0?` (+ 🏛️ ${fmt(report.dividendesHolding)}€ dividendes)`:""}`},
    {type:"mrkdwn",text:`*📊 Marge:* ${fmt(marge)}€ (${margePct}%)`},
    ...(pf(report.pipeline)>0?[{type:"mrkdwn",text:`*🔮 Pipeline:* ${fmt(report.pipeline)}€`}]:[]),
    ...(pf(report.tresoSoc)>0?[{type:"mrkdwn",text:`*🏦 Tréso:* ${fmt(report.tresoSoc)}€`}]:[]),
    ...(pf(report.mrr)>0?[{type:"mrkdwn",text:`*🔄 MRR:* ${fmt(report.mrr)}€`}]:[]),
   ]},
   ...(pf(report.leads)>0?[{type:"section",text:{type:"mrkdwn",text:`*Funnel:* ${report.leads} leads → ${report.leadsContact} contactés → ${report.leadsClos} closés`}}]:[]),
   ...(report.notes?[{type:"section",text:{type:"mrkdwn",text:`*📝 Notes:* ${report.notes}`}}]:[]),
   {type:"context",elements:[{type:"mrkdwn",text:`Remontée théorique: *${fmt((soc.pT==="ca"?ca:Math.max(0,ca-pf(report.prestataireAmount)))*soc.pP/100)}€* (${soc.pP}% ${soc.pT==="ca"?"du CA":"CA hors presta"})${pf(report.prestataireAmount)>0?` · Presta: ${fmt(pf(report.prestataireAmount))}€`:""}${pf(report.dividendesHolding)>0?` · Déjà viré: ${fmt(pf(report.dividendesHolding))}€ · Reste: ${fmt(Math.max(0,(soc.pT==="ca"?ca:Math.max(0,ca-pf(report.prestataireAmount)))*soc.pP/100-pf(report.dividendesHolding)))}€`:""}`}]},
  ],
 };
}
function buildReminderSlackMsg(soc,type,deadlineStr){
 const isReport=type==="report";
 return{
  text:`${isReport?"📋":"⚡"} Rappel ${isReport?"rapport":"pulse"} — ${soc.nom}`,
  blocks:[
   {type:"section",text:{type:"mrkdwn",text:
    isReport
    ?`Hey ${slackMention(soc)} 👋 Ton rapport mensuel pour *${ml(curM())}* est attendu avant le *${deadlineStr}*. N'oublie pas de le soumettre sur la plateforme !`
    :`Hey ${slackMention(soc)} 👋 Ton pulse hebdo n'est pas encore envoyé. Un petit check de 30 secondes pour dire comment ça va cette semaine ?`}},
   {type:"context",elements:[{type:"mrkdwn",text:`🤖 Bob — Rappel automatique Scale Corp`}]},
  ],
 };
}
function buildValidationSlackMsg(soc,comment,mo){
 return{
  text:`✅ Rapport validé — ${soc.nom}`,
  blocks:[
   {type:"section",text:{type:"mrkdwn",text:`${slackMention(soc)} ✅ Ton rapport *${ml(mo)}* a été validé par Scale Corp !${comment?`\n💬 _"${comment}"_`:""}`}},
  ],
 };
}
async function checkAndSendReminders(socs2,reps2,pulses2,slackConfig){
 if(!slackConfig||!slackConfig.enabled)return[];
 const results=[];const now=new Date();const cM2=curM();const w=curW();
 const dayOfMonth=now.getDate();const dayOfWeek=now.getDay();
 for(const s of socs2.filter(x=>["active","lancement"].includes(x.stat)&&x.id!=="eco")){
  if(dayOfMonth<=3){
   const rep=gr(reps2,s.id,cM2);
   if(!rep||!rep.at){
    const r=await slackSend(slackConfig,buildReminderSlackMsg(s,"report",deadline(cM2)));
    results.push({soc:s.nom,type:"report_reminder",ok:r.ok});
   }
  }
  if(dayOfWeek===5){
   const p=pulses2[`${s.id}_${w}`];
   if(!p){
    const r=await slackSend(slackConfig,buildReminderSlackMsg(s,"pulse",""));
    results.push({soc:s.nom,type:"pulse_reminder",ok:r.ok});
   }
  }
 }
 return results;
}
/* STRIPE API */
const STRIPE_PROXY="/api/stripe";
async function fetchStripe(action,params={}){
 try{
  const r=await fetch(STRIPE_PROXY,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...params})});
  if(!r.ok)return null;return await r.json();
 }catch(e){console.warn("Stripe fetch failed:",e.message);return null;}
}
async function syncStripeData(){
 try{
  const[custRes,chargesRes,subsRes]=await Promise.all([
   fetchStripe("customers_list"),
   fetchStripe("charges_list"),
   fetchStripe("subscriptions_list"),
  ]);
  return{
   customers:custRes?.data||[],
   charges:chargesRes?.data||[],
   subscriptions:subsRes?.data||[],
   lastSync:new Date().toISOString(),
  };
 }catch(e){console.warn("Stripe sync failed:",e.message);return null;}
}
function getStripeChargesForClient(stripeData,client){
 if(!stripeData?.charges)return[];
 const email=(client?.email||"").toLowerCase().trim();
 if(!email)return[];
 // Build email map from customers
 const custEmails={};
 (stripeData.customers||[]).forEach(c=>{if(c.email)custEmails[c.id]=c.email.toLowerCase().trim();});
 return stripeData.charges.filter(ch=>{
  const billingEmail=(ch.billing_details?.email||"").toLowerCase().trim();
  const custEmail=ch.customer?custEmails[ch.customer]||"":"";
  return(billingEmail&&billingEmail===email)||(custEmail&&custEmail===email);
 });
}
function getStripeTotal(charges){
 return charges.filter(c=>c.status==="succeeded").reduce((a,c)=>a+Math.round((c.amount||0)/100),0);
}
const REV_ENVS={sandbox:"https://sandbox-b2b.revolut.com/api/1.0",production:"https://b2b.revolut.com/api/1.0"};
const CURR_SYMBOLS={EUR:"€",USD:"$",GBP:"£",CHF:"CHF",SEK:"kr",NOK:"kr",DKK:"kr",PLN:"zł",CZK:"Kč",HUF:"Ft",RON:"lei",BGN:"лв",HRK:"kn",AED:"AED",CAD:"CA$",AUD:"A$",JPY:"¥"};
function mkRevolutDemo(){ return null; }
async function fetchRevolut(company,endpoint){
 try{
  const action=endpoint.includes("/transactions")?"transactions":"accounts";
  const r=await fetch("/api/revolut",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,company})});
  if(!r.ok)throw new Error(`Revolut proxy ${r.status}`);return await r.json();
 }catch(e){console.warn("Revolut fetch failed:",e.message);return null;}
}
async function syncRevolut(company){
 if(!company)return null;
 const accounts=await fetchRevolut(company,"/accounts");
 if(!accounts)return null;
 const txns=await fetchRevolut(company,"/transactions?count=25");
 const accs=(Array.isArray(accounts)?accounts:[]).map(a=>({
  id:a.id,name:a.name||"Compte",balance:a.balance,currency:a.currency,state:a.state,updated_at:a.updated_at
 }));
 const totalEUR=accs.reduce((s,a)=>s+(a.currency==="EUR"?a.balance:a.balance*0.92),0);
 return{accounts:accs,transactions:Array.isArray(txns)?txns:[],totalEUR,lastSync:new Date().toISOString(),isDemo:false};
}
function mkSocRevDemo(){ return null; }
// Accounts to exclude from treasury per company (personal pockets, dividend transit, etc.)
const EXCLUDED_ACCOUNTS={
 leadx:["5c008ba9-b9a7-4141-97dc-6a53ef3d6646","5fce1497-811e-4266-9889-2da74aa27733"], // Dayyaan + SCALE CORP
 copy:["a1edf694-6f10-4b88-bfc1-7f2447f0fd8d","a86df684-33a0-413b-b56b-1e4fc2b13886"], // Sol + Anthony & Rudy (soc.id="copy" for BCS)
 eco:["a418f8cb-7001-40e8-acd3-e52f092294d4","39786a9f-7dd8-46e3-aba8-d8acca9e4bd7","fa4578d8-5d7f-4b9c-b2eb-afa01061d28e","88fb482e-26b3-494e-9234-5cded1b76799","d45a5ba7-cefa-4e21-85f9-cdafa6c60648","12440858-679f-4781-8db1-eb0ebbb986b3","f893a7c1-64b4-4247-9625-9f640d768b96","9f8f33c4-112f-44ad-81ea-a8acbca1efb7"], // Anthony, Dettes, Loyer, A-Loyer, Courses, Rudy, A-Courses, A-Loisirs
};
async function syncSocRevolut(soc){
 if(!soc.revolutCompany)return null;
 const accounts=await fetchRevolut(soc.revolutCompany,"/accounts");
 if(!accounts)return null;
 const now=new Date();const cm=curM();const pm=prevM(cm);
 const from1=new Date(now.getFullYear(),now.getMonth()-1,1).toISOString();
 const txnsRaw=await fetchRevolut(soc.revolutCompany,`/transactions?from=${from1}&count=500`);
 const txns=(Array.isArray(txnsRaw)?txnsRaw:[]).map(t=>{
  const dt=new Date(t.created_at);
  return{...t,month:`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`};
 });
 const excluded=EXCLUDED_ACCOUNTS[soc.id]||[];
 const accs=(Array.isArray(accounts)?accounts:[]).map(a=>({id:a.id,name:a.name||"Compte",balance:a.balance,currency:a.currency,state:a.state,excluded:excluded.includes(a.id)}));
 const balance=accs.filter(a=>!a.excluded).reduce((s,a)=>s+(a.currency==="EUR"?a.balance:a.balance*0.92),0);
 const monthly={};
 txns.forEach(tx=>{const m=tx.month;const leg=tx.legs?.[0];if(!leg)return;if(excluded.includes(leg.account_id))return;const amt=leg.amount;if(!monthly[m])monthly[m]={income:0,expense:0};if(amt>0)monthly[m].income+=amt;else monthly[m].expense+=Math.abs(amt);});
 Object.keys(monthly).forEach(m=>{monthly[m].income=Math.round(monthly[m].income);monthly[m].expense=Math.round(monthly[m].expense);});
 return{accounts:accs,transactions:txns.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)),balance:Math.round(balance),monthly,lastSync:new Date().toISOString(),isDemo:false};
}
function revFinancials(socBankData,month){
 if(!socBankData||!socBankData.monthly)return null;
 const m=socBankData.monthly[month];
 if(!m)return null;
 return{ca:m.income,charges:m.expense,tresoSoc:socBankData.balance,net:m.income-m.expense};
}
const STORE_URL="/api/store";
let _storeToken=null;
async function storeCall(action,key,value){
 try{
  if(!_storeToken){const m=localStorage.getItem("sc_store_token");if(m)_storeToken=m;}
  if(!_storeToken)return null;
  const r=await fetch(STORE_URL,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${_storeToken}`},body:JSON.stringify({action,key,value})});
  if(!r.ok)return null;return await r.json();
 }catch{return null;}
}
async function sGet(k){
 try{
  // Try localStorage first (fast)
  const ls=localStorage.getItem(k);const local=ls?JSON.parse(ls):null;
  // Then try backend (authoritative if available)
  const remote=await storeCall("get",k);
  if(remote?.value!==undefined&&remote.value!==null){
   // Sync remote to local
   localStorage.setItem(k,JSON.stringify(remote.value));
   return remote.value;
  }
  return local;
 }catch{try{const ls=localStorage.getItem(k);return ls?JSON.parse(ls):null;}catch{return null;}}
}
async function sSet(k,v){
 try{
  const s=JSON.stringify(v);
  localStorage.setItem(k,s);
  // Async push to backend (fire-and-forget)
  storeCall("set",k,v);
 }catch(e){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
}
function calcH(socs,reps,hold,month){
 let rem=0,cn=0;socs.forEach(s=>{if(s.id==="eco")return;if(["active","lancement"].includes(s.stat))cn++;const r=gr(reps,s.id,month);if(!r)return;const ca=pf(r.ca),presta=pf(r.prestataireAmount||0);rem+=(s.pT==="ca"?ca:Math.max(0,ca-presta))*s.pP/100;});
 const crm=cn*hold.crm,eR=gr(reps,"eco",month),eCa=eR?pf(eR.ca):0,tCh=hold.logiciels+hold.equipe+hold.service+hold.cabinet,eNet=eCa-tCh;
 const tIn=Math.max(0,eNet)+rem+crm,after=tIn-hold.remun,res=Math.max(0,after*hold.reservePct/100),dispo=Math.max(0,after-res);
 return{rem,crm,eNet,eCa,tCh,tIn,res,dispo,pf:hold.remun/2+dispo/2};
}
function simH(socs,simCA,hold){
 let rem=0,cn=0;socs.forEach(s=>{if(s.id==="eco")return;if(["active","lancement"].includes(s.stat))cn++;const ca=simCA[s.id]||0;const presta=ca*0.1;rem+=(s.pT==="ca"?ca:Math.max(0,ca-presta))*s.pP/100;});
 const crm=cn*hold.crm,eCa=simCA.eco||0,tCh=hold.logiciels+hold.equipe+hold.service+hold.cabinet,eNet=eCa-tCh;
 const tIn=Math.max(0,eNet)+rem+crm,after=tIn-hold.remun,res=Math.max(0,after*hold.reservePct/100),dispo=Math.max(0,after-res);
 return{rem,crm,eNet,eCa,tCh,tIn,res,dispo,pf:hold.remun/2+dispo/2};
}
function healthScore(s,reps){
 const c=curM(),p=prevM(c),r=gr(reps,s.id,c),rp=gr(reps,s.id,p);
 if(!r)return{grade:"—",color:C.tm,score:0,obj:0,growth:0,margin:0,retention:0};
 let pts=0;const ca=pf(r.ca),ch=pf(r.charges),marge=ca-ch;
 let objS=15,growS=12,margS=0,retS=0;
 if(s.obj>0){const op=pct(ca,s.obj);objS=op>=100?30:op>=80?20:op>=60?10:0;}pts+=objS;
 if(rp){const pca=pf(rp.ca);if(pca>0){const t=pct(ca-pca,pca);growS=t>=10?25:t>=0?15:t>=-10?8:0;}}pts+=growS;
 if(ca>0){const mp=pct(marge,ca);margS=mp>=30?25:mp>=15?18:mp>=0?10:0;}pts+=margS;
 const churnV=parseInt(r.churn||"0");retS=churnV===0?20:churnV===1?12:churnV<=2?5:0;pts+=retS;
 const grade=pts>=80?"A":pts>=60?"B":pts>=40?"C":"D";
 return{grade,color:{A:C.g,B:C.b,C:C.o,D:C.r}[grade],score:pts,obj:objS,growth:growS,margin:margS,retention:retS};
}
function qCA(reps,sid,month){return qMonths(month).reduce((a,m)=>a+pf(gr(reps,sid,m)?.ca),0);}
function getAlerts(socs,reps,hold){
 const a=[],c=curM(),p=prevM(c);
 socs.filter(s=>s.stat==="active").forEach(s=>{const r=gr(reps,s.id,c),rp=gr(reps,s.id,p);
  if(!r){a.push({t:"danger",m:`${s.nom} — rapport manquant`});return;}
  if(!r.ok)a.push({t:"info",m:`${s.nom} — en attente de validation`});
  const ca=pf(r.ca);if(s.obj>0&&ca<s.obj*.7)a.push({t:"danger",m:`${s.nom} — CA < 70% objectif`});
  if(rp){const cp=pf(rp.ca);if(cp>0&&ca<cp*.8)a.push({t:"danger",m:`${s.nom} — CA baisse ${pct(cp-ca,cp)}%`});}
  if(s.rec&&parseInt(r.churn||"0")>=2)a.push({t:"warn",m:`${s.nom} — ${r.churn} clients perdus`});
  const ts=pf(r.tresoSoc);if(ts>0&&ts<2000)a.push({t:"warn",m:`${s.nom} — tréso basse`});});
 return a.sort((x,y)=>({danger:0,warn:1,info:2}[x.t]-{danger:0,warn:1,info:2}[y.t]));
}
function buildFeed(socs,reps,actions,pulses){
 const items=[],c=curM(),p=prevM(c);
 [c,p].forEach(m=>{socs.forEach(s=>{const r=gr(reps,s.id,m);if(!r||!r.at)return;items.push({color:s.color,date:r.at,m:r.ok?`✓ ${s.nom} validé (${ml(m)})`:`${s.porteur} a soumis ${s.nom}`});});});
 actions.filter(a=>a.at).forEach(a=>{const s=socs.find(x=>x.id===a.socId);items.push({color:s?.color||C.td,date:a.at,m:a.done?`✓ Action: ${a.text}`:`→ Action: ${a.text}`});});
 Object.entries(pulses).forEach(([k,p2])=>{const sid=k.split("_")[0];const s=socs.find(x=>x.id===sid);if(s)items.push({color:s.color,date:p2.at,m:`${MOODS[p2.mood]} Pulse ${s.porteur}: "${p2.win}"`});});
 return items.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,20);
}
function project(reps,sid,allM){const data=allM.map(m=>pf(gr(reps,sid,m)?.ca)).filter(v=>v>0);if(data.length<2)return null;const l3=data.slice(-3);const avg=l3.reduce((a,v)=>a+v,0)/l3.length;const t=data.length>=2?(data[data.length-1]-data[data.length-2])/Math.max(1,data[data.length-2]):0;return[1,2,3].map(i=>Math.max(0,Math.round(avg*(1+t*i*.5))));}
function runway(reps,sid,allM){const data=allM.map(m=>{const r=gr(reps,sid,m);return r?{ch:pf(r.charges),ts:pf(r.tresoSoc)}:null;}).filter(Boolean);if(data.length<1)return null;const last=data[data.length-1];if(!last.ts||last.ts<=0)return null;const avgCh=data.reduce((a,d)=>a+d.ch,0)/data.length;if(avgCh<=0)return{months:99,treso:last.ts};return{months:Math.round(last.ts/avgCh),treso:last.ts};}
function calcLeaderboard(socs,reps,actions,pulses,allM){
 return socs.filter(s=>s.stat==="active"&&s.id!=="eco").map(s=>{
  let score=0;const hs=healthScore(s,reps);score+=hs.score;
  const reportsCount=allM.filter(m=>gr(reps,s.id,m)).length;score+=reportsCount*5;
  const doneActs=actions.filter(a=>a.socId===s.id&&a.done).length;score+=doneActs*10;
  const pulseCount=Object.keys(pulses).filter(k=>k.startsWith(s.id+"_")).length;score+=pulseCount*8;
  const streak=pulseCount;
  return{soc:s,score,hs,reportsCount,doneActs,pulseCount,streak};
 }).sort((a,b)=>b.score-a.score);
}
function buildAIContext(socs,reps,hold,actions,pulses,allM,revData,socBank,okrs,synergies,clients2){
 const cM2=curM();const hc=calcH(socs,reps,hold,cM2);
 const brandName=hold?.brand?.name||"Scale Corp";
 let ctx=`Tu es le co-pilote IA de ${brandName}, un incubateur/holding qui gère ${socs.length} sociétés. Réponds en français, sois concis et actionnable.\n\nDonnées actuelles (${ml(cM2)}):\n`;
 ctx+=`Holding: Flux entrant=${fmt(hc.tIn)}€, Disponible=${fmt(hc.dispo)}€, Par fondateur=${fmt(hc.pf)}€, Tréso déclarée=${fmt(hold.treso)}€\n`;
 if(revData&&revData.accounts){ctx+=`Banque Revolut Holding: Solde total=${fmt(revData.totalEUR)}€\n`;revData.accounts.forEach(a=>{ctx+=`  ${a.name}: ${fmt(a.balance)} ${a.currency}\n`;});}
 ctx+="\n";
 socs.filter(s=>s.stat==="active").forEach(s=>{
  const r=gr(reps,s.id,cM2),rp=gr(reps,s.id,prevM(cM2));
  const hs=healthScore(s,reps);const rw=runway(reps,s.id,allM);
  ctx+=`${s.nom} (${s.porteur}, ${s.act}${s.incub?`, incubé depuis ${sinceLbl(s.incub)}`:""}) — Grade ${hs.grade} (${hs.score}/100)\n`;
  if(r)ctx+=`  CA: ${fmt(r.ca)}€, Charges: ${fmt(r.charges)}€, Marge: ${fmt(pf(r.ca)-pf(r.charges))}€ (${pct(pf(r.ca)-pf(r.charges),pf(r.ca))}%)\n  Pipeline: ${fmt(r.pipeline)}€, Tréso: ${fmt(r.tresoSoc)}€${s.rec?`, MRR: ${fmt(r.mrr)}€, Churn: ${r.churn||0}`:""}\n`;
  if(r&&(pf(r.salaire)>0||pf(r.chargesOps)>0))ctx+=`  Détail: Rémun fondateur=${fmt(r.salaire)}€, Charges ops=${fmt(r.chargesOps)}€, Formation=${fmt(r.formation)}€, Pub=${fmt(r.pub)}€\n`;
  if(r&&pf(r.leads)>0)ctx+=`  Leads: ${r.leads} générés → ${r.leadsContact} contactés → ${r.leadsClos} closés (closing ${pct(pf(r.leadsClos),pf(r.leads))}%)\n`;
  const sb=socBank?.[s.id];
  if(sb){const bf=revFinancials(sb,cM2);ctx+=`  Banque Revolut: Solde=${fmt(sb.balance)}€`;if(bf)ctx+=`, Encaissé ce mois=${fmt(bf.ca)}€, Décaissé=${fmt(bf.charges)}€`;ctx+="\n";}
  if(rp)ctx+=`  Mois précédent: CA ${fmt(rp.ca)}€ (${pf(r?.ca)>=pf(rp.ca)?"↑":"↓"})\n`;
  if(rw)ctx+=`  Runway: ~${rw.months} mois\n`;
  const pw=Object.entries(pulses).filter(([k])=>k.startsWith(s.id+"_")).pop();
  if(pw)ctx+=`  Dernier pulse: ${MOODS[pw[1].mood]} — Win: "${pw[1].win}"${pw[1].blocker?` Blocage: "${pw[1].blocker}"`:""}\n`;
  const ms=calcMilestones(s,reps,actions,pulses,allM);const msU=ms.filter(m2=>m2.unlocked);
  if(msU.length>0){const top3=msU.sort((a2,b2)=>b2.tier-a2.tier).slice(0,3);ctx+=`  Milestones: ${msU.length}/${ms.length} — ${top3.map(m2=>m2.label).join(", ")}\n`;}
  const sCl=(clients2||[]).filter(c=>c.socId===s.id);
  if(sCl.length>0){const actCl=sCl.filter(c=>c.status==="active");const mrr=actCl.reduce((a2,c)=>a2+clientMonthlyRevenue(c),0);ctx+=`  Clients: ${actCl.length} actifs/${sCl.length} total, MRR clients=${fmt(mrr)}€\n`;
   const byT={fixed:sCl.filter(c=>c.billing?.type==="fixed"),percent:sCl.filter(c=>c.billing?.type==="percent"),hybrid:sCl.filter(c=>c.billing?.type==="hybrid"),oneoff:sCl.filter(c=>c.billing?.type==="oneoff")};
   if(byT.fixed.length>0)ctx+=`    Forfaits: ${byT.fixed.length} (${byT.fixed.filter(c=>c.status==="active").map(c=>`${c.name}:${fmt(c.billing?.amount||0)}€/m`).join(", ")})\n`;
   if(byT.percent.length>0)ctx+=`    % deals: ${byT.percent.length} (${byT.percent.filter(c=>c.status==="active").map(c=>`${c.name}:${c.billing?.percent}% ${c.billing?.basis}`).join(", ")})\n`;
   if(byT.oneoff.length>0)ctx+=`    One-off: ${byT.oneoff.length} · Total ${fmt(byT.oneoff.reduce((a2,c)=>a2+(c.billing?.amount||0),0))}€\n`;
  }
  ctx+="\n";
 });
 const openActs=actions.filter(a=>!a.done);
 if(openActs.length>0){ctx+=`Actions ouvertes:\n`;openActs.forEach(a=>{const s=socs.find(x=>x.id===a.socId);ctx+=`  - ${s?.nom||""}: ${a.text} (deadline: ${ml(a.deadline)}${a.deadline<cM2?" ⚠ EN RETARD":""})\n`;});}
 if(synergies&&synergies.length>0){ctx+=`\nSynergies inter-sociétés (${synergies.length}):\n`;const wonVal=synergies.filter(s=>s.status==="won").reduce((a,s)=>a+pf(s.value),0);ctx+=`  Valeur gagnée: ${fmt(wonVal)}€, En cours: ${synergies.filter(s=>s.status==="active").length}\n`;synergies.slice(-5).forEach(sy=>{const sf=socs.find(s=>s.id===sy.from);const st=socs.find(s=>s.id===sy.to);ctx+=`  ${sf?.nom||"?"} → ${st?.nom||"?"}: ${sy.desc} (${sy.status}${pf(sy.value)>0?`, ${fmt(sy.value)}€`:""})\n`;});}
 const sAlerts=calcSmartAlerts(socs,reps,actions,pulses,allM,{});
 if(sAlerts.length>0){ctx+=`\n⚠ Alertes (${sAlerts.length}):\n`;sAlerts.slice(0,8).forEach(a=>{ctx+=`  ${a.icon} ${a.title}: ${a.desc}\n`;});}
 return ctx;
}
/* MILESTONES ENGINE */
const MILESTONE_DEFS=[
 {id:"ca1k",cat:"ca",icon:"💰",label:"Premier 1 000€",desc:"1 000€ de CA cumulé",tier:1,check:(d)=>d.totalCA>=1000},
 {id:"ca5k",cat:"ca",icon:"💰",label:"Cap 5K",desc:"5 000€ de CA cumulé",tier:2,check:(d)=>d.totalCA>=5000},
 {id:"ca10k",cat:"ca",icon:"💰",label:"Cap 10K",desc:"10 000€ de CA cumulé",tier:3,check:(d)=>d.totalCA>=10000},
 {id:"ca25k",cat:"ca",icon:"🔥",label:"Cap 25K",desc:"25 000€ de CA cumulé",tier:4,check:(d)=>d.totalCA>=25000},
 {id:"ca50k",cat:"ca",icon:"🔥",label:"Cap 50K",desc:"50 000€ de CA cumulé",tier:5,check:(d)=>d.totalCA>=50000},
 {id:"ca100k",cat:"ca",icon:"👑",label:"Club 100K",desc:"100 000€ de CA cumulé",tier:6,check:(d)=>d.totalCA>=100000},
 {id:"anc1m",cat:"time",icon:"🌱",label:"Premier mois",desc:"1 mois dans l'incubateur",tier:1,check:(d)=>d.incubMonths>=1},
 {id:"anc3m",cat:"time",icon:"🌿",label:"Trimestre",desc:"3 mois d'association",tier:2,check:(d)=>d.incubMonths>=3},
 {id:"anc6m",cat:"time",icon:"🌳",label:"Semestre",desc:"6 mois côte à côte",tier:3,check:(d)=>d.incubMonths>=6},
 {id:"anc12m",cat:"time",icon:"🏛️",label:"1 an",desc:"Un an d'incubation !",tier:4,check:(d)=>d.incubMonths>=12},
 {id:"anc24m",cat:"time",icon:"⭐",label:"Vétéran",desc:"2 ans d'incubation",tier:5,check:(d)=>d.incubMonths>=24},
 {id:"grow2",cat:"growth",icon:"📈",label:"Décollage",desc:"2 mois consécutifs de croissance",tier:1,check:(d)=>d.growthStreak>=2},
 {id:"grow3",cat:"growth",icon:"📈",label:"Tendance",desc:"3 mois consécutifs de croissance",tier:2,check:(d)=>d.growthStreak>=3},
 {id:"grow5",cat:"growth",icon:"🚀",label:"Fusée",desc:"5 mois consécutifs de croissance",tier:3,check:(d)=>d.growthStreak>=5},
 {id:"grow10",cat:"growth",icon:"🌟",label:"Inarrêtable",desc:"10 mois de croissance d'affilée",tier:5,check:(d)=>d.growthStreak>=10},
 {id:"prof1",cat:"profit",icon:"💎",label:"Dans le vert",desc:"Premier mois rentable",tier:1,check:(d)=>d.profitableMonths>=1},
 {id:"prof3",cat:"profit",icon:"💎",label:"Stabilité",desc:"3 mois rentables au total",tier:2,check:(d)=>d.profitableMonths>=3},
 {id:"prof50",cat:"profit",icon:"💎",label:"Machine à marge",desc:"Un mois à 50%+ de marge",tier:3,check:(d)=>d.bestMarginPct>=50},
 {id:"profstr3",cat:"profit",icon:"🏆",label:"Série verte",desc:"3 mois rentables d'affilée",tier:4,check:(d)=>d.profitStreak>=3},
 {id:"rep3",cat:"engage",icon:"📊",label:"Régulier",desc:"3 rapports soumis",tier:1,check:(d)=>d.reportsCount>=3},
 {id:"rep6",cat:"engage",icon:"📊",label:"Fiable",desc:"6 rapports soumis",tier:2,check:(d)=>d.reportsCount>=6},
 {id:"rep12",cat:"engage",icon:"📊",label:"Exemplaire",desc:"12 rapports soumis — 1 an complet",tier:3,check:(d)=>d.reportsCount>=12},
 {id:"pul4",cat:"engage",icon:"⚡",label:"Connecté",desc:"4 pulses envoyés",tier:1,check:(d)=>d.pulseCount>=4},
 {id:"pul12",cat:"engage",icon:"⚡",label:"Pulse master",desc:"12 pulses envoyés — 3 mois non-stop",tier:3,check:(d)=>d.pulseCount>=12},
 {id:"act5",cat:"engage",icon:"✅",label:"Exécutant",desc:"5 actions complétées",tier:2,check:(d)=>d.doneActions>=5},
 {id:"act15",cat:"engage",icon:"✅",label:"Machine",desc:"15 actions complétées",tier:4,check:(d)=>d.doneActions>=15},
 {id:"gradeA",cat:"grade",icon:"⭐",label:"Grade A",desc:"Atteindre le grade A",tier:3,check:(d)=>d.bestGrade==="A"},
 {id:"gradeA3",cat:"grade",icon:"🌟",label:"A constant",desc:"3 mois en grade A consécutifs",tier:5,check:(d)=>d.gradeAStreak>=3},
 {id:"pip10k",cat:"pipeline",icon:"🎯",label:"Pipeline 10K",desc:"Atteindre 10K€ de pipeline",tier:2,check:(d)=>d.bestPipeline>=10000},
 {id:"pip25k",cat:"pipeline",icon:"🎯",label:"Pipeline 25K",desc:"Pipeline à 25K€",tier:3,check:(d)=>d.bestPipeline>=25000},
 {id:"pip50k",cat:"pipeline",icon:"🎯",label:"Pipeline 50K",desc:"Pipeline à 50K€ — gros joueur",tier:4,check:(d)=>d.bestPipeline>=50000},
 {id:"tres5k",cat:"tresor",icon:"🏦",label:"Coussin 5K",desc:"5 000€ de trésorerie",tier:2,check:(d)=>d.bestTreso>=5000},
 {id:"tres10k",cat:"tresor",icon:"🏦",label:"Coussin 10K",desc:"10 000€ en réserve",tier:3,check:(d)=>d.bestTreso>=10000},
 {id:"tres25k",cat:"tresor",icon:"🏦",label:"Coffre-fort",desc:"25 000€ de trésorerie",tier:4,check:(d)=>d.bestTreso>=25000},
 {id:"best5k",cat:"record",icon:"🏅",label:"Best month 5K",desc:"Un mois à 5 000€+ de CA",tier:2,check:(d)=>d.bestCA>=5000},
 {id:"best10k",cat:"record",icon:"🏅",label:"Best month 10K",desc:"Un mois à 10 000€+ de CA",tier:3,check:(d)=>d.bestCA>=10000},
 {id:"best25k",cat:"record",icon:"🥇",label:"Best month 25K",desc:"Un mois à 25 000€+ de CA",tier:5,check:(d)=>d.bestCA>=25000},
 {id:"double",cat:"record",icon:"⚡",label:"Doublé",desc:"Doubler le CA d'un mois sur l'autre",tier:3,check:(d)=>d.hasDoubled},
];
const MILESTONE_CATS={ca:"🏆 Chiffre d'affaires",time:"📅 Ancienneté",growth:"📈 Croissance",profit:"💎 Rentabilité",engage:"📊 Engagement",grade:"⭐ Excellence",pipeline:"🎯 Pipeline",tresor:"🏦 Trésorerie",record:"🏅 Records"};
const TIER_COLORS={1:C.td,2:C.b,3:C.g,4:C.acc,5:"#c084fc",6:"#fbbf24"};
const TIER_BG={1:C.card2,2:C.bD,3:C.gD,4:C.accD,5:"rgba(192,132,252,.1)",6:"rgba(251,191,36,.12)"};
function calcMilestoneData(soc,reps,actions,pulses,allM){
 const months=allM.map(m=>{const r=gr(reps,soc.id,m);if(!r)return null;return{m,ca:pf(r.ca),ch:pf(r.charges),mrr:pf(r.mrr),pipeline:pf(r.pipeline),treso:pf(r.tresoSoc)};}).filter(Boolean);
 const totalCA=months.reduce((a,d)=>a+d.ca,0);
 const bestCA=months.reduce((a,d)=>Math.max(a,d.ca),0);
 const bestPipeline=months.reduce((a,d)=>Math.max(a,d.pipeline),0);
 const bestTreso=months.reduce((a,d)=>Math.max(a,d.treso),0);
 const incubMonths=sinceMonths(soc.incub);
 let growthStreak=0,maxGrowth=0;
 for(let i=1;i<months.length;i++){if(months[i].ca>months[i-1].ca){growthStreak++;maxGrowth=Math.max(maxGrowth,growthStreak);}else growthStreak=0;}
 maxGrowth=Math.max(maxGrowth,growthStreak);
 const profMonths=months.filter(d=>d.ca-d.ch>0);
 const profitableMonths=profMonths.length;
 const bestMarginPct=months.reduce((a,d)=>d.ca>0?Math.max(a,Math.round((d.ca-d.ch)/d.ca*100)):a,0);
 let profitStreak=0,maxProfStreak=0;
 for(const d of months){if(d.ca-d.ch>0){profitStreak++;maxProfStreak=Math.max(maxProfStreak,profitStreak);}else profitStreak=0;}
 const reportsCount=months.length;
 const pulseCount=Object.keys(pulses).filter(k=>k.startsWith(soc.id+"_")).length;
 const doneActions=actions.filter(a=>a.socId===soc.id&&a.done).length;
 const hs=healthScore(soc,reps);
 const bestGrade=hs.grade;
 let gradeAStreak=0;
 for(let i=allM.length-1;i>=0;i--){const tmpReps={...reps};const r=gr(reps,soc.id,allM[i]);if(!r)break;const g=healthScore(soc,reps).grade;if(g==="A")gradeAStreak++;else break;}
 let hasDoubled=false;
 for(let i=1;i<months.length;i++){if(months[i-1].ca>0&&months[i].ca>=months[i-1].ca*2){hasDoubled=true;break;}}
 return{totalCA,bestCA,bestPipeline,bestTreso,incubMonths,growthStreak:maxGrowth,profitableMonths,bestMarginPct,profitStreak:maxProfStreak,reportsCount,pulseCount,doneActions,bestGrade,gradeAStreak,hasDoubled};
}
function calcMilestones(soc,reps,actions,pulses,allM){
 const data=calcMilestoneData(soc,reps,actions,pulses,allM);
 return MILESTONE_DEFS.map(m=>({...m,unlocked:m.check(data)}));
}
/* UI COMPONENTS */
function Badge({s}){const m={active:[C.gD,C.g,"Active"],lancement:[C.oD,C.o,"Lancement"],signature:[C.bD,C.b,"Signature"],inactive:[C.rD,C.r,"Inactive"]};const[bg2,c2,l]=m[s]||m.inactive;return <span style={{background:bg2,color:c2,padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:700,letterSpacing:.5}}>{l}</span>;}
function IncubBadge({incub}){if(!incub)return null;const lbl=sinceLbl(incub);return <span style={{background:C.vD,color:C.v,padding:"2px 7px",borderRadius:20,fontSize:9,fontWeight:600}}>📅 {lbl}</span>;}
function GradeBadge({grade,color,size="sm"}){const s=size==="lg"?{w:32,h:32,fs:16,r:9,bw:2}:{w:22,h:22,fs:11,r:6,bw:1.5};return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:s.w,height:s.h,borderRadius:s.r,background:color+"15",color,fontWeight:900,fontSize:s.fs,border:`${s.bw}px solid ${color}33`,flexShrink:0}}>{grade}</span>;}
function KPI({label,value,sub,accent,small,delay=0,icon}){
 return <div className={`fu d${delay} glass-card-static`} style={{padding:small?"10px 12px":"16px 18px",flex:"1 1 130px",minWidth:small?90:120,transition:"all .3s cubic-bezier(.4,0,.2,1)"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=`${accent||C.acc}33`;e.currentTarget.style.boxShadow=`0 0 20px ${(accent||C.acc)}15`;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.06)";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,.3)";e.currentTarget.style.transform="translateY(0)";}}>
  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}>{icon&&<span style={{fontSize:11}}>{icon}</span>}<span style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",fontFamily:FONT_TITLE}}>{label}</span></div>
  <div style={{fontSize:small?16:28,fontWeight:900,color:accent||C.t,lineHeight:1.1}}>{value}</div>
  {sub&&<div style={{color:C.td,fontSize:9,marginTop:3}}>{sub}</div>}
 </div>;
}
function PBar({value,max,color,h=5}){const w=clamp(pct(value,max),0,100);return <div style={{background:C.brd,borderRadius:h,height:h,overflow:"hidden"}}><div className="pg" style={{background:color||C.acc,height:"100%",width:`${w}%`,"--w":`${w}%`,borderRadius:h}}/></div>;}
function Btn({children,onClick,v="primary",small,style:sx,disabled,full}){
 const t={primary:{background:`linear-gradient(135deg,#FFBF00,#FF9D00)`,color:"#0a0a0f",boxShadow:"0 0 20px rgba(255,170,0,.2)"},secondary:{background:"rgba(255,255,255,.03)",color:C.t,border:"1px solid rgba(255,255,255,.08)",backdropFilter:"blur(10px)"},ghost:{background:"transparent",color:C.td,border:"1px solid rgba(255,255,255,.04)"},danger:{background:"rgba(248,113,113,.1)",color:C.r,border:"1px solid rgba(248,113,113,.15)"},success:{background:"rgba(52,211,153,.1)",color:C.g,border:"1px solid rgba(52,211,153,.15)"},ai:{background:`linear-gradient(135deg,${C.v},${C.acc})`,color:"#0a0a0f",boxShadow:`0 0 20px rgba(167,139,250,.2)`}};
 return <button className="ba" disabled={disabled} onClick={onClick} style={{border:"none",borderRadius:10,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:FONT,opacity:disabled?0.35:1,padding:small?"5px 10px":"9px 18px",fontSize:small?10:12,width:full?"100%":"auto",letterSpacing:.3,...t[v],...sx}}>{children}</button>;
}
function Inp({label,value,onChange,type="text",placeholder,suffix,textarea,small,note,onKeyDown}){
 return <div style={{marginBottom:small?6:10}}>
  {label&&<label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3,letterSpacing:.3}}>{label}</label>}
  <div className="glass-input" style={{display:"flex",alignItems:"center",borderRadius:10,overflow:"hidden"}} onFocus={e=>{e.currentTarget.style.borderColor="rgba(255,170,0,.3)";e.currentTarget.style.boxShadow="0 0 16px rgba(255,170,0,.08)";}} onBlur={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.06)";e.currentTarget.style.boxShadow="none";}}>
   {textarea?<textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={2} style={{flex:1,background:"transparent",border:"none",color:C.t,padding:"7px 10px",fontSize:12,fontFamily:FONT,outline:"none",resize:"vertical"}}/>
    :<input type={type} value={value==null?"":value} onChange={e=>onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} style={{flex:1,background:"transparent",border:"none",color:C.t,padding:small?"6px 10px":"8px 10px",fontSize:12,fontFamily:FONT,outline:"none",width:"100%"}}/>}
   {suffix&&<span style={{padding:"0 8px 0 2px",color:C.td,fontSize:11,flexShrink:0}}>{suffix}</span>}
  </div>{note&&<div style={{color:C.tm,fontSize:9,marginTop:2}}>{note}</div>}</div>;
}
function Sel({label,value,onChange,options}){return <div style={{marginBottom:10}}>{label&&<label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3,letterSpacing:.3}}>{label}</label>}<select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.t,padding:"8px 10px",fontSize:12,fontFamily:FONT,outline:"none"}}>{options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>;}
function Sect({children,title,sub,right}){return <div className="fu" style={{marginTop:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8,flexWrap:"wrap",gap:4}}><div>{title&&<h2 style={{color:C.t,fontSize:13,fontWeight:800,margin:0,letterSpacing:1,textTransform:"uppercase",fontFamily:FONT_TITLE}}>{title}</h2>}{sub&&<p style={{color:C.td,fontSize:10,margin:"1px 0 0"}}>{sub}</p>}</div>{right}</div>{children}</div>;}
function Card({children,style:sx,onClick,accent,delay=0}){return <div className={`fu d${Math.min(delay,8)} ${onClick?"glass-card":"glass-card-static"}`} onClick={onClick} style={{padding:14,cursor:onClick?"pointer":"default",...(accent?{borderLeft:`3px solid ${accent}`}:{}),...sx}} >{children}</div>;}
function Modal({open,onClose,title,children,wide}){if(!open)return null;return <div className="fi" onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"28px 14px",overflowY:"auto",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}><div className="mi glass-modal" onClick={e=>e.stopPropagation()} style={{borderRadius:18,padding:22,width:wide?700:440,maxWidth:"100%"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.t}}>{title}</h3><Btn v="ghost" small onClick={onClose}>✕</Btn></div>{children}</div></div>;}
function CTip({active,payload,label}){if(!active||!payload)return null;return <div style={{background:"rgba(14,14,22,.85)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"8px 12px",boxShadow:"0 8px 32px rgba(0,0,0,.5)"}}><div style={{color:C.t,fontWeight:700,fontSize:9,marginBottom:3}}>{label}</div>{payload.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,marginBottom:1}}><span style={{width:4,height:4,borderRadius:2,background:p.color}}/><span style={{color:C.td,fontSize:9}}>{p.name}:</span><span style={{color:C.t,fontSize:9,fontWeight:600}}>{fmt(p.value)}€</span></div>)}</div>;}
function Toggle({on,onToggle,label}){return <div onClick={onToggle} style={{display:"inline-flex",alignItems:"center",gap:7,cursor:"pointer",padding:"5px 10px",borderRadius:8,background:on?C.accD:C.card2,border:`1px solid ${on?C.acc+"66":C.brd}`,transition:"all .15s"}}><div style={{width:26,height:14,borderRadius:7,background:on?C.acc:C.brd,position:"relative",transition:"background .2s"}}><div style={{width:10,height:10,borderRadius:5,background:on?"#0a0a0f":C.td,position:"absolute",top:2,left:on?14:2,transition:"left .2s"}}/></div><span style={{fontSize:10,fontWeight:600,color:on?C.acc:C.td}}>{label}</span></div>;}
function ActionItem({a,socs,onToggle,onDelete}){const s=socs.find(x=>x.id===a.socId);const late=!a.done&&a.deadline<curM();return <div className="fu" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:8,border:`1px solid ${late?C.r+"44":C.brd}`,marginBottom:3}}><div onClick={()=>onToggle(a.id)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${a.done?C.g:C.brd}`,background:a.done?C.gD:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{a.done&&<span style={{color:C.g,fontSize:11}}>✓</span>}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:a.done?C.td:C.t,textDecoration:a.done?"line-through":"none"}}>{a.text}</div><div style={{fontSize:10,color:late?C.r:C.td}}>{s&&<><span style={{width:5,height:5,borderRadius:3,background:s.color,display:"inline-block",marginRight:4}}/>{s.nom} · </>}{ml(a.deadline)}{late&&" ⚠ En retard"}</div></div>{onDelete&&<Btn v="ghost" small onClick={()=>onDelete(a.id)} style={{fontSize:9,padding:"2px 6px"}}>✕</Btn>}</div>;}
/* AI CO-PILOT */
function AICoPilot({socs,reps,hold,actions,pulses,allM,revData,socBank,okrs,synergies,clients}){
 const[msgs,setMsgs]=useState([{role:"assistant",content:"Salut ! Je suis ton co-pilote IA. Je connais toutes les données de ton portfolio. Pose-moi n'importe quelle question — analyse, recommandation, récap pour une réunion, comparaison entre sociétés…"}]);
 const[input,setInput]=useState("");const[loading,setLoading]=useState(false);const ref=useRef(null);
 const PRESETS=["Quelle société prioriser ce mois ?","Génère un récap pour la réunion","Quels sont les risques actuels ?","Compare LEADX et Copywriting","Propose un plan d'action pour ce trimestre"];
 const send=async(text)=>{
  if(!text.trim()||loading)return;const q=text.trim();setInput("");
  setMsgs(prev=>[...prev,{role:"user",content:q}]);setLoading(true);
  try{
   const ctx=buildAIContext(socs,reps,hold,actions,pulses,allM,revData,socBank,okrs,synergies,clients);
   const resp=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:ctx,messages:[...msgs.filter(m=>m.role!=="system"),{role:"user",content:q}]})
   });
   const data=await resp.json();const reply=data.content?.map(b=>b.text||"").join("\n")||"Désolé, je n'ai pas pu répondre.";
   setMsgs(prev=>[...prev,{role:"assistant",content:reply}]);
  }catch(e){setMsgs(prev=>[...prev,{role:"assistant",content:"❌ Erreur de connexion. Réessaie."}]);}
  setLoading(false);
 };
 useEffect(()=>{ref.current?.scrollTo({top:ref.current.scrollHeight,behavior:"smooth"});},[msgs]);
 return <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 120px)"}}>
  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>{PRESETS.map((p,i)=><button key={i} onClick={()=>send(p)} style={{padding:"5px 10px",borderRadius:20,fontSize:10,fontWeight:600,border:`1px solid ${C.brd}`,background:C.card,color:C.td,cursor:"pointer",fontFamily:FONT,transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor=C.acc;e.target.style.color=C.acc;}} onMouseLeave={e=>{e.target.style.borderColor=C.brd;e.target.style.color=C.td;}}>{p}</button>)}</div>
  <div ref={ref} style={{flex:1,overflowY:"auto",padding:"4px 0"}}>
   {msgs.map((m,i)=><div key={i} className="fu" style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:8}}>
    <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:12,background:m.role==="user"?C.acc+"22":C.card,border:`1px solid ${m.role==="user"?C.acc+"44":C.brd}`,fontSize:12,lineHeight:1.7,color:C.t,whiteSpace:"pre-wrap"}}>
    {m.role==="assistant"&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}><span style={{fontSize:14}}>🤖</span><span style={{fontWeight:700,fontSize:10,color:C.v}}>CO-PILOTE</span></div>}
    {m.content}
    </div>
   </div>)}
   {loading&&<div className="fu" style={{padding:"10px 14px",background:C.card,borderRadius:12,border:`1px solid ${C.brd}`,display:"inline-block"}}><span className="dots" style={{fontSize:18}}><span>·</span><span>·</span><span>·</span></span></div>}
  </div>
  <div style={{display:"flex",gap:8,padding:"10px 0 0",borderTop:`1px solid ${C.brd}`}}>
   <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send(input);}} placeholder="Demande à ton co-pilote…" style={{flex:1,background:C.bg,border:`1px solid ${C.brd}`,borderRadius:10,color:C.t,padding:"10px 14px",fontSize:13,fontFamily:FONT,outline:"none"}}/>
   <Btn v="ai" onClick={()=>send(input)} disabled={!input.trim()||loading}>✦ Envoyer</Btn>
  </div>
 </div>;
}
/* PULSE SYSTEM */
function PulseForm({soc,pulses,savePulse,hold}){
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
function PulseOverview({socs,pulses}){
 const w=curW();const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 return <>{actS.map(s=>{const p=pulses[`${s.id}_${w}`];
  return <div key={s.id} className="fu" style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
   <span style={{width:5,height:5,borderRadius:3,background:s.color}}/><span style={{flex:1,fontSize:12,fontWeight:600}}>{s.porteur}</span>
   {p?<><span style={{fontSize:16}}>{MOODS[p.mood]}</span><span style={{fontSize:10,color:C.td,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.win}</span>{p.blocker&&<span style={{fontSize:9,color:C.r,background:C.rD,padding:"2px 6px",borderRadius:10}}>blocage</span>}<span style={{fontWeight:700,fontSize:11,color:[C.r,C.o,C.td,C.b,C.g][p.conf-1]}}>{p.conf}/5</span></>
    :<span style={{fontSize:10,color:C.tm}}>— pas encore envoyé</span>}
  </div>;})}</>;
}
/* MEETING MODE */
function MeetingMode({socs,reps,hold,actions,pulses,allM,onExit}){
 const cM2=curM();const actS=socs.filter(s=>s.stat==="active");const hc=calcH(socs,reps,hold,cM2);
 const[step,setStep]=useState(0);const[timer,setTimer]=useState(0);const[running,setRunning]=useState(false);const[notes,setNotes]=useState("");
 const steps=[{title:"Vue d'ensemble",icon:"📊"},{title:"Alertes & Actions",icon:"⚠"},...actS.map(s=>({title:s.nom,icon:"🏢",soc:s})),{title:"Décisions & Prochaines étapes",icon:"✅"}];
 useEffect(()=>{let id;if(running)id=setInterval(()=>setTimer(t=>t+1),1e3);return()=>clearInterval(id);},[running]);
 const fmtT=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
 return <div className="glass-bg" style={{minHeight:"100vh",fontFamily:FONT,color:C.t}}>
  <style>{CSS}</style>
  <div style={{background:"rgba(14,14,22,.7)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.06)",padding:"14px 20px"}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div><div style={{color:C.acc,fontSize:10,fontWeight:700,letterSpacing:2}}>MODE RÉUNION</div><h1 style={{margin:0,fontSize:18,fontWeight:900}}>{hold?.brand?.name||"Scale Corp"} — {ml(cM2)}</h1></div>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
    <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,fontVariantNumeric:"tabular-nums",color:running?C.g:C.t}}>{fmtT(timer)}</div><div style={{display:"flex",gap:4,marginTop:4}}><Btn small v={running?"danger":"success"} onClick={()=>setRunning(!running)}>{running?"⏸":"▶"}</Btn><Btn small v="ghost" onClick={()=>setTimer(0)}>↻</Btn></div></div>
    <Btn v="ghost" onClick={onExit}>✕ Quitter</Btn>
    </div>
   </div>
   <div style={{display:"flex",gap:2,marginTop:12,overflowX:"auto"}}>{steps.map((s,i)=><button key={i} onClick={()=>setStep(i)} style={{padding:"8px 14px",borderRadius:8,fontSize:11,fontWeight:step===i?700:500,border:"none",background:step===i?C.acc+"22":"transparent",color:step===i?C.acc:C.td,cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap"}}>{s.icon} {s.title}</button>)}</div>
  </div>
  <div style={{padding:"20px 30px",maxWidth:900,margin:"0 auto"}}>
   {step===0&&<div className="si">
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14}}>
    <KPI label="CA Groupe" value={`${fmt(actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca),0))}€`} accent={C.acc}/><KPI label="Marge" value={`${fmt(actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca)-pf(gr(reps,s.id,cM2)?.charges),0))}€`} accent={C.g}/><KPI label="/ Fondateur" value={`${fmt(hc.pf)}€`} accent={C.o}/><KPI label="Pipeline" value={`${fmt(socs.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.pipeline),0))}€`} accent={C.b}/>
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:16}}>{actS.map(s=>{const hs=healthScore(s,reps);const r=gr(reps,s.id,cM2);return <Card key={s.id} accent={s.color} style={{flex:"1 1 200px",padding:14}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><GradeBadge grade={hs.grade} color={hs.color}/><span style={{fontWeight:700,fontSize:14}}>{s.nom}</span></div><div style={{fontSize:22,fontWeight:900}}>{r?`${fmt(r.ca)}€`:"—"}</div><div style={{color:C.td,fontSize:11,marginTop:2}}>{s.porteur}</div></Card>;})}</div>
   </div>}
   {step===1&&<div className="si">
    <Sect title="Alertes">{getAlerts(socs,reps,hold).map((a,i)=><div key={i} style={{padding:"6px 10px",background:{danger:C.rD,warn:C.oD,info:C.bD}[a.t],borderRadius:8,marginBottom:3,color:{danger:C.r,warn:C.o,info:C.b}[a.t],fontSize:12,fontWeight:600}}>⚠ {a.m}</div>)}</Sect>
    <Sect title="Actions en retard">{actions.filter(a=>!a.done&&a.deadline<cM2).map(a=><ActionItem key={a.id} a={a} socs={socs} onToggle={()=>{}} onDelete={()=>{}}/>)}</Sect>
    <Sect title="Actions en cours">{actions.filter(a=>!a.done&&a.deadline>=cM2).slice(0,8).map(a=><ActionItem key={a.id} a={a} socs={socs} onToggle={()=>{}} onDelete={()=>{}}/>)}</Sect>
   </div>}
   {step>=2&&step<steps.length-1&&steps[step].soc&&(()=>{
    const s=steps[step].soc,r=gr(reps,s.id,cM2),rp=gr(reps,s.id,prevM(cM2));const hs=healthScore(s,reps);const rw=runway(reps,s.id,allM);const proj=project(reps,s.id,allM);
    const pw=Object.entries(pulses).filter(([k])=>k.startsWith(s.id+"_")).pop();
    const sActs=actions.filter(a=>a.socId===s.id&&!a.done);
    return <div className="si">
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
    <div style={{width:40,height:40,borderRadius:10,background:`${s.color}22`,border:`2px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:18,color:s.color}}>{s.nom[0]}</div>
    <div style={{flex:1}}><div style={{fontWeight:900,fontSize:18}}>{s.nom}</div><div style={{color:C.td,fontSize:11,display:"flex",gap:6,alignItems:"center"}}><span>{s.porteur} — {s.act}</span>{s.incub&&<span style={{color:C.v,fontSize:9,background:C.vD,padding:"1px 6px",borderRadius:8}}>📅 {sinceLbl(s.incub)}</span>}</div></div>
    <GradeBadge grade={hs.grade} color={hs.color} size="lg"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
    <KPI label="CA" value={r?`${fmt(r.ca)}€`:"—"} accent={C.acc} small/><KPI label="Marge" value={r?`${fmt(pf(r.ca)-pf(r.charges))}€`:"—"} accent={C.g} small/>
    {s.rec&&<KPI label="MRR" value={r?`${fmt(r.mrr)}€`:"—"} accent={C.b} small/>}
    <KPI label="Pipeline" value={r?`${fmt(r.pipeline)}€`:"—"} accent={C.acc} small/>
    {rw&&<KPI label="Runway" value={`${rw.months} mois`} accent={rw.months<3?C.r:rw.months<6?C.o:C.g} small/>}
    </div>
    {pw&&<Card style={{marginTop:12,padding:12}} accent={s.color}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22}}>{MOODS[pw[1].mood]}</span><div><div style={{fontSize:12,fontWeight:600}}>Pulse: {pw[1].win}</div>{pw[1].blocker&&<div style={{fontSize:11,color:C.r}}>Blocage: {pw[1].blocker}</div>}</div></div></Card>}
    {/* Milestones disabled */}
    {proj&&<Card style={{marginTop:10,padding:12}}><div style={{color:C.td,fontSize:10,fontWeight:700,marginBottom:4}}>PROJECTION T+3</div><div style={{display:"flex",gap:12}}>{proj.map((v,i)=><span key={i} style={{fontSize:12}}>{ml(nextM(i===0?cM2:nextM(i===1?cM2:nextM(cM2))))}: <strong style={{color:C.acc}}>{fmt(v)}€</strong></span>)}</div></Card>}
    {sActs.length>0&&<Sect title="Actions ouvertes">{sActs.map(a=><ActionItem key={a.id} a={a} socs={socs} onToggle={()=>{}} onDelete={()=>{}}/>)}</Sect>}
    </div>;
   })()}
   {step===steps.length-1&&<div className="si"><Sect title="Notes de réunion"><Inp value={notes} onChange={setNotes} textarea placeholder="Décisions prises, prochaines étapes…"/></Sect></div>}
   <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
    <Btn v="secondary" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}>← Précédent</Btn>
    <span style={{color:C.td,fontSize:11}}>{step+1}/{steps.length}</span>
    <Btn onClick={()=>setStep(Math.min(steps.length-1,step+1))} disabled={step===steps.length-1}>Suivant →</Btn>
   </div>
  </div>
 </div>;
}
/* DEAL FLOW */
function DealFlow({deals,saveDeals}){
 const[edit,setEdit]=useState(null);
 const move=(id,dir)=>{saveDeals(deals.map(d=>d.id===id?{...d,stage:clamp(d.stage+dir,0,DEAL_STAGES.length-1)}:d));};
 const del=(id)=>{saveDeals(deals.filter(d=>d.id!==id));};
 const saveDeal=()=>{if(!edit)return;const idx=deals.findIndex(d=>d.id===edit.id);saveDeals(idx>=0?deals.map(d=>d.id===edit.id?edit:d):[...deals,edit]);setEdit(null);};
 return <>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,marginTop:6}}><span style={{color:C.td,fontSize:12}}>{deals.length} opportunités</span><Btn small onClick={()=>setEdit({id:uid(),nom:"",contact:"",stage:0,value:0,notes:"",at:new Date().toISOString()})}>+ Deal</Btn></div>
  <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:10}}>{DEAL_STAGES.map((stage,si)=><div key={si} style={{minWidth:170,flex:"1 1 170px"}}>
   <div style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:6,textAlign:"center"}}>{stage}</div>
   {deals.filter(d=>d.stage===si).map(d=><Card key={d.id} style={{marginBottom:5,padding:"10px 12px",cursor:"pointer"}} onClick={()=>setEdit({...d})}>
    <div style={{fontWeight:700,fontSize:12,marginBottom:2}}>{d.nom}</div>
    <div style={{fontSize:10,color:C.td}}>{d.contact}</div>
    {d.value>0&&<div style={{fontSize:11,fontWeight:700,color:C.acc,marginTop:2}}>{fmt(d.value)}€/mois</div>}
    <div style={{display:"flex",gap:3,marginTop:6}}>{si>0&&<Btn v="ghost" small onClick={e=>{e.stopPropagation();move(d.id,-1);}}>←</Btn>}{si<DEAL_STAGES.length-1&&<Btn v="ghost" small onClick={e=>{e.stopPropagation();move(d.id,1);}}>→</Btn>}</div>
   </Card>)}
  </div>)}</div>
  <Modal open={!!edit} onClose={()=>setEdit(null)} title={edit?.nom||"Nouveau deal"}>
   {edit&&<><Inp label="Nom société" value={edit.nom} onChange={v=>setEdit({...edit,nom:v})}/><Inp label="Contact" value={edit.contact} onChange={v=>setEdit({...edit,contact:v})}/><Inp label="Valeur estimée" value={edit.value} onChange={v=>setEdit({...edit,value:pf(v)})} type="number" suffix="€/mois"/><Sel label="Étape" value={edit.stage} onChange={v=>setEdit({...edit,stage:parseInt(v)})} options={DEAL_STAGES.map((s,i)=>({v:i,l:s}))}/><Inp label="Notes" value={edit.notes} onChange={v=>setEdit({...edit,notes:v})} textarea/>
   <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={saveDeal}>Sauver</Btn><Btn v="secondary" onClick={()=>setEdit(null)}>Annuler</Btn>{deals.find(d=>d.id===edit.id)&&<Btn v="danger" onClick={()=>{del(edit.id);setEdit(null);}} style={{marginLeft:"auto"}}>Supprimer</Btn>}</div></>}
  </Modal>
 </>;
}
/* BANKING - REVOLUT */
const TX_CATEGORIES=[
 {id:"all",label:"Toutes",icon:""},
 {id:"revenus",label:"💰 Revenus",icon:"💰"},
 {id:"loyer",label:"🏠 Loyer",icon:"🏠"},
 {id:"pub",label:"📢 Publicité",icon:"📢"},
 {id:"abonnements",label:"💻 Abonnements",icon:"💻"},
 {id:"equipe",label:"👥 Équipe",icon:"👥"},
 {id:"transfert",label:"🏦 Transfert interne",icon:"🏦"},
 {id:"autres",label:"📦 Autres dépenses",icon:"📦"},
 {id:"dividendes",label:"🏛️ Dividendes Holding",icon:"🏛️"},
];
function categorizeTransaction(tx){
 const leg=tx.legs?.[0];if(!leg)return{id:"autres",label:"📦 Autres dépenses",icon:"📦"};
 const amt=leg.amount;const ref=((leg.description||"")+" "+(tx.reference||"")).toLowerCase();
 const legDesc=((tx.legs?.[0]?.description||"")+"").toLowerCase();
 const hasCounterparty=!!tx.legs?.[0]?.counterparty;const isSingleLeg=(tx.legs||[]).length===1;
 const isRealDividend=(/dividend/i.test(tx.reference||"")&&hasCounterparty&&isSingleLeg)||(/scale\s*corp/i.test(legDesc)&&hasCounterparty&&isSingleLeg);
 if(isRealDividend)return TX_CATEGORIES[8];
 if(amt>0)return TX_CATEGORIES[1];
 if(/loyer|rent/.test(ref))return TX_CATEGORIES[2];
 if(/facebook|google ads|meta ads|meta|tiktok|pub/.test(ref))return TX_CATEGORIES[3];
 if(/lecosysteme|l.{0,2}ecosyst[eè]me/i.test(ref))return TX_CATEGORIES[4];
 if(/stripe|notion|slack|ghl|zapier|skool|adobe|figma|revolut|gohighlevel|highlevel|canva|chatgpt|openai|anthropic|vercel|github|zoom|brevo|make\.com|clickup|airtable/.test(ref))return TX_CATEGORIES[4];
 if(/lucien|salaire|salary|freelance|prestataire|prestation/.test(ref))return TX_CATEGORIES[5];
 if(tx.type==="transfer")return TX_CATEGORIES[6];
 return TX_CATEGORIES[7];
}
function BankingPanel({revData,onSync,compact,clients:allClients2=[]}){
 if(!revData||!revData.accounts){
  return <Card style={{textAlign:"center",padding:compact?16:30}}>
   <div style={{fontSize:compact?24:36,marginBottom:6}}>🏦</div>
   <div style={{fontWeight:700,fontSize:compact?12:14,marginBottom:4}}>Revolut Business</div>
   <div style={{color:C.td,fontSize:11,marginBottom:10}}>Connecte ton compte dans Paramètres Holding</div>
   <Btn small onClick={onSync}>Charger données demo</Btn>
  </Card>;
 }
 const{accounts,transactions,totalEUR,lastSync,isDemo}=revData;
 const inflow=transactions.filter(t=>t.legs?.[0]?.amount>0).reduce((s,t)=>s+t.legs?.[0]?.amount||0,0);
 const outflow=Math.abs(transactions.filter(t=>t.legs?.[0]?.amount<0).reduce((s,t)=>s+t.legs?.[0]?.amount||0,0));
 const cs=v=>CURR_SYMBOLS[v]||v;
 if(compact)return <Card style={{padding:12}} accent={C.g}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
   <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:14}}>🏦</span><span style={{fontWeight:700,fontSize:11,color:C.td}}>REVOLUT</span>{isDemo&&<span style={{fontSize:8,color:C.o,background:C.oD,padding:"1px 5px",borderRadius:6}}>DEMO</span>}</div>
   <span style={{fontSize:9,color:C.tm}}>{ago(lastSync)}</span>
  </div>
  <div style={{fontWeight:900,fontSize:20,color:C.g}}>{fmt(totalEUR)}€</div>
  <div style={{display:"flex",gap:8,marginTop:6}}>{accounts.slice(0,3).map(a=><div key={a.id} style={{fontSize:10,color:C.td}}>{a.name}: <strong style={{color:C.t}}>{fmt(a.balance)}{cs(a.currency)}</strong></div>)}</div>
 </Card>;
 return <>
  {isDemo&&<div className="fu" style={{background:C.oD,border:`1px solid ${C.o}22`,borderRadius:10,padding:"8px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{color:C.o,fontSize:11,fontWeight:600}}>⚠ Données demo — Ajoute ton token Revolut dans Paramètres Holding</span><Btn small v="secondary" onClick={onSync}>↻ Sync</Btn></div>}
  <div className="fu" style={{background:`linear-gradient(135deg,${C.card},${C.card2})`,border:`1px solid ${C.brd}`,borderRadius:14,padding:20,marginBottom:14,textAlign:"center"}}>
   <div style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:4}}>SOLDE TOTAL</div>
   <div style={{fontWeight:900,fontSize:34,color:C.g,lineHeight:1}}>{fmt(totalEUR)}€</div>
   <div style={{color:C.td,fontSize:11,marginTop:4}}>Dernière sync: {ago(lastSync)}</div>
   {!isDemo&&<Btn small v="secondary" onClick={onSync} style={{marginTop:8}}>↻ Actualiser</Btn>}
  </div>
  <Sect title="Comptes" sub={`${accounts.length} comptes`}>
   {accounts.map((a,i)=><div key={a.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:C.card,borderRadius:10,border:`1px solid ${C.brd}`,marginBottom:4}}>
    <div style={{width:36,height:36,borderRadius:9,background:a.state==="active"?C.gD:C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏦</div>
    <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{a.name}</div><div style={{color:C.td,fontSize:10}}>{a.currency} · {a.state==="active"?"Actif":"Inactif"}</div></div>
    <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:18,color:a.balance>=0?C.g:C.r}}>{fmt(a.balance)} {cs(a.currency)}</div></div>
   </div>)}
  </Sect>
  <div style={{display:"flex",gap:10,marginTop:4}}>
   <KPI label="Entrées (30j)" value={`+${fmt(inflow)}€`} accent={C.g} delay={1}/>
   <KPI label="Sorties (30j)" value={`-${fmt(outflow)}€`} accent={C.r} delay={2}/>
   <KPI label="Net" value={`${fmt(inflow-outflow)}€`} accent={inflow-outflow>=0?C.g:C.r} delay={3}/>
  </div>
  <BankingTransactions transactions={transactions} cs={cs} allClients2={allClients2}/>
 </>;
}
function BankingTransactions({transactions,cs,allClients2=[]}){
 const[catFilter,setCatFilter]=useState("all");
 const[typeFilter,setTypeFilter]=useState("all");
 const[periodFilter,setPeriodFilter]=useState("all");
 const[sortBy,setSortBy]=useState("recent");
 const[search,setSearch]=useState("");
 const filtered=useMemo(()=>{
  const now=new Date();let txs=[...transactions];
  // period
  if(periodFilter==="month"){const s=new Date(now.getFullYear(),now.getMonth(),1);txs=txs.filter(t=>new Date(t.created_at)>=s);}
  else if(periodFilter==="lastmonth"){const s=new Date(now.getFullYear(),now.getMonth()-1,1);const e=new Date(now.getFullYear(),now.getMonth(),1);txs=txs.filter(t=>{const d=new Date(t.created_at);return d>=s&&d<e;});}
  else if(periodFilter==="3months"){const s=new Date(now.getFullYear(),now.getMonth()-2,1);txs=txs.filter(t=>new Date(t.created_at)>=s);}
  // type
  if(typeFilter==="in")txs=txs.filter(t=>t.legs?.[0]?.amount>0);
  else if(typeFilter==="out")txs=txs.filter(t=>t.legs?.[0]?.amount<0);
  // category
  if(catFilter!=="all")txs=txs.filter(t=>categorizeTransaction(t).id===catFilter);
  // search
  if(search.trim()){const q=search.toLowerCase();txs=txs.filter(t=>{const ref=((t.legs?.[0]?.description||"")+" "+(t.reference||"")+" "+(t.merchant?.name||"")).toLowerCase();return ref.includes(q);});}
  // sort
  if(sortBy==="oldest")txs.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  else if(sortBy==="recent")txs.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  else if(sortBy==="amountUp")txs.sort((a,b)=>(a.legs?.[0]?.amount||0)-(b.legs?.[0]?.amount||0));
  else if(sortBy==="amountDown")txs.sort((a,b)=>(b.legs?.[0]?.amount||0)-(a.legs?.[0]?.amount||0));
  return txs;
 },[transactions,catFilter,typeFilter,periodFilter,sortBy,search]);
 const totals=useMemo(()=>{
  let inp=0,out=0,div=0;filtered.forEach(t=>{const a=t.legs?.[0]?.amount||0;if(a>0)inp+=a;else{out+=Math.abs(a);if(categorizeTransaction(t).id==="dividendes")div+=Math.abs(a);}});
  return{inp:Math.round(inp),out:Math.round(out),net:Math.round(inp-out),count:filtered.length,div:Math.round(div)};
 },[filtered]);
 const selS={background:C.bg,border:`1px solid ${C.brd}`,borderRadius:6,color:C.t,padding:"4px 6px",fontSize:10,fontFamily:FONT,outline:"none"};
 return <>
  <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center",marginTop:10,marginBottom:6}}>
   <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={selS}>{TX_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>
   <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={selS}><option value="all">Toutes</option><option value="in">Entrées</option><option value="out">Sorties</option></select>
   <select value={periodFilter} onChange={e=>setPeriodFilter(e.target.value)} style={selS}><option value="all">Tout</option><option value="month">Ce mois</option><option value="lastmonth">Mois dernier</option><option value="3months">3 derniers mois</option></select>
   <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selS}><option value="recent">Plus récent</option><option value="oldest">Plus ancien</option><option value="amountDown">Montant ↓</option><option value="amountUp">Montant ↑</option></select>
   <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{...selS,flex:"1 1 100px",minWidth:80}}/>
  </div>
  <div style={{display:"flex",gap:6,marginBottom:8}}>
   <div style={{flex:1,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:C.td,fontWeight:700}}>ENTRÉES</div><div style={{fontWeight:800,fontSize:12,color:C.g}}>+{fmt(totals.inp)}€</div></div>
   <div style={{flex:1,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:C.td,fontWeight:700}}>SORTIES</div><div style={{fontWeight:800,fontSize:12,color:C.r}}>-{fmt(totals.out)}€</div></div>
   <div style={{flex:1,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:C.td,fontWeight:700}}>NET</div><div style={{fontWeight:800,fontSize:12,color:totals.net>=0?C.g:C.r}}>{fmt(totals.net)}€</div></div>
   <div style={{flex:1,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:C.td,fontWeight:700}}>TX</div><div style={{fontWeight:800,fontSize:12,color:C.t}}>{totals.count}</div></div>
  </div>
  {totals.div>0&&<div style={{background:"#7c3aed11",border:"1px solid #7c3aed33",borderRadius:8,padding:"6px 10px",marginBottom:8,display:"flex",alignItems:"center",gap:6,fontSize:11}}><span style={{fontSize:13}}>🏛️</span><span style={{color:"#7c3aed",fontWeight:700}}>Total dividendes holding : {fmt(totals.div)}€</span><span style={{color:C.td,fontSize:10}}>(non comptés dans les charges opérationnelles)</span></div>}
  <Sect title="Transactions" sub={`${totals.count} résultats`}>
   {filtered.map((tx,i)=>{
    const leg=tx.legs?.[0];if(!leg)return null;
    const isIn=leg.amount>0;const desc=leg.description||tx.reference||tx.merchant?.name||"Transaction";
    const cat=categorizeTransaction(tx);const isDiv=cat.id==="dividendes";
    const catColors={"revenus":C.g,"loyer":"#f59e0b","pub":"#ec4899","abonnements":C.b,"equipe":C.o,"transfert":"#6366f1","dividendes":"#7c3aed","autres":C.td};
    return <div key={tx.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:isDiv?"#7c3aed11":C.card,borderRadius:8,border:`1px solid ${isDiv?"#7c3aed33":C.brd}`,marginBottom:2}}>
    <div style={{width:26,height:26,borderRadius:7,background:isIn?C.gD:isDiv?"#7c3aed22":C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:isIn?C.g:isDiv?"#7c3aed":C.r,flexShrink:0}}>{cat.icon||"↑"}</div>
    <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{desc}</span><span style={{fontSize:9,padding:"1px 6px",borderRadius:8,background:(catColors[cat.id]||C.td)+"22",color:catColors[cat.id]||C.td,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>{cat.label}</span></div><div style={{fontSize:10,color:C.td}}>{new Date(tx.created_at).toLocaleDateString("fr-FR")} · {tx.type==="card_payment"?"Carte":"Virement"}</div></div>
    <span style={{fontWeight:800,fontSize:13,color:isIn?C.g:isDiv?"#7c3aed":C.r,whiteSpace:"nowrap"}}>{isIn?"+":""}{fmt(leg.amount)} {cs(leg.currency)}</span>
    {(()=>{const d2=(desc||"").toLowerCase();const match=allClients2.find(c=>{const n=(c.name||"").toLowerCase().trim();if(n.length<3)return false;if(d2.includes(n))return true;const pts=n.split(/\s+/).filter(p=>p.length>2);return pts.length>=2&&pts.every(p=>d2.includes(p));});return match?<span style={{fontSize:7,padding:"1px 5px",borderRadius:6,background:"#60a5fa22",color:"#60a5fa",fontWeight:700,marginLeft:4,flexShrink:0,whiteSpace:"nowrap"}}>👤 {match.name}</span>:null;})()}
    </div>;
   })}
   {filtered.length===0&&<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucune transaction trouvée</div>}
  </Sect>
 </>;
}
/* GHL CRM TAB */
function TabCRM({socs,ghlData,onSync}){
 const[selSoc,setSelSoc]=useState("all");
 const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 const hasData=Object.keys(ghlData).length>0;
 const aggStats=useMemo(()=>{
  const ids=selSoc==="all"?actS.map(s=>s.id):[selSoc];
  let tLeads=0,tOpen=0,tWon=0,tLost=0,pVal=0,wVal=0;
  ids.forEach(id=>{const d=ghlData[id];if(!d)return;const st=d.stats;tLeads+=st.totalLeads;tOpen+=st.openDeals;tWon+=st.wonDeals;tLost+=st.lostDeals;pVal+=st.pipelineValue;wVal+=st.wonValue;});
  return{tLeads,tOpen,tWon,tLost,pVal,wVal,conv:tLeads>0?Math.round(tWon/tLeads*100):0};
 },[ghlData,selSoc,actS]);
 const opps=useMemo(()=>{
  const ids=selSoc==="all"?actS.map(s=>s.id):[selSoc];
  const all=[];ids.forEach(id=>{const d=ghlData[id];if(!d)return;((d.opportunities||[])).forEach(o=>{all.push({...o,socId:id});});});
  return all.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
 },[ghlData,selSoc,actS]);
 const stages=useMemo(()=>{
  const ids=selSoc==="all"?actS.map(s=>s.id):[selSoc];
  const st=new Set();ids.forEach(id=>{const d=ghlData[id];if(!d)return;((d.opportunities||[])).forEach(o=>st.add(o.stage));});
  return[...st];
 },[ghlData,selSoc,actS]);
 const sources=useMemo(()=>{
  const ids=selSoc==="all"?actS.map(s=>s.id):[selSoc];
  const m={};ids.forEach(id=>{const d=ghlData[id];if(!d)return;((d.opportunities||[])).forEach(o=>{m[o.source]=(m[o.source]||0)+1;});});
  return Object.entries(m).map(([s,c])=>({source:s,count:c})).sort((a,b)=>b.count-a.count);
 },[ghlData,selSoc,actS]);
 const isDemo=Object.values(ghlData).some(d=>d.isDemo);
 if(!hasData)return <div className="fu" style={{textAlign:"center",padding:50}}>
  <div style={{fontSize:40,marginBottom:10}}>📡</div>
  <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>Connecte tes comptes GHL</div>
  <div style={{color:C.td,fontSize:12,marginBottom:16,maxWidth:350,margin:"0 auto 16px"}}>Ajoute ta clé API GoHighLevel dans les paramètres de chaque société (onglet Sociétés → modifier)</div>
  <Btn onClick={onSync}>Charger les données demo</Btn>
 </div>;
 return <>
  {isDemo&&<div className="fu" style={{background:C.oD,border:`1px solid ${C.o}22`,borderRadius:10,padding:"8px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{color:C.o,fontSize:11,fontWeight:600}}>⚠ Données demo — Ajoute tes clés API GHL pour les vraies données</span><Btn small v="secondary" onClick={onSync}>↻ Sync</Btn></div>}
  <div style={{display:"flex",gap:6,alignItems:"center",marginTop:6,marginBottom:14,flexWrap:"wrap"}}>
   <select value={selSoc} onChange={e=>setSelSoc(e.target.value)} style={{background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.t,padding:"8px 12px",fontSize:12,fontFamily:FONT,outline:"none"}}><option value="all">Toutes les sociétés</option>{actS.map(s=><option key={s.id} value={s.id}>{s.nom}</option>)}</select>
   {!isDemo&&<Btn small v="secondary" onClick={onSync}>↻ Sync GHL</Btn>}
   {ghlData[actS[0]?.id]&&<span style={{color:C.tm,fontSize:10}}>Dernière sync: {ago(ghlData[actS[0].id].lastSync)}</span>}
  </div>
  <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
   <KPI label="Leads total" value={String(aggStats.tLeads)} accent={C.b} delay={1}/><KPI label="Pipeline ouvert" value={`${fmt(aggStats.pVal)}€`} accent={C.acc} delay={2}/><KPI label="Deals gagnés" value={`${fmt(aggStats.wVal)}€`} accent={C.g} delay={3}/><KPI label="Conversion" value={`${aggStats.conv}%`} accent={aggStats.conv>=30?C.g:aggStats.conv>=15?C.o:C.r} delay={4}/>
  </div>
  <Sect title="Funnel" sub="Répartition par étape">
   {stages.map((st,i)=>{const stOpps=opps.filter(o=>o.stage===st);const val=stOpps.reduce((a,o)=>a+o.value,0);const w=aggStats.tLeads>0?Math.round(stOpps.length/aggStats.tLeads*100):0;
    return <div key={st} className={`fu d${Math.min(i+1,8)}`} style={{marginBottom:4}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:2,background:GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]}}/><span style={{fontWeight:600,fontSize:12}}>{st}</span></div>
    <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{color:C.td,fontSize:11}}>{stOpps.length} deals</span><span style={{fontWeight:700,fontSize:12,color:C.acc}}>{fmt(val)}€</span></div>
    </div>
    <PBar value={w} max={100} color={GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]} h={5}/>
    </div>;
   })}
  </Sect>
  {selSoc==="all"&&<Sect title="Pipeline par société">
   {actS.map((s,i)=>{const d=ghlData[s.id];if(!d)return null;return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
    <span style={{width:6,height:6,borderRadius:3,background:s.color}}/><span style={{flex:1,fontWeight:700,fontSize:12}}>{s.nom}</span>
    <span style={{fontSize:10,color:C.td}}>{d.stats.totalLeads} leads</span>
    <span style={{fontSize:10,color:C.b}}>{d.stats.openDeals} ouverts</span>
    <span style={{fontSize:10,color:C.g}}>{d.stats.wonDeals} gagnés</span>
    <span style={{fontWeight:700,fontSize:12,color:C.acc}}>{fmt(d.stats.pipelineValue)}€</span>
   </div>;})}
  </Sect>}
  {sources.length>0&&<Sect title="Sources de leads">
   <div className="fu d1" style={{height:160,background:C.card,borderRadius:12,border:`1px solid ${C.brd}`,padding:"14px 6px 6px 0"}}><ResponsiveContainer><BarChart data={sources} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={C.brd}/><XAxis type="number" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="source" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} width={90}/><Tooltip contentStyle={{background:C.card2,border:`1px solid ${C.brd}`,borderRadius:10,fontSize:11}}/><Bar dataKey="count" fill={C.b} radius={[0,3,3,0]} name="Leads"/></BarChart></ResponsiveContainer></div>
  </Sect>}
  <Sect title="Opportunités récentes" sub={`${opps.length} au total`}>
   {opps.slice(0,12).map((o,i)=>{const s=socs.find(x=>x.id===o.socId);
    return <div key={o.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
    {s&&<span style={{width:5,height:5,borderRadius:3,background:s.color,flexShrink:0}}/>}
    <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name}</div><div style={{fontSize:10,color:C.td}}>{o.stage} · {o.source}</div></div>
    <span style={{fontWeight:700,fontSize:12,color:o.status==="won"?C.g:C.acc}}>{fmt(o.value)}€</span>
    <span style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:o.status==="won"?C.gD:o.status==="lost"?C.rD:C.bD,color:o.status==="won"?C.g:o.status==="lost"?C.r:C.b,fontWeight:600}}>{o.status==="won"?"Gagné":o.status==="lost"?"Perdu":"Ouvert"}</span>
    </div>;
   })}
  </Sect>
 </>;
}
/* PORTEUR VIEW (Rapport/Stats/Actions/Journal/Pulse) */
/* MILESTONES UI */
function MilestonesWall({milestones,soc}){
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
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:6}}>
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
function MilestonesCompact({milestones,max=5}){
 const unlocked=milestones.filter(m=>m.unlocked);
 if(unlocked.length===0)return null;
 const top=unlocked.sort((a,b)=>b.tier-a.tier).slice(0,max);
 return <div style={{display:"flex",gap:2,alignItems:"center"}}>
  {top.map(m=><span key={m.id} title={m.label} style={{fontSize:10,filter:m.tier>=4?"none":"opacity(.7)"}}>{m.icon}</span>)}
  {unlocked.length>max&&<span style={{fontSize:8,color:C.td}}>+{unlocked.length-max}</span>}
 </div>;
}
function MilestoneCount({milestones}){
 const n=milestones.filter(m=>m.unlocked).length;
 if(n===0)return null;
 return <span style={{fontSize:8,color:C.acc,background:C.accD,padding:"1px 5px",borderRadius:8,fontWeight:700}}>🏆 {n}</span>;
}
/* PER-SOCIÉTÉ BANKING WIDGET — REDESIGNED */
function SocBankWidget({bankData,onSync,soc}){
 const[txFilter,setTxFilter]=useState("all");
 const[searchTx,setSearchTx]=useState("");
 const[advancedMode,setAdvancedMode]=useState(false);
 const[txCatOverrides,setTxCatOverrides]=useState(()=>{try{return JSON.parse(localStorage.getItem(`scTxCat_${soc?.id}`)||"{}");}catch{return{};}});
 const[catDropdown,setCatDropdown]=useState(null);
 const[catDropPos,setCatDropPos]=useState(null);
 const[selectedTx,setSelectedTx]=useState(new Set());
 const saveCatOverride=(txId,catId)=>{const next={...txCatOverrides,[txId]:catId};setTxCatOverrides(next);try{localStorage.setItem(`scTxCat_${soc?.id}`,JSON.stringify(next));}catch{}setCatDropdown(null);};
 const getCat=(tx)=>txCatOverrides[tx.id]?TX_CATEGORIES.find(c=>c.id===txCatOverrides[tx.id])||categorizeTransaction(tx):categorizeTransaction(tx);
 if(!bankData)return <Card style={{textAlign:"center",padding:20}}>
  <div style={{fontSize:28,marginBottom:6}}>🏦</div>
  <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>Revolut Business</div>
  <div style={{color:C.td,fontSize:11,marginBottom:10}}>Connecte ton compte Revolut</div>
  <Btn small onClick={onSync}>Charger données demo</Btn>
 </Card>;
 const{accounts:allAccounts,transactions:allTransactions,balance,monthly,lastSync,isDemo}=bankData;
 const excl=EXCLUDED_ACCOUNTS[soc?.id]||[];
 const transactions=allTransactions.filter(t=>{const leg=t.legs?.[0];return!leg||!excl.includes(leg.account_id);});
 const cm=curM(),pm2=prevM(cm);
 const cmData=monthly?.[cm],pmData=monthly?.[pm2];
 const now2=new Date();const mStart=new Date(now2.getFullYear(),now2.getMonth(),1);
 const monthTx=transactions.filter(tx=>{const leg=tx.legs?.[0];if(!leg)return false;if(excl.includes(leg.account_id))return false;return new Date(tx.created_at)>=mStart;});
 const entriesMois=cmData?.income||0;
 const sortiesMois=cmData?.expense||0;
 // Filter logic
 let filteredTx=txFilter==="in"?monthTx.filter(tx=>(tx.legs?.[0]?.amount||0)>0):txFilter==="out"?monthTx.filter(tx=>(tx.legs?.[0]?.amount||0)<0):monthTx;
 if(searchTx.trim()){const q=searchTx.toLowerCase();filteredTx=filteredTx.filter(tx=>{const leg=tx.legs?.[0];const desc=(leg?.description||tx.reference||"").toLowerCase();return desc.includes(q);});}
 if(advancedMode&&txFilter!=="all"&&txFilter!=="in"&&txFilter!=="out"){filteredTx=filteredTx.filter(tx=>getCat(tx).id===txFilter);}
 const catColors={"revenus":C.g,"loyer":"#f59e0b","pub":"#ec4899","abonnements":C.b,"equipe":C.o,"transfert":"#6366f1","dividendes":"#7c3aed","autres":C.td};
 const catIconMap={"revenus":"💰","loyer":"🏠","pub":"📢","abonnements":"💻","equipe":"👤","transfert":"📤","dividendes":"🏛️","autres":"📦"};
 return <>
  {isDemo&&<div className="fu" style={{background:C.oD,border:`1px solid ${C.o}22`,borderRadius:10,padding:"6px 12px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{color:C.o,fontSize:10,fontWeight:600}}>⚠ Demo — Ajoute le token Revolut via l'admin</span><Btn small v="ghost" onClick={onSync} style={{fontSize:9}}>↻</Btn></div>}
  {/* 3 KPI cards */}
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
   <div className="glass-card-static" style={{padding:20,textAlign:"center"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>SOLDE ACTUEL</div>
    <div style={{fontWeight:900,fontSize:26,color:C.g,lineHeight:1}}>{fmt(balance)}€</div>
    <div style={{color:C.tm,fontSize:9,marginTop:4}}>Sync {ago(lastSync)}</div>
   </div>
   <div className="glass-card-static" style={{padding:20,textAlign:"center"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>ENTRÉES CE MOIS</div>
    <div style={{fontWeight:900,fontSize:26,color:C.g,lineHeight:1}}>+{fmt(entriesMois)}€</div>
    {pmData&&<div style={{fontSize:9,fontWeight:600,marginTop:4,color:entriesMois>=pmData.income?C.g:C.r}}>{entriesMois>=pmData.income?"↑":"↓"} {fmt(Math.abs(entriesMois-pmData.income))}€ vs N-1</div>}
   </div>
   <div className="glass-card-static" style={{padding:20,textAlign:"center"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>SORTIES CE MOIS</div>
    <div style={{fontWeight:900,fontSize:26,color:C.r,lineHeight:1}}>-{fmt(sortiesMois)}€</div>
    {pmData&&<div style={{fontSize:9,fontWeight:600,marginTop:4,color:sortiesMois<=pmData.expense?C.g:C.r}}>{sortiesMois<=pmData.expense?"↓":"↑"} {fmt(Math.abs(sortiesMois-pmData.expense))}€ vs N-1</div>}
   </div>
  </div>
  {/* Filter tabs + search + advanced toggle */}
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
   <div style={{display:"flex",gap:4}}>
    {[{id:"all",l:"Tout"},{id:"in",l:"Entrées ↑"},{id:"out",l:"Sorties ↓"}].map(f=><button key={f.id} onClick={()=>setTxFilter(f.id)} style={{padding:"6px 14px",borderRadius:8,fontSize:10,fontWeight:txFilter===f.id?700:500,border:`1px solid ${txFilter===f.id?C.acc:C.brd}`,background:txFilter===f.id?C.accD:"transparent",color:txFilter===f.id?C.acc:C.td,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>{f.l}</button>)}
   </div>
   <div style={{flex:1,minWidth:120,position:"relative"}}>
    <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:C.td}}>🔍</span>
    <input value={searchTx} onChange={e=>setSearchTx(e.target.value)} placeholder="Rechercher..." style={{width:"100%",padding:"7px 10px 7px 30px",borderRadius:8,border:`1px solid ${C.brd}`,background:"rgba(6,6,11,0.6)",color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
   </div>
   <button onClick={()=>setAdvancedMode(!advancedMode)} style={{padding:"6px 12px",borderRadius:8,fontSize:9,fontWeight:600,border:`1px solid ${advancedMode?C.acc:C.brd}`,background:advancedMode?C.accD:"transparent",color:advancedMode?C.acc:C.td,cursor:"pointer",fontFamily:FONT}}>⚙ Mode avancé</button>
  </div>
  {/* Advanced: category pills + select all */}
  {advancedMode&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
   {TX_CATEGORIES.filter(c=>c.id!=="all").map(c=><span key={c.id} onClick={()=>setTxFilter(txFilter===c.id?"all":c.id)} style={{padding:"3px 10px",borderRadius:12,fontSize:9,fontWeight:600,cursor:"pointer",background:txFilter===c.id?(catColors[c.id]||C.acc)+"22":"transparent",color:txFilter===c.id?(catColors[c.id]||C.acc):C.td,border:`1px solid ${txFilter===c.id?(catColors[c.id]||C.acc):C.brd}`,transition:"all .15s"}}>{c.label}</span>)}
   <span onClick={()=>{if(selectedTx.size===filteredTx.length)setSelectedTx(new Set());else setSelectedTx(new Set(filteredTx.map(t=>t.id)));}} style={{padding:"3px 10px",borderRadius:12,fontSize:9,fontWeight:600,cursor:"pointer",color:C.acc,border:`1px solid ${C.acc}`,background:selectedTx.size>0?C.acc+"22":"transparent",marginLeft:"auto"}}>{selectedTx.size>0?"☐ Désélect.":"☑ Tout"}</span>
  </div>}
  {/* Transaction list */}
  <div style={{marginBottom:8}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:8,fontFamily:FONT_TITLE}}>{filteredTx.length} TRANSACTIONS</div>
   {filteredTx.length===0?<div style={{color:C.td,fontSize:11,padding:20,textAlign:"center"}}>Aucune transaction</div>:filteredTx.map((tx,i)=>{const leg=tx.legs?.[0];if(!leg)return null;const isIn=leg.amount>0;const cat=getCat(tx);const isDiv=cat.id==="dividendes";
    return <div key={tx.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:selectedTx.has(tx.id)?C.acc+"08":"transparent",borderRadius:8,borderBottom:`1px solid ${C.brd}08`,marginBottom:1,transition:"background .15s"}}>
    {advancedMode&&<input type="checkbox" checked={selectedTx.has(tx.id)} onChange={()=>setSelectedTx(prev=>{const n=new Set(prev);n.has(tx.id)?n.delete(tx.id):n.add(tx.id);return n;})} style={{width:14,height:14,accentColor:C.acc,cursor:"pointer",flexShrink:0}} />}
    <span style={{width:28,height:28,borderRadius:8,background:isIn?C.gD:isDiv?"#7c3aed15":C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{catIconMap[cat.id]||(isIn?"↑":"↓")}</span>
    <div style={{flex:1,minWidth:0}}>
     <div style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.t}}>{leg.description||tx.reference||"—"}</div>
     <div style={{fontSize:9,color:C.td}}>{new Date(tx.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</div>
    </div>
    <span style={{fontWeight:700,fontSize:12,color:isIn?C.g:C.r,whiteSpace:"nowrap"}}>{isIn?"+":""}{fmt(leg.amount)}€</span>
    </div>;})}
  </div>
  {/* Bulk categorization bar */}
  {advancedMode&&selectedTx.size>0&&<div style={{position:"sticky",bottom:0,background:"rgba(14,14,22,.9)",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.brd}`,padding:"8px 12px",display:"flex",alignItems:"center",gap:8,borderRadius:"0 0 10px 10px"}}>
    <span style={{fontSize:11,fontWeight:600}}>{selectedTx.size} sélectionnée{selectedTx.size>1?"s":""}</span>
    {TX_CATEGORIES.filter(c=>c.id!=="all").map(c=><button key={c.id} onClick={()=>{selectedTx.forEach(id=>saveCatOverride(id,c.id));setSelectedTx(new Set());}} style={{fontSize:9,padding:"4px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:3}}><span>{c.icon}</span><span>{c.label.replace(/^[^\s]+\s/,"")}</span></button>)}
    <button onClick={()=>setSelectedTx(new Set())} style={{marginLeft:"auto",fontSize:9,color:C.td,background:"none",border:"none",cursor:"pointer",fontFamily:FONT}}>Désélectionner</button>
  </div>}
 </>;
}
/* RAPPORTS PANEL */
function RapportsPanel({soc,socBankData,ghlData,clients}){
 const[expandedMonth,setExpandedMonth]=useState(null);
 const[notesMap,setNotesMap]=useState(()=>{try{return JSON.parse(localStorage.getItem(`scRapportNotes_${soc?.id}`)||"{}");}catch{return{};}});
 const saveNote=(month,text)=>{const next={...notesMap,[month]:text};setNotesMap(next);try{localStorage.setItem(`scRapportNotes_${soc?.id}`,JSON.stringify(next));}catch{}};
 const cm=curM();
 const months=useMemo(()=>{const ms=[];let m=cm;for(let i=0;i<12;i++){ms.push(m);m=prevM(m);}return ms;},[cm]);
 const getMonthData=(month)=>{
  const txs=(socBankData?.transactions||[]).filter(t=>(t.created_at||"").startsWith(month));
  const excl=EXCLUDED_ACCOUNTS[soc?.id]||[];
  const filtered=txs.filter(t=>{const leg=t.legs?.[0];return leg&&!excl.includes(leg.account_id);});
  const ca=filtered.filter(t=>(t.legs?.[0]?.amount||0)>0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0);
  const charges=Math.abs(filtered.filter(t=>(t.legs?.[0]?.amount||0)<0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0));
  const marge=ca-charges;
  // Top 5 clients by collected
  const clientTotals={};filtered.filter(t=>(t.legs?.[0]?.amount||0)>0).forEach(t=>{const desc=(t.legs?.[0]?.description||t.reference||"").trim();clientTotals[desc]=(clientTotals[desc]||0)+(t.legs?.[0]?.amount||0);});
  const topClients=Object.entries(clientTotals).sort((a,b)=>b[1]-a[1]).slice(0,5);
  // Top 5 expenses
  const expTotals={};filtered.filter(t=>(t.legs?.[0]?.amount||0)<0).forEach(t=>{const desc=(t.legs?.[0]?.description||t.reference||"").trim();expTotals[desc]=(expTotals[desc]||0)+Math.abs(t.legs?.[0]?.amount||0);});
  const topExpenses=Object.entries(expTotals).sort((a,b)=>b[1]-a[1]).slice(0,5);
  // Clients won/lost
  const gd=ghlData?.[soc.id];
  const wonThisMonth=(gd?.opportunities||[]).filter(o=>o.status==="won"&&(o.updatedAt||o.createdAt||"").startsWith(month)).length;
  const lostThisMonth=(gd?.opportunities||[]).filter(o=>o.status==="lost"&&(o.updatedAt||o.createdAt||"").startsWith(month)).length;
  return{ca,charges,marge,topClients,topExpenses,wonThisMonth,lostThisMonth,treso:socBankData?.balance||0,txCount:filtered.length};
 };
 // MRR tracking
 const activeClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active"&&c.billing);
 const mrrMonths=months.slice(0,6).reverse();
 const mrrData=useMemo(()=>{
  return activeClients.map(cl=>{
   const cn=(cl.name||"").toLowerCase().trim();
   const monthPayments={};
   mrrMonths.forEach(mo=>{
    const txs=(socBankData?.transactions||[]).filter(t=>(t.created_at||"").startsWith(mo));
    const found=txs.some(t=>{const leg=t.legs?.[0];if(!leg||leg.amount<=0)return false;const desc=(leg.description||t.reference||"").toLowerCase();return cn.length>2&&desc.includes(cn);});
    monthPayments[mo]=found;
   });
   return{client:cl,payments:monthPayments,billing:clientMonthlyRevenue(cl)};
  });
 },[activeClients,socBankData,mrrMonths]);
 const mrrTheorique=activeClients.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 return <div className="fu">
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
   <div><h2 style={{color:C.t,fontSize:13,fontWeight:800,margin:0,fontFamily:FONT_TITLE}}>📋 RAPPORTS MENSUELS</h2><p style={{color:C.td,fontSize:10,margin:"2px 0 0"}}>Bilans financiers auto-générés</p></div>
  </div>
  {months.map((month,mi)=>{
   const d=getMonthData(month);const isExpanded=expandedMonth===month||mi===0;const isCurrent=mi===0;
   return <div key={month} className={`glass-card-static fu d${Math.min(mi+1,6)}`} style={{padding:isCurrent?20:14,marginBottom:10,cursor:isCurrent?undefined:"pointer"}} onClick={!isCurrent?()=>setExpandedMonth(expandedMonth===month?null:month):undefined}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:isExpanded?12:0}}>
     <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:isCurrent?16:12}}>{isCurrent?"📊":"📄"}</span>
      <div>
       <div style={{fontWeight:800,fontSize:isCurrent?14:12,color:C.t}}>{ml(month)}{isCurrent?" (en cours)":""}</div>
       {!isExpanded&&<div style={{fontSize:9,color:C.td}}>CA {fmt(d.ca)}€ · Charges {fmt(d.charges)}€ · Marge {fmt(d.marge)}€</div>}
      </div>
     </div>
     {!isCurrent&&<span style={{fontSize:11,color:C.td}}>{isExpanded?"▲":"▼"}</span>}
    </div>
    {isExpanded&&<>
     {/* KPIs */}
     <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
      <div style={{padding:10,background:C.gD,borderRadius:8,textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.g}}>{fmt(d.ca)}€</div><div style={{fontSize:8,color:C.g,fontWeight:600}}>CA</div></div>
      <div style={{padding:10,background:C.rD,borderRadius:8,textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.r}}>{fmt(d.charges)}€</div><div style={{fontSize:8,color:C.r,fontWeight:600}}>Charges</div></div>
      <div style={{padding:10,background:d.marge>=0?C.gD:C.rD,borderRadius:8,textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:d.marge>=0?C.g:C.r}}>{fmt(d.marge)}€</div><div style={{fontSize:8,color:C.td,fontWeight:600}}>Marge</div></div>
      <div style={{padding:10,background:C.bD,borderRadius:8,textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.b}}>{d.txCount}</div><div style={{fontSize:8,color:C.td,fontWeight:600}}>Transactions</div></div>
     </div>
     {/* Top clients + expenses side by side */}
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <div>
       <div style={{fontSize:9,fontWeight:700,color:C.g,marginBottom:6}}>TOP CLIENTS</div>
       {d.topClients.length===0?<div style={{fontSize:10,color:C.td}}>—</div>:d.topClients.map(([n,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.brd}08`}}><span style={{fontSize:10,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{n}</span><span style={{fontSize:10,fontWeight:700,color:C.g}}>{fmt(v)}€</span></div>)}
      </div>
      <div>
       <div style={{fontSize:9,fontWeight:700,color:C.r,marginBottom:6}}>TOP DÉPENSES</div>
       {d.topExpenses.length===0?<div style={{fontSize:10,color:C.td}}>—</div>:d.topExpenses.map(([n,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.brd}08`}}><span style={{fontSize:10,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{n}</span><span style={{fontSize:10,fontWeight:700,color:C.r}}>{fmt(v)}€</span></div>)}
      </div>
     </div>
     {/* Won/lost */}
     <div style={{display:"flex",gap:12,marginBottom:12}}>
      <span style={{fontSize:10,color:C.g,fontWeight:600}}>✅ {d.wonThisMonth} client{d.wonThisMonth>1?"s":""} gagné{d.wonThisMonth>1?"s":""}</span>
      <span style={{fontSize:10,color:C.r,fontWeight:600}}>❌ {d.lostThisMonth} perdu{d.lostThisMonth>1?"s":""}</span>
     </div>
     {/* Objectifs vs Réalité */}
     {(soc.obj||soc.monthlyGoal)>0&&(()=>{const obj=soc.obj||soc.monthlyGoal||0;const atteint=d.ca>=obj;return <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:atteint?C.gD:C.rD,borderRadius:8,marginBottom:12}}>
      <span style={{fontSize:14}}>{atteint?"✅":"❌"}</span>
      <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:atteint?C.g:C.r}}>{atteint?"Objectif atteint":"Non atteint"}</div><div style={{fontSize:9,color:C.td}}>Objectif: {fmt(obj)}€ · Réalisé: {fmt(d.ca)}€ ({obj>0?Math.round(d.ca/obj*100):0}%)</div></div>
     </div>;})()}
     {/* Publicité Meta */}
     {(()=>{let metaD=null;try{metaD=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${month}`));}catch{}
      if(!metaD||!metaD.spend)return null;
      const sp3=metaD.spend||0,lds3=metaD.leads||0,rev3=metaD.revenue||0;
      const cpl3=lds3>0?sp3/lds3:0,roas3=sp3>0?rev3/sp3:0;
      let metaPD=null;try{metaPD=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${prevM(month)}`));}catch{}
      const pCpl3=metaPD&&metaPD.leads>0?metaPD.spend/metaPD.leads:0;
      const pRoas3=metaPD&&metaPD.spend>0?metaPD.revenue/metaPD.spend:0;
      return <div style={{padding:10,background:C.accD,borderRadius:8,marginBottom:12,border:`1px solid ${C.acc}22`}}>
       <div style={{fontSize:9,fontWeight:700,color:C.acc,marginBottom:6}}>📣 PUBLICITÉ META</div>
       <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:600}}>Budget: {fmt(sp3)}€</span>
        <span style={{fontSize:10,fontWeight:600}}>Leads: {lds3}</span>
        <span style={{fontSize:10,fontWeight:600,color:cpl3>0&&pCpl3>0?(cpl3<=pCpl3?C.g:C.r):C.t}}>CPL: {cpl3.toFixed(2)}€{pCpl3>0?` (${cpl3<=pCpl3?"↓":"↑"})`:""}</span>
        <span style={{fontSize:10,fontWeight:600,color:roas3>=2?C.g:roas3>=1?C.o:C.r}}>ROAS: {roas3.toFixed(2)}x{pRoas3>0?` (${roas3>=pRoas3?"↑":"↓"})`:""}</span>
       </div>
      </div>;
     })()}
     {/* Export PDF */}
     <button onClick={(e)=>{e.stopPropagation();const logo=hold?.brand?.logoUrl||"";const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport ${ml(month)} — ${soc.nom}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a}h1{color:#FFAA00;font-size:24px}h2{color:#333;font-size:16px;margin-top:20px}.kpi{display:inline-block;padding:12px 20px;margin:6px;background:#f5f5f5;border-radius:8px;text-align:center}.kpi .val{font-size:22px;font-weight:900}.kpi .lbl{font-size:11px;color:#666}table{width:100%;border-collapse:collapse;margin-top:10px}td,th{padding:6px 10px;border-bottom:1px solid #eee;text-align:left;font-size:12px}@media print{body{padding:20px}}</style></head><body>${logo?`<img src="${logo}" style="height:40px;margin-bottom:12px"/>`:""}
<h1>Rapport ${ml(month)}</h1><p>${soc.nom} — ${soc.porteur}</p>
<div><div class="kpi"><div class="val" style="color:#22c55e">${fmt(d.ca)}€</div><div class="lbl">CA</div></div><div class="kpi"><div class="val" style="color:#ef4444">${fmt(d.charges)}€</div><div class="lbl">Charges</div></div><div class="kpi"><div class="val" style="color:${d.marge>=0?"#22c55e":"#ef4444"}">${fmt(d.marge)}€</div><div class="lbl">Marge</div></div></div>
<h2>Top Clients</h2><table>${d.topClients.map(([n,v])=>`<tr><td>${n}</td><td style="font-weight:700;color:#22c55e">${fmt(v)}€</td></tr>`).join("")}</table>
<h2>Top Dépenses</h2><table>${d.topExpenses.map(([n,v])=>`<tr><td>${n}</td><td style="font-weight:700;color:#ef4444">${fmt(v)}€</td></tr>`).join("")}</table>
${(soc.obj||0)>0?`<h2>Objectif</h2><p>${d.ca>=(soc.obj||0)?"✅ Atteint":"❌ Non atteint"} — ${fmt(d.ca)}€ / ${fmt(soc.obj)}€</p>`:""}
<p style="margin-top:30px;color:#999;font-size:10px">MRR théorique: ${fmt(mrrTheorique)}€ · Généré le ${new Date().toLocaleDateString("fr-FR")}</p></body></html>`;const w=window.open("","_blank");w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),500);}} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${C.acc}`,background:C.accD,color:C.acc,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT,marginBottom:12}}>📥 Exporter PDF</button>
     {/* Notes per month */}
     <div style={{marginTop:8}}>
      <label style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:.5,display:"block",marginBottom:4}}>📝 NOTES DU MOIS</label>
      <textarea value={notesMap[month]||""} onChange={e=>saveNote(month,e.target.value)} placeholder="Ajouter vos observations, commentaires..." style={{width:"100%",minHeight:isCurrent?80:50,padding:10,borderRadius:8,border:`1px solid ${C.brd}`,background:"rgba(6,6,11,0.6)",color:C.t,fontSize:11,fontFamily:FONT,outline:"none",resize:"vertical"}}/>
     </div>
    </>}
   </div>;
  })}
  {/* Objectifs summary */}
  {(soc.obj||soc.monthlyGoal)>0&&(()=>{const obj=soc.obj||soc.monthlyGoal||0;const results=months.map(mo=>getMonthData(mo)).filter(d=>d.txCount>0);const atteints=results.filter(d=>d.ca>=obj).length;const total=results.length;const pctObj=total>0?Math.round(atteints/total*100):0;return <div className="glass-card-static" style={{padding:16,marginTop:12,marginBottom:4,display:"flex",alignItems:"center",gap:12}}>
   <span style={{fontSize:24}}>{pctObj>=70?"🏆":pctObj>=40?"📊":"📉"}</span>
   <div><div style={{fontWeight:800,fontSize:12,color:pctObj>=70?C.g:pctObj>=40?C.o:C.r}}>Objectifs atteints: {atteints}/{total} mois ({pctObj}%)</div><div style={{fontSize:9,color:C.td}}>Objectif mensuel: {fmt(obj)}€</div></div>
  </div>;})()}
  {/* MRR TRACKING */}
  {activeClients.length>0&&<div className="glass-card-static" style={{padding:20,marginTop:16}}>
   <div style={{fontSize:9,fontWeight:700,color:C.v,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 SUIVI MRR — RÉCURRENCE CLIENTS</div>
   <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
     <thead><tr>
      <th style={{textAlign:"left",padding:"6px 8px",borderBottom:`1px solid ${C.brd}`,color:C.td,fontWeight:700,fontSize:9}}>Client</th>
      <th style={{textAlign:"right",padding:"6px 4px",borderBottom:`1px solid ${C.brd}`,color:C.td,fontWeight:700,fontSize:8}}>€/m</th>
      {mrrMonths.map(mo=><th key={mo} style={{textAlign:"center",padding:"6px 4px",borderBottom:`1px solid ${C.brd}`,color:C.td,fontWeight:700,fontSize:8,minWidth:50}}>{ml(mo).split(" ")[0]}</th>)}
     </tr></thead>
     <tbody>
      {mrrData.map(({client:cl,payments,billing})=><tr key={cl.id}>
       <td style={{padding:"5px 8px",borderBottom:`1px solid ${C.brd}08`,fontWeight:600,color:C.t,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cl.name}</td>
       <td style={{padding:"5px 4px",borderBottom:`1px solid ${C.brd}08`,textAlign:"right",fontWeight:700,color:C.acc}}>{fmt(billing)}€</td>
       {mrrMonths.map(mo=><td key={mo} style={{padding:"5px 4px",borderBottom:`1px solid ${C.brd}08`,textAlign:"center"}}>{payments[mo]?<span style={{color:C.g}}>✅</span>:<span style={{color:C.r,background:C.rD,padding:"1px 4px",borderRadius:4}}>❌</span>}</td>)}
      </tr>)}
      <tr style={{fontWeight:800}}>
       <td style={{padding:"8px 8px",color:C.t}}>MRR Théorique</td>
       <td style={{padding:"8px 4px",textAlign:"right",color:C.acc}}>{fmt(mrrTheorique)}€</td>
       {mrrMonths.map(mo=>{const real=mrrData.filter(d=>d.payments[mo]).reduce((a,d)=>a+d.billing,0);return <td key={mo} style={{padding:"8px 4px",textAlign:"center",color:real>=mrrTheorique?C.g:C.r,fontSize:10}}>{fmt(real)}€</td>;})}
      </tr>
     </tbody>
    </table>
   </div>
  </div>}
 </div>;
}
/* SYNERGIES MAP */
function SynergiesPanel({socs,synergies,saveSynergies}){
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
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
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
function KnowledgeBase({socs,kb,saveKb,isPorteur,socId}){
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
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
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
function RiskMatrix({socs,reps,allM}){
 const cM2=curM();const pm=prevM(cM2);const[hover,setHover]=useState(null);
 const data=socs.filter(s=>s.stat==="active"&&s.id!=="eco").map(s=>{
  const r=gr(reps,s.id,cM2),rp=gr(reps,s.id,pm);
  const ca=pf(r?.ca),caPrev=pf(rp?.ca),ch=pf(r?.charges);
  const growth=caPrev>0?Math.round((ca-caPrev)/caPrev*100):-100;
  const margin=ca>0?Math.round((ca-ch)/ca*100):0;
  return{nom:s.nom,color:s.color,growth:clamp(growth,-50,150),margin:clamp(margin,-30,80),ca:Math.max(ca,500),porteur:s.porteur,id:s.id};
 }).filter(d=>d.ca>0);
 const W=320,H=240,P={t:20,r:20,b:30,l:40};
 const xMin=-50,xMax=150,yMin=-30,yMax=80;
 const sx=v=>P.l+(v-xMin)/(xMax-xMin)*(W-P.l-P.r);
 const sy=v=>H-P.b-(v-yMin)/(yMax-yMin)*(H-P.t-P.b);
 return <Sect title="Matrice de risque" sub="Croissance × Rentabilité — taille = CA">
  <Card style={{padding:14}}>
   <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",maxHeight:280}}>
    <line x1={P.l} y1={P.t} x2={P.l} y2={H-P.b} stroke={C.brd} strokeWidth={1}/>
    <line x1={P.l} y1={H-P.b} x2={W-P.r} y2={H-P.b} stroke={C.brd} strokeWidth={1}/>
    <line x1={sx(0)} y1={P.t} x2={sx(0)} y2={H-P.b} stroke={C.brd} strokeDasharray="3 3" strokeWidth={.5}/>
    <line x1={P.l} y1={sy(0)} x2={W-P.r} y2={sy(0)} stroke={C.brd} strokeDasharray="3 3" strokeWidth={.5}/>
    {[-50,0,50,100,150].map(v=><text key={"x"+v} x={sx(v)} y={H-P.b+12} textAnchor="middle" fill={C.td} fontSize={7}>{v}%</text>)}
    {[-30,0,30,60].map(v=><text key={"y"+v} x={P.l-4} y={sy(v)+3} textAnchor="end" fill={C.td} fontSize={7}>{v}%</text>)}
    <text x={W/2} y={H-2} textAnchor="middle" fill={C.td} fontSize={8}>Croissance %</text>
    <text x={8} y={H/2} textAnchor="middle" fill={C.td} fontSize={8} transform={`rotate(-90,8,${H/2})`}>Marge %</text>
    <rect x={sx(0)} y={P.t} width={W-P.r-sx(0)} height={sy(0)-P.t} fill={C.g} opacity={.03}/>
    <rect x={P.l} y={P.t} width={sx(0)-P.l} height={sy(0)-P.t} fill={C.acc} opacity={.03}/>
    <rect x={sx(0)} y={sy(0)} width={W-P.r-sx(0)} height={H-P.b-sy(0)} fill={C.o} opacity={.03}/>
    <rect x={P.l} y={sy(0)} width={sx(0)-P.l} height={H-P.b-sy(0)} fill={C.r} opacity={.03}/>
    {data.map(d=>{const r2=clamp(d.ca/600,6,20);return <g key={d.id} onMouseEnter={()=>setHover(d)} onMouseLeave={()=>setHover(null)} style={{cursor:"pointer"}}>
    <circle cx={sx(d.growth)} cy={sy(d.margin)} r={r2} fill={d.color+"66"} stroke={d.color} strokeWidth={1.5}/>
    <text x={sx(d.growth)} y={sy(d.margin)-r2-3} textAnchor="middle" fill={C.t} fontSize={7} fontWeight={700}>{d.nom}</text>
    </g>;})}
   </svg>
   {hover&&<div style={{background:C.card2,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 10px",marginTop:6}}>
    <span style={{fontWeight:700,fontSize:11,color:hover.color}}>{hover.nom}</span> <span style={{fontSize:9,color:C.td}}>({hover.porteur})</span>
    <div style={{display:"flex",gap:12,marginTop:3,fontSize:10}}>
    <span>CA: <strong>{fmt(hover.ca)}€</strong></span>
    <span>Croissance: <strong style={{color:hover.growth>=0?C.g:C.r}}>{hover.growth>0?"+":""}{hover.growth}%</strong></span>
    <span>Marge: <strong style={{color:hover.margin>=0?C.g:C.r}}>{hover.margin}%</strong></span>
    </div>
   </div>}
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:10}}>
    {[["⭐ Stars","Croissance+ & Marge+",C.g],["💰 Cash cows","Marge+ mais stagne",C.acc],["🚀 À surveiller","Croît mais pas rentable",C.o],["⚠ Critique","Déclin & pertes",C.r]].map(([l,d,c],i)=>
    <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",background:c+"08",borderRadius:6,border:`1px solid ${c}18`}}>
    <span style={{fontSize:10}}>{l.split(" ")[0]}</span>
    <div><div style={{fontSize:9,fontWeight:600,color:c}}>{l.split(" ").slice(1).join(" ")}</div><div style={{fontSize:7,color:C.td}}>{d}</div></div>
    </div>
    )}
   </div>
  </Card>
 </Sect>;
}
/* 2. ALERTES INTELLIGENTES */
function calcSmartAlerts(socs,reps,actions,pulses,allM,socBank){
 const cM2=curM();const pm=prevM(cM2);const alerts=[];
 socs.filter(s=>s.stat==="active"&&s.id!=="eco").forEach(s=>{
  const r=gr(reps,s.id,cM2),rp=gr(reps,s.id,pm),rpp=gr(reps,s.id,prevM(pm));
  const ca=pf(r?.ca),caPrev=pf(rp?.ca),caPP=pf(rpp?.ca);
  const ch=pf(r?.charges);const rw=runway(reps,s.id,allM);
  if(caPrev>0&&ca>0&&(ca-caPrev)/caPrev<-.3)alerts.push({soc:s,type:"danger",icon:"📉",title:`${s.nom}: CA en chute`,desc:`${fmt(ca)}€ vs ${fmt(caPrev)}€ (-${Math.abs(Math.round((ca-caPrev)/caPrev*100))}%)`,priority:1});
  if(caPrev>0&&caPP>0&&ca<caPrev&&caPrev<caPP)alerts.push({soc:s,type:"warning",icon:"⚠️",title:`${s.nom}: tendance baissière`,desc:"2 mois consécutifs de baisse du CA",priority:2});
  if(rw&&rw.months<3&&rw.months>0)alerts.push({soc:s,type:"danger",icon:"🔥",title:`${s.nom}: runway critique`,desc:`${rw.months} mois restants (${fmt(rw.treso)}€)`,priority:1});
  if(ca>0&&ch>ca)alerts.push({soc:s,type:"danger",icon:"💸",title:`${s.nom}: marge négative`,desc:`Charges (${fmt(ch)}€) > CA (${fmt(ca)}€)`,priority:1});
  if(!r)alerts.push({soc:s,type:"warning",icon:"📋",title:`${s.nom}: rapport manquant`,desc:`Aucun rapport soumis pour ${ml(cM2)}`,priority:3});
  if(ca>0&&s.obj>0&&ca>=s.obj*1.2)alerts.push({soc:s,type:"success",icon:"🎯",title:`${s.nom}: objectif écrasé !`,desc:`${fmt(ca)}€ vs obj ${fmt(s.obj)}€ (+${Math.round((ca/s.obj-1)*100)}%)`,priority:4});
  if(caPrev>0&&ca>=caPrev*2)alerts.push({soc:s,type:"success",icon:"🚀",title:`${s.nom}: CA doublé !`,desc:`${fmt(ca)}€ vs ${fmt(caPrev)}€ le mois dernier`,priority:4});
  const lastPulse=Object.entries(pulses).filter(([k])=>k.startsWith(s.id+"_")).pop();
  if(!lastPulse||!lastPulse[1]?.at||(Date.now()-new Date(lastPulse[1].at).getTime())>14*864e5)alerts.push({soc:s,type:"info",icon:"📡",title:`${s.nom}: silence radio`,desc:"Pas de pulse depuis 2+ semaines",priority:3});
  const sb=socBank?.[s.id];
  if(sb&&sb.balance<1000)alerts.push({soc:s,type:"danger",icon:"🏦",title:`${s.nom}: solde bancaire bas`,desc:`Seulement ${fmt(sb.balance)}€ en banque`,priority:1});
 });
 return alerts.sort((a,b)=>a.priority-b.priority);
}
function SmartAlertsPanel({alerts}){
 if(alerts.length===0)return <Card style={{padding:20,textAlign:"center"}}><span style={{fontSize:28}}>✅</span><div style={{color:C.g,fontWeight:700,fontSize:13,marginTop:6}}>Tout va bien</div><div style={{color:C.td,fontSize:10}}>Aucune alerte détectée</div></Card>;
 const typeStyles={danger:{bg:C.rD,brd:C.r},warning:{bg:C.oD,brd:C.o},success:{bg:C.gD,brd:C.g},info:{bg:C.bD,brd:C.b}};
 return <div>{alerts.map((a,i)=>{const st=typeStyles[a.type]||typeStyles.info;
  return <div key={i} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:st.bg,border:`1px solid ${st.brd}18`,borderRadius:8,marginBottom:4}}>
   <span style={{fontSize:16}}>{a.icon}</span>
   <div style={{flex:1}}>
    <div style={{fontWeight:700,fontSize:11,color:st.brd}}>{a.title}</div>
    <div style={{fontSize:9,color:C.td}}>{a.desc}</div>
   </div>
   <span style={{width:6,height:6,borderRadius:3,background:a.soc.color,flexShrink:0}}/>
  </div>;
 })}</div>;
}
/* 3. COHORT ANALYSIS */
function CohortAnalysis({socs,reps,allM}){
 const cohorts=useMemo(()=>{
  const groups={};
  socs.filter(s=>s.incub&&s.stat!=="signature").forEach(s=>{
   const d=new Date(s.incub);const q=`${d.getFullYear()}-Q${Math.ceil((d.getMonth()+1)/3)}`;
   if(!groups[q])groups[q]={label:q,socs:[]};
   groups[q].socs.push(s);
  });
  return Object.values(groups).sort((a,b)=>a.label.localeCompare(b.label));
 },[socs]);
 const cohortData=useMemo(()=>{
  return cohorts.map(c=>{
   const metrics=c.socs.map(s=>{
    const reports=allM.map(m=>{const r=gr(reps,s.id,m);return r?{m,ca:pf(r.ca),ch:pf(r.charges)}:null;}).filter(Boolean);
    const totalCA=reports.reduce((a,r2)=>a+r2.ca,0);
    const avgCA=reports.length>0?Math.round(totalCA/reports.length):0;
    const months=sinceMonths(s.incub);
    const lastCA=reports.length>0?reports[reports.length-1].ca:0;
    return{nom:s.nom,color:s.color,totalCA,avgCA,months,lastCA,reportsCount:reports.length};
   });
   const avgTotalCA=metrics.length?Math.round(metrics.reduce((a,m)=>a+m.totalCA,0)/metrics.length):0;
   const avgMonthlyCA=metrics.length?Math.round(metrics.reduce((a,m)=>a+m.avgCA,0)/metrics.length):0;
   const avgReports=metrics.length?Math.round(metrics.reduce((a,m)=>a+m.reportsCount,0)/metrics.length):0;
   return{...c,metrics,avgTotalCA,avgMonthlyCA,avgReports};
  });
 },[cohorts,reps,allM]);
 return <Sect title="Analyse par cohorte" sub="Performance par promotion d'incubation">
  {cohortData.length===0&&<div className="fu" style={{textAlign:"center",padding:40,color:C.td}}>Ajoutez des dates d'incubation pour voir les cohortes</div>}
  {cohortData.length>0&&<Card style={{padding:14,marginBottom:12}}>
   <div style={{height:200}}><ResponsiveContainer><BarChart data={cohortData.map(c=>({name:c.label,CA_moy:c.avgMonthlyCA,Sociétés:c.socs.length}))}>
    <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
    <XAxis dataKey="name" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
    <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/>
    <Tooltip content={<CTip/>}/>
    <Bar dataKey="CA_moy" fill={C.acc} radius={[4,4,0,0]} name="CA moyen/mois"/>
   </BarChart></ResponsiveContainer></div>
  </Card>}
  {cohortData.map((c,ci)=>
   <Card key={c.label} accent={C.v} style={{marginBottom:8,padding:14}} delay={Math.min(ci+1,6)}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
    <div><span style={{fontWeight:800,fontSize:14,color:C.v}}>{c.label}</span><span style={{color:C.td,fontSize:10,marginLeft:6}}>{c.socs.length} société{c.socs.length>1?"s":""}</span></div>
    <div style={{display:"flex",gap:8}}>
    <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td}}>CA moy</div><div style={{fontWeight:800,fontSize:12,color:C.acc}}>{fmt(c.avgMonthlyCA)}€</div></div>
    <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td}}>Rapports</div><div style={{fontWeight:800,fontSize:12,color:C.b}}>{c.avgReports}</div></div>
    </div>
    </div>
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
    {c.metrics.map(m=>
    <div key={m.nom} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",background:C.bg,borderRadius:6,border:`1px solid ${m.color}22`}}>
    <span style={{width:4,height:4,borderRadius:2,background:m.color}}/>
    <span style={{fontSize:9,fontWeight:600}}>{m.nom}</span>
    <span style={{fontSize:8,color:C.td}}>CA:{fmt(m.avgCA)}€</span>
    <span style={{fontSize:7,color:C.td}}>{m.months}m</span>
    </div>
    )}
    </div>
   </Card>
  )}
 </Sect>;
}
/* 4. CHALLENGES INTER-SOCIÉTÉS */
const CHALLENGE_TEMPLATES=[
 {id:"c_double",title:"🔥 Doublé",desc:"Doubler son CA vs mois dernier",metric:"ca_growth",target:100,unit:"%",icon:"🔥"},
 {id:"c_margin",title:"💎 Marge d'or",desc:"Atteindre 60%+ de marge",metric:"margin",target:60,unit:"%",icon:"💎"},
 {id:"c_pipeline",title:"🎯 Pipeline monstre",desc:"Pipeline > 2× CA",metric:"pipeline_ratio",target:200,unit:"%",icon:"🎯"},
 {id:"c_streak",title:"📈 Série verte",desc:"3 mois consécutifs de hausse",metric:"growth_streak",target:3,unit:"mois",icon:"📈"},
 {id:"c_reports",title:"📊 Exemplaire",desc:"Rapport soumis avant le 5 du mois",metric:"early_report",target:1,unit:"",icon:"📊"},
 {id:"c_pulse",title:"⚡ Ultra-connecté",desc:"Pulse envoyé chaque semaine ce mois",metric:"pulse_count",target:4,unit:"",icon:"⚡"},
];
/* ABONNEMENTS & ÉQUIPE PANEL */
function SubsTeamPanel({socs,subs,saveSubs,team,saveTeam,socId,reps,isCompact,socBankData,revData}){
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Montant" value={editSub.amount} onChange={v=>setEditSub({...editSub,amount:pf(v)})} type="number" suffix="€"/>
    <Sel label="Fréquence" value={editSub.freq} onChange={v=>setEditSub({...editSub,freq:v})} options={[{v:"monthly",l:"Mensuel"},{v:"annual",l:"Annuel"}]}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
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
function SubsTeamBadge({subs,team,socId,reps}){
 const cM2=curM();
 const mySubs=socId?subs.filter(s=>s.socId===socId):subs;
 const myTeam=socId?team.filter(t=>t.socId===socId):team;
 const totalS=mySubs.reduce((a,s)=>a+subMonthly(s),0);
 const totalT=myTeam.reduce((a,t)=>{const ca=t.socId!=="holding"?pf(gr(reps,t.socId,cM2)?.ca):0;return a+teamMonthly(t,ca);},0);
 const total=totalS+totalT;
 if(total===0)return null;
 return <span style={{fontSize:8,color:C.r,background:C.rD,padding:"1px 5px",borderRadius:8,fontWeight:600}}>🔄 {fmt(total)}€/m</span>;
}
function ChallengesPanel({socs,reps,allM,pulses,challenges,saveChallenges}){
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
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:6}}>
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
function AIWeeklyCoach({soc,reps,allM,actions,pulses,milestones}){
 const cM2=curM();const pm=prevM(cM2);
 const r=gr(reps,soc.id,cM2),rp=gr(reps,soc.id,pm);
 const ca=pf(r?.ca),caPrev=pf(rp?.ca),ch=pf(r?.charges);
 const hs=healthScore(soc,reps);
 const nextMs=milestones.filter(m=>!m.unlocked).sort((a,b)=>a.tier-b.tier)[0];
 const openActs=actions.filter(a=>a.socId===soc.id&&!a.done);
 const insights=useMemo(()=>{
  const ins=[];
  if(ca>0&&caPrev>0){
   const growth=Math.round((ca-caPrev)/caPrev*100);
   if(growth>20)ins.push({type:"success",icon:"📈",text:`CA en hausse de ${growth}% — excellent momentum ! Continue de pousser.`});
   else if(growth<-10)ins.push({type:"danger",icon:"📉",text:`CA en baisse de ${Math.abs(growth)}%. Identifie les 2 causes principales et agis cette semaine.`});
   else ins.push({type:"info",icon:"📊",text:`CA stable (${growth>0?"+":""}${growth}%). Cherche un levier de croissance à activer.`});
  }
  if(ca>0){const mPct=Math.round((ca-ch)/ca*100);
   if(mPct<20)ins.push({type:"warning",icon:"💸",text:`Marge à ${mPct}% — trop basse. Objectif : passer à 40%+ en optimisant les charges.`});
   else if(mPct>60)ins.push({type:"success",icon:"💎",text:`Marge excellente à ${mPct}%. Réinvestis dans l'acquisition.`});
  }
  if(openActs.length>3)ins.push({type:"warning",icon:"📋",text:`${openActs.length} actions ouvertes. Ferme-en 2 cette semaine avant d'en créer de nouvelles.`});
  if(nextMs)ins.push({type:"info",icon:"🏆",text:`Prochain milestone : "${nextMs.label}" — ${nextMs.desc}. Tu y es presque !`});
  if(hs.grade==="D"||hs.grade==="F")ins.push({type:"danger",icon:"⚠️",text:`Grade ${hs.grade} — focus sur ${hs.obj<hs.growth?"les objectifs":"la croissance"} en priorité.`});
  if(ins.filter(i=>i.type==="success").length>=2)ins.push({type:"success",icon:"🔥",text:"Tu es en feu ! Garde ce rythme et documente ce qui marche dans la Knowledge Base."});
  return ins;
 },[ca,caPrev,ch,openActs,nextMs,hs]);
 const typeStyles={danger:{bg:C.rD,color:C.r},warning:{bg:C.oD,color:C.o},success:{bg:C.gD,color:C.g},info:{bg:C.bD,color:C.b}};
 return <Card accent={C.v} style={{padding:14,marginTop:8}}>
  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
   <span style={{fontSize:16}}>🧠</span>
   <div><div style={{fontWeight:800,fontSize:12,color:C.v}}>Coach IA</div><div style={{fontSize:8,color:C.td}}>Brief hebdomadaire personnalisé</div></div>
  </div>
  {insights.length===0&&<div style={{color:C.td,fontSize:11,textAlign:"center",padding:10}}>Soumets un rapport pour activer le coaching</div>}
  {insights.map((ins,i)=>{const st=typeStyles[ins.type]||typeStyles.info;
   return <div key={i} className={`fu d${Math.min(i+1,6)}`} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"6px 8px",background:st.bg,borderRadius:6,marginBottom:4}}>
    <span style={{fontSize:12,flexShrink:0,marginTop:1}}>{ins.icon}</span>
    <div style={{fontSize:10,color:C.t,lineHeight:1.4}}>{ins.text}</div>
   </div>;
  })}
 </Card>;
}
/* CLIENTS PANEL (per-société CRM) */
function ClientsPanelSafe(props){return <ErrorBoundary label="Erreur dans la page Clients"><ClientsPanelInner {...props}/></ErrorBoundary>;}
function ClientsPanelInner({soc,clients,saveClients,ghlData,socBankData,invoices,saveInvoices,stripeData,onSelectClient}){
 const[editCl,setEditCl]=useState(null);const[filter,setFilter]=useState("all");const[stageFilter,setStageFilter]=useState("all");const[invView,setInvView]=useState(null);
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
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:6,marginBottom:12}}>
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
   <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
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
   <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
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
  <Modal open={!!editCl} onClose={()=>setEditCl(null)} title={editCl?.name?"Modifier client":"Nouveau client"} wide>
   {editCl&&(()=>{
    const b=editCl.billing||{type:"fixed"};const bt=BILL_TYPES[b.type];
    return <>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,padding:"6px 10px",background:editCl.ghlId?C.gD:C.oD,borderRadius:8,border:`1px solid ${editCl.ghlId?C.g+"33":C.o+"33"}`}}>
    <span style={{fontSize:12}}>{editCl.ghlId?"✅":"⚠️"}</span>
    <span style={{fontSize:10,fontWeight:600,color:editCl.ghlId?C.g:C.o}}>{editCl.ghlId?"Synced avec GHL":"Local uniquement"}</span>
    {editCl.ghlId&&<span style={{fontSize:8,color:C.td,marginLeft:"auto",fontFamily:"monospace"}}>{editCl.ghlId.slice(0,12)}…</span>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Nom du contact" value={editCl.name} onChange={v=>setEditCl({...editCl,name:v})} placeholder="Ex: Marion Pothin"/>
    <Inp label="Entreprise" value={editCl.company||""} onChange={v=>setEditCl({...editCl,company:v})} placeholder="Ex: Studio Fitness Paris"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Montant" value={b.amount} onChange={v=>setEditCl({...editCl,billing:{...b,amount:pf(v)}})} type="number" suffix="€"/>
    <Sel label="Fréquence" value={b.freq||"monthly"} onChange={v=>setEditCl({...editCl,billing:{...b,freq:v}})} options={[{v:"monthly",l:"Mensuel"},{v:"annual",l:"Annuel"}]}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Pourcentage" value={b.percent||0} onChange={v=>setEditCl({...editCl,billing:{...b,percent:pf(v)}})} type="number" suffix="%"/>
    <Sel label="Base de calcul" value={b.basis||"ca"} onChange={v=>setEditCl({...editCl,billing:{...b,basis:v}})} options={[{v:"ca",l:"% du CA"},{v:"benefice",l:"% du bénéfice"}]}/>
    </div>
    <Inp label="Date de début" value={b.startDate||""} onChange={v=>setEditCl({...editCl,billing:{...b,startDate:v}})} type="date"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="CA mensuel du client" value={editCl.clientCA||""} onChange={v=>setEditCl({...editCl,clientCA:pf(v)})} type="number" suffix="€"/>
    {b.basis==="benefice"&&<Inp label="Charges client" value={editCl.clientCharges||""} onChange={v=>setEditCl({...editCl,clientCharges:pf(v)})} type="number" suffix="€"/>}
    </div>
    {(editCl.clientCA||0)>0&&(b.percent||0)>0&&<div style={{padding:"6px 8px",background:C.vD,borderRadius:6,fontSize:10,color:C.v,fontWeight:600,marginTop:4}}>
    Revenu estimé : {fmt(clientMonthlyRevenue(editCl))}€/mois ({b.percent}% de {b.basis==="benefice"?fmt(Math.max(0,(editCl.clientCA||0)-(editCl.clientCharges||0))):fmt(editCl.clientCA)}€)
    </div>}
    </>}
    {b.type==="hybrid"&&<>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Montant fixe" value={b.amount} onChange={v=>setEditCl({...editCl,billing:{...b,amount:pf(v)}})} type="number" suffix="€"/>
    <Sel label="Fréquence" value={b.freq||"monthly"} onChange={v=>setEditCl({...editCl,billing:{...b,freq:v}})} options={[{v:"monthly",l:"Mensuel"},{v:"annual",l:"Annuel"}]}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Pourcentage" value={b.percent||0} onChange={v=>setEditCl({...editCl,billing:{...b,percent:pf(v)}})} type="number" suffix="%"/>
    <Sel label="Base de calcul" value={b.basis||"ca"} onChange={v=>setEditCl({...editCl,billing:{...b,basis:v}})} options={[{v:"ca",l:"% du CA"},{v:"benefice",l:"% du bénéfice"}]}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Engagement (mois)" value={b.commitment||0} onChange={v=>setEditCl({...editCl,billing:{...b,commitment:pf(v)}})} type="number" suffix="mois"/>
    <Inp label="Date de début" value={b.startDate||""} onChange={v=>setEditCl({...editCl,billing:{...b,startDate:v}})} type="date"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="CA mensuel du client" value={editCl.clientCA||""} onChange={v=>setEditCl({...editCl,clientCA:pf(v)})} type="number" suffix="€"/>
    {b.basis==="benefice"&&<Inp label="Charges client" value={editCl.clientCharges||""} onChange={v=>setEditCl({...editCl,clientCharges:pf(v)})} type="number" suffix="€"/>}
    </div>
    {((b.amount||0)>0||(b.percent||0)>0)&&<div style={{padding:"8px 10px",background:"rgba(236,72,153,.1)",borderRadius:6,fontSize:10,color:"#ec4899",fontWeight:600,marginTop:4}}>
    Fixe: {fmt(b.amount)}€/mois + Variable: {b.percent}% = <strong>{fmt(clientMonthlyRevenue(editCl))}€/mois estimé</strong>
    </div>}
    </>}
    {b.type==="oneoff"&&<>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Montant total" value={b.amount||0} onChange={v=>setEditCl({...editCl,billing:{...b,amount:pf(v)}})} type="number" suffix="€"/>
    <Inp label="Produit / Offre" value={b.product||""} onChange={v=>setEditCl({...editCl,billing:{...b,product:v}})} placeholder="Ex: Accompagnement Pub"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 10px"}}>
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
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
function genInsights(evo,hs,rw,myActions,soc,reps,allM){
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
function calcBenchmark(soc,reps,socs,cM2){
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
function getPlaybooks(evo,hs,rw,clients){
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

function GoalEditor({goals,setGoals,evo}){
 const last=evo.length>0?evo[evo.length-1]:null;
 return <div style={{marginBottom:14}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>🎯 MES OBJECTIFS DU MOIS</div>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
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
function CelebrationOverlay({milestone,onClose}){
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
function MeetingPrepView({soc,evo,myActions,myJournal,pulses,hs,rw,milestones,cM2,insights}){
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
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:6,marginBottom:10}}>
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

function CollapsibleSection({title,icon,children,defaultOpen=false}){
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

function SocSettingsPanel({soc,save,socs}){
 const[form,setForm]=useState({nom:soc.nom,porteur:soc.porteur,act:soc.act,color:soc.color,logo:soc.logo||"",email:soc.email||"",phone:soc.phone||"",desc:soc.desc||"",logoUrl:soc.logoUrl||"",brandColor:soc.brandColor||"",brandColorSecondary:soc.brandColorSecondary||""});
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
    const saveMeta=()=>{try{localStorage.setItem(metaKey,JSON.stringify(metaForm));sSet(metaKey,metaForm);}catch{}setMetaSaved(true);setTimeout(()=>setMetaSaved(false),2000);};
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
  <Btn onClick={doSave}>💾 Sauvegarder</Btn>
 </Sect>;
}
/* NOTIFICATION CENTER (Porteur) */
function genPorteurNotifications(soc,reps,socBank,ghlData,clients,allM){
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
function NotificationCenter({notifications,open,onClose}){
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
function PorteurAIChat({soc,reps,allM,socBank,ghlData,clients}){
 const[open,setOpen]=useState(false);const[msgs,setMsgs]=useState([]);const[typing,setTyping]=useState(false);const[revealIdx,setRevealIdx]=useState(-1);const[revealLen,setRevealLen]=useState(0);const ref=useRef(null);
 const cm=curM();const pm=prevM(cm);
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
  // Bank transactions this month
  const excluded=EXCLUDED_ACCOUNTS[soc.id]||[];
  const monthTxns=(bankData?.transactions||[]).filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(excluded.includes(leg.account_id))return false;return(t.created_at||"").startsWith(cm);});
  const monthIncome=monthTxns.filter(t=>(t.legs?.[0]?.amount||0)>0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0);

  // Pattern matching
  if(ql.match(/combien.*client.*actif|clients actifs|nombre.*client/)){
   return `👥 **Clients actifs — ${soc.nom}**\n\n✅ ${activeCl.length} clients actifs\n📊 MRR : ${fmt(mrr)}€/mois\n❌ ${churnedCl.length} clients perdus\n📈 Rétention : ${myCl.length>0?Math.round((1-churnedCl.length/myCl.length)*100):100}%`;
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
  if(ql.match(/resume|brief|résumé|synthese|vue.*ensemble/)){
   const openO=opps.filter(o=>o.status==="open");const pVal=openO.reduce((a,o)=>a+(o.value||0),0);
   return `📋 **Résumé — ${soc.nom} — ${ml(cm)}**\n\n💰 CA : ${fmt(ca)}€${monthGoal>0?` / ${fmt(monthGoal)}€ (${Math.round(ca/monthGoal*100)}%)`:""}\n📉 Charges : ${fmt(ch)}€\n📊 Marge : ${fmt(marge)}€ (${margePct}%)\n🏦 Trésorerie : ${fmt(balance)}€\n\n👥 ${activeCl.length} clients actifs · MRR ${fmt(mrr)}€\n🔄 Pipeline : ${openO.length} deals (${fmt(pVal)}€)\n📅 ${calEvts.filter(e=>new Date(e.startTime||0)>new Date()).length} RDV à venir\n🟢 ${ghlCl.length} contacts GHL\n\n${trend>0?"📈 Tendance positive !":"📉 Surveille la tendance."}`;
  }
  if(ql.match(/depense|charge|cout/)){
   const catTotals={};
   if(bankData?.transactions){bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(excluded.includes(leg.account_id))return false;return(t.created_at||"").startsWith(cm)&&leg.amount<0;}).forEach(t=>{const cat=categorizeTransaction(t);const amt=Math.abs(t.legs?.[0]?.amount||0);catTotals[cat.label]=(catTotals[cat.label]||0)+amt;});}
   const sorted2=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
   return `💸 **Dépenses — ${ml(cm)}**\n\nTotal : ${fmt(ch)}€\nTrésorerie : ${fmt(balance)}€\n\n${sorted2.length>0?"Par catégorie :\n"+sorted2.slice(0,5).map(([k,v])=>`  • ${k} : ${fmt(v)}€`).join("\n"):"Pas assez de données."}\n\n${balance<2000?"⚠️ Trésorerie basse.":"✅ Trésorerie OK."}`;
  }
  return `🤖 Je peux répondre sur : clients, CA, paiements, RDV, pipeline, conversion. Essaie une de ces questions !`;
 };
 const QUICK=[{q:"Résumé",icon:"📋"},{q:"Quel est mon CA ce mois ?",icon:"📊"},{q:"Qui n'a pas payé ?",icon:"💸"},{q:"Prochains RDV",icon:"📅"},{q:"Top clients",icon:"🏅"},{q:"Combien dans le pipeline ?",icon:"🔄"}];
 const ask=(q)=>{
  setMsgs(prev=>[...prev,{role:"user",content:q}]);setTyping(true);
  const answer=computeAnswer(q);
  setTimeout(()=>{setTyping(false);setMsgs(prev=>{const newMsgs=[...prev,{role:"assistant",content:answer}];setRevealIdx(newMsgs.length-1);setRevealLen(0);return newMsgs;});},800);
 };
 // Typing animation
 useEffect(()=>{
  if(revealIdx<0||revealIdx>=msgs.length)return;
  const full=msgs[revealIdx]?.content||"";
  if(revealLen>=full.length){setRevealIdx(-1);return;}
  const t=setTimeout(()=>setRevealLen(prev=>Math.min(prev+3,full.length)),15);
  return()=>clearTimeout(t);
 },[revealIdx,revealLen,msgs]);
 useEffect(()=>{ref.current?.scrollTo({top:ref.current.scrollHeight,behavior:"smooth"});},[msgs,revealLen]);
 if(!open)return <div onClick={()=>setOpen(true)} style={{position:"fixed",bottom:24,right:24,width:56,height:56,borderRadius:28,background:`linear-gradient(135deg,${C.v},${C.acc})`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:`0 4px 20px ${C.acc}44`,zIndex:800,fontSize:24,animation:"fl 3s ease-in-out infinite",transition:"transform .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>🤖</div>;
 return <div style={{position:"fixed",bottom:24,right:24,width:400,maxWidth:"90vw",height:520,maxHeight:"75vh",background:"rgba(14,14,22,.85)",backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,boxShadow:"0 12px 48px rgba(0,0,0,.5)",zIndex:800,display:"flex",flexDirection:"column",animation:"slideInUp .3s ease",overflow:"hidden"}}>
  <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.brd}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:`linear-gradient(135deg,${C.card2},${C.card})`}}>
   <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>🤖</span><div><div style={{fontWeight:800,fontSize:12,color:C.v}}>Assistant IA</div><div style={{fontSize:8,color:C.td}}>{soc.nom}</div></div></div>
   <Btn v="ghost" small onClick={()=>setOpen(false)}>✕</Btn>
  </div>
  <div ref={ref} style={{flex:1,overflowY:"auto",padding:12}}>
   {msgs.length===0&&<div style={{textAlign:"center",padding:"20px 10px"}}><div style={{fontSize:28,marginBottom:8}}>🤖</div><div style={{fontSize:12,color:C.td,marginBottom:14}}>Pose-moi une question sur tes données</div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>{QUICK.map((q,i)=><button key={i} onClick={()=>ask(q.q)} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.card2,color:C.t,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FONT,textAlign:"left",display:"flex",alignItems:"center",gap:8,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.acc;e.currentTarget.style.background=C.accD;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.background=C.card2;}}><span style={{fontSize:16}}>{q.icon}</span>{q.q}</button>)}</div>
   </div>}
   {msgs.map((m,i)=>{
    const isRevealing=i===revealIdx;
    const displayContent=isRevealing?m.content.slice(0,revealLen):m.content;
    return <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:8}}>
     <div style={{maxWidth:"85%",padding:"8px 12px",borderRadius:10,background:m.role==="user"?C.acc+"22":C.card2,border:`1px solid ${m.role==="user"?C.acc+"44":C.brd}`,fontSize:11,lineHeight:1.6,color:C.t,whiteSpace:"pre-wrap"}}>
      {m.role==="assistant"&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}><span style={{fontSize:12}}>🤖</span><span style={{fontWeight:700,fontSize:9,color:C.v}}>ASSISTANT</span></div>}
      {displayContent}{isRevealing&&<span style={{animation:"pulse 1s infinite"}}>▎</span>}
     </div>
    </div>;
   })}
   {typing&&<div style={{padding:"8px 12px",background:C.card2,borderRadius:10,border:`1px solid ${C.brd}`,display:"inline-block"}}><span className="dots" style={{fontSize:16}}><span>·</span><span>·</span><span>·</span></span></div>}
  </div>
  <div style={{padding:"6px 10px",borderTop:`1px solid ${C.brd}`,display:"flex",gap:3,flexWrap:"wrap"}}>
   {QUICK.map((q,i)=><button key={i} onClick={()=>ask(q.q)} style={{padding:"3px 8px",borderRadius:12,fontSize:8,fontWeight:600,border:`1px solid ${C.brd}`,background:C.card2,color:C.td,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.acc;e.currentTarget.style.color=C.acc;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.td;}}>{q.icon} {q.q}</button>)}
  </div>
 </div>;
}
/* ADMIN LEADERBOARD CARD */
function LeaderboardCard({socs,reps,allM,actions,pulses,socBank}){
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
function PulseDashWidget({soc,existing,savePulse,hold}){
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
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
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
function PorteurDashboard({soc,reps,allM,socBank,ghlData,setPTab,pulses,savePulse,hold,clients,stripeData}){
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
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
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
   {smartAlerts.slice(0,3).map((a,i)=><div key={a.id} className={`glass-card-static fu d${i+1}`} style={{padding:"10px 14px",marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
    <span style={{fontSize:14}}>{a.icon}</span>
    <span style={{flex:1,fontSize:11,fontWeight:600,color:C.t}}>{a.text}</span>
    <button onClick={()=>dismissAlert(a.id)} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:12,padding:2}}>✕</button>
   </div>)}
   {smartAlerts.length>3&&<button onClick={()=>setPTab(1)} style={{background:"none",border:"none",color:C.acc,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT,marginTop:4}}>Voir tout ({smartAlerts.length}) →</button>}
  </div>}
  {/* Performance Score + Prévisionnel row */}
  <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:12,marginBottom:16}}>
   <div className="glass-card-static" style={{padding:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minWidth:100}}>
    <div style={{position:"relative",width:72,height:72,marginBottom:6}}>
     <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="30" fill="none" stroke={C.brd} strokeWidth="6"/><circle cx="36" cy="36" r="30" fill="none" stroke={perfColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${perfScore*1.884} 188.4`} transform="rotate(-90 36 36)" style={{transition:"stroke-dasharray .8s ease"}}/></svg>
     <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:perfColor}}>{perfScore}</div>
    </div>
    <div style={{fontSize:8,fontWeight:700,color:C.td,letterSpacing:.5,textAlign:"center",fontFamily:FONT_TITLE}}>SCORE PERFORMANCE</div>
   </div>
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
   return <div className="kpi-grid-responsive" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
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
  {/* 📣 META ADS */}
  {(()=>{
   const metaKey=`metaAds_${soc.id}_${cm}`;const metaPrevKey=`metaAds_${soc.id}_${pm}`;
   let metaRaw=null;try{metaRaw=JSON.parse(localStorage.getItem(metaKey));}catch{}
   let metaPrev=null;try{metaPrev=JSON.parse(localStorage.getItem(metaPrevKey));}catch{}
   if(!metaRaw||!metaRaw.spend)return <div className="fade-up glass-card-static" style={{padding:20,marginBottom:20,animationDelay:"0.32s",borderLeft:`3px solid ${C.acc}`}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
     <div><div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,fontFamily:FONT_TITLE}}>📣 PUBLICITÉ META</div><div style={{fontSize:11,color:C.td,marginTop:4}}>Aucune donnée pub — Renseignez dans Paramètres</div></div>
     <button onClick={()=>setPTab(12)} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.acc}44`,background:C.accD,color:C.acc,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>⚙️ Paramètres</button>
    </div>
   </div>;
   const sp=metaRaw.spend||0,imp=metaRaw.impressions||0,clk=metaRaw.clicks||0,lds=metaRaw.leads||0,rev=metaRaw.revenue||0;
   const cpl=lds>0?sp/lds:0,cpc=clk>0?sp/clk:0,cpm=imp>0?(sp/imp)*1000:0,roas=sp>0?rev/sp:0;
   const ctr=imp>0?(clk/imp)*100:0;
   const clientsWon=(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.status==="won"&&(o.updatedAt||"").startsWith(cm)).length;
   const cpa=clientsWon>0?sp/clientsWon:0;
   // Prev month comparisons
   const pSp=metaPrev?.spend||0,pImp=metaPrev?.impressions||0,pClk=metaPrev?.clicks||0,pLds=metaPrev?.leads||0,pRev=metaPrev?.revenue||0;
   const pCpl=pLds>0?pSp/pLds:0,pCpc=pClk>0?pSp/pClk:0,pCpm=pImp>0?(pSp/pImp)*1000:0,pRoas=pSp>0?pRev/pSp:0;
   const trend2=(cur,prev)=>prev>0?Math.round((cur-prev)/prev*100):0;
   const roasColor=roas>=2?C.g:roas>=1?C.o:C.r;
   const costColor=(cur,prev)=>prev>0?(cur<=prev?C.g:C.r):C.td;
   const metaKpis=[
    {label:"CPL",value:`${cpl.toFixed(2)}€`,sub:"Coût par Lead",color:costColor(cpl,pCpl),trend:trend2(cpl,pCpl),invert:true},
    {label:"CPC",value:`${cpc.toFixed(2)}€`,sub:"Coût par Clic",color:costColor(cpc,pCpc),trend:trend2(cpc,pCpc),invert:true},
    {label:"CPM",value:`${cpm.toFixed(2)}€`,sub:"Coût / 1000 imp.",color:costColor(cpm,pCpm),trend:trend2(cpm,pCpm),invert:true},
    {label:"ROAS",value:`${roas.toFixed(2)}x`,sub:"Return on Ad Spend",color:roasColor,trend:trend2(roas,pRoas),invert:false},
   ];
   return <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.32s"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📣 PUBLICITÉ META — {ml(cm)}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
     {metaKpis.map((k,i)=><div key={i} style={{padding:14,background:k.color+"10",border:`1px solid ${k.color}22`,borderRadius:12,textAlign:"center"}}>
      <div style={{fontWeight:900,fontSize:22,color:k.color,lineHeight:1}}>{k.value}</div>
      <div style={{fontSize:9,fontWeight:700,color:C.td,marginTop:4}}>{k.label}</div>
      {k.trend!==0&&<div style={{fontSize:9,fontWeight:600,color:k.invert?(k.trend>0?C.r:C.g):(k.trend>0?C.g:C.r),marginTop:2}}>{k.trend>0?"↑":"↓"} {Math.abs(k.trend)}%</div>}
     </div>)}
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
     {[{l:"Budget dépensé",v:`${fmt(sp)}€`},{l:"Impressions",v:fK(imp)},{l:"Clics",v:String(clk)},{l:"Leads",v:String(lds)},{l:"CTR",v:`${ctr.toFixed(1)}%`},{l:"CPA",v:cpa>0?`${cpa.toFixed(2)}€`:"—"}].map((m,i)=>
      <span key={i} style={{padding:"5px 12px",borderRadius:20,fontSize:10,fontWeight:600,background:C.card2,border:`1px solid ${C.brd}`,color:C.t}}><span style={{color:C.td}}>{m.l}:</span> {m.v}</span>
     )}
    </div>
   </div>;
  })()}
  {/* 🌐 FUNNEL SITE WEB */}
  {(()=>{
   let metaRaw2=null;try{metaRaw2=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${cm}`));}catch{}
   const imp2=metaRaw2?.impressions||0,clk2=metaRaw2?.clicks||0,lds2=metaRaw2?.leads||0;
   let landingVisitors=clk2;try{const lv=localStorage.getItem(`metaLanding_${soc.id}_${cm}`);if(lv)landingVisitors=parseInt(lv)||clk2;}catch{}
   const calEvts2=(ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.startTime||"").startsWith(cm));
   const stratCalls3=calEvts2.filter(e=>!/int[eé]g/i.test(e.title||"")&&!/int[eé]g/i.test(e.calendarName||"")).length;
   const clientsWon2=(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.status==="won"&&(o.updatedAt||"").startsWith(cm)).length;
   const funnelSteps=[
    {label:"Impressions",count:imp2,color:"#60a5fa"},
    {label:"Clics",count:clk2,color:"#818cf8"},
    {label:"Visiteurs landing",count:landingVisitors,color:"#a78bfa"},
    {label:"Leads",count:lds2,color:"#FFAA00"},
    {label:"Appels bookés",count:stratCalls3,color:"#fb923c"},
    {label:"Clients signés",count:clientsWon2,color:"#34d399"},
   ];
   if(!imp2&&!lds2&&!stratCalls3)return null;
   const maxCount=Math.max(1,...funnelSteps.map(s=>s.count));
   return <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.34s"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>🌐 FUNNEL SITE WEB — {ml(cm)}</div>
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
     {funnelSteps.map((f,i)=>{const w=Math.max(15,Math.round(f.count/maxCount*100));const conv=i>0&&funnelSteps[i-1].count>0?((f.count/funnelSteps[i-1].count)*100).toFixed(1):null;
      return <Fragment key={i}>
       {i>0&&conv&&<div style={{fontSize:9,color:C.td,fontWeight:700,textAlign:"center",padding:"3px 0"}}>↓ {conv}%</div>}
       <div style={{width:`${w}%`,margin:"0 auto",background:`linear-gradient(135deg,${f.color}22,${f.color}11)`,border:`1px solid ${f.color}44`,borderRadius:10,padding:"12px 14px",textAlign:"center",transition:"all .3s"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
         <span style={{fontWeight:900,fontSize:20,color:f.color}}>{f.count>1000?fK(f.count):f.count}</span>
         <span style={{fontSize:10,color:C.td,fontWeight:600}}>{f.label}</span>
        </div>
       </div>
      </Fragment>;
     })}
    </div>
   </div>;
  })()}
  {/* Pulse widget */}
  {(()=>{const w=curW();const existing=pulses?.[`${soc.id}_${w}`];return <PulseDashWidget soc={soc} existing={existing} savePulse={savePulse} hold={hold}/>;})()}
  {/* Today's Agenda Summary + Alerts */}
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
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
  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
   {[{icon:"👥",title:"Mes clients",sub:"Voir le portefeuille",tab:9},{icon:"🏦",title:"Transactions",sub:"Historique bancaire",tab:5},{icon:"⚙️",title:"Paramètres",sub:"Configurer ma société",tab:12}].map((a,i)=>
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
 </div>;
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
}
/* ===== INBOX PANEL ===== */
function InboxPanel({soc,ghlData,socBankData,clients}){
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
function AgendaPanel({soc,ghlData}){
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
function ConversationsPanel({soc}){
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
function TodoPanel({soc,ghlData,socBankData,clients}){
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
function PipelineKanbanPanel({soc,ghlData}){
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
function RessourcesPanel({soc,clients}){
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
function ActivitePanel({soc,ghlData,socBankData,clients}){
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
function ClientsUnifiedPanel({soc,clients,saveClients,ghlData,socBankData,invoices,saveInvoices,stripeData}){
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
function calcClientHealthScore(cl,socBankData,ghlData,soc){
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
function HealthBadge({score}){
 const color=score>70?C.g:score>=40?C.o:C.r;
 return <span style={{width:24,height:24,borderRadius:12,background:color+"22",border:`2px solid ${color}`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color,flexShrink:0}}>{score}</span>;
}

function SocieteView({soc,reps,allM,save,onLogout,actions,journal,pulses,saveAJ,savePulse,socBankData,syncSocBank,okrs,saveOkrs,kb,saveKb,socs,subs,saveSubs,team,saveTeam,clients,saveClients,ghlData,invoices,saveInvoices,hold,onTour,onThemeToggle,stripeData}){
 const cM2=curM();const[pTab,setPTab]=useState(0);const[mo,setMo]=useState(cM2);
 const[f,setF]=useState(()=>gr(reps,soc.id,cM2)||{...BF});const[done,setDone]=useState(false);const[showPub,setShowPub]=useState(false);const[jText,setJText]=useState("");
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
   <button onClick={()=>setNotifOpen(true)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",position:"relative",padding:4}}>🔔{porteurNotifs.length>0&&<span style={{position:"absolute",top:0,right:0,width:14,height:14,borderRadius:7,background:C.r,color:"#fff",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{porteurNotifs.length}</span>}</button>
  </div>
  {/* Mobile sidebar overlay */}
  {mobileMenuOpen&&<div className="fi" onClick={()=>setMobileMenuOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:150}}><div onClick={e=>e.stopPropagation()} style={{width:240,height:"100vh",background:C.card,borderRight:`1px solid ${C.brd}`,overflowY:"auto"}}>
   <Sidebar items={SB_PORTEUR} activeTab={pTab} setTab={t=>{setPTab(t);setMobileMenuOpen(false);}} brandTitle={soc.nom} brandSub={soc.porteur} onLogout={onLogout} onTour={onTour||(() => {})} onThemeToggle={onThemeToggle} dataTourPrefix="porteur" brand={{logoUrl:soc.logoUrl||"",logoLetter:(soc.nom||"?")[0],accentColor:soc.brandColor||soc.color}} extra={null}/>
  </div></div>}
  <div className="sidebar-desktop"><Sidebar items={SB_PORTEUR} activeTab={pTab} setTab={setPTab} brandTitle={soc.nom} brandSub={`${soc.porteur}${soc.incub?" · "+sinceLbl(soc.incub):""}`} onLogout={onLogout} onTour={onTour||(() => {})} onThemeToggle={onThemeToggle} dataTourPrefix="porteur" brand={{logoUrl:soc.logoUrl||"",logoLetter:(soc.nom||"?")[0],accentColor:soc.brandColor||soc.color}} extra={<div style={{display:"flex",alignItems:"center",gap:6}}>
   <button onClick={()=>setNotifOpen(true)} style={{background:"none",border:"none",cursor:"pointer",position:"relative",fontSize:16,padding:"2px 4px"}}>🔔{porteurNotifs.length>0&&<span style={{position:"absolute",top:-2,right:-2,width:14,height:14,borderRadius:7,background:C.r,color:"#fff",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{porteurNotifs.length}</span>}</button>
  </div>}/></div>
  <div className="main-content" style={{flex:1,minWidth:0,height:"100vh",overflow:"auto"}}>
  {/* AI Chat Bubble */}
  <PorteurAIChat soc={soc} reps={reps} allM={allM} socBank={socBankData?{[soc.id]:socBankData}:{}} ghlData={ghlData} clients={clients}/>
  {celebMs&&<CelebrationOverlay milestone={celebMs} onClose={()=>setCelebMs(null)}/>}
  <div style={{padding:"16px 16px 16px",maxWidth:680,margin:"0 auto"}}>
  {/* === PORTEUR DASHBOARD (pTab 0) === */}
  {pTab===0&&<PorteurDashboard soc={soc} reps={reps} allM={allM} socBank={socBankData?{[soc.id]:socBankData}:{}} ghlData={ghlData} setPTab={setPTab} soc2={soc} clients={clients} pulses={pulses} savePulse={savePulse} hold={hold} stripeData={stripeData}/>}
  {pTab===5&&<><SocBankWidget bankData={socBankData} onSync={()=>syncSocBank(soc.id)} soc={soc}/>
   <SubsTeamPanel socs={[soc]} subs={subs} saveSubs={saveSubs} team={team} saveTeam={saveTeam} socId={soc.id} reps={reps} socBankData={socBankData}/>
  </>}
  {pTab===9&&<ErrorBoundary label="Clients"><ClientsUnifiedPanel soc={soc} clients={clients} saveClients={saveClients} ghlData={ghlData} socBankData={socBankData} invoices={invoices} saveInvoices={saveInvoices} stripeData={stripeData}/></ErrorBoundary>}
  {pTab===13&&<ErrorBoundary label="Rapports"><RapportsPanel soc={soc} socBankData={socBankData} ghlData={ghlData} clients={clients}/></ErrorBoundary>}
  {pTab===12&&<SocSettingsPanel soc={soc} save={save} socs={socs}/>}
  {pTab===1&&<ErrorBoundary label="Activité"><ActivitePanel soc={soc} ghlData={ghlData} socBankData={socBankData} clients={clients}/></ErrorBoundary>}
  </div>
  </div>
 </div>;
}
/* ADMIN VALROW */
function ValRow({s,r,reps,save,hs,delay,onAction,hold}){
 const[open,setOpen]=useState(false);const[cmt,setCmt]=useState(r.comment||"");const[actText,setActText]=useState("");
 const ca=pf(r.ca),ch=pf(r.charges),mrr=pf(r.mrr),pipe=pf(r.pipeline),ts=pf(r.tresoSoc),marge=ca-ch,m=curM();
 const doVal=(wc)=>{
  const finalComment=wc?cmt:r.comment;
  save(null,{...reps,[`${s.id}_${m}`]:{...r,ok:true,comment:finalComment}},null);setOpen(false);
  if(hold?.slack?.enabled&&hold.slack.notifyValidation){
   slackSend(hold.slack,buildValidationSlackMsg(s,finalComment,m));
  }
 };
 const prevR=gr(reps,s.id,prevM(m)),prevCa=prevR?pf(prevR.ca):0;const trend=prevCa>0?pct(ca-prevCa,prevCa):null;
 return <div className={`fu d${delay}`}>
  <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:C.card,borderRadius:open?"12px 12px 0 0":12,border:`1px solid ${C.brd}`,borderBottom:open?"none":`1px solid ${C.brd}`,marginBottom:open?0:5,cursor:"pointer"}} onClick={()=>setOpen(!open)}>
   <GradeBadge grade={hs.grade} color={hs.color}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{s.nom} <span style={{color:C.td,fontWeight:400,fontSize:11}}>· {s.porteur}</span></div></div>
   <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>{trend!=null&&<span style={{fontSize:10,fontWeight:600,color:trend>=0?C.g:C.r}}>{trend>=0?"▲":"▼"}{Math.abs(trend)}%</span>}<span style={{fontWeight:800,fontSize:15}}>{fmt(ca)}€</span>
    {r.ok?<span style={{color:C.g,fontSize:13}}>✓</span>:<button className="ba" onClick={e=>{e.stopPropagation();doVal(false);}} style={{background:C.gD,color:C.g,border:`1px solid ${C.g}33`,borderRadius:6,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Valider</button>}<span style={{color:C.td,fontSize:10,transform:open?"rotate(180deg)":"",transition:"transform .2s"}}>▼</span></div>
  </div>
  {open&&<div className="fu" style={{background:C.card,border:`1px solid ${C.brd}`,borderTop:"none",borderRadius:"0 0 12px 12px",padding:"8px 12px 12px",marginBottom:5}}>
   <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8,fontSize:11,color:C.td}}>
    <span>CA: <strong style={{color:C.t}}>{fmt(ca)}€</strong></span><span>Marge: <strong style={{color:marge>=0?C.g:C.r}}>{fmt(marge)}€</strong></span>
    {s.obj>0&&<span>Obj: <strong style={{color:pct(ca,s.obj)>=100?C.g:C.r}}>{pct(ca,s.obj)}%</strong></span>}
    {s.rec&&mrr>0&&<span>MRR: <strong style={{color:C.b}}>{fmt(mrr)}€</strong></span>}{pipe>0&&<span>Pipe: <strong style={{color:C.acc}}>{fmt(pipe)}€</strong></span>}{ts>0&&<span>Tréso: <strong>{fmt(ts)}€</strong></span>}
   </div>
   {r.notes&&<div style={{fontSize:11,color:C.td,fontStyle:"italic",marginBottom:8,padding:"6px 8px",background:C.bg,borderRadius:6}}>"{r.notes}"</div>}
   <div style={{display:"flex",gap:8,alignItems:"flex-end",marginBottom:8}}><div style={{flex:1}}><Inp label="Commentaire" value={cmt} onChange={setCmt} placeholder="Feedback…" small/></div>
    {!r.ok&&<Btn small v="success" onClick={()=>doVal(true)}>✓ Valider</Btn>}
    {cmt!==r.comment&&<Btn small v="secondary" onClick={()=>{save(null,{...reps,[`${s.id}_${m}`]:{...r,comment:cmt}},null);}}>Envoyer</Btn>}
   </div>
   <div style={{display:"flex",gap:6,alignItems:"center",borderTop:`1px solid ${C.brd}`,paddingTop:8}}>
    <input value={actText} onChange={e=>setActText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&actText.trim()){onAction(s.id,actText.trim());setActText("");}}} placeholder="+ Action…" style={{flex:1,background:C.bg,border:`1px solid ${C.brd}`,borderRadius:6,color:C.t,padding:"6px 8px",fontSize:11,fontFamily:FONT,outline:"none"}}/><Btn small v="secondary" onClick={()=>{if(actText.trim()){onAction(s.id,actText.trim());setActText("");}}}>+</Btn>
   </div>
  </div>}
 </div>;
}
/* SIMULATEUR */
function TabSimulateur({socs,reps,hold}){
 const cM2=curM();const actS=socs.filter(s=>["active","lancement"].includes(s.stat));
 const[simCA,setSimCA]=useState(()=>{const o={};actS.forEach(s=>{const r=gr(reps,s.id,cM2);o[s.id]=r?pf(r.ca):0;});return o;});
 const hcReal=calcH(socs,reps,hold,cM2),hcSim=simH(socs,simCA,hold),diff=hcSim.pf-hcReal.pf;
 return <><Sect title="Simulateur" sub="Ajustez et voyez l'impact en temps réel">{actS.map((s,i)=>{const cur=gr(reps,s.id,cM2);const curCA=cur?pf(cur.ca):0;const v=simCA[s.id]||0;
  return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{padding:"10px 14px",background:C.card,borderRadius:10,border:`1px solid ${C.brd}`,marginBottom:5}}>
   <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:6,height:6,borderRadius:3,background:s.color}}/><span style={{fontWeight:700,fontSize:12}}>{s.nom}</span></div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:C.td,fontSize:10}}>Actuel: {fmt(curCA)}€</span><span style={{fontWeight:800,fontSize:14,color:v>curCA?C.g:v<curCA?C.r:C.t,minWidth:70,textAlign:"right"}}>{fmt(v)}€</span></div></div>
   <input type="range" min={0} max={Math.max(curCA*3,30000)} step={100} value={v} onChange={e=>setSimCA({...simCA,[s.id]:parseInt(e.target.value)})} style={{width:"100%"}}/></div>;})}
 </Sect>
 <Sect title="Impact"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
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

function ObInp({label,value,onChange,type="text",placeholder,required,info,onKeyDown}){
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
function ObTextArea({label,value,onChange,placeholder,rows=3,info}){
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
function ObSelect({label,value,onChange,options,placeholder,required}){
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
function ObCheck({checked,onChange,label}){
 return <label style={{display:"flex",alignItems:"flex-start",gap:9,cursor:"pointer",fontSize:12.5,color:C.t,lineHeight:1.5,fontFamily:FONT,marginBottom:10}}>
  <div onClick={e=>{e.preventDefault();onChange(!checked);}}
   style={{width:18,height:18,minWidth:18,borderRadius:5,marginTop:1,border:checked?"none":`1.5px solid ${C.brd}`,background:checked?`linear-gradient(135deg,${C.acc},#FF9D00)`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",cursor:"pointer"}}>
   {checked&&<span style={{color:"#0a0a0f",fontSize:11,fontWeight:900}}>✓</span>}
  </div>
  <span>{label}</span>
 </label>;
}
function ObTag({selected,onToggle,options}){
 return <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{options.map(o=>{const sel=selected.includes(o);return <button key={o} onClick={()=>onToggle(o)}
  style={{padding:"7px 14px",borderRadius:20,fontSize:11.5,fontWeight:sel?700:400,border:`1.5px solid ${sel?C.acc:C.brd}`,background:sel?C.accD:"transparent",color:sel?C.acc:C.td,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>{o}</button>;})}</div>;
}

function OnboardingWizard({onComplete,onSkip,hold}){
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
const TOUR_ADMIN=[
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

const TOUR_PORTEUR=[
 {target:"porteur-nav",tab:10,title:"Votre espace",icon:"🧭",desc:"La sidebar organise vos modules : Accueil (vue d'ensemble), Rapport, Performance, Suivi, Banque, Clients et Ressources.",pos:"right",highlight:C.acc},
 {target:"porteur-tab-10",tab:10,title:"Accueil",icon:"◉",desc:"Votre tableau de bord personnel : nudges d'actions à faire, KPIs du mois, évolution du CA, trophées et activité récente. Tout en un coup d'œil.",pos:"right",highlight:C.acc},
 {target:"porteur-tab-0",tab:0,title:"Rapport mensuel",icon:"📊",desc:"Renseignez CA, charges, clients et trésorerie chaque mois. Les champs avancés (détail charges, funnel, pub) sont dans des sections dépliables.",pos:"right",highlight:C.o},
 {target:"porteur-tab-1",tab:1,title:"Statistiques",icon:"📈",desc:"Performance > Stats : KPIs, score de santé A-F, graphes CA/marge. Les détails (finances, prévisions, funnel) se déplient à la demande.",pos:"right",highlight:C.g},
 {target:"porteur-tab-2",tab:2,title:"Activité",icon:"✅",desc:"Suivi > Activité : vos actions à faire, journal stratégique et historique fusionnés en un seul fil chronologique.",pos:"right",highlight:C.b},
 {target:"porteur-tab-4",tab:4,title:"Pulse hebdomadaire",icon:"💓",desc:"Suivi > Pulse : mood, victoire, blocage et confiance chaque semaine. Signal rapide pour Scale Corp.",pos:"right",highlight:C.o},
 {target:"porteur-tab-6",tab:6,title:"Milestones",icon:"🏆",desc:"Performance > Milestones : achievements automatiques, 5 tiers de Bronze à Diamant.",pos:"right",highlight:C.acc},
 {target:"porteur-tab-9",tab:9,title:"Gestion Clients",icon:"👥",desc:"Portefeuille clients : statuts, historique, facturation. Gérez le cycle de vie client.",pos:"right",highlight:C.o},
];

function TutorialOverlay({steps,onFinish,onSkip,setActiveTab}){
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
const SB_ADMIN=[
 {id:"dash",icon:"◉",label:"Dashboard",tab:0,accent:C.acc},
 {id:"portfolio",icon:"▣",label:"Portfolio",accent:C.b,children:[
  {icon:"📋",label:"Sociétés",tab:1},
  {icon:"📊",label:"Analytique",tab:2},
  {icon:"⚡",label:"Challenges",tab:12},
 ]},
 {id:"finance",icon:"💰",label:"Finance",accent:C.g,children:[
  {icon:"🏛",label:"Holding",tab:4},
  {icon:"🏦",label:"Banque",tab:8},
  {icon:"📐",label:"Simulateur",tab:3},
  {icon:"🔄",label:"Charges & Équipe",tab:13},
 ]},
 {id:"commercial",icon:"🎯",label:"Commercial",accent:C.o,children:[
  {icon:"◎",label:"Pipeline",tab:6},
  {icon:"📇",label:"CRM",tab:7},
  {icon:"🤝",label:"Synergies",tab:10},
 ]},
 {id:"copilot",icon:"✦",label:"AI Copilot",tab:5,accent:"#a78bfa"},
 {id:"kb",icon:"📚",label:"Ressources",tab:11,accent:C.v},
];

const SB_PORTEUR=[
 {id:"dashboard",icon:"📊",label:"Dashboard",tab:0,accent:C.acc},
 {id:"activite",icon:"⚡",label:"Activité",tab:1,accent:C.b},
 {id:"clients",icon:"👥",label:"Clients",tab:9,accent:C.o},
 {id:"bank",icon:"🏦",label:"Banque",tab:5,accent:C.g},
 {id:"rapports",icon:"📋",label:"Rapports",tab:13,accent:C.v},
 {id:"settings",icon:"⚙️",label:"Paramètres",tab:12,accent:C.td},
];

function Sidebar({items,activeTab,setTab,brandTitle,brandSub,onLogout,onTour,extra,dataTourPrefix,brand,onThemeToggle}){
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
   <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,border:"none",background:"transparent",color:C.td,fontSize:10,cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"background .12s"}} onMouseEnter={e=>{e.currentTarget.style.background=C.rD;e.currentTarget.style.color=C.r;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.td;}}>
    <span style={{fontSize:12}}>↩</span><span>Déconnexion</span>
   </button>
  </div>
 </aside>;
}

/* MAIN APP */
export default function App(){
 const[loaded,setLoaded]=useState(false);const[role,setRole]=useState(null);const[theme,setThemeState]=useState(getTheme);
 const toggleTheme=useCallback(()=>{const t=getTheme()==="dark"?"light":"dark";applyTheme(t);setThemeState(t);},[]);
 
 const[socs,setSocs]=useState([]);const[reps,setReps]=useState({});const[hold,setHold]=useState(DH);
 const[actions,setActions]=useState([]);const[journal,setJournal]=useState({});
 const[pulses,setPulses]=useState({});const[deals,setDeals]=useState([]);const[ghlData,setGhlData]=useState({});const[revData,setRevData]=useState(null);const[socBank,setSocBank]=useState({});const[stripeData,setStripeData]=useState(null);
 const[okrs,setOkrs]=useState([]);const[synergies,setSynergies]=useState([]);const[kb,setKb]=useState([]);const[challenges,setChallenges]=useState([]);
 const[subs,setSubs]=useState([]);const[team,setTeam]=useState([]);const[clients,setClients]=useState([]);const[invoices,setInvoices]=useState([]);
 const[pin,setPin]=useState("");const[lErr,setLErr]=useState("");const[shake,setShake]=useState(false);
 const[tab,setTab]=useState(0);const[eSoc,setESoc]=useState(null);const[eHold,setEHold]=useState(false);
 const[saving,setSaving]=useState(false);const[meeting,setMeeting]=useState(false);
 const[newActSoc,setNewActSoc]=useState("");const[newActText,setNewActText]=useState("");
 const[onboarded,setOnboarded]=useState(true);const[showTour,setShowTour]=useState(false);const[obData,setObData]=useState(null);const[showOnboarding,setShowOnboarding]=useState(false);
 useEffect(()=>{(async()=>{try{const[s,r,h,a,j,p,d,g,rv,sb,ok,sy,kk,ch,su,tm,cl,iv]=await Promise.all([sGet("scAs"),sGet("scAr"),sGet("scAh"),sGet("scAa"),sGet("scAj"),sGet("scAp"),sGet("scAd"),sGet("scAg"),sGet("scAv"),sGet("scAb"),sGet("scAo"),sGet("scAy"),sGet("scAk"),sGet("scAc"),sGet("scAu"),sGet("scAt"),sGet("scAcl"),sGet("scAiv")]);setSocs(s||DS);setReps(r||mkPrefill());setHold(h||DH);setActions(a||DEMO_ACTIONS);setJournal(j||DEMO_JOURNAL);setPulses(p||DEMO_PULSES);setDeals(d||DEMO_DEALS);setGhlData(g||{});setRevData(rv||null);setSocBank(sb||{});setOkrs(ok||DEMO_OKRS);setSynergies(sy||DEMO_SYNERGIES);setKb(kk||DEMO_KB);setChallenges(ch||[]);setSubs(su||DEMO_SUBS);setTeam(tm||DEMO_TEAM);setClients(cl||DEMO_CLIENTS);setInvoices(iv||mkDemoInvoices(cl||DEMO_CLIENTS,s||DS));}catch{setSocs(DS);setReps(mkPrefill());setHold(DH);setActions(DEMO_ACTIONS);setJournal(DEMO_JOURNAL);setPulses(DEMO_PULSES);setDeals(DEMO_DEALS);setOkrs(DEMO_OKRS);setSynergies(DEMO_SYNERGIES);setKb(DEMO_KB);setSubs(DEMO_SUBS);setTeam(DEMO_TEAM);setClients(DEMO_CLIENTS);setInvoices(mkDemoInvoices(DEMO_CLIENTS,DS));}
   try{const obStatus=await sGet("scOnboarded");const obD=await sGet("scObData");setOnboarded(!!obStatus);setObData(obD||null);}catch{setOnboarded(false);}
   setLoaded(true);})();},[]);
 const save=useCallback(async(ns,nr,nh)=>{setSaving(true);try{if(ns!=null){setSocs(ns);await sSet("scAs",ns);}if(nr!=null){setReps(nr);await sSet("scAr",nr);}if(nh!=null){setHold(nh);await sSet("scAh",nh);}}catch{}setSaving(false);},[]);
 const saveAJ=useCallback(async(na,nj)=>{try{if(na!=null){setActions(na);await sSet("scAa",na);}if(nj!=null){setJournal(nj);await sSet("scAj",nj);}}catch{}},[]);
 const savePulse=useCallback(async(k,v)=>{const np={...pulses,[k]:v};setPulses(np);await sSet("scAp",np);},[pulses]);
 const saveDeals=useCallback(async(nd)=>{setDeals(nd);await sSet("scAd",nd);},[]);
 const saveOkrs=useCallback(async(no)=>{setOkrs(no);await sSet("scAo",no);},[]);
 const saveSynergies=useCallback(async(ns)=>{setSynergies(ns);await sSet("scAy",ns);},[]);
 const saveKb=useCallback(async(nk)=>{setKb(nk);await sSet("scAk",nk);},[]);
 const saveChallenges=useCallback(async(nc)=>{setChallenges(nc);await sSet("scAc",nc);},[]);
 const saveSubs=useCallback(async(ns)=>{setSubs(ns);await sSet("scAu",ns);},[]);
 const saveTeam=useCallback(async(nt)=>{setTeam(nt);await sSet("scAt",nt);},[]);
 const saveClients=useCallback(async(nc)=>{setClients(nc);await sSet("scAcl",nc);},[]);
 const saveInvoices=useCallback(async(ni)=>{setInvoices(ni);await sSet("scAiv",ni);},[]);
 const syncGHL=useCallback(async()=>{
  const hasKeys=socs.some(s=>s.ghlLocationId||s.ghlKey);
  let newData={};
  if(hasKeys){
   for(const s of socs.filter(x=>x.ghlLocationId||x.ghlKey)){
    const d=await syncGHLForSoc(s);
    if(d)newData[s.id]=d;
   }
  }
  const demo=mkGHLDemo(socs);
  socs.filter(s=>s.stat==="active"&&s.id!=="eco").forEach(s=>{
   if(!newData[s.id])newData[s.id]=demo[s.id];
  });
  setGhlData(newData);await sSet("scAg",newData);
  // Merge GHL contacts into clients state
  const ghlSocIds=Object.keys(newData).filter(sid=>newData[sid].ghlClients?.length>0);
  if(ghlSocIds.length>0){
   setClients(prev=>{
    // Remove old ghl_ clients for these socs, keep manual ones
    const kept=prev.filter(c=>!(ghlSocIds.includes(c.socId)&&c.id.startsWith("ghl_")));
    const newCl=ghlSocIds.flatMap(sid=>newData[sid].ghlClients);
    const merged=[...kept,...newCl];
    sSet("scAcl",merged);return merged;
   });
  }
 },[socs]);
 // Auto-sync GHL every 30s + on mount
 useEffect(()=>{
  if(!loaded)return;
  const doSync=()=>{syncGHL().catch(e=>console.warn("Auto-sync GHL failed:",e));};
  doSync();
  const id=setInterval(doSync,30000);
  return()=>clearInterval(id);
 },[loaded,syncGHL]);
 const syncRev=useCallback(async()=>{
  let data=null;
  data=await syncRevolut("eco");
  if(!data)data=mkRevolutDemo();
  setRevData(data);await sSet("scAv",data);
 },[]);
 const syncSocBank=useCallback(async(socId)=>{
  const s=socs.find(x=>x.id===socId);if(!s)return;
  let data=null;
  if(s.revolutCompany){data=await syncSocRevolut(s);}
  if(!data)data=mkSocRevDemo(s);
  const nb={...socBank,[socId]:data};setSocBank(nb);await sSet("scAb",nb);
 },[socs,socBank]);
 const syncAllSocBanks=useCallback(async()=>{
  const nb={};
  for(const s of socs.filter(x=>["active","lancement"].includes(x.stat)&&x.id!=="eco")){
   let data=null;
   if(s.revolutCompany){data=await syncSocRevolut(s);}
   if(!data)data=mkSocRevDemo(s);
   nb[s.id]=data;
  }
  setSocBank(nb);await sSet("scAb",nb);
 },[socs]);
 useEffect(()=>{
  if(!loaded)return;
  const doSync=async()=>{try{await syncRev();await syncAllSocBanks();const sd=await syncStripeData();if(sd)setStripeData(sd);}catch(e){console.warn("Auto-sync failed:",e);}};
  doSync();
  const id=setInterval(doSync,60000);
  return()=>clearInterval(id);
 },[loaded,syncRev,syncAllSocBanks]);
 // Auto-generate reports for current month when socBank/ghlData change
 useEffect(()=>{
  if(!loaded||!socs.length)return;
  const cM=curM();
  let updated=false;const nr={...reps};
  socs.filter(s=>["active","lancement"].includes(s.stat)&&s.id!=="eco"&&(s.ghlLocationId||s.revolutCompany)).forEach(s=>{
   const key=`${s.id}_${cM}`;const existing=nr[key];
   if(existing?.ok===true)return;// never overwrite validated
   const hasBankData=socBank?.[s.id]?.monthly?.[cM];
   const hasGhlData=ghlData?.[s.id];
   if(!hasBankData&&!hasGhlData)return;
   const auto=autoGenerateReport(s.id,cM,socBank,ghlData,subs);
   if(existing){// preserve manual edits on non-empty fields, but update auto fields
    nr[key]={...auto,...Object.fromEntries(Object.entries(existing).filter(([k,v])=>v!==""&&v!==0&&v!=="0"&&k!=="notes"&&k!=="_auto"&&k!=="at")),_auto:true,at:new Date().toISOString()};
   }else{nr[key]=auto;}
   updated=true;
  });
  if(updated){setReps(nr);sSet("scAr",nr);}
 },[loaded,socs,socBank,ghlData,subs]);
 const allM=useMemo(()=>{const ks=[...new Set(Object.keys(reps).map(k=>k.split("_").slice(1).join("_")))].sort();const c=curM();if(!ks.includes(c))ks.push(c);return ks.slice(-12);},[reps]);
 const alerts=useMemo(()=>socs.length?getAlerts(socs,reps,hold):[]  ,[socs,reps,hold]);
 const feed=useMemo(()=>buildFeed(socs,reps,actions,pulses),[socs,reps,actions,pulses]);
 const leaderboard=useMemo(()=>calcLeaderboard(socs,reps,actions,pulses,allM),[socs,reps,actions,pulses,allM]);
 const cM2=curM(),actS=socs.filter(s=>s.stat==="active");
 const smartAlerts=useMemo(()=>calcSmartAlerts(socs,reps,actions,pulses,allM,socBank),[socs,reps,actions,pulses,allM,socBank]);
 const login=useCallback(async()=>{async function hashPin(p){const e=new TextEncoder().encode(p);const h=await crypto.subtle.digest('SHA-256',e);return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('');}
const doLogin=(rid)=>{setRole(rid);setLErr("");_storeToken=pin;localStorage.setItem("sc_store_token",pin);if(!onboarded)setShowTour(true);};
// Admin check
if(pin==="0000"||pin==="admin"){const hk="sc_pin_hash_admin";const stored=localStorage.getItem(hk);if(!stored){localStorage.setItem(hk,await hashPin(pin));}doLogin("admin");return;}
// Check stored hashes first
const inputHash=await hashPin(pin);for(const s of socs){const hk=`sc_pin_hash_${s.id}`;const stored=localStorage.getItem(hk);if(stored&&stored===inputHash){doLogin(s.id);return;}}
// Backward compat: raw PIN match, then store hash
const s=socs.find(x=>x.pin===pin);if(s){localStorage.setItem(`sc_pin_hash_${s.id}`,await hashPin(pin));doLogin(s.id);return;}
setLErr("Code incorrect");setShake(true);setTimeout(()=>setShake(false),500);},[pin,socs,onboarded]);
 const addAction=(socId,text,dl)=>{saveAJ([...actions,{id:uid(),socId,text,deadline:dl||nextM(cM2),done:false,by:"admin",at:new Date().toISOString()}],null);};
 const toggleAction=(id)=>{saveAJ(actions.map(a=>a.id===id?{...a,done:!a.done}:a),null);};
 const deleteAction=(id)=>{saveAJ(actions.filter(a=>a.id!==id),null);};
 if(!loaded)return <div className="glass-bg" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}><style>{CSS}</style><div style={{width:40,height:40,border:"3px solid rgba(255,255,255,.06)",borderTopColor:C.acc,borderRadius:"50%",animation:"sp 1s linear infinite",boxShadow:"0 0 20px rgba(255,170,0,.15)"}}/></div>;
 /* ONBOARDING (optional, non-blocking) */
 if(showOnboarding)return <OnboardingWizard hold={hold} onSkip={()=>setShowOnboarding(false)} onComplete={async(formData)=>{try{await sSet("scOnboarded",true);await sSet("scObData",formData);}catch{}setObData(formData);setOnboarded(true);setShowOnboarding(false);setShowTour(true);}}/>;
 if(!role)return <div className="glass-bg" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,padding:16}}>
  <style>{CSS}</style>
  {/* TUTORIAL OVERLAY ON LOGIN */}
  {false&&<div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,.6)",backdropFilter:"blur(3px)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
   <div className="si glass-modal" style={{borderRadius:20,padding:0,width:500,maxWidth:"92vw",overflow:"hidden"}}>
    <div style={{padding:"24px 28px",background:`linear-gradient(135deg,${C.accD},transparent)`,borderBottom:`1px solid ${C.brd}`,textAlign:"center"}}>
     <div style={{width:64,height:64,borderRadius:16,background:`linear-gradient(135deg,${C.acc},#FF9D00)`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:30,marginBottom:12,boxShadow:`0 8px 32px ${C.accD}`}}>🎓</div>
     <h2 style={{margin:0,fontSize:22,fontWeight:800,color:C.t,fontFamily:FONT_TITLE}}>Bienvenue {obData?.founderName||""} !</h2>
     <p style={{color:C.td,fontSize:13,margin:"8px 0 0",lineHeight:1.5}}>Votre espace est configuré. Connectez-vous puis découvrez la plateforme avec un tutoriel guidé de chaque onglet.</p>
    </div>
    <div style={{padding:"20px 28px"}}>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[{icon:"📊",label:"Dashboard",desc:"Pilotage global"},{icon:"🏆",label:"Milestones",desc:"Trophées & progrès"},{icon:"🤖",label:"AI Copilot",desc:"Insights IA"},{icon:"📈",label:"Analytique",desc:"Tendances & comparaisons"}].map(it=>
      <div key={it.label} style={{padding:"12px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.brd}`,display:"flex",alignItems:"center",gap:8}}>
       <span style={{fontSize:18}}>{it.icon}</span><div><div style={{fontWeight:700,fontSize:11,color:C.t}}>{it.label}</div><div style={{fontSize:10,color:C.td}}>{it.desc}</div></div></div>)}</div>
    </div>
    <div style={{padding:"14px 28px",borderTop:`1px solid ${C.brd}`,textAlign:"center"}}>
     <button onClick={()=>setShowTour(false)} style={{padding:"10px 28px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${C.acc},#FF9D00)`,color:"#0a0a0f",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT,boxShadow:`0 4px 16px ${C.accD}`}}>Se connecter →</button>
    </div>
   </div>
  </div>}
  <button onClick={toggleTheme} style={{position:"fixed",top:16,right:16,width:36,height:36,borderRadius:18,border:`1px solid ${C.brd}`,background:C.card,color:C.td,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>{getTheme()==="light"?"🌙":"☀️"}</button>
  <div className="si glass-modal" style={{borderRadius:20,padding:28,width:340,maxWidth:"100%"}}>
   <div style={{textAlign:"center",marginBottom:24}}>
    <div className="fl glow-accent-strong" style={{width:64,height:64,background:"transparent",borderRadius:12,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:18,color:"#0a0a0f",marginBottom:10,overflow:"hidden"}}>{hold.brand?.logoUrl?<img src={hold.brand.logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:(hold.brand?.logoLetter||"E")}</div>
    <h1 style={{margin:0,fontSize:18,fontWeight:900,letterSpacing:.5,fontFamily:FONT_TITLE,color:"#fff"}}>{hold.brand?.name||"L'INCUBATEUR ECS"}</h1>
    <p style={{color:C.td,fontSize:11,margin:"4px 0 0"}}>{hold.brand?.sub||"Plateforme de pilotage"}</p>
   </div>
   <div style={{animation:shake?"sh .4s ease":"none"}}><Inp label="Code d'accès" value={pin} onChange={v=>{setPin(v);setLErr("");}} type="password" placeholder="Entrez votre PIN" onKeyDown={e=>{if(e.key==="Enter")login();}}/></div>
   {lErr&&<div style={{color:C.r,fontSize:11,marginBottom:8,textAlign:"center"}}>⚠ {lErr}</div>}
   <Btn onClick={login} full>Connexion</Btn>
   <div className="fu d2" style={{marginTop:18,padding:"10px 12px",background:C.bg,borderRadius:9,border:`1px solid ${C.brd}`}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:4}}>ACCÈS RAPIDE</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 14px",fontSize:10}}>
    <div><span style={{color:C.acc,fontWeight:700}}>0000</span> <span style={{color:C.td}}>Admin</span></div>
    {socs.filter(s=>s.pin!=="admin").slice(0,5).map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:6}}>{s.logoUrl?<img src={s.logoUrl} alt="" style={{width:16,height:16,borderRadius:8,objectFit:"cover"}}/>:<span style={{width:16,height:16,borderRadius:8,background:(s.brandColor||s.color)+"22",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:s.brandColor||s.color}}>{s.nom[0]}</span>}<span style={{color:s.brandColor||s.color,fontWeight:600}}>{s.pin}</span> <span style={{color:C.td}}>{s.nom}</span></div>)}
    </div>
   </div>
   {obData&&<div style={{marginTop:10,padding:"8px 12px",background:C.gD,borderRadius:8,border:`1px solid ${C.g}33`,fontSize:10,color:C.g,textAlign:"center"}}>✅ Onboarding complété{obData.companyName?` — ${obData.companyName}`:""}</div>}
   {onboarded===false&&<button onClick={()=>setShowOnboarding(true)} style={{marginTop:10,width:"100%",padding:"9px",borderRadius:8,border:`1.5px solid ${C.acc}44`,background:C.accD,color:C.acc,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>👋 Compléter l'onboarding</button>}
   {onboarded&&<button onClick={()=>setShowOnboarding(true)} style={{marginTop:8,width:"100%",padding:"6px",borderRadius:6,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,fontSize:9,cursor:"pointer",fontFamily:FONT,opacity:.5}}>↻ Relancer l'onboarding</button>}
  </div>
 </div>;
 if(role!=="admin"){const soc=socs.find(s=>s.id===role);if(!soc)return null;
  const porteurSetTab=(t)=>{const btn=document.querySelector(`[data-tour="porteur-tab-${t}"]`);if(btn)btn.click();};
  return <>{false&&<TutorialOverlay steps={TOUR_PORTEUR} onFinish={()=>setShowTour(false)} onSkip={()=>setShowTour(false)} setActiveTab={porteurSetTab}/>}<SocieteView key={soc.id} soc={soc} reps={reps} allM={allM} save={save} onLogout={()=>{setRole(null);setShowTour(false);}} onTour={()=>setShowTour(true)} actions={actions} journal={journal} pulses={pulses} saveAJ={saveAJ} savePulse={savePulse} socBankData={socBank[soc.id]||null} syncSocBank={syncSocBank} okrs={okrs} saveOkrs={saveOkrs} kb={kb} saveKb={saveKb} socs={socs} subs={subs} saveSubs={saveSubs} team={team} saveTeam={saveTeam} clients={clients} saveClients={saveClients} ghlData={ghlData} invoices={invoices} saveInvoices={saveInvoices} hold={hold} onThemeToggle={toggleTheme} stripeData={stripeData}/></>;}
 if(meeting)return <MeetingMode socs={socs} reps={reps} hold={hold} actions={actions} pulses={pulses} allM={allM} onExit={()=>setMeeting(false)}/>;
 const hc=calcH(socs,reps,hold,cM2);const pending=socs.filter(s=>{const r=gr(reps,s.id,cM2);return r&&!r.ok;});
 const missing=actS.filter(s=>!gr(reps,s.id,cM2));const lateActions=actions.filter(a=>!a.done&&a.deadline<cM2);
 return <div className="glass-bg" style={{display:"flex",minHeight:"100vh",fontFamily:FONT,color:C.t}}>
  <style>{CSS}</style>
  {false&&role==="admin"&&<TutorialOverlay steps={TOUR_ADMIN} onFinish={()=>setShowTour(false)} onSkip={()=>setShowTour(false)} setActiveTab={setTab}/>}
  <Sidebar items={SB_ADMIN} activeTab={tab} setTab={setTab} brandTitle={hold.brand?.name||"L'INCUBATEUR ECS"} brandSub={`${actS.length} sociétés · Admin`} onLogout={()=>setRole(null)} onTour={()=>setShowTour(true)} onThemeToggle={toggleTheme} dataTourPrefix="admin" brand={hold.brand} extra={<div style={{display:"flex",flexDirection:"column",gap:2}}>
   {hold.slack?.enabled&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 4px"}}><span style={{width:5,height:5,borderRadius:3,background:C.g}}/>
    <span style={{fontSize:8,color:C.td}}>{SLACK_MODES[hold.slack?.mode]?.icon} Slack connecté</span>
    {missing.length>0&&<button onClick={async()=>{const results=[];for(const s of missing){const r=await slackSend(hold.slack,buildReminderSlackMsg(s,"report",deadline(cM2)));results.push({nom:s.nom,ok:r.ok});}const ok=results.filter(r=>r.ok).length;alert(`📤 ${ok}/${results.length} rappels envoyés`);}} style={{marginLeft:"auto",fontSize:8,color:C.o,background:C.oD,border:"none",borderRadius:4,padding:"2px 5px",cursor:"pointer",fontFamily:FONT,fontWeight:600}}>🔔 {missing.length}</button>}
   </div>}
   <button onClick={()=>setMeeting(true)} style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderRadius:6,border:`1px solid ${"#a78bfa"}22`,background:"#a78bfa"+"0a",color:"#a78bfa",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT,textAlign:"left"}}>
    <span>📋</span><span>Mode Réunion</span>
   </button>
  </div>}/>
  <div style={{flex:1,minWidth:0,height:"100vh",overflow:"auto"}}>
  {saving&&<div style={{position:"fixed",top:12,right:12,zIndex:100,width:14,height:14,border:`2px solid ${C.brd}`,borderTopColor:C.acc,borderRadius:"50%",animation:"sp .8s linear infinite"}}/>}
  <div style={{padding:"16px 22px 50px",maxWidth:1000,margin:"0 auto"}}>
  {tab===0&&<>
   {smartAlerts.length>0&&<div data-tour="admin-alerts" style={{marginBottom:12}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
    <span style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>🔔 ALERTES INTELLIGENTES</span>
    <span style={{fontSize:8,color:smartAlerts.filter(a=>a.type==="danger").length>0?C.r:C.o}}>{smartAlerts.length} alerte{smartAlerts.length>1?"s":""}</span>
    </div>
    <SmartAlertsPanel alerts={smartAlerts.slice(0,5)}/>
   </div>}
   <div data-tour="admin-kpis" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8}}>
    <KPI label="CA Groupe" value={`${fmt(actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca),0))}€`} accent={C.acc} icon="💰" delay={1}/>
    <KPI label="Marge nette" value={`${fmt(actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca)-pf(gr(reps,s.id,cM2)?.charges),0))}€`} accent={C.g} icon="📊" delay={2}/>
    <KPI label="On se verse" value={`${fmt(hold.remun)}€`} accent={C.o} icon="👤" delay={3} sub={`${fmt(hold.remun/2)}€ chacun`}/>
    <KPI label="Reste dispo" value={`${fmt(hc.dispo)}€`} accent={hc.dispo>0?C.g:C.r} icon="✨" delay={4}/>
    <KPI label="Trésorerie" value={`${fmt(hold.treso)}€`} accent={(hold.treso||0)<5e3?C.r:C.g} icon="🏦" delay={5}/>
   </div>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14}}>
    <div>
    {feed.length>0&&<div data-tour="admin-feed"><Card style={{padding:12,marginBottom:10}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:6}}>ACTIVITÉ RÉCENTE</div>
    {feed.slice(0,5).map((f2,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4,fontSize:10}}>
    <span style={{width:4,height:4,borderRadius:2,background:f2.color,flexShrink:0}}/>
    <span style={{color:C.t,flex:1,lineHeight:1.3}}>{f2.m}</span>
    <span style={{color:C.tm,fontSize:8,whiteSpace:"nowrap"}}>{ago(f2.date)}</span>
    </div>)}
    </Card></div>}
    <Sect title="⚡ Pulse" sub={curW()}><PulseOverview socs={socs} pulses={pulses}/></Sect>
    </div>
    <div data-tour="admin-leaderboard">
    <BankingPanel revData={revData} onSync={syncRev} compact clients={clients}/>
    <Card style={{padding:12,marginTop:10}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:6}}>🏆 CLASSEMENT</div>
    {leaderboard.slice(0,5).map((lb,i)=>{const ms=calcMilestones(lb.soc,reps,actions,pulses,allM);const msN=ms.filter(m=>m.unlocked).length;return <div key={lb.soc.id} className={`fu d${Math.min(i+1,5)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:i<Math.min(leaderboard.length,5)-1?`1px solid ${C.brd}08`:"none"}}>
    <span style={{fontWeight:800,fontSize:12,color:i===0?C.acc:i===1?"#C0C0C0":i===2?"#CD7F32":C.td,width:16}}>{i+1}</span>
    <span style={{width:4,height:4,borderRadius:2,background:lb.soc.color}}/>
    <span style={{flex:1,fontWeight:600,fontSize:11}}>{lb.soc.nom}</span>
    {msN>0&&<span style={{fontSize:7,color:C.acc,background:C.accD,padding:"1px 4px",borderRadius:6,fontWeight:700}}>🏆{msN}</span>}
    <GradeBadge grade={lb.hs.grade} color={lb.hs.color}/>
    <span style={{fontWeight:800,fontSize:12,color:C.acc,minWidth:28,textAlign:"right"}}>{lb.score}</span>
    </div>;})}
    </Card>
    </div>
   </div>
   <div data-tour="admin-okr-actions" style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginTop:14}}>
    <Card style={{padding:12}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>⚡ ACTIONS PRIORITAIRES</div>
    <span style={{fontSize:9,color:C.td}}>{actions.filter(a=>!a.done).length} ouvertes</span>
    </div>
    {(()=>{
    const open=actions.filter(a=>!a.done).sort((a,b)=>a.deadline>b.deadline?1:-1);
    if(open.length===0)return <div style={{color:C.td,fontSize:11,padding:10,textAlign:"center"}}>Tout est fait 🎉</div>;
    return open.slice(0,5).map((a,i)=>{
    const s=socs.find(x=>x.id===a.socId);const isLate=a.deadline<cM2;
    return <div key={a.id} className={`fu d${Math.min(i+1,5)}`} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 0",borderBottom:i<Math.min(open.length,5)-1?`1px solid ${C.brd}08`:"none"}}>
    <span style={{width:4,height:4,borderRadius:2,background:s?.color||C.td,flexShrink:0}}/>
    <span style={{flex:1,fontSize:10,lineHeight:1.3,color:isLate?C.r:C.t}}>{a.text}</span>
    {isLate&&<span style={{fontSize:7,color:C.r,background:C.rD,padding:"1px 4px",borderRadius:4,fontWeight:700}}>RETARD</span>}
    <span style={{fontSize:8,color:C.td,whiteSpace:"nowrap"}}>{ml(a.deadline)}</span>
    </div>;
    });
    })()}
    </Card>
   </div>
   <div style={{marginTop:14}}><LeaderboardCard socs={socs} reps={reps} allM={allM} actions={actions} pulses={pulses} socBank={socBank}/></div>
   <Sect title="Portfolio" sub={`${actS.filter(s=>s.id!=="eco").length} sociétés actives`}>
    <div data-tour="admin-portfolio" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
    {actS.filter(s=>s.id!=="eco").map((s,i)=>{
    const r=gr(reps,s.id,cM2);const hs2=healthScore(s,reps);const rw2=runway(reps,s.id,allM);const sb=socBank[s.id];
    const ca2=r?pf(r.ca):0;const ms=calcMilestones(s,reps,actions,pulses,allM);const msUnlocked=ms.filter(m=>m.unlocked);
    return <Card key={s.id} accent={s.color} style={{padding:12}} delay={Math.min(i+1,8)}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
    <div style={{width:24,height:24,borderRadius:6,background:s.color+"22",border:`1.5px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:10,color:s.color}}>{s.nom[0]}</div>
    <div style={{flex:1,minWidth:0}}>
    <div style={{fontWeight:700,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.nom}</div>
    <div style={{color:C.td,fontSize:9}}>{s.porteur}</div>
    </div>
    <GradeBadge grade={hs2.grade} color={hs2.color}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:6}}>
    <div style={{background:C.bg,borderRadius:6,padding:"5px 7px"}}><div style={{color:C.td,fontSize:8,fontWeight:600}}>CA</div><div style={{fontWeight:800,fontSize:12,color:C.t}}>{ca2>0?`${fmt(ca2)}€`:"—"}</div></div>
    <div style={{background:C.bg,borderRadius:6,padding:"5px 7px"}}><div style={{color:C.td,fontSize:8,fontWeight:600}}>{sb?"SOLDE":"TRÉSO"}</div><div style={{fontWeight:800,fontSize:12,color:C.g}}>{sb?`${fmt(sb.balance)}€`:r?`${fmt(pf(r.tresoSoc))}€`:"—"}</div></div>
    </div>
    {msUnlocked.length>0&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:5,padding:"3px 6px",background:C.accD,borderRadius:6}}>
    <MilestonesCompact milestones={ms} max={4}/>
    <span style={{fontSize:7,color:C.acc,fontWeight:700,marginLeft:"auto"}}>{msUnlocked.length}/{ms.length}</span>
    </div>}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
    <div style={{display:"flex",gap:3}}>
    {s.incub&&<span style={{fontSize:8,color:C.v,background:C.vD,padding:"1px 6px",borderRadius:8,fontWeight:600}}>📅 {sinceLbl(s.incub)}</span>}
    <SubsTeamBadge subs={subs} team={team} socId={s.id} reps={reps}/>
    </div>
    <div style={{display:"flex",gap:3}}>
    {rw2&&<span style={{fontSize:8,fontWeight:700,color:rw2.months<3?C.r:rw2.months<6?C.o:C.g,background:rw2.months<3?C.rD:rw2.months<6?C.oD:C.gD,padding:"1px 5px",borderRadius:8}}>{rw2.months===99?"∞":rw2.months+"m"}</span>}
    <Badge s={s.stat}/>
    </div>
    </div>
    </Card>;
    })}
    </div>
   </Sect>
   <div data-tour="admin-milestones"><Sect title="🏆 Milestones" sub="Progression de chaque société">
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:6}}>
    {actS.filter(s=>s.id!=="eco").map((s,i)=>{
    const ms=calcMilestones(s,reps,actions,pulses,allM);const un=ms.filter(m=>m.unlocked);const pctMs=Math.round(un.length/ms.length*100);
    const topTier=un.sort((a2,b2)=>b2.tier-a2.tier).slice(0,5);
    const next=ms.filter(m=>!m.unlocked).sort((a2,b2)=>a2.tier-b2.tier)[0];
    return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:10,padding:"10px 12px"}}>
    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
    <span style={{width:4,height:4,borderRadius:2,background:s.color,flexShrink:0}}/>
    <span style={{flex:1,fontWeight:700,fontSize:11}}>{s.nom}</span>
    <span style={{fontWeight:800,fontSize:12,color:C.acc}}>{un.length}<span style={{color:C.td,fontWeight:400,fontSize:9}}>/{ms.length}</span></span>
    </div>
    <PBar value={un.length} max={ms.length} color={pctMs>=70?C.g:pctMs>=40?C.acc:C.b} h={3}/>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:5}}>
    <div style={{display:"flex",gap:2}}>
    {topTier.map(m=><span key={m.id} title={m.label} style={{fontSize:10}}>{m.icon}</span>)}
    </div>
    {next&&<span style={{fontSize:7,color:C.td}} title={next.desc}>🔜 {next.label}</span>}
    </div>
    </div>;
    })}
    </div>
   </Sect></div>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
    <Card style={{padding:12,cursor:"pointer"}} onClick={()=>setTab(10)}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
    <span style={{fontSize:11,fontWeight:700}}>🤝 Synergies</span>
    <span style={{fontSize:8,color:C.acc}}>Voir →</span>
    </div>
    <div style={{display:"flex",gap:10,alignItems:"baseline"}}>
    <div><div style={{fontWeight:800,fontSize:18,color:C.g}}>{fmt(synergies.filter(s=>s.status==="won").reduce((a,s)=>a+pf(s.value),0))}€</div><div style={{fontSize:8,color:C.td}}>générés</div></div>
    <div><div style={{fontWeight:800,fontSize:14,color:C.b}}>{synergies.filter(s=>s.status==="active").length}</div><div style={{fontSize:8,color:C.td}}>en cours</div></div>
    <div><div style={{fontWeight:800,fontSize:14,color:C.td}}>{synergies.length}</div><div style={{fontSize:8,color:C.td}}>total</div></div>
    </div>
    </Card>
   </div>
   {pending.length>0&&<Sect title={`Rapports — ${ml(cM2)}`} sub={`${pending.length} en attente`}>{socs.map((s,i)=>{const r=gr(reps,s.id,cM2);if(!r)return null;return <ValRow key={s.id} s={s} r={r} reps={reps} save={save} hs={healthScore(s,reps)} delay={Math.min(i+1,8)} onAction={(sid,txt)=>addAction(sid,txt)} hold={hold}/>;})}</Sect>}
   {lateActions.length>0&&<Sect title={`⚠ Actions en retard (${lateActions.length})`}>{lateActions.map(a=><ActionItem key={a.id} a={a} socs={socs} onToggle={toggleAction} onDelete={deleteAction}/>)}</Sect>}
   <Sect title="Trésorerie & Runway" right={<Btn small v="secondary" onClick={syncAllSocBanks}>↻ Sync</Btn>}>{actS.filter(s=>s.id!=="eco").map((s,i)=>{const rw=runway(reps,s.id,allM);const sb=socBank[s.id];const bf=revFinancials(sb,cM2);
    return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:2}}>
    <span style={{width:4,height:4,borderRadius:2,background:s.color}}/><span style={{flex:1,fontSize:11,fontWeight:600}}>{s.nom}</span>
    {sb&&<><span style={{fontSize:9,color:C.g,fontWeight:700}}>🏦 {fmt(sb.balance)}€</span>{bf&&<span style={{fontSize:8,color:C.td}}>↓{fmt(bf.ca)}€ ↑{fmt(bf.charges)}€</span>}</>}
    {!sb&&rw&&<span style={{fontSize:10,color:C.td}}>Tréso: {fmt(rw.treso)}€</span>}
    {rw&&<span style={{fontWeight:700,fontSize:9,color:rw.months<3?C.r:rw.months<6?C.o:C.g,padding:"1px 6px",background:rw.months<3?C.rD:rw.months<6?C.oD:C.gD,borderRadius:8}}>{rw.months===99?"∞":rw.months+"m"}</span>}
    </div>;})}
   </Sect>
   <Sect title="Projection T+3">{actS.map((s,i)=>{const proj=project(reps,s.id,allM);if(!proj)return null;const n=[nextM(cM2),nextM(nextM(cM2)),nextM(nextM(nextM(cM2)))];return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:2}}><span style={{width:4,height:4,borderRadius:2,background:s.color}}/><span style={{flex:1,fontSize:11,fontWeight:600}}>{s.nom}</span>{proj.map((v,j)=><span key={j} style={{fontSize:9,color:C.td}}>{ml(n[j]).split(" ")[0]}: <strong style={{color:C.t}}>{fmt(v)}€</strong></span>)}</div>;})}
   </Sect>
   <RiskMatrix socs={socs} reps={reps} allM={allM}/>
   {(challenges||[]).filter(c=>c.month===cM2).length>0&&<Card style={{padding:12,marginTop:12,cursor:"pointer"}} onClick={()=>setTab(12)}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
    <span style={{fontSize:11,fontWeight:700}}>⚡ Challenges ce mois</span>
    <span style={{fontSize:8,color:C.acc}}>Voir →</span>
    </div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
    {(challenges||[]).filter(c=>c.month===cM2).map(ch=>{const tmpl=CHALLENGE_TEMPLATES.find(t=>t.id===ch.templateId);return tmpl?<span key={ch.id} style={{padding:"3px 8px",background:C.accD,borderRadius:6,fontSize:10,fontWeight:600}}>{tmpl.icon} {tmpl.title.replace(/^. /,"")}</span>:null;})}
    </div>
   </Card>}
  </>}
  {tab===1&&<>
   <div style={{display:"flex",justifyContent:"space-between",marginTop:6,marginBottom:12}}><span style={{color:C.td,fontSize:12}}>{socs.length} sociétés</span><Btn small onClick={()=>setESoc({id:`s${Date.now()}`,nom:"",porteur:"",act:"",pT:"benefices",pP:20,stat:"lancement",color:"#22d3ee",pin:String(2000+socs.length),rec:false,obj:0,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:new Date().toISOString().slice(0,10),slackId:""})}>+ Ajouter</Btn></div>
   {socs.map((s,i)=>{const hs2=healthScore(s,reps);const ms=calcMilestones(s,reps,actions,pulses,allM);return <Card key={s.id} accent={s.color} style={{marginBottom:4,padding:"10px 14px"}} delay={Math.min(i+1,8)} onClick={()=>setESoc({...s})}><div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><GradeBadge grade={hs2.grade} color={hs2.color}/><div style={{flex:"1 1 130px"}}><div style={{fontWeight:700,fontSize:12}}>{s.nom} <span style={{color:C.td,fontWeight:400,fontSize:10}}>· {s.porteur}</span></div><div style={{color:C.td,fontSize:10}}>{s.act}</div></div><div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}><MilestoneCount milestones={ms}/><IncubBadge incub={s.incub}/><Badge s={s.stat}/></div></div></Card>;})}
   <Sect title="Actions"><div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}><select value={newActSoc} onChange={e=>setNewActSoc(e.target.value)} style={{background:C.bg,border:`1px solid ${C.brd}`,borderRadius:6,color:C.t,padding:"6px 8px",fontSize:11,fontFamily:FONT,outline:"none"}}><option value="">Société…</option>{socs.map(s=><option key={s.id} value={s.id}>{s.nom}</option>)}</select><input value={newActText} onChange={e=>setNewActText(e.target.value)} placeholder="Nouvelle action…" style={{flex:1,minWidth:120,background:C.bg,border:`1px solid ${C.brd}`,borderRadius:6,color:C.t,padding:"6px 8px",fontSize:11,fontFamily:FONT,outline:"none"}}/><Btn small onClick={()=>{if(newActSoc&&newActText.trim()){addAction(newActSoc,newActText.trim());setNewActText("");}}} disabled={!newActSoc||!newActText.trim()}>+ Créer</Btn></div>{actions.filter(a=>!a.done).map(a=><ActionItem key={a.id} a={a} socs={socs} onToggle={toggleAction} onDelete={deleteAction}/>)}</Sect>
   <Sect title="Journal">{Object.entries(journal).filter(([,v])=>v.length>0).map(([sid,entries])=>{const s=socs.find(x=>x.id===sid);if(!s)return null;return <div key={sid} style={{marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><span style={{width:5,height:5,borderRadius:3,background:s.color}}/><span style={{fontWeight:700,fontSize:12}}>{s.nom}</span></div>{entries.sort((a2,b2)=>new Date(b2.date)-new Date(a2.date)).map(j=><div key={j.id} style={{padding:"4px 0 4px 14px",borderLeft:`2px solid ${s.color}33`,marginBottom:2}}><div style={{fontSize:11,color:C.t}}>{j.text}</div><div style={{fontSize:9,color:C.td}}>{new Date(j.date).toLocaleDateString("fr-FR")}</div></div>)}</div>;})}</Sect>
   <Modal open={!!eSoc} onClose={()=>setESoc(null)} title={eSoc?.nom||"Nouvelle société"} wide>{eSoc&&<>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Nom" value={eSoc.nom} onChange={v=>setESoc({...eSoc,nom:v})}/>
    <Inp label="Porteur" value={eSoc.porteur} onChange={v=>setESoc({...eSoc,porteur:v})}/>
    <Inp label="Activité" value={eSoc.act} onChange={v=>setESoc({...eSoc,act:v})}/>
    <Inp label="Date d'incubation" type="date" value={eSoc.incub||""} onChange={v=>setESoc({...eSoc,incub:v})} note={eSoc.incub?`→ ${sinceLbl(eSoc.incub)} d'association`:""}/>
    <Inp label="PIN" value={eSoc.pin} onChange={v=>setESoc({...eSoc,pin:v})}/>
    <Inp label="Couleur" type="color" value={eSoc.color} onChange={v=>setESoc({...eSoc,color:v})}/>
    <Sel label="Part sur" value={eSoc.pT} onChange={v=>setESoc({...eSoc,pT:v})} options={[{v:"benefices",l:"% CA hors presta"},{v:"ca",l:"% CA brut"}]}/>
    <Inp label="%" value={eSoc.pP} onChange={v=>setESoc({...eSoc,pP:pf(v)})} type="number" suffix="%"/>
    <Sel label="Statut" value={eSoc.stat} onChange={v=>setESoc({...eSoc,stat:v})} options={[{v:"active",l:"Active"},{v:"lancement",l:"Lancement"},{v:"signature",l:"Signature"},{v:"inactive",l:"Inactive"}]}/>
    <Sel label="Récurrent" value={eSoc.rec?"1":"0"} onChange={v=>setESoc({...eSoc,rec:v==="1"})} options={[{v:"0",l:"Non"},{v:"1",l:"Oui"}]}/>
    <Inp label="Obj. mensuel" value={eSoc.obj} onChange={v=>setESoc({...eSoc,obj:pf(v)})} type="number" suffix="€"/>
    <Inp label="Obj. trim." value={eSoc.objQ} onChange={v=>setESoc({...eSoc,objQ:pf(v)})} type="number" suffix="€"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
    <div style={{padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.brd}`}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><span style={{fontSize:12}}>📡</span><span style={{fontWeight:700,fontSize:10,color:C.td}}>GHL</span></div><Inp label="Clé API" value={eSoc.ghlKey||""} onChange={v=>setESoc({...eSoc,ghlKey:v})} placeholder="eyJhbGciOi..." small/></div>
    <div style={{padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.brd}`}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><span style={{fontSize:12}}>🏦</span><span style={{fontWeight:700,fontSize:10,color:C.td}}>REVOLUT</span></div><Inp label="Token" value={eSoc.revToken||""} onChange={v=>setESoc({...eSoc,revToken:v})} placeholder="oa_sand_..." small/><Sel label="Env." value={eSoc.revEnv||"sandbox"} onChange={v=>setESoc({...eSoc,revEnv:v})} options={[{v:"sandbox",l:"Sandbox"},{v:"production",l:"Production"}]}/></div>
    </div>
    <div style={{padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.brd}`,marginTop:8}}>
    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><span style={{fontSize:12}}>💬</span><span style={{fontWeight:700,fontSize:10,color:C.td}}>SLACK</span></div>
    <Inp label="Slack User ID du porteur" value={eSoc.slackId||""} onChange={v=>setESoc({...eSoc,slackId:v})} placeholder="U06ABC123" note="Profil Slack du porteur → ⋮ → Copier l'ID membre" small/>
    {eSoc.slackId&&<div style={{fontSize:8,color:C.g,marginTop:2}}>✓ Le porteur sera tagué dans les notifications Slack</div>}
    </div>
    <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={()=>{const idx=socs.findIndex(x=>x.id===eSoc.id);save(idx>=0?socs.map(x=>x.id===eSoc.id?eSoc:x):[...socs,eSoc]);setESoc(null);}}>Sauver</Btn><Btn v="secondary" onClick={()=>setESoc(null)}>Annuler</Btn>{socs.find(x=>x.id===eSoc.id)&&<Btn v="danger" onClick={()=>{save(socs.filter(x=>x.id!==eSoc.id));setESoc(null);}} style={{marginLeft:"auto"}}>Supprimer</Btn>}</div>
   </>}</Modal>
  </>}
  {tab===2&&<AnalytiqueTab socs={socs} reps={reps} allM={allM}/>}
  {tab===3&&<TabSimulateur socs={socs} reps={reps} hold={hold}/>}
  {tab===4&&(()=>{
   const holdSubs=subs.filter(s=>s.socId==="holding");const holdTeam=team.filter(t=>t.socId==="holding");
   const holdSubsM=holdSubs.reduce((a,s)=>a+subMonthly(s),0);
   const holdTeamM=holdTeam.reduce((a,t)=>a+teamMonthly(t,0),0);
   const allSubsM=subs.reduce((a,s)=>a+subMonthly(s),0);
   const allTeamM=team.reduce((a,t)=>{const ca=t.socId!=="holding"?pf(gr(reps,t.socId,cM2)?.ca):0;return a+teamMonthly(t,ca);},0);
   return <>
   <div style={{display:"flex",justifyContent:"flex-end",marginTop:6,gap:6}}><Btn small v="secondary" onClick={()=>setTab(13)}>🔄 Gérer charges</Btn><Btn small onClick={()=>setEHold(true)}>⚙ Paramètres</Btn></div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8,marginTop:8}}>
    <KPI label="Flux entrant" value={`${fmt(hc.tIn)}€`} accent={C.g} icon="💰" delay={1} sub={`Remontées: ${fmt(hc.rem)}€`}/>
    <KPI label="On se verse" value={`${fmt(hold.remun)}€`} accent={C.acc} icon="👤" delay={2} sub={`${fmt(hold.remun/2)}€ chacun`}/>
    <KPI label="Charges holding" value={`${fmt(hc.tCh)}€`} accent={C.r} icon="📤" delay={3}/>
    <KPI label="Abos + Équipe" value={`${fmt(holdSubsM+holdTeamM)}€`} accent={C.o} icon="🔄" delay={4} sub={`${holdSubs.length} abos · ${holdTeam.length} membres`}/>
    <KPI label="Reste dispo" value={`${fmt(hc.dispo)}€`} accent={hc.dispo>0?C.g:C.r} icon="✨" delay={5}/>
   </div>
   <Sect title="Cascade des flux">
    <Card style={{padding:14}}>
    {(()=>{
    const steps=[
    {l:"Remontées sociétés",v:hc.rem,c:C.g,icon:"🏢"},
    {l:"CRM / société",v:hc.crm,c:C.g,icon:"📋"},
    {l:"CA Écosystème (net)",v:Math.max(0,hc.eNet),c:C.g,icon:"🌐"},
    {l:"= Flux entrant",v:hc.tIn,c:C.acc,icon:"💰",total:true},
    {l:"− Charges holding",v:-hc.tCh,c:C.r,icon:"📤"},
    {l:"− Rémunération",v:-hold.remun,c:C.r,icon:"👤"},
    ...(holdSubsM>0?[{l:`− Abonnements holding (${holdSubs.length})`,v:-holdSubsM,c:C.b,icon:"💻"}]:[]),
    ...(holdTeamM>0?[{l:`− Équipe holding (${holdTeam.length})`,v:-holdTeamM,c:C.o,icon:"👥"}]:[]),
    {l:"− Réserve",v:-hc.res,c:C.b,icon:"🛡️"},
    {l:"= Disponible",v:hc.dispo,c:hc.dispo>0?C.g:C.r,icon:"✨",total:true},
    ];
    const maxV=Math.max(...steps.map(s=>Math.abs(s.v)),1);
    return steps.map((s,i)=><div key={i} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:s.total?`1px solid ${C.brd}`:"none",marginTop:s.total?4:0,paddingTop:s.total?4:5}}>
    <span style={{fontSize:12,width:16,textAlign:"center"}}>{s.icon}</span>
    <span style={{flex:1,fontSize:s.total?11:10,fontWeight:s.total?700:500,color:s.total?C.t:C.td}}>{s.l}</span>
    <div style={{width:120,display:"flex",alignItems:"center",gap:4}}>
    <div style={{flex:1,height:6,background:C.bg,borderRadius:3,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${Math.abs(s.v)/maxV*100}%`,background:s.c,borderRadius:3,transition:"width .4s"}}/>
    </div>
    <span style={{fontWeight:700,fontSize:11,color:s.c,minWidth:55,textAlign:"right"}}>{s.v>=0?"+":""}{fmt(s.v)}€</span>
    </div>
    </div>);
    })()}
    </Card>
   </Sect>
   <Sect title="Ce que chaque société rapporte" sub="Remontées au holding ce mois">
    {socs.filter(s=>s.id!=="eco").map((s,i)=>{
    const r=gr(reps,s.id,cM2);const ca2=r?pf(r.ca):0,ch2=r?pf(r.charges):0;
    const presta2=r?pf(r.prestataireAmount||0):0;
    const base=s.pT==="ca"?ca2:Math.max(0,ca2-presta2);const remontee=base*s.pP/100;
    const margeNet=ca2-ch2;const margePct2=ca2>0?Math.round(margeNet/ca2*100):0;
    const salaire=r?pf(r.salaire):0;
    const divHold=r?pf(r.dividendesHolding):0;const resteVerser=remontee-divHold;
    return <Card key={s.id} accent={s.color} style={{marginBottom:4,padding:"10px 14px"}} delay={Math.min(i+1,8)}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
    <div style={{width:28,height:28,borderRadius:7,background:s.color+"22",border:`1.5px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,color:s.color}}>{s.nom[0]}</div>
    <div style={{flex:1}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontWeight:700,fontSize:12}}>{s.nom}</span>
    <span style={{fontSize:9,color:C.td}}>({s.pP}% {s.pT==="ca"?"du CA":"CA hors presta"})</span>
    </div>
    <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
    <span style={{fontSize:9,color:C.td}}>CA: <strong style={{color:C.t}}>{fmt(ca2)}€</strong></span>
    {presta2>0&&<span style={{fontSize:9,color:C.td}}>Presta: <strong style={{color:C.o}}>{fmt(presta2)}€</strong></span>}
    <span style={{fontSize:9,color:C.td}}>Marge: <strong style={{color:margeNet>=0?C.g:C.r}}>{fmt(margeNet)}€ ({margePct2}%)</strong></span>
    {salaire>0&&<span style={{fontSize:9,color:C.td}}>Rém fondateur: <strong style={{color:C.o}}>{fmt(salaire)}€</strong></span>}
    {divHold>0&&<span style={{fontSize:9,color:"#7c3aed"}}>🏛️ Viré: <strong>{fmt(divHold)}€</strong></span>}
    </div>
    </div>
    <div style={{textAlign:"right"}}>
    <div style={{fontWeight:900,fontSize:16,color:C.acc}}>{fmt(remontee)}€</div>
    <div style={{fontSize:8,color:C.td}}>théorique</div>
    {divHold>0&&<div style={{fontSize:9,fontWeight:700,color:resteVerser>0?C.o:C.g,marginTop:2}}>{resteVerser>0?`⚠ Reste ${fmt(resteVerser)}€`:`✅ +${fmt(Math.abs(resteVerser))}€`}</div>}
    </div>
    </div>
    </Card>;
    })}
    <Card style={{marginTop:6,padding:"10px 14px",background:C.accD,border:`1px solid ${C.acc}22`}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <span style={{fontWeight:700,fontSize:12,color:C.acc}}>Total remontées</span>
    <span style={{fontWeight:900,fontSize:16,color:C.acc}}>{fmt(hc.rem)}€</span>
    </div>
    </Card>
   </Sect>
   <Sect title="Évolution des revenus"><div className="fu d4" style={{height:200,background:C.card,borderRadius:12,border:`1px solid ${C.brd}`,padding:"14px 6px 6px 0"}}><ResponsiveContainer><BarChart data={allM.map(m=>{const h2=calcH(socs,reps,hold,m);return{mois:ml(m),Entrant:h2.tIn,Rémunération:hold.remun,Dispo:h2.dispo};}).filter(d=>d.Entrant>0)}><CartesianGrid strokeDasharray="3 3" stroke={C.brd}/><XAxis dataKey="mois" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/><Tooltip content={<CTip/>}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="Entrant" fill={C.g} radius={[3,3,0,0]}/><Bar dataKey="Rémunération" fill={C.acc} radius={[3,3,0,0]}/><Bar dataKey="Dispo" fill={C.b} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div></Sect>
   <Modal open={eHold} onClose={()=>setEHold(false)} title="Paramètres holding" wide><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}><Inp label="Logiciels" type="number" value={hold.logiciels} onChange={v=>setHold({...hold,logiciels:pf(v)})} suffix="€"/><Inp label="Équipe" type="number" value={hold.equipe} onChange={v=>setHold({...hold,equipe:pf(v)})} suffix="€"/><Inp label="Service" type="number" value={hold.service} onChange={v=>setHold({...hold,service:pf(v)})} suffix="€"/><Inp label="Cabinet" type="number" value={hold.cabinet} onChange={v=>setHold({...hold,cabinet:pf(v)})} suffix="€"/><Inp label="Rémunération" type="number" value={hold.remun} onChange={v=>setHold({...hold,remun:pf(v)})} suffix="€"/><Inp label="Réserve" type="number" value={hold.reservePct} onChange={v=>setHold({...hold,reservePct:pf(v)})} suffix="%"/><Inp label="CRM/soc" type="number" value={hold.crm} onChange={v=>setHold({...hold,crm:pf(v)})} suffix="€"/><Inp label="Trésorerie" type="number" value={hold.treso} onChange={v=>setHold({...hold,treso:pf(v)})} suffix="€"/></div><div style={{marginTop:12,padding:"12px 14px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><span style={{fontSize:16}}>🏦</span><span style={{fontWeight:700,fontSize:12,color:C.td}}>REVOLUT BUSINESS</span></div><Inp label="API Token" value={hold.revolutToken||""} onChange={v=>setHold({...hold,revolutToken:v})} placeholder="oa_sand_..." note="Settings → API → Generate token (avec les scopes accounts:read + transactions:read)"/><Sel label="Environnement" value={hold.revolutEnv||"sandbox"} onChange={v=>setHold({...hold,revolutEnv:v})} options={[{v:"sandbox",l:"Sandbox (test)"},{v:"production",l:"Production (live)"}]}/></div>
   <div style={{marginTop:12,padding:"12px 14px",background:C.bg,borderRadius:10,border:`1px solid ${hold.slack?.enabled?C.g+"44":C.brd}`}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>💬</span><span style={{fontWeight:700,fontSize:12,color:C.td}}>SLACK</span></div>
    <Toggle on={hold.slack?.enabled||false} onToggle={()=>setHold({...hold,slack:{...(hold.slack||DH.slack),enabled:!(hold.slack?.enabled)}})} label=""/>
    </div>
    {hold.slack?.enabled&&<>
    <div style={{display:"flex",gap:4,marginBottom:10}}>
    {Object.entries(SLACK_MODES).map(([k,v])=>{const active2=hold.slack?.mode===k;return <button key={k} onClick={()=>setHold({...hold,slack:{...hold.slack,mode:k}})} style={{flex:1,padding:"8px 6px",borderRadius:8,border:`1.5px solid ${active2?C.acc:C.brd}`,background:active2?C.accD:C.card,color:active2?C.acc:C.td,fontWeight:active2?700:500,fontSize:10,cursor:"pointer",fontFamily:FONT,transition:"all .15s",textAlign:"center"}}><div style={{fontSize:14,marginBottom:2}}>{v.icon}</div>{v.l}<div style={{fontSize:7,color:C.td,marginTop:2}}>{v.desc.slice(0,30)}</div></button>;})}
    </div>
    {hold.slack?.mode==="webhook"&&<Inp label="Webhook URL" value={hold.slack?.webhookUrl||""} onChange={v=>setHold({...hold,slack:{...hold.slack,webhookUrl:v}})} placeholder="https://hooks.slack.com/services/..." small/>}
    {hold.slack?.mode==="bot"&&<><Inp label="Bot OAuth Token" value={hold.slack?.botToken||""} onChange={v=>setHold({...hold,slack:{...hold.slack,botToken:v}})} placeholder="xoxb-..." note="Slack → Apps → Your App → OAuth → Bot User OAuth Token"/><Inp label="Channel ID" value={hold.slack?.channel||""} onChange={v=>setHold({...hold,slack:{...hold.slack,channel:v}})} placeholder="C06..." note="Clic droit sur le channel → Copier l'ID du channel"/></>}
    {hold.slack?.mode==="bob"&&<Inp label="Bob Webhook URL" value={hold.slack?.bobWebhook||""} onChange={v=>setHold({...hold,slack:{...hold.slack,bobWebhook:v}})} placeholder="https://your-bob-webhook.com/..." small/>}
    <div style={{padding:"8px 10px",background:C.card2,borderRadius:8,marginTop:8}}>
    <div style={{fontSize:9,color:C.td,fontWeight:700,marginBottom:6}}>NOTIFICATIONS</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
    <Toggle on={hold.slack?.notifyReport!==false} onToggle={()=>setHold({...hold,slack:{...hold.slack,notifyReport:!hold.slack?.notifyReport}})} label="📊 Rapports soumis"/>
    <Toggle on={hold.slack?.notifyPulse!==false} onToggle={()=>setHold({...hold,slack:{...hold.slack,notifyPulse:!hold.slack?.notifyPulse}})} label="⚡ Pulses envoyés"/>
    <Toggle on={hold.slack?.notifyValidation!==false} onToggle={()=>setHold({...hold,slack:{...hold.slack,notifyValidation:!hold.slack?.notifyValidation}})} label="✅ Rapports validés"/>
    <Toggle on={hold.slack?.notifyReminders!==false} onToggle={()=>setHold({...hold,slack:{...hold.slack,notifyReminders:!hold.slack?.notifyReminders}})} label="🔔 Rappels auto"/>
    </div>
    </div>
    <div style={{marginTop:8}}><Btn small v="secondary" onClick={async()=>{const r=await slackSend(hold.slack,{text:`🧪 Test ${hold.brand?.name||"Scale Corp"} — Slack est bien connecté ! 🎉`,blocks:[{type:"section",text:{type:"mrkdwn",text:`🧪 *Test ${hold.brand?.name||"Scale Corp"}*\n\nSlack est bien connecté ! Les notifications de rapports et pulses arriveront ici.\n\n_Mode: ${SLACK_MODES[hold.slack?.mode]?.l}_`}}]});alert(r.ok?"✅ Message envoyé avec succès !":"❌ Erreur: "+(r.error||"échec"));}}>🧪 Envoyer un test</Btn></div>
    </>}
   </div>
   <div style={{marginTop:12,padding:"12px 14px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><span style={{fontSize:16}}>🎨</span><span style={{fontWeight:700,fontSize:12,color:C.td}}>BRANDING</span></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
    <Inp label="Nom de la plateforme" value={hold.brand?.name||"L'INCUBATEUR ECS"} onChange={v=>setHold({...hold,brand:{...(hold.brand||DH.brand),name:v}})}/>
    <Inp label="Sous-titre" value={hold.brand?.sub||"Plateforme de pilotage"} onChange={v=>setHold({...hold,brand:{...(hold.brand||DH.brand),sub:v}})}/>
    <Inp label="Logo URL (optionnel)" value={hold.brand?.logoUrl||""} onChange={v=>setHold({...hold,brand:{...(hold.brand||DH.brand),logoUrl:v}})} placeholder="https://..."/>
    <Inp label="Lettre logo (fallback)" value={hold.brand?.logoLetter||"S"} onChange={v=>setHold({...hold,brand:{...(hold.brand||DH.brand),logoLetter:v.slice(0,2)}})}/>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginTop:4}}>
     <label style={{fontSize:10,color:C.td,fontWeight:600}}>Couleur accent</label>
     <input type="color" value={hold.brand?.accentColor||"#FFAA00"} onChange={e=>setHold({...hold,brand:{...(hold.brand||DH.brand),accentColor:e.target.value}})} style={{width:32,height:24,border:`1px solid ${C.brd}`,borderRadius:6,background:C.bg,cursor:"pointer"}}/>
     <span style={{fontSize:10,color:C.td}}>{hold.brand?.accentColor||"#FFAA00"}</span>
    </div>
    {hold.brand?.logoUrl&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:9,color:C.td}}>Aperçu:</span><div style={{width:36,height:36,borderRadius:8,overflow:"hidden",border:`1px solid ${C.brd}`}}><img src={hold.brand.logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div></div>}
   </div>
   <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={()=>{save(null,null,hold);setEHold(false);}}>Sauver</Btn><Btn v="secondary" onClick={()=>setEHold(false)}>Annuler</Btn></div></Modal>
   <Sect title="🔄 Charges récurrentes holding" right={<Btn small v="ghost" onClick={()=>setTab(13)}>Tout gérer →</Btn>}>
    {holdSubs.length>0&&<div style={{marginBottom:8}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:4}}>ABONNEMENTS · {fmt(holdSubsM)}€/m</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
    {holdSubs.map(s=><span key={s.id} style={{fontSize:9,background:C.card,border:`1px solid ${C.brd}`,padding:"3px 8px",borderRadius:6}}>{s.name} <strong style={{color:C.b}}>{fmt(subMonthly(s))}€</strong><span style={{color:C.td}}>/{s.freq==="annual"?"an":"m"}</span></span>)}
    </div>
    </div>}
    {holdTeam.length>0&&<div>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:4}}>ÉQUIPE · {fmt(holdTeamM)}€/m</div>
    {holdTeam.map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",background:C.card,borderRadius:6,border:`1px solid ${C.brd}`,marginBottom:2}}>
    <span style={{width:20,height:20,borderRadius:5,background:C.oD,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:9,color:C.o}}>{t.name[0]}</span>
    <span style={{flex:1,fontSize:10,fontWeight:600}}>{t.name}</span>
    <span style={{fontSize:9,color:C.td}}>{t.role}</span>
    <span style={{fontWeight:700,fontSize:10,color:t.payType==="fixed"?C.b:C.o}}>{t.payType==="fixed"?`${fmt(t.amount)}€/m`:`${t.amount}%`}</span>
    </div>)}
    </div>}
    {holdSubs.length===0&&holdTeam.length===0&&<div style={{color:C.td,fontSize:11,padding:8,textAlign:"center"}}>Aucune charge récurrente</div>}
    {allSubsM+allTeamM>holdSubsM+holdTeamM&&<div style={{marginTop:10,padding:"8px 10px",background:C.rD,borderRadius:8,border:`1px solid ${C.r}15`}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,marginBottom:4}}>TOUTES SOCIÉTÉS CONFONDUES</div>
    <div style={{display:"flex",gap:12}}>
    <span style={{fontSize:10,color:C.r}}>Abos: <strong>{fmt(allSubsM)}€/m</strong></span>
    <span style={{fontSize:10,color:C.o}}>Équipe: <strong>{fmt(allTeamM)}€/m</strong></span>
    <span style={{fontSize:10,color:C.r,fontWeight:700}}>Total: {fmt(allSubsM+allTeamM)}€/m</span>
    </div>
    </div>}
   </Sect>
  </>;})()}
  {tab===5&&<AICoPilot socs={socs} reps={reps} hold={hold} actions={actions} pulses={pulses} allM={allM} revData={revData} socBank={socBank} okrs={okrs} synergies={synergies} clients={clients}/>}
  {tab===6&&<DealFlow deals={deals} saveDeals={saveDeals}/>}
  {tab===7&&<TabCRM socs={socs} ghlData={ghlData} onSync={syncGHL}/>}
  {tab===8&&<BankingPanel revData={revData} onSync={syncRev} clients={clients}/>}
  {tab===10&&<SynergiesPanel socs={socs} synergies={synergies} saveSynergies={saveSynergies}/>}
  {tab===11&&<KnowledgeBase socs={socs} kb={kb} saveKb={saveKb}/>}
  {tab===12&&<ChallengesPanel socs={socs} reps={reps} allM={allM} pulses={pulses} challenges={challenges} saveChallenges={saveChallenges}/>}
  {tab===13&&<SubsTeamPanel socs={socs} subs={subs} saveSubs={saveSubs} team={team} saveTeam={saveTeam} socId="all" reps={reps} revData={revData}/>}
  </div>
  </div>
 </div>;
}
/* ANALYTIQUE TAB */
function AnalytiqueTab({socs,reps,allM}){
 const cM2=curM();const actS=socs.filter(s=>s.stat==="active");
 const[cmpIds,setCmpIds]=useState(actS.slice(0,3).map(s=>s.id));const cmpSocs=socs.filter(s=>cmpIds.includes(s.id));
 return <><Sect title="Comparaison" right={<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{actS.map(s=><button key={s.id} onClick={()=>setCmpIds(prev=>prev.includes(s.id)?prev.filter(x=>x!==s.id):[...prev,s.id])} style={{padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:600,border:`1px solid ${cmpIds.includes(s.id)?s.color:C.brd}`,background:cmpIds.includes(s.id)?s.color+"22":"transparent",color:cmpIds.includes(s.id)?s.color:C.td,cursor:"pointer",fontFamily:FONT}}>{s.nom}</button>)}</div>}>
  {cmpSocs.length>=2&&<><div className="fu d1" style={{height:200,background:C.card,borderRadius:12,border:`1px solid ${C.brd}`,padding:"14px 6px 6px 0"}}><ResponsiveContainer><BarChart data={allM.slice(-6).map(m=>{const row={mois:ml(m)};cmpSocs.forEach(s=>{row[s.nom]=pf(gr(reps,s.id,m)?.ca);});return row;})}><CartesianGrid strokeDasharray="3 3" stroke={C.brd}/><XAxis dataKey="mois" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/><Tooltip content={<CTip/>}/><Legend wrapperStyle={{fontSize:10}}/>{cmpSocs.map(s=><Bar key={s.id} dataKey={s.nom} fill={s.color} radius={[3,3,0,0]}/>)}</BarChart></ResponsiveContainer></div>
   <div style={{display:"grid",gridTemplateColumns:`repeat(${cmpSocs.length},1fr)`,gap:8,marginTop:12}}>{cmpSocs.map(s=>{const r=gr(reps,s.id,cM2);const ca2=r?pf(r.ca):0,ch2=r?pf(r.charges):0;const hs2=healthScore(s,reps);return <Card key={s.id} accent={s.color} style={{padding:12}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}><GradeBadge grade={hs2.grade} color={hs2.color}/><span style={{fontWeight:700,fontSize:12}}>{s.nom}</span></div>{[["CA",fmt(ca2)+"€"],["Marge",pct(ca2-ch2,ca2)+"%"],["Score",hs2.score+"/100"]].map(([l,v2],i2)=><div key={i2} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:11}}><span style={{color:C.td}}>{l}</span><span style={{fontWeight:700}}>{v2}</span></div>)}</Card>;})}</div></>}
 </Sect>
 <Sect title="CA Total"><div className="fu d2" style={{height:200,background:C.card,borderRadius:12,border:`1px solid ${C.brd}`,padding:"14px 6px 6px 0"}}><ResponsiveContainer><AreaChart data={allM.map(m=>{let t=0;socs.forEach(s=>{t+=pf(gr(reps,s.id,m)?.ca);});return{mois:ml(m),total:t};})}><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.acc} stopOpacity={.25}/><stop offset="100%" stopColor={C.acc} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.brd}/><XAxis dataKey="mois" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/><Tooltip content={<CTip/>}/><Area type="monotone" dataKey="total" stroke={C.acc} strokeWidth={2} fill="url(#ga)" name="CA Total"/></AreaChart></ResponsiveContainer></div></Sect>
 <Sect title="Répartition"><div className="fu d3" style={{height:200,background:C.card,borderRadius:12,border:`1px solid ${C.brd}`,padding:10,display:"flex",alignItems:"center"}}><div style={{width:"45%"}}><ResponsiveContainer><PieChart><Pie data={socs.filter(s=>pf(gr(reps,s.id,cM2)?.ca)>0).map(s=>({name:s.nom,value:pf(gr(reps,s.id,cM2).ca),color:s.color}))} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={3} strokeWidth={0}>{socs.filter(s=>pf(gr(reps,s.id,cM2)?.ca)>0).map((s,i)=><Cell key={i} fill={s.color}/>)}</Pie><Tooltip content={<CTip/>}/></PieChart></ResponsiveContainer></div><div style={{flex:1,paddingLeft:8}}>{socs.filter(s=>pf(gr(reps,s.id,cM2)?.ca)>0).sort((a2,b2)=>pf(gr(reps,b2.id,cM2).ca)-pf(gr(reps,a2.id,cM2).ca)).map(s=>{const ca3=pf(gr(reps,s.id,cM2).ca);const tot=socs.reduce((a2,s2)=>a2+pf(gr(reps,s2.id,cM2)?.ca),0);return <div key={s.id} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><span style={{width:5,height:5,borderRadius:3,background:s.color}}/><span style={{color:C.td,fontSize:10,flex:1}}>{s.nom}</span><span style={{fontWeight:700,fontSize:10}}>{fmt(ca3)}€</span><span style={{color:C.td,fontSize:9,width:28,textAlign:"right"}}>{pct(ca3,tot)}%</span></div>;})}</div></div></Sect>
 <RiskMatrix socs={socs} reps={reps} allM={allM}/>
 <CohortAnalysis socs={socs} reps={reps} allM={allM}/>
 </>;
}
