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
  { name: 'PayPal', desc: 'Paiements en ligne', icon: '🅿️', category: 'paiements', tier: 'demo' },
  { name: 'Shopify', desc: 'E-commerce & paiements', icon: '🛍️', category: 'paiements', tier: 'demo' },
  { name: 'WooCommerce', desc: 'E-commerce WordPress', icon: '🛒', category: 'paiements', tier: 'demo' },
  // Banque & Comptabilité
  { name: 'Revolut', desc: 'Données bancaires', icon: '🏦', category: 'banque', tier: 'demo' },
  { name: 'Qonto', desc: 'Banque pro & comptabilité', icon: '🏛️', category: 'banque', tier: 'demo' },
  { name: 'Shine', desc: 'Banque des indépendants', icon: '✨', category: 'banque', tier: 'demo' },
  { name: 'Bunq', desc: 'Banque digitale', icon: '🐰', category: 'banque', tier: 'demo' },
  { name: 'N26', desc: 'Banque mobile', icon: '🔢', category: 'banque', tier: 'demo' },
  { name: 'QuickBooks', desc: 'Comptabilité & facturation', icon: '📗', category: 'banque', tier: 'demo' },
  { name: 'Xero', desc: 'Comptabilité cloud', icon: '📘', category: 'banque', tier: 'demo' },
  // Agenda
  { name: 'Google Calendar', desc: 'Synchronisation agenda et événements', icon: '📅', category: 'agenda', tier: 'live' },
  // CRM & Gestion
  { name: 'GoHighLevel', desc: 'CRM et marketing automation', icon: '📈', category: 'crm', tier: 'demo' },
  { name: 'HubSpot', desc: 'CRM, marketing et ventes', icon: '🟠', category: 'crm', tier: 'live' },
  { name: 'Salesforce', desc: 'CRM entreprise', icon: '☁️', category: 'crm', tier: 'demo' },
  { name: 'Zoho', desc: 'Suite CRM complète', icon: '🔴', category: 'crm', tier: 'demo' },
  { name: 'Pipedrive', desc: 'CRM pipeline de ventes', icon: '🟢', category: 'crm', tier: 'demo' },
  { name: 'Brevo', desc: 'Email marketing & CRM', icon: '💌', category: 'crm', tier: 'demo' },
  { name: 'Axonaut', desc: 'CRM & facturation PME', icon: '🔧', category: 'crm', tier: 'demo' },
  // Email Marketing & Automation
  { name: 'ActiveCampaign', desc: 'Email marketing & automation', icon: '⚡', category: 'marketing', tier: 'demo' },
  { name: 'Mailchimp', desc: 'Email marketing', icon: '🐵', category: 'marketing', tier: 'demo' },
  { name: 'Klaviyo', desc: 'Email & SMS marketing e-commerce', icon: '📧', category: 'marketing', tier: 'demo' },
  { name: 'Sendinblue', desc: 'Email transactionnel & marketing', icon: '💙', category: 'marketing', tier: 'demo' },
  { name: 'Lemlist', desc: 'Cold email & prospection', icon: '🍋', category: 'marketing', tier: 'demo' },
  { name: 'SystemeIO', desc: 'Tunnel de vente & formation', icon: '🚀', category: 'marketing', tier: 'demo' },
  { name: 'ClickFunnels', desc: 'Funnels de vente', icon: '🔻', category: 'marketing', tier: 'demo' },
  // Gestion de projet
  { name: 'Monday', desc: 'Gestion de projet & workflow', icon: '📋', category: 'projet', tier: 'demo' },
  { name: 'Asana', desc: 'Gestion de projet & tâches', icon: '🎯', category: 'projet', tier: 'demo' },
  { name: 'Notion', desc: 'Wiki, docs & gestion de projet', icon: '📝', category: 'projet', tier: 'demo' },
  { name: 'Trello', desc: 'Tableaux kanban', icon: '📌', category: 'projet', tier: 'demo' },
  { name: 'Jira', desc: 'Gestion de projet technique', icon: '🔷', category: 'projet', tier: 'demo' },
  { name: 'Slack', desc: 'Communication d\'équipe', icon: '💬', category: 'projet', tier: 'oauth' },
  // Publicité
  { name: 'Meta Ads', desc: 'Publicité Facebook/Instagram', icon: '📣', category: 'publicite', tier: 'demo' },
  { name: 'Google Ads', desc: 'Publicité Google & YouTube', icon: '🔍', category: 'publicite', tier: 'demo' },
  { name: 'TikTok Ads', desc: 'Publicité TikTok', icon: '🎵', category: 'publicite', tier: 'demo' },
  { name: 'LinkedIn Ads', desc: 'Publicité LinkedIn B2B', icon: '💼', category: 'publicite', tier: 'demo' },
  // Support Client
  { name: 'Zendesk', desc: 'Support client & ticketing', icon: '🎧', category: 'support', tier: 'demo' },
  { name: 'Freshdesk', desc: 'Helpdesk & support', icon: '🟩', category: 'support', tier: 'demo' },
  { name: 'Intercom', desc: 'Messagerie client & support', icon: '💬', category: 'support', tier: 'demo' },
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
