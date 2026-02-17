import React, { useState } from "react";
import { C, FONT, FONT_TITLE, uid, sSet } from "../shared.jsx";
import { Btn, Card, Inp, Sel, Sect, Modal, Toggle, KPI, PBar } from "../components.jsx";

const SK="scCpState";
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));sSet(k,v);}catch{}}

const STEPS=[
 {id:0,title:"Informations entreprise",icon:"🏢",desc:"Renseignez les informations de votre société"},
 {id:1,title:"Outils & Logiciels",icon:"🔧",desc:"Sélectionnez les outils que vous utilisez"},
 {id:2,title:"Clés API & Tokens",icon:"🔑",desc:"Configurez vos intégrations API"},
 {id:3,title:"Sources de données",icon:"📊",desc:"Définissez vos sources de données"},
 {id:4,title:"Tutoriel plateforme",icon:"🎓",desc:"Découvrez la plateforme étape par étape"},
];

const TOOLS=[
 {id:"meta_ads",name:"Meta Ads (Facebook/Instagram)",cat:"pub",icon:"📘",docUrl:"https://developers.facebook.com/docs/marketing-apis/"},
 {id:"google_ads",name:"Google Ads",cat:"pub",icon:"🔍",docUrl:"https://developers.google.com/google-ads/api/docs/start"},
 {id:"tiktok_ads",name:"TikTok Ads",cat:"pub",icon:"🎵",docUrl:"https://business-api.tiktok.com/portal/docs"},
 {id:"ghl",name:"GoHighLevel CRM",cat:"crm",icon:"📡",docUrl:"https://highlevel.stoplight.io/docs/integrations"},
 {id:"hubspot",name:"HubSpot",cat:"crm",icon:"🟠",docUrl:"https://developers.hubspot.com/docs/api/overview"},
 {id:"stripe",name:"Stripe Payments",cat:"payment",icon:"💳",docUrl:"https://stripe.com/docs/api"},
 {id:"revolut",name:"Revolut Business",cat:"bank",icon:"🏦",docUrl:"https://developer.revolut.com/docs/business/"},
 {id:"qonto",name:"Qonto",cat:"bank",icon:"🏛",docUrl:"https://api-doc.qonto.com/"},
 {id:"slack",name:"Slack",cat:"comm",icon:"💬",docUrl:"https://api.slack.com/docs"},
 {id:"zapier",name:"Zapier",cat:"auto",icon:"⚡",docUrl:"https://platform.zapier.com/docs/"},
 {id:"make",name:"Make (Integromat)",cat:"auto",icon:"🔄",docUrl:"https://www.make.com/en/api-documentation"},
 {id:"ga4",name:"Google Analytics 4",cat:"analytics",icon:"📈",docUrl:"https://developers.google.com/analytics/devguides/reporting/data/v1"},
 {id:"shopify",name:"Shopify",cat:"ecommerce",icon:"🛒",docUrl:"https://shopify.dev/docs/api"},
 {id:"woocommerce",name:"WooCommerce",cat:"ecommerce",icon:"🛍",docUrl:"https://woocommerce.github.io/woocommerce-rest-api-docs/"},
];

const TOOL_CATS={pub:"Publicité",crm:"CRM",payment:"Paiement",bank:"Banque",comm:"Communication",auto:"Automatisation",analytics:"Analytics",ecommerce:"E-commerce"};

const TUTO_STEPS=[
 {title:"Dashboard Overview",desc:"Votre tableau de bord affiche en temps réel les KPIs principaux : CA, charges, résultat net, score de santé. Les alertes actives apparaissent en haut.",icon:"📊"},
 {title:"CRM — Gestion des contacts",desc:"Ajoutez et gérez vos contacts commerciaux. Chaque contact passe par les étapes : Prospect → Lead → Client. Filtrez et recherchez facilement.",icon:"👥"},
 {title:"Data — Finances",desc:"Saisissez vos données financières mensuelles. Le CA, les charges fixes/variables et la trésorerie sont suivis mois par mois avec historique.",icon:"💰"},
 {title:"Data — Sales Pipeline",desc:"Visualisez votre pipeline commercial en mode Kanban. Déplacez vos deals entre les étapes et suivez la valeur totale du pipeline.",icon:"📞"},
 {title:"Data — Publicité",desc:"Trackez vos dépenses pub et calculez automatiquement CTR, CPC, ROAS et CPA. Source recommandée : Business Manager pour la précision.",icon:"📣"},
 {title:"Agenda",desc:"Planifiez vos réunions, deadlines et tâches. Tous les événements sont affichés chronologiquement avec des rappels.",icon:"📅"},
 {title:"Data Health & CI/CD",desc:"Surveillez la santé de vos données en temps réel. Les tests automatiques détectent les cassures et affichent la dernière version valide.",icon:"🔬"},
 {title:"Paramètres",desc:"Configurez votre compte, gérez les utilisateurs, exportez vos données, configurez les intégrations API et les options RGPD.",icon:"⚙️"},
];

export function ClientOnboarding({data,setData,client,setClient,onComplete}){
 const[step,setStep]=useState(data.onboarding?.step||0);
 const[onb,setOnb]=useState(data.onboarding||{step:0,company:{},tools:[],apis:{},sources:{},completed:false});
 const[tutoStep,setTutoStep]=useState(0);

 const saveOnb=(o)=>{
  const no={...onb,...o};setOnb(no);
  const nd={...data,onboarding:no};setData(nd);sv(SK,nd);
 };

 const next=()=>{if(step<STEPS.length-1){const ns=step+1;setStep(ns);saveOnb({step:ns});}};
 const prev=()=>{if(step>0){const ns=step-1;setStep(ns);saveOnb({step:ns});}};
 const finish=()=>{saveOnb({completed:true});onComplete?.();};

 const uCompany=(k,v)=>saveOnb({company:{...onb.company,[k]:v}});
 const toggleTool=(id)=>{
  const tools=onb.tools||[];
  saveOnb({tools:tools.includes(id)?tools.filter(t=>t!==id):[...tools,id]});
 };
 const uApi=(toolId,field,val)=>saveOnb({apis:{...onb.apis,[toolId]:{...(onb.apis?.[toolId]||{}),[field]:val}}});
 const uSource=(k,v)=>saveOnb({sources:{...onb.sources,[k]:v}});

 return<div>
  {/* Progress header */}
  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
   <div style={{flex:1}}>
    <div style={{fontWeight:900,fontSize:20,fontFamily:FONT_TITLE}}>Onboarding</div>
    <div style={{fontSize:11,color:C.td}}>Étape {step+1}/{STEPS.length} — {STEPS[step].title}</div>
   </div>
   <div style={{fontSize:10,color:C.td,fontWeight:600}}>{Math.round(((step+1)/STEPS.length)*100)}%</div>
  </div>

  {/* Progress bar */}
  <div style={{display:"flex",gap:3,marginBottom:24}}>
   {STEPS.map((s,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}} onClick={()=>{setStep(i);saveOnb({step:i});}}>
    <div style={{width:"100%",height:4,borderRadius:2,background:i<=step?C.acc:C.card2,transition:"background .3s"}}/>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
     <span style={{fontSize:12}}>{s.icon}</span>
     <span style={{fontSize:9,color:i<=step?C.t:C.td,fontWeight:i===step?700:400}}>{s.title}</span>
    </div>
   </div>)}
  </div>

  {/* STEP 0: Company info */}
  {step===0&&<>
   <Card style={{padding:20}}>
    <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>🏢 Informations entreprise</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
     <Inp label="Nom de l'entreprise *" value={onb.company?.name||""} onChange={v=>uCompany("name",v)} placeholder="Acme SAS"/>
     <Inp label="Secteur d'activité" value={onb.company?.sector||""} onChange={v=>uCompany("sector",v)} placeholder="SaaS, E-commerce, Agence..."/>
     <Inp label="Site web" value={onb.company?.website||""} onChange={v=>uCompany("website",v)} placeholder="https://acme.com"/>
     <Inp label="Nombre d'employés" value={onb.company?.employees||""} onChange={v=>uCompany("employees",v)} placeholder="1-10, 11-50, 51-200..."/>
     <Inp label="CA annuel estimé (€)" value={onb.company?.revenue||""} onChange={v=>uCompany("revenue",v)} type="number" placeholder="100000"/>
     <Inp label="Date de création" value={onb.company?.founded||""} onChange={v=>uCompany("founded",v)} type="date"/>
     <div style={{gridColumn:"1 / -1"}}><Inp label="Description de l'activité" value={onb.company?.description||""} onChange={v=>uCompany("description",v)} textarea placeholder="Décrivez brièvement votre activité..."/></div>
    </div>
   </Card>
  </>}

  {/* STEP 1: Tools & Software */}
  {step===1&&<>
   <div style={{fontSize:11,color:C.td,marginBottom:14}}>Sélectionnez les outils que vous utilisez. Nous configurerons les intégrations à l'étape suivante.</div>
   {Object.entries(TOOL_CATS).map(([cat,label])=>{
    const catTools=TOOLS.filter(t=>t.cat===cat);
    return<Sect key={cat} title={label} sub={`${catTools.filter(t=>(onb.tools||[]).includes(t.id)).length}/${catTools.length} sélectionné(s)`}>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:6}}>
      {catTools.map(t=>{const sel=(onb.tools||[]).includes(t.id);
       return<Card key={t.id} onClick={()=>toggleTool(t.id)} style={{padding:"10px 12px",cursor:"pointer",border:`1px solid ${sel?C.g+"55":C.brd}`,background:sel?C.gD:"transparent"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
         <span style={{fontSize:16}}>{t.icon}</span>
         <span style={{flex:1,fontSize:11,fontWeight:sel?700:500,color:sel?C.t:C.td}}>{t.name}</span>
         <span style={{width:16,height:16,borderRadius:4,border:`2px solid ${sel?C.g:C.brd}`,background:sel?C.g:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>{sel?"✓":""}</span>
        </div>
       </Card>;
      })}
     </div>
    </Sect>;
   })}
  </>}

  {/* STEP 2: API Keys & Tokens */}
  {step===2&&<>
   <div style={{fontSize:11,color:C.td,marginBottom:14}}>Configurez les clés API et tokens d'authentification pour chaque outil sélectionné.</div>
   {(onb.tools||[]).length===0&&<Card style={{padding:20,textAlign:"center"}}><div style={{color:C.td,fontSize:12}}>Aucun outil sélectionné. Retournez à l'étape précédente.</div></Card>}
   {(onb.tools||[]).map(toolId=>{
    const tool=TOOLS.find(t=>t.id===toolId);if(!tool)return null;
    const apiData=onb.apis?.[toolId]||{};
    return<Card key={toolId} style={{padding:16,marginBottom:10}}>
     <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
      <span style={{fontSize:18}}>{tool.icon}</span>
      <div style={{flex:1}}>
       <div style={{fontWeight:700,fontSize:12}}>{tool.name}</div>
       <div style={{fontSize:9,color:C.td}}>Catégorie: {TOOL_CATS[tool.cat]}</div>
      </div>
      <a href={tool.docUrl} target="_blank" rel="noopener noreferrer" style={{padding:"4px 8px",borderRadius:6,background:C.bD,color:C.b,fontSize:9,fontWeight:600,textDecoration:"none"}}>📖 Documentation API</a>
     </div>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <Inp label="API Key / Client ID" value={apiData.apiKey||""} onChange={v=>uApi(toolId,"apiKey",v)} placeholder="sk_live_..." type="password"/>
      <Inp label="Secret / Token" value={apiData.secret||""} onChange={v=>uApi(toolId,"secret",v)} placeholder="whsec_..." type="password"/>
      <Inp label="Account/Location ID" value={apiData.accountId||""} onChange={v=>uApi(toolId,"accountId",v)} placeholder="ID du compte"/>
      <Inp label="Webhook URL (si applicable)" value={apiData.webhookUrl||""} onChange={v=>uApi(toolId,"webhookUrl",v)} placeholder="https://..."/>
     </div>
     <div style={{marginTop:8,padding:"6px 10px",background:C.bg,borderRadius:6,fontSize:9,color:C.td}}>
      💡 Les clés sont stockées de manière sécurisée et chiffrées. Ne partagez jamais vos clés API.
     </div>
    </Card>;
   })}
  </>}

  {/* STEP 3: Data Sources */}
  {step===3&&<>
   <div style={{fontSize:11,color:C.td,marginBottom:14}}>Définissez d'où proviennent vos données pour chaque métrique.</div>
   <Card style={{padding:20,marginBottom:16}}>
    <div style={{fontWeight:700,fontSize:13,marginBottom:14}}>📊 Sources par métrique</div>
    {[{key:"ca",label:"Chiffre d'affaires",options:["Saisie manuelle","Stripe API","Revolut/Qonto","Shopify/WooCommerce","Comptabilité"]},
      {key:"charges",label:"Charges / Dépenses",options:["Saisie manuelle","Revolut/Qonto","Comptabilité","Fichier CSV"]},
      {key:"ads",label:"Données publicitaires",options:["Business Manager (Meta/Google)","Saisie manuelle","API directe","Revolut (validation croisée)"]},
      {key:"contacts",label:"Contacts / CRM",options:["Saisie manuelle","GoHighLevel sync","HubSpot sync","Import CSV"]},
      {key:"sales",label:"Pipeline commercial",options:["Saisie manuelle","GoHighLevel","HubSpot","Stripe"]},
    ].map(s=><div key={s.key} style={{marginBottom:12}}>
     <Sel label={s.label} value={onb.sources?.[s.key]||""} onChange={v=>uSource(s.key,v)} options={[{v:"",l:"Choisir..."},...s.options.map(o=>({v:o,l:o}))]}/>
    </div>)}
   </Card>
   <Card style={{padding:16}}>
    <div style={{fontWeight:700,fontSize:11,marginBottom:8}}>📝 Notes de configuration</div>
    <Inp label="Notes libres (instructions spéciales, particularités...)" value={onb.sources?.notes||""} onChange={v=>uSource("notes",v)} textarea placeholder="Ex: Notre CA est réparti sur 3 entités juridiques..."/>
   </Card>
  </>}

  {/* STEP 4: Tutorial */}
  {step===4&&<>
   <div style={{fontSize:11,color:C.td,marginBottom:14}}>Découvrez les fonctionnalités de la plateforme.</div>
   <div style={{display:"flex",gap:3,marginBottom:16,overflowX:"auto"}}>
    {TUTO_STEPS.map((t,i)=><button key={i} onClick={()=>setTutoStep(i)} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderRadius:8,border:`1px solid ${tutoStep===i?C.acc+"55":C.brd}`,background:tutoStep===i?C.accD:"transparent",color:tutoStep===i?C.acc:C.td,fontSize:9,fontWeight:tutoStep===i?700:500,cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap",flexShrink:0}}>
     <span>{t.icon}</span>{t.title}
    </button>)}
   </div>
   <Card style={{padding:24}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
     <div style={{width:50,height:50,borderRadius:14,background:C.accD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{TUTO_STEPS[tutoStep].icon}</div>
     <div>
      <div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE}}>{TUTO_STEPS[tutoStep].title}</div>
      <div style={{fontSize:10,color:C.td}}>Étape {tutoStep+1}/{TUTO_STEPS.length}</div>
     </div>
    </div>
    <div style={{fontSize:12,color:C.t,lineHeight:1.7,marginBottom:20}}>{TUTO_STEPS[tutoStep].desc}</div>
    <PBar value={tutoStep+1} max={TUTO_STEPS.length} color={C.acc}/>
    <div style={{display:"flex",gap:8,marginTop:16}}>
     {tutoStep>0&&<Btn v="secondary" small onClick={()=>setTutoStep(tutoStep-1)}>← Précédent</Btn>}
     {tutoStep<TUTO_STEPS.length-1&&<Btn small onClick={()=>setTutoStep(tutoStep+1)}>Suivant →</Btn>}
     {tutoStep===TUTO_STEPS.length-1&&<Btn onClick={finish}>✅ Terminer l'onboarding</Btn>}
    </div>
   </Card>
  </>}

  {/* Navigation */}
  {step<4&&<div style={{display:"flex",gap:8,marginTop:20}}>
   {step>0&&<Btn v="secondary" onClick={prev}>← Précédent</Btn>}
   <Btn onClick={next}>Suivant →</Btn>
   <div style={{flex:1}}/>
   <Btn v="ghost" onClick={finish}>Passer l'onboarding</Btn>
  </div>}
 </div>;
}
