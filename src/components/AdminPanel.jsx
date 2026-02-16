import React, { useState, useEffect, useCallback } from "react";
import { C, FONT, FONT_TITLE, fmt, uid, ago, sSet } from "../shared.jsx";
import { Btn, Card, Inp, Sel, Sect, Modal, Toggle, KPI, PBar } from "../components.jsx";

const STORAGE_KEY="scAdmCfg";

const DEFAULT_FEATURES=[
 {id:"dashboard",label:"Dashboard",desc:"Tableau de bord principal avec KPIs",icon:"◉",enabled:true,cat:"core"},
 {id:"pulse",label:"Pulse Hebdo",desc:"Système de pulse hebdomadaire porteurs",icon:"⚡",enabled:true,cat:"core"},
 {id:"reports",label:"Rapports Mensuels",desc:"Génération et validation des rapports",icon:"📋",enabled:true,cat:"core"},
 {id:"banking",label:"Banque / Revolut",desc:"Intégration bancaire et réconciliation",icon:"🏦",enabled:true,cat:"integ"},
 {id:"crm",label:"CRM / GoHighLevel",desc:"Synchronisation contacts et pipeline GHL",icon:"📡",enabled:true,cat:"integ"},
 {id:"ai_copilot",label:"AI Co-Pilot",desc:"Assistant IA pour analyse et recommandations",icon:"🤖",enabled:true,cat:"premium"},
 {id:"sales",label:"Sales Pipeline",desc:"Suivi commercial et conversion leads",icon:"📞",enabled:true,cat:"core"},
 {id:"publicite",label:"Publicité / Ads",desc:"Tracking dépenses publicitaires et ROAS",icon:"📣",enabled:true,cat:"core"},
 {id:"clients",label:"Gestion Clients",desc:"Répertoire clients, facturation, onboarding",icon:"👥",enabled:true,cat:"core"},
 {id:"invoices",label:"Factures",desc:"Génération et suivi des factures",icon:"🧾",enabled:true,cat:"core"},
 {id:"knowledge_base",label:"Base de connaissances",desc:"Playbooks, templates, ressources",icon:"📚",enabled:true,cat:"premium"},
 {id:"okrs",label:"OKRs",desc:"Objectifs et résultats clés trimestriels",icon:"🎯",enabled:true,cat:"premium"},
 {id:"synergies",label:"Synergies",desc:"Collaborations et referrals inter-sociétés",icon:"🤝",enabled:true,cat:"premium"},
 {id:"meetings",label:"Mode Réunion",desc:"Présentation en mode réunion d'équipe",icon:"📋",enabled:true,cat:"premium"},
 {id:"slack",label:"Notifications Slack",desc:"Envoi automatique de notifications Slack",icon:"💬",enabled:true,cat:"integ"},
 {id:"stripe",label:"Stripe Payments",desc:"Intégration paiements Stripe",icon:"💳",enabled:false,cat:"integ"},
 {id:"investor_board",label:"Board Investisseur",desc:"Dashboard investisseur avec PIN protégé",icon:"📊",enabled:true,cat:"premium"},
 {id:"widget",label:"Widgets Embed",desc:"Widgets intégrables pour sites porteurs",icon:"🔲",enabled:true,cat:"premium"},
];

const FEAT_CATS={core:{label:"Core",color:C.b},integ:{label:"Intégrations",color:C.g},premium:{label:"Premium",color:C.v}};

const DEFAULT_ROLES=[
 {id:"admin",label:"Administrateur",desc:"Accès total à la plateforme",color:"#FFBF00",perms:["*"]},
 {id:"porteur",label:"Porteur de projet",desc:"Accès à sa société uniquement",color:C.b,perms:["dashboard","reports","pulse","sales","clients","banking","publicite"]},
 {id:"viewer",label:"Lecteur",desc:"Consultation seule, aucune modification",color:C.td,perms:["dashboard","reports"]},
 {id:"comptable",label:"Comptable",desc:"Accès aux données financières uniquement",color:C.g,perms:["dashboard","reports","banking","invoices"]},
];

const DEFAULT_CFG={
 features:DEFAULT_FEATURES,overrides:{},roles:DEFAULT_ROLES,apiKeys:[],auditLog:[],
 retentionDays:365,maintenanceMode:false,
 maintenanceMsg:"La plateforme est en maintenance. Veuillez réessayer dans quelques minutes.",
 passwordPolicy:{minLength:8,requireUpper:true,requireNum:true,requireSpecial:false},
 bruteForce:{maxAttempts:5,windowMin:15},
 gdprContact:"",customCss:"",loginBg:"",loginMsg:"",
};

function loadCfg(){try{const s=localStorage.getItem(STORAGE_KEY);return s?{...DEFAULT_CFG,...JSON.parse(s)}:{...DEFAULT_CFG};}catch{return{...DEFAULT_CFG};}}
function saveCfg(c){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(c));sSet(STORAGE_KEY,c);}catch{}}

function addLog(cfg,action,detail){
 const entry={id:uid(),action,detail,at:new Date().toISOString(),user:"admin"};
 return{...cfg,auditLog:[entry,...(cfg.auditLog||[])].slice(0,500)};
}

/* ====== FEATURE FLAGS ====== */
function FeaturesTab({cfg,setCfg,socs}){
 const[filter,setFilter]=useState("all");
 const[search,setSearch]=useState("");
 const[openOv,setOpenOv]=useState(null);
 const feats=cfg.features||DEFAULT_FEATURES;
 const ov=cfg.overrides||{};

 const toggle=(fId)=>{
  const nf=feats.map(f=>f.id===fId?{...f,enabled:!f.enabled}:f);
  const nc=addLog({...cfg,features:nf},"feature_toggle",`${fId} -> ${nf.find(f=>f.id===fId).enabled?"ON":"OFF"}`);
  setCfg(nc);saveCfg(nc);
 };

 const toggleOv=(socId,fId)=>{
  const key=`${socId}_${fId}`;const cur=ov[key];const base=feats.find(f=>f.id===fId)?.enabled;
  let next; if(cur===undefined)next=!base; else next=undefined;
  const no={...ov}; if(next===undefined)delete no[key]; else no[key]=next;
  const nc=addLog({...cfg,overrides:no},"feature_override",`${socId}/${fId} -> ${next===undefined?"default":next?"ON":"OFF"}`);
  setCfg(nc);saveCfg(nc);
 };

 const filtered=feats.filter(f=>{
  if(filter!=="all"&&f.cat!==filter)return false;
  if(search&&!f.label.toLowerCase().includes(search.toLowerCase()))return false;
  return true;
 });

 return<>
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
   <div style={{flex:1,minWidth:200}}>
    <div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE}}>Feature Flags</div>
    <div style={{fontSize:10,color:C.td,marginTop:2}}>Activer/désactiver les fonctionnalités de la plateforme</div>
   </div>
   <div style={{display:"flex",gap:6}}>
    <KPI label="Activées" value={`${feats.filter(f=>f.enabled).length}/${feats.length}`} accent={C.g} icon="✅"/>
    <KPI label="Overrides" value={Object.keys(ov).length} accent={C.o} icon="🔀"/>
   </div>
  </div>

  <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
   <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une feature..." style={{flex:1,minWidth:180,padding:"8px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
   {[{v:"all",l:"Toutes"},...Object.entries(FEAT_CATS).map(([k,v])=>({v:k,l:v.label}))].map(o=>
    <button key={o.v} onClick={()=>setFilter(o.v)} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${filter===o.v?C.acc+"66":C.brd}`,background:filter===o.v?C.accD:"transparent",color:filter===o.v?C.acc:C.td,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{o.l}</button>
   )}
  </div>

  {filtered.map(f=>{
   const cat=FEAT_CATS[f.cat]||FEAT_CATS.core;
   const ovKeys=Object.keys(ov).filter(k=>k.endsWith(`_${f.id}`));
   return<Card key={f.id} style={{marginBottom:6,padding:"12px 16px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
     <span style={{fontSize:18,width:28,textAlign:"center"}}>{f.icon}</span>
     <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
       <span style={{fontWeight:700,fontSize:12}}>{f.label}</span>
       <span style={{padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:600,background:cat.color+"18",color:cat.color,border:`1px solid ${cat.color}33`}}>{cat.label}</span>
      </div>
      <div style={{fontSize:10,color:C.td,marginTop:1}}>{f.desc}</div>
     </div>
     <Toggle on={f.enabled} onToggle={()=>toggle(f.id)} label={f.enabled?"ON":"OFF"}/>
     <button onClick={()=>setOpenOv(openOv===f.id?null:f.id)} style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${C.brd}`,background:openOv===f.id?C.accD:"transparent",color:openOv===f.id?C.acc:C.td,fontSize:9,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>
      {ovKeys.length>0?`🔀 ${ovKeys.length}`:"Par société"}
     </button>
    </div>
    {openOv===f.id&&<div style={{marginTop:10,padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`}}>
     <div style={{fontSize:9,color:C.td,fontWeight:600,marginBottom:6,letterSpacing:.5}}>OVERRIDES PAR SOCIÉTÉ</div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:4}}>
      {(socs||[]).filter(s=>s.stat==="active"||s.stat==="lancement").map(s=>{
       const key=`${s.id}_${f.id}`;const o2=ov[key];const effective=o2!==undefined?o2:f.enabled;const isOv=o2!==undefined;
       return<div key={s.id} onClick={()=>toggleOv(s.id,f.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderRadius:6,border:`1px solid ${isOv?C.o+"44":C.brd}`,background:isOv?C.oD:"transparent",cursor:"pointer",transition:"all .15s"}}>
        <span style={{width:6,height:6,borderRadius:3,background:s.color}}/>
        <span style={{flex:1,fontSize:10,fontWeight:500}}>{s.nom}</span>
        <span style={{fontSize:9,fontWeight:700,color:effective?C.g:C.r}}>{effective?"ON":"OFF"}</span>
        {isOv&&<span style={{fontSize:7,color:C.o,fontWeight:700}}>OV</span>}
       </div>;
      })}
     </div>
    </div>}
   </Card>;
  })}
 </>;
}

/* ====== ASSETS & BRANDING ====== */
function AssetsTab({cfg,setCfg,hold,setHold,saveHold}){
 const brand=hold?.brand||{};
 const uBrand=(k,v)=>setHold({...hold,brand:{...(hold.brand||{}), [k]:v}});
 const uCfg=(k,v)=>{const nc={...cfg,[k]:v};setCfg(nc);saveCfg(nc);};

 return<>
  <div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE,marginBottom:16}}>Assets & Branding</div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>

   <Card style={{padding:16}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}><span style={{fontSize:14}}>&#x1F3F7;</span><span style={{fontWeight:700,fontSize:12}}>Identité de marque</span></div>
    <Inp label="Nom de la plateforme" value={brand.name||""} onChange={v=>uBrand("name",v)} placeholder="L'INCUBATEUR ECS"/>
    <Inp label="Sous-titre" value={brand.sub||""} onChange={v=>uBrand("sub",v)} placeholder="Plateforme de pilotage"/>
    <Inp label="Logo URL" value={brand.logoUrl||""} onChange={v=>uBrand("logoUrl",v)} placeholder="https://..."/>
    <Inp label="Lettre logo (fallback)" value={brand.logoLetter||""} onChange={v=>uBrand("logoLetter",v)} placeholder="E"/>
    {brand.logoUrl&&<div style={{marginTop:8,padding:10,background:C.bg,borderRadius:10,textAlign:"center",border:`1px solid ${C.brd}`}}>
     <img src={brand.logoUrl} alt="Logo" style={{maxHeight:60,maxWidth:"100%",objectFit:"contain"}} onError={e=>{e.target.style.display="none";}}/>
     <div style={{fontSize:8,color:C.td,marginTop:4}}>Aperçu logo</div>
    </div>}
   </Card>

   <Card style={{padding:16}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}><span style={{fontSize:14}}>&#x1F3A8;</span><span style={{fontWeight:700,fontSize:12}}>Couleurs</span></div>
    {[{key:"accentColor",label:"Couleur accent principale",def:"#FFAA00"},
      {key:"gradientFrom",label:"Gradient — Début",def:"#FFBF00"},
      {key:"gradientTo",label:"Gradient — Fin",def:"#FF9D00"}
    ].map(c=><div key={c.key} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
     <input type="color" value={brand[c.key]||c.def} onChange={e=>uBrand(c.key,e.target.value)} style={{width:32,height:26,border:`1px solid ${C.brd}`,borderRadius:6,cursor:"pointer",padding:1}}/>
     <div><div style={{fontSize:10,fontWeight:600}}>{c.label}</div><div style={{fontSize:9,color:C.td,fontFamily:"monospace"}}>{brand[c.key]||c.def}</div></div>
    </div>)}
    <div style={{marginTop:12,padding:10,borderRadius:10,background:`linear-gradient(135deg,${brand.gradientFrom||"#FFBF00"},${brand.gradientTo||"#FF9D00"})`,textAlign:"center"}}>
     <span style={{fontWeight:800,fontSize:13,color:"#0a0a0f"}}>{brand.name||"PREVIEW"}</span>
    </div>
   </Card>

   <Card style={{padding:16}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}><span style={{fontSize:14}}>&#x1F510;</span><span style={{fontWeight:700,fontSize:12}}>Page de connexion</span></div>
    <Inp label="Image de fond (URL)" value={cfg.loginBg||""} onChange={v=>uCfg("loginBg",v)} placeholder="https://... (optionnel)"/>
    <Inp label="Message d'accueil" value={cfg.loginMsg||""} onChange={v=>uCfg("loginMsg",v)} placeholder="Bienvenue sur la plateforme" textarea/>
   </Card>

   <Card style={{padding:16}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}><span style={{fontSize:14}}>&#x1F6A7;</span><span style={{fontWeight:700,fontSize:12}}>Mode maintenance</span></div>
    <Toggle on={!!cfg.maintenanceMode} onToggle={()=>{
     const nc=addLog({...cfg,maintenanceMode:!cfg.maintenanceMode},"maintenance_toggle",cfg.maintenanceMode?"OFF":"ON");
     setCfg(nc);saveCfg(nc);
    }} label={cfg.maintenanceMode?"Maintenance activée":"Plateforme en ligne"}/>
    <div style={{marginTop:10}}>
     <Inp label="Message de maintenance" value={cfg.maintenanceMsg||""} onChange={v=>uCfg("maintenanceMsg",v)} textarea/>
    </div>
    {cfg.maintenanceMode&&<div style={{marginTop:8,padding:"8px 12px",background:C.oD,borderRadius:8,border:`1px solid ${C.o}33`}}>
     <span style={{fontSize:10,color:C.o,fontWeight:600}}>La plateforme est actuellement en mode maintenance pour les porteurs</span>
    </div>}
   </Card>

   <Card style={{padding:16,gridColumn:"1 / -1"}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}>
     <span style={{fontSize:14}}>&#x1F4BB;</span><span style={{fontWeight:700,fontSize:12}}>CSS personnalisé</span>
     <span style={{fontSize:8,color:C.td,background:C.card2,padding:"2px 6px",borderRadius:4}}>Avancé</span>
    </div>
    <textarea value={cfg.customCss||""} onChange={e=>uCfg("customCss",e.target.value)}
     placeholder="/* CSS personnalisé */\n.glass-card { border-radius: 20px; }" rows={4}
     style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:"monospace",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
   </Card>
  </div>

  <Btn onClick={()=>{saveHold();const nc=addLog(cfg,"brand_save","Brand settings saved");setCfg(nc);saveCfg(nc);}}>Sauvegarder branding</Btn>
 </>;
}

/* ====== IAM & SECURITY ====== */
function IAMTab({cfg,setCfg,socs}){
 const[users,setUsers]=useState([]);const[loading,setLoading]=useState(true);
 const[showAddKey,setShowAddKey]=useState(false);const[keyName,setKeyName]=useState("");const[keyScope,setKeyScope]=useState("read");
 const roles=cfg.roles||DEFAULT_ROLES;const apiKeys=cfg.apiKeys||[];
 const feats=cfg.features||DEFAULT_FEATURES;
 const policy=cfg.passwordPolicy||DEFAULT_CFG.passwordPolicy;
 const bf=cfg.bruteForce||DEFAULT_CFG.bruteForce;

 const loadUsers=useCallback(async()=>{
  setLoading(true);
  try{const r=await fetch("/api/auth?action=list_users");if(r.ok){const d=await r.json();setUsers(d.users||[]);}}catch{}
  setLoading(false);
 },[]);
 useEffect(()=>{loadUsers();},[loadUsers]);

 const genKey=()=>{
  if(!keyName)return;
  const key={id:uid(),name:keyName,scope:keyScope,key:`sc_${uid()}_${Math.random().toString(36).slice(2,14)}`,created:new Date().toISOString(),active:true};
  const nc=addLog({...cfg,apiKeys:[...apiKeys,key]},"api_key_create",keyName);
  setCfg(nc);saveCfg(nc);setShowAddKey(false);setKeyName("");setKeyScope("read");
 };

 const revokeKey=(id)=>{
  const nc=addLog({...cfg,apiKeys:apiKeys.map(k=>k.id===id?{...k,active:false}:k)},"api_key_revoke",apiKeys.find(k=>k.id===id)?.name||"");
  setCfg(nc);saveCfg(nc);
 };

 const deleteKey=(id)=>{const nc={...cfg,apiKeys:apiKeys.filter(k=>k.id!==id)};setCfg(nc);saveCfg(nc);};

 const uPol=(k,v)=>{const nc={...cfg,passwordPolicy:{...policy,[k]:v}};setCfg(nc);saveCfg(nc);};
 const uBf=(k,v)=>{const nc={...cfg,bruteForce:{...bf,[k]:v}};setCfg(nc);saveCfg(nc);};

 const togglePerm=(roleId,featId)=>{
  const nr=roles.map(r=>{
   if(r.id!==roleId||r.perms.includes("*"))return r;
   const has=r.perms.includes(featId);
   return{...r,perms:has?r.perms.filter(p=>p!==featId):[...r.perms,featId]};
  });
  const nc={...cfg,roles:nr};setCfg(nc);saveCfg(nc);
 };

 const activeKeyCount=apiKeys.filter(k=>k.active).length;

 return<>
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
   <div style={{flex:1,minWidth:200}}>
    <div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE}}>IAM & Sécurité</div>
    <div style={{fontSize:10,color:C.td,marginTop:2}}>Gestion des identités, accès et sécurité</div>
   </div>
   <div style={{display:"flex",gap:6}}>
    <KPI label="Admins" value={users.filter(u=>u.user_metadata?.role==="admin").length} accent="#FFBF00" icon="👑"/>
    <KPI label="Porteurs" value={users.filter(u=>u.user_metadata?.role!=="admin").length} accent={C.b} icon="👤"/>
    <KPI label="API Keys" value={activeKeyCount} accent={C.g} icon="🔑"/>
   </div>
  </div>

  {/* Users */}
  <Sect title="Utilisateurs" sub={`${users.length} comptes`} right={<Btn small v="secondary" onClick={loadUsers}>Refresh</Btn>}>
   {loading&&<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Chargement...</div>}
   {!loading&&users.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucun utilisateur</div></Card>}
   {!loading&&users.map(u=>{
    const meta=u.user_metadata||{};const isA=meta.role==="admin";const soc=socs.find(s=>s.id===meta.society_id);
    const recent=u.last_sign_in_at&&(Date.now()-new Date(u.last_sign_in_at).getTime()<604800000);
    return<Card key={u.id} style={{marginBottom:4,padding:"10px 14px"}}>
     <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:700,background:isA?"#FFBF0022":"#3b82f622",color:isA?"#FFBF00":"#3b82f6",border:`1px solid ${isA?"#FFBF0033":"#3b82f633"}`}}>{isA?"Admin":"Porteur"}</span>
      <div style={{flex:1,minWidth:100}}>
       <div style={{fontWeight:700,fontSize:12}}>{meta.name||u.email}</div>
       <div style={{fontSize:10,color:C.td}}>{u.email}{soc?` · ${soc.nom}`:""}</div>
      </div>
      <div style={{fontSize:9,color:C.td}}>{u.last_sign_in_at?`Vu ${new Date(u.last_sign_in_at).toLocaleDateString("fr-FR")}`:"Jamais connecté"}</div>
      <div style={{width:8,height:8,borderRadius:4,background:recent?C.g:C.td}}/>
     </div>
    </Card>;
   })}
  </Sect>

  {/* Permission Matrix */}
  <Sect title="Matrice des permissions" sub="Rôles et accès aux fonctionnalités">
   <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
     <thead><tr style={{borderBottom:`1px solid ${C.brd}`}}>
      <th style={{textAlign:"left",padding:"8px 10px",color:C.td,fontWeight:600,fontSize:9,position:"sticky",left:0,background:C.card,zIndex:1}}>FEATURE</th>
      {roles.map(r=><th key={r.id} style={{textAlign:"center",padding:"8px 6px",color:r.color,fontWeight:700,fontSize:9,minWidth:80}}>{r.label}</th>)}
     </tr></thead>
     <tbody>{feats.map((f,i)=>
      <tr key={f.id} style={{borderBottom:`1px solid ${C.brd}08`,background:i%2===0?"transparent":C.card2+"33"}}>
       <td style={{padding:"6px 10px",fontWeight:500,position:"sticky",left:0,background:C.card,zIndex:1}}>
        <span style={{marginRight:4}}>{f.icon}</span>{f.label}
       </td>
       {roles.map(r=>{
        const hasAll=r.perms.includes("*");const has=hasAll||r.perms.includes(f.id);
        return<td key={r.id} style={{textAlign:"center",padding:"6px 4px"}}>
         <button onClick={()=>togglePerm(r.id,f.id)} disabled={hasAll} style={{width:24,height:24,borderRadius:6,border:`1px solid ${has?C.g+"66":C.brd}`,background:has?C.gD:"transparent",color:has?C.g:C.tm,cursor:hasAll?"default":"pointer",fontSize:11,fontFamily:FONT,display:"inline-flex",alignItems:"center",justifyContent:"center",opacity:hasAll?.6:1}}>
          {has?"✓":"—"}
         </button>
        </td>;
       })}
      </tr>
     )}</tbody>
    </table>
   </div>
  </Sect>

  {/* API Keys */}
  <Sect title="Clés API" sub={`${activeKeyCount} active${activeKeyCount>1?"s":""}`} right={<Btn small onClick={()=>setShowAddKey(true)}>+ Nouvelle clé</Btn>}>
   {apiKeys.length===0&&<Card><div style={{textAlign:"center",padding:16,color:C.td,fontSize:11}}>Aucune clé API</div></Card>}
   {apiKeys.map(k=><Card key={k.id} style={{marginBottom:4,padding:"10px 14px",opacity:k.active?1:.5}}>
    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
     <span style={{fontSize:14}}>{k.active?"🔑":"🔒"}</span>
     <div style={{flex:1}}>
      <div style={{fontWeight:700,fontSize:11}}>{k.name}</div>
      <div style={{fontSize:9,color:C.td,fontFamily:"monospace"}}>{k.key.slice(0,12)}...{k.key.slice(-6)}</div>
     </div>
     <span style={{padding:"2px 6px",borderRadius:4,fontSize:8,fontWeight:600,background:k.scope==="write"?C.oD:C.bD,color:k.scope==="write"?C.o:C.b}}>{k.scope}</span>
     <span style={{fontSize:9,color:C.td}}>{new Date(k.created).toLocaleDateString("fr-FR")}</span>
     {k.active&&<button onClick={()=>revokeKey(k.id)} style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${C.o}33`,background:C.oD,color:C.o,fontSize:9,cursor:"pointer",fontFamily:FONT}}>Révoquer</button>}
     {!k.active&&<button onClick={()=>deleteKey(k.id)} style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${C.r}33`,background:C.rD,color:C.r,fontSize:9,cursor:"pointer",fontFamily:FONT}}>Supprimer</button>}
    </div>
   </Card>)}
  </Sect>

  {/* Security */}
  <Sect title="Politique de sécurité">
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
    <Card style={{padding:14}}>
     <div style={{fontWeight:700,fontSize:11,marginBottom:10}}>Mot de passe</div>
     <Inp label="Longueur minimum" value={policy.minLength} onChange={v=>uPol("minLength",parseInt(v)||6)} type="number" small/>
     <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
      <Toggle on={!!policy.requireUpper} onToggle={()=>uPol("requireUpper",!policy.requireUpper)} label="Majuscule requise"/>
      <Toggle on={!!policy.requireNum} onToggle={()=>uPol("requireNum",!policy.requireNum)} label="Chiffre requis"/>
      <Toggle on={!!policy.requireSpecial} onToggle={()=>uPol("requireSpecial",!policy.requireSpecial)} label="Caractère spécial requis"/>
     </div>
    </Card>
    <Card style={{padding:14}}>
     <div style={{fontWeight:700,fontSize:11,marginBottom:10}}>Protection brute force</div>
     <Inp label="Tentatives max" value={bf.maxAttempts} onChange={v=>uBf("maxAttempts",parseInt(v)||5)} type="number" small/>
     <Inp label="Fenêtre (minutes)" value={bf.windowMin} onChange={v=>uBf("windowMin",parseInt(v)||15)} type="number" small/>
     <div style={{marginTop:8,padding:"6px 8px",background:C.bD,borderRadius:6,fontSize:9,color:C.b}}>
      Après {bf.maxAttempts} échecs, verrouillé {bf.windowMin} min
     </div>
    </Card>
   </div>
  </Sect>

  <Modal open={showAddKey} onClose={()=>setShowAddKey(false)} title="Créer une clé API">
   <Inp label="Nom de la clé" value={keyName} onChange={setKeyName} placeholder="Ex: Webhook Zapier..."/>
   <Sel label="Scope" value={keyScope} onChange={setKeyScope} options={[{v:"read",l:"Lecture seule"},{v:"write",l:"Lecture + Écriture"},{v:"admin",l:"Administrateur"}]}/>
   <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={genKey}>Générer</Btn><Btn v="secondary" onClick={()=>setShowAddKey(false)}>Annuler</Btn></div>
  </Modal>
 </>;
}

/* ====== DATA GOVERNANCE ====== */
function DataTab({cfg,setCfg}){
 const[logFilter,setLogFilter]=useState("all");const[logSearch,setLogSearch]=useState("");
 const[showExport,setShowExport]=useState(false);const[showGdpr,setShowGdpr]=useState(false);const[gdprEmail,setGdprEmail]=useState("");
 const audit=cfg.auditLog||[];const retention=cfg.retentionDays||365;

 const LOG_TYPES={
  feature_toggle:{label:"Feature Flag",icon:"🎚",color:C.b},
  feature_override:{label:"Override",icon:"🔀",color:C.o},
  maintenance_toggle:{label:"Maintenance",icon:"🚧",color:C.r},
  brand_save:{label:"Branding",icon:"🎨",color:C.v},
  api_key_create:{label:"Clé API",icon:"🔑",color:C.g},
  api_key_revoke:{label:"Révocation",icon:"🔒",color:C.r},
  data_export:{label:"Export",icon:"📤",color:C.b},
  gdpr_request:{label:"RGPD",icon:"🛡",color:C.o},
  cache_clear:{label:"Cache",icon:"🗑",color:C.td},
  system:{label:"Système",icon:"⚙️",color:C.td},
 };

 const filtered=audit.filter(e=>{
  if(logFilter!=="all"&&e.action!==logFilter)return false;
  if(logSearch&&!(e.detail||"").toLowerCase().includes(logSearch.toLowerCase()))return false;
  return true;
 });

 const doExport=()=>{
  const keys=["scAs","scAr","scAh","scAa","scAj","scAp","scAd","scAu","scAt","scAcl","scAiv","scAo","scAy","scAk"];
  const data={};keys.forEach(k=>{try{data[k]=JSON.parse(localStorage.getItem(k)||"null");}catch{}});
  data._exportedAt=new Date().toISOString();data._version="1.0";
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");
  a.href=url;a.download=`scale-corp-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();URL.revokeObjectURL(url);
  const nc=addLog(cfg,"data_export",`${keys.length} collections`);setCfg(nc);saveCfg(nc);
  setShowExport(false);
 };

 const doImport=(e)=>{
  const file=e.target.files?.[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=(ev)=>{
   try{
    const data=JSON.parse(ev.target.result);
    const keys=Object.keys(data).filter(k=>k.startsWith("sc"));
    keys.forEach(k=>{if(data[k]!==null)localStorage.setItem(k,JSON.stringify(data[k]));});
    const nc=addLog(cfg,"system",`Import: ${keys.length} collections`);setCfg(nc);saveCfg(nc);
    alert(`Import réussi ! ${keys.length} collections. Rechargez la page.`);
   }catch{alert("Erreur: fichier JSON invalide");}
  };
  reader.readAsText(file);
 };

 return<>
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
   <div style={{flex:1,minWidth:200}}>
    <div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE}}>Data Governance</div>
    <div style={{fontSize:10,color:C.td,marginTop:2}}>Audit, rétention, export/import, RGPD</div>
   </div>
   <div style={{display:"flex",gap:6}}>
    <KPI label="Audit Log" value={audit.length} accent={C.b} icon="📋"/>
    <KPI label="Rétention" value={`${retention}j`} accent={C.g} icon="📅"/>
   </div>
  </div>

  <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
   <Btn small onClick={()=>setShowExport(true)}>Exporter les données</Btn>
   <label style={{display:"inline-flex"}}>
    <input type="file" accept=".json" onChange={doImport} style={{display:"none"}}/>
    <span style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card,color:C.t,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Importer</span>
   </label>
   <Btn small v="secondary" onClick={()=>setShowGdpr(true)}>Demande RGPD</Btn>
   <div style={{flex:1}}/>
   <div style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:10,color:C.td}}>Rétention :</span>
    <select value={retention} onChange={e=>{const nc={...cfg,retentionDays:parseInt(e.target.value)};setCfg(nc);saveCfg(nc);}} style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT}}>
     <option value={90}>90 jours</option><option value={180}>6 mois</option><option value={365}>1 an</option><option value={730}>2 ans</option><option value={1825}>5 ans</option>
    </select>
   </div>
  </div>

  <Sect title="Journal d'audit" sub={`${filtered.length} événement${filtered.length>1?"s":""}`}>
   <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
    <input value={logSearch} onChange={e=>setLogSearch(e.target.value)} placeholder="Rechercher..." style={{flex:1,minWidth:150,padding:"6px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT,outline:"none"}}/>
    <select value={logFilter} onChange={e=>setLogFilter(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT}}>
     <option value="all">Tous</option>
     {Object.entries(LOG_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
    </select>
   </div>
   {filtered.length===0&&<Card><div style={{textAlign:"center",padding:16,color:C.td,fontSize:11}}>Aucun événement</div></Card>}
   <div style={{maxHeight:400,overflowY:"auto"}}>
    {filtered.slice(0,100).map(e=>{
     const lt=LOG_TYPES[e.action]||{label:e.action,icon:"⚙️",color:C.td};
     return<div key={e.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderBottom:`1px solid ${C.brd}08`}}>
      <span style={{fontSize:12,width:20,textAlign:"center"}}>{lt.icon}</span>
      <span style={{padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:600,background:lt.color+"18",color:lt.color,flexShrink:0}}>{lt.label}</span>
      <span style={{flex:1,fontSize:10,color:C.t,fontWeight:500}}>{e.detail}</span>
      <span style={{fontSize:9,color:C.td,flexShrink:0}}>{e.user}</span>
      <span style={{fontSize:9,color:C.td,flexShrink:0,minWidth:55,textAlign:"right"}}>{ago(e.at)}</span>
     </div>;
    })}
   </div>
  </Sect>

  <Modal open={showExport} onClose={()=>setShowExport(false)} title="Exporter les données">
   <div style={{fontSize:11,color:C.td,marginBottom:14}}>Exporter toutes les données au format JSON.</div>
   {["scAs:Sociétés","scAr:Rapports","scAh:Holding","scAcl:Clients","scAiv:Factures","scAu:Abonnements","scAt:Équipe","scAa:Actions","scAp:Pulses","scAd:Deals"].map(item=>{
    const[key,label]=item.split(":");let count="—";
    try{const d=JSON.parse(localStorage.getItem(key));count=Array.isArray(d)?d.length:d?"✓":"—";}catch{}
    return<div key={key} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
     <span style={{fontSize:10,fontWeight:500,flex:1}}>{label}</span>
     <span style={{fontSize:9,color:C.td,fontFamily:"monospace"}}>{key}</span>
     <span style={{fontSize:9,fontWeight:600,color:C.g}}>{count}</span>
    </div>;
   })}
   <div style={{display:"flex",gap:8,marginTop:14}}><Btn onClick={doExport}>Exporter (JSON)</Btn><Btn v="secondary" onClick={()=>setShowExport(false)}>Annuler</Btn></div>
  </Modal>

  <Modal open={showGdpr} onClose={()=>setShowGdpr(false)} title="Demande RGPD">
   <div style={{fontSize:11,color:C.td,marginBottom:10}}>Enregistrer une demande de suppression ou d'export (Art. 17 & 20 RGPD).</div>
   <Inp label="Email concerné" value={gdprEmail} onChange={setGdprEmail} placeholder="utilisateur@email.com"/>
   <Inp label="Contact DPO" value={cfg.gdprContact||""} onChange={v=>{const nc={...cfg,gdprContact:v};setCfg(nc);saveCfg(nc);}} placeholder="dpo@entreprise.com"/>
   <div style={{display:"flex",gap:8,marginTop:12}}>
    <Btn onClick={()=>{if(!gdprEmail)return;const nc=addLog(cfg,"gdpr_request",gdprEmail);setCfg(nc);saveCfg(nc);setShowGdpr(false);setGdprEmail("");}}>Enregistrer</Btn>
    <Btn v="secondary" onClick={()=>setShowGdpr(false)}>Annuler</Btn>
   </div>
  </Modal>
 </>;
}

/* ====== SYSTEM ====== */
function SystemTab({cfg,setCfg,socs,hold}){
 const[health,setHealth]=useState({});const[checking,setChecking]=useState(false);const[storageInfo,setStorageInfo]=useState(null);

 const checkHealth=useCallback(async()=>{
  setChecking(true);const res={};
  try{const r=await fetch("/api/auth?action=me",{signal:AbortSignal.timeout(5000)});res.supabase={status:r.ok?"ok":"degraded",detail:r.ok?"Connecté":`HTTP ${r.status}`};}catch(e){res.supabase={status:"down",detail:e.message||"Injoignable"};}
  const gS=socs.filter(s=>s.ghlKey);res.ghl={status:gS.length>0?"ok":"inactive",detail:`${gS.length} société${gS.length>1?"s":""}`};
  const rS=socs.filter(s=>s.revToken);const hR=!!hold?.revolutToken;res.revolut={status:(rS.length>0||hR)?"ok":"inactive",detail:`${rS.length+(hR?1:0)} connexion${rS.length+(hR?1:0)>1?"s":""}`};
  res.slack={status:hold?.slack?.enabled?"ok":"inactive",detail:hold?.slack?.enabled?`Mode: ${hold.slack.mode}`:"Non configuré"};
  res.stripe={status:"inactive",detail:"Non configuré"};
  try{const r=await fetch("/api/store?action=get&k=health_check",{signal:AbortSignal.timeout(5000)});res.storage_api={status:r.ok?"ok":"degraded",detail:r.ok?"Opérationnel":`HTTP ${r.status}`};}catch{res.storage_api={status:"down",detail:"Injoignable"};}
  setHealth(res);setChecking(false);
 },[socs,hold]);

 useEffect(()=>{checkHealth();},[checkHealth]);

 const calcStorage=useCallback(()=>{
  let total=0;const items=[];
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);const v=localStorage.getItem(k);const sz=(k.length+v.length)*2;total+=sz;if(k.startsWith("sc"))items.push({key:k,size:sz});}
  items.sort((a,b)=>b.size-a.size);setStorageInfo({total,items:items.slice(0,15)});
 },[]);
 useEffect(()=>{calcStorage();},[calcStorage]);

 const clearCache=(key)=>{
  if(key==="all"){const keep=["sc_auth_token","sc_auth_refresh","scTheme","sc_store_token"];
   for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k?.startsWith("sc")&&!keep.includes(k))localStorage.removeItem(k);}}
  else localStorage.removeItem(key);
  const nc=addLog(cfg,"cache_clear",key==="all"?"Full clear":`Cleared ${key}`);setCfg(nc);saveCfg(nc);
  calcStorage();
 };

 const STS={ok:{bg:C.gD,color:C.g,label:"Opérationnel"},degraded:{bg:C.oD,color:C.o,label:"Dégradé"},down:{bg:C.rD,color:C.r,label:"Hors ligne"},inactive:{bg:C.card2,color:C.td,label:"Inactif"}};
 const LABELS={scAs:"Sociétés",scAr:"Rapports",scAh:"Holding",scAa:"Actions",scAj:"Journal",scAp:"Pulses",scAd:"Deals",scAg:"GHL Data",scAv:"Revolut",scAb:"Bank Data",scAo:"OKRs",scAy:"Synergies",scAk:"Knowledge Base",scAu:"Abonnements",scAt:"Équipe",scAcl:"Clients",scAiv:"Factures",scAdmCfg:"Admin Config"};
 const fmtB=(b)=>b<1024?`${b} B`:b<1048576?`${(b/1024).toFixed(1)} KB`:`${(b/1048576).toFixed(1)} MB`;

 return<>
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
   <div style={{flex:1,minWidth:200}}>
    <div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE}}>Système</div>
    <div style={{fontSize:10,color:C.td,marginTop:2}}>Santé plateforme, cache, environnement</div>
   </div>
   <Btn small v="secondary" onClick={checkHealth} disabled={checking}>{checking?"Vérification...":"Re-check"}</Btn>
  </div>

  <Sect title="Santé des services" sub="Statut des intégrations">
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
    {[{key:"supabase",name:"Supabase Auth",icon:"🔐"},
      {key:"ghl",name:"GoHighLevel CRM",icon:"📡"},
      {key:"revolut",name:"Revolut Banking",icon:"🏦"},
      {key:"slack",name:"Slack Notifs",icon:"💬"},
      {key:"stripe",name:"Stripe Payments",icon:"💳"},
      {key:"storage_api",name:"Storage API",icon:"💾"}
    ].map(svc=>{
     const h=health[svc.key]||{status:"inactive"};const st=STS[h.status]||STS.inactive;
     return<Card key={svc.key} style={{padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
       <span style={{fontSize:16}}>{svc.icon}</span>
       <div style={{flex:1}}><div style={{fontWeight:700,fontSize:11}}>{svc.name}</div><div style={{fontSize:9,color:C.td}}>{h.detail||"—"}</div></div>
       <span style={{padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:700,background:st.bg,color:st.color}}>{st.label}</span>
      </div>
     </Card>;
    })}
   </div>
  </Sect>

  <Sect title="Stockage local" sub={storageInfo?`${fmtB(storageInfo.total)} utilisés`:"Calcul..."}>
   {storageInfo&&<>
    <div style={{marginBottom:12}}>
     <PBar pct={Math.min(100,(storageInfo.total/5242880)*100)} color={storageInfo.total>4194304?C.r:storageInfo.total>2621440?C.o:C.g}/>
     <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
      <span style={{fontSize:9,color:C.td}}>{fmtB(storageInfo.total)} / 5 MB</span>
      <span style={{fontSize:9,color:C.td}}>{Math.round((storageInfo.total/5242880)*100)}%</span>
     </div>
    </div>
    <div style={{maxHeight:300,overflowY:"auto"}}>
     {storageInfo.items.map(item=><div key={item.key} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderBottom:`1px solid ${C.brd}08`}}>
      <span style={{fontSize:10,fontWeight:600,flex:1}}>{LABELS[item.key]||item.key}</span>
      <span style={{fontSize:9,color:C.td,fontFamily:"monospace"}}>{item.key}</span>
      <span style={{fontSize:9,fontWeight:600,color:C.b,minWidth:50,textAlign:"right"}}>{fmtB(item.size)}</span>
      <button onClick={()=>clearCache(item.key)} style={{padding:"2px 6px",borderRadius:4,border:`1px solid ${C.r}33`,background:"transparent",color:C.r,fontSize:8,cursor:"pointer",fontFamily:FONT}}>x</button>
     </div>)}
    </div>
    <div style={{marginTop:10}}><Btn small v="secondary" onClick={()=>{if(window.confirm("Vider le cache (hors auth/thème) ? Données rechargées depuis Supabase au prochain login."))clearCache("all");}}>Vider le cache</Btn></div>
   </>}
  </Sect>

  <Sect title="Environnement">
   <Card style={{padding:14}}>
    <div style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:"6px 12px",fontSize:10}}>
     {[["Plateforme",hold?.brand?.name||"Scale Corp"],["Version","2.0.0"],["React",React.version],
       ["Environnement",window.location.hostname==="localhost"?"Development":"Production"],
       ["URL",window.location.origin],["Langue",navigator.language],
       ["Sociétés",`${socs.length} (${socs.filter(s=>s.stat==="active").length} actives)`],
       ["Thème",localStorage.getItem("scTheme")||"dark"],
       ["Service Worker","serviceWorker" in navigator?"Supporté":"Non supporté"]
     ].map(([k,v])=><React.Fragment key={k}>
      <span style={{color:C.td,fontWeight:600}}>{k}</span>
      <span style={{color:C.t,fontFamily:"monospace",wordBreak:"break-all"}}>{v}</span>
     </React.Fragment>)}
    </div>
   </Card>
  </Sect>
 </>;
}

/* ====== MAIN EXPORT ====== */
const SUB_TABS=[
 {id:0,label:"Feature Flags",icon:"🎚",accent:C.b},
 {id:1,label:"Assets & Branding",icon:"🎨",accent:C.v},
 {id:2,label:"IAM & Sécurité",icon:"🔐",accent:"#f59e0b"},
 {id:3,label:"Data Governance",icon:"🛡",accent:C.g},
 {id:4,label:"Système",icon:"⚙️",accent:C.td},
];

export function AdminPanel({socs,hold,setHold,saveHold}){
 const[cfg,setCfg]=useState(loadCfg);
 const[subTab,setSubTab]=useState(0);

 return<div>
  <div style={{fontWeight:900,fontSize:20,fontFamily:FONT_TITLE,marginBottom:4}}>Administration</div>
  <div style={{fontSize:11,color:C.td,marginBottom:16}}>Panel d'administration backend — Configuration, sécurité, gouvernance</div>

  {cfg.maintenanceMode&&<div style={{padding:"10px 14px",background:C.oD,borderRadius:10,border:`1px solid ${C.o}44`,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
   <span style={{fontSize:16}}>&#x1F6A7;</span>
   <div><div style={{fontWeight:700,fontSize:11,color:C.o}}>Mode maintenance activé</div><div style={{fontSize:10,color:C.td}}>{cfg.maintenanceMsg}</div></div>
  </div>}

  <div style={{display:"flex",gap:4,marginBottom:20,overflowX:"auto",padding:"2px 0"}}>
   {SUB_TABS.map(t=>{
    const active=subTab===t.id;
    return<button key={t.id} onClick={()=>setSubTab(t.id)} style={{
     display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,
     border:`1px solid ${active?t.accent+"55":C.brd}`,background:active?t.accent+"15":"transparent",
     color:active?C.t:C.td,fontSize:11,fontWeight:active?700:500,cursor:"pointer",fontFamily:FONT,
     whiteSpace:"nowrap",transition:"all .15s",flexShrink:0,
     boxShadow:active?`0 0 12px ${t.accent}22`:"none",
    }}>
     <span style={{fontSize:13}}>{t.icon}</span><span>{t.label}</span>
     {active&&<span style={{width:5,height:5,borderRadius:3,background:t.accent}}/>}
    </button>;
   })}
  </div>

  {subTab===0&&<FeaturesTab cfg={cfg} setCfg={setCfg} socs={socs}/>}
  {subTab===1&&<AssetsTab cfg={cfg} setCfg={setCfg} hold={hold} setHold={setHold} saveHold={saveHold}/>}
  {subTab===2&&<IAMTab cfg={cfg} setCfg={setCfg} socs={socs}/>}
  {subTab===3&&<DataTab cfg={cfg} setCfg={setCfg}/>}
  {subTab===4&&<SystemTab cfg={cfg} setCfg={setCfg} socs={socs} hold={hold}/>}
 </div>;
}
