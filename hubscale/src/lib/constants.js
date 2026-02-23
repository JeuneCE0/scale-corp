// HubScale — Shared Constants
import { T } from './theme.js';

export const CRM_STATUSES = [
  { id: 'prospect', label: 'PROSPECT', color: T.orange, bg: T.orangeBg },
  { id: 'lead', label: 'LEAD', color: T.orange, bg: T.orangeBg },
  { id: 'client', label: 'CLIENT', color: T.green, bg: T.greenBg },
  { id: 'perdu', label: 'PERDU', color: T.red, bg: T.redBg },
  { id: 'partenaire', label: 'PARTENAIRE', color: T.purple, bg: T.purpleBg },
];

export const CRM_FILTER_TABS = ['Tous', 'Prospect', 'Lead', 'Client', 'Perdu', 'Partenaire'];

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

export const INTEGRATIONS = [
  // Paiements
  { name: 'Stripe', desc: 'Paiements et facturation', icon: '💳', category: 'paiements' },
  { name: 'PayPal', desc: 'Paiements en ligne', icon: '🅿️', category: 'paiements' },
  { name: 'Shopify', desc: 'E-commerce & paiements', icon: '🛍️', category: 'paiements' },
  { name: 'WooCommerce', desc: 'E-commerce WordPress', icon: '🛒', category: 'paiements' },
  // Banque & Comptabilité
  { name: 'Revolut', desc: 'Données bancaires', icon: '🏦', category: 'banque' },
  { name: 'Qonto', desc: 'Banque pro & comptabilité', icon: '🏛️', category: 'banque' },
  { name: 'Shine', desc: 'Banque des indépendants', icon: '✨', category: 'banque' },
  { name: 'Bunq', desc: 'Banque digitale', icon: '🐰', category: 'banque' },
  { name: 'N26', desc: 'Banque mobile', icon: '🔢', category: 'banque' },
  { name: 'QuickBooks', desc: 'Comptabilité & facturation', icon: '📗', category: 'banque' },
  { name: 'Xero', desc: 'Comptabilité cloud', icon: '📘', category: 'banque' },
  // Agenda
  { name: 'Google Calendar', desc: 'Synchronisation agenda et événements', icon: '📅', category: 'agenda' },
  // CRM & Gestion
  { name: 'GoHighLevel', desc: 'CRM et marketing automation', icon: '📈', category: 'crm' },
  { name: 'HubSpot', desc: 'CRM, marketing et ventes', icon: '🟠', category: 'crm' },
  { name: 'Salesforce', desc: 'CRM entreprise', icon: '☁️', category: 'crm' },
  { name: 'Zoho', desc: 'Suite CRM complète', icon: '🔴', category: 'crm' },
  { name: 'Pipedrive', desc: 'CRM pipeline de ventes', icon: '🟢', category: 'crm' },
  { name: 'Brevo', desc: 'Email marketing & CRM', icon: '💌', category: 'crm' },
  { name: 'Axonaut', desc: 'CRM & facturation PME', icon: '🔧', category: 'crm' },
  // Email Marketing & Automation
  { name: 'ActiveCampaign', desc: 'Email marketing & automation', icon: '⚡', category: 'marketing' },
  { name: 'Mailchimp', desc: 'Email marketing', icon: '🐵', category: 'marketing' },
  { name: 'Klaviyo', desc: 'Email & SMS marketing e-commerce', icon: '📧', category: 'marketing' },
  { name: 'Sendinblue', desc: 'Email transactionnel & marketing', icon: '💙', category: 'marketing' },
  { name: 'Lemlist', desc: 'Cold email & prospection', icon: '🍋', category: 'marketing' },
  { name: 'SystemeIO', desc: 'Tunnel de vente & formation', icon: '🚀', category: 'marketing' },
  { name: 'ClickFunnels', desc: 'Funnels de vente', icon: '🔻', category: 'marketing' },
  // Gestion de projet
  { name: 'Monday', desc: 'Gestion de projet & workflow', icon: '📋', category: 'projet' },
  { name: 'Asana', desc: 'Gestion de projet & tâches', icon: '🎯', category: 'projet' },
  { name: 'Notion', desc: 'Wiki, docs & gestion de projet', icon: '📝', category: 'projet' },
  { name: 'Trello', desc: 'Tableaux kanban', icon: '📌', category: 'projet' },
  { name: 'Jira', desc: 'Gestion de projet technique', icon: '🔷', category: 'projet' },
  { name: 'Slack', desc: 'Communication d\'équipe', icon: '💬', category: 'projet' },
  // Publicité
  { name: 'Meta Ads', desc: 'Publicité Facebook/Instagram', icon: '📣', category: 'publicite' },
  { name: 'Google Ads', desc: 'Publicité Google & YouTube', icon: '🔍', category: 'publicite' },
  { name: 'TikTok Ads', desc: 'Publicité TikTok', icon: '🎵', category: 'publicite' },
  { name: 'LinkedIn Ads', desc: 'Publicité LinkedIn B2B', icon: '💼', category: 'publicite' },
  // Support Client
  { name: 'Zendesk', desc: 'Support client & ticketing', icon: '🎧', category: 'support' },
  { name: 'Freshdesk', desc: 'Helpdesk & support', icon: '🟩', category: 'support' },
  { name: 'Intercom', desc: 'Messagerie client & support', icon: '💬', category: 'support' },
];

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
