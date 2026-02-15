// Default data and configuration
import { C } from './theme.js';

export const DS=[
 {id:"leadx",nom:"LEADX",porteur:"Dayyaan",act:"Media Buying",pT:"benefices",pP:30,stat:"active",color:"#FFAA00",pin:"1001",rec:true,obj:10000,objQ:28000,ghlKey:"",ghlLocationId:"BjQ4DxmWrLl3nCNcjmhE",revToken:"",revEnv:"sandbox",revolutCompany:"leadx",incub:"2025-06-01",slackId:""},
 {id:"copy",nom:"Copywriting",porteur:"Sol",act:"Copywriting",pT:"benefices",pP:20,stat:"active",color:"#60a5fa",pin:"1002",rec:false,obj:15000,objQ:42000,ghlKey:"",ghlLocationId:"2lB0paK192CFU1cLz5eT",revToken:"",revEnv:"sandbox",revolutCompany:"bcs",incub:"2025-03-15",slackId:""},
 {id:"bbp",nom:"BourbonBonsPlans",porteur:"Siméon",act:"Vidéo",pT:"benefices",pP:20,stat:"active",color:"#34d399",pin:"1003",rec:true,obj:8000,objQ:22000,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"2025-08-01",slackId:""},
 {id:"studio",nom:"Studio Branding",porteur:"Pablo",act:"Design",pT:"benefices",pP:20,stat:"active",color:"#fb923c",pin:"1004",rec:false,obj:5000,objQ:14000,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"2025-09-01",slackId:""},
 {id:"eco",nom:"L'Écosystème",porteur:"Scale Corp",act:"Consulting",pT:"ca",pP:100,stat:"active",color:"#a78bfa",pin:"admin",rec:false,obj:7000,objQ:20000,ghlKey:"",ghlLocationId:"NsV7HI2MbE6qHtRp410y",revToken:"",revEnv:"sandbox",revolutCompany:"eco",incub:"2024-01-01",slackId:""},
 {id:"padel",nom:"Padel Académie",porteur:"Louis",act:"Formation",pT:"benefices",pP:20,stat:"lancement",color:"#14b8a6",pin:"1005",rec:false,obj:3000,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"2026-01-15",slackId:""},
 {id:"iphone",nom:"Formation iPhone",porteur:"À définir",act:"Contenu",pT:"benefices",pP:20,stat:"lancement",color:"#8b5cf6",pin:"1006",rec:false,obj:0,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"2026-02-01",slackId:""},
 {id:"import",nom:"Import Auto",porteur:"À définir",act:"Import",pT:"benefices",pP:20,stat:"lancement",color:"#ec4899",pin:"1007",rec:false,obj:0,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"",slackId:""},
 {id:"tennis",nom:"Formation Tennis",porteur:"À définir",act:"Tennis",pT:"benefices",pP:20,stat:"signature",color:"#06b6d4",pin:"1008",rec:false,obj:0,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"",slackId:""},
 {id:"virale",nom:"Vidéo Virale",porteur:"À définir",act:"Vidéo",pT:"benefices",pP:20,stat:"signature",color:"#f43f5e",pin:"1009",rec:false,obj:0,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"",slackId:""},
 {id:"mindset",nom:"Coaching Mindset",porteur:"À définir",act:"Mindset",pT:"benefices",pP:20,stat:"signature",color:"#eab308",pin:"1010",rec:false,obj:0,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:"",slackId:""},
];
export const DH={logiciels:1200,equipe:300,service:500,cabinet:280,remun:3000,reservePct:30,crm:150,treso:2000,revolutToken:"",revolutEnv:"sandbox",slack:{enabled:false,mode:"bob",webhookUrl:"",botToken:"",channel:"",bobWebhook:"",notifyPulse:true,notifyReport:true,notifyValidation:true,notifyReminders:true},brand:{name:"L'INCUBATEUR ECS",sub:"Plateforme de pilotage",logoUrl:"/logo-ecs.png",logoLetter:"E",accentColor:"#FFAA00",gradientFrom:"#FFBF00",gradientTo:"#FF9D00"}};
export const DEAL_STAGES=["Idée","Contact","Négociation","Due Diligence","Signature"];
export const DEMO_SYNERGIES=[];
export const SYN_TYPES={referral:{label:"Referral",icon:"🔗",color:C.b},collab:{label:"Collaboration",icon:"🤝",color:C.v},resource:{label:"Ressource partagée",icon:"📦",color:C.o}};
export const SYN_STATUS={active:{label:"En cours",color:C.b},won:{label:"Gagné",color:C.g},lost:{label:"Perdu",color:C.r}};
export const SUB_CATS={crm:{l:"CRM/Marketing",icon:"💻",c:C.v},design:{l:"Design",icon:"🎨",c:C.o},comms:{l:"Communication",icon:"💬",c:C.b},iadev:{l:"IA/Dev",icon:"🤖",c:C.g},productivite:{l:"Productivité",icon:"📊",c:C.acc},formation:{l:"Formation/Communauté",icon:"🎓",c:"#f59e0b"},paiement:{l:"Paiement",icon:"💳",c:C.r},abonnement:{l:"Abonnement",icon:"🔄",c:"#8b5cf6"},prestataire:{l:"Prestataire",icon:"👤",c:"#ec4899"},autre:{l:"Autre",icon:"📦",c:C.td}};
export const AUTO_CAT_MAP=[
 [/gohighlevel|highlevel|hubspot|mailchimp|convertkit|activecampaign|brevo|sendinblue/i,"crm"],
 [/figma|canva|adobe|photoshop|illustrator|creative cloud/i,"design"],
 [/slack|zoom|google workspace|microsoft 365|microsoft|teams|twilio/i,"comms"],
 [/openai|anthropic|chatgpt|claude|github|vercel|aws|amazon web|heroku|netlify|railway|render/i,"iadev"],
 [/notion|zapier|make\.com|integromat|airtable|clickup|asana|monday/i,"productivite"],
 [/skool|teachable|kajabi|podia|thinkific|circle/i,"formation"],
 [/stripe|revolut|paypal|wise|mollie|gocardless/i,"paiement"],
 [/l.cosyst.me|lecosysteme/i,"abonnement"],
 [/lucien/i,"prestataire"],
];
export const DEMO_SUBS=[];
export const DEMO_TEAM=[];
 fixed:{l:"Forfait fixe",icon:"💰",c:C.acc,desc:"Montant fixe mensuel avec ou sans engagement"},
 percent:{l:"% du CA/bénéfice",icon:"📊",c:C.v,desc:"Pourcentage sur le CA ou bénéfice généré"},
 hybrid:{l:"Fixe + %",icon:"💎",c:"#ec4899",desc:"Forfait fixe + pourcentage sur CA ou bénéfice"},
 oneoff:{l:"Prestation unique",icon:"🎯",c:C.b,desc:"Paiement unique (formation, accompagnement)"},
};
export const CLIENT_STATUS={active:{l:"Actif",c:C.g,icon:"✓"},paused:{l:"En pause",c:C.o,icon:"⏸"},churned:{l:"Perdu",c:C.r,icon:"✗"},completed:{l:"Terminé",c:C.td,icon:"✓"},prospect:{l:"Prospect",c:C.b,icon:"◌"}};
export const DEMO_CLIENTS=[];
export const DEMO_KB=[
 {id:"kb1",title:"Playbook Cold Outreach B2B",cat:"playbook",author:"leadx",content:"1. Identifier ICP via LinkedIn Sales Nav\n2. Scraper avec Phantombuster\n3. Séquence 3 emails (J0, J3, J7)\n4. Follow-up LinkedIn J10\n5. Call si ouverture > 40%",tags:["prospection","b2b","email"],date:"2026-01-05",likes:3},
 {id:"kb2",title:"Template Proposition Commerciale",cat:"template",author:"copy",content:"Structure gagnante :\n• Contexte client (montrer qu'on a compris)\n• Problème identifié\n• Solution proposée (3 options)\n• Pricing avec ancrage\n• Garantie + urgence\n• CTA clair",tags:["vente","pricing","template"],date:"2026-01-12",likes:5},
 {id:"kb3",title:"Contact Imprimeur fiable",cat:"contact",author:"bbp",content:"Jean-Marc Dubois — Imprim'Express\njm@imprimexpress.re — 0692 XX XX XX\nTarifs compétitifs, délais 48h, livraison gratuite > 200€",tags:["print","fournisseur"],date:"2026-01-20",likes:2},
 {id:"kb4",title:"Stack Outils recommandée",cat:"tool",author:"eco",content:"• CRM: GoHighLevel (déjà intégré)\n• Compta: Pennylane\n• Design: Figma + Canva Pro\n• Vidéo: CapCut Pro + DaVinci\n• Emailing: Brevo\n• Analytics: Plausible\n• Paiement: Stripe + Revolut Business",tags:["outils","stack","setup"],date:"2025-12-15",likes:7},
 {id:"kb5",title:"Méthode pricing \"Value-Based\"",cat:"tip",author:"copy",content:"Ne jamais pricer au temps passé. Toujours pricer à la valeur créée.\n\nFormule : Prix = 10% de la valeur annuelle que tu génères pour le client.\n\nExemple : tu gères 50K€/an de pub → facture 5K€/mois minimum.",tags:["pricing","mindset"],date:"2026-02-01",likes:4},
 {id:"kb6",title:"Script Appel Découverte",cat:"playbook",author:"leadx",content:"Intro (2min) : Contexte, pourquoi cet appel\nDouleur (5min) : Quel est le plus gros frein à ta croissance ?\nImpact (3min) : Combien ça te coûte de ne rien faire ?\nSolution (5min) : Voici comment on résout ça\nClose (2min) : On démarre quand ?",tags:["vente","appel","closing"],date:"2026-02-08",likes:6},
];
export const GHL_STAGES_COLORS=["#60a5fa","#FFAA00","#fb923c","#34d399","#a78bfa","#f43f5e","#14b8a6","#eab308"];
};
export async function syncSocRevolut(soc){
 if(!soc.revolutCompany)return null;
 const accounts=await fetchRevolut(soc.revolutCompany,"/accounts");
 if(!accounts)return null;
 const now=new Date();const cm=curM();const pm=prevM(cm);
 const from1=new Date(now.getFullYear(),now.getMonth()-1,1).toISOString();
 const txnsRaw=await fetchRevolut(soc.revolutCompany,`/transactions?from=${from1}&count=500`);
 const txns=(Array.isArray(txnsRaw)?txnsRaw:[]).map(t=>{
  const dt=new Date(t.created_at);
  return{...t,month:`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`};
 });
 const excluded=EXCLUDED_ACCOUNTS[soc.id]||[];
 const accs=(Array.isArray(accounts)?accounts:[]).map(a=>({id:a.id,name:a.name||"Compte",balance:a.balance,currency:a.currency,state:a.state,excluded:excluded.includes(a.id)}));
 const balance=accs.filter(a=>!a.excluded).reduce((s,a)=>s+(a.currency==="EUR"?a.balance:a.balance*0.92),0);
 const monthly={};
 txns.forEach(tx=>{const m=tx.month;const leg=tx.legs?.[0];if(!leg)return;if(excluded.includes(leg.account_id))return;const amt=leg.amount;if(!monthly[m])monthly[m]={income:0,expense:0};if(amt>0)monthly[m].income+=amt;else monthly[m].expense+=Math.abs(amt);});
 Object.keys(monthly).forEach(m=>{monthly[m].income=Math.round(monthly[m].income);monthly[m].expense=Math.round(monthly[m].expense);});
 return{accounts:accs,transactions:txns.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)),balance:Math.round(balance),monthly,lastSync:new Date().toISOString(),isDemo:false};
}
 [/gohighlevel|highlevel|hubspot|mailchimp|convertkit|activecampaign|brevo|sendinblue/i,"crm"],
 [/figma|canva|adobe|photoshop|illustrator|creative cloud/i,"design"],
 [/slack|zoom|google workspace|microsoft 365|microsoft|teams|twilio/i,"comms"],
 [/openai|anthropic|chatgpt|claude|github|vercel|aws|amazon web|heroku|netlify|railway|render/i,"iadev"],
export const SB_ADMIN=[
 {id:"dash",icon:"◉",label:"Dashboard",tab:0,accent:C.acc},
 {id:"societes",icon:"🏢",label:"Sociétés",tab:1,accent:C.b},
 {id:"finances",icon:"💰",label:"Finances",tab:2,accent:C.g},
 {id:"clients",icon:"👥",label:"Clients",tab:3,accent:C.o},
 {id:"sales",icon:"📞",label:"Sales",tab:15,accent:"#34d399"},
 {id:"pub",icon:"📣",label:"Publicité",tab:16,accent:"#f472b6"},
 {id:"rapports",icon:"📋",label:"Rapports",tab:17,accent:C.v},
 {id:"access",icon:"🔐",label:"Accès",tab:14,accent:"#f59e0b"},
 {id:"params",icon:"⚙️",label:"Paramètres",tab:18,accent:C.td},
 {id:"pulse",icon:"⚡",label:"PULSE",tab:99,accent:"#FFAA00"},
];

export const SB_PORTEUR=[
 {id:"dashboard",icon:"📊",label:"Dashboard",tab:0,accent:C.acc},
 {id:"activite",icon:"⚡",label:"Activité",tab:1,accent:C.b},
 {id:"sales",icon:"📞",label:"Sales",tab:2,accent:"#34d399"},
 {id:"publicite",icon:"📣",label:"Publicité",tab:3,accent:"#f472b6"},
 {id:"clients",icon:"👥",label:"Clients",tab:9,accent:C.o},
 {id:"bank",icon:"🏦",label:"Banque",tab:5,accent:C.g},
 {id:"rapports",icon:"📋",label:"Rapports",tab:13,accent:C.v},
 {id:"settings",icon:"⚙️",label:"Paramètres",tab:12,accent:C.td},
];

export const TOUR_ADMIN=[
 {target:"admin-nav",tab:0,title:"Navigation",icon:"🧭",desc:"La sidebar à gauche organise la plateforme en 6 sections clés : Dashboard, Portfolio, Finance, Commercial, AI Copilot et Ressources. Cliquez sur une section pour déplier ses sous-modules. Tout est accessible en un clic.",pos:"right",highlight:C.acc},
 {target:"admin-kpis",tab:0,title:"KPIs en temps réel",icon:"💰",desc:"Vue instantanée de la santé financière du groupe. CA total, marge nette, rémunération des fondateurs, disponible et trésorerie. Ces chiffres se recalculent automatiquement à chaque rapport soumis par une société.",pos:"bottom",highlight:C.acc},
 {target:"admin-alerts",tab:0,title:"Alertes intelligentes",icon:"🔔",desc:"Le système détecte automatiquement les risques : rapports en retard, trésorerie basse, chute de CA, actions non terminées. Chaque alerte est priorisée par criticité (danger, warning, info).",pos:"bottom",highlight:C.o},
 {target:"admin-feed",tab:0,title:"Fil d'activité",icon:"⚡",desc:"Chronologie des dernières actions du portfolio : rapports soumis, pulse check-ins, milestones débloqués. Gardez un œil sur l'activité sans vérifier chaque société.",pos:"right",highlight:C.b},
 {target:"admin-leaderboard",tab:0,title:"Classement & grades",icon:"🏆",desc:"Les sociétés sont classées par score composite (CA, croissance, rentabilité, engagement). Le grade A à F donne un aperçu instantané. Cliquez pour accéder au détail.",pos:"left",highlight:C.acc},
 {target:"admin-okr-actions",tab:0,title:"OKRs & Actions",icon:"🎯",desc:"À gauche : progression des objectifs trimestriels (OKR) avec barres d'avancement auto-synchro. À droite : actions prioritaires ouvertes avec détection des retards.",pos:"top",highlight:C.g},
 {target:"admin-portfolio",tab:0,title:"Cartes Portfolio",icon:"📋",desc:"Chaque carte = une société active. CA, trésorerie, grade santé, milestones débloqués, runway estimé. Les données viennent des rapports mensuels et des connexions bancaires.",pos:"top",highlight:C.v},
 {target:"admin-milestones",tab:0,title:"Milestones",icon:"🏅",desc:"Progression de chaque société vers ses trophées : clubs CA (1K, 5K, 10K…), streaks de croissance, ancienneté, rentabilité. Le système débloque automatiquement les achievements.",pos:"top",highlight:C.acc},
 {target:"admin-tab-1",tab:1,title:"Sociétés",icon:"📋",desc:"Dans la section Portfolio : ajoutez, modifiez et suivez chaque société incubée. PIN d'accès, couleur, porteur, objectifs, intégrations API. C'est le cœur de configuration de l'incubateur.",pos:"right",highlight:C.b},
 {target:"admin-tab-2",tab:2,title:"Analytique",icon:"📊",desc:"Section Portfolio > Analytique : comparez les performances entre sociétés avec des graphiques interactifs. Répartition du CA, évolution mensuelle, matrice de risque.",pos:"right",highlight:C.v},
 {target:"admin-tab-5",tab:5,title:"AI Copilot",icon:"🤖",desc:"Votre assistant IA dédié. Posez n'importe quelle question sur votre portfolio : analyses, comparaisons, recommandations. Il a accès à toutes vos données en temps réel.",pos:"right",highlight:"#a78bfa"},
 {target:"admin-tab-6",tab:6,title:"Pipeline",icon:"◎",desc:"Section Commercial > Pipeline : gérez les nouveaux projets de l'idée à la signature. 4 étapes : Idée, Évaluation, Due Diligence, Signé.",pos:"right",highlight:C.b},
 {target:"admin-tab-10",tab:10,title:"Synergies",icon:"🤝",desc:"Section Commercial > Synergies : cartographiez les referrals et collaborations entre sociétés. Suivez le CA généré par les synergies internes.",pos:"right",highlight:C.v},
 {target:"admin-tab-13",tab:13,title:"Charges & Équipe",icon:"🔄",desc:"Section Finance > Charges : centralisez abonnements et membres d'équipe de chaque société. Coût mensuel total, répartition par catégorie.",pos:"right",highlight:C.r},
];

export const TOUR_PORTEUR=[
 {target:"porteur-nav",tab:10,title:"Votre espace",icon:"🧭",desc:"La sidebar organise vos modules : Accueil (vue d'ensemble), Rapport, Performance, Suivi, Banque, Clients et Ressources.",pos:"right",highlight:C.acc},
 {target:"porteur-tab-10",tab:10,title:"Accueil",icon:"◉",desc:"Votre tableau de bord personnel : nudges d'actions à faire, KPIs du mois, évolution du CA, trophées et activité récente. Tout en un coup d'œil.",pos:"right",highlight:C.acc},
 {target:"porteur-tab-0",tab:0,title:"Rapport mensuel",icon:"📊",desc:"Renseignez CA, charges, clients et trésorerie chaque mois. Les champs avancés (détail charges, funnel, pub) sont dans des sections dépliables.",pos:"right",highlight:C.o},
 {target:"porteur-tab-1",tab:1,title:"Statistiques",icon:"📈",desc:"Performance > Stats : KPIs, score de santé A-F, graphes CA/marge. Les détails (finances, prévisions, funnel) se déplient à la demande.",pos:"right",highlight:C.g},
 {target:"porteur-tab-2",tab:2,title:"Activité",icon:"✅",desc:"Suivi > Activité : vos actions à faire, journal stratégique et historique fusionnés en un seul fil chronologique.",pos:"right",highlight:C.b},
 {target:"porteur-tab-4",tab:4,title:"Pulse hebdomadaire",icon:"💓",desc:"Suivi > Pulse : mood, victoire, blocage et confiance chaque semaine. Signal rapide pour Scale Corp.",pos:"right",highlight:C.o},
 {target:"porteur-tab-6",tab:6,title:"Milestones",icon:"🏆",desc:"Performance > Milestones : achievements automatiques, 5 tiers de Bronze à Diamant.",pos:"right",highlight:C.acc},
 {target:"porteur-tab-9",tab:9,title:"Gestion Clients",icon:"👥",desc:"Portefeuille clients : statuts, historique, facturation. Gérez le cycle de vie client.",pos:"right",highlight:C.o},
];


