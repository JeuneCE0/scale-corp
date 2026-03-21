import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for Resend API
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ id: 'email_123' }),
});
vi.stubGlobal('fetch', mockFetch);

// Mock Supabase
const mockInsert = vi.fn().mockReturnValue({ catch: vi.fn() });
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, insert: mockInsert });
const mockGetUser = vi.fn();
const mockResetPassword = vi.fn().mockResolvedValue({ error: null });

vi.mock('../api/utils/supabase.js', () => ({
  getSupabaseAdmin: () => ({
    from: mockFrom,
    auth: {
      getUser: mockGetUser,
      resetPasswordForEmail: mockResetPassword,
    },
  }),
}));

const mockVerifyAuth = vi.fn();
vi.mock('../api/utils/auth.js', () => ({
  verifyAuth: (...args) => mockVerifyAuth(...args),
}));

function makeReq(body = {}, headers = {}) {
  return {
    method: 'POST',
    query: {},
    body,
    headers: { authorization: 'Bearer test-token', 'content-type': 'application/json', ...headers },
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

describe('Email API', () => {
  let handler;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-stub fetch after clearAllMocks
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'email_123' }),
    });
    vi.stubGlobal('fetch', mockFetch);
    process.env.RESEND_API_KEY = 'test_resend_key';
    mockVerifyAuth.mockResolvedValue({ id: 'user-1', org_id: 'org-1', email: 'user@test.com', full_name: 'Test User' });
    // Re-wire mock for insert
    mockInsert.mockReturnValue({ catch: vi.fn() });
    mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert });

    const mod = await import('../api/email.js');
    handler = mod.default;
  });

  it('returns 200 for OPTIONS', async () => {
    const req = { method: 'OPTIONS', headers: {}, query: {} };
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 405 for GET', async () => {
    const req = { method: 'GET', headers: { authorization: 'Bearer t' }, query: {} };
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 400 for invalid action', async () => {
    const res = makeRes();
    await handler(makeReq({ action: 'unknown' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles welcome email', async () => {
    const res = makeRes();
    await handler(makeReq({ action: 'welcome', email: 'new@test.com', name: 'New User' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockFetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({ method: 'POST' }));
  });

  it('handles invoice email', async () => {
    const res = makeRes();
    await handler(makeReq({
      action: 'invoice',
      email: 'client@test.com',
      customerName: 'Client',
      invoiceNumber: 'INV-001',
      amount: 99.99,
      currency: 'EUR',
    }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles plan_change email', async () => {
    const res = makeRes();
    await handler(makeReq({
      action: 'plan_change',
      email: 'user@test.com',
      customerName: 'Test',
      oldPlan: 'starter',
      newPlan: 'professional',
    }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles reset_password without auth', async () => {
    // reset_password is a public action — doesn't need verifyAuth
    const res = makeRes();
    await handler(makeReq({ action: 'reset_password', email: 'user@test.com' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 for reset_password without email', async () => {
    const res = makeRes();
    await handler(makeReq({ action: 'reset_password' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when auth fails for protected actions', async () => {
    mockVerifyAuth.mockResolvedValueOnce(null);
    const res = makeRes();
    await handler(makeReq({ action: 'welcome', name: 'Fail' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
