// HubScale — Integration Sync API (Vercel Serverless Function)
// Syncs data from connected third-party integrations

import { getSupabaseAdmin } from '../utils/supabase.js';
import { verifyAuth } from '../utils/auth.js';
import { createDecipheriv, createCipheriv, randomBytes } from 'node:crypto';

const APP_URL = process.env.VITE_APP_URL || 'https://hubscale.app';
const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY;

// OAuth configs for token refresh (mirrors oauth.js)
const REFRESH_CONFIGS = {
  'google calendar': {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  gohighlevel: {
    tokenUrl: 'https://services.leadconnectorhq.com/oauth/token',
    clientId: process.env.GHL_OAUTH_CLIENT_ID,
    clientSecret: process.env.GHL_OAUTH_CLIENT_SECRET,
  },
  revolut: {
    tokenUrl: 'https://b2b.revolut.com/api/1.0/auth/token',
    clientId: process.env.REVOLUT_OAUTH_CLIENT_ID,
    clientSecret: process.env.REVOLUT_OAUTH_CLIENT_SECRET,
  },
  stripe: {
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    clientId: process.env.STRIPE_CLIENT_ID,
    clientSecret: process.env.STRIPE_SECRET_KEY,
  },
  hubspot: {
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    clientId: process.env.HUBSPOT_CLIENT_ID,
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
  },
  paypal: {
    tokenUrl: 'https://api-m.paypal.com/v1/oauth2/token',
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    tokenExchangeMethod: 'basic_auth',
  },
  zoho: {
    tokenUrl: 'https://accounts.zoho.eu/oauth/v2/token',
    clientId: process.env.ZOHO_CLIENT_ID,
    clientSecret: process.env.ZOHO_CLIENT_SECRET,
  },
  brevo: {
    tokenUrl: 'https://app.brevo.com/oauth2/token',
    clientId: process.env.BREVO_CLIENT_ID,
    clientSecret: process.env.BREVO_CLIENT_SECRET,
  },
  activecampaign: {
    tokenUrl: 'https://app.activecampaign.com/oauth2/token',
    clientId: process.env.ACTIVECAMPAIGN_CLIENT_ID,
    clientSecret: process.env.ACTIVECAMPAIGN_CLIENT_SECRET,
  },
  'linkedin ads': {
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  },
  'google ads': {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  },
  pipedrive: {
    tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
    clientId: process.env.PIPEDRIVE_CLIENT_ID,
    clientSecret: process.env.PIPEDRIVE_CLIENT_SECRET,
  },
  salesforce: {
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    clientId: process.env.SALESFORCE_CLIENT_ID,
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
  },
  mailchimp: {
    tokenUrl: 'https://login.mailchimp.com/oauth2/token',
    clientId: process.env.MAILCHIMP_CLIENT_ID,
    clientSecret: process.env.MAILCHIMP_CLIENT_SECRET,
  },
  qonto: {
    tokenUrl: 'https://connect.qonto.com/oauth2/token',
    clientId: process.env.QONTO_OAUTH_CLIENT_ID,
    clientSecret: process.env.QONTO_OAUTH_CLIENT_SECRET,
  },
  asana: {
    tokenUrl: 'https://app.asana.com/-/oauth_token',
    clientId: process.env.ASANA_CLIENT_ID,
    clientSecret: process.env.ASANA_CLIENT_SECRET,
  },
  monday: {
    tokenUrl: 'https://auth.monday.com/oauth2/token',
    clientId: process.env.MONDAY_CLIENT_ID,
    clientSecret: process.env.MONDAY_CLIENT_SECRET,
  },
  jira: {
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    clientId: process.env.JIRA_CLIENT_ID,
    clientSecret: process.env.JIRA_CLIENT_SECRET,
  },
  zendesk: {
    tokenUrl: null, // Per-subdomain: https://{subdomain}.zendesk.com/oauth/tokens
    clientId: process.env.ZENDESK_CLIENT_ID,
    clientSecret: process.env.ZENDESK_CLIENT_SECRET,
  },
  intercom: {
    tokenUrl: 'https://api.intercom.io/auth/eagle/token',
    clientId: process.env.INTERCOM_CLIENT_ID,
    clientSecret: process.env.INTERCOM_CLIENT_SECRET,
  },
};

function decrypt(encoded) {
  if (!encoded || !ENCRYPTION_KEY) return encoded;
  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const buf = Buffer.from(encoded, 'base64');
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8');
  } catch {
    return encoded; // Fallback for unencrypted legacy tokens
  }
}

function encrypt(plaintext) {
  if (!plaintext || !ENCRYPTION_KEY) return plaintext;
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

// Refresh expired OAuth tokens automatically before syncing
async function refreshAccessToken(sb, integ) {
  const config = REFRESH_CONFIGS[integ.name];
  if (!config || !config.clientId) return null;

  const refreshToken = decrypt(integ.refresh_token_enc);
  if (!refreshToken) return null;

  // Check if token is still valid (5 min buffer)
  if (integ.token_expires_at) {
    const expiresAt = new Date(integ.token_expires_at);
    if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return null; // Token still valid
    }
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const tokenRes = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    // Mark integration as needing re-auth
    await sb.from('sync_history').insert({
      org_id: integ.org_id,
      integration_name: integ.name,
      action: 'error',
      details: 'Token refresh failed — reconnection required',
    });
    throw new Error(`Token expired for ${integ.name}. Reconnection required.`);
  }

  const tokens = await tokenRes.json();
  const newAccessToken = tokens.access_token;

  // Update stored tokens
  const updates = {
    access_token_enc: encrypt(newAccessToken),
    token_expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
  };
  // Some providers rotate refresh tokens
  if (tokens.refresh_token) {
    updates.refresh_token_enc = encrypt(tokens.refresh_token);
  }

  await sb.from('integrations').update(updates)
    .eq('org_id', integ.org_id)
    .eq('name', integ.name);

  return newAccessToken;
}

// ─── Stripe Sync ───

async function syncStripe(sb, orgId, accessToken) {
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(accessToken);

  // Fetch charges (payments received)
  const charges = await stripe.charges.list({ limit: 100 });
  const transactions = (charges.data || []).map((c) => ({
    org_id: orgId,
    source: 'stripe',
    external_id: c.id,
    amount: c.amount / 100,
    currency: c.currency,
    status: c.status,
    description: c.description || '',
    date: new Date(c.created * 1000).toISOString().split('T')[0],
    created_at: new Date(c.created * 1000).toISOString(),
  }));

  // Fetch customers as contacts
  const customers = await stripe.customers.list({ limit: 100 });
  const contacts = (customers.data || []).map((cu) => {
    const fullName = cu.name || cu.email || 'Sans nom';
    const nameParts = fullName.split(' ');
    return {
      org_id: orgId,
      source: 'stripe',
      external_id: cu.id,
      name: fullName,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: cu.email || '',
      phone: cu.phone || '',
      company: cu.metadata?.company || '',
      status: 'client',
      created_at: new Date(cu.created * 1000).toISOString(),
    };
  });

  // Fetch balance
  const balance = await stripe.balance.retrieve();
  const available = balance.available || [];
  const totalBalance = available.reduce((s, b) => s + b.amount, 0) / 100;
  const currency = available[0]?.currency || 'eur';

  if (transactions.length > 0) {
    await sb.from('transactions').upsert(transactions, { onConflict: 'org_id,source,external_id' });
  }
  if (contacts.length > 0) {
    await sb.from('contacts').upsert(contacts, { onConflict: 'org_id,source,external_id' });
  }

  return {
    synced: transactions.length + contacts.length,
    data: { transactions, contacts, balance: { amount: totalBalance, currency } },
  };
}

// ─── Google Calendar Sync ───

async function syncGoogleCalendar(sb, orgId, accessToken) {
  const now = new Date().toISOString();
  const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax: now,
    maxResults: '250',
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!calRes.ok) {
    const err = await calRes.text();
    throw new Error(`Google Calendar API error: ${calRes.status} — ${err}`);
  }

  const data = await calRes.json();
  const items = data.items || [];

  const rows = items.map((ev) => {
    const startRaw = ev.start?.dateTime || ev.start?.date || null;
    return {
      org_id: orgId,
      source: 'google_calendar',
      external_id: ev.id,
      title: ev.summary || '',
      description: ev.description || '',
      date: startRaw ? new Date(startRaw).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      start_at: startRaw,
      end_at: ev.end?.dateTime || ev.end?.date || null,
      location: ev.location || '',
      metadata: { htmlLink: ev.htmlLink, status: ev.status },
    };
  });

  if (rows.length > 0) {
    await sb.from('events').upsert(rows, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: rows.length, data: { events: rows } };
}

// ─── HubSpot Sync ───

async function syncHubSpot(sb, orgId, accessToken) {
  const hsRes = await fetch(
    'https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,company',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!hsRes.ok) {
    const err = await hsRes.text();
    throw new Error(`HubSpot API error: ${hsRes.status} — ${err}`);
  }

  const data = await hsRes.json();
  const results = data.results || [];

  const rows = results.map((c) => {
    const firstName = c.properties?.firstname || '';
    const lastName = c.properties?.lastname || '';
    return {
      org_id: orgId,
      source: 'hubspot',
      external_id: c.id,
      name: `${firstName} ${lastName}`.trim() || c.properties?.email || 'Sans nom',
      first_name: firstName,
      last_name: lastName,
      email: c.properties?.email || '',
      phone: c.properties?.phone || '',
      company: c.properties?.company || '',
      metadata: { hs_created_at: c.createdAt, hs_updated_at: c.updatedAt },
    };
  });

  if (rows.length > 0) {
    await sb.from('contacts').upsert(rows, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: rows.length, data: { contacts: rows } };
}

// ─── Revolut Sync ───

async function syncRevolut(sb, orgId, accessToken) {
  const REV_BASE = 'https://b2b.revolut.com/api/1.0';
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Fetch accounts
  const acctRes = await fetch(`${REV_BASE}/accounts`, { headers });
  if (!acctRes.ok) throw new Error(`Revolut accounts error: ${acctRes.status}`);
  const accounts = await acctRes.json();

  // Fetch transactions (last 2 months)
  const from = new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split('T')[0];
  const txRes = await fetch(`${REV_BASE}/transactions?from=${from}&count=500`, { headers });
  if (!txRes.ok) throw new Error(`Revolut transactions error: ${txRes.status}`);
  const transactions = await txRes.json();

  const rows = (transactions || []).map((tx) => {
    const leg = tx.legs?.[0] || {};
    return {
      org_id: orgId,
      source: 'revolut',
      external_id: tx.id,
      amount: leg.amount || 0,
      currency: leg.currency || 'EUR',
      status: tx.state || 'completed',
      description: leg.description || tx.reference || '',
      created_at: tx.created_at || new Date().toISOString(),
      metadata: { type: tx.type, account_id: leg.account_id },
    };
  });

  if (rows.length > 0) {
    await sb.from('transactions').upsert(rows, { onConflict: 'org_id,source,external_id' });
  }

  // Store account balances
  const balanceRows = (accounts || []).map((a) => ({
    org_id: orgId,
    source: 'revolut',
    external_id: a.id,
    name: a.name || 'Compte',
    balance: a.balance,
    currency: a.currency,
    metadata: { state: a.state },
  }));

  if (balanceRows.length > 0) {
    await sb.from('bank_accounts').upsert(balanceRows, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: rows.length + balanceRows.length, data: { transactions: rows, bankAccounts: balanceRows } };
}

// ─── Qonto Sync ───

async function syncQonto(sb, orgId, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Fetch organization info
  const orgRes = await fetch('https://thirdparty.qonto.com/v2/organization', { headers });
  if (!orgRes.ok) throw new Error(`Qonto organization error: ${orgRes.status}`);
  const orgData = await orgRes.json();
  const bankAccounts = orgData.organization?.bank_accounts || [];

  // Fetch transactions for each bank account
  let allTx = [];
  for (const acct of bankAccounts) {
    const txRes = await fetch(
      `https://thirdparty.qonto.com/v2/transactions?slug=${encodeURIComponent(acct.slug)}&iban=${encodeURIComponent(acct.iban)}&per_page=100`,
      { headers },
    );
    if (txRes.ok) {
      const txData = await txRes.json();
      allTx = allTx.concat((txData.transactions || []).map((tx) => ({
        org_id: orgId,
        source: 'qonto',
        external_id: tx.transaction_id,
        amount: tx.side === 'credit' ? tx.amount : -tx.amount,
        currency: tx.currency,
        status: tx.status,
        description: tx.label || '',
        created_at: tx.settled_at || tx.emitted_at || new Date().toISOString(),
        metadata: { category: tx.category, operation_type: tx.operation_type },
      })));
    }
  }

  if (allTx.length > 0) {
    await sb.from('transactions').upsert(allTx, { onConflict: 'org_id,source,external_id' });
  }

  // Store bank accounts
  const acctRows = bankAccounts.map((a) => ({
    org_id: orgId,
    source: 'qonto',
    external_id: a.slug,
    name: a.name || 'Compte Qonto',
    balance: a.balance,
    currency: a.currency,
    metadata: { iban: a.iban, bic: a.bic },
  }));

  if (acctRows.length > 0) {
    await sb.from('bank_accounts').upsert(acctRows, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: allTx.length + acctRows.length, data: { transactions: allTx, bankAccounts: acctRows } };
}

// ─── GoHighLevel Sync ───

async function syncGoHighLevel(sb, orgId, accessToken, metadata) {
  const GHL_BASE = 'https://services.leadconnectorhq.com';
  const locationId = metadata?.location_id;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  };

  let synced = 0;

  // Fetch contacts (paginated)
  let allContacts = [];
  let startAfterId = null;
  let startAfter = null;
  let page = 0;
  do {
    let url = `${GHL_BASE}/contacts/?locationId=${locationId}&limit=100`;
    if (startAfterId) url += `&startAfter=${startAfter}&startAfterId=${startAfterId}`;
    const res = await fetch(url, { headers });
    if (!res.ok) break;
    const data = await res.json();
    const batch = data.contacts || [];
    allContacts = allContacts.concat(batch);
    startAfterId = data.meta?.startAfterId || null;
    startAfter = data.meta?.startAfter || null;
    page++;
  } while (startAfterId && page < 10);

  const contactRows = allContacts.map((c) => ({
    org_id: orgId,
    source: 'gohighlevel',
    external_id: c.id,
    name: c.contactName || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Sans nom',
    first_name: c.firstName || '',
    last_name: c.lastName || '',
    email: c.email || '',
    phone: c.phone || '',
    company: c.companyName || '',
    metadata: { tags: c.tags, source: c.source, dateAdded: c.dateAdded },
  }));

  if (contactRows.length > 0) {
    await sb.from('contacts').upsert(contactRows, { onConflict: 'org_id,source,external_id' });
    synced += contactRows.length;
  }

  // Fetch pipelines and opportunities
  const pipRes = await fetch(`${GHL_BASE}/opportunities/pipelines?locationId=${locationId}`, { headers });
  if (pipRes.ok) {
    const pipData = await pipRes.json();
    const pipelines = pipData.pipelines || [];

    for (const pip of pipelines) {
      const oppRes = await fetch(
        `${GHL_BASE}/opportunities/search?location_id=${locationId}&pipeline_id=${pip.id}&limit=100`,
        { headers },
      );
      if (!oppRes.ok) continue;
      const oppData = await oppRes.json();
      const opps = oppData.opportunities || [];

      const stageMap = {};
      (pip.stages || []).forEach((s) => { stageMap[s.id] = s.name; });

      const oppRows = opps.map((o) => ({
        org_id: orgId,
        source: 'gohighlevel',
        external_id: o.id,
        contact_external_id: o.contact?.id || null,
        pipeline_name: pip.name,
        stage: stageMap[o.pipelineStageId] || o.pipelineStageId,
        value: o.monetaryValue || 0,
        status: o.status || 'open',
        metadata: { source: o.source, createdAt: o.createdAt },
      }));

      if (oppRows.length > 0) {
        await sb.from('deals').upsert(oppRows, { onConflict: 'org_id,source,external_id' });
        synced += oppRows.length;
      }
    }
  }

  // Fetch calendar events from GHL
  const calRes = await fetch(`${GHL_BASE}/calendars/?locationId=${locationId}`, { headers });
  let eventRows = [];
  if (calRes.ok) {
    const calData = await calRes.json();
    const calendars = calData.calendars || [];

    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endTime = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

    for (const cal of calendars) {
      const evtRes = await fetch(
        `${GHL_BASE}/calendars/events?locationId=${locationId}&calendarId=${cal.id}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`,
        { headers },
      );
      if (!evtRes.ok) continue;
      const evtData = await evtRes.json();

      const rows = (evtData.events || []).map((ev) => ({
        org_id: orgId,
        source: 'gohighlevel',
        external_id: ev.id,
        title: ev.title || ev.calendarName || 'RDV GHL',
        description: ev.notes || '',
        date: ev.startTime ? new Date(ev.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        start_at: ev.startTime || null,
        end_at: ev.endTime || null,
        location: ev.address || '',
        metadata: {
          calendarId: cal.id,
          calendarName: cal.name,
          status: ev.appointmentStatus,
          contactId: ev.contactId,
        },
      }));

      eventRows = eventRows.concat(rows);
    }

    if (eventRows.length > 0) {
      await sb.from('events').upsert(eventRows, { onConflict: 'org_id,source,external_id' });
      synced += eventRows.length;
    }
  }

  return { synced, data: { contacts: contactRows, events: eventRows } };
}

// ─── Meta Ads Sync ───

async function syncMetaAds(sb, orgId, accessToken, metadata) {
  const GRAPH_BASE = 'https://graph.facebook.com/v21.0';
  const adAccounts = metadata?.ad_accounts || [];

  let synced = 0;
  let allRows = [];

  for (const acct of adAccounts) {
    const acctId = acct.id || acct;
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
    const until = now.toISOString().split('T')[0];

    const fields = 'campaign_name,campaign_id,impressions,clicks,spend,reach,cpc,cpm,ctr,actions,action_values,date_start,date_stop';
    const params = new URLSearchParams({
      fields,
      time_range: JSON.stringify({ since, until }),
      time_increment: 'monthly',
      level: 'campaign',
      limit: '500',
      access_token: accessToken,
    });

    const res = await fetch(`${GRAPH_BASE}/${acctId}/insights?${params}`);
    if (!res.ok) continue;
    const data = await res.json();

    const rows = (data.data || []).map((row) => {
      const actions = row.actions || [];
      const actionValues = row.action_values || [];
      const leads = Number(actions.find((a) => a.action_type === 'lead')?.value || 0);
      const purchases = Number(actions.find((a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0);
      const revenue = Number(actionValues.find((a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0);

      return {
        org_id: orgId,
        source: 'meta_ads',
        external_id: `${row.campaign_id}_${row.date_start}`,
        campaign_name: row.campaign_name || '',
        campaign_id: row.campaign_id || '',
        date: row.date_start,
        impressions: Number(row.impressions || 0),
        clicks: Number(row.clicks || 0),
        spend: Number(row.spend || 0),
        reach: Number(row.reach || 0),
        leads,
        conversions: purchases,
        revenue,
        metadata: { cpc: row.cpc, cpm: row.cpm, ctr: row.ctr, date_stop: row.date_stop },
      };
    });

    if (rows.length > 0) {
      await sb.from('ad_insights').upsert(rows, { onConflict: 'org_id,source,external_id' });
      synced += rows.length;
      allRows = allRows.concat(rows);
    }
  }

  return { synced, data: { adInsights: allRows } };
}

// ─── Google Ads Sync ───

async function syncGoogleAds(sb, orgId, accessToken) {
  const GADS_BASE = 'https://googleads.googleapis.com/v17';
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) throw new Error('Google Ads developer token not configured');

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': devToken,
    'Content-Type': 'application/json',
  };

  // List accessible customers
  const custRes = await fetch(`${GADS_BASE}/customers:listAccessibleCustomers`, { headers });
  if (!custRes.ok) throw new Error(`Google Ads customers error: ${custRes.status}`);
  const custData = await custRes.json();
  const customerIds = (custData.resourceNames || []).map((r) => r.replace('customers/', ''));

  let synced = 0;
  let allRows = [];
  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
  const until = now.toISOString().split('T')[0];
  // Validate date format to prevent injection in GAQL query
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRe.test(since) || !dateRe.test(until)) throw new Error('Invalid date range');

  for (const customerId of customerIds.slice(0, 5)) {
    const query = `SELECT campaign.name, campaign.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc, metrics.average_cpm, segments.date FROM campaign WHERE segments.date BETWEEN '${since}' AND '${until}' AND campaign.status != 'REMOVED' ORDER BY segments.date`;

    const res = await fetch(`${GADS_BASE}/customers/${customerId}/googleAds:searchStream`, {
      method: 'POST', headers, body: JSON.stringify({ query }),
    });
    if (!res.ok) continue;
    const raw = await res.json();

    const rows = (raw[0]?.results || []).map((row) => {
      const m = row.metrics || {};
      const spend = (Number(m.costMicros) || 0) / 1e6;
      const revenue = Number(m.conversionsValue) || 0;

      return {
        org_id: orgId,
        source: 'google_ads',
        external_id: `${row.campaign?.id}_${row.segments?.date}`,
        campaign_name: row.campaign?.name || '',
        campaign_id: String(row.campaign?.id || ''),
        date: row.segments?.date || '',
        impressions: Number(m.impressions) || 0,
        clicks: Number(m.clicks) || 0,
        spend: Math.round(spend * 100) / 100,
        conversions: Number(m.conversions) || 0,
        revenue: Math.round(revenue * 100) / 100,
        metadata: { ctr: m.ctr, cpc: (Number(m.averageCpc) || 0) / 1e6, cpm: (Number(m.averageCpm) || 0) / 1e6 },
      };
    });

    if (rows.length > 0) {
      await sb.from('ad_insights').upsert(rows, { onConflict: 'org_id,source,external_id' });
      synced += rows.length;
      allRows = allRows.concat(rows);
    }
  }

  return { synced, data: { adInsights: allRows } };
}

// ─── TikTok Ads Sync ───

async function syncTikTokAds(sb, orgId, accessToken, metadata) {
  const TIKTOK_BASE = 'https://business-api.tiktok.com/open_api/v1.3';
  const advertiserIds = metadata?.advertiser_ids || [];

  const headers = {
    'Access-Token': accessToken,
    'Content-Type': 'application/json',
  };

  let synced = 0;
  let allRows = [];
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];

  for (const advId of advertiserIds.slice(0, 5)) {
    const body = {
      advertiser_id: advId,
      report_type: 'BASIC',
      data_level: 'AUCTION_CAMPAIGN',
      dimensions: ['campaign_id'],
      metrics: ['spend', 'impressions', 'clicks', 'conversion', 'cost_per_conversion', 'cpc', 'cpm', 'ctr', 'reach'],
      start_date: startDate,
      end_date: endDate,
      page_size: 100,
    };

    const res = await fetch(`${TIKTOK_BASE}/report/integrated/get/`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    if (!res.ok) continue;
    const data = await res.json();

    const rows = (data.data?.list || []).map((row) => {
      const m = row.metrics || {};
      return {
        org_id: orgId,
        source: 'tiktok_ads',
        external_id: `${row.dimensions?.campaign_id}_${startDate}`,
        campaign_id: row.dimensions?.campaign_id || '',
        campaign_name: '',
        date: startDate,
        impressions: Number(m.impressions) || 0,
        clicks: Number(m.clicks) || 0,
        spend: Number(m.spend) || 0,
        conversions: Number(m.conversion) || 0,
        revenue: 0,
        metadata: { cpc: m.cpc, cpm: m.cpm, ctr: m.ctr, reach: m.reach },
      };
    });

    if (rows.length > 0) {
      await sb.from('ad_insights').upsert(rows, { onConflict: 'org_id,source,external_id' });
      synced += rows.length;
      allRows = allRows.concat(rows);
    }
  }

  return { synced, data: { adInsights: allRows } };
}

// ─── Salesforce Sync ───

async function syncSalesforce(sb, orgId, accessToken) {
  // Query contacts via Salesforce REST API
  const queryRes = await fetch(
    'https://login.salesforce.com/services/data/v59.0/query?q=' + encodeURIComponent(
      'SELECT Id, FirstName, LastName, Email, Phone, Account.Name FROM Contact ORDER BY CreatedDate DESC LIMIT 200'
    ),
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!queryRes.ok) throw new Error(`Salesforce error: ${queryRes.status}`);
  const data = await queryRes.json();

  const rows = (data.records || []).map((c) => ({
    org_id: orgId,
    source: 'salesforce',
    external_id: c.Id,
    name: `${c.FirstName || ''} ${c.LastName || ''}`.trim() || 'Sans nom',
    first_name: c.FirstName || '',
    last_name: c.LastName || '',
    email: c.Email || '',
    phone: c.Phone || '',
    company: c.Account?.Name || '',
    metadata: {},
  }));

  if (rows.length > 0) {
    await sb.from('contacts').upsert(rows, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: rows.length, data: { contacts: rows } };
}

// ─── Pipedrive Sync ───

async function syncPipedrive(sb, orgId, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const personsRes = await fetch('https://api.pipedrive.com/v1/persons?limit=200', { headers });
  if (!personsRes.ok) throw new Error(`Pipedrive error: ${personsRes.status}`);
  const personsData = await personsRes.json();

  const rows = (personsData.data || []).map((p) => ({
    org_id: orgId,
    source: 'pipedrive',
    external_id: String(p.id),
    name: p.name || 'Sans nom',
    first_name: p.first_name || '',
    last_name: p.last_name || '',
    email: (p.email || [{ value: '' }])[0]?.value || '',
    phone: (p.phone || [{ value: '' }])[0]?.value || '',
    company: p.org_name || '',
    metadata: { owner_name: p.owner_name },
  }));

  if (rows.length > 0) {
    await sb.from('contacts').upsert(rows, { onConflict: 'org_id,source,external_id' });
  }

  // Sync deals
  const dealsRes = await fetch('https://api.pipedrive.com/v1/deals?limit=200&status=all_not_deleted', { headers });
  let dealsSynced = 0;
  let dealRows = [];
  if (dealsRes.ok) {
    const dealsData = await dealsRes.json();
    dealRows = (dealsData.data || []).map((d) => ({
      org_id: orgId,
      source: 'pipedrive',
      external_id: String(d.id),
      pipeline_name: d.pipeline_id ? `Pipeline ${d.pipeline_id}` : '',
      stage: d.stage_id ? `Stage ${d.stage_id}` : '',
      value: d.value || 0,
      status: d.status || 'open',
      metadata: { title: d.title, currency: d.currency, add_time: d.add_time },
    }));

    if (dealRows.length > 0) {
      await sb.from('deals').upsert(dealRows, { onConflict: 'org_id,source,external_id' });
      dealsSynced = dealRows.length;
    }
  }

  return { synced: rows.length + dealsSynced, data: { contacts: rows, deals: dealRows || [] } };
}

// ─── Mailchimp Sync ───

async function syncMailchimp(sb, orgId, accessToken) {
  // Get server prefix from metadata endpoint
  const metaRes = await fetch('https://login.mailchimp.com/oauth2/metadata', {
    headers: { Authorization: `OAuth ${accessToken}` },
  });
  if (!metaRes.ok) throw new Error(`Mailchimp metadata error: ${metaRes.status}`);
  const metaData = await metaRes.json();
  const dc = metaData.dc; // e.g. 'us21'

  const listsRes = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists?count=10`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listsRes.ok) throw new Error(`Mailchimp lists error: ${listsRes.status}`);
  const listsData = await listsRes.json();

  let synced = 0;
  let allRows = [];
  for (const list of (listsData.lists || []).slice(0, 3)) {
    const membersRes = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${list.id}/members?count=200&fields=members.id,members.email_address,members.full_name,members.status`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!membersRes.ok) continue;
    const membersData = await membersRes.json();

    const rows = (membersData.members || []).map((m) => {
      const fullName = m.full_name || '';
      const nameParts = fullName.split(' ');
      return {
        org_id: orgId,
        source: 'mailchimp',
        external_id: m.id,
        name: fullName,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: m.email_address || '',
        metadata: { list_id: list.id, list_name: list.name, status: m.status },
      };
    });

    if (rows.length > 0) {
      await sb.from('contacts').upsert(rows, { onConflict: 'org_id,source,external_id' });
      synced += rows.length;
      allRows = allRows.concat(rows);
    }
  }

  return { synced, data: { contacts: allRows } };
}

// ─── PayPal Sync ───

async function syncPayPal(sb, orgId, accessToken) {
  const PAYPAL_BASE = 'https://api-m.paypal.com/v1';
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // Fetch transactions (last 30 days)
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('.')[0] + '-0000';
  const endDate = now.toISOString().split('.')[0] + '-0000';

  const txRes = await fetch(
    `${PAYPAL_BASE}/reporting/transactions?start_date=${startDate}&end_date=${endDate}&fields=all&page_size=100`,
    { headers },
  );
  if (!txRes.ok) throw new Error(`PayPal transactions error: ${txRes.status}`);
  const txData = await txRes.json();

  const transactions = (txData.transaction_details || []).map((tx) => {
    const info = tx.transaction_info || {};
    const payer = tx.payer_info || {};
    return {
      org_id: orgId,
      source: 'paypal',
      external_id: info.transaction_id,
      amount: Number(info.transaction_amount?.value || 0),
      currency: info.transaction_amount?.currency_code || 'EUR',
      status: info.transaction_status || 'S',
      description: info.transaction_subject || info.transaction_note || '',
      date: info.transaction_initiation_date ? new Date(info.transaction_initiation_date).toISOString().split('T')[0] : now.toISOString().split('T')[0],
      created_at: info.transaction_initiation_date || now.toISOString(),
      metadata: {
        payer_email: payer.email_address,
        payer_name: payer.payer_name?.alternate_full_name,
        fee: info.fee_amount?.value,
      },
    };
  });

  // Extract contacts from payer info
  const contactMap = new Map();
  (txData.transaction_details || []).forEach((tx) => {
    const payer = tx.payer_info || {};
    if (payer.email_address && !contactMap.has(payer.email_address)) {
      const fullName = payer.payer_name?.alternate_full_name || payer.email_address;
      const nameParts = fullName.split(' ');
      contactMap.set(payer.email_address, {
        org_id: orgId,
        source: 'paypal',
        external_id: payer.account_id || payer.email_address,
        name: fullName,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: payer.email_address,
        phone: '',
        company: '',
        status: 'client',
      });
    }
  });
  const contacts = Array.from(contactMap.values());

  if (transactions.length > 0) {
    await sb.from('transactions').upsert(transactions, { onConflict: 'org_id,source,external_id' });
  }
  if (contacts.length > 0) {
    await sb.from('contacts').upsert(contacts, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: transactions.length + contacts.length, data: { transactions, contacts } };
}

// ─── Shopify Sync ───

async function syncShopify(sb, orgId, accessToken, metadata) {
  const shopDomain = metadata?.shop_domain;
  if (!shopDomain) throw new Error('Shopify shop domain not configured');
  const SHOP_BASE = `https://${shopDomain}/admin/api/2024-01`;
  const headers = { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' };

  // Fetch orders (last 60 days)
  const sinceDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const ordersRes = await fetch(
    `${SHOP_BASE}/orders.json?status=any&created_at_min=${sinceDate}&limit=250`,
    { headers },
  );
  if (!ordersRes.ok) throw new Error(`Shopify orders error: ${ordersRes.status}`);
  const ordersData = await ordersRes.json();

  const transactions = (ordersData.orders || []).map((o) => ({
    org_id: orgId,
    source: 'shopify',
    external_id: String(o.id),
    amount: Number(o.total_price || 0),
    currency: o.currency || 'EUR',
    status: o.financial_status || 'paid',
    description: `Commande #${o.order_number || o.name || o.id}`,
    date: o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    created_at: o.created_at || new Date().toISOString(),
    metadata: { fulfillment_status: o.fulfillment_status, gateway: o.gateway },
  }));

  // Fetch customers
  const custRes = await fetch(`${SHOP_BASE}/customers.json?limit=250`, { headers });
  let contacts = [];
  if (custRes.ok) {
    const custData = await custRes.json();
    contacts = (custData.customers || []).map((c) => ({
      org_id: orgId,
      source: 'shopify',
      external_id: String(c.id),
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || 'Sans nom',
      first_name: c.first_name || '',
      last_name: c.last_name || '',
      email: c.email || '',
      phone: c.phone || '',
      company: c.default_address?.company || '',
      status: c.orders_count > 0 ? 'client' : 'prospect',
      metadata: { orders_count: c.orders_count, total_spent: c.total_spent },
    }));
  }

  // Fetch products count for metadata
  const prodRes = await fetch(`${SHOP_BASE}/products/count.json`, { headers });
  let productsCount = 0;
  if (prodRes.ok) {
    const prodData = await prodRes.json();
    productsCount = prodData.count || 0;
  }

  if (transactions.length > 0) {
    await sb.from('transactions').upsert(transactions, { onConflict: 'org_id,source,external_id' });
  }
  if (contacts.length > 0) {
    await sb.from('contacts').upsert(contacts, { onConflict: 'org_id,source,external_id' });
  }

  return {
    synced: transactions.length + contacts.length,
    data: { transactions, contacts, meta: { productsCount } },
  };
}

// ─── Zoho CRM Sync ───

async function syncZoho(sb, orgId, accessToken) {
  const ZOHO_BASE = 'https://www.zohoapis.eu/crm/v2';
  const headers = { Authorization: `Zoho-oauthtoken ${accessToken}` };

  // Fetch contacts
  const contactsRes = await fetch(`${ZOHO_BASE}/Contacts?per_page=200`, { headers });
  if (!contactsRes.ok) throw new Error(`Zoho Contacts error: ${contactsRes.status}`);
  const contactsData = await contactsRes.json();

  const contactRows = (contactsData.data || []).map((c) => ({
    org_id: orgId,
    source: 'zoho',
    external_id: c.id,
    name: c.Full_Name || `${c.First_Name || ''} ${c.Last_Name || ''}`.trim() || 'Sans nom',
    first_name: c.First_Name || '',
    last_name: c.Last_Name || '',
    email: c.Email || '',
    phone: c.Phone || c.Mobile || '',
    company: c.Account_Name?.name || '',
    metadata: { lead_source: c.Lead_Source, owner: c.Owner?.name },
  }));

  // Fetch deals
  const dealsRes = await fetch(`${ZOHO_BASE}/Deals?per_page=200`, { headers });
  let dealRows = [];
  if (dealsRes.ok) {
    const dealsData = await dealsRes.json();
    dealRows = (dealsData.data || []).map((d) => ({
      org_id: orgId,
      source: 'zoho',
      external_id: d.id,
      pipeline_name: d.Pipeline || 'Standard',
      stage: d.Stage || '',
      value: Number(d.Amount || 0),
      status: d.Stage === 'Closed Won' ? 'won' : d.Stage === 'Closed Lost' ? 'lost' : 'open',
      contact_external_id: d.Contact_Name?.id || null,
      metadata: { closing_date: d.Closing_Date, probability: d.Probability, owner: d.Owner?.name },
    }));
  }

  if (contactRows.length > 0) {
    await sb.from('contacts').upsert(contactRows, { onConflict: 'org_id,source,external_id' });
  }
  if (dealRows.length > 0) {
    await sb.from('deals').upsert(dealRows, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: contactRows.length + dealRows.length, data: { contacts: contactRows, deals: dealRows } };
}

// ─── Brevo Sync ───

async function syncBrevo(sb, orgId, accessToken) {
  const BREVO_BASE = 'https://api.brevo.com/v3';
  const headers = { 'api-key': accessToken, 'Content-Type': 'application/json' };

  // Fetch contacts
  const contactsRes = await fetch(`${BREVO_BASE}/contacts?limit=200&offset=0`, { headers });
  if (!contactsRes.ok) throw new Error(`Brevo contacts error: ${contactsRes.status}`);
  const contactsData = await contactsRes.json();

  const rows = (contactsData.contacts || []).map((c) => {
    const attrs = c.attributes || {};
    return {
      org_id: orgId,
      source: 'brevo',
      external_id: String(c.id),
      name: `${attrs.PRENOM || attrs.FIRSTNAME || ''} ${attrs.NOM || attrs.LASTNAME || ''}`.trim() || c.email || 'Sans nom',
      first_name: attrs.PRENOM || attrs.FIRSTNAME || '',
      last_name: attrs.NOM || attrs.LASTNAME || '',
      email: c.email || '',
      phone: attrs.SMS || attrs.PHONE || '',
      company: attrs.SOCIETE || attrs.COMPANY || '',
      metadata: {
        lists: c.listIds,
        email_blacklisted: c.emailBlacklisted,
        sms_blacklisted: c.smsBlacklisted,
      },
    };
  });

  // Fetch email campaign stats
  const campaignsRes = await fetch(`${BREVO_BASE}/emailCampaigns?limit=50&offset=0&status=sent`, { headers });
  let campaignMeta = [];
  if (campaignsRes.ok) {
    const campaignsData = await campaignsRes.json();
    campaignMeta = (campaignsData.campaigns || []).slice(0, 20).map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      sent: c.statistics?.globalStats?.sent || 0,
      opened: c.statistics?.globalStats?.uniqueOpens || 0,
      clicked: c.statistics?.globalStats?.uniqueClicks || 0,
    }));
  }

  if (rows.length > 0) {
    await sb.from('contacts').upsert(rows, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: rows.length, data: { contacts: rows, campaigns: campaignMeta } };
}

// ─── ActiveCampaign Sync ───

async function syncActiveCampaign(sb, orgId, accessToken, metadata) {
  const baseUrl = metadata?.api_url || metadata?.apiUrl;
  if (!baseUrl) throw new Error('ActiveCampaign API URL not configured');
  const headers = { 'Api-Token': accessToken };

  // Fetch contacts
  const contactsRes = await fetch(`${baseUrl}/api/3/contacts?limit=100`, { headers });
  if (!contactsRes.ok) throw new Error(`ActiveCampaign contacts error: ${contactsRes.status}`);
  const contactsData = await contactsRes.json();

  const rows = (contactsData.contacts || []).map((c) => ({
    org_id: orgId,
    source: 'activecampaign',
    external_id: c.id,
    name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Sans nom',
    first_name: c.firstName || '',
    last_name: c.lastName || '',
    email: c.email || '',
    phone: c.phone || '',
    company: '',
    metadata: { created_timestamp: c.cdate, updated_timestamp: c.udate },
  }));

  // Fetch deals
  const dealsRes = await fetch(`${baseUrl}/api/3/deals?limit=100`, { headers });
  let dealRows = [];
  if (dealsRes.ok) {
    const dealsData = await dealsRes.json();
    dealRows = (dealsData.deals || []).map((d) => ({
      org_id: orgId,
      source: 'activecampaign',
      external_id: d.id,
      pipeline_name: d.group || d.pipeline || '',
      stage: d.stage || '',
      value: Number(d.value || 0) / 100, // AC stores values in cents
      status: d.status === '1' ? 'won' : d.status === '2' ? 'lost' : 'open',
      metadata: { title: d.title, currency: d.currency, owner: d.owner },
    }));
  }

  if (rows.length > 0) {
    await sb.from('contacts').upsert(rows, { onConflict: 'org_id,source,external_id' });
  }
  if (dealRows.length > 0) {
    await sb.from('deals').upsert(dealRows, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: rows.length + dealRows.length, data: { contacts: rows, deals: dealRows } };
}

// ─── LinkedIn Ads Sync ───

async function syncLinkedInAds(sb, orgId, accessToken) {
  const LI_BASE = 'https://api.linkedin.com/rest';
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'LinkedIn-Version': '202401',
    'X-Restli-Protocol-Version': '2.0.0',
  };

  // Fetch ad accounts
  const acctRes = await fetch(`${LI_BASE}/adAccounts?q=search&search=(status:(values:List(ACTIVE)))&count=10`, { headers });
  if (!acctRes.ok) throw new Error(`LinkedIn Ads accounts error: ${acctRes.status}`);
  const acctData = await acctRes.json();
  const adAccounts = acctData.elements || [];

  let synced = 0;
  let allRows = [];
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  for (const acct of adAccounts.slice(0, 5)) {
    const accountId = acct.id;

    // Fetch campaigns
    const campRes = await fetch(
      `${LI_BASE}/adAccounts/${accountId}/adCampaigns?q=search&search=(status:(values:List(ACTIVE)))&count=100`,
      { headers },
    );
    if (!campRes.ok) continue;
    const campData = await campRes.json();

    // Fetch analytics for each campaign
    for (const camp of (campData.elements || []).slice(0, 20)) {
      const campaignId = camp.id;
      const dateRange = `dateRange=(start:(year:${startDate.getFullYear()},month:${startDate.getMonth() + 1},day:1),end:(year:${now.getFullYear()},month:${now.getMonth() + 1},day:${now.getDate()}))`;

      const analyticsRes = await fetch(
        `${LI_BASE}/adAnalytics?q=analytics&pivot=CAMPAIGN&${dateRange}&timeGranularity=MONTHLY&campaigns=List(urn%3Ali%3AsponsoredCampaign%3A${campaignId})`,
        { headers },
      );
      if (!analyticsRes.ok) continue;
      const analyticsData = await analyticsRes.json();

      const rows = (analyticsData.elements || []).map((row) => {
        const period = row.dateRange?.start;
        const dateStr = period ? `${period.year}-${String(period.month).padStart(2, '0')}-01` : startDate.toISOString().split('T')[0];
        return {
          org_id: orgId,
          source: 'linkedin_ads',
          external_id: `${campaignId}_${dateStr}`,
          campaign_name: camp.name || '',
          campaign_id: String(campaignId),
          date: dateStr,
          impressions: Number(row.impressions || 0),
          clicks: Number(row.clicks || 0),
          spend: Number(row.costInLocalCurrency || 0) / 100,
          conversions: Number(row.externalWebsiteConversions || 0),
          leads: Number(row.oneClickLeads || row.leadGenerationMailContactInfoShares || 0),
          revenue: 0,
          metadata: {
            account_id: accountId,
            video_views: row.videoViews,
            social_actions: row.totalEngagements,
          },
        };
      });

      if (rows.length > 0) {
        await sb.from('ad_insights').upsert(rows, { onConflict: 'org_id,source,external_id' });
        synced += rows.length;
        allRows = allRows.concat(rows);
      }
    }
  }

  return { synced, data: { adInsights: allRows } };
}

// ─── Notion Sync ───

async function syncNotion(sb, orgId, accessToken) {
  const NOTION_BASE = 'https://api.notion.com/v1';
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };

  // Search for all pages and databases
  const searchRes = await fetch(`${NOTION_BASE}/search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ page_size: 100 }),
  });
  if (!searchRes.ok) throw new Error(`Notion search error: ${searchRes.status}`);
  const searchData = await searchRes.json();

  const events = (searchData.results || []).map((item) => {
    const titleProp = item.properties?.title || item.properties?.Name || item.properties?.Nom;
    let title = '';
    if (titleProp?.title) {
      title = titleProp.title.map((t) => t.plain_text).join('');
    } else if (item.title) {
      title = item.title.map((t) => t.plain_text).join('');
    }

    const lastEdited = item.last_edited_time || item.created_time || new Date().toISOString();
    return {
      org_id: orgId,
      source: 'notion',
      external_id: item.id,
      title: title || (item.object === 'database' ? 'Base de données' : 'Page sans titre'),
      description: item.object === 'database' ? 'Base de données Notion' : 'Page Notion',
      date: new Date(lastEdited).toISOString().split('T')[0],
      start_at: lastEdited,
      end_at: null,
      location: '',
      metadata: {
        type: item.object,
        url: item.url,
        created_time: item.created_time,
        last_edited_time: item.last_edited_time,
        archived: item.archived,
      },
    };
  });

  if (events.length > 0) {
    await sb.from('events').upsert(events, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: events.length, data: { events } };
}

// ─── Slack Sync ───

async function syncSlack(sb, orgId, accessToken) {
  const SLACK_BASE = 'https://slack.com/api';
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Fetch channels list
  const channelsRes = await fetch(`${SLACK_BASE}/conversations.list?types=public_channel,private_channel&limit=100`, { headers });
  if (!channelsRes.ok) throw new Error(`Slack channels error: ${channelsRes.status}`);
  const channelsData = await channelsRes.json();
  if (!channelsData.ok) throw new Error(`Slack API error: ${channelsData.error}`);

  const channels = channelsData.channels || [];

  // Store channels as events (for project management visibility)
  const events = channels.map((ch) => ({
    org_id: orgId,
    source: 'slack',
    external_id: ch.id,
    title: `#${ch.name}`,
    description: ch.purpose?.value || ch.topic?.value || '',
    date: ch.created ? new Date(ch.created * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    start_at: ch.created ? new Date(ch.created * 1000).toISOString() : null,
    end_at: null,
    location: '',
    metadata: {
      num_members: ch.num_members,
      is_private: ch.is_private,
      is_archived: ch.is_archived,
    },
  }));

  // Fetch team members as contacts
  const usersRes = await fetch(`${SLACK_BASE}/users.list?limit=200`, { headers });
  let contacts = [];
  if (usersRes.ok) {
    const usersData = await usersRes.json();
    if (usersData.ok) {
      contacts = (usersData.members || [])
        .filter((u) => !u.is_bot && !u.deleted && u.id !== 'USLACKBOT')
        .map((u) => ({
          org_id: orgId,
          source: 'slack',
          external_id: u.id,
          name: u.real_name || u.name || 'Sans nom',
          first_name: u.profile?.first_name || '',
          last_name: u.profile?.last_name || '',
          email: u.profile?.email || '',
          phone: u.profile?.phone || '',
          company: '',
          metadata: {
            display_name: u.profile?.display_name,
            title: u.profile?.title,
            is_admin: u.is_admin,
            tz: u.tz,
          },
        }));
    }
  }

  if (events.length > 0) {
    await sb.from('events').upsert(events, { onConflict: 'org_id,source,external_id' });
  }
  if (contacts.length > 0) {
    await sb.from('contacts').upsert(contacts, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: events.length + contacts.length, data: { events, contacts } };
}

// ─── Sync Dispatcher ───

const SYNC_HANDLERS = {
  stripe: syncStripe,
  'google calendar': syncGoogleCalendar,
  hubspot: syncHubSpot,
  revolut: syncRevolut,
  qonto: syncQonto,
  gohighlevel: syncGoHighLevel,
  'meta ads': syncMetaAds,
  'google ads': syncGoogleAds,
  'tiktok ads': syncTikTokAds,
  salesforce: syncSalesforce,
  pipedrive: syncPipedrive,
  mailchimp: syncMailchimp,
  paypal: syncPayPal,
  shopify: syncShopify,
  zoho: syncZoho,
  brevo: syncBrevo,
  activecampaign: syncActiveCampaign,
  'linkedin ads': syncLinkedInAds,
  notion: syncNotion,
  slack: syncSlack,
};

// In-memory rate limiter for sync endpoint (heavy operations)
const _syncRateMap = new Map();
function checkSyncRateLimit(key, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();
  const entry = _syncRateMap.get(key);
  if (!entry || now - entry.start > windowMs) {
    _syncRateMap.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', APP_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const profile = await verifyAuth(req);
    if (!profile) return res.status(401).json({ error: 'Non autorisé' });

    // Rate limit syncs per org (5 per minute — syncs are expensive)
    if (!checkSyncRateLimit(`sync_${profile.org_id}`, 5, 60000)) {
      return res.status(429).json({ error: 'Trop de synchronisations. Réessayez dans quelques instants.' });
    }

    const { integration } = req.body;
    const name = (integration || '').toLowerCase();

    // Check if sync is supported for this integration
    const syncFn = SYNC_HANDLERS[name];
    if (!syncFn) {
      return res.status(400).json({ error: `Sync non supporté pour ${name}` });
    }

    // Fetch stored integration from DB
    const sb = getSupabaseAdmin();
    const { data: integ, error: integError } = await sb
      .from('integrations')
      .select('*')
      .eq('org_id', profile.org_id)
      .eq('name', name)
      .single();

    if (integError || !integ) {
      return res.status(404).json({ error: `Intégration ${name} introuvable` });
    }

    if (!integ.connected) {
      return res.status(400).json({ error: `Intégration ${name} non connectée` });
    }

    // Decrypt access token — refresh if expired
    let accessToken = decrypt(integ.access_token_enc);
    if (!accessToken) {
      return res.status(400).json({ error: 'Token d\'accès manquant' });
    }

    // Attempt automatic token refresh for OAuth integrations
    try {
      const refreshed = await refreshAccessToken(sb, integ);
      if (refreshed) accessToken = refreshed;
    } catch (refreshErr) {
      return res.status(401).json({
        error: refreshErr.message,
        code: 'TOKEN_EXPIRED',
        integration: name,
      });
    }

    // Run the sync handler (some handlers need metadata for account IDs, etc.)
    const result = await syncFn(sb, profile.org_id, accessToken, integ.metadata);

    // Update last_synced_at
    await sb.from('integrations').update({
      last_synced_at: new Date().toISOString(),
    }).eq('org_id', profile.org_id).eq('name', name);

    // Log to sync_history
    await sb.from('sync_history').insert({
      org_id: profile.org_id,
      integration_name: name,
      action: 'sync',
      details: `Synced ${result.synced} records`,
    });

    return res.status(200).json({ ok: true, synced: result.synced, source: name, data: result.data || {} });
  } catch (err) {
    // Log sync failure to history
    try {
      const sb = getSupabaseAdmin();
      const profile = await verifyAuth(req);
      if (profile) {
        const name = (req.body?.integration || '').toLowerCase();
        await sb.from('sync_history').insert({
          org_id: profile.org_id,
          integration_name: name,
          action: 'error',
          details: err.message || 'Unknown sync error',
        });
      }
    } catch { /* best effort logging */ }

    return res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
}
