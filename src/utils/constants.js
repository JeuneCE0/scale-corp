// Constants, theme, and formatting utilities
// Extracted from App.jsx lines 1-108
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
