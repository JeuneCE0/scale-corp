// HubScale — Integration Data Population
// When an integration is connected, seed realistic data into the relevant stores

import { store, load } from './store.js';
import { uid } from './utils.js';

// --- Stripe: financial history + transactions ---
function seedStripeData() {
  const existing = load('finHistory') || [];
  if (existing.length >= 6) return; // Don't overwrite existing data

  const now = new Date();
  const rows = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (existing.some((r) => r.key === key)) continue;

    const baseCa = 18000 + Math.round(Math.random() * 12000);
    const seasonMultiplier = [0.85, 0.9, 1.0, 1.05, 1.1, 0.95, 0.8, 0.75, 1.0, 1.15, 1.2, 1.1][d.getMonth()];
    const ca = Math.round(baseCa * seasonMultiplier);
    const fixedCharges = 5200 + Math.round(Math.random() * 800);
    const varCharges = Math.round(ca * (0.15 + Math.random() * 0.1));
    const charges = fixedCharges + varCharges;
    const treso = 25000 + Math.round((ca - charges) * (12 - i) * 0.3);

    rows.push({ key, ca, charges, result: ca - charges, treso: Math.max(treso, 5000) });
  }
  store('finHistory', [...existing, ...rows].sort((a, b) => a.key.localeCompare(b.key)));

  // Store Stripe-specific metadata
  store('stripe_connected', {
    connectedAt: new Date().toISOString(),
    accountId: 'acct_' + uid().slice(0, 12),
    businessName: (load('settings_company') || {}).name || 'Mon Entreprise',
    paymentMethods: ['card', 'sepa_debit'],
    currency: 'eur',
  });
}

// --- Google Calendar: events ---
function seedGoogleCalendarData() {
  const existing = load('events') || [];
  if (existing.length >= 8) return;

  const now = new Date();
  const types = ['reunion', 'call', 'deadline', 'event'];
  const titles = [
    'Réunion équipe commerciale', 'Call client - Projet Alpha',
    'Deadline livraison MVP', 'Demo produit pour Acme Corp',
    'Point hebdo équipe', 'Entretien candidat dev senior',
    'Revue trimestrielle', 'Webinaire marketing',
    'Sprint planning', 'Réunion partenariat stratégique',
    'Call support technique', 'Formation nouvel outil CRM',
  ];
  const descriptions = [
    'Préparer les KPIs de la semaine', 'Présenter les nouvelles fonctionnalités',
    'Vérifier les derniers tests', 'Discuter budget Q2',
    'Revoir le pipeline commercial', 'Aligner les objectifs d\'équipe',
  ];

  const newEvents = [];
  for (let i = 0; i < 10; i++) {
    const dayOffset = Math.floor(Math.random() * 30) - 5; // -5 to +25 days from now
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    const dateStr = d.toISOString().split('T')[0];
    const hour = 8 + Math.floor(Math.random() * 10);
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];

    if (existing.some((e) => e.title === titles[i % titles.length] && e.date === dateStr)) continue;

    newEvents.push({
      id: uid(),
      title: titles[i % titles.length],
      date: dateStr,
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      type: types[Math.floor(Math.random() * types.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      reminder: [15, 30, 60][Math.floor(Math.random() * 3)],
      source: 'google_calendar',
    });
  }

  store('events', [...existing, ...newEvents]);
  store('gcal_connected', {
    connectedAt: new Date().toISOString(),
    calendarId: 'primary',
    syncedEvents: newEvents.length,
  });
}

// --- GoHighLevel: contacts / CRM ---
function seedGHLData() {
  const existing = load('contacts') || [];
  if (existing.length >= 10) return;

  const firstNames = ['Marie', 'Thomas', 'Sophie', 'Pierre', 'Julie', 'Nicolas', 'Camille', 'Antoine', 'Emma', 'Lucas', 'Léa', 'Hugo', 'Chloé', 'Maxime'];
  const lastNames = ['Martin', 'Bernard', 'Dubois', 'Laurent', 'Lefebvre', 'Moreau', 'Simon', 'Petit', 'Robert', 'Durand', 'Leroy', 'Roux'];
  const companies = ['Acme Corp', 'TechVision', 'DataFlow', 'CloudNine SAS', 'GreenTech', 'FinServ Pro', 'MediaPulse', 'Logistik+', 'NovaStar', 'AlphaDigital'];
  const statuses = ['prospect', 'prospect', 'lead', 'lead', 'client', 'client', 'perdu', 'partenaire'];

  const newContacts = [];
  for (let i = 0; i < 15; i++) {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${first} ${last}`;
    const company = companies[Math.floor(Math.random() * companies.length)];

    if (existing.some((c) => c.name === name)) continue;

    const createdDaysAgo = Math.floor(Math.random() * 90) + 5;
    const createdAt = new Date(Date.now() - createdDaysAgo * 86400000).toISOString();
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const ca = status === 'client' ? Math.round(2000 + Math.random() * 15000) : 0;

    newContacts.push({
      id: uid(),
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, '')}.fr`,
      phone: `+33 ${Math.floor(Math.random() * 9) + 1} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      company,
      status,
      ca,
      notes: '',
      createdAt,
      commentaires: status !== 'prospect' ? [{
        text: `Premier contact via ${['LinkedIn', 'email', 'salon pro', 'recommandation'][Math.floor(Math.random() * 4)]}`,
        date: createdAt,
      }] : [],
      relances: [],
      source: 'gohighlevel',
    });
  }

  store('contacts', [...existing, ...newContacts]);
  store('ghl_connected', {
    connectedAt: new Date().toISOString(),
    locationId: 'loc_' + uid().slice(0, 10),
    syncedContacts: newContacts.length,
  });
}

// --- Revolut: bank data (treasury in finHistory) ---
function seedRevolutData() {
  const history = load('finHistory') || [];
  if (history.length === 0) return; // Need financial history first

  // Update treasury values with more realistic bank data
  let runningBalance = 15000 + Math.round(Math.random() * 10000);
  const updated = history.map((row) => {
    runningBalance += (row.result || 0);
    if (runningBalance < 2000) runningBalance = 2000 + Math.round(Math.random() * 3000);
    return { ...row, treso: Math.round(runningBalance) };
  });
  store('finHistory', updated);

  store('revolut_connected', {
    connectedAt: new Date().toISOString(),
    accountId: 'rev_' + uid().slice(0, 10),
    currency: 'EUR',
    bankName: 'Revolut Business',
    lastSync: new Date().toISOString(),
  });
}

// --- Meta Ads: already handled in Data.jsx, just store metadata ---
function seedMetaAdsData() {
  store('meta_connected', {
    connectedAt: new Date().toISOString(),
    adAccountId: 'act_' + uid().slice(0, 12),
    pages: ['Mon Entreprise'],
    adStatus: 'active',
  });
}

// --- Main dispatcher ---
const INTEGRATION_SEEDERS = {
  'Stripe': seedStripeData,
  'Google Calendar': seedGoogleCalendarData,
  'GoHighLevel': seedGHLData,
  'Revolut': seedRevolutData,
  'Meta Ads': seedMetaAdsData,
};

/**
 * Called when an integration is toggled ON.
 * Seeds relevant demo data into the stores.
 * @param {string} integrationName
 */
export function onIntegrationConnect(integrationName) {
  const seeder = INTEGRATION_SEEDERS[integrationName];
  if (seeder) {
    seeder();
    return true;
  }
  return false;
}

/**
 * Get connection metadata for an integration
 * @param {string} integrationName
 * @returns {object|null}
 */
export function getIntegrationMeta(integrationName) {
  const keys = {
    'Stripe': 'stripe_connected',
    'Google Calendar': 'gcal_connected',
    'GoHighLevel': 'ghl_connected',
    'Revolut': 'revolut_connected',
    'Meta Ads': 'meta_connected',
  };
  return load(keys[integrationName]) || null;
}
