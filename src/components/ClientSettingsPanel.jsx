import React, { useState } from "react";
import { C, FONT, FONT_TITLE, uid, sSet } from "../shared.jsx";
import { Btn, Card, Inp, Sel, Sect, Modal, Toggle, KPI } from "../components.jsx";

const SK="scCpState";
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));sSet(k,v);}catch{}}

const SETTING_TABS=[
 {id:0,label:"Compte",icon:"🏢"},{id:1,label:"Utilisateurs",icon:"👥"},
 {id:2,label:"Facturation",icon:"💳"},{id:3,label:"Intégrations",icon:"🔌"},
 {id:4,label:"Data & Export",icon:"💾"},{id:5,label:"RGPD & Légal",icon:"🛡"},
];

const DEFAULT_ROLES=[
 {id:"owner",label:"Propriétaire",desc:"Accès total, facturation, suppression",color:"#FFBF00",perms:["*"]},
 {id:"admin",label:"Administrateur",desc:"Accès total sauf facturation/suppression",color:C.b,perms:["dashboard","crm","data","agenda","settings","users","health"]},
 {id:"editor",label:"Éditeur",desc:"Lecture et modification des données",color:C.g,perms:["dashboard","crm","data","agenda"]},
 {id:"viewer",label:"Lecteur",desc:"Consultation seule",color:C.td,perms:["dashboard"]},
 {id:"comptable",label:"Comptable",desc:"Accès financier uniquement",color:C.o,perms:["dashboard","data"]},
];

export function ClientSettingsPanel({data,setData,client,setClient}){
 const[sub,setSub]=useState(0);
 const settings=data.settings||{};
 const users=settings.users||[];
 const integrations=settings.integrations||{};

 const uSet=(k,v)=>{const ns={...settings,[k]:v};const nd={...data,settings:ns};setData(nd);sv(SK,nd);};
 const uClient=(k,v)=>{setClient({...client,[k]:v});};

 /* ====== COMPTE ====== */
 const AccountTab=()=><>
  <Sect title="Informations de la société">
   <Card style={{padding:16}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <Inp label="Raison sociale" value={client.company||""} onChange={v=>uClient("company",v)} placeholder="Acme SAS"/>
     <Inp label="SIRET" value={client.siret||""} onChange={v=>uClient("siret",v)} placeholder="123 456 789 00012"/>
     <Inp label="N° TVA" value={client.tva||""} onChange={v=>uClient("tva",v)} placeholder="FR12345678901"/>
     <Inp label="Secteur" value={client.sector||""} onChange={v=>uClient("sector",v)} placeholder="SaaS, Agence..."/>
     <div style={{gridColumn:"1 / -1"}}><Inp label="Adresse" value={client.address||""} onChange={v=>uClient("address",v)} placeholder="123 rue..."/></div>
     <Inp label="Ville" value={client.city||""} onChange={v=>uClient("city",v)}/>
     <Inp label="Code postal" value={client.zip||""} onChange={v=>uClient("zip",v)}/>
     <Inp label="Email principal" value={client.email||""} onChange={v=>uClient("email",v)} type="email"/>
     <Inp label="Téléphone" value={client.phone||""} onChange={v=>uClient("phone",v)}/>
     <Inp label="Site web" value={client.website||""} onChange={v=>uClient("website",v)} placeholder="https://..."/>
    </div>
    <div style={{marginTop:12}}><Btn onClick={()=>{const nd={...data,client};setData(nd);sv(SK,nd);}}>Sauvegarder</Btn></div>
   </Card>
  </Sect>
  <Sect title="Zone dangereuse">
   <Card style={{padding:16,border:`1px solid ${C.r}33`}}>
    <div style={{fontWeight:700,fontSize:12,color:C.r,marginBottom:8}}>⚠️ Suppression du compte</div>
    <div style={{fontSize:10,color:C.td,marginBottom:12}}>La suppression est irréversible. Toutes les données seront supprimées dans les 30 jours conformément au RGPD. Un export sera généré automatiquement.</div>
    <Btn v="danger" small onClick={()=>{if(window.confirm("Êtes-vous sûr ? Cette action est irréversible."))alert("Demande de suppression enregistrée. Vous recevrez un email de confirmation.");}}>Demander la suppression du compte</Btn>
   </Card>
  </Sect>
 </>;

 /* ====== UTILISATEURS ====== */
 const UsersTab=()=>{
  const[showAdd,setShowAdd]=useState(false);
  const[nf,setNf]=useState({name:"",email:"",role:"viewer"});
  const addUser=()=>{
   if(!nf.name||!nf.email)return;
   const u={...nf,id:uid(),createdAt:new Date().toISOString(),status:"invited",lastLogin:null};
   uSet("users",[...users,u]);setShowAdd(false);setNf({name:"",email:"",role:"viewer"});
  };
  const removeUser=(id)=>{uSet("users",users.filter(u=>u.id!==id));};
  const changeRole=(id,role)=>{uSet("users",users.map(u=>u.id===id?{...u,role}:u));};

  return<>
   <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
    {DEFAULT_ROLES.map(r=><KPI key={r.id} label={r.label} value={users.filter(u=>u.role===r.id).length} accent={r.color} small/>)}
   </div>
   <div style={{display:"flex",alignItems:"center",marginBottom:12}}>
    <span style={{flex:1,fontWeight:600,fontSize:12}}>{users.length} utilisateur(s)</span>
    <Btn small onClick={()=>setShowAdd(true)}>+ Inviter</Btn>
   </div>
   {users.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucun utilisateur ajouté</div></Card>}
   {users.map(u=>{
    const role=DEFAULT_ROLES.find(r=>r.id===u.role)||DEFAULT_ROLES[3];
    return<Card key={u.id} style={{marginBottom:4,padding:"10px 14px"}}>
     <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <div style={{width:30,height:30,borderRadius:8,background:`${role.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:role.color}}>{(u.name||"?")[0].toUpperCase()}</div>
      <div style={{flex:1,minWidth:100}}>
       <div style={{fontWeight:700,fontSize:11}}>{u.name}</div>
       <div style={{fontSize:9,color:C.td}}>{u.email}</div>
      </div>
      <select value={u.role} onChange={e=>changeRole(u.id,e.target.value)} style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:9,fontFamily:FONT}}>
       {DEFAULT_ROLES.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
      </select>
      <span style={{padding:"2px 6px",borderRadius:4,fontSize:8,fontWeight:600,background:u.status==="active"?C.gD:C.oD,color:u.status==="active"?C.g:C.o}}>{u.status==="active"?"Actif":"Invité"}</span>
      <button onClick={()=>removeUser(u.id)} style={{padding:"3px 6px",borderRadius:4,border:`1px solid ${C.r}33`,background:"transparent",color:C.r,fontSize:9,cursor:"pointer",fontFamily:FONT}}>×</button>
     </div>
    </Card>;
   })}
   <Sect title="Matrice des rôles" sub="Permissions par rôle">
    <div style={{overflowX:"auto"}}>
     <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
      <thead><tr style={{borderBottom:`1px solid ${C.brd}`}}>
       <th style={{textAlign:"left",padding:"6px 8px",color:C.td,fontWeight:600}}>Permission</th>
       {DEFAULT_ROLES.map(r=><th key={r.id} style={{textAlign:"center",padding:"6px 4px",color:r.color,fontWeight:700,fontSize:9}}>{r.label}</th>)}
      </tr></thead>
      <tbody>{["Dashboard","CRM","Data","Agenda","Paramètres","Utilisateurs","Data Health","Facturation","Suppression"].map((p,i)=>{
       const pk=p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
       return<tr key={p} style={{borderBottom:`1px solid ${C.brd}08`}}>
        <td style={{padding:"6px 8px",fontWeight:500}}>{p}</td>
        {DEFAULT_ROLES.map(r=>{const has=r.perms.includes("*")||r.perms.includes(pk);
         return<td key={r.id} style={{textAlign:"center",padding:"4px"}}><span style={{color:has?C.g:C.tm,fontWeight:700}}>{has?"✓":"—"}</span></td>;
        })}
       </tr>;
      })}</tbody>
     </table>
    </div>
   </Sect>
   <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Inviter un utilisateur">
    <Inp label="Nom complet *" value={nf.name} onChange={v=>setNf({...nf,name:v})} placeholder="Jean Dupont"/>
    <Inp label="Email *" value={nf.email} onChange={v=>setNf({...nf,email:v})} placeholder="jean@acme.com" type="email"/>
    <Sel label="Rôle" value={nf.role} onChange={v=>setNf({...nf,role:v})} options={DEFAULT_ROLES.map(r=>({v:r.id,l:`${r.label} — ${r.desc}`}))}/>
    <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={addUser}>Inviter</Btn><Btn v="secondary" onClick={()=>setShowAdd(false)}>Annuler</Btn></div>
   </Modal>
  </>;
 };

 /* ====== FACTURATION ====== */
 const BillingTab=()=>{
  const bill=data.billing||{};const invoices=data.invoiceHistory||[];
  return<>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
    <KPI label="Forfait" value={bill.plan||"—"} accent={C.acc} icon="📦"/>
    <KPI label="Cycle" value={bill.cycle==="annual"?"Annuel":"Mensuel"} accent={C.b} icon="🔄"/>
    <KPI label="Statut" value={bill.paid?"Actif":"En attente"} accent={bill.paid?C.g:C.o} icon="✅"/>
   </div>
   <Sect title="Historique des factures">
    {invoices.length===0&&<Card><div style={{textAlign:"center",padding:16,color:C.td,fontSize:11}}>Aucune facture</div></Card>}
    {invoices.map(inv=><Card key={inv.id} style={{marginBottom:3,padding:"8px 12px"}}>
     <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:13}}>🧾</span>
      <div style={{flex:1}}><div style={{fontWeight:600,fontSize:11}}>{inv.ref}</div><div style={{fontSize:9,color:C.td}}>{inv.plan}</div></div>
      <span style={{fontWeight:700,fontSize:11,color:C.g}}>{inv.amount}€</span>
      <span style={{fontSize:9,color:C.td}}>{new Date(inv.date).toLocaleDateString("fr-FR")}</span>
     </div>
    </Card>)}
   </Sect>
  </>;
 };

 /* ====== INTÉGRATIONS ====== */
 const IntegrationsTab=()=>{
  const APIS=[
   {id:"stripe",name:"Stripe",desc:"Paiements et factures automatiques",icon:"💳",status:integrations.stripe?"connected":"disconnected"},
   {id:"revolut",name:"Revolut Business",desc:"Données bancaires et réconciliation",icon:"🏦",status:integrations.revolut?"connected":"disconnected"},
   {id:"ghl",name:"GoHighLevel",desc:"CRM, contacts et pipeline",icon:"📡",status:integrations.ghl?"connected":"disconnected"},
   {id:"meta",name:"Meta Ads",desc:"Facebook & Instagram Ads",icon:"📘",status:integrations.meta?"connected":"disconnected"},
   {id:"google",name:"Google Ads",desc:"Campagnes Google Ads",icon:"🔍",status:integrations.google?"connected":"disconnected"},
   {id:"ga4",name:"Google Analytics",desc:"Données de trafic et conversions",icon:"📈",status:integrations.ga4?"connected":"disconnected"},
   {id:"slack",name:"Slack",desc:"Notifications et alertes",icon:"💬",status:integrations.slack?"connected":"disconnected"},
   {id:"zapier",name:"Zapier / Make",desc:"Automatisations et workflows",icon:"⚡",status:integrations.zapier?"connected":"disconnected"},
  ];
  return<>
   <div style={{fontSize:11,color:C.td,marginBottom:14}}>Connectez vos outils pour synchroniser automatiquement les données.</div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8}}>
    {APIS.map(api=>{
     const connected=api.status==="connected";
     return<Card key={api.id} style={{padding:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
       <span style={{fontSize:22}}>{api.icon}</span>
       <div style={{flex:1}}>
        <div style={{fontWeight:700,fontSize:12}}>{api.name}</div>
        <div style={{fontSize:9,color:C.td}}>{api.desc}</div>
       </div>
       <Btn small v={connected?"success":"secondary"} onClick={()=>{
        const ni={...integrations,[api.id]:!connected};uSet("integrations",ni);
       }}>{connected?"Connecté ✓":"Connecter"}</Btn>
      </div>
     </Card>;
    })}
   </div>
  </>;
 };

 /* ====== DATA & EXPORT ====== */
 const DataExportTab=()=>{
  const doExport=()=>{
   const exp={client,data:{...data,settings:undefined},exportedAt:new Date().toISOString(),version:"1.0"};
   const blob=new Blob([JSON.stringify(exp,null,2)],{type:"application/json"});
   const url=URL.createObjectURL(blob);const a=document.createElement("a");
   a.href=url;a.download=`${(client.company||"client").replace(/\s+/g,"-").toLowerCase()}-export-${new Date().toISOString().slice(0,10)}.json`;
   a.click();URL.revokeObjectURL(url);
  };

  return<>
   <Sect title="Architecture des données" sub="Structure du stockage client">
    <Card style={{padding:16}}>
     <div style={{fontFamily:"monospace",fontSize:10,color:C.td,lineHeight:1.8}}>
      {["scCpState (localStorage)",
       "├── client: { company, siret, tva, address, email, ... }",
       "├── contacts: [ { id, name, email, phone, status, ... } ]",
       "├── finances: { 'YYYY-MM': { ca, charges, chargesFixes, ... } }",
       "├── deals: [ { id, name, stage, value, ... } ]",
       "├── ads: { 'YYYY-MM': { spend, impressions, clicks, ... } }",
       "├── events: [ { id, title, date, type, ... } ]",
       "├── tasks: [ { id, title, done, deadline, ... } ]",
       "├── onboarding: { step, company, tools, apis, sources }",
       "├── billing: { plan, cycle, paid, stripeSessionId }",
       "├── settings: { users, integrations, ... }",
       "├── health: { score, items, tests }",
       "├── backups: [ { id, date, data } ]",
       "└── cleaningRules: [ { id, name, rule, ... } ]",
      ].map((l,i)=><div key={i}>{l}</div>)}
     </div>
    </Card>
   </Sect>
   <Sect title="Export / Import">
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
     <Btn onClick={doExport}>📤 Exporter (JSON)</Btn>
     <label style={{display:"inline-flex"}}>
      <input type="file" accept=".json" onChange={e=>{
       const file=e.target.files?.[0];if(!file)return;
       const reader=new FileReader();
       reader.onload=(ev)=>{try{const d=JSON.parse(ev.target.result);if(d.data){setData({...data,...d.data});sv(SK,{...data,...d.data});alert("Import réussi !");}else alert("Format invalide");}catch{alert("Erreur JSON");}};
       reader.readAsText(file);
      }} style={{display:"none"}}/>
      <span style={{padding:"8px 14px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.card,color:C.t,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>📥 Importer</span>
     </label>
     <Btn v="secondary" onClick={()=>{
      const csv=["Type,Nom,Email,Statut,Date"].concat((data.contacts||[]).map(c=>`Contact,${c.name},${c.email},${c.status},${c.createdAt}`)).join("\n");
      const blob=new Blob([csv],{type:"text/csv"});const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download="contacts-export.csv";a.click();URL.revokeObjectURL(url);
     }}>📊 Export contacts (CSV)</Btn>
    </div>
   </Sect>
  </>;
 };

 /* ====== RGPD & LÉGAL ====== */
 const LegalTab=()=><>
  <Sect title="RGPD — Données personnelles">
   <Card style={{padding:16}}>
    <div style={{fontSize:11,color:C.td,lineHeight:1.7}}>
     <b style={{color:C.t}}>Conformité RGPD (Règlement Général sur la Protection des Données)</b><br/><br/>
     Conformément aux articles 15 à 20 du RGPD, vous disposez des droits suivants :<br/><br/>
     <b>• Droit d'accès (Art. 15)</b> — Obtenir une copie de toutes vos données personnelles<br/>
     <b>• Droit de rectification (Art. 16)</b> — Corriger vos données inexactes<br/>
     <b>• Droit à l'effacement (Art. 17)</b> — Demander la suppression de vos données<br/>
     <b>• Droit à la portabilité (Art. 20)</b> — Recevoir vos données dans un format structuré<br/>
     <b>• Droit d'opposition (Art. 21)</b> — S'opposer au traitement de vos données<br/><br/>
     Pour exercer ces droits, contactez notre DPO :
    </div>
    <Inp label="Contact DPO" value={settings.gdprContact||""} onChange={v=>uSet("gdprContact",v)} placeholder="dpo@plateforme.com"/>
    <div style={{display:"flex",gap:8,marginTop:12}}>
     <Btn small v="secondary" onClick={()=>alert("Demande d'accès aux données enregistrée.")}>Demander mes données</Btn>
     <Btn small v="secondary" onClick={()=>alert("Demande de suppression enregistrée. Traitement sous 30 jours.")}>Demander la suppression</Btn>
    </div>
   </Card>
  </Sect>
  <Sect title="Mentions légales">
   <Card style={{padding:16}}>
    <div style={{fontSize:11,color:C.td,lineHeight:1.7}}>
     <b style={{color:C.t}}>Éditeur de la plateforme</b><br/>
     [Nom de la société éditrice] — [Forme juridique]<br/>
     Siège social : [Adresse complète]<br/>
     SIRET : [Numéro SIRET]<br/>
     RCS : [Numéro RCS]<br/>
     Directeur de publication : [Nom]<br/>
     Contact : [Email]<br/><br/>
     <b style={{color:C.t}}>Hébergement</b><br/>
     Vercel Inc. / Netlify / [Hébergeur]<br/>
     Données stockées en Union Européenne<br/><br/>
     <b style={{color:C.t}}>Base de données</b><br/>
     Supabase (PostgreSQL) — Données chiffrées au repos et en transit<br/>
     Localisation : EU-West (Francfort)
    </div>
   </Card>
  </Sect>
  <Sect title="Politique de confidentialité">
   <Card style={{padding:16}}>
    <div style={{fontSize:11,color:C.td,lineHeight:1.7}}>
     <b style={{color:C.t}}>Données collectées</b><br/>
     • Données d'identification : nom, email, téléphone, adresse<br/>
     • Données financières : CA, charges, trésorerie (saisie manuelle ou API)<br/>
     • Données commerciales : contacts CRM, pipeline, deals<br/>
     • Données publicitaires : dépenses, impressions, conversions<br/>
     • Données de connexion : logs d'accès, IP, user-agent<br/><br/>
     <b style={{color:C.t}}>Durée de conservation</b><br/>
     • Données actives : durée de l'abonnement + 1 an<br/>
     • Données de facturation : 10 ans (obligation légale)<br/>
     • Logs de connexion : 12 mois<br/>
     • Après suppression de compte : 30 jours maximum<br/><br/>
     <b style={{color:C.t}}>Sous-traitants</b><br/>
     • Stripe (paiements) — Certifié PCI-DSS Level 1<br/>
     • Supabase (base de données) — SOC2 Type II<br/>
     • Vercel (hébergement) — ISO 27001<br/><br/>
     <b style={{color:C.t}}>Cookies</b><br/>
     Seuls les cookies strictement nécessaires au fonctionnement sont utilisés (authentification, préférences). Aucun cookie tiers de tracking.
    </div>
   </Card>
  </Sect>
 </>;

 return<>
  <div style={{fontWeight:900,fontSize:20,fontFamily:FONT_TITLE,marginBottom:4}}>Paramètres</div>
  <div style={{fontSize:11,color:C.td,marginBottom:16}}>Administration du compte, utilisateurs, intégrations et conformité</div>

  <div style={{display:"flex",gap:3,marginBottom:20,overflowX:"auto",borderBottom:`1px solid ${C.brd}`,paddingBottom:6}}>
   {SETTING_TABS.map(t=>{const a=sub===t.id;
    return<button key={t.id} onClick={()=>setSub(t.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:"none",background:a?C.acc+"18":"transparent",color:a?C.t:C.td,fontSize:10,fontWeight:a?700:500,cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap",flexShrink:0,borderBottom:a?`2px solid ${C.acc}`:"2px solid transparent"}}>
     <span style={{fontSize:12}}>{t.icon}</span>{t.label}
    </button>;
   })}
  </div>

  {sub===0&&<AccountTab/>}
  {sub===1&&<UsersTab/>}
  {sub===2&&<BillingTab/>}
  {sub===3&&<IntegrationsTab/>}
  {sub===4&&<DataExportTab/>}
  {sub===5&&<LegalTab/>}
 </>;
}
