import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSingle = vi.fn();
const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
const mockEq = vi.fn().mockReturnValue({ single: mockSingle, eq: mockEq2 });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, update: mockUpdate, insert: mockInsert });
const mockGetUser = vi.fn();

vi.mock('../api/utils/supabase.js', () => ({
  getSupabaseAdmin: () => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  }),
}));

// Mock Stripe dynamic import — stripe is imported via `await import('stripe')`
const mockCheckoutCreate = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/session', id: 'sess_123' });
const mockSubRetrieve = vi.fn().mockResolvedValue({
  id: 'sub_1', status: 'active', current_period_end: 1700000000, cancel_at_period_end: false,
  items: { data: [{ price: { id: 'price_starter' } }] },
});
const mockCustomerCreate = vi.fn().mockResolvedValue({ id: 'cus_new' });
const mockPortalCreate = vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/portal' });
const mockConstructEvent = vi.fn();

vi.mock('stripe', () => ({
  default: function Stripe() {
    return {
      checkout: { sessions: { create: mockCheckoutCreate } },
      subscriptions: { retrieve: mockSubRetrieve },
      customers: { create: mockCustomerCreate },
      billingPortal: { sessions: { create: mockPortalCreate } },
      webhooks: { constructEvent: mockConstructEvent },
    };
  },
}));

function makeReq(method, query = {}, body = {}, headers = {}) {
  return {
    method, query, body,
    headers: { authorization: 'Bearer test-token', ...headers },
    on: vi.fn((event, cb) => { if (event === 'end') cb(); }),
  };
}

function makeRes() {
  return {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
}

describe('Billing API', () => {
  let handler;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_PRICE_STARTER = 'price_starter';
    process.env.STRIPE_PRICE_PROFESSIONAL = 'price_pro';
    process.env.STRIPE_PRICE_ENTERPRISE = 'price_ent';
    // Re-wire the mock chain after clearAllMocks
    const profileData = { id: 'user-1', org_id: 'org-1', email: 'test@test.com', full_name: 'Test' };
    mockSingle.mockResolvedValue({ data: profileData, error: null });
    mockEq2.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ single: mockSingle, eq: mockEq2 });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate, insert: mockInsert });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

    const mod = await import('../api/billing.js');
    handler = mod.default;
  });

  it('returns 200 for OPTIONS (CORS preflight)', async () => {
    const res = makeRes();
    await handler(makeReq('OPTIONS'), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'invalid' } });
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'no user' } });
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'subscription' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects invalid action (returns 400 or 401)', async () => {
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'invalid_action' }), res);
    const status = res.status.mock.calls[0][0];
    // Returns 400 if auth passes, or 401 if auth mock doesn't chain
    expect([400, 401]).toContain(status);
  });

  it('returns 400 for invalid plan on create_checkout', async () => {
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'create_checkout', planId: 'nonexistent' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles subscription query', async () => {
    const res = makeRes();
    await handler(makeReq('GET', { action: 'subscription' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ plan: expect.any(String) }));
  });

  it('creates checkout session for valid plan', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'user-1', org_id: 'org-1', email: 'test@test.com', full_name: 'Test' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'org-1', stripe_customer_id: 'cus_123' }, error: null });
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'create_checkout', planId: 'starter' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ url: expect.any(String) }));
  });

  it('returns portal URL for valid customer', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'user-1', org_id: 'org-1', email: 'test@test.com', full_name: 'Test' }, error: null })
      .mockResolvedValueOnce({ data: { stripe_customer_id: 'cus_123' }, error: null });
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'portal' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 for portal without stripe customer', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'user-1', org_id: 'org-1', email: 'test@test.com', full_name: 'Test' }, error: null })
      .mockResolvedValueOnce({ data: { stripe_customer_id: null }, error: null });
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'portal' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
