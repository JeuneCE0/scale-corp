import React, { useState, useEffect } from "react";
import { C, FONT, FONT_TITLE, fmt } from "../shared.jsx";
import { Btn } from "../components.jsx";

const PLANS=[
 {id:"starter",name:"Starter",priceM:99,priceY:79,features:["Dashboard Overview","CRM basique (100 contacts)","Données financières","1 utilisateur","Support email"],color:C.b,icon:"🚀",recommended:false},
 {id:"pro",name:"Professional",priceM:249,priceY:199,features:["Tout Starter +","CRM avancé (illimité)","Sales Pipeline & Pub","Agenda & Data Health","5 utilisateurs","Intégrations API","Support prioritaire"],color:C.acc,icon:"⭐",recommended:true},
 {id:"enterprise",name:"Enterprise",priceM:499,priceY:399,features:["Tout Professional +","CI/CD Data Monitoring","Backup automatique 24h","KPI personnalisés","Utilisateurs illimités","Onboarding dédié","SLA 99.9%","Account manager"],color:C.v,icon:"🏢",recommended:false},
];

const FEATURES=[
 {icon:"📊",title:"Dashboard intelligent",desc:"Pilotez votre activité en temps réel avec des KPI clés, des alertes intelligentes et des graphiques interactifs."},
 {icon:"🤖",title:"CRM & Pipeline",desc:"Gérez vos contacts, vos deals et votre pipeline de vente avec des automatisations avancées."},
 {icon:"💰",title:"Finances & Trésorerie",desc:"Suivi de CA, charges, marges et trésorerie avec synchronisation bancaire automatique."},
 {icon:"📈",title:"Data Health & CI/CD",desc:"Testez la qualité de vos données automatiquement et nettoyez votre base en continu."},
 {icon:"🔗",title:"Intégrations natives",desc:"Connectez Stripe, GoHighLevel, Revolut, Slack, Meta Ads et bien plus encore."},
 {icon:"🔒",title:"Sécurité & RGPD",desc:"Chiffrement de bout en bout, conformité RGPD, gestion fine des rôles et permissions."},
];

const STATS=[
 {value:"99.9%",label:"Disponibilité"},
 {value:"< 200ms",label:"Temps de réponse"},
 {value:"50+",label:"Intégrations"},
 {value:"24/7",label:"Support"},
];

export function LandingPage({brand,onNavigate}){
 const[annual,setAnnual]=useState(false);
 const[scrolled,setScrolled]=useState(false);

 useEffect(()=>{
  const h=()=>setScrolled(window.scrollY>40);
  window.addEventListener("scroll",h);
  return()=>window.removeEventListener("scroll",h);
 },[]);

 const nav=(hash)=>{window.location.hash=hash;onNavigate?.(hash);};

 return <div style={{minHeight:"100vh",background:C.bg,fontFamily:FONT,color:C.t,overflowX:"hidden"}}>
  {/* NAV BAR */}
  <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",background:scrolled?"rgba(6,6,11,.85)":"transparent",backdropFilter:scrolled?"blur(20px)":"none",WebkitBackdropFilter:scrolled?"blur(20px)":"none",borderBottom:scrolled?`1px solid ${C.brd}`:"none",transition:"all .3s ease"}}>
   <div style={{display:"flex",alignItems:"center",gap:10}}>
    {brand?.logoUrl?<img src={brand.logoUrl} alt="" style={{width:32,height:32,borderRadius:8,objectFit:"contain"}}/>
     :<div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${C.acc},#FF9D00)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#0a0a0f"}}>{brand?.logoLetter||"E"}</div>}
    <span style={{fontWeight:900,fontSize:16,fontFamily:FONT_TITLE,letterSpacing:.5}}>{brand?.name||"L'INCUBATEUR ECS"}</span>
   </div>
   <div className="landing-nav-links" style={{display:"flex",alignItems:"center",gap:8}}>
    <button onClick={()=>nav("#/admin")} style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${C.brd}`,background:"transparent",color:C.t,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Admin</button>
    <button onClick={()=>nav("#/client")} style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${C.brd}`,background:"transparent",color:C.t,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Connexion</button>
    <button onClick={()=>nav("#/signup")} style={{padding:"7px 16px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${C.acc},#FF9D00)`,color:"#0a0a0f",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FONT,boxShadow:`0 4px 16px rgba(255,170,0,.25)`}}>Commencer</button>
   </div>
  </nav>

  {/* HERO SECTION */}
  <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"120px 24px 80px",position:"relative",overflow:"hidden"}}>
   {/* BG effects */}
   <div style={{position:"absolute",top:"20%",left:"15%",width:400,height:400,borderRadius:"50%",background:`radial-gradient(circle,rgba(255,170,0,.06),transparent 70%)`,pointerEvents:"none"}}/>
   <div style={{position:"absolute",bottom:"10%",right:"10%",width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle,rgba(96,165,250,.04),transparent 70%)`,pointerEvents:"none"}}/>

   <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 16px",borderRadius:20,border:`1px solid ${C.acc}33`,background:C.accD,marginBottom:24,fontSize:12,color:C.acc,fontWeight:600}}>
    ⚡ Plateforme SaaS de pilotage B2B
   </div>
   <h1 style={{fontSize:"clamp(32px,5vw,56px)",fontWeight:900,fontFamily:FONT_TITLE,lineHeight:1.1,margin:"0 0 20px",maxWidth:700}}>
    Pilotez votre <span style={{background:`linear-gradient(135deg,${C.acc},#FF9D00)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>portfolio</span> d'entreprises
   </h1>
   <p style={{fontSize:"clamp(14px,1.5vw,18px)",color:C.td,maxWidth:560,lineHeight:1.6,margin:"0 0 36px"}}>
    Dashboard financier, CRM, pipeline de vente, monitoring data, automatisations — tout en un seul outil conçu pour les incubateurs et holdings.
   </p>
   <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
    <button onClick={()=>nav("#/signup")} style={{padding:"14px 32px",borderRadius:12,border:"none",background:`linear-gradient(135deg,#FFBF00,#FF9D00)`,color:"#0a0a0f",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:FONT,boxShadow:"0 8px 32px rgba(255,170,0,.3)",transition:"transform .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
     Essai gratuit 14 jours
    </button>
    <button onClick={()=>{document.getElementById("landing-pricing")?.scrollIntoView({behavior:"smooth"});}} style={{padding:"14px 32px",borderRadius:12,border:`1px solid ${C.brd}`,background:"rgba(255,255,255,.03)",color:C.t,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:FONT,backdropFilter:"blur(10px)",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.acc+"66";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;}}>
     Voir les tarifs →
    </button>
   </div>

   {/* Stats bar */}
   <div style={{display:"flex",gap:32,marginTop:60,flexWrap:"wrap",justifyContent:"center"}}>
    {STATS.map(s=><div key={s.label} style={{textAlign:"center"}}>
     <div style={{fontSize:24,fontWeight:900,color:C.acc,fontFamily:FONT_TITLE}}>{s.value}</div>
     <div style={{fontSize:11,color:C.td,marginTop:2}}>{s.label}</div>
    </div>)}
   </div>
  </section>

  {/* FEATURES SECTION */}
  <section style={{padding:"80px 24px",maxWidth:1100,margin:"0 auto"}}>
   <div style={{textAlign:"center",marginBottom:48}}>
    <h2 style={{fontSize:"clamp(24px,3vw,36px)",fontWeight:900,fontFamily:FONT_TITLE,margin:"0 0 12px"}}>Tout ce dont vous avez besoin</h2>
    <p style={{color:C.td,fontSize:15,maxWidth:500,margin:"0 auto"}}>Une plateforme complète pour piloter, analyser et optimiser vos sociétés.</p>
   </div>
   <div className="landing-features-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
    {FEATURES.map(f=><div key={f.title} style={{padding:24,borderRadius:16,background:C.card,border:`1px solid ${C.brd}`,transition:"all .3s ease"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.acc+"44";e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 12px 40px rgba(0,0,0,.3)`;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
     <div style={{fontSize:28,marginBottom:12}}>{f.icon}</div>
     <div style={{fontWeight:800,fontSize:15,marginBottom:6}}>{f.title}</div>
     <div style={{color:C.td,fontSize:13,lineHeight:1.6}}>{f.desc}</div>
    </div>)}
   </div>
  </section>

  {/* PRICING SECTION */}
  <section id="landing-pricing" style={{padding:"80px 24px",background:`linear-gradient(180deg,transparent,${C.card}44,transparent)`}}>
   <div style={{maxWidth:1100,margin:"0 auto"}}>
    <div style={{textAlign:"center",marginBottom:36}}>
     <h2 style={{fontSize:"clamp(24px,3vw,36px)",fontWeight:900,fontFamily:FONT_TITLE,margin:"0 0 12px"}}>Tarifs simples et transparents</h2>
     <p style={{color:C.td,fontSize:15,margin:"0 0 20px"}}>Choisissez le plan adapté à votre croissance.</p>
     <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:4,borderRadius:10,background:C.card,border:`1px solid ${C.brd}`}}>
      <button onClick={()=>setAnnual(false)} style={{padding:"8px 20px",borderRadius:8,border:"none",background:!annual?C.acc:"transparent",color:!annual?"#0a0a0f":C.td,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT}}>Mensuel</button>
      <button onClick={()=>setAnnual(true)} style={{padding:"8px 20px",borderRadius:8,border:"none",background:annual?C.acc:"transparent",color:annual?"#0a0a0f":C.td,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT}}>Annuel <span style={{fontSize:10,opacity:.8}}>(-20%)</span></button>
     </div>
    </div>
    <div className="landing-pricing-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16,maxWidth:960,margin:"0 auto"}}>
     {PLANS.map(p=>{
      const price=annual?p.priceY:p.priceM;
      return <div key={p.id} style={{padding:28,borderRadius:20,background:C.card,border:`2px solid ${p.recommended?C.acc:C.brd}`,position:"relative",transition:"all .3s ease",boxShadow:p.recommended?`0 8px 40px rgba(255,170,0,.12)`:"none"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-6px)";e.currentTarget.style.boxShadow=`0 16px 50px rgba(0,0,0,.4)`;}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=p.recommended?`0 8px 40px rgba(255,170,0,.12)`:"none";}}>
       {p.recommended&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",padding:"4px 16px",borderRadius:12,background:`linear-gradient(135deg,${C.acc},#FF9D00)`,color:"#0a0a0f",fontSize:10,fontWeight:800,letterSpacing:.5,whiteSpace:"nowrap"}}>RECOMMANDÉ</div>}
       <div style={{fontSize:28,marginBottom:8}}>{p.icon}</div>
       <div style={{fontWeight:900,fontSize:18,marginBottom:4}}>{p.name}</div>
       <div style={{marginBottom:16}}>
        <span style={{fontSize:36,fontWeight:900,color:p.color}}>{price}€</span>
        <span style={{color:C.td,fontSize:13}}> / mois</span>
        {annual&&<div style={{fontSize:11,color:C.g,marginTop:2}}>Économisez {(p.priceM-p.priceY)*12}€/an</div>}
       </div>
       <ul style={{listStyle:"none",padding:0,margin:"0 0 24px"}}>
        {p.features.map(f=><li key={f} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",fontSize:13,color:C.t}}>
         <span style={{color:C.g,fontSize:12,flexShrink:0}}>✓</span>{f}
        </li>)}
       </ul>
       <button onClick={()=>nav("#/signup")} style={{width:"100%",padding:"12px 0",borderRadius:10,border:p.recommended?"none":`1px solid ${C.brd}`,background:p.recommended?`linear-gradient(135deg,${C.acc},#FF9D00)`:C.card,color:p.recommended?"#0a0a0f":C.t,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,transition:"all .2s"}} onMouseEnter={e=>{if(!p.recommended){e.currentTarget.style.borderColor=C.acc+"66";e.currentTarget.style.background=C.accD;}}} onMouseLeave={e=>{if(!p.recommended){e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.background=C.card;}}}>
        {p.recommended?"Commencer maintenant":"Choisir ce plan"}
       </button>
      </div>;
     })}
    </div>
   </div>
  </section>

  {/* TRUST / CTA SECTION */}
  <section style={{padding:"80px 24px",textAlign:"center"}}>
   <div style={{maxWidth:600,margin:"0 auto"}}>
    <h2 style={{fontSize:"clamp(22px,3vw,32px)",fontWeight:900,fontFamily:FONT_TITLE,margin:"0 0 16px"}}>Prêt à transformer votre gestion ?</h2>
    <p style={{color:C.td,fontSize:15,lineHeight:1.6,margin:"0 0 32px"}}>
     Rejoignez les incubateurs et holdings qui utilisent déjà notre plateforme pour piloter leur croissance.
    </p>
    <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
     <button onClick={()=>nav("#/signup")} style={{padding:"14px 36px",borderRadius:12,border:"none",background:`linear-gradient(135deg,#FFBF00,#FF9D00)`,color:"#0a0a0f",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:FONT,boxShadow:"0 8px 32px rgba(255,170,0,.3)"}}>
      Démarrer gratuitement
     </button>
     <button onClick={()=>nav("#/client")} style={{padding:"14px 36px",borderRadius:12,border:`1px solid ${C.brd}`,background:"transparent",color:C.t,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>
      Se connecter →
     </button>
    </div>
   </div>
  </section>

  {/* FOOTER */}
  <footer style={{padding:"40px 24px",borderTop:`1px solid ${C.brd}`,textAlign:"center"}}>
   <div style={{maxWidth:800,margin:"0 auto",display:"flex",flexWrap:"wrap",justifyContent:"center",gap:24,marginBottom:20}}>
    <a href="#/landing" style={{color:C.td,fontSize:12,textDecoration:"none",fontFamily:FONT}}>Accueil</a>
    <a href="#landing-pricing" onClick={e=>{e.preventDefault();document.getElementById("landing-pricing")?.scrollIntoView({behavior:"smooth"});}} style={{color:C.td,fontSize:12,textDecoration:"none",fontFamily:FONT}}>Tarifs</a>
    <a href="#/client" style={{color:C.td,fontSize:12,textDecoration:"none",fontFamily:FONT}}>Connexion Client</a>
    <a href="#/admin" style={{color:C.td,fontSize:12,textDecoration:"none",fontFamily:FONT}}>Espace Admin</a>
    <a href="#/signup" style={{color:C.td,fontSize:12,textDecoration:"none",fontFamily:FONT}}>Inscription</a>
   </div>
   <div style={{color:C.tm,fontSize:11}}>
    © {new Date().getFullYear()} {brand?.name||"L'Incubateur ECS"}. Tous droits réservés.
   </div>
  </footer>

  {/* RESPONSIVE CSS */}
  <style>{`
   @media(max-width:768px){
    .landing-nav-links{gap:4px !important}
    .landing-nav-links button{padding:6px 10px !important;font-size:11px !important}
    .landing-features-grid{grid-template-columns:1fr !important}
    .landing-pricing-grid{grid-template-columns:1fr !important}
   }
  `}</style>
 </div>;
}

/* ====== CLIENT LOGIN PAGE ====== */
export function ClientLoginPage({brand,onNavigate,onLogin}){
 const[email,setEmail]=useState("");
 const[pass,setPass]=useState("");
 const[err,setErr]=useState("");
 const[loading,setLoading]=useState(false);

 const nav=(hash)=>{window.location.hash=hash;onNavigate?.(hash);};

 const doLogin=async()=>{
  if(!email.trim()||!pass.trim()){setErr("Email et mot de passe requis");return;}
  setLoading(true);setErr("");
  try{
   const r=await fetch("/api/auth?action=login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(),password:pass})});
   const d=await r.json();
   if(!r.ok){setErr(d.error_description||d.msg||d.error||"Identifiants incorrects");setLoading(false);return;}
   localStorage.setItem("sc_auth_token",d.access_token);
   if(d.refresh_token)localStorage.setItem("sc_auth_refresh",d.refresh_token);
   // Notify parent to set role directly
   if(onLogin){onLogin(d.user);}else{window.location.hash="";window.location.reload();}
  }catch{setErr("Erreur de connexion");}
  setLoading(false);
 };

 return <div className="glass-bg" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,padding:16}}>
  <div style={{position:"fixed",top:16,left:16,zIndex:10}}>
   <button onClick={()=>nav("#/landing")} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${C.brd}`,background:"rgba(255,255,255,.03)",color:C.td,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>← Accueil</button>
  </div>
  <div className="si" style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:20,padding:28,width:380,maxWidth:"100%",boxShadow:"0 24px 64px rgba(0,0,0,.5)"}}>
   <div style={{textAlign:"center",marginBottom:24}}>
    {brand?.logoUrl?<img src={brand.logoUrl} alt="" style={{width:56,height:56,borderRadius:12,objectFit:"contain",marginBottom:10}}/>
     :<div style={{width:56,height:56,borderRadius:12,background:`linear-gradient(135deg,${C.acc},#FF9D00)`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:22,color:"#0a0a0f",marginBottom:10}}>{brand?.logoLetter||"E"}</div>}
    <h1 style={{margin:0,fontSize:18,fontWeight:900,fontFamily:FONT_TITLE}}>Espace Client</h1>
    <p style={{color:C.td,fontSize:12,margin:"4px 0 0"}}>Connectez-vous à votre tableau de bord</p>
   </div>
   <div style={{marginBottom:10}}>
    <label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3}}>Email</label>
    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.com" onKeyDown={e=>{if(e.key==="Enter")doLogin();}}
     style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:13,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/>
   </div>
   <div style={{marginBottom:10}}>
    <label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3}}>Mot de passe</label>
    <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>{if(e.key==="Enter")doLogin();}}
     style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:13,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/>
   </div>
   {err&&<div style={{color:C.r,fontSize:11,marginBottom:8,textAlign:"center"}}>⚠ {err}</div>}
   <button onClick={doLogin} disabled={loading} style={{width:"100%",padding:"12px 0",borderRadius:10,border:"none",background:`linear-gradient(135deg,#FFBF00,#FF9D00)`,color:"#0a0a0f",fontWeight:700,fontSize:13,cursor:loading?"wait":"pointer",fontFamily:FONT,opacity:loading?.6:1,marginBottom:12}}>
    {loading?"Connexion...":"Se connecter"}
   </button>
   <div style={{textAlign:"center",fontSize:12,color:C.td}}>
    Pas encore de compte ? <a href="#/signup" style={{color:C.acc,fontWeight:600,textDecoration:"none"}} onClick={e=>{e.preventDefault();nav("#/signup");}}>S'inscrire</a>
   </div>
   <div style={{textAlign:"center",fontSize:11,color:C.tm,marginTop:8}}>
    <a href="#/admin" style={{color:C.tm,textDecoration:"none"}} onClick={e=>{e.preventDefault();nav("#/admin");}}>Accès administrateur</a>
   </div>
  </div>
 </div>;
}

/* ====== CLIENT SIGNUP PAGE ====== */
export function ClientSignupPage({brand,onNavigate}){
 const[form,setForm]=useState({company:"",email:"",password:"",confirmPass:"",name:"",phone:""});
 const[err,setErr]=useState("");
 const[loading,setLoading]=useState(false);
 const[success,setSuccess]=useState(false);

 const nav=(hash)=>{window.location.hash=hash;onNavigate?.(hash);};
 const uf=(k,v)=>setForm({...form,[k]:v});

 const doSignup=async()=>{
  if(!form.email||!form.password||!form.company){setErr("Entreprise, email et mot de passe requis");return;}
  if(form.password.length<8){setErr("Le mot de passe doit contenir au moins 8 caractères");return;}
  if(form.password!==form.confirmPass){setErr("Les mots de passe ne correspondent pas");return;}
  setLoading(true);setErr("");
  try{
   const r=await fetch("/api/auth?action=signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:form.email,password:form.password,name:form.name||form.company,role:"client",company:form.company,phone:form.phone})});
   const d=await r.json();
   if(!r.ok){setErr(d.msg||d.error||"Erreur lors de l'inscription");setLoading(false);return;}
   setSuccess(true);
  }catch{setErr("Erreur de connexion");}
  setLoading(false);
 };

 if(success)return <div className="glass-bg" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,padding:16}}>
  <div className="si" style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:20,padding:32,width:400,maxWidth:"100%",textAlign:"center",boxShadow:"0 24px 64px rgba(0,0,0,.5)"}}>
   <div style={{fontSize:48,marginBottom:16}}>🎉</div>
   <h2 style={{fontWeight:900,fontSize:22,fontFamily:FONT_TITLE,margin:"0 0 8px"}}>Inscription réussie !</h2>
   <p style={{color:C.td,fontSize:13,lineHeight:1.6,margin:"0 0 24px"}}>Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter à votre espace client.</p>
   <button onClick={()=>nav("#/client")} style={{padding:"12px 32px",borderRadius:10,border:"none",background:`linear-gradient(135deg,#FFBF00,#FF9D00)`,color:"#0a0a0f",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT}}>Se connecter →</button>
  </div>
 </div>;

 return <div className="glass-bg" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,padding:16}}>
  <div style={{position:"fixed",top:16,left:16,zIndex:10}}>
   <button onClick={()=>nav("#/landing")} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${C.brd}`,background:"rgba(255,255,255,.03)",color:C.td,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>← Accueil</button>
  </div>
  <div className="si" style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:20,padding:28,width:420,maxWidth:"100%",boxShadow:"0 24px 64px rgba(0,0,0,.5)"}}>
   <div style={{textAlign:"center",marginBottom:24}}>
    {brand?.logoUrl?<img src={brand.logoUrl} alt="" style={{width:56,height:56,borderRadius:12,objectFit:"contain",marginBottom:10}}/>
     :<div style={{width:56,height:56,borderRadius:12,background:`linear-gradient(135deg,${C.acc},#FF9D00)`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:22,color:"#0a0a0f",marginBottom:10}}>{brand?.logoLetter||"E"}</div>}
    <h1 style={{margin:0,fontSize:18,fontWeight:900,fontFamily:FONT_TITLE}}>Créer un compte</h1>
    <p style={{color:C.td,fontSize:12,margin:"4px 0 0"}}>Inscrivez-vous pour accéder à la plateforme</p>
   </div>
   <div style={{marginBottom:10}}>
    <label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3}}>Nom de l'entreprise *</label>
    <input value={form.company} onChange={e=>uf("company",e.target.value)} placeholder="Ma Société SAS"
     style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:13,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/>
   </div>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
    <div style={{marginBottom:10}}>
     <label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3}}>Nom complet</label>
     <input value={form.name} onChange={e=>uf("name",e.target.value)} placeholder="Jean Dupont"
      style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:13,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/>
    </div>
    <div style={{marginBottom:10}}>
     <label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3}}>Téléphone</label>
     <input value={form.phone} onChange={e=>uf("phone",e.target.value)} placeholder="+33 6 12 34 56 78"
      style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:13,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/>
    </div>
   </div>
   <div style={{marginBottom:10}}>
    <label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3}}>Email professionnel *</label>
    <input type="email" value={form.email} onChange={e=>uf("email",e.target.value)} placeholder="contact@masociete.fr"
     style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:13,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/>
   </div>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
    <div style={{marginBottom:10}}>
     <label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3}}>Mot de passe *</label>
     <input type="password" value={form.password} onChange={e=>uf("password",e.target.value)} placeholder="Min. 6 caractères"
      style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:13,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/>
    </div>
    <div style={{marginBottom:10}}>
     <label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3}}>Confirmer *</label>
     <input type="password" value={form.confirmPass} onChange={e=>uf("confirmPass",e.target.value)} placeholder="Confirmer"
      style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:13,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/>
    </div>
   </div>
   {err&&<div style={{color:C.r,fontSize:11,marginBottom:8,textAlign:"center"}}>⚠ {err}</div>}
   <button onClick={doSignup} disabled={loading} style={{width:"100%",padding:"12px 0",borderRadius:10,border:"none",background:`linear-gradient(135deg,#FFBF00,#FF9D00)`,color:"#0a0a0f",fontWeight:700,fontSize:13,cursor:loading?"wait":"pointer",fontFamily:FONT,opacity:loading?.6:1,marginBottom:12}}>
    {loading?"Création en cours...":"Créer mon compte"}
   </button>
   <div style={{textAlign:"center",fontSize:12,color:C.td}}>
    Déjà inscrit ? <a href="#/client" style={{color:C.acc,fontWeight:600,textDecoration:"none"}} onClick={e=>{e.preventDefault();nav("#/client");}}>Se connecter</a>
   </div>
   <div style={{textAlign:"center",fontSize:10,color:C.tm,marginTop:12,lineHeight:1.5}}>
    En créant un compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
   </div>
  </div>
 </div>;
}
