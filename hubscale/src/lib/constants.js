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
    id: 'starter', name: 'Starter', monthly: 99,
    features: ['Dashboard Overview', 'CRM basique (100 contacts)', 'Données financières', '1 utilisateur', 'Support email'],
  },
  {
    id: 'professional', name: 'Professional', monthly: 249, recommended: true,
    features: ['Tout Starter +', 'CRM avancé (illimité)', 'Sales Pipeline & Pub', 'Agenda complet', '5 utilisateurs', 'Intégrations API', 'Support prioritaire'],
  },
  {
    id: 'enterprise', name: 'Enterprise', monthly: 499,
    features: ['Tout Professional +', 'CI/CD Data Monitoring', 'Backup automatique 24h', 'KPI personnalisés', 'Utilisateurs illimités', 'Onboarding dédié', 'SLA 99.9%', 'Account manager'],
  },
];

export const INTEGRATIONS = [
  { name: 'Stripe', desc: 'Paiements et facturation', icon: '💳' },
  { name: 'Revolut', desc: 'Données bancaires', icon: '🏦' },
  { name: 'Google Calendar', desc: 'Synchronisation agenda et événements', icon: '📅' },
  { name: 'GoHighLevel', desc: 'CRM et marketing', icon: '📈' },
  { name: 'Meta Ads', desc: 'Publicité Facebook/Instagram', icon: '📣' },
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
