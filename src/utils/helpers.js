import React from "react";
import { C } from './theme.js';
import { MN, MOODS } from './constants.js';

export const curM=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
export const ml=k=>{if(!k)return"";const[y,m]=k.split("-");return`${MN[parseInt(m)-1]} ${y}`;};
export const fmt=n=>new Intl.NumberFormat("fr-FR").format(Math.round(n||0));
export const fK=n=>n>=1e3?`${(n/1e3).toFixed(1).replace(".0","")}K`:String(n);
export const pct=(a,b)=>b?Math.round(a/b*100):0;
export const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export const prevM=m=>{const[y,mo]=m.split("-").map(Number);const d=new Date(y,mo-2,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
export const nextM=m=>{const[y,mo]=m.split("-").map(Number);const d=new Date(y,mo,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
export const pf=v=>parseFloat(v)||0;
export const gr=(reps,id,m)=>reps[`${id}_${m}`]||null;
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
export const curW=()=>{const d=new Date();const jan1=new Date(d.getFullYear(),0,1);return`${d.getFullYear()}-W${String(Math.ceil(((d-jan1)/864e5+jan1.getDay()+1)/7)).padStart(2,"0")}`;};
export const sinceLbl=d=>{if(!d)return"";const s=new Date(d),n=new Date();const m=(n.getFullYear()-s.getFullYear())*12+n.getMonth()-s.getMonth();if(m<1)return"Ce mois";if(m===1)return"1 mois";if(m<12)return`${m} mois`;const y=Math.floor(m/12),rm=m%12;return rm>0?`${y}a ${rm}m`:`${y} an${y>1?"s":""}`;};
export const sinceMonths=d=>{if(!d)return 0;const s=new Date(d),n=new Date();return(n.getFullYear()-s.getFullYear())*12+n.getMonth()-s.getMonth();};
export const ago=d=>{const s=Math.floor((Date.now()-new Date(d).getTime())/1e3);if(s<60)return"à l'instant";if(s<3600)return`il y a ${Math.floor(s/60)}min`;if(s<86400)return`il y a ${Math.floor(s/3600)}h`;return`il y a ${Math.floor(s/86400)}j`;};
export const deadline=m=>{const[y,mo]=m.split("-").map(Number);return new Date(y,mo,5).toLocaleDateString("fr-FR",{day:"numeric",month:"long"});};
export const qOf=m=>Math.ceil(parseInt(m.split("-")[1])/3);
export const qMonths=m=>{const[y]=m.split("-").map(Number);const s=(qOf(m)-1)*3;return[0,1,2].map(i=>`${y}-${String(s+i+1).padStart(2,"0")}`);};
export const qLabel=m=>`T${qOf(m)} ${m.split("-")[0]}`;
export const curQ=()=>{const d=new Date();return`${d.getFullYear()}-Q${Math.ceil((d.getMonth()+1)/3)}`;};
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
 const f=[];const c=curM();
 socs.forEach(s=>{const r=gr(reps,s.id,c);if(r&&r.at)f.push({m:`📊 ${s.nom} — rapport ${r.ok?"validé ✓":"soumis"}`,date:r.at,color:s.color});});
 Object.entries(pulses).forEach(([k,v])=>{const sid=k.split("_")[0];const s=socs.find(x=>x.id===sid);if(s&&v.at)f.push({m:`⚡ ${s.nom} — pulse ${MOODS[v.mood]}`,date:v.at,color:s.color});});
 actions.filter(a=>a.done).slice(-5).forEach(a=>{const s=socs.find(x=>x.id===a.socId);f.push({m:`✅ ${s?.nom||"?"} — ${a.text}`,date:a.at||new Date().toISOString(),color:s?.color||C.td});});
 return f.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,10);
}
export function project(reps,sid,allM){const data=allM.map(m=>pf(gr(reps,sid,m)?.ca)).filter(v=>v>0);if(data.length<2)return null;const l3=data.slice(-3);const avg=l3.reduce((a,v)=>a+v,0)/l3.length;const t=data.length>=2?(data[data.length-1]-data[data.length-2])/Math.max(1,data[data.length-2]):0;return[1,2,3].map(i=>Math.max(0,Math.round(avg*(1+t*i*.5))));}
export function runway(reps,sid,allM){const data=allM.map(m=>{const r=gr(reps,sid,m);return r?{ch:pf(r.charges),ts:pf(r.tresoSoc)}:null;}).filter(Boolean);if(data.length<1)return null;const last=data[data.length-1];if(!last.ts||last.ts<=0)return null;const avgCh=data.reduce((a,d)=>a+d.ch,0)/data.length;if(avgCh<=0)return{months:99,treso:last.ts};return{months:Math.round(last.ts/avgCh),treso:last.ts};}

// CSS string
export const CSS=`@import url('https://fonts.googleapis.com/css2?family=Teachers:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}body{margin:0;overflow-x:hidden}
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

// ErrorBoundary
export class ErrorBoundary extends React.Component{constructor(p){super(p);this.state={err:null};}static getDerivedStateFromError(e){return{err:e};}render(){if(this.state.err)return <div style={{padding:20,textAlign:"center",background:C.card,borderRadius:12,border:`1px solid ${C.brd}`}}><div style={{fontSize:28,marginBottom:8}}>⚠️</div><div style={{fontWeight:700,fontSize:13,marginBottom:4,color:C.t}}>{this.props.label||"Erreur"}</div><div style={{color:C.td,fontSize:11}}>{this.state.err.message}</div><button onClick={()=>this.setState({err:null})} style={{marginTop:10,padding:"6px 14px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,cursor:"pointer",fontSize:11}}>Réessayer</button></div>;return this.props.children;}}
