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
  const contacts = (customers.data || []).map((cu) => ({
    org_id: orgId,
    source: 'stripe',
    external_id: cu.id,
    name: cu.name || cu.email || 'Sans nom',
    email: cu.email || '',
    phone: cu.phone || '',
    company: cu.metadata?.company || '',
    status: 'client',
    created_at: new Date(cu.created * 1000).toISOString(),
  }));

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

    const rows = (membersData.members || []).map((m) => ({
      org_id: orgId,
      source: 'mailchimp',
      external_id: m.id,
      name: m.full_name || '',
      email: m.email_address || '',
      metadata: { list_id: list.id, list_name: list.name, status: m.status },
    }));

    if (rows.length > 0) {
      await sb.from('contacts').upsert(rows, { onConflict: 'org_id,source,external_id' });
      synced += rows.length;
      allRows = allRows.concat(rows);
    }
  }

  return { synced, data: { contacts: allRows } };
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
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', APP_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const profile = await verifyAuth(req);
    if (!profile) return res.status(401).json({ error: 'Non autorisé' });

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
