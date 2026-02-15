export const C_DARK={bg:"#06060b",card:"#0e0e16",card2:"#131320",brd:"#1a1a2c",brdL:"#24243a",acc:"#FFAA00",accD:"rgba(255,170,0,.12)",g:"#34d399",gD:"rgba(52,211,153,.1)",r:"#f87171",rD:"rgba(248,113,113,.1)",o:"#fb923c",oD:"rgba(251,146,60,.1)",b:"#60a5fa",bD:"rgba(96,165,250,.1)",t:"#e4e4e7",td:"#71717a",tm:"#3f3f50",v:"#a78bfa",vD:"rgba(167,139,250,.1)"};
export const C_LIGHT={bg:"#f5f5f5",card:"#ffffff",card2:"#f0f0f0",brd:"#e0e0e0",brdL:"#d0d0d0",acc:"#FFAA00",accD:"#FFF3D6",g:"#22c55e",gD:"#dcfce7",r:"#ef4444",rD:"#fee2e2",b:"#3b82f6",bD:"#dbeafe",o:"#f97316",oD:"#fff7ed",v:"#8b5cf6",vD:"#ede9fe",t:"#1a1a1a",td:"#666666",tm:"#999999"};
export let C=C_DARK;
export function getTheme(){try{return localStorage.getItem("scTheme")||"dark";}catch{return"dark";}}
export function applyTheme(t){try{localStorage.setItem("scTheme",t);}catch{}C=t==="light"?C_LIGHT:C_DARK;}
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
export const pf=v=>parseFloat(v)||0;
export const gr=(reps,id,m)=>reps[`${id}_${m}`]||null;
export const FONT="'Teachers',sans-serif";
export const FONT_TITLE="'Eurostile','Square721 BT','Arial Black',sans-serif";
export const BF={ca:"",charges:"",chargesOps:"",salaire:"",formation:"",clients:"",churn:"",pub:"",leads:"",leadsContact:"",leadsClos:"",notes:"",mrr:"",pipeline:"",tresoSoc:""};
export const deadline=m=>{const[y,mo]=m.split("-").map(Number);return new Date(y,mo,5).toLocaleDateString("fr-FR",{day:"numeric",month:"long"});};
export const qOf=m=>Math.ceil(parseInt(m.split("-")[1])/3);
export const qMonths=m=>{const[y]=m.split("-").map(Number);const s=(qOf(m)-1)*3;return[0,1,2].map(i=>`${y}-${String(s+i+1).padStart(2,"0")}`);};
export const qLabel=m=>`T${qOf(m)} ${m.split("-")[0]}`;
export const ago=d=>{const s=Math.floor((Date.now()-new Date(d).getTime())/1e3);if(s<60)return"à l'instant";if(s<3600)return`il y a ${Math.floor(s/60)}min`;if(s<86400)return`il y a ${Math.floor(s/3600)}h`;return`il y a ${Math.floor(s/86400)}j`;};
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
export const curW=()=>{const d=new Date();const jan1=new Date(d.getFullYear(),0,1);return`${d.getFullYear()}-W${String(Math.ceil(((d-jan1)/864e5+jan1.getDay()+1)/7)).padStart(2,"0")}`;};
export const MOODS=["😫","😟","😐","🙂","🔥"];
export const sinceLbl=d=>{if(!d)return"";const s=new Date(d),n=new Date();const m=(n.getFullYear()-s.getFullYear())*12+n.getMonth()-s.getMonth();if(m<1)return"Ce mois";if(m===1)return"1 mois";if(m<12)return`${m} mois`;const y=Math.floor(m/12),rm=m%12;return rm>0?`${y}a ${rm}m`:`${y} an${y>1?"s":""}`;};
export const sinceMonths=d=>{if(!d)return 0;const s=new Date(d),n=new Date();return(n.getFullYear()-s.getFullYear())*12+n.getMonth()-s.getMonth();};
export const curQ=()=>{const d=new Date();return`${d.getFullYear()}-Q${Math.ceil((d.getMonth()+1)/3)}`;};
export const DEAL_STAGES=["Idée","Contact","Négociation","Due Diligence","Signature"];
export const GHL_BASE="/api/ghl";
export const STRIPE_PROXY="/api/stripe";
export const STORE_URL="/api/store";
export const REV_ENVS={sandbox:"https://sandbox-b2b.revolut.com/api/1.0",production:"https://b2b.revolut.com/api/1.0"};
export const CURR_SYMBOLS={EUR:"€",USD:"$",GBP:"£",CHF:"CHF",SEK:"kr",NOK:"kr",DKK:"kr",PLN:"zł",CZK:"Kč",HUF:"Ft",RON:"lei",BGN:"лв",HRK:"kn",AED:"AED",CAD:"CA$",AUD:"A$",JPY:"¥"};
export const EXCLUDED_ACCOUNTS={
 leadx:["5c008ba9-b9a7-4141-97dc-6a53ef3d6646","5fce1497-811e-4266-9889-2da74aa27733"],
 copy:["a1edf694-6f10-4b88-bfc1-7f2447f0fd8d","a86df684-33a0-413b-b56b-1e4fc2b13886"],
 eco:["a418f8cb-7001-40e8-acd3-e52f092294d4","39786a9f-7dd8-46e3-aba8-d8acca9e4bd7","fa4578d8-5d7f-4b9c-b2eb-afa01061d28e","88fb482e-26b3-494e-9234-5cded1b76799","d45a5ba7-cefa-4e21-85f9-cdafa6c60648","12440858-679f-4781-8db1-eb0ebbb986b3","f893a7c1-64b4-4247-9625-9f640d768b96","9f8f33c4-112f-44ad-81ea-a8acbca1efb7"],
};
export const SUB_CATS={crm:{l:"CRM/Marketing",icon:"💻",c:"#a78bfa"},design:{l:"Design",icon:"🎨",c:"#fb923c"},comms:{l:"Communication",icon:"💬",c:"#60a5fa"},iadev:{l:"IA/Dev",icon:"🤖",c:"#34d399"},productivite:{l:"Productivité",icon:"📊",c:"#FFAA00"},formation:{l:"Formation/Communauté",icon:"🎓",c:"#f59e0b"},paiement:{l:"Paiement",icon:"💳",c:"#f87171"},abonnement:{l:"Abonnement",icon:"🔄",c:"#8b5cf6"},prestataire:{l:"Prestataire",icon:"👤",c:"#ec4899"},autre:{l:"Autre",icon:"📦",c:"#71717a"}};
export const SYN_TYPES={referral:{label:"Referral",icon:"🔗",color:"#60a5fa"},collab:{label:"Collaboration",icon:"🤝",color:"#a78bfa"},resource:{label:"Ressource partagée",icon:"📦",color:"#fb923c"}};
export const SYN_STATUS={active:{label:"En cours",color:"#60a5fa"},won:{label:"Gagné",color:"#34d399"},lost:{label:"Perdu",color:"#f87171"}};
export const SLACK_MODES={
 webhook:{l:"Webhook",desc:"Incoming Webhook URL — simple, pas besoin d'app",icon:"🔗"},
 bot:{l:"Bot Token",desc:"Bot OAuth Token (xoxb-…) — plus de contrôle, peut tagger",icon:"🤖"},
 bob:{l:"Bob (Agent IA)",desc:"Via votre app Bob existante — webhook custom",icon:"🧠"},
};
