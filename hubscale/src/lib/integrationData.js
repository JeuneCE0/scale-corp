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

// --- PayPal: payment data ---
function seedPayPalData() {
  // PayPal complements Stripe — merge extra transactions into finHistory
  const existing = load('finHistory') || [];
  if (existing.length > 0) {
    const updated = existing.map((row) => ({
      ...row,
      ca: row.ca + Math.round(800 + Math.random() * 2200),
    }));
    updated.forEach((r) => { r.result = r.ca - r.charges; });
    store('finHistory', updated);
  }
  store('paypal_connected', {
    connectedAt: new Date().toISOString(),
    merchantId: 'MERCH' + uid().slice(0, 10).toUpperCase(),
    email: (load('settings_company') || {}).email || 'contact@monentreprise.fr',
    currency: 'EUR',
  });
}

// --- Qonto: bank data ---
function seedQontoData() {
  const history = load('finHistory') || [];
  if (history.length > 0) {
    let balance = 22000 + Math.round(Math.random() * 15000);
    const updated = history.map((row) => {
      balance += (row.result || 0);
      if (balance < 3000) balance = 3000 + Math.round(Math.random() * 5000);
      return { ...row, treso: Math.round(balance) };
    });
    store('finHistory', updated);
  }
  store('qonto_connected', {
    connectedAt: new Date().toISOString(),
    organizationId: 'org_' + uid().slice(0, 10),
    iban: 'FR76' + Array.from({ length: 5 }, () => String(Math.floor(Math.random() * 10000)).padStart(4, '0')).join(''),
    bankName: 'Qonto',
  });
}

// --- Shine: bank data ---
function seedShineData() {
  const history = load('finHistory') || [];
  if (history.length > 0) {
    let balance = 12000 + Math.round(Math.random() * 8000);
    const updated = history.map((row) => {
      balance += (row.result || 0);
      if (balance < 2000) balance = 2000 + Math.round(Math.random() * 3000);
      return { ...row, treso: Math.round(balance) };
    });
    store('finHistory', updated);
  }
  store('shine_connected', {
    connectedAt: new Date().toISOString(),
    accountId: 'shine_' + uid().slice(0, 10),
    bankName: 'Shine',
  });
}

// --- Bunq: bank data ---
function seedBunqData() {
  const history = load('finHistory') || [];
  if (history.length > 0) {
    let balance = 18000 + Math.round(Math.random() * 12000);
    const updated = history.map((row) => {
      balance += (row.result || 0);
      if (balance < 2500) balance = 2500 + Math.round(Math.random() * 4000);
      return { ...row, treso: Math.round(balance) };
    });
    store('finHistory', updated);
  }
  store('bunq_connected', {
    connectedAt: new Date().toISOString(),
    accountId: 'bunq_' + uid().slice(0, 10),
    bankName: 'Bunq Business',
  });
}

// --- Generic CRM seeder (used by HubSpot, Salesforce, Zoho, Pipedrive, Brevo, Axonaut) ---
function seedCRMData(crmName, storeKey) {
  const existing = load('contacts') || [];
  if (existing.length >= 10) return;

  const firstNames = ['Marie', 'Thomas', 'Sophie', 'Pierre', 'Julie', 'Nicolas', 'Camille', 'Antoine', 'Emma', 'Lucas', 'Léa', 'Hugo', 'Chloé', 'Maxime', 'Sarah', 'Romain'];
  const lastNames = ['Martin', 'Bernard', 'Dubois', 'Laurent', 'Lefebvre', 'Moreau', 'Simon', 'Petit', 'Robert', 'Durand', 'Leroy', 'Roux', 'Garnier', 'Faure'];
  const companies = ['Acme Corp', 'TechVision', 'DataFlow', 'CloudNine SAS', 'GreenTech', 'FinServ Pro', 'MediaPulse', 'Logistik+', 'NovaStar', 'AlphaDigital', 'InnoSoft', 'BluePeak'];
  const statuses = ['prospect', 'prospect', 'lead', 'lead', 'client', 'client', 'perdu', 'partenaire'];

  const newContacts = [];
  for (let i = 0; i < 12; i++) {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${first} ${last}`;
    const company = companies[Math.floor(Math.random() * companies.length)];
    if (existing.some((c) => c.name === name) || newContacts.some((c) => c.name === name)) continue;

    const createdDaysAgo = Math.floor(Math.random() * 90) + 5;
    const createdAt = new Date(Date.now() - createdDaysAgo * 86400000).toISOString();
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    newContacts.push({
      id: uid(),
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, '')}.fr`,
      phone: `+33 ${Math.floor(Math.random() * 9) + 1} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      company,
      status,
      ca: status === 'client' ? Math.round(2000 + Math.random() * 15000) : 0,
      notes: '',
      createdAt,
      commentaires: status !== 'prospect' ? [{ text: `Importé depuis ${crmName}`, date: createdAt }] : [],
      relances: [],
      source: crmName.toLowerCase().replace(/\s/g, '_'),
    });
  }

  store('contacts', [...existing, ...newContacts]);
  store(storeKey, {
    connectedAt: new Date().toISOString(),
    syncedContacts: newContacts.length,
    crmName,
  });
}

// --- Project management tools (Monday, Asana, Notion): import as events/tasks ---
function seedProjectToolData(toolName, storeKey) {
  const existing = load('events') || [];
  const now = new Date();
  const titles = [
    `Sprint Review — ${toolName}`, `Roadmap update`, `Team standup`,
    `Client feedback review`, `Feature planning`, `Bug triage`,
    `Design review`, `Release planning`,
  ];

  const newEvents = [];
  for (let i = 0; i < 6; i++) {
    const dayOffset = Math.floor(Math.random() * 20) - 3;
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    const dateStr = d.toISOString().split('T')[0];
    const hour = 9 + Math.floor(Math.random() * 8);
    const title = titles[i % titles.length];

    if (existing.some((e) => e.title === title && e.date === dateStr)) continue;

    newEvents.push({
      id: uid(),
      title,
      date: dateStr,
      time: `${String(hour).padStart(2, '0')}:${['00', '15', '30'][Math.floor(Math.random() * 3)]}`,
      type: 'reunion',
      description: `Synchronisé depuis ${toolName}`,
      reminder: 15,
      source: toolName.toLowerCase(),
    });
  }

  store('events', [...existing, ...newEvents]);
  store(storeKey, {
    connectedAt: new Date().toISOString(),
    syncedItems: newEvents.length,
    toolName,
  });
}

// --- N26: bank data ---
function seedN26Data() {
  const history = load('finHistory') || [];
  if (history.length > 0) {
    let balance = 14000 + Math.round(Math.random() * 10000);
    const updated = history.map((row) => {
      balance += (row.result || 0);
      if (balance < 2000) balance = 2000 + Math.round(Math.random() * 3000);
      return { ...row, treso: Math.round(balance) };
    });
    store('finHistory', updated);
  }
  store('n26_connected', { connectedAt: new Date().toISOString(), accountId: 'n26_' + uid().slice(0, 10), bankName: 'N26 Business' });
}

// --- QuickBooks / Xero: accounting — enrich financial history ---
function seedAccountingData(toolName, storeKey) {
  const existing = load('finHistory') || [];
  if (existing.length > 0) {
    const updated = existing.map((row) => ({
      ...row,
      charges: row.charges + Math.round(200 + Math.random() * 600),
      result: row.ca - (row.charges + Math.round(200 + Math.random() * 600)),
    }));
    store('finHistory', updated);
  }
  store(storeKey, { connectedAt: new Date().toISOString(), companyId: toolName.toLowerCase().slice(0, 3) + '_' + uid().slice(0, 10), toolName });
}

// --- E-commerce (Shopify, WooCommerce): payment + orders data ---
function seedEcommerceData(toolName, storeKey) {
  const existing = load('finHistory') || [];
  if (existing.length > 0) {
    const updated = existing.map((row) => ({
      ...row,
      ca: row.ca + Math.round(1500 + Math.random() * 4000),
    }));
    updated.forEach((r) => { r.result = r.ca - r.charges; });
    store('finHistory', updated);
  }
  store(storeKey, { connectedAt: new Date().toISOString(), shopId: toolName.toLowerCase().slice(0, 4) + '_' + uid().slice(0, 10), toolName, ordersImported: Math.round(50 + Math.random() * 200) });
}

// --- Ad platform seeder (TikTok Ads, LinkedIn Ads, Google Ads) ---
function seedAdPlatformData(platformName, storeKey) {
  store(storeKey, {
    connectedAt: new Date().toISOString(),
    adAccountId: platformName.toLowerCase().replace(/\s/g, '_').slice(0, 6) + '_' + uid().slice(0, 12),
    platformName,
    adStatus: 'active',
  });
}

// --- Email marketing tool seeder (generic for Mailchimp, ActiveCampaign, Klaviyo, etc.) ---
function seedEmailMarketingData(toolName, storeKey) {
  store(storeKey, {
    connectedAt: new Date().toISOString(),
    listId: 'list_' + uid().slice(0, 10),
    toolName,
    subscribers: Math.round(500 + Math.random() * 5000),
  });
}

// --- Support tool seeder (Zendesk, Freshdesk, Intercom) ---
function seedSupportData(toolName, storeKey) {
  store(storeKey, {
    connectedAt: new Date().toISOString(),
    workspaceId: toolName.toLowerCase().slice(0, 4) + '_' + uid().slice(0, 10),
    toolName,
    openTickets: Math.round(5 + Math.random() * 30),
  });
}

// --- Slack: communication ---
function seedSlackData() {
  store('slack_connected', {
    connectedAt: new Date().toISOString(),
    teamId: 'T' + uid().slice(0, 10).toUpperCase(),
    teamName: (load('settings_company') || {}).name || 'Mon Workspace',
    channels: ['#general', '#sales', '#support'],
  });
}

// --- Main dispatcher ---
const INTEGRATION_SEEDERS = {
  // Paiements
  'Stripe': seedStripeData,
  'PayPal': seedPayPalData,
  'Shopify': () => seedEcommerceData('Shopify', 'shopify_connected'),
  'WooCommerce': () => seedEcommerceData('WooCommerce', 'woocommerce_connected'),
  // Banque & Comptabilité
  'Revolut': seedRevolutData,
  'Qonto': seedQontoData,
  'Shine': seedShineData,
  'Bunq': seedBunqData,
  'N26': seedN26Data,
  'QuickBooks': () => seedAccountingData('QuickBooks', 'quickbooks_connected'),
  'Xero': () => seedAccountingData('Xero', 'xero_connected'),
  // Agenda
  'Google Calendar': seedGoogleCalendarData,
  // CRM
  'GoHighLevel': seedGHLData,
  'HubSpot': () => seedCRMData('HubSpot', 'hubspot_connected'),
  'Salesforce': () => seedCRMData('Salesforce', 'salesforce_connected'),
  'Zoho': () => seedCRMData('Zoho', 'zoho_connected'),
  'Pipedrive': () => seedCRMData('Pipedrive', 'pipedrive_connected'),
  'Brevo': () => seedCRMData('Brevo', 'brevo_connected'),
  'Axonaut': () => seedCRMData('Axonaut', 'axonaut_connected'),
  // Email Marketing
  'ActiveCampaign': () => seedEmailMarketingData('ActiveCampaign', 'activecampaign_connected'),
  'Mailchimp': () => seedEmailMarketingData('Mailchimp', 'mailchimp_connected'),
  'Klaviyo': () => seedEmailMarketingData('Klaviyo', 'klaviyo_connected'),
  'Sendinblue': () => seedEmailMarketingData('Sendinblue', 'sendinblue_connected'),
  'Lemlist': () => seedEmailMarketingData('Lemlist', 'lemlist_connected'),
  'SystemeIO': () => seedEmailMarketingData('SystemeIO', 'systemeio_connected'),
  'ClickFunnels': () => seedEmailMarketingData('ClickFunnels', 'clickfunnels_connected'),
  // Projet
  'Monday': () => seedProjectToolData('Monday', 'monday_connected'),
  'Asana': () => seedProjectToolData('Asana', 'asana_connected'),
  'Notion': () => seedProjectToolData('Notion', 'notion_connected'),
  'Trello': () => seedProjectToolData('Trello', 'trello_connected'),
  'Jira': () => seedProjectToolData('Jira', 'jira_connected'),
  'Slack': seedSlackData,
  // Publicité
  'Meta Ads': seedMetaAdsData,
  'Google Ads': () => seedAdPlatformData('Google Ads', 'googleads_connected'),
  'TikTok Ads': () => seedAdPlatformData('TikTok Ads', 'tiktokads_connected'),
  'LinkedIn Ads': () => seedAdPlatformData('LinkedIn Ads', 'linkedinads_connected'),
  // Support
  'Zendesk': () => seedSupportData('Zendesk', 'zendesk_connected'),
  'Freshdesk': () => seedSupportData('Freshdesk', 'freshdesk_connected'),
  'Intercom': () => seedSupportData('Intercom', 'intercom_connected'),
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
 * Get connection metadata for an integration.
 * Automatically derives the store key from the integration name.
 * @param {string} integrationName
 * @returns {object|null}
 */
export function getIntegrationMeta(integrationName) {
  // Try known aliases first, then derive key from name
  const ALIASES = {
    'Google Calendar': 'gcal_connected',
    'GoHighLevel': 'ghl_connected',
    'Meta Ads': 'meta_connected',
    'Google Ads': 'googleads_connected',
    'TikTok Ads': 'tiktokads_connected',
    'LinkedIn Ads': 'linkedinads_connected',
    'SystemeIO': 'systemeio_connected',
    'ClickFunnels': 'clickfunnels_connected',
    'ActiveCampaign': 'activecampaign_connected',
    'WooCommerce': 'woocommerce_connected',
    'QuickBooks': 'quickbooks_connected',
  };
  const key = ALIASES[integrationName] || integrationName.toLowerCase().replace(/\s/g, '_') + '_connected';
  return load(key) || null;
}
