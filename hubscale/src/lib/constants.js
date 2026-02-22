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
  { name: 'GoHighLevel', desc: 'CRM et marketing', icon: '📈' },
  { name: 'Meta Ads', desc: 'Publicité Facebook/Instagram', icon: '📣' },
];
