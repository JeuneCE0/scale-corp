import { describe, it, expect, beforeEach } from 'vitest';
import { store, load } from '../src/lib/store.js';
import { onIntegrationConnect, getIntegrationMeta } from '../src/lib/integrationData.js';

describe('integrationData.js — Integration seeders', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // --- onIntegrationConnect dispatcher ---

  it('returns true for known integrations', () => {
    expect(onIntegrationConnect('Stripe')).toBe(true);
    expect(onIntegrationConnect('PayPal')).toBe(true);
    expect(onIntegrationConnect('HubSpot')).toBe(true);
  });

  it('returns false for unknown integrations', () => {
    expect(onIntegrationConnect('UnknownTool')).toBe(false);
  });

  // --- Stripe seeder ---

  it('seedStripeData populates finHistory', () => {
    onIntegrationConnect('Stripe');
    const history = load('finHistory');
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    history.forEach((row) => {
      expect(row).toHaveProperty('key');
      expect(row).toHaveProperty('ca');
      expect(row).toHaveProperty('charges');
      expect(row).toHaveProperty('result');
      expect(row.ca).toBeGreaterThan(0);
    });
  });

  it('seedStripeData stores stripe metadata', () => {
    onIntegrationConnect('Stripe');
    const meta = load('stripe_connected');
    expect(meta).toBeTruthy();
    expect(meta.accountId).toMatch(/^acct_/);
    expect(meta.currency).toBe('eur');
  });

  it('seedStripeData does not overwrite existing financial data', () => {
    const existing = Array.from({ length: 7 }, (_, i) => ({
      key: `2025-${String(i + 1).padStart(2, '0')}`,
      ca: 10000, charges: 5000, result: 5000, treso: 20000,
    }));
    store('finHistory', existing);
    onIntegrationConnect('Stripe');
    const history = load('finHistory');
    // Should not overwrite since existing.length >= 6
    expect(history.length).toBe(7);
  });

  // --- Google Calendar seeder ---

  it('seedGoogleCalendarData populates events', () => {
    onIntegrationConnect('Google Calendar');
    const events = load('events');
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    events.forEach((e) => {
      expect(e).toHaveProperty('id');
      expect(e).toHaveProperty('title');
      expect(e).toHaveProperty('date');
      expect(e).toHaveProperty('time');
      expect(e.source).toBe('google_calendar');
    });
  });

  it('seedGoogleCalendarData stores gcal metadata', () => {
    onIntegrationConnect('Google Calendar');
    const meta = load('gcal_connected');
    expect(meta).toBeTruthy();
    expect(meta.calendarId).toBe('primary');
    expect(meta.syncedEvents).toBeGreaterThan(0);
  });

  // --- GoHighLevel / CRM seeder ---

  it('seedGHLData populates contacts', () => {
    onIntegrationConnect('GoHighLevel');
    const contacts = load('contacts');
    expect(Array.isArray(contacts)).toBe(true);
    expect(contacts.length).toBeGreaterThan(0);
    contacts.forEach((c) => {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('email');
      expect(c).toHaveProperty('status');
      expect(c.source).toBe('gohighlevel');
    });
  });

  // --- PayPal seeder ---

  it('seedPayPalData enriches existing financial history', () => {
    // Seed Stripe first to get finHistory
    onIntegrationConnect('Stripe');
    const before = load('finHistory').map((r) => r.ca);
    onIntegrationConnect('PayPal');
    const after = load('finHistory').map((r) => r.ca);
    // PayPal should add to CA
    after.forEach((ca, i) => {
      expect(ca).toBeGreaterThanOrEqual(before[i]);
    });
  });

  it('seedPayPalData stores paypal metadata', () => {
    onIntegrationConnect('PayPal');
    const meta = load('paypal_connected');
    expect(meta).toBeTruthy();
    expect(meta.merchantId).toMatch(/^MERCH/);
  });

  // --- Bank seeders (Qonto, Shine, Bunq, N26) ---

  it.each(['Qonto', 'Shine', 'Bunq', 'N26'])('%s seeder stores bank metadata', (bank) => {
    onIntegrationConnect('Stripe'); // Need finHistory first
    onIntegrationConnect(bank);
    const key = bank.toLowerCase() + '_connected';
    const meta = load(key);
    expect(meta).toBeTruthy();
    expect(meta.connectedAt).toBeTruthy();
  });

  it.each(['Qonto', 'Shine', 'Bunq', 'N26'])('%s seeder updates treasury values', (bank) => {
    onIntegrationConnect('Stripe');
    onIntegrationConnect(bank);
    const history = load('finHistory');
    history.forEach((row) => {
      expect(row.treso).toBeGreaterThan(0);
    });
  });

  // --- Generic CRM seeders ---

  it.each(['HubSpot', 'Salesforce', 'Zoho', 'Pipedrive', 'Brevo', 'Axonaut'])('%s seeder populates contacts', (crm) => {
    onIntegrationConnect(crm);
    const contacts = load('contacts');
    expect(Array.isArray(contacts)).toBe(true);
    expect(contacts.length).toBeGreaterThan(0);
    const fromCRM = contacts.filter((c) => c.source === crm.toLowerCase().replace(/\s/g, '_'));
    expect(fromCRM.length).toBeGreaterThan(0);
  });

  it.each(['HubSpot', 'Salesforce', 'Zoho', 'Pipedrive', 'Brevo', 'Axonaut'])('%s seeder stores CRM metadata', (crm) => {
    onIntegrationConnect(crm);
    const key = crm.toLowerCase() + '_connected';
    const meta = load(key);
    expect(meta).toBeTruthy();
    expect(meta.syncedContacts).toBeGreaterThan(0);
    expect(meta.crmName).toBe(crm);
  });

  // --- Project tool seeders ---

  it.each(['Monday', 'Asana', 'Notion', 'Trello', 'Jira'])('%s seeder populates events', (tool) => {
    onIntegrationConnect(tool);
    const events = load('events');
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    const fromTool = events.filter((e) => e.source === tool.toLowerCase());
    expect(fromTool.length).toBeGreaterThan(0);
  });

  // --- Slack seeder ---

  it('seedSlackData stores slack metadata', () => {
    onIntegrationConnect('Slack');
    const meta = load('slack_connected');
    expect(meta).toBeTruthy();
    expect(meta.teamId).toMatch(/^T/);
    expect(Array.isArray(meta.channels)).toBe(true);
    expect(meta.channels.length).toBeGreaterThan(0);
  });

  // --- E-commerce seeders ---

  it.each(['Shopify', 'WooCommerce'])('%s seeder enriches revenue data', (tool) => {
    onIntegrationConnect('Stripe');
    const before = load('finHistory').map((r) => r.ca);
    onIntegrationConnect(tool);
    const after = load('finHistory').map((r) => r.ca);
    after.forEach((ca, i) => {
      expect(ca).toBeGreaterThanOrEqual(before[i]);
    });
  });

  // --- Accounting seeders ---

  it.each(['QuickBooks', 'Xero'])('%s seeder stores accounting metadata', (tool) => {
    onIntegrationConnect(tool);
    const key = tool.toLowerCase() + '_connected';
    const meta = load(key);
    expect(meta).toBeTruthy();
    expect(meta.toolName).toBe(tool);
  });

  // --- Ad platform seeders ---

  it.each(['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads'])('%s seeder stores ad metadata', (platform) => {
    onIntegrationConnect(platform);
    const meta = getIntegrationMeta(platform);
    expect(meta).toBeTruthy();
    expect(meta.connectedAt).toBeTruthy();
  });

  // --- Email marketing seeders ---

  it.each(['ActiveCampaign', 'Mailchimp', 'Klaviyo', 'Sendinblue', 'Lemlist', 'SystemeIO', 'ClickFunnels'])('%s seeder stores marketing metadata', (tool) => {
    onIntegrationConnect(tool);
    const meta = getIntegrationMeta(tool);
    expect(meta).toBeTruthy();
    expect(meta.toolName).toBe(tool);
    expect(meta.subscribers).toBeGreaterThan(0);
  });

  // --- Support seeders ---

  it.each(['Zendesk', 'Freshdesk', 'Intercom'])('%s seeder stores support metadata', (tool) => {
    onIntegrationConnect(tool);
    const meta = getIntegrationMeta(tool);
    expect(meta).toBeTruthy();
    expect(meta.toolName).toBe(tool);
    expect(meta.openTickets).toBeGreaterThan(0);
  });

  // --- getIntegrationMeta ---

  it('getIntegrationMeta returns null for disconnected integrations', () => {
    expect(getIntegrationMeta('Stripe')).toBeNull();
  });

  it('getIntegrationMeta returns metadata for connected integrations', () => {
    onIntegrationConnect('Stripe');
    const meta = getIntegrationMeta('Stripe');
    expect(meta).toBeTruthy();
    expect(meta.accountId).toBeTruthy();
  });

  it('getIntegrationMeta handles aliased names correctly', () => {
    onIntegrationConnect('Google Calendar');
    const meta = getIntegrationMeta('Google Calendar');
    expect(meta).toBeTruthy();
    expect(meta.calendarId).toBe('primary');
  });

  it('getIntegrationMeta handles auto-derived keys', () => {
    onIntegrationConnect('HubSpot');
    const meta = getIntegrationMeta('HubSpot');
    expect(meta).toBeTruthy();
    expect(meta.crmName).toBe('HubSpot');
  });
});
