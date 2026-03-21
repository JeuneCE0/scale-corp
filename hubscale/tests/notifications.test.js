import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
});
const mockDeleteFn = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
});
const mockRange = vi.fn().mockResolvedValue({ data: [{ id: 'n1', message: 'Test notification', read: false }], error: null });
const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
const mockEq = vi.fn().mockReturnValue({ or: mockOr });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  update: mockUpdate,
  delete: mockDeleteFn,
});

vi.mock('../api/utils/supabase.js', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

const mockVerifyAuth = vi.fn();
vi.mock('../api/utils/auth.js', () => ({
  verifyAuth: (...args) => mockVerifyAuth(...args),
}));

function makeReq(method, query = {}, body = null) {
  const req = {
    method,
    query,
    body,
    headers: { authorization: 'Bearer test-token' },
    on: vi.fn((event, cb) => { if (event === 'end') cb(); }),
  };
  return req;
}

function makeRes() {
  return {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
}

describe('Notifications API', () => {
  let handler;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockVerifyAuth.mockResolvedValue({
      id: 'user-1',
      org_id: 'org-1',
      email: 'test@test.com',
    });
    // Reset count mock
    mockEq.mockReturnValue({
      or: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: [{ id: 'n1', message: 'test', read: false }], error: null }),
        }),
      }),
    });
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({ count: 5 }),
      }),
    });

    const mod = await import('../api/notifications.js');
    handler = mod.default;
  });

  it('returns 200 for OPTIONS', async () => {
    const res = makeRes();
    await handler(makeReq('OPTIONS'), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 401 when unauthenticated', async () => {
    mockVerifyAuth.mockResolvedValueOnce(null);
    const res = makeRes();
    await handler(makeReq('GET', { page: '1' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('lists notifications on GET', async () => {
    // Override mocks for listing flow
    const mockNotifs = [{ id: 'n1', message: 'Hello', read: false }];
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({ count: 1 }),
        }),
      }),
    }).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({ data: mockNotifs, error: null }),
            }),
          }),
        }),
      }),
    });
    const res = makeRes();
    await handler(makeReq('GET', { page: '1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles mark_read action', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'mark_read', id: 'n1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 for mark_read without id', async () => {
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'mark_read' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles mark_all_read action', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'mark_all_read' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles delete action', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'delete', id: 'n1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 for delete without id', async () => {
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'delete' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for invalid POST action', async () => {
    const res = makeRes();
    await handler(makeReq('POST', {}, { action: 'hack' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 405 for unsupported methods', async () => {
    const res = makeRes();
    await handler(makeReq('PUT'), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
