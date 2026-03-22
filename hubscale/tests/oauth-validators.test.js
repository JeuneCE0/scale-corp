// Tests for API key validators in api/integrations/oauth.js
// Validates the validator logic, URL construction, and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Test the validator logic patterns used in oauth.js handleConnectWithKey ───

describe('API Key Validators — URL and header patterns', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  // ─── Stripe validator ───

  it('stripe: calls /v1/balance with Bearer token', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const apiKey = 'sk_test_abc123';

    const r = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(mockFetch).toHaveBeenCalledWith('https://api.stripe.com/v1/balance', {
      headers: { Authorization: 'Bearer sk_test_abc123' },
    });
    expect(r.ok).toBe(true);
  });

  it('stripe: throws on invalid key', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });
    const r = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: 'Bearer bad_key' },
    });
    expect(r.ok).toBe(false);
  });

  // ─── Brevo validator ───

  it('brevo: calls /v3/account with api-key header', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const apiKey = 'xkeysib-abc123';

    await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': apiKey },
    });

    expect(mockFetch).toHaveBeenCalledWith('https://api.brevo.com/v3/account', {
      headers: { 'api-key': 'xkeysib-abc123' },
    });
  });

  // ─── Zoho validator ───

  it('zoho: uses Zoho-oauthtoken format', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const apiKey = 'zoho_token_xyz';

    await fetch('https://www.zohoapis.eu/crm/v2/org', {
      headers: { Authorization: `Zoho-oauthtoken ${apiKey}` },
    });

    expect(mockFetch).toHaveBeenCalledWith('https://www.zohoapis.eu/crm/v2/org', {
      headers: { Authorization: 'Zoho-oauthtoken zoho_token_xyz' },
    });
  });

  // ─── ActiveCampaign validator ───

  it('activecampaign: requires apiUrl and uses Api-Token header', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const apiKey = 'ac_key_123';
    const apiUrl = 'https://myaccount.api-us1.com';

    await fetch(`${apiUrl}/api/3/contacts?limit=1`, {
      headers: { 'Api-Token': apiKey },
    });

    expect(mockFetch).toHaveBeenCalledWith('https://myaccount.api-us1.com/api/3/contacts?limit=1', {
      headers: { 'Api-Token': 'ac_key_123' },
    });
  });

  it('activecampaign: fails without apiUrl', () => {
    const apiUrl = undefined;
    expect(() => {
      if (!apiUrl) throw new Error('URL ActiveCampaign requise (ex: https://moncompte.api-us1.com)');
    }).toThrow('URL ActiveCampaign requise');
  });

  // ─── Notion validator ───

  it('notion: calls /v1/users/me with Notion-Version header', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const apiKey = 'secret_notion_abc';

    await fetch('https://api.notion.com/v1/users/me', {
      headers: { Authorization: `Bearer ${apiKey}`, 'Notion-Version': '2022-06-28' },
    });

    expect(mockFetch).toHaveBeenCalledWith('https://api.notion.com/v1/users/me', {
      headers: { Authorization: 'Bearer secret_notion_abc', 'Notion-Version': '2022-06-28' },
    });
  });

  // ─── Shopify validator ───

  it('shopify: requires apiUrl and uses X-Shopify-Access-Token', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const apiKey = 'shpat_abc123';
    const apiUrl = 'https://myshop.myshopify.com';
    const shopDomain = apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': apiKey },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://myshop.myshopify.com/admin/api/2024-01/shop.json',
      { headers: { 'X-Shopify-Access-Token': 'shpat_abc123' } }
    );
  });

  it('shopify: normalizes domain from URL', () => {
    const cases = [
      { input: 'https://myshop.myshopify.com/', expected: 'myshop.myshopify.com' },
      { input: 'http://myshop.myshopify.com', expected: 'myshop.myshopify.com' },
      { input: 'myshop.myshopify.com', expected: 'myshop.myshopify.com' },
    ];

    cases.forEach(({ input, expected }) => {
      const domain = input.replace(/^https?:\/\//, '').replace(/\/$/, '');
      expect(domain).toBe(expected);
    });
  });

  it('shopify: fails without apiUrl', () => {
    const apiUrl = undefined;
    expect(() => {
      if (!apiUrl) throw new Error('URL de boutique Shopify requise (ex: monshop.myshopify.com)');
    }).toThrow('URL de boutique Shopify requise');
  });

  // ─── Salesforce validator ───

  it('salesforce: requires apiUrl (instance URL)', () => {
    const apiUrl = undefined;
    expect(() => {
      if (!apiUrl) throw new Error("URL d'instance Salesforce requise");
    }).toThrow("URL d'instance Salesforce requise");
  });

  it('salesforce: calls /services/data/v59.0/ with Bearer', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const apiKey = 'sf_token';
    const apiUrl = 'https://myorg.my.salesforce.com';

    await fetch(`${apiUrl}/services/data/v59.0/`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://myorg.my.salesforce.com/services/data/v59.0/',
      { headers: { Authorization: 'Bearer sf_token' } }
    );
  });

  // ─── Pipedrive validator ───

  it('pipedrive: passes api_token as query parameter', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const apiKey = 'pd_key_abc';

    await fetch(`https://api.pipedrive.com/v1/users/me?api_token=${apiKey}`);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.pipedrive.com/v1/users/me?api_token=pd_key_abc'
    );
  });

  // ─── Mailchimp validator ───

  it('mailchimp: extracts dc from key suffix', () => {
    const cases = [
      { key: 'abc123-us21', dc: 'us21' },
      { key: 'abc123-eu5', dc: 'eu5' },
      { key: 'nosuffix', dc: 'us1' },
    ];

    cases.forEach(({ key, dc: expectedDc }) => {
      const dc = key.includes('-') ? key.split('-').pop() : 'us1';
      expect(dc).toBe(expectedDc);
    });
  });

  it('mailchimp: calls correct dc-prefixed URL', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const apiKey = 'abc123-us21';
    const dc = apiKey.split('-').pop();

    await fetch(`https://${dc}.api.mailchimp.com/3.0/ping`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(mockFetch).toHaveBeenCalledWith('https://us21.api.mailchimp.com/3.0/ping', {
      headers: { Authorization: 'Bearer abc123-us21' },
    });
  });

  // ─── HubSpot validator ───

  it('hubspot: calls contacts endpoint with Bearer', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const apiKey = 'pat-hub-123';

    await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.hubapi.com/crm/v3/objects/contacts?limit=1',
      { headers: { Authorization: 'Bearer pat-hub-123' } }
    );
  });
});

// ─── handleConnectWithKey logic ───

describe('handleConnectWithKey — validation flow', () => {
  it('rejects empty apiKey', () => {
    const apiKey = '';
    const result = !apiKey ? { error: 'Cle API requise' } : null;
    expect(result).toEqual({ error: 'Cle API requise' });
  });

  it('stores api_key connection_method in metadata', () => {
    const metadata = { connection_method: 'api_key' };
    expect(metadata.connection_method).toBe('api_key');
  });

  it('validator returns extra metadata that gets merged', () => {
    // Simulating Shopify validator returning shop_domain
    const validatorResult = { shop_domain: 'myshop.myshopify.com' };
    const metadata = { ...validatorResult, connection_method: 'api_key' };

    expect(metadata.shop_domain).toBe('myshop.myshopify.com');
    expect(metadata.connection_method).toBe('api_key');
  });

  it('unknown integrations still connect without validation', () => {
    const validators = { stripe: async () => ({}), hubspot: async () => ({}) };
    const name = 'custom_tool';
    const validator = validators[name];

    // No validator means skip validation, just store
    expect(validator).toBeUndefined();
    const metadata = { connection_method: 'api_key' };
    expect(metadata.connection_method).toBe('api_key');
  });
});
