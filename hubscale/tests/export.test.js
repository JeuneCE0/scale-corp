import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockInsert = vi.fn().mockReturnValue({ catch: vi.fn() });
const mockSelect = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ data: [{ id: '1', name: 'Contact 1' }] }),
});
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, insert: mockInsert });

vi.mock('../api/utils/supabase.js', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

vi.mock('../api/utils/auth.js', () => ({
  verifyAuth: vi.fn().mockResolvedValue({ id: 'user-1', org_id: 'org-1', email: 'test@test.com' }),
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
  const res = {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
  return res;
}

describe('Export API', () => {
  let handler;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../api/export.js');
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
    const { verifyAuth } = await import('../api/utils/auth.js');
    verifyAuth.mockResolvedValueOnce(null);
    const res = makeRes();
    await handler(makeReq({ format: 'json', scope: 'contacts' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 for invalid format', async () => {
    const res = makeRes();
    await handler(makeReq({ format: 'xml', scope: 'contacts' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for invalid scope', async () => {
    const res = makeRes();
    await handler(makeReq({ format: 'json', scope: 'passwords' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for missing format', async () => {
    const res = makeRes();
    await handler(makeReq({ scope: 'contacts' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for missing scope', async () => {
    const res = makeRes();
    await handler(makeReq({ format: 'json' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('exports contacts as JSON', async () => {
    const res = makeRes();
    await handler(makeReq({ format: 'json', scope: 'contacts' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      exported_at: expect.any(String),
      scope: 'contacts',
    }));
  });

  it('exports contacts as CSV with correct content type', async () => {
    const res = makeRes();
    await handler(makeReq({ format: 'csv', scope: 'contacts' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="contacts_export.csv"');
  });

  it('exports all scopes as JSON', async () => {
    const res = makeRes();
    await handler(makeReq({ format: 'json', scope: 'all' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ scope: 'all' }));
  });

  it('exports all scopes as CSV returns individual CSVs', async () => {
    const res = makeRes();
    await handler(makeReq({ format: 'csv', scope: 'all' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const call = res.json.mock.calls[0][0];
    expect(call).toHaveProperty('contacts_csv');
    expect(call).toHaveProperty('finances_csv');
    expect(call).toHaveProperty('events_csv');
  });

  it('logs audit entry on export', async () => {
    const res = makeRes();
    await handler(makeReq({ format: 'json', scope: 'contacts' }), res);
    expect(mockFrom).toHaveBeenCalledWith('audit_log');
  });
});
