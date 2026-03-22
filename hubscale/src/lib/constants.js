// HubScale — Shared Constants
import { T } from './theme.js';

export const CRM_STATUSES = [
  { id: 'prospect', label: 'PROSPECT', color: T.orange, bg: T.orangeBg },
  { id: 'client', label: 'CLIENT', color: T.green, bg: T.greenBg },
  { id: 'perdu', label: 'PERDU', color: T.red, bg: T.redBg },
  { id: 'partenaire', label: 'PARTENAIRE', color: T.purple, bg: T.purpleBg },
];

export const CRM_FILTER_TABS = ['Tous', 'Prospect', 'Client', 'Perdu', 'Partenaire'];

export const EVENT_TYPES = [
  { value: 'reunion', label: 'Réunion' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'call', label: 'Appel' },
  { value: 'event', label: 'Événement' },
];

export const EVENT_TYPE_COLORS = { reunion: T.blue, deadline: T.red, call: T.green, event: T.purple };
export const EVENT_TYPE_ICONS = { reunion: '🤝', deadline: '⏰', call: '📞', event: '🎉' };

export const SECTORS = [
  { value: '', label: 'Sélectionner...' },
  { value: 'tech', label: 'Tech / SaaS' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'services', label: 'Services' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'industrie', label: 'Industrie' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'sante', label: 'Santé' },
  { value: 'autre', label: 'Autre' },
];

export const PLANS = [
  {
    id: 'starter', name: 'Essentiel', monthly: 49,
    features: ['Dashboard complet', 'CRM (import illimité, 100 manuels)', 'Données financières', 'Agenda', 'Export PDF & FEC', '1 utilisateur', 'Support email'],
  },
  {
    id: 'professional', name: 'Business', monthly: 149, recommended: true,
    features: ['Tout Essentiel +', 'CRM illimité', 'Analytics & Rapports', 'Prévisions IA', 'Simulateur publicitaire', 'Intégrations API (60+)', 'Tous les exports', '5 utilisateurs', 'Support prioritaire'],
  },
  {
    id: 'enterprise', name: 'Scale', monthly: 349,
    features: ['Tout Business +', 'Utilisateurs illimités', 'KPI personnalisés', 'Backup automatique 24h', 'Webhooks avancés', 'Onboarding dédié', 'Account manager', 'SLA 99.9%'],
  },
];

// Integration tiers:
//   'live'  = OAuth + data sync fully implemented (server-side)
//   'oauth' = OAuth flow works, but no data sync handler yet
//   'demo'  = Demo/local data only (seeder populates localStorage)
export const INTEGRATIONS = [
  // Paiements
  { name: 'Stripe', desc: 'Paiements et facturation', icon: '💳', category: 'paiements', tier: 'live' },
  { name: 'PayPal', desc: 'Paiements en ligne', icon: '🅿️', category: 'paiements', tier: 'live' },
  { name: 'Shopify', desc: 'E-commerce & paiements', icon: '🛍️', category: 'paiements', tier: 'live' },
  { name: 'WooCommerce', desc: 'E-commerce WordPress', icon: '🛒', category: 'paiements', tier: 'live' },
  // Banque & Comptabilité
  { name: 'Revolut', desc: 'Données bancaires', icon: '🏦', category: 'banque', tier: 'live' },
  { name: 'Qonto', desc: 'Banque pro & comptabilité', icon: '🏛️', category: 'banque', tier: 'live' },
  { name: 'Shine', desc: 'Banque des indépendants', icon: '✨', category: 'banque', tier: 'demo' },
  { name: 'Bunq', desc: 'Banque digitale', icon: '🐰', category: 'banque', tier: 'demo' },
  { name: 'N26', desc: 'Banque mobile', icon: '🔢', category: 'banque', tier: 'demo' },
  { name: 'QuickBooks', desc: 'Comptabilité & facturation', icon: '📗', category: 'banque', tier: 'demo' },
  { name: 'Xero', desc: 'Comptabilité cloud', icon: '📘', category: 'banque', tier: 'demo' },
  // Agenda
  { name: 'Google Calendar', desc: 'Synchronisation agenda et événements', icon: '📅', category: 'agenda', tier: 'live' },
  // CRM & Gestion
  { name: 'GoHighLevel', desc: 'CRM et marketing automation', icon: '📈', category: 'crm', tier: 'live' },
  { name: 'HubSpot', desc: 'CRM, marketing et ventes', icon: '🟠', category: 'crm', tier: 'live' },
  { name: 'Salesforce', desc: 'CRM entreprise', icon: '☁️', category: 'crm', tier: 'live' },
  { name: 'Zoho', desc: 'Suite CRM complète', icon: '🔴', category: 'crm', tier: 'live' },
  { name: 'Pipedrive', desc: 'CRM pipeline de ventes', icon: '🟢', category: 'crm', tier: 'live' },
  { name: 'Brevo', desc: 'Email marketing & CRM', icon: '💌', category: 'crm', tier: 'live' },
  { name: 'Axonaut', desc: 'CRM & facturation PME', icon: '🔧', category: 'crm', tier: 'demo' },
  // Email Marketing & Automation
  { name: 'ActiveCampaign', desc: 'Email marketing & automation', icon: '⚡', category: 'marketing', tier: 'live' },
  { name: 'Mailchimp', desc: 'Email marketing', icon: '🐵', category: 'marketing', tier: 'live' },
  { name: 'Klaviyo', desc: 'Email & SMS marketing e-commerce', icon: '📧', category: 'marketing', tier: 'demo' },
  { name: 'Sendinblue', desc: 'Email transactionnel & marketing', icon: '💙', category: 'marketing', tier: 'demo' },
  { name: 'Lemlist', desc: 'Cold email & prospection', icon: '🍋', category: 'marketing', tier: 'demo' },
  { name: 'SystemeIO', desc: 'Tunnel de vente & formation', icon: '🚀', category: 'marketing', tier: 'demo' },
  { name: 'ClickFunnels', desc: 'Funnels de vente', icon: '🔻', category: 'marketing', tier: 'demo' },
  // Gestion de projet
  { name: 'Monday', desc: 'Gestion de projet & workflow', icon: '📋', category: 'projet', tier: 'live' },
  { name: 'Asana', desc: 'Gestion de projet & tâches', icon: '🎯', category: 'projet', tier: 'live' },
  { name: 'Notion', desc: 'Wiki, docs & gestion de projet', icon: '📝', category: 'projet', tier: 'live' },
  { name: 'Trello', desc: 'Tableaux kanban', icon: '📌', category: 'projet', tier: 'live' },
  { name: 'Jira', desc: 'Gestion de projet technique', icon: '🔷', category: 'projet', tier: 'live' },
  { name: 'Slack', desc: 'Communication d\'équipe', icon: '💬', category: 'projet', tier: 'live' },
  // Publicité
  { name: 'Meta Ads', desc: 'Publicité Facebook/Instagram', icon: '📣', category: 'publicite', tier: 'live' },
  { name: 'Google Ads', desc: 'Publicité Google & YouTube', icon: '🔍', category: 'publicite', tier: 'live' },
  { name: 'TikTok Ads', desc: 'Publicité TikTok', icon: '🎵', category: 'publicite', tier: 'live' },
  { name: 'LinkedIn Ads', desc: 'Publicité LinkedIn B2B', icon: '💼', category: 'publicite', tier: 'live' },
  // Support Client
  { name: 'Zendesk', desc: 'Support client & ticketing', icon: '🎧', category: 'support', tier: 'live' },
  { name: 'Freshdesk', desc: 'Helpdesk & support', icon: '🟩', category: 'support', tier: 'live' },
  { name: 'Intercom', desc: 'Messagerie client & support', icon: '💬', category: 'support', tier: 'live' },
];

// Guide de connexion pour chaque intégration : étapes, liens doc, tutoriel
export const INTEGRATION_GUIDES = {
  Stripe: {
    steps: [
      'Connectez-vous à votre Dashboard Stripe',
      'Allez dans Développeurs → Clés API',
      'Copiez votre clé secrète (sk_live_... ou sk_test_...)',
      'Collez-la dans le champ ci-dessous',
    ],
    links: [
      { label: 'Dashboard Stripe', url: 'https://dashboard.stripe.com/apikeys' },
      { label: 'Documentation API Stripe', url: 'https://stripe.com/docs/keys' },
      { label: 'Guide de démarrage Stripe', url: 'https://stripe.com/docs/development/quickstart' },
    ],
    tip: 'Utilisez une clé de test (sk_test_...) pour tester sans risque avant de passer en production.',
  },
  PayPal: {
    steps: [
      'Connectez-vous sur developer.paypal.com',
      'Allez dans Apps & Credentials',
      'Créez une app ou sélectionnez une app existante',
      'Copiez le Client Secret',
      'Collez-le dans le champ ci-dessous',
    ],
    links: [
      { label: 'PayPal Developer Dashboard', url: 'https://developer.paypal.com/dashboard/applications' },
      { label: 'Documentation API PayPal', url: 'https://developer.paypal.com/docs/api/overview/' },
      { label: 'Guide REST API PayPal', url: 'https://developer.paypal.com/docs/checkout/' },
    ],
    tip: 'Créez d\'abord une app Sandbox pour tester en mode développement.',
  },
  Shopify: {
    steps: [
      'Connectez-vous à votre admin Shopify',
      'Allez dans Paramètres → Apps et canaux de vente → Développer des apps',
      'Créez une app personnalisée et configurez les scopes API',
      'Installez l\'app et copiez l\'Access Token (shpat_...)',
      'Renseignez votre domaine boutique et l\'access token ci-dessous',
    ],
    links: [
      { label: 'Admin Shopify', url: 'https://admin.shopify.com' },
      { label: 'Documentation API Shopify', url: 'https://shopify.dev/docs/api' },
      { label: 'Guide Custom Apps', url: 'https://shopify.dev/docs/apps/build/authentication/access-tokens' },
    ],
    tip: 'Assurez-vous d\'activer les scopes read_orders, read_products et read_customers.',
  },
  WooCommerce: {
    steps: [
      'Connectez-vous à votre admin WordPress',
      'Allez dans WooCommerce → Réglages → Avancé → API REST',
      'Cliquez sur "Ajouter une clé" et générez des clés en lecture',
      'Copiez la clé secrète (Consumer Secret)',
      'Collez-la dans le champ ci-dessous',
    ],
    links: [
      { label: 'Documentation WooCommerce REST API', url: 'https://woocommerce.github.io/woocommerce-rest-api-docs/' },
      { label: 'Guide d\'authentification', url: 'https://woocommerce.github.io/woocommerce-rest-api-docs/#authentication' },
    ],
    tip: 'Utilisez des permissions en "Lecture" uniquement pour plus de sécurité.',
  },
  Revolut: {
    steps: [
      'Connectez-vous à Revolut Business',
      'Allez dans Paramètres → API → API Credentials',
      'Générez un nouveau certificat et token d\'accès',
      'Copiez l\'Access Token (oa_prod_...)',
      'Collez-le dans le champ ci-dessous',
    ],
    links: [
      { label: 'Revolut Business', url: 'https://business.revolut.com' },
      { label: 'Documentation API Revolut', url: 'https://developer.revolut.com/docs/business/business-api' },
      { label: 'Guide Authentification', url: 'https://developer.revolut.com/docs/business/authentication' },
    ],
    tip: 'L\'API Revolut nécessite un certificat SSL. Suivez le guide d\'authentification.',
  },
  Qonto: {
    steps: [
      'Connectez-vous à votre espace Qonto',
      'Allez dans Paramètres → Intégrations → API',
      'Générez une clé API avec les permissions souhaitées',
      'Copiez la clé API et l\'URL de l\'API',
      'Collez-les dans les champs ci-dessous',
    ],
    links: [
      { label: 'Qonto - Connexion', url: 'https://app.qonto.com' },
      { label: 'Documentation API Qonto', url: 'https://api-doc.qonto.com' },
      { label: 'Guide de démarrage', url: 'https://api-doc.qonto.com/docs/business-api/7a5e58c3a5cce-getting-started' },
    ],
    tip: 'L\'URL par défaut de l\'API est https://thirdparty.qonto.com/v2.',
  },
  Shine: {
    steps: [
      'Connectez-vous à votre compte Shine',
      'Accédez aux paramètres de votre compte',
      'L\'intégration Shine fonctionne en mode démo pour le moment',
      'Les données seront simulées localement',
    ],
    links: [
      { label: 'Shine - Connexion', url: 'https://shine.fr' },
      { label: 'Support Shine', url: 'https://help.shine.fr' },
    ],
    tip: 'Intégration en mode démo. Contactez-nous pour activer la connexion en production.',
  },
  Bunq: {
    steps: [
      'Connectez-vous à l\'app Bunq ou bunq.com',
      'Allez dans Profil → Développeurs → API Keys',
      'Créez une nouvelle clé API',
      'Les données seront simulées en mode démo',
    ],
    links: [
      { label: 'Bunq - Espace client', url: 'https://www.bunq.com' },
      { label: 'Documentation API Bunq', url: 'https://doc.bunq.com' },
    ],
    tip: 'Intégration en mode démo. Bunq propose un sandbox pour les tests.',
  },
  N26: {
    steps: [
      'N26 ne propose pas encore d\'API publique pour les entreprises',
      'L\'intégration fonctionne en mode démo avec des données simulées',
      'Les données bancaires N26 seront générées automatiquement',
    ],
    links: [
      { label: 'N26 - Site officiel', url: 'https://n26.com' },
      { label: 'N26 Support', url: 'https://support.n26.com' },
    ],
    tip: 'Intégration en mode démo. N26 travaille sur une API ouverte (PSD2).',
  },
  QuickBooks: {
    steps: [
      'Connectez-vous à QuickBooks Online',
      'Allez dans Paramètres → Intégrations ou developer.intuit.com',
      'Créez une app pour obtenir vos clés OAuth',
      'Les données seront simulées en mode démo',
    ],
    links: [
      { label: 'QuickBooks Developer', url: 'https://developer.intuit.com' },
      { label: 'Documentation API', url: 'https://developer.intuit.com/app/developer/qbo/docs/get-started' },
    ],
    tip: 'Intégration en mode démo. Utilisez le sandbox Intuit pour tester.',
  },
  Xero: {
    steps: [
      'Connectez-vous à developer.xero.com',
      'Créez une nouvelle app pour obtenir un Client ID',
      'Configurez les scopes (accounting.transactions.read, etc.)',
      'Les données seront simulées en mode démo',
    ],
    links: [
      { label: 'Xero Developer', url: 'https://developer.xero.com' },
      { label: 'Documentation API Xero', url: 'https://developer.xero.com/documentation/api/accounting/overview' },
    ],
    tip: 'Intégration en mode démo. Xero utilise OAuth 2.0 avec PKCE.',
  },
  'Google Calendar': {
    steps: [
      'Allez sur la Google Cloud Console',
      'Créez un projet ou sélectionnez un projet existant',
      'Activez l\'API Google Calendar',
      'Créez des identifiants (clé API ou OAuth 2.0)',
      'Copiez la clé API et collez-la ci-dessous',
    ],
    links: [
      { label: 'Google Cloud Console', url: 'https://console.cloud.google.com' },
      { label: 'API Google Calendar', url: 'https://console.cloud.google.com/apis/library/calendar-json.googleapis.com' },
      { label: 'Documentation Calendar API', url: 'https://developers.google.com/calendar/api/quickstart/js' },
      { label: 'Guide d\'authentification Google', url: 'https://developers.google.com/identity/protocols/oauth2' },
    ],
    tip: 'Activez l\'API Calendar dans votre projet GCP avant de créer la clé.',
  },
  GoHighLevel: {
    steps: [
      'Connectez-vous à votre compte GoHighLevel',
      'Allez dans Settings → API Keys (ou Business API)',
      'Générez une nouvelle clé API',
      'Copiez la clé et collez-la ci-dessous',
    ],
    links: [
      { label: 'GoHighLevel - Connexion', url: 'https://app.gohighlevel.com' },
      { label: 'Documentation API GHL', url: 'https://highlevel.stoplight.io/docs/integrations' },
      { label: 'Guide API GoHighLevel', url: 'https://highlevel.stoplight.io/docs/integrations/getting-started' },
    ],
    tip: 'Utilisez l\'API v2 pour bénéficier de toutes les fonctionnalités.',
  },
  HubSpot: {
    steps: [
      'Connectez-vous à votre compte HubSpot',
      'Allez dans Paramètres → Intégrations → Clés API privées',
      'Créez un nouveau token d\'accès privé (Private App)',
      'Sélectionnez les scopes : crm.objects.contacts.read, crm.objects.deals.read',
      'Copiez le token (pat-na1-...) et collez-le ci-dessous',
    ],
    links: [
      { label: 'HubSpot - Paramètres', url: 'https://app.hubspot.com/settings' },
      { label: 'Guide Private Apps', url: 'https://developers.hubspot.com/docs/api/private-apps' },
      { label: 'Documentation API HubSpot', url: 'https://developers.hubspot.com/docs/api/overview' },
      { label: 'Scopes disponibles', url: 'https://developers.hubspot.com/docs/api/working-with-oauth#scopes' },
    ],
    tip: 'Les Private Apps remplacent les anciennes clés API HubSpot (dépréciées).',
  },
  Salesforce: {
    steps: [
      'Connectez-vous à Salesforce Setup',
      'Allez dans Apps → App Manager → New Connected App',
      'Activez les paramètres OAuth et sélectionnez les scopes',
      'Générez un Access Token via le flux OAuth',
      'Renseignez l\'URL de votre instance et l\'access token ci-dessous',
    ],
    links: [
      { label: 'Salesforce Setup', url: 'https://login.salesforce.com' },
      { label: 'Documentation API REST', url: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_rest.htm' },
      { label: 'Guide Connected Apps', url: 'https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm' },
      { label: 'OAuth Salesforce', url: 'https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_flows.htm' },
    ],
    tip: 'L\'URL instance ressemble à https://votreorg.my.salesforce.com. Trouvez-la dans Setup → Company Information.',
  },
  Zoho: {
    steps: [
      'Connectez-vous à Zoho API Console (api-console.zoho.com)',
      'Créez un client de type "Self Client"',
      'Générez un code d\'autorisation avec les scopes CRM',
      'Échangez le code contre un access token',
      'Collez l\'access token ci-dessous',
    ],
    links: [
      { label: 'Zoho API Console', url: 'https://api-console.zoho.com' },
      { label: 'Documentation CRM API', url: 'https://www.zoho.com/crm/developer/docs/api/v6/' },
      { label: 'Guide OAuth Zoho', url: 'https://www.zoho.com/crm/developer/docs/api/v6/oauth-overview.html' },
    ],
    tip: 'Utilisez le Self Client pour générer rapidement un token de test.',
  },
  Pipedrive: {
    steps: [
      'Connectez-vous à Pipedrive',
      'Cliquez sur votre avatar → Company Settings → Personal Preferences',
      'Allez dans l\'onglet API et copiez votre Personal API Token',
      'Collez le token ci-dessous',
    ],
    links: [
      { label: 'Pipedrive - Paramètres', url: 'https://app.pipedrive.com/settings/api' },
      { label: 'Documentation API Pipedrive', url: 'https://developers.pipedrive.com/docs/api/v1' },
      { label: 'Guide d\'authentification', url: 'https://pipedrive.readme.io/docs/core-api-concepts-authentication' },
    ],
    tip: 'Votre API token est personnel. Ne le partagez jamais publiquement.',
  },
  Brevo: {
    steps: [
      'Connectez-vous à votre compte Brevo (ex-Sendinblue)',
      'Allez dans SMTP & API → API Keys',
      'Générez une nouvelle clé API v3',
      'Copiez la clé (xkeysib-...) et collez-la ci-dessous',
    ],
    links: [
      { label: 'Brevo - Clés API', url: 'https://app.brevo.com/settings/keys/api' },
      { label: 'Documentation API Brevo', url: 'https://developers.brevo.com/docs' },
      { label: 'Guide de démarrage', url: 'https://developers.brevo.com/docs/getting-started' },
    ],
    tip: 'Brevo est le nouveau nom de Sendinblue. Les clés API sont les mêmes.',
  },
  Axonaut: {
    steps: [
      'Connectez-vous à votre compte Axonaut',
      'Allez dans Configuration → API',
      'Copiez votre clé API',
      'L\'intégration fonctionne en mode démo',
    ],
    links: [
      { label: 'Axonaut - Connexion', url: 'https://axonaut.com/login' },
      { label: 'Documentation API', url: 'https://axonaut.com/api-documentation' },
    ],
    tip: 'Intégration en mode démo. Contactez-nous pour activer la synchronisation.',
  },
  ActiveCampaign: {
    steps: [
      'Connectez-vous à votre compte ActiveCampaign',
      'Allez dans Settings → Developer → API Access',
      'Copiez votre URL API et votre clé API',
      'Renseignez les deux champs ci-dessous',
    ],
    links: [
      { label: 'ActiveCampaign - Settings', url: 'https://app.activecampaign.com/app/settings/developer' },
      { label: 'Documentation API', url: 'https://developers.activecampaign.com/reference/overview' },
      { label: 'Guide d\'authentification', url: 'https://developers.activecampaign.com/reference/authentication' },
    ],
    tip: 'L\'URL API ressemble à https://votrecompte.api-us1.com. Elle est unique à votre compte.',
  },
  Mailchimp: {
    steps: [
      'Connectez-vous à Mailchimp',
      'Allez dans Account → Extras → API Keys',
      'Créez une nouvelle clé API',
      'Copiez la clé (format : xxxxxxxx-us21) et collez-la ci-dessous',
    ],
    links: [
      { label: 'Mailchimp - API Keys', url: 'https://us1.admin.mailchimp.com/account/api/' },
      { label: 'Documentation API Mailchimp', url: 'https://mailchimp.com/developer/marketing/docs/fundamentals/' },
      { label: 'Guide de démarrage rapide', url: 'https://mailchimp.com/developer/marketing/guides/quick-start/' },
    ],
    tip: 'Le suffixe après le tiret (ex: us21) indique votre datacenter. C\'est important pour l\'URL API.',
  },
  Klaviyo: {
    steps: [
      'Connectez-vous à Klaviyo',
      'Allez dans Settings → API Keys',
      'Créez une nouvelle Private API Key',
      'L\'intégration fonctionne en mode démo',
    ],
    links: [
      { label: 'Klaviyo - API Keys', url: 'https://www.klaviyo.com/settings/account/api-keys' },
      { label: 'Documentation API', url: 'https://developers.klaviyo.com/en/reference/api-overview' },
    ],
    tip: 'Intégration en mode démo. Klaviyo utilise des Private API Keys pour l\'authentification.',
  },
  Sendinblue: {
    steps: [
      'Sendinblue est maintenant Brevo',
      'Connectez-vous sur app.brevo.com',
      'Allez dans SMTP & API → API Keys',
      'Générez une clé API v3',
    ],
    links: [
      { label: 'Brevo (ex-Sendinblue)', url: 'https://app.brevo.com' },
      { label: 'Documentation API', url: 'https://developers.brevo.com/docs' },
    ],
    tip: 'Intégration en mode démo. Sendinblue a été renommé Brevo en 2023.',
  },
  Lemlist: {
    steps: [
      'Connectez-vous à Lemlist',
      'Allez dans Settings → Integrations → API',
      'Copiez votre clé API',
      'L\'intégration fonctionne en mode démo',
    ],
    links: [
      { label: 'Lemlist - Connexion', url: 'https://app.lemlist.com' },
      { label: 'Documentation API', url: 'https://developer.lemlist.com' },
    ],
    tip: 'Intégration en mode démo. Lemlist propose une API REST complète.',
  },
  SystemeIO: {
    steps: [
      'Connectez-vous à Systeme.io',
      'Allez dans Paramètres → Clé API',
      'Copiez votre clé API publique',
      'L\'intégration fonctionne en mode démo',
    ],
    links: [
      { label: 'Systeme.io - Connexion', url: 'https://systeme.io/dashboard' },
      { label: 'Documentation API', url: 'https://developer.systeme.io' },
    ],
    tip: 'Intégration en mode démo. Systeme.io propose une API pour les tunnels et contacts.',
  },
  ClickFunnels: {
    steps: [
      'Connectez-vous à ClickFunnels',
      'Allez dans Settings → Integrations → API Access',
      'Copiez votre API Key et votre API Secret',
      'L\'intégration fonctionne en mode démo',
    ],
    links: [
      { label: 'ClickFunnels - Connexion', url: 'https://app.clickfunnels.com' },
      { label: 'Documentation API', url: 'https://developers.clickfunnels.com' },
    ],
    tip: 'Intégration en mode démo. ClickFunnels 2.0 utilise une nouvelle API.',
  },
  Monday: {
    steps: [
      'Connectez-vous à Monday.com',
      'Cliquez sur votre avatar → Developers → My Access Tokens',
      'Créez un Personal API Token',
      'Copiez le token et collez-le ci-dessous',
    ],
    links: [
      { label: 'Monday.com - Developers', url: 'https://auth.monday.com/oauth2/authorize' },
      { label: 'Documentation API', url: 'https://developer.monday.com/api-reference/docs' },
      { label: 'Guide API Tokens', url: 'https://developer.monday.com/api-reference/docs/authentication' },
    ],
    tip: 'Monday utilise une API GraphQL. Le token personnel suffit pour lire vos boards.',
  },
  Asana: {
    steps: [
      'Connectez-vous à Asana',
      'Allez dans My Settings → Apps → Developer Console',
      'Créez un Personal Access Token',
      'Copiez le token et collez-le ci-dessous',
    ],
    links: [
      { label: 'Asana Developer Console', url: 'https://app.asana.com/0/my-apps' },
      { label: 'Documentation API', url: 'https://developers.asana.com/docs/overview' },
      { label: 'Guide d\'authentification', url: 'https://developers.asana.com/docs/personal-access-token' },
    ],
    tip: 'Le Personal Access Token a les mêmes permissions que votre compte Asana.',
  },
  Notion: {
    steps: [
      'Allez sur notion.so/my-integrations',
      'Cliquez sur "Nouvelle intégration"',
      'Nommez l\'intégration (ex: HubScale) et validez',
      'Copiez le token d\'intégration (ntn_...)',
      'Dans Notion, partagez les pages souhaitées avec votre intégration',
      'Collez le token ci-dessous',
    ],
    links: [
      { label: 'Notion - Mes intégrations', url: 'https://www.notion.so/my-integrations' },
      { label: 'Documentation API Notion', url: 'https://developers.notion.com' },
      { label: 'Guide de démarrage', url: 'https://developers.notion.com/docs/getting-started' },
      { label: 'Partager avec une intégration', url: 'https://developers.notion.com/docs/authorization#how-to-share-a-database-with-an-integration' },
    ],
    tip: 'N\'oubliez pas de partager vos pages/bases Notion avec l\'intégration, sinon l\'API ne pourra pas y accéder.',
  },
  Trello: {
    steps: [
      'Connectez-vous à Trello',
      'Allez sur trello.com/power-ups/admin',
      'Créez un Power-Up ou utilisez la page d\'API Key',
      'Générez un token avec les permissions de lecture',
      'Collez la clé API et le token ci-dessous',
    ],
    links: [
      { label: 'Trello - API Key', url: 'https://trello.com/app-key' },
      { label: 'Documentation API Trello', url: 'https://developer.atlassian.com/cloud/trello/rest/api-group-actions/' },
      { label: 'Guide d\'autorisation', url: 'https://developer.atlassian.com/cloud/trello/guides/rest-api/authorization/' },
    ],
    tip: 'Vous aurez besoin d\'une API Key ET d\'un Token. Les deux sont nécessaires.',
  },
  Jira: {
    steps: [
      'Connectez-vous à Atlassian (id.atlassian.com)',
      'Allez dans Security → API Tokens',
      'Créez un nouveau token API',
      'Copiez le token et collez-le ci-dessous',
    ],
    links: [
      { label: 'Atlassian API Tokens', url: 'https://id.atlassian.com/manage-profile/security/api-tokens' },
      { label: 'Documentation API Jira Cloud', url: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/' },
      { label: 'Guide d\'authentification', url: 'https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/' },
    ],
    tip: 'L\'authentification Jira Cloud utilise email + API token en Basic Auth.',
  },
  Slack: {
    steps: [
      'Allez sur api.slack.com/apps',
      'Créez une nouvelle app (From Scratch)',
      'Allez dans OAuth & Permissions et ajoutez les scopes Bot Token',
      'Scopes recommandés : channels:read, chat:write, users:read',
      'Installez l\'app dans votre workspace',
      'Copiez le Bot User OAuth Token (xoxb-...) et collez-le ci-dessous',
    ],
    links: [
      { label: 'Slack API - Vos Apps', url: 'https://api.slack.com/apps' },
      { label: 'Documentation API Slack', url: 'https://api.slack.com/docs' },
      { label: 'Guide Bot Tokens', url: 'https://api.slack.com/authentication/token-types#bot' },
      { label: 'Liste des Scopes', url: 'https://api.slack.com/scopes' },
    ],
    tip: 'Le Bot Token (xoxb-...) est différent du User Token. Utilisez le Bot Token pour les intégrations.',
  },
  'Meta Ads': {
    steps: [
      'Connectez-vous à Meta Business Suite',
      'Allez dans Business Settings → System Users',
      'Créez un System User et générez un token',
      'Sélectionnez les permissions ads_read et ads_management',
      'Copiez le long-lived access token et collez-le ci-dessous',
    ],
    links: [
      { label: 'Meta Business Suite', url: 'https://business.facebook.com/settings' },
      { label: 'Documentation Marketing API', url: 'https://developers.facebook.com/docs/marketing-apis' },
      { label: 'Guide System Users', url: 'https://www.facebook.com/business/help/503306463479099' },
      { label: 'Graph API Explorer', url: 'https://developers.facebook.com/tools/explorer/' },
    ],
    tip: 'Un System User Token n\'expire pas, contrairement aux User Tokens classiques (60 jours max).',
  },
  'Google Ads': {
    steps: [
      'Connectez-vous à Google Ads (ads.google.com)',
      'Allez dans Outils → Configuration → Centre API',
      'Demandez un Developer Token (niveau basique ou standard)',
      'Attendez l\'approbation de Google',
      'Copiez le Developer Token et collez-le ci-dessous',
    ],
    links: [
      { label: 'Google Ads', url: 'https://ads.google.com' },
      { label: 'API Center Google Ads', url: 'https://ads.google.com/aw/apicenter' },
      { label: 'Documentation API', url: 'https://developers.google.com/google-ads/api/docs/start' },
      { label: 'Guide Developer Token', url: 'https://developers.google.com/google-ads/api/docs/get-started/dev-token' },
    ],
    tip: 'Le Developer Token nécessite une approbation. Utilisez un compte test en attendant.',
  },
  'TikTok Ads': {
    steps: [
      'Connectez-vous à TikTok for Business',
      'Allez dans TikTok Marketing API → My Apps',
      'Créez une app et demandez l\'accès à l\'API Marketing',
      'Après approbation, générez un Access Token',
      'Collez le token ci-dessous',
    ],
    links: [
      { label: 'TikTok for Business', url: 'https://business-api.tiktok.com/portal/docs' },
      { label: 'Documentation Marketing API', url: 'https://business-api.tiktok.com/marketing_api/docs' },
      { label: 'Guide de démarrage', url: 'https://business-api.tiktok.com/marketing_api/docs?id=1701890920013825' },
    ],
    tip: 'L\'approbation de l\'app TikTok peut prendre quelques jours ouvrés.',
  },
  'LinkedIn Ads': {
    steps: [
      'Connectez-vous à LinkedIn Campaign Manager',
      'Allez sur linkedin.com/developers → My Apps',
      'Créez une app et demandez l\'accès à Marketing Developer Platform',
      'Générez un Access Token OAuth 2.0',
      'Collez le token ci-dessous',
    ],
    links: [
      { label: 'LinkedIn Developers', url: 'https://www.linkedin.com/developers/apps' },
      { label: 'Documentation Marketing API', url: 'https://learn.microsoft.com/en-us/linkedin/marketing/' },
      { label: 'Guide d\'authentification', url: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow' },
    ],
    tip: 'L\'accès Marketing Developer Platform nécessite une validation par LinkedIn.',
  },
  Zendesk: {
    steps: [
      'Connectez-vous à votre admin Zendesk',
      'Allez dans Admin → Channels → API',
      'Activez l\'accès Token et générez un nouveau token',
      'Copiez le token et collez-le ci-dessous',
    ],
    links: [
      { label: 'Zendesk Admin', url: 'https://votrecompte.zendesk.com/admin' },
      { label: 'Documentation API Zendesk', url: 'https://developer.zendesk.com/api-reference/' },
      { label: 'Guide d\'authentification', url: 'https://developer.zendesk.com/api-reference/introduction/security-and-auth/' },
    ],
    tip: 'L\'authentification se fait avec email/token. Format : email@exemple.com/token:votretoken.',
  },
  Freshdesk: {
    steps: [
      'Connectez-vous à votre Freshdesk',
      'Cliquez sur votre avatar → Profile Settings',
      'Copiez votre API Key (affiché à droite)',
      'Collez la clé ci-dessous',
    ],
    links: [
      { label: 'Freshdesk', url: 'https://votrecompte.freshdesk.com' },
      { label: 'Documentation API', url: 'https://developers.freshdesk.com/api/' },
      { label: 'Guide d\'authentification', url: 'https://developers.freshdesk.com/api/#authentication' },
    ],
    tip: 'Votre clé API Freshdesk est visible directement dans votre profil. Pas besoin de la générer.',
  },
  Intercom: {
    steps: [
      'Connectez-vous à Intercom',
      'Allez dans Settings → Integrations → Developer Hub',
      'Créez une nouvelle app ou utilisez une app existante',
      'Copiez l\'Access Token et collez-le ci-dessous',
    ],
    links: [
      { label: 'Intercom Developer Hub', url: 'https://app.intercom.com/a/developer-signup' },
      { label: 'Documentation API', url: 'https://developers.intercom.com/docs' },
      { label: 'Guide d\'authentification', url: 'https://developers.intercom.com/docs/build-an-integration/learn-more/authentication/' },
    ],
    tip: 'Utilisez un Access Token avec des permissions minimales pour plus de sécurité.',
  },
};

export const EXPENSE_CATEGORIES = [
  { id: 'loyer', label: 'Loyer / Locaux', icon: '🏢', color: '#6366f1' },
  { id: 'salaires', label: 'Salaires / RH', icon: '👥', color: '#3b82f6' },
  { id: 'marketing', label: 'Marketing / Pub', icon: '📢', color: '#f97316' },
  { id: 'outils', label: 'Outils / SaaS', icon: '💻', color: '#a855f7' },
  { id: 'fournisseurs', label: 'Fournisseurs', icon: '📦', color: '#22c55e' },
  { id: 'transport', label: 'Transport / Déplacements', icon: '🚗', color: '#eab308' },
  { id: 'telecom', label: 'Télécom / Internet', icon: '📡', color: '#06b6d4' },
  { id: 'assurances', label: 'Assurances', icon: '🛡️', color: '#64748b' },
  { id: 'impots', label: 'Impôts / Taxes', icon: '🏛️', color: '#ef4444' },
  { id: 'autre', label: 'Autres', icon: '📋', color: '#71717a' },
];

export const LEAD_SCORE_LABELS = [
  { min: 80, label: 'Hot', color: T.red, bg: T.redBg, icon: '🔥' },
  { min: 60, label: 'Warm', color: T.orange, bg: T.orangeBg, icon: '🌡️' },
  { min: 40, label: 'Tiède', color: T.blue, bg: T.blueBg, icon: '💧' },
  { min: 0, label: 'Froid', color: T.textMuted, bg: T.surface2, icon: '❄️' },
];

export const CALENDAR_VIEWS = ['mois', 'semaine'];

export const NOTIFICATION_TYPES = {
  relance: { icon: '⚠️', color: T.orange, bg: T.orangeBg, label: 'Relance' },
  conversion: { icon: '🎉', color: T.green, bg: T.greenBg, label: 'Conversion' },
  event: { icon: '📅', color: T.blue, bg: T.blueBg, label: 'Événement' },
  finance: { icon: '💰', color: T.green, bg: T.greenBg, label: 'Finance' },
  alert: { icon: '🚨', color: T.red, bg: T.redBg, label: 'Alerte' },
  tip: { icon: '💡', color: T.accent, bg: T.accentBg, label: 'Conseil' },
};

export const ONBOARDING_CHECKLIST = [
  { id: 'company', label: 'Renseigner les infos société', icon: '🏢', tab: 'settings' },
  { id: 'contact', label: 'Ajouter un premier contact', icon: '👤', tab: 'crm' },
  { id: 'finance', label: 'Saisir des données financières', icon: '💰', tab: 'data' },
  { id: 'event', label: 'Créer un événement', icon: '📅', tab: 'agenda' },
  { id: 'integration', label: 'Connecter une intégration', icon: '🔗', tab: 'settings' },
];

export const INVOICE_STATUSES = [
  { id: 'draft', label: 'Brouillon', color: T.textMuted, bg: T.surface2, icon: '📝' },
  { id: 'sent', label: 'Envoyée', color: T.blue, bg: T.blueBg, icon: '📤' },
  { id: 'paid', label: 'Payée', color: T.green, bg: T.greenBg, icon: '✅' },
  { id: 'overdue', label: 'En retard', color: T.red, bg: T.redBg, icon: '⚠️' },
];

export const TVA_RATES = [
  { value: 0, label: '0%' },
  { value: 5.5, label: '5,5%' },
  { value: 10, label: '10%' },
  { value: 20, label: '20%' },
];

export const PIPELINE_STAGES = [
  { id: 'prospect', label: 'Prospect', proba: 10, color: T.orange },
  { id: 'lead', label: 'Lead qualifié', proba: 30, color: T.blue },
  { id: 'negociation', label: 'Négociation', proba: 60, color: T.purple },
  { id: 'proposal', label: 'Proposition', proba: 80, color: T.accent },
  { id: 'client', label: 'Gagné', proba: 100, color: T.green },
  { id: 'perdu', label: 'Perdu', proba: 0, color: T.red },
];

export const AUTOMATION_RULES = [
  {
    id: 'relance-prospect-7j',
    label: 'Relance prospect inactif (7j)',
    description: 'Notification si un prospect n\'a pas d\'activité depuis 7 jours',
    icon: '⏰',
    category: 'crm',
    defaultEnabled: true,
  },
  {
    id: 'relance-lead-14j',
    label: 'Relance lead inactif (14j)',
    description: 'Notification si un lead n\'a pas d\'activité depuis 14 jours',
    icon: '⏰',
    category: 'crm',
    defaultEnabled: true,
  },
  {
    id: 'invoice-overdue-3j',
    label: 'Facture impayée (+3j)',
    description: 'Alerte si une facture dépasse son échéance de 3 jours',
    icon: '💸',
    category: 'finance',
    defaultEnabled: true,
  },
  {
    id: 'invoice-overdue-7j',
    label: 'Relance facture impayée (+7j)',
    description: 'Alerte urgente si une facture dépasse son échéance de 7 jours',
    icon: '🚨',
    category: 'finance',
    defaultEnabled: true,
  },
  {
    id: 'ca-objectif-atteint',
    label: 'Objectif CA atteint',
    description: 'Notification de célébration quand le CA mensuel dépasse l\'objectif',
    icon: '🎉',
    category: 'finance',
    defaultEnabled: true,
  },
  {
    id: 'charges-hausse-15',
    label: 'Charges en hausse (+15%)',
    description: 'Alerte si les charges augmentent de plus de 15% vs mois précédent',
    icon: '📈',
    category: 'finance',
    defaultEnabled: true,
  },
  {
    id: 'new-client-invoice',
    label: 'Nouveau client → créer facture',
    description: 'Rappel de créer une facture quand un contact passe en statut client',
    icon: '📋',
    category: 'crm',
    defaultEnabled: false,
  },
  {
    id: 'treso-basse-2mois',
    label: 'Trésorerie < 2 mois de charges',
    description: 'Alerte critique si la trésorerie couvre moins de 2 mois de charges',
    icon: '🏦',
    category: 'finance',
    defaultEnabled: true,
  },
];
