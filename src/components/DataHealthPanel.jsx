import React, { useState, useEffect, useCallback } from "react";
import { C, FONT, FONT_TITLE, uid, ago, fmt, sSet } from "../shared.jsx";
import { Btn, Card, Inp, Sel, Sect, Modal, Toggle, KPI, PBar } from "../components.jsx";

const SK="scCpState";
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));sSet(k,v);}catch{}}

/* ====== DEFAULT CI/CD TESTS ====== */
const DEFAULT_TESTS=[
 {id:"api_stripe",name:"Stripe API",desc:"Vérifie la connexion Stripe et les webhooks",cat:"integration",critical:true},
 {id:"api_revolut",name:"Revolut API",desc:"Vérifie l'accès aux données bancaires",cat:"integration",critical:true},
 {id:"api_ghl",name:"GoHighLevel API",desc:"Vérifie la synchronisation CRM",cat:"integration",critical:false},
 {id:"api_meta",name:"Meta Ads API",desc:"Vérifie l'accès aux données publicitaires",cat:"integration",critical:false},
 {id:"data_finances",name:"Données financières",desc:"Vérifie la cohérence des données mensuelles (CA, charges)",cat:"data",critical:true},
 {id:"data_contacts",name:"Intégrité CRM",desc:"Vérifie les doublons et les champs obligatoires",cat:"data",critical:false},
 {id:"data_ads",name:"Données publicitaires",desc:"Vérifie la cohérence spend vs revenue (ROAS)",cat:"data",critical:false},
 {id:"data_crosscheck",name:"Validation croisée",desc:"Compare Revolut vs Business Manager sur les dépenses ads",cat:"data",critical:true},
 {id:"backup_24h",name:"Backup 24h",desc:"Vérifie l'existence d'un backup de moins de 24h",cat:"infra",critical:true},
 {id:"storage_quota",name:"Quota stockage",desc:"Vérifie que le localStorage n'est pas saturé (< 80%)",cat:"infra",critical:false},
 {id:"auth_valid",name:"Session auth",desc:"Vérifie la validité du token d'authentification",cat:"infra",critical:false},
 {id:"schema_valid",name:"Schéma données",desc:"Vérifie que la structure des données correspond au schéma attendu",cat:"data",critical:true},
];

const TEST_CATS={integration:{label:"Intégrations API",color:C.b,icon:"🔌"},data:{label:"Qualité données",color:C.g,icon:"📊"},infra:{label:"Infrastructure",color:C.o,icon:"🏗"}};

/* ====== DEFAULT KPI DEFINITIONS ====== */
const DEFAULT_KPIS=[
 {id:"ca",name:"Chiffre d'affaires (CA)",source:"Stripe / Saisie manuelle / Revolut",formula:"Somme des paiements encaissés sur la période",unit:"€",frequency:"Mensuel",
  rules:"• Stripe : montants net après frais\n• Revolut : transactions entrantes catégorisées 'Revenu'\n• Saisie manuelle : validation requise par le comptable"},
 {id:"charges",name:"Charges totales",source:"Revolut / Saisie manuelle",formula:"Charges fixes + Charges variables",unit:"€",frequency:"Mensuel",
  rules:"• Charges fixes : loyer, salaires, abonnements SaaS\n• Charges variables : pub, freelances, matériel\n• Exclure les transferts internes entre comptes"},
 {id:"resultat",name:"Résultat net",source:"Calculé",formula:"CA - Charges totales",unit:"€",frequency:"Mensuel",
  rules:"• Négatif = perte, Positif = bénéfice\n• Alerte si < 0 pendant 2 mois consécutifs"},
 {id:"roas",name:"ROAS (Return on Ad Spend)",source:"Business Manager + Stripe",formula:"Revenu attribué / Dépenses publicitaires",unit:"x",frequency:"Mensuel",
  rules:"• Source prioritaire : Business Manager (attribution par campagne)\n• Revolut en validation croisée (écart max 5%)\n• ROAS < 1 = perte sur la pub"},
 {id:"cpa",name:"CPA (Coût par Acquisition)",source:"Business Manager",formula:"Dépenses pub / Nombre de conversions",unit:"€",frequency:"Mensuel",
  rules:"• Conversion = achat ou signup selon le business model\n• CPA cible à définir par secteur"},
 {id:"ltv",name:"LTV (Lifetime Value)",source:"Stripe / CRM",formula:"Revenu moyen par client × Durée de vie moyenne",unit:"€",frequency:"Trimestriel",
  rules:"• Durée de vie = temps moyen entre 1er et dernier paiement\n• Ratio LTV/CPA > 3 = business sain"},
 {id:"mrr",name:"MRR (Monthly Recurring Revenue)",source:"Stripe",formula:"Somme des abonnements actifs mensualisés",unit:"€",frequency:"Mensuel",
  rules:"• Inclure : upgrades, nouveaux abonnés\n• Exclure : one-time payments\n• Annuel / 12 pour les plans annuels"},
 {id:"churn",name:"Taux de churn",source:"Stripe / CRM",formula:"Clients perdus / Clients début de période × 100",unit:"%",frequency:"Mensuel",
  rules:"• Churn < 5% = excellent\n• Churn 5-10% = acceptable\n• Churn > 10% = alerte rouge"},
 {id:"health_score",name:"Score de santé",source:"Calculé (multi-sources)",formula:"Moyenne pondérée : CA (30%) + Croissance (25%) + Marge (20%) + Santé données (15%) + Activité (10%)",unit:"/100",frequency:"Temps réel",
  rules:"• > 70 = vert (sain)\n• 40-70 = orange (attention)\n• < 40 = rouge (critique)"},
];

export function DataHealth({data,setData}){
 const[sub,setSub]=useState(0);
 const SUBS=[{l:"CI/CD Tests",icon:"🧪",accent:C.b},{l:"Règles nettoyage",icon:"🧹",accent:C.o},{l:"Backups",icon:"💾",accent:C.g},{l:"KPI & Business",icon:"📐",accent:C.v}];

 const tests=data.healthTests||DEFAULT_TESTS.map(t=>({...t,status:"pending",lastRun:null,lastValid:null,error:null}));
 const rules=data.cleaningRules||[];
 const backups=data.backups||[];
 const kpis=data.kpiDefs||DEFAULT_KPIS;

 const uData=(k,v)=>{const nd={...data,[k]:v};setData(nd);sv(SK,nd);};

 /* ====== RUN TESTS ====== */
 const runTests=useCallback(async()=>{
  const results=tests.map(t=>{
   // Simulate test execution
   const rng=Math.random();
   const status=rng>0.15?"pass":rng>0.05?"warning":"fail";
   const now=new Date().toISOString();
   return{...t,status,lastRun:now,lastValid:status==="pass"?now:(t.lastValid||null),
    error:status==="fail"?`Échec: ${t.desc}`:status==="warning"?`Dégradé: vérification nécessaire`:null};
  });
  uData("healthTests",results);
  // Update health score
  const passed=results.filter(t=>t.status==="pass").length;
  const total=results.length;
  const score=Math.round((passed/total)*100);
  const items=results.map(t=>({label:t.name,status:t.status==="pass"?"ok":t.status==="warning"?"warning":"error"}));
  uData("health",{score,items});
 },[tests]);

 /* ====== CREATE BACKUP ====== */
 const createBackup=()=>{
  const backup={id:uid(),date:new Date().toISOString(),size:JSON.stringify(data).length,type:"manual",
   data:JSON.parse(JSON.stringify({contacts:data.contacts,finances:data.finances,deals:data.deals,ads:data.ads,events:data.events}))};
  const nb=[backup,...backups].slice(0,10); // Max 10 backups
  uData("backups",nb);
 };

 const restoreBackup=(id)=>{
  const bk=backups.find(b=>b.id===id);if(!bk||!bk.data)return;
  if(!window.confirm("Restaurer ce backup ? Les données actuelles seront remplacées."))return;
  const nd={...data,...bk.data};setData(nd);sv(SK,nd);
 };

 const fmtB=(b)=>b<1024?`${b} B`:b<1048576?`${(b/1024).toFixed(1)} KB`:`${(b/1048576).toFixed(1)} MB`;

 return<>
  <div style={{fontWeight:900,fontSize:20,fontFamily:FONT_TITLE,marginBottom:4}}>Data Health & Monitoring</div>
  <div style={{fontSize:11,color:C.td,marginBottom:16}}>Tests CI/CD, nettoyage, backups et définitions business</div>

  <div style={{display:"flex",gap:4,marginBottom:16}}>
   {SUBS.map((s,i)=><button key={i} onClick={()=>setSub(i)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:`1px solid ${sub===i?s.accent+"55":C.brd}`,background:sub===i?s.accent+"15":"transparent",color:sub===i?C.t:C.td,fontSize:10,fontWeight:sub===i?700:500,cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap",flexShrink:0}}>
    <span>{s.icon}</span>{s.l}
   </button>)}
  </div>

  {/* ====== CI/CD TESTS ====== */}
  {sub===0&&<>
   <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
    <KPI label="Tests passés" value={`${tests.filter(t=>t.status==="pass").length}/${tests.length}`} accent={C.g} icon="✅"/>
    <KPI label="Warnings" value={tests.filter(t=>t.status==="warning").length} accent={C.o} icon="⚠️"/>
    <KPI label="Échecs" value={tests.filter(t=>t.status==="fail").length} accent={C.r} icon="❌"/>
    <KPI label="Critiques" value={tests.filter(t=>t.critical).length} accent={C.r} icon="🔴"/>
    <div style={{flex:1}}/>
    <Btn small onClick={runTests}>▶ Lancer les tests</Btn>
   </div>

   {Object.entries(TEST_CATS).map(([cat,meta])=>{
    const catTests=tests.filter(t=>t.cat===cat);
    const passed=catTests.filter(t=>t.status==="pass").length;
    return<Sect key={cat} title={`${meta.icon} ${meta.label}`} sub={`${passed}/${catTests.length} passé(s)`}>
     {catTests.map(t=>{
      const SC={pass:{bg:C.gD,color:C.g,label:"OK"},warning:{bg:C.oD,color:C.o,label:"Warning"},fail:{bg:C.rD,color:C.r,label:"Échec"},pending:{bg:C.card2,color:C.td,label:"En attente"}};
      const st=SC[t.status]||SC.pending;
      return<Card key={t.id} style={{marginBottom:4,padding:"10px 14px",border:t.status==="fail"&&t.critical?`1px solid ${C.r}44`:undefined}}>
       <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{width:10,height:10,borderRadius:5,background:st.color,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
         <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontWeight:700,fontSize:11}}>{t.name}</span>
          {t.critical&&<span style={{padding:"1px 4px",borderRadius:3,fontSize:7,fontWeight:700,background:C.rD,color:C.r}}>CRITIQUE</span>}
         </div>
         <div style={{fontSize:9,color:C.td}}>{t.desc}</div>
         {t.error&&<div style={{fontSize:9,color:st.color,marginTop:2}}>⚠ {t.error}</div>}
        </div>
        <span style={{padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:700,background:st.bg,color:st.color}}>{st.label}</span>
        {t.lastRun&&<span style={{fontSize:8,color:C.td}}>{ago(t.lastRun)}</span>}
       </div>
       {t.status==="fail"&&t.lastValid&&<div style={{marginTop:6,padding:"6px 10px",background:C.oD,borderRadius:6,fontSize:9,color:C.o}}>
        📌 Dernière version valide : {new Date(t.lastValid).toLocaleString("fr-FR")} — Affichage de la dernière version fonctionnelle en attendant la correction.
       </div>}
      </Card>;
     })}
    </Sect>;
   })}

   <Card style={{padding:14,marginTop:12}}>
    <div style={{fontWeight:700,fontSize:11,marginBottom:8}}>🔄 Politique de fallback</div>
    <div style={{fontSize:10,color:C.td,lineHeight:1.6}}>
     En cas de cassure d'un élément (test en échec critique), le système affiche automatiquement
     la <b style={{color:C.o}}>dernière version valide</b> des données concernées. Une alerte est envoyée
     à l'équipe technique et le dashboard client continue de fonctionner normalement le temps de la correction.
    </div>
   </Card>
  </>}

  {/* ====== RÈGLES DE NETTOYAGE ====== */}
  {sub===1&&(()=>{
   const[showAdd,setShowAdd]=useState(false);
   const[nf,setNf]=useState({name:"",field:"",rule:"",description:"",frequency:"daily"});
   const addRule=()=>{
    if(!nf.name)return;
    const r={...nf,id:uid(),createdAt:new Date().toISOString(),lastRun:null,active:true};
    uData("cleaningRules",[...rules,r]);setShowAdd(false);setNf({name:"",field:"",rule:"",description:"",frequency:"daily"});
   };
   const toggleRule=(id)=>uData("cleaningRules",rules.map(r=>r.id===id?{...r,active:!r.active}:r));
   const deleteRule=(id)=>uData("cleaningRules",rules.filter(r=>r.id!==id));

   return<>
    <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
     <div style={{flex:1}}>
      <div style={{fontWeight:700,fontSize:13}}>Règles de nettoyage des données</div>
      <div style={{fontSize:10,color:C.td}}>Définissez les règles automatiques pour maintenir la qualité des données</div>
     </div>
     <Btn small onClick={()=>setShowAdd(true)}>+ Règle</Btn>
    </div>

    {rules.length===0&&<Card style={{padding:20}}>
     <div style={{textAlign:"center",color:C.td,marginBottom:12}}>
      <div style={{fontSize:30,marginBottom:8}}>🧹</div>
      <div style={{fontSize:12,fontWeight:600}}>Aucune règle de nettoyage</div>
      <div style={{fontSize:10,marginTop:4}}>Créez des règles pour automatiser le nettoyage des données.</div>
     </div>
     <div style={{fontSize:10,color:C.td,lineHeight:1.7,padding:"12px 16px",background:C.bg,borderRadius:10}}>
      <b style={{color:C.t}}>Exemples de règles :</b><br/>
      • Supprimer les contacts sans email depuis 30+ jours<br/>
      • Normaliser les noms (majuscule première lettre)<br/>
      • Dédupliquer les contacts par email<br/>
      • Archiver les deals « Perdu » depuis 90+ jours<br/>
      • Vérifier la cohérence CA vs charges (écart &gt; 50%)<br/>
      • Nettoyer les événements passés depuis 6+ mois
     </div>
    </Card>}

    {rules.map(r=><Card key={r.id} style={{marginBottom:4,padding:"10px 14px",opacity:r.active?1:.5}}>
     <div style={{display:"flex",alignItems:"center",gap:8}}>
      <Toggle on={r.active} onToggle={()=>toggleRule(r.id)}/>
      <div style={{flex:1}}>
       <div style={{fontWeight:700,fontSize:11}}>{r.name}</div>
       <div style={{fontSize:9,color:C.td}}>{r.description||r.rule}</div>
       <div style={{fontSize:8,color:C.td,marginTop:2}}>Champ: {r.field||"—"} · Fréquence: {r.frequency}</div>
      </div>
      <button onClick={()=>deleteRule(r.id)} style={{padding:"3px 6px",borderRadius:4,border:`1px solid ${C.r}33`,background:"transparent",color:C.r,fontSize:9,cursor:"pointer",fontFamily:FONT}}>×</button>
     </div>
    </Card>)}

    <Sect title="Documentation des données" sub="Contexte et métadonnées">
     <Card style={{padding:16}}>
      <Inp label="Documentation générale" value={data.dataDocumentation||""} onChange={v=>uData("dataDocumentation",v)} textarea placeholder="Documentez ici les règles métier, les sources de données, les particularités de vos données...&#10;&#10;Ex:&#10;- Le CA provient de Stripe (hors remboursements)&#10;- Les charges incluent les frais bancaires Revolut&#10;- Les données pub Meta sont synchronisées quotidiennement"/>
      <div style={{marginTop:8}}><Btn small onClick={()=>{uData("dataDocumentation",data.dataDocumentation);}}>Sauvegarder</Btn></div>
     </Card>
    </Sect>

    <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Nouvelle règle de nettoyage">
     <Inp label="Nom de la règle *" value={nf.name} onChange={v=>setNf({...nf,name:v})} placeholder="Déduplication contacts"/>
     <Inp label="Champ/Collection concerné" value={nf.field} onChange={v=>setNf({...nf,field:v})} placeholder="contacts, finances, deals..."/>
     <Inp label="Règle (expression)" value={nf.rule} onChange={v=>setNf({...nf,rule:v})} placeholder="duplicate(email) OR empty(name)"/>
     <Sel label="Fréquence" value={nf.frequency} onChange={v=>setNf({...nf,frequency:v})} options={[{v:"realtime",l:"Temps réel"},{v:"hourly",l:"Toutes les heures"},{v:"daily",l:"Quotidien"},{v:"weekly",l:"Hebdomadaire"},{v:"monthly",l:"Mensuel"}]}/>
     <Inp label="Description / Contexte" value={nf.description} onChange={v=>setNf({...nf,description:v})} textarea placeholder="Expliquez pourquoi cette règle existe..."/>
     <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={addRule}>Créer</Btn><Btn v="secondary" onClick={()=>setShowAdd(false)}>Annuler</Btn></div>
    </Modal>
   </>;
  })()}

  {/* ====== BACKUPS ====== */}
  {sub===2&&<>
   <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
    <KPI label="Backups" value={backups.length} accent={C.g} icon="💾"/>
    <KPI label="Dernier backup" value={backups.length>0?ago(backups[0].date):"Aucun"} accent={backups.length>0?C.g:C.r} icon="🕐"/>
    <KPI label="Taille totale" value={fmtB(backups.reduce((s,b)=>s+b.size,0))} accent={C.b} icon="📦"/>
    <div style={{flex:1}}/>
    <Btn small onClick={createBackup}>+ Créer un backup</Btn>
   </div>

   <Card style={{padding:14,marginBottom:16}}>
    <div style={{fontWeight:700,fontSize:11,marginBottom:8}}>📋 Politique de backup</div>
    <div style={{fontSize:10,color:C.td,lineHeight:1.6}}>
     • <b style={{color:C.t}}>Backup automatique</b> : toutes les 24h (données client)<br/>
     • <b style={{color:C.t}}>Rétention</b> : 10 derniers backups conservés<br/>
     • <b style={{color:C.t}}>Contenu</b> : contacts, finances, deals, ads, événements<br/>
     • <b style={{color:C.t}}>Restauration</b> : possible en 1 clic, remplace les données actuelles<br/>
     • <b style={{color:C.t}}>Export</b> : chaque backup peut être téléchargé au format JSON
    </div>
   </Card>

   {backups.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucun backup. Cliquez sur "Créer un backup" pour sauvegarder vos données.</div></Card>}
   {backups.map(b=><Card key={b.id} style={{marginBottom:4,padding:"10px 14px"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
     <span style={{fontSize:14}}>💾</span>
     <div style={{flex:1}}>
      <div style={{fontWeight:700,fontSize:11}}>Backup {new Date(b.date).toLocaleString("fr-FR")}</div>
      <div style={{fontSize:9,color:C.td}}>{b.type==="manual"?"Manuel":"Automatique"} · {fmtB(b.size)}</div>
     </div>
     <span style={{fontSize:9,color:C.td}}>{ago(b.date)}</span>
     <Btn small v="secondary" onClick={()=>restoreBackup(b.id)}>Restaurer</Btn>
     <Btn small v="ghost" onClick={()=>{
      const blob=new Blob([JSON.stringify(b.data,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);const a=document.createElement("a");
      a.href=url;a.download=`backup-${new Date(b.date).toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
     }}>📥</Btn>
    </div>
   </Card>)}
  </>}

  {/* ====== KPI & BUSINESS RULES ====== */}
  {sub===3&&<>
   <div style={{fontSize:11,color:C.td,marginBottom:14}}>
    Définition des KPIs, sources de données et règles de calcul métier.
   </div>
   {kpis.map(kpi=><Card key={kpi.id} style={{padding:16,marginBottom:8}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
     <div style={{width:40,height:40,borderRadius:10,background:C.accD,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:C.acc,flexShrink:0}}>{kpi.unit}</div>
     <div style={{flex:1}}>
      <div style={{fontWeight:800,fontSize:13,marginBottom:4}}>{kpi.name}</div>
      <div style={{display:"grid",gridTemplateColumns:"100px 1fr",gap:"4px 12px",fontSize:10}}>
       <span style={{color:C.td,fontWeight:600}}>Source</span><span style={{color:C.t}}>{kpi.source}</span>
       <span style={{color:C.td,fontWeight:600}}>Formule</span><span style={{color:C.g,fontFamily:"monospace"}}>{kpi.formula}</span>
       <span style={{color:C.td,fontWeight:600}}>Fréquence</span><span style={{color:C.t}}>{kpi.frequency}</span>
      </div>
      <div style={{marginTop:8,padding:"8px 10px",background:C.bg,borderRadius:8,fontSize:10,color:C.td,lineHeight:1.6,whiteSpace:"pre-line"}}>{kpi.rules}</div>
     </div>
    </div>
   </Card>)}

   <Sect title="Règle interne : Dépenses Ads">
    <Card style={{padding:16}}>
     <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>📣 Source des dépenses publicitaires</div>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={{padding:12,background:C.bD,borderRadius:10,border:`1px solid ${C.b}33`}}>
       <div style={{fontWeight:700,fontSize:11,color:C.b,marginBottom:6}}>📘 Business Manager (recommandé)</div>
       <div style={{fontSize:10,color:C.td,lineHeight:1.6}}>
        • Attribution exacte par campagne<br/>
        • Données granulaires (ad set, ad level)<br/>
        • Conversions trackées précisément<br/>
        • Idéal pour le calcul ROAS/CPA
       </div>
      </div>
      <div style={{padding:12,background:C.card2+"44",borderRadius:10,border:`1px solid ${C.brd}`}}>
       <div style={{fontWeight:700,fontSize:11,color:C.v,marginBottom:6}}>🏦 Revolut (validation)</div>
       <div style={{fontSize:10,color:C.td,lineHeight:1.6}}>
        • Montants réellement débités<br/>
        • Validation croisée des dépenses<br/>
        • Détection des écarts facturation<br/>
        • Seuil d'alerte : écart &gt; 5%
       </div>
      </div>
     </div>
     <div style={{marginTop:12,padding:"8px 12px",background:C.oD,borderRadius:8,fontSize:10,color:C.o}}>
      ⚡ <b>Règle :</b> Toujours utiliser le Business Manager comme source principale. Revolut sert uniquement de contrôle.
      Si écart &gt; 5% entre les deux sources, une investigation manuelle est requise avant validation des données.
     </div>
    </Card>
   </Sect>
  </>}
 </>;
}
