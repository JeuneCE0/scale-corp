import React from "react";
export const C_DARK={bg:"#06060b",card:"#0e0e16",card2:"#131320",brd:"#1a1a2c",brdL:"#24243a",acc:"#FFAA00",accD:"rgba(255,170,0,.12)",g:"#34d399",gD:"rgba(52,211,153,.1)",r:"#f87171",rD:"rgba(248,113,113,.1)",o:"#fb923c",oD:"rgba(251,146,60,.1)",b:"#60a5fa",bD:"rgba(96,165,250,.1)",t:"#e4e4e7",td:"#71717a",tm:"#3f3f50",v:"#a78bfa",vD:"rgba(167,139,250,.1)"};
export const C_LIGHT={bg:"#f5f5f5",card:"#ffffff",card2:"#f0f0f0",brd:"#e0e0e0",brdL:"#d0d0d0",acc:"#FFAA00",accD:"#FFF3D6",g:"#22c55e",gD:"#dcfce7",r:"#ef4444",rD:"#fee2e2",b:"#3b82f6",bD:"#dbeafe",o:"#f97316",oD:"#fff7ed",v:"#8b5cf6",vD:"#ede9fe",t:"#1a1a1a",td:"#666666",tm:"#999999"};
export let C=C_DARK;
export function getTheme(){try{return localStorage.getItem("scTheme")||"dark";}catch{return"dark";}}
export function applyTheme(t){try{localStorage.setItem("scTheme",t);}catch{}C=t==="light"?C_LIGHT:C_DARK;try{document.documentElement.setAttribute("data-theme",t);document.body.style.transition="background-color .3s ease,color .3s ease";}catch{}}
applyTheme(getTheme());
export const MN=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
export const curM=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
export const ml=k=>{if(!k)return"";const[y,m]=k.split("-");return`${MN[parseInt(m)-1]} ${y}`;};
export const fmt=n=>new Intl.NumberFormat("fr-FR").format(Math.round(n||0));
export const fK=n=>n>=1e3?`${(n/1e3).toFixed(1).replace(".0","")}K`:String(n);
export const pct=(a,b)=>b?Math.round(a/b*100):0;
export const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export const prevM=m=>{const[y,mo]=m.split("-").map(Number);const d=new Date(y,mo-2,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
export const nextM=m=>{const[y,mo]=m.split("-").map(Number);const d=new Date(y,mo,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
export const pf=v=>parseFloat(v)||0;export const gr=(reps,id,m)=>reps[`${id}_${m}`]||null;
export const FONT="'Teachers',sans-serif";
export const FONT_TITLE="'Eurostile','Square721 BT','Arial Black',sans-serif";
export const BF={ca:"",charges:"",chargesOps:"",salaire:"",formation:"",clients:"",churn:"",pub:"",leads:"",leadsContact:"",leadsClos:"",notes:"",mrr:"",pipeline:"",tresoSoc:""};
export const deadline=m=>{const[y,mo]=m.split("-").map(Number);return new Date(y,mo,5).toLocaleDateString("fr-FR",{day:"numeric",month:"long"});};
export const qOf=m=>Math.ceil(parseInt(m.split("-")[1])/3);
export const qMonths=m=>{const[y]=m.split("-").map(Number);const s=(qOf(m)-1)*3;return[0,1,2].map(i=>`${y}-${String(s+i+1).padStart(2,"0")}`);};
export const qLabel=m=>`T${qOf(m)} ${m.split("-")[0]}`;
export const ago=d=>{const s=Math.floor((Date.now()-new Date(d).getTime())/1e3);if(s<60)return"à l'instant";if(s<3600)return`il y a ${Math.floor(s/60)}min`;if(s<86400)return`il y a ${Math.floor(s/3600)}h`;return`il y a ${Math.floor(s/86400)}j`;};
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
export class ErrorBoundary extends React.Component{constructor(p){super(p);this.state={err:null};}static getDerivedStateFromError(e){return{err:e};}render(){if(this.state.err)return <div style={{padding:20,textAlign:"center",background:C.card,borderRadius:12,border:`1px solid ${C.brd}`}}><div style={{fontSize:28,marginBottom:8}}>⚠️</div><div style={{fontWeight:700,fontSize:13,marginBottom:4,color:C.t}}>{this.props.label||"Erreur"}</div><div style={{color:C.td,fontSize:11}}>{this.state.err.message}</div><button onClick={()=>this.setState({err:null})} style={{marginTop:10,padding:"6px 14px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,cursor:"pointer",fontSize:11}}>Réessayer</button></div>;return this.props.children;}}
export const curW=()=>{const d=new Date();const jan1=new Date(d.getFullYear(),0,1);return`${d.getFullYear()}-W${String(Math.ceil(((d-jan1)/864e5+jan1.getDay()+1)/7)).padStart(2,"0")}`;};
export const MOODS=["😫","😟","😐","🙂","🔥"];
export const sinceLbl=d=>{if(!d)return"";const s=new Date(d),n=new Date();const m=(n.getFullYear()-s.getFullYear())*12+n.getMonth()-s.getMonth();if(m<1)return"Ce mois";if(m===1)return"1 mois";if(m<12)return`${m} mois`;const y=Math.floor(m/12),rm=m%12;return rm>0?`${y}a ${rm}m`:`${y} an${y>1?"s":""}`;};
export const sinceMonths=d=>{if(!d)return 0;const s=new Date(d),n=new Date();return(n.getFullYear()-s.getFullYear())*12+n.getMonth()-s.getMonth();};
export const CSS=`@import url('https://fonts.googleapis.com/css2?family=Teachers:wght@400;500;600;700;800;900&display=swap');\n*{box-sizing:border-box;margin:0;padding:0}body{margin:0;overflow-x:hidden}
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
@media(max-width:768px){.sidebar-desktop{display:none !important}.main-content{margin-left:0 !important;padding:10px !important;padding-top:48px !important}.mobile-header{display:flex !important}.kpi-grid-responsive{grid-template-columns:1fr 1fr !important}.chart-responsive{min-height:180px}.tx-list-mobile .tx-detail{display:none}.rg4{grid-template-columns:1fr 1fr !important}.rg2{grid-template-columns:1fr !important}.rg3{grid-template-columns:1fr !important}.rg-auto{grid-template-columns:1fr 1fr !important}.glass-card,.glass-card-static{min-width:0 !important;overflow:hidden}.admin-grid{grid-template-columns:1fr !important}.admin-card{min-width:auto !important}.admin-stats-row{grid-template-columns:1fr !important;gap:8px !important}.pulse-grid{grid-template-columns:1fr !important}.pulse-left,.pulse-right{display:none !important}.pulse-center{grid-column:1 !important}.admin-responsive-grid{grid-template-columns:1fr !important}.admin-responsive-2col{grid-template-columns:1fr 1fr !important}table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;font-size:11px !important}.admin-soc-grid{grid-template-columns:1fr !important}.admin-soc-selector{left:10px !important;top:50px !important}.modal-wide{width:95vw !important;max-width:95vw !important}.glass-modal{width:95vw !important;max-width:95vw !important;padding:14px !important}.ai-chat-panel{width:92vw !important;right:0 !important;max-width:none !important}.notif-panel{width:88vw !important;right:0 !important}.recharts-wrapper{font-size:10px !important}.page-wrap{padding:12px 10px !important}.rg2k{grid-template-columns:1fr 1fr !important}.ob-sidebar{display:none !important}.ob-content{padding:14px 10px !important}}
@media(min-width:769px){.mobile-header{display:none !important}}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.brd};border-radius:3px}
input[type=range]{-webkit-appearance:none;background:${C.brd};height:3px;border-radius:4px;outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${C.acc};cursor:pointer;box-shadow:0 2px 6px rgba(255,170,0,.3)}
select{cursor:pointer}select:focus{border-color:${C.acc}44}
button:focus-visible{outline:2px solid ${C.acc}44;outline-offset:2px}
.glass-bg{background:#08080d;background-image:radial-gradient(at 20% 30%,rgba(255,170,0,.02) 0%,transparent 50%),radial-gradient(at 80% 70%,rgba(255,157,0,.015) 0%,transparent 50%)}
.glass-card{background:rgba(14,14,22,.5);border:1px solid rgba(255,255,255,.05);border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:all .25s ease}
.glass-card:hover{border-color:rgba(255,170,0,.12);transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.3)}
.glass-card-static{background:rgba(14,14,22,.5);border:1px solid rgba(255,255,255,.05);border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.glass-sidebar{background:rgba(14,14,22,.75);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-right:1px solid rgba(255,255,255,.04)}
.glass-input{background:rgba(6,6,11,.6);border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:all .2s ease}
.glass-input:focus-within{border-color:rgba(255,170,0,.3);box-shadow:0 0 16px rgba(255,170,0,.08)}
.glass-modal{background:rgba(14,14,22,.85);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,.08);box-shadow:0 24px 64px rgba(0,0,0,.6)}
.glow-accent{box-shadow:0 0 20px rgba(255,170,0,.15)}
.glow-accent-strong{box-shadow:0 0 30px rgba(255,170,0,.25),0 4px 16px rgba(0,0,0,.3)}
.glass-btn-ghost{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.glass-btn-ghost:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12)}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
[data-theme="light"] .glass-bg{background:#f7f7f8;background-image:radial-gradient(at 20% 30%,rgba(255,170,0,.03) 0%,transparent 50%)}
[data-theme="light"] .glass-card{background:rgba(255,255,255,.9);border:1px solid rgba(0,0,0,.06);box-shadow:0 1px 3px rgba(0,0,0,.04)}
[data-theme="light"] .glass-card:hover{border-color:rgba(255,170,0,.2);box-shadow:0 4px 12px rgba(0,0,0,.08)}
[data-theme="light"] .glass-card-static{background:rgba(255,255,255,.9);border:1px solid rgba(0,0,0,.06);box-shadow:0 1px 3px rgba(0,0,0,.04)}
[data-theme="light"] .glass-sidebar{background:rgba(255,255,255,.9);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-right:1px solid rgba(0,0,0,.08)}
[data-theme="light"] .glass-input{background:rgba(255,255,255,.8);border:1px solid rgba(0,0,0,.1)}
[data-theme="light"] .glass-input:focus-within{border-color:rgba(255,170,0,.5);box-shadow:0 0 12px rgba(255,170,0,.1)}
[data-theme="light"] .glass-modal{background:rgba(255,255,255,.92);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border:1px solid rgba(0,0,0,.1);box-shadow:0 16px 48px rgba(0,0,0,.15)}
[data-theme="light"] .glass-btn-ghost{background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.08)}
[data-theme="light"] .glass-btn-ghost:hover{background:rgba(0,0,0,.06);border-color:rgba(0,0,0,.15)}
[data-theme="light"] ::-webkit-scrollbar-thumb{background:#d0d0d0}
[data-theme="light"] input[type=range]{background:#e0e0e0}
[data-theme="light"] body{background:#f5f5f5;color:#1a1a1a}
:root{--sc-card-a3:rgba(14,14,22,.3);--sc-card-a4:rgba(14,14,22,.4);--sc-card-a5:rgba(14,14,22,.5);--sc-card-a6:rgba(14,14,22,.6);--sc-card-a7:rgba(14,14,22,.7);--sc-card-a75:rgba(14,14,22,.75);--sc-card-a8:rgba(14,14,22,.8);--sc-card-a85:rgba(14,14,22,.85);--sc-card-a9:rgba(14,14,22,.9);--sc-input-a5:rgba(6,6,11,.5);--sc-input-a6:rgba(6,6,11,.6);--sc-w015:rgba(255,255,255,.015);--sc-w04:rgba(255,255,255,.04);--sc-w05:rgba(255,255,255,.05);--sc-w06:rgba(255,255,255,.06);--sc-w08:rgba(255,255,255,.08)}
[data-theme="light"]{--sc-card-a3:rgba(255,255,255,.6);--sc-card-a4:rgba(255,255,255,.7);--sc-card-a5:rgba(255,255,255,.75);--sc-card-a6:rgba(255,255,255,.85);--sc-card-a7:rgba(255,255,255,.88);--sc-card-a75:rgba(255,255,255,.9);--sc-card-a8:rgba(255,255,255,.92);--sc-card-a85:rgba(255,255,255,.93);--sc-card-a9:rgba(255,255,255,.95);--sc-input-a5:rgba(255,255,255,.7);--sc-input-a6:rgba(255,255,255,.8);--sc-w015:rgba(0,0,0,.02);--sc-w04:rgba(0,0,0,.03);--sc-w05:rgba(0,0,0,.04);--sc-w06:rgba(0,0,0,.08);--sc-w08:rgba(0,0,0,.1)}`;
export const DS=[
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
export const DH={logiciels:1200,equipe:300,service:500,cabinet:280,remun:3000,reservePct:30,crm:150,treso:2000,revolutToken:"",revolutEnv:"sandbox",slack:{enabled:false,mode:"bob",webhookUrl:"",botToken:"",channel:"",bobWebhook:"",notifyPulse:true,notifyReport:true,notifyValidation:true,notifyReminders:true},brand:{name:"L'INCUBATEUR ECS",sub:"Plateforme de pilotage",logoUrl:"/logo-ecs.png",logoLetter:"E",accentColor:"#FFAA00",gradientFrom:"#FFBF00",gradientTo:"#FF9D00"}};
export const DEAL_STAGES=["Idée","Contact","Négociation","Due Diligence","Signature"];
export function mkPrefill(){ return {}; }

export function autoGenerateReport(socId, month, socBank, ghlData, subs){
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
export const DEMO_JOURNAL={};
export const DEMO_ACTIONS=[];
export const DEMO_PULSES={};
export const DEMO_DEALS=[];
export const curQ=()=>{const d=new Date();return`${d.getFullYear()}-Q${Math.ceil((d.getMonth()+1)/3)}`;};
export const DEMO_OKRS=[];
export const DEMO_SYNERGIES=[];
export const SYN_TYPES={referral:{label:"Referral",icon:"🔗",color:C.b},collab:{label:"Collaboration",icon:"🤝",color:C.v},resource:{label:"Ressource partagée",icon:"📦",color:C.o}};
export const SYN_STATUS={active:{label:"En cours",color:C.b},won:{label:"Gagné",color:C.g},lost:{label:"Perdu",color:C.r}};
export const SUB_CATS={crm:{l:"CRM/Marketing",icon:"💻",c:C.v},design:{l:"Design",icon:"🎨",c:C.o},comms:{l:"Communication",icon:"💬",c:C.b},iadev:{l:"IA/Dev",icon:"🤖",c:C.g},productivite:{l:"Productivité",icon:"📊",c:C.acc},formation:{l:"Formation/Communauté",icon:"🎓",c:"#f59e0b"},paiement:{l:"Paiement",icon:"💳",c:C.r},abonnement:{l:"Abonnement",icon:"🔄",c:"#8b5cf6"},prestataire:{l:"Prestataire",icon:"👤",c:"#ec4899"},autre:{l:"Autre",icon:"📦",c:C.td}};
export const AUTO_CAT_MAP=[
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
export function autoCategorize(name){for(const[rx,cat]of AUTO_CAT_MAP)if(rx.test(name))return cat;return"autre";}
export function autoDetectSubscriptions(bankData,socId){
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
export const DEMO_SUBS=[];
export const DEMO_TEAM=[];
export function subMonthly(sub){return sub.freq==="annual"?Math.round(sub.amount/12):sub.amount;}
export const BILL_TYPES={
 fixed:{l:"Forfait fixe",icon:"💰",c:C.acc,desc:"Montant fixe mensuel avec ou sans engagement"},
 percent:{l:"% du CA/bénéfice",icon:"📊",c:C.v,desc:"Pourcentage sur le CA ou bénéfice généré"},
 hybrid:{l:"Fixe + %",icon:"💎",c:"#ec4899",desc:"Forfait fixe + pourcentage sur CA ou bénéfice"},
 oneoff:{l:"Prestation unique",icon:"🎯",c:C.b,desc:"Paiement unique (formation, accompagnement)"},
};
export const CLIENT_STATUS={active:{l:"Actif",c:C.g,icon:"✓"},paused:{l:"En pause",c:C.o,icon:"⏸"},churned:{l:"Perdu",c:C.r,icon:"✗"},completed:{l:"Terminé",c:C.td,icon:"✓"},prospect:{l:"Prospect",c:C.b,icon:"◌"}};
export const DEMO_CLIENTS=[];
export function clientMonthlyRevenue(cl){
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
export function clientTotalValue(cl){
 const b=cl.billing;if(!b)return 0;
 if(b.type==="oneoff")return Number(b.amount)||0;
 if(b.type==="fixed"){
  const months=b.commitment||1;
  return (Number(b.amount)||0)*months;
 }
 return clientMonthlyRevenue(cl)*12;
}
export function commitmentEnd(cl){
 const b=cl.billing;if(!b||b.type!=="fixed"||!b.commitment||!b.startDate)return null;
 const d=new Date(b.startDate);d.setMonth(d.getMonth()+b.commitment);return d;
}
export function commitmentRemaining(cl){
 const end=commitmentEnd(cl);if(!end)return null;
 const now=new Date();const m=Math.max(0,Math.round((end-now)/(30*864e5)));return m;
}
export const INV_STATUS={
 draft:{l:"Brouillon",c:C.td,icon:"📝",bg:C.card2},
 sent:{l:"Envoyée",c:C.b,icon:"📤",bg:C.bD},
 paid:{l:"Payée",c:C.g,icon:"✅",bg:C.gD},
 overdue:{l:"En retard",c:C.r,icon:"⚠️",bg:C.rD},
 cancelled:{l:"Annulée",c:C.td,icon:"✗",bg:C.card2},
};
export function generateInvoices(client,socName){
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
export function refreshInvoiceStatuses(invoices){
 const today=new Date().toISOString().slice(0,10);
 return invoices.map(inv=>{
  if(inv.status==="sent"&&inv.dueDate<today)return{...inv,status:"overdue"};
  return inv;
 });
}
export async function ghlCreateInvoice(apiKey,invoice,client){
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
export async function ghlSendInvoice(apiKey,ghlInvoiceId){
 if(!apiKey||!ghlInvoiceId)return false;
 try{
  const r=await fetch(`${GHL_BASE}/invoices/${ghlInvoiceId}/send`,{
   method:"POST",
   headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
  });
  return r.ok;
 }catch(e){console.warn("GHL send invoice failed:",e.message);return false;}
}
export function mkDemoInvoices(){ return []; }
export function teamMonthly(tm,socCA){return tm.payType==="fixed"?tm.amount:Math.round((socCA||0)*tm.amount/100);}
export function normalizeStr(s){return(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");}
export function fuzzyMatch(a,b){
 const na=normalizeStr(a),nb=normalizeStr(b);
 if(!na||!nb)return 0;
 if(na===nb)return 1;
 if(na.includes(nb)||nb.includes(na))return .9;
 const ta=a.toLowerCase().split(/\s+/).filter(Boolean),tb=b.toLowerCase().split(/\s+/).filter(Boolean);
 const common=ta.filter(t=>tb.some(u=>u.includes(t)||t.includes(u)));
 return common.length/Math.max(ta.length,tb.length);
}
export function matchSubsToRevolut(subs,socBankData,socId){
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
export function deduplicatedCharges(totalChargesFromReport,matchedSubs){
 const matchedTotal=matchedSubs.filter(s=>s.revMatch).reduce((a,s)=>a+subMonthly(s),0);
 return{raw:totalChargesFromReport,matchedSubsTotal:matchedTotal,deduped:totalChargesFromReport,note:matchedTotal>0?`${fmt(matchedTotal)}€ d'abos déjà comptés dans Revolut`:""};
}
export const KB_CATS={playbook:{label:"📘 Playbooks",color:C.b},template:{label:"📄 Templates",color:C.g},contact:{label:"👤 Contacts",color:C.o},tool:{label:"🔧 Outils",color:C.v},tip:{label:"💡 Tips",color:C.acc}};
export const DEMO_KB=[
 {id:"kb1",title:"Playbook Cold Outreach B2B",cat:"playbook",author:"leadx",content:"1. Identifier ICP via LinkedIn Sales Nav\n2. Scraper avec Phantombuster\n3. Séquence 3 emails (J0, J3, J7)\n4. Follow-up LinkedIn J10\n5. Call si ouverture > 40%",tags:["prospection","b2b","email"],date:"2026-01-05",likes:3},
 {id:"kb2",title:"Template Proposition Commerciale",cat:"template",author:"copy",content:"Structure gagnante :\n• Contexte client (montrer qu'on a compris)\n• Problème identifié\n• Solution proposée (3 options)\n• Pricing avec ancrage\n• Garantie + urgence\n• CTA clair",tags:["vente","pricing","template"],date:"2026-01-12",likes:5},
 {id:"kb3",title:"Contact Imprimeur fiable",cat:"contact",author:"bbp",content:"Jean-Marc Dubois — Imprim'Express\njm@imprimexpress.re — 0692 XX XX XX\nTarifs compétitifs, délais 48h, livraison gratuite > 200€",tags:["print","fournisseur"],date:"2026-01-20",likes:2},
 {id:"kb4",title:"Stack Outils recommandée",cat:"tool",author:"eco",content:"• CRM: GoHighLevel (déjà intégré)\n• Compta: Pennylane\n• Design: Figma + Canva Pro\n• Vidéo: CapCut Pro + DaVinci\n• Emailing: Brevo\n• Analytics: Plausible\n• Paiement: Stripe + Revolut Business",tags:["outils","stack","setup"],date:"2025-12-15",likes:7},
 {id:"kb5",title:"Méthode pricing \"Value-Based\"",cat:"tip",author:"copy",content:"Ne jamais pricer au temps passé. Toujours pricer à la valeur créée.\n\nFormule : Prix = 10% de la valeur annuelle que tu génères pour le client.\n\nExemple : tu gères 50K€/an de pub → facture 5K€/mois minimum.",tags:["pricing","mindset"],date:"2026-02-01",likes:4},
 {id:"kb6",title:"Script Appel Découverte",cat:"playbook",author:"leadx",content:"Intro (2min) : Contexte, pourquoi cet appel\nDouleur (5min) : Quel est le plus gros frein à ta croissance ?\nImpact (3min) : Combien ça te coûte de ne rien faire ?\nSolution (5min) : Voici comment on résout ça\nClose (2min) : On démarre quand ?",tags:["vente","appel","closing"],date:"2026-02-08",likes:6},
];
export const GHL_STAGES_COLORS=["#60a5fa","#FFAA00","#fb923c","#34d399","#a78bfa","#f43f5e","#14b8a6","#eab308"];
export const GHL_BASE="/api/ghl";
export function mkGHLDemo(){ return {}; }
export async function ghlUpdateContact(locationId,contactId,data){return fetchGHL("contact_update",locationId,{contactId,data});}
export async function ghlCreateContact(locationId,data){return fetchGHL("contact_create",locationId,{data});}
export async function fetchGHL(action,locationId,params={}){
 try{
  const r=await fetch(GHL_BASE,{
   method:"POST",
   headers:sbAuthHeaders(),
   body:JSON.stringify({action,locationId,...params})
  });
  if(!r.ok)throw new Error(`GHL proxy ${r.status}`);return await r.json();
 }catch(e){console.warn("GHL fetch failed:",e.message);return null;}
}
export async function syncGHLForSoc(soc){
 if(!soc.ghlLocationId)return null;
 const cacheKey="ghl_"+soc.id;
 const loc=soc.ghlLocationId;
 const pipData=await fetchGHL("pipelines",loc);
 if(!pipData||!pipData.pipelines){const cached=cacheGet(cacheKey);return cached||null;}
 const allPipelines=pipData.pipelines||[];
 if(allPipelines.length===0){const cached=cacheGet(cacheKey);return cached||null;}
 // Fetch opportunities, contacts and calendar in parallel
 const [oppResults,ctData,evData,convData]=await Promise.all([
  Promise.all(allPipelines.map(pip=>fetchGHL("opportunities",loc,{pipeline_id:pip.id}).then(d=>({pip,d})))),
  fetchGHL("contacts_list",loc),
  fetchGHL("calendar_events",loc,{startTime:Date.now()-365*24*60*60*1000,endTime:Date.now()}),
  fetchGHL("conversations_list",loc)
 ]);
 let allMappedOpps=[];const allPipelinesMeta=[];
 for(const{pip,d:oppData2} of oppResults){
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
 const calEvents=evData?.events||[];
 const result={
  pipelines:allPipelinesMeta,opportunities:mappedOpps,ghlClients,calendarEvents:calEvents,
  conversations:(convData?.conversations||[]).map(c=>({id:c.id,contactId:c.contactId,contactName:c.contactName||c.fullName||"Sans nom",lastMsg:c.lastMessageBody||"",lastMsgDate:c.lastMessageDate||c.dateUpdated,unread:c.unreadCount||0,type:c.type||"",locationId:loc})),
  stats:{totalLeads:mappedOpps.length,openDeals:open2.length,wonDeals:won.length,
   lostDeals:mappedOpps.filter(o=>o.status==="lost").length,pipelineValue:open2.reduce((a,o)=>a+o.value,0),
   wonValue:won.reduce((a,o)=>a+o.value,0),conversionRate:mappedOpps.length>0?Math.round(won.length/mappedOpps.length*100):0,
   avgDealSize:mappedOpps.length>0?Math.round(mappedOpps.reduce((a,o)=>a+o.value,0)/mappedOpps.length):0,
   totalCalls:calEvents.length,
   callsByType:calEvents.reduce((acc,e)=>{const n=e.calendarName||"Autre";acc[n]=(acc[n]||0)+1;return acc;},{}),
   sourceBreakdown:[]},lastSync:new Date().toISOString(),isDemo:false
 };
 cacheSet(cacheKey,result);
 return result;
}
export const SLACK_MODES={
 webhook:{l:"Webhook",desc:"Incoming Webhook URL — simple, pas besoin d'app",icon:"🔗"},
 bot:{l:"Bot Token",desc:"Bot OAuth Token (xoxb-…) — plus de contrôle, peut tagger",icon:"🤖"},
 bob:{l:"Bob (Agent IA)",desc:"Via votre app Bob existante — webhook custom",icon:"🧠"},
};
export async function slackWebhookSend(webhookUrl,message){
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
export async function slackBotSend(botToken,channel,message){
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
export async function slackSend(slackConfig,message){
 if(!slackConfig)return{ok:false,error:"no_config"};
 const mode=slackConfig.mode||"webhook";
 if(mode==="bot"){
  return slackBotSend(slackConfig.botToken,slackConfig.channel,message);
 }
 const url=mode==="bob"?slackConfig.bobWebhook:slackConfig.webhookUrl;
 return slackWebhookSend(url,message);
}
export function slackMention(soc){
 if(soc.slackId)return`<@${soc.slackId}>`;
 return`*${soc.porteur}*`;
}
export function buildPulseSlackMsg(soc,pulse){
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
export function buildReportSlackMsg(soc,report,mo){
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
export function buildReminderSlackMsg(soc,type,deadlineStr){
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
export function buildValidationSlackMsg(soc,comment,mo){
 return{
  text:`✅ Rapport validé — ${soc.nom}`,
  blocks:[
   {type:"section",text:{type:"mrkdwn",text:`${slackMention(soc)} ✅ Ton rapport *${ml(mo)}* a été validé par Scale Corp !${comment?`\n💬 _"${comment}"_`:""}`}},
  ],
 };
}
export async function checkAndSendReminders(socs2,reps2,pulses2,slackConfig){
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
export const STRIPE_PROXY="/api/stripe";
export async function fetchStripe(action,params={}){
 try{
  const r=await fetch(STRIPE_PROXY,{method:"POST",headers:sbAuthHeaders(),body:JSON.stringify({action,...params})});
  if(!r.ok)return null;return await r.json();
 }catch(e){console.warn("Stripe fetch failed:",e.message);return null;}
}
export async function syncStripeData(){
 try{
  const[custRes,chargesRes,subsRes]=await Promise.all([
   fetchStripe("customers_list"),
   fetchStripe("charges_list"),
   fetchStripe("subscriptions_list"),
  ]);
  if(!custRes&&!chargesRes&&!subsRes){return cacheGet("stripe")||null;}
  const result={
   customers:custRes?.data||[],
   charges:chargesRes?.data||[],
   subscriptions:subsRes?.data||[],
   lastSync:new Date().toISOString(),
  };
  cacheSet("stripe",result);
  return result;
 }catch(e){console.warn("Stripe sync failed:",e.message);return cacheGet("stripe")||null;}
}
export function getStripeChargesForClient(stripeData,client){
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
export function getStripeTotal(charges){
 return charges.filter(c=>c.status==="succeeded").reduce((a,c)=>a+Math.round((c.amount||0)/100),0);
}
export const REV_ENVS={sandbox:"https://sandbox-b2b.revolut.com/api/1.0",production:"https://b2b.revolut.com/api/1.0"};
export const CURR_SYMBOLS={EUR:"€",USD:"$",GBP:"£",CHF:"CHF",SEK:"kr",NOK:"kr",DKK:"kr",PLN:"zł",CZK:"Kč",HUF:"Ft",RON:"lei",BGN:"лв",HRK:"kn",AED:"AED",CAD:"CA$",AUD:"A$",JPY:"¥"};
export function mkRevolutDemo(){ return null; }
export async function fetchRevolut(company,endpoint){
 try{
  const action=endpoint.includes("/transactions")?"transactions":"accounts";
  const r=await fetch("/api/revolut",{method:"POST",headers:sbAuthHeaders(),body:JSON.stringify({action,company})});
  if(!r.ok)throw new Error(`Revolut proxy ${r.status}`);return await r.json();
 }catch(e){console.warn("Revolut fetch failed:",e.message);return null;}
}
export async function syncRevolut(company){
 if(!company)return null;
 const ck="rev_"+company;
 const accounts=await fetchRevolut(company,"/accounts");
 if(!accounts){const cached=cacheGet(ck);return cached||null;}
 const txns=await fetchRevolut(company,"/transactions?count=25");
 const accs=(Array.isArray(accounts)?accounts:[]).map(a=>({
  id:a.id,name:a.name||"Compte",balance:a.balance,currency:a.currency,state:a.state,updated_at:a.updated_at
 }));
 const totalEUR=accs.reduce((s,a)=>s+(a.currency==="EUR"?a.balance:a.balance*0.92),0);
 const result={accounts:accs,transactions:Array.isArray(txns)?txns:[],totalEUR,lastSync:new Date().toISOString(),isDemo:false};
 cacheSet(ck,result);return result;
}
export function mkSocRevDemo(){ return null; }
// Accounts to exclude from treasury per company (personal pockets, dividend transit, etc.)
// Check if a transaction involves any excluded pocket account (any leg)
const EXCLUDED_DESCRIPTIONS=[/from mohammad dayyaan/i,/to mohammad dayyaan/i];
export function isExcludedTx(tx,excl){if(!excl||excl.length===0)return false;const leg=tx.legs?.[0];if(!leg)return true;if(excl.includes(leg.account_id))return true;if(tx.type==="transfer"&&(tx.legs||[]).some(l=>excl.includes(l.account_id)))return true;if(tx.type==="exchange")return true;const desc=(leg.description||tx.reference||"").toLowerCase();if(EXCLUDED_DESCRIPTIONS.some(rx=>rx.test(desc)))return true;return false;}
export const EXCLUDED_ACCOUNTS={
 leadx:["5c008ba9-b9a7-4141-97dc-6a53ef3d6646","5fce1497-811e-4266-9889-2da74aa27733","2918c7ec-c0ed-4d9b-92f9-0abd1f3eff9c","8cdffd30-603d-40f4-bbca-3dec89ae0ded"], // Dayyaan, SCALE CORP, Prestataires, Budget Client
 copy:["a1edf694-ba2d-e22e-0400-127be91fc216","a86df684-89e0-e227-0400-12caeed463bb","bd0ed66e-8c45-e2ea-0400-12f5f3c26431","50235dfb-45de-e28e-0400-12838affb4e8","fd2034e4-5573-e212-0400-12fc5150f4bb","247e7259-d80f-e2c2-0400-12f2c5aec474"], // BCS: Sol, Anthony&Rudy, Publicité, Abonnements, Prestataires, Jimmy
 eco:["a418f8cb-7001-40e8-acd3-e52f092294d4","39786a9f-7dd8-46e3-aba8-d8acca9e4bd7","fa4578d8-5d7f-4b9c-b2eb-afa01061d28e","88fb482e-26b3-494e-9234-5cded1b76799","d45a5ba7-cefa-4e21-85f9-cdafa6c60648","12440858-679f-4781-8db1-eb0ebbb986b3","f893a7c1-64b4-4247-9625-9f640d768b96","9f8f33c4-112f-44ad-81ea-a8acbca1efb7"], // Anthony, Dettes, Loyer, A-Loyer, Courses, Rudy, A-Courses, A-Loisirs
};
export async function syncSocRevolut(soc){
 if(!soc.revolutCompany)return null;
 const ck="socrev_"+soc.id;
 const accounts=await fetchRevolut(soc.revolutCompany,"/accounts");
 if(!accounts){const cached=cacheGet(ck);return cached||null;}
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
 txns.forEach(tx=>{const m=tx.month;const leg=tx.legs?.[0];if(!leg)return;if(isExcludedTx(tx,excluded))return;const amt=leg.amount;if(!monthly[m])monthly[m]={income:0,expense:0};if(amt>0)monthly[m].income+=amt;else monthly[m].expense+=Math.abs(amt);});
 Object.keys(monthly).forEach(m=>{monthly[m].income=Math.round(monthly[m].income);monthly[m].expense=Math.round(monthly[m].expense);});
 const result={accounts:accs,transactions:txns.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)),balance:Math.round(balance),monthly,lastSync:new Date().toISOString(),isDemo:false};
 cacheSet(ck,result);return result;
}
export function revFinancials(socBankData,month){
 if(!socBankData||!socBankData.monthly)return null;
 const m=socBankData.monthly[month];
 if(!m)return null;
 return{ca:m.income,charges:m.expense,tresoSoc:socBankData.balance,net:m.income-m.expense};
}
export const STORE_URL="/api/store";
let _storeToken=null;
export function getStoreToken(){return _storeToken;}
export function setStoreToken(v){_storeToken=v;}
let _currentSocId=null;
export function getCurrentSocId(){return _currentSocId;}
export function setCurrentSocId(v){_currentSocId=v;}
export async function storeCall(action,key,value){
 try{
  if(!_storeToken){const m=localStorage.getItem("sc_store_token");if(m)_storeToken=m;}
  if(!_storeToken)return null;
  const r=await fetch(STORE_URL,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${_storeToken}`},body:JSON.stringify({action,key,value})});
  if(!r.ok)return null;return await r.json();
 }catch{return null;}
}
// Auth header helper
export function sbAuthHeaders(){
 const h={'Content-Type':'application/json'};
 try{const t=localStorage.getItem('sc_auth_token');if(t){const v=JSON.parse(t);if(v)h['Authorization']=`Bearer ${v}`;}}catch{}
 return h;
}
// Supabase helper — fire-and-forget upsert
export function sbUpsert(table, data){
 // Wrap in {id, data} JSONB format for tables that use it
 const jsonbTables=['societies','holding'];
 const payload=jsonbTables.includes(table)?{id:data.id||'main',data:JSON.parse(JSON.stringify(data)),updated_at:new Date().toISOString()}:data;
 return fetch('/api/supabase?action=upsert',{method:'POST',headers:sbAuthHeaders(),body:JSON.stringify({table,data:payload})}).catch(()=>{});
}
// Supabase helper — get rows
export async function sbGet(table, societyId, filters){
 try{
  let url=`/api/supabase?action=get&table=${encodeURIComponent(table)}`;
  if(societyId)url+=`&society_id=${encodeURIComponent(societyId)}`;
  if(filters)url+=`&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  const r=await fetch(url,{headers:sbAuthHeaders()});if(!r.ok)return null;return await r.json();
 }catch{return null;}
}
export async function sbList(table, societyId){
 try{
  let url=`/api/supabase?action=list&table=${encodeURIComponent(table)}`;
  if(societyId)url+=`&society_id=${encodeURIComponent(societyId)}`;
  const r=await fetch(url,{headers:sbAuthHeaders()});if(!r.ok)return null;return await r.json();
 }catch{return null;}
}
// Session timeout: auto-logout after 24h inactivity
(function(){
 const TIMEOUT=24*60*60*1000;
 const KEY='sc_last_activity';
 function touch(){localStorage.setItem(KEY,Date.now().toString());}
 function check(){const last=parseInt(localStorage.getItem(KEY)||'0');if(last&&Date.now()-last>TIMEOUT){localStorage.removeItem('sc_auth_token');localStorage.removeItem('sc_user');localStorage.removeItem(KEY);window.location.reload();}}
 ['click','keydown','scroll','mousemove'].forEach(e=>document.addEventListener(e,touch,{passive:true}));
 touch();setInterval(check,60000);
})();
export async function sGet(k){
 try{
  const ls=localStorage.getItem(k);const local=ls?JSON.parse(ls):null;
  return local;
 }catch{try{const ls=localStorage.getItem(k);return ls?JSON.parse(ls):null;}catch{return null;}}
}
export async function sSet(k,v){
 try{
  localStorage.setItem(k,JSON.stringify(v));
  // Fire-and-forget to Supabase user_settings
  sbUpsert('user_settings',{society_id:_currentSocId||'global',key:k,value:v});
  // Also legacy store
  storeCall("set",k,v);
 }catch(e){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
}
// One-time pull from Supabase to localStorage on login
export async function syncFromSupabase(socId){
 try{
  const data=await sbList('user_settings',socId);
  if(Array.isArray(data)){data.forEach(row=>{if(row.key&&row.value!==undefined)localStorage.setItem(row.key,JSON.stringify(row.value));});}
  // Also pull global settings
  const globalData=await sbList('user_settings','global');
  if(Array.isArray(globalData)){globalData.forEach(row=>{if(row.key&&row.value!==undefined){const existing=localStorage.getItem(row.key);if(!existing)localStorage.setItem(row.key,JSON.stringify(row.value));}});}
 }catch(e){}
}
// Fetch holding config from Supabase
export async function fetchHoldingFromSB(){
 try{const data=await sbGet('holding',null,{id:'main'});if(!Array.isArray(data)||!data[0])return null;return data[0].data||data[0].config||null;}catch{return null;}
}
// Fetch societies from Supabase
export async function fetchSocietiesFromSB(){
 try{const data=await sbList('societies');if(!Array.isArray(data))return null;return data.map(row=>row.data||row).filter(Boolean);}catch{return null;}
}
export function calcH(socs,reps,hold,month){
 let rem=0,cn=0;socs.forEach(s=>{if(s.id==="eco")return;if(["active","lancement"].includes(s.stat))cn++;const r=gr(reps,s.id,month);if(!r)return;const ca=pf(r.ca),presta=pf(r.prestataireAmount||0);rem+=(s.pT==="ca"?ca:Math.max(0,ca-presta))*s.pP/100;});
 const crm=cn*hold.crm,eR=gr(reps,"eco",month),eCa=eR?pf(eR.ca):0,tCh=hold.logiciels+hold.equipe+hold.service+hold.cabinet,eNet=eCa-tCh;
 const tIn=Math.max(0,eNet)+rem+crm,after=tIn-hold.remun,res=Math.max(0,after*hold.reservePct/100),dispo=Math.max(0,after-res);
 return{rem,crm,eNet,eCa,tCh,tIn,res,dispo,pf:hold.remun/2+dispo/2};
}
export function simH(socs,simCA,hold){
 let rem=0,cn=0;socs.forEach(s=>{if(s.id==="eco")return;if(["active","lancement"].includes(s.stat))cn++;const ca=simCA[s.id]||0;const presta=ca*0.1;rem+=(s.pT==="ca"?ca:Math.max(0,ca-presta))*s.pP/100;});
 const crm=cn*hold.crm,eCa=simCA.eco||0,tCh=hold.logiciels+hold.equipe+hold.service+hold.cabinet,eNet=eCa-tCh;
 const tIn=Math.max(0,eNet)+rem+crm,after=tIn-hold.remun,res=Math.max(0,after*hold.reservePct/100),dispo=Math.max(0,after-res);
 return{rem,crm,eNet,eCa,tCh,tIn,res,dispo,pf:hold.remun/2+dispo/2};
}
export function healthScore(s,reps){
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
export function leadScore(opp){
 let s=0;
 if(opp?.value&&pf(opp.value)>0)s+=20;if(pf(opp?.value)>=1000)s+=10;
 if(opp?.contact?.email)s+=15;if(opp?.contact?.phone)s+=10;
 if(opp?.contact?.companyName)s+=10;
 const d=opp?.dateAdded||opp?.createdAt;if(d){const days=(Date.now()-new Date(d))/864e5;if(days<7)s+=20;else if(days<14)s+=10;else if(days<30)s+=5;}
 if(opp?.status==="won")s+=15;else if(opp?.status==="open")s+=10;
 return Math.min(s,100);
}
export function leadScoreColor(s){return s>=70?"#34d399":s>=40?"#FFAA00":"#f87171";}
export function leadScoreLabel(s){return s>=70?"🟢":s>=40?"🟡":"🔴";}
export function qCA(reps,sid,month){return qMonths(month).reduce((a,m)=>a+pf(gr(reps,sid,m)?.ca),0);}
export function getAlerts(socs,reps,hold){
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
export function buildFeed(socs,reps,actions,pulses){
 const items=[],c=curM(),p=prevM(c);
 [c,p].forEach(m=>{socs.forEach(s=>{const r=gr(reps,s.id,m);if(!r||!r.at)return;items.push({color:s.color,date:r.at,m:r.ok?`✓ ${s.nom} validé (${ml(m)})`:`${s.porteur} a soumis ${s.nom}`});});});
 actions.filter(a=>a.at).forEach(a=>{const s=socs.find(x=>x.id===a.socId);items.push({color:s?.color||C.td,date:a.at,m:a.done?`✓ Action: ${a.text}`:`→ Action: ${a.text}`});});
 Object.entries(pulses).forEach(([k,p2])=>{const sid=k.split("_")[0];const s=socs.find(x=>x.id===sid);if(s)items.push({color:s.color,date:p2.at,m:`${MOODS[p2.mood]} Pulse ${s.porteur}: "${p2.win}"`});});
 return items.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,20);
}
export function project(reps,sid,allM){const data=allM.map(m=>pf(gr(reps,sid,m)?.ca)).filter(v=>v>0);if(data.length<2)return null;const l3=data.slice(-3);const avg=l3.reduce((a,v)=>a+v,0)/l3.length;const t=data.length>=2?(data[data.length-1]-data[data.length-2])/Math.max(1,data[data.length-2]):0;return[1,2,3].map(i=>Math.max(0,Math.round(avg*(1+t*i*.5))));}
export function runway(reps,sid,allM){const data=allM.map(m=>{const r=gr(reps,sid,m);return r?{ch:pf(r.charges),ts:pf(r.tresoSoc)}:null;}).filter(Boolean);if(data.length<1)return null;const last=data[data.length-1];if(!last.ts||last.ts<=0)return null;const avgCh=data.reduce((a,d)=>a+d.ch,0)/data.length;if(avgCh<=0)return{months:99,treso:last.ts};return{months:Math.round(last.ts/avgCh),treso:last.ts};}
export function calcLeaderboard(socs,reps,actions,pulses,allM){
 return socs.filter(s=>s.stat==="active"&&s.id!=="eco").map(s=>{
  let score=0;const hs=healthScore(s,reps);score+=hs.score;
  const reportsCount=allM.filter(m=>gr(reps,s.id,m)).length;score+=reportsCount*5;
  const doneActs=actions.filter(a=>a.socId===s.id&&a.done).length;score+=doneActs*10;
  const pulseCount=Object.keys(pulses).filter(k=>k.startsWith(s.id+"_")).length;score+=pulseCount*8;
  const streak=pulseCount;
  return{soc:s,score,hs,reportsCount,doneActs,pulseCount,streak};
 }).sort((a,b)=>b.score-a.score);
}
export function buildAIContext(socs,reps,hold,actions,pulses,allM,revData,socBank,okrs,synergies,clients2){
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
 const sAlerts=calcSmartAlerts(socs,reps,actions,pulses,allM,{},{});
 if(sAlerts.length>0){ctx+=`\n⚠ Alertes (${sAlerts.length}):\n`;sAlerts.slice(0,8).forEach(a=>{ctx+=`  ${a.icon} ${a.title}: ${a.desc}\n`;});}
 return ctx;
}
/* MILESTONES ENGINE */
export const MILESTONE_DEFS=[
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
export const MILESTONE_CATS={ca:"🏆 Chiffre d'affaires",time:"📅 Ancienneté",growth:"📈 Croissance",profit:"💎 Rentabilité",engage:"📊 Engagement",grade:"⭐ Excellence",pipeline:"🎯 Pipeline",tresor:"🏦 Trésorerie",record:"🏅 Records"};
export const TIER_COLORS={1:C.td,2:C.b,3:C.g,4:C.acc,5:"#c084fc",6:"#fbbf24"};
export const TIER_BG={1:C.card2,2:C.bD,3:C.gD,4:C.accD,5:"rgba(192,132,252,.1)",6:"rgba(251,191,36,.12)"};
export function calcMilestoneData(soc,reps,actions,pulses,allM){
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
export function calcMilestones(soc,reps,actions,pulses,allM){
 const data=calcMilestoneData(soc,reps,actions,pulses,allM);
 return MILESTONE_DEFS.map(m=>({...m,unlocked:m.check(data)}));
}

/* ============ ERROR CARD ============ */
export function ErrorCard({source,onRetry,compact}){
 return <div style={{padding:compact?12:20,background:C.rD,border:`1px solid ${C.r}22`,borderRadius:12,textAlign:"center"}}>
  <div style={{fontSize:compact?18:28,marginBottom:compact?4:8}}>⚠️</div>
  <div style={{fontWeight:700,fontSize:compact?11:13,color:C.t,marginBottom:4}}>Impossible de charger les données {source||""}</div>
  <div style={{color:C.td,fontSize:compact?9:11,marginBottom:compact?8:12}}>Vérifiez votre connexion ou réessayez</div>
  {onRetry&&<button onClick={onRetry} style={{padding:compact?"4px 12px":"8px 18px",borderRadius:8,border:`1px solid ${C.r}44`,background:"transparent",color:C.r,fontSize:compact?10:12,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>🔄 Réessayer</button>}
 </div>;
}

/* ============ OFFLINE BANNER ============ */
export function OfflineBanner(){
 return <div style={{padding:"6px 12px",background:"rgba(251,146,60,.12)",border:`1px solid rgba(251,146,60,.25)`,borderRadius:8,display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
  <span style={{fontSize:12}}>📡</span>
  <span style={{fontSize:10,fontWeight:600,color:C.o}}>Mode hors-ligne — dernières données</span>
 </div>;
}

/* ============ OFFLINE CACHE HELPERS ============ */
const CACHE_PREFIX="sc_cache_";
export function cacheSet(key,data){try{localStorage.setItem(CACHE_PREFIX+key,JSON.stringify({data,ts:Date.now()}));}catch{}}
export function cacheGet(key,maxAgeMs=86400000){try{const raw=localStorage.getItem(CACHE_PREFIX+key);if(!raw)return null;const{data,ts}=JSON.parse(raw);if(Date.now()-ts>maxAgeMs)return null;return data;}catch{return null;}}

export const TX_CATEGORIES=[
 {id:"all",label:"Toutes",icon:""},
 {id:"revenus",label:"💰 Revenus",icon:"💰"},
 {id:"loyer",label:"🏠 Loyer",icon:"🏠"},
 {id:"pub",label:"📢 Publicité",icon:"📢"},
 {id:"abonnements",label:"💻 Abonnements",icon:"💻"},
 {id:"equipe",label:"👥 Équipe",icon:"👥"},
 {id:"transfert",label:"🏦 Transfert interne",icon:"🏦"},
 {id:"fiscalite",label:"🏛️ Fiscalité",icon:"🏛️"},
 {id:"autres",label:"📦 Autres dépenses",icon:"📦"},
 {id:"dividendes",label:"🏛 Dividendes Holding",icon:"🏛"},
];

