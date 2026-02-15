import { C } from './theme.js';

export const FONT="'Teachers',sans-serif";
export const FONT_TITLE="'Eurostile','Square721 BT','Arial Black',sans-serif";
export const BF={ca:"",charges:"",chargesOps:"",salaire:"",formation:"",clients:"",churn:"",pub:"",leads:"",leadsContact:"",leadsClos:"",notes:"",mrr:"",pipeline:"",tresoSoc:""};
export const MN=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
export const MOODS=["😫","😟","😐","🙂","🔥"];
export const DEAL_STAGES=["Idée","Contact","Négociation","Due Diligence","Signature"];
export const DEMO_JOURNAL={};
export const DEMO_ACTIONS=[];
export const DEMO_PULSES={};
export const DEMO_DEALS=[];
export const DEMO_OKRS=[];
export const DEMO_SYNERGIES=[];
export const DEMO_SUBS=[];
export const DEMO_TEAM=[];
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
export const GHL_BASE="/api/ghl";
export const STRIPE_PROXY="/api/stripe";
export const REV_ENVS={sandbox:"https://sandbox-b2b.revolut.com/api/1.0",production:"https://b2b.revolut.com/api/1.0"};
export const CURR_SYMBOLS={EUR:"€",USD:"$",GBP:"£",CHF:"CHF",SEK:"kr",NOK:"kr",DKK:"kr",PLN:"zł",CZK:"Kč",HUF:"Ft",RON:"lei",BGN:"лв",HRK:"kn",AED:"AED",CAD:"CA$",AUD:"A$",JPY:"¥"};
export const STORE_URL="/api/store";
export const EXCLUDED_ACCOUNTS={
 leadx:["5c008ba9-b9a7-4141-97dc-6a53ef3d6646","5fce1497-811e-4266-9889-2da74aa27733"],
 copy:["a1edf694-6f10-4b88-bfc1-7f2447f0fd8d","a86df684-33a0-413b-b56b-1e4fc2b13886"],
 eco:["a418f8cb-7001-40e8-acd3-e52f092294d4","39786a9f-7dd8-46e3-aba8-d8acca9e4bd7","fa4578d8-5d7f-4b9c-b2eb-afa01061d28e","88fb482e-26b3-494e-9234-5cded1b76799","d45a5ba7-cefa-4e21-85f9-cdafa6c60648","12440858-679f-4781-8db1-eb0ebbb986b3","f893a7c1-64b4-4247-9625-9f640d768b96","9f8f33c4-112f-44ad-81ea-a8acbca1efb7"],
};
export const SLACK_MODES={
 webhook:{l:"Webhook",desc:"Incoming Webhook URL — simple, pas besoin d'app",icon:"🔗"},
 bot:{l:"Bot Token",desc:"Bot OAuth Token (xoxb-…) — plus de contrôle, peut tagger",icon:"🤖"},
 bob:{l:"Bob (Agent IA)",desc:"Via votre app Bob existante — webhook custom",icon:"🧠"},
};
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
export const SYN_TYPES={referral:{label:"Referral",icon:"🔗",color:C.b},collab:{label:"Collaboration",icon:"🤝",color:C.v},resource:{label:"Ressource partagée",icon:"📦",color:C.o}};
export const SYN_STATUS={active:{label:"En cours",color:C.b},won:{label:"Gagné",color:C.g},lost:{label:"Perdu",color:C.r}};
export const SUB_CATS_FULL={crm:{l:"CRM/Marketing",icon:"💻",c:C.v},design:{l:"Design",icon:"🎨",c:C.o},comms:{l:"Communication",icon:"💬",c:C.b},iadev:{l:"IA/Dev",icon:"🤖",c:C.g},productivite:{l:"Productivité",icon:"📊",c:C.acc},formation:{l:"Formation/Communauté",icon:"🎓",c:"#f59e0b"},paiement:{l:"Paiement",icon:"💳",c:C.r},abonnement:{l:"Abonnement",icon:"🔄",c:"#8b5cf6"},prestataire:{l:"Prestataire",icon:"👤",c:"#ec4899"},autre:{l:"Autre",icon:"📦",c:C.td}};
export const CLIENT_STATUS={active:{l:"Actif",c:C.g,icon:"✓"},paused:{l:"En pause",c:C.o,icon:"⏸"},churned:{l:"Perdu",c:C.r,icon:"✗"},completed:{l:"Terminé",c:C.td,icon:"✓"},prospect:{l:"Prospect",c:C.b,icon:"◌"}};
export const INV_STATUS={
 draft:{l:"Brouillon",c:C.td,icon:"📝",bg:C.card2},
 sent:{l:"Envoyée",c:C.b,icon:"📤",bg:C.bD},
 paid:{l:"Payée",c:C.g,icon:"✅",bg:C.gD},
 overdue:{l:"En retard",c:C.r,icon:"⚠️",bg:C.rD},
 cancelled:{l:"Annulée",c:C.td,icon:"✗",bg:C.card2},
};
export const KB_CATS={playbook:{label:"📘 Playbooks",color:C.b},template:{label:"📄 Templates",color:C.g},contact:{label:"👤 Contacts",color:C.o},tool:{label:"🔧 Outils",color:C.v},tip:{label:"💡 Tips",color:C.acc}};
export const BILL_TYPES={
 fixed:{l:"Forfait fixe",icon:"💰",c:C.acc,desc:"Montant fixe mensuel avec ou sans engagement"},
 percent:{l:"% du CA/bénéfice",icon:"📊",c:C.v,desc:"Pourcentage sur le CA ou bénéfice généré"},
 hybrid:{l:"Fixe + %",icon:"💎",c:"#ec4899",desc:"Forfait fixe + pourcentage sur CA ou bénéfice"},
 oneoff:{l:"Prestation unique",icon:"🎯",c:C.b,desc:"Paiement unique (formation, accompagnement)"},
};
export const MILESTONE_CATS={ca:"🏆 Chiffre d'affaires",time:"📅 Ancienneté",growth:"📈 Croissance",profit:"💎 Rentabilité",engage:"📊 Engagement",grade:"⭐ Excellence",pipeline:"🎯 Pipeline",tresor:"🏦 Trésorerie",record:"🏅 Records"};
export const TIER_COLORS={1:C.td,2:C.b,3:C.g,4:C.acc,5:"#c084fc",6:"#fbbf24"};
export const TIER_BG={1:C.card2,2:C.bD,3:C.gD,4:C.accD,5:"rgba(192,132,252,.1)",6:"rgba(251,191,36,.12)"};
