// Formatting utilities
import { C } from './theme.js';

export const MN=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
export const curM=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
export const ml=k=>{if(!k)return"";const[y,m]=k.split("-");return`${MN[parseInt(m)-1]} ${y}`;};
export const fmt=n=>new Intl.NumberFormat("fr-FR").format(Math.round(n||0));
export const fK=n=>n>=1e3?`${(n/1e3).toFixed(1).replace(".0","")}K`:String(n);
export const pct=(a,b)=>b?Math.round(a/b*100):0;
export const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export const prevM=m=>{const[y,mo]=m.split("-").map(Number);const d=new Date(y,mo-2,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
export const nextM=m=>{const[y,mo]=m.split("-").map(Number);const d=new Date(y,mo,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
export const pf=v=>parseFloat(v)||0;const gr=(reps,id,m)=>reps[`${id}_${m}`]||null;
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
