import React, { useState } from "react";
import { C, FONT, FONT_TITLE, fmt, uid, sSet } from "../shared.jsx";
import { Btn, Card, Inp, Sel, Sect, Modal, Toggle, KPI } from "../components.jsx";

const _SK="scCpState";
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));sSet(k,v);}catch{}}

const PLANS=[
 {id:"starter",name:"Starter",priceM:99,priceY:79,features:["Dashboard Overview","CRM basique (100 contacts)","Données financières","1 utilisateur","Support email"],color:C.b,icon:"🚀",recommended:false},
 {id:"pro",name:"Professional",priceM:249,priceY:199,features:["Tout Starter +","CRM avancé (illimité)","Sales Pipeline & Pub","Agenda & Data Health","5 utilisateurs","Intégrations API","Support prioritaire"],color:C.acc,icon:"⭐",recommended:true},
 {id:"enterprise",name:"Enterprise",priceM:499,priceY:399,features:["Tout Professional +","CI/CD Data Monitoring","Backup automatique 24h","KPI personnalisés","Utilisateurs illimités","Onboarding dédié","SLA 99.9%","Account manager"],color:C.v,icon:"🏢",recommended:false},
];

export function ClientBilling({data,setData,client,setClient,onSuccess,storageKey}){
 const SK=storageKey||_SK;
 const[billing,setBilling]=useState(data.billing||{cycle:"monthly",plan:"starter"});
 const[step,setStep]=useState(data.billing?.paid?"manage":"plan"); // plan -> info -> payment -> success | error
 const[form,setForm]=useState({
  company:client.company||"",siret:client.siret||"",tva:client.tva||"",
  address:client.address||"",city:client.city||"",zip:client.zip||"",country:client.country||"France",
  email:client.email||"",phone:client.phone||"",contactName:client.contactName||"",
 });
 const[payStatus,setPayStatus]=useState(null); // null | "processing" | "success" | "error"
 const[payError,setPayError]=useState("");
 const[showInvoices,setShowInvoices]=useState(false);

 const invoices=data.invoiceHistory||[];
 const cycle=billing.cycle||"monthly";
 const selectedPlan=PLANS.find(p=>p.id===billing.plan)||PLANS[0];
 const price=cycle==="monthly"?selectedPlan.priceM:selectedPlan.priceY;
 const annualSave=cycle==="annual"?((selectedPlan.priceM-selectedPlan.priceY)*12):0;

 const saveBilling=(b)=>{
  const nb={...billing,...b};setBilling(nb);
  const nd={...data,billing:nb};setData(nd);sv(SK,nd);
 };

 const saveClient=(c)=>{
  const nc={...client,...c,...form};setClient(nc);
 };

 /* Simulate Stripe checkout */
 const processPayment=async()=>{
  setPayStatus("processing");
  try{
   // In production: const session = await fetch('/api/stripe/create-checkout-session', { method:'POST', body:JSON.stringify({plan:billing.plan,cycle,customer:form}) });
   await new Promise(r=>setTimeout(r,2500));
   const success=Math.random()>0.15; // 85% success for demo
   if(success){
    setPayStatus("success");
    const inv={id:uid(),plan:selectedPlan.name,amount:price,cycle,date:new Date().toISOString(),status:"paid",ref:`INV-${Date.now().toString(36).toUpperCase()}`};
    const nd={...data,billing:{...billing,paid:true,paidAt:new Date().toISOString(),stripeSessionId:`cs_demo_${uid()}`},invoiceHistory:[inv,...invoices]};
    setData(nd);sv(SK,nd);saveClient(form);
    setTimeout(()=>onSuccess?.(),3000);
   } else {
    setPayStatus("error");setPayError("Paiement refusé par votre banque. Vérifiez vos informations de carte ou contactez votre établissement bancaire.");
   }
  }catch(e){setPayStatus("error");setPayError(e.message||"Erreur de connexion au serveur de paiement.");}
 };

 /* PLAN SELECTION */
 if(step==="plan") return<>
  <div style={{fontWeight:900,fontSize:20,fontFamily:FONT_TITLE,marginBottom:4}}>Choisissez votre forfait</div>
  <div style={{fontSize:11,color:C.td,marginBottom:16}}>Abonnement récurrent mensuel ou annuel — Paiement sécurisé via Stripe</div>

  <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20}}>
   {["monthly","annual"].map(c=><button key={c} onClick={()=>saveBilling({cycle:c})} style={{
    padding:"8px 20px",borderRadius:10,border:`1px solid ${cycle===c?C.acc+"66":C.brd}`,
    background:cycle===c?C.accD:"transparent",color:cycle===c?C.acc:C.td,
    fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FONT
   }}>{c==="monthly"?"Mensuel":"Annuel"}{c==="annual"&&<span style={{marginLeft:6,padding:"2px 6px",borderRadius:4,background:C.gD,color:C.g,fontSize:8,fontWeight:700}}>-20%</span>}</button>)}
  </div>

  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
   {PLANS.map(p=>{
    const sel=billing.plan===p.id;const pr=cycle==="monthly"?p.priceM:p.priceY;
    return<Card key={p.id} onClick={()=>saveBilling({plan:p.id})} style={{
     padding:20,cursor:"pointer",border:`2px solid ${sel?p.color+"66":C.brd}`,
     background:sel?p.color+"08":"transparent",position:"relative",
    }}>
     {p.recommended&&<div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",padding:"2px 10px",borderRadius:10,background:C.acc,color:"#0a0a0f",fontSize:8,fontWeight:800}}>RECOMMANDÉ</div>}
     <div style={{textAlign:"center",marginBottom:12}}>
      <div style={{fontSize:28,marginBottom:4}}>{p.icon}</div>
      <div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE,color:p.color}}>{p.name}</div>
     </div>
     <div style={{textAlign:"center",marginBottom:12}}>
      <span style={{fontWeight:900,fontSize:28,color:C.t}}>{pr}€</span>
      <span style={{fontSize:10,color:C.td}}>/{cycle==="monthly"?"mois":"mois (facturé annuellement)"}</span>
     </div>
     <div style={{borderTop:`1px solid ${C.brd}`,paddingTop:12}}>
      {p.features.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",fontSize:10,color:C.t}}>
       <span style={{color:C.g,fontSize:10}}>✓</span>{f}
      </div>)}
     </div>
     {sel&&<div style={{marginTop:12,textAlign:"center"}}><span style={{padding:"4px 12px",borderRadius:6,background:p.color+"22",color:p.color,fontSize:10,fontWeight:700}}>Sélectionné</span></div>}
    </Card>;
   })}
  </div>

  {annualSave>0&&<div style={{textAlign:"center",padding:"8px 16px",background:C.gD,borderRadius:10,border:`1px solid ${C.g}33`,marginBottom:16}}>
   <span style={{fontSize:11,color:C.g,fontWeight:600}}>💰 Économisez {fmt(annualSave)}€/an avec le forfait annuel</span>
  </div>}

  <div style={{textAlign:"center"}}><Btn onClick={()=>setStep("info")}>Continuer → Informations entreprise</Btn></div>
 </>;

 /* COMPANY INFO (B2B INVOICING FIELDS) */
 if(step==="info") return<>
  <div style={{fontWeight:900,fontSize:20,fontFamily:FONT_TITLE,marginBottom:4}}>Informations de facturation</div>
  <div style={{fontSize:11,color:C.td,marginBottom:16}}>Informations requises pour la facturation B2B</div>

  <Card style={{padding:20,marginBottom:16}}>
   <div style={{fontWeight:700,fontSize:13,marginBottom:14}}>🏢 Informations entreprise</div>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
    <Inp label="Raison sociale *" value={form.company} onChange={v=>setForm({...form,company:v})} placeholder="Acme SAS"/>
    <Inp label="SIRET *" value={form.siret} onChange={v=>setForm({...form,siret:v})} placeholder="123 456 789 00012"/>
    <Inp label="N° TVA intracommunautaire" value={form.tva} onChange={v=>setForm({...form,tva:v})} placeholder="FR12345678901"/>
    <Inp label="Pays" value={form.country} onChange={v=>setForm({...form,country:v})} placeholder="France"/>
    <div style={{gridColumn:"1 / -1"}}><Inp label="Adresse *" value={form.address} onChange={v=>setForm({...form,address:v})} placeholder="123 rue de la Paix"/></div>
    <Inp label="Ville *" value={form.city} onChange={v=>setForm({...form,city:v})} placeholder="Paris"/>
    <Inp label="Code postal *" value={form.zip} onChange={v=>setForm({...form,zip:v})} placeholder="75001"/>
   </div>
  </Card>

  <Card style={{padding:20,marginBottom:16}}>
   <div style={{fontWeight:700,fontSize:13,marginBottom:14}}>👤 Contact facturation</div>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
    <Inp label="Nom du contact *" value={form.contactName} onChange={v=>setForm({...form,contactName:v})} placeholder="Jean Dupont"/>
    <Inp label="Email de facturation *" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder="compta@acme.com" type="email"/>
    <Inp label="Téléphone" value={form.phone} onChange={v=>setForm({...form,phone:v})} placeholder="+33 1 23 45 67 89"/>
   </div>
  </Card>

  <Card style={{padding:16,marginBottom:20,background:C.card2+"44"}}>
   <div style={{fontWeight:700,fontSize:12,marginBottom:8}}>📦 Récapitulatif</div>
   <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"4px 20px",fontSize:11}}>
    <span style={{color:C.td}}>Forfait</span><span style={{fontWeight:700}}>{selectedPlan.name}</span>
    <span style={{color:C.td}}>Cycle</span><span style={{fontWeight:700}}>{cycle==="monthly"?"Mensuel":"Annuel"}</span>
    <span style={{color:C.td}}>Prix</span><span style={{fontWeight:700,color:C.g}}>{price}€/{cycle==="monthly"?"mois":"mois"}</span>
    {cycle==="annual"&&<><span style={{color:C.td}}>Total annuel</span><span style={{fontWeight:700,color:C.g}}>{price*12}€</span></>}
   </div>
  </Card>

  <div style={{display:"flex",gap:8}}>
   <Btn v="secondary" onClick={()=>setStep("plan")}>← Retour</Btn>
   <Btn onClick={()=>{
    if(!form.company||!form.siret||!form.email||!form.contactName||!form.address||!form.city||!form.zip){alert("Veuillez remplir tous les champs obligatoires (*).");return;}
    setStep("payment");
   }}>Continuer → Paiement</Btn>
  </div>
 </>;

 /* PAYMENT */
 if(step==="payment") return<>
  <div style={{fontWeight:900,fontSize:20,fontFamily:FONT_TITLE,marginBottom:4}}>Paiement sécurisé</div>
  <div style={{fontSize:11,color:C.td,marginBottom:20}}>Paiement hébergé par Stripe — Vos données bancaires ne transitent jamais par nos serveurs</div>

  {payStatus===null&&<>
   <Card style={{padding:24,marginBottom:20,textAlign:"center"}}>
    <div style={{fontSize:40,marginBottom:12}}>🔒</div>
    <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>{selectedPlan.name} — {price}€/{cycle==="monthly"?"mois":"mois"}</div>
    <div style={{fontSize:11,color:C.td,marginBottom:20}}>{form.company} · {form.email}</div>
    <div style={{padding:16,background:C.bg,borderRadius:12,border:`1px solid ${C.brd}`,marginBottom:16}}>
     <div style={{fontWeight:600,fontSize:11,color:C.td,marginBottom:12}}>Stripe Checkout — Zone sécurisée</div>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <div style={{padding:"10px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card,textAlign:"left"}}>
       <div style={{fontSize:9,color:C.td,marginBottom:4}}>Numéro de carte</div>
       <div style={{fontSize:12,color:C.td,fontFamily:"monospace"}}>•••• •••• •••• ••••</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
       <div style={{padding:"10px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card}}>
        <div style={{fontSize:9,color:C.td,marginBottom:4}}>Expiration</div>
        <div style={{fontSize:12,color:C.td}}>MM/AA</div>
       </div>
       <div style={{padding:"10px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card}}>
        <div style={{fontSize:9,color:C.td,marginBottom:4}}>CVC</div>
        <div style={{fontSize:12,color:C.td}}>•••</div>
       </div>
      </div>
     </div>
     <div style={{marginTop:10,fontSize:9,color:C.td}}>💡 En production, cette zone est remplacée par le widget Stripe.js sécurisé (PCI-DSS compliant)</div>
    </div>
    <Btn full onClick={processPayment}>💳 Payer {price}€{cycle==="annual"?"/mois (facturé annuellement)":"/mois"}</Btn>
   </Card>
   <div style={{textAlign:"center"}}><Btn v="secondary" onClick={()=>setStep("info")}>← Retour</Btn></div>
  </>}

  {payStatus==="processing"&&<Card style={{padding:40,textAlign:"center"}}>
   <div style={{fontSize:40,marginBottom:12,animation:"spin 1s linear infinite"}}>⏳</div>
   <div style={{fontWeight:700,fontSize:14}}>Traitement en cours...</div>
   <div style={{fontSize:11,color:C.td,marginTop:4}}>Veuillez ne pas fermer cette page</div>
  </Card>}

  {payStatus==="success"&&<Card style={{padding:40,textAlign:"center",border:`2px solid ${C.g}44`}}>
   <div style={{fontSize:50,marginBottom:12}}>✅</div>
   <div style={{fontWeight:900,fontSize:18,color:C.g,fontFamily:FONT_TITLE}}>Paiement réussi !</div>
   <div style={{fontSize:12,color:C.td,marginTop:8,marginBottom:16}}>
    Votre abonnement <b>{selectedPlan.name}</b> est maintenant actif.<br/>
    Un email de confirmation a été envoyé à <b>{form.email}</b>.
   </div>
   <div style={{padding:"10px 16px",background:C.gD,borderRadius:10,display:"inline-block",marginBottom:16}}>
    <span style={{fontSize:11,color:C.g,fontWeight:600}}>Redirection vers l'espace d'onboarding...</span>
   </div>
  </Card>}

  {payStatus==="error"&&<Card style={{padding:40,textAlign:"center",border:`2px solid ${C.r}44`}}>
   <div style={{fontSize:50,marginBottom:12}}>❌</div>
   <div style={{fontWeight:900,fontSize:18,color:C.r,fontFamily:FONT_TITLE}}>Paiement refusé</div>
   <div style={{fontSize:12,color:C.td,marginTop:8,marginBottom:16,maxWidth:400,margin:"8px auto 16px"}}>
    {payError}
   </div>
   <div style={{display:"flex",gap:8,justifyContent:"center"}}>
    <Btn onClick={()=>{setPayStatus(null);setPayError("");}}>Réessayer</Btn>
    <Btn v="secondary" onClick={()=>setStep("info")}>Modifier les informations</Btn>
   </div>
  </Card>}
 </>;

 /* MANAGE (post-payment) */
 return<>
  <div style={{fontWeight:900,fontSize:20,fontFamily:FONT_TITLE,marginBottom:4}}>Gestion de l'abonnement</div>
  <div style={{fontSize:11,color:C.td,marginBottom:16}}>Gérer votre forfait, cycle de facturation et factures</div>

  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
   <KPI label="Forfait actif" value={selectedPlan.name} accent={selectedPlan.color} icon={selectedPlan.icon}/>
   <KPI label="Prochaine facture" value={`${price}€`} accent={C.g} icon="📅"/>
   <KPI label="Cycle" value={cycle==="monthly"?"Mensuel":"Annuel"} accent={C.b} icon="🔄"/>
  </div>

  <Sect title="Détails de l'abonnement">
   <Card style={{padding:16}}>
    <div style={{display:"grid",gridTemplateColumns:"160px 1fr",gap:"6px 16px",fontSize:11}}>
     {[["Forfait",selectedPlan.name],["Prix",`${price}€/${cycle==="monthly"?"mois":"mois"}`],
       ["Cycle",cycle==="monthly"?"Mensuel":"Annuel"],["Statut","Actif"],
       ["Souscrit le",billing.paidAt?new Date(billing.paidAt).toLocaleDateString("fr-FR"):"—"],
       ["Entreprise",form.company||client.company||"—"],["Email",form.email||client.email||"—"],
     ].map(([k,v])=><React.Fragment key={k}>
      <span style={{color:C.td,fontWeight:600}}>{k}</span><span style={{color:C.t}}>{v}</span>
     </React.Fragment>)}
    </div>
   </Card>
  </Sect>

  <Sect title="Historique des factures" right={<Btn small v="secondary" onClick={()=>setShowInvoices(true)}>Voir tout</Btn>}>
   {invoices.length===0&&<Card><div style={{textAlign:"center",padding:16,color:C.td,fontSize:11}}>Aucune facture</div></Card>}
   {invoices.slice(0,5).map(inv=><Card key={inv.id} style={{marginBottom:3,padding:"8px 12px"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
     <span style={{fontSize:13}}>🧾</span>
     <div style={{flex:1}}><div style={{fontWeight:600,fontSize:11}}>{inv.ref}</div><div style={{fontSize:9,color:C.td}}>{inv.plan} · {inv.cycle==="monthly"?"Mensuel":"Annuel"}</div></div>
     <span style={{fontWeight:700,fontSize:11,color:C.g}}>{inv.amount}€</span>
     <span style={{padding:"2px 6px",borderRadius:4,fontSize:8,fontWeight:600,background:C.gD,color:C.g}}>Payé</span>
     <span style={{fontSize:9,color:C.td}}>{new Date(inv.date).toLocaleDateString("fr-FR")}</span>
    </div>
   </Card>)}
  </Sect>

  <div style={{display:"flex",gap:8,marginTop:16}}>
   <Btn v="secondary" onClick={()=>setStep("plan")}>Changer de forfait</Btn>
   <Btn v="ghost" onClick={()=>{}}>Annuler l'abonnement</Btn>
  </div>
 </>;
}
