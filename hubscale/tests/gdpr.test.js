import { describe, it, expect, vi, beforeEach } from 'vitest';

// Build a flexible Supabase mock that supports the chaining patterns used in gdpr.js
const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockDeleteEq });
const mockInsert = vi.fn().mockReturnValue({ catch: vi.fn() });
const mockFrom = vi.fn().mockImplementation(() => ({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockImplementation(() => ({
      single: vi.fn().mockResolvedValue({ data: { id: 'test' }, error: null }),
      // For count queries
    })),
  }),
  insert: mockInsert,
  delete: mockDeleteFn,
}));
const mockDeleteUser = vi.fn().mockResolvedValue({ error: null });

vi.mock('../api/utils/supabase.js', () => ({
  getSupabaseAdmin: () => ({
    from: mockFrom,
    auth: { admin: { deleteUser: mockDeleteUser } },
  }),
}));

const mockVerifyAuth = vi.fn();
vi.mock('../api/utils/auth.js', () => ({
  verifyAuth: (...args) => mockVerifyAuth(...args),
}));

function makeReq(body = {}) {
  return {
    method: 'POST',
    query: {},
    body,
    headers: { authorization: 'Bearer test-token' },
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

describe('GDPR API', () => {
  let handler;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockVerifyAuth.mockResolvedValue({
      id: 'user-1',
      org_id: 'org-1',
      email: 'test@test.com',
      full_name: 'Test User',
      role: 'owner',
      created_at: '2024-01-01',
    });

    const mod = await import('../api/gdpr.js');
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

  it('returns 401 when unauthenticated', async () => {
    mockVerifyAuth.mockResolvedValueOnce(null);
    const res = makeRes();
    await handler(makeReq({ action: 'export' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 for invalid action', async () => {
    const res = makeRes();
    await handler(makeReq({ action: 'hack' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles GDPR data export', async () => {
    const res = makeRes();
    await handler(makeReq({ action: 'export' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ exported_at: expect.any(String) }));
  });

  it('prevents non-owner from deleting account', async () => {
    mockVerifyAuth.mockResolvedValueOnce({
      id: 'user-2', org_id: 'org-1', role: 'member', email: 'member@test.com',
    });
    const res = makeRes();
    await handler(makeReq({ action: 'delete' }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('prevents deletion when other members exist', async () => {
    // Override mockFrom to return count > 1 for the members check
    mockFrom.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 3 }),
      }),
    }));
    const res = makeRes();
    await handler(makeReq({ action: 'delete' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('deletes account when owner is sole member', async () => {
    // Override to return count = 1
    mockFrom.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 1 }),
      }),
    }));
    const res = makeRes();
    await handler(makeReq({ action: 'delete' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });
});
