import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ single: mockSingle, eq: vi.fn().mockReturnValue({ single: mockSingle }) });
const mockSelect = vi.fn().mockReturnValue({
  eq: mockEq,
  ilike: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }) }) }),
  or: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }) }) }),
  order: vi.fn().mockReturnValue({ range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }) }),
  in: vi.fn().mockResolvedValue({ data: [] }),
});
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockInsert = vi.fn().mockReturnValue({ catch: vi.fn() });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, update: mockUpdate, insert: mockInsert });
const mockGetUser = vi.fn();
const mockGenerateLink = vi.fn().mockResolvedValue({ error: null });

vi.mock('../api/utils/supabase.js', () => ({
  getSupabaseAdmin: () => ({
    from: mockFrom,
    auth: {
      getUser: mockGetUser,
      admin: { generateLink: mockGenerateLink },
    },
  }),
}));

// Mock Stripe dynamic import
vi.mock('stripe', () => ({
  default: function Stripe() {
    return {
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({ items: { data: [{ id: 'si_1', price: { id: 'price_starter' } }] } }),
        update: vi.fn().mockResolvedValue({}),
      },
    };
  },
}));

function makeReq(method, query = {}, body = {}) {
  return { method, query, body, headers: { authorization: 'Bearer admin-token' } };
}

function makeRes() {
  return {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
}

describe('Admin API', () => {
  let handler;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null });
    mockSingle.mockResolvedValue({ data: { id: 'admin-1', role: 'super_admin', org_id: 'org-1' }, error: null });

    const mod = await import('../api/admin.js');
    handler = mod.default;
  });

  it('returns 200 for OPTIONS', async () => {
    const res = makeRes();
    await handler(makeReq('OPTIONS'), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 403 for non-admin users', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 'user-1', role: 'member' }, error: null });
    const res = makeRes();
    await handler(makeReq('GET', { action: 'platform_stats' }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 when auth fails', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'bad' } });
    const res = makeRes();
    await handler(makeReq('GET', { action: 'platform_stats' }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('handles check_admin action', async () => {
    const res = makeRes();
    await handler(makeReq('GET', { action: 'check_admin' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it('returns 400 for invalid action', async () => {
    const res = makeRes();
    await handler(makeReq('GET', { action: 'does_not_exist' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for update_organization without org_id', async () => {
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'update_organization' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for update_user without user_id', async () => {
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'update_user' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for invalid role on update_user', async () => {
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'update_user', user_id: 'u1', role: 'hacker' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for reset_password without user_id', async () => {
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'reset_password' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for change_plan without required fields', async () => {
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'change_plan' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for change_plan with invalid plan', async () => {
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'change_plan', org_id: 'o1', plan: 'ultra' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('validates string length in update_organization', async () => {
    const longName = 'x'.repeat(300);
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'update_organization', org_id: 'o1', name: longName }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
