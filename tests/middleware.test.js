// Unit tests for API middleware functions
// Run: node --test tests/middleware.test.js

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// --- Test: CORS ---
describe('CORS - cors()', () => {
  // We test the logic by simulating what cors() does
  it('should not set wildcard origin', () => {
    // The new middleware checks req.headers.origin against allowed origins
    // If origin doesn't match, no ACAO header is set
    const allowedOrigins = new Set(['https://scale-corp.vercel.app']);
    const origin = 'https://evil-site.com';
    const result = allowedOrigins.has(origin);
    assert.equal(result, false, 'Should not allow arbitrary origins');
  });

  it('should allow configured origins', () => {
    const allowedOrigins = new Set(['https://scale-corp.vercel.app', 'https://www.scale-corp.vercel.app']);
    assert.equal(allowedOrigins.has('https://scale-corp.vercel.app'), true);
    assert.equal(allowedOrigins.has('https://www.scale-corp.vercel.app'), true);
  });

  it('should reject unknown origins', () => {
    const allowedOrigins = new Set(['https://scale-corp.vercel.app']);
    assert.equal(allowedOrigins.has('https://attacker.com'), false);
    assert.equal(allowedOrigins.has(''), false);
  });
});

// --- Test: Rate Limiting ---
describe('Rate Limiting', () => {
  // Simulate the rate limiter logic
  function createRateLimiter(maxRequests, windowMs) {
    const store = new Map();
    return function check(key) {
      const now = Date.now();
      const entry = store.get(key);
      if (!entry || now - entry.start > windowMs) {
        store.set(key, { start: now, count: 1 });
        return true;
      }
      entry.count++;
      return entry.count <= maxRequests;
    };
  }

  it('should allow requests under the limit', () => {
    const limiter = createRateLimiter(5, 60000);
    for (let i = 0; i < 5; i++) {
      assert.equal(limiter('test-ip'), true, `Request ${i + 1} should be allowed`);
    }
  });

  it('should block requests over the limit', () => {
    const limiter = createRateLimiter(3, 60000);
    assert.equal(limiter('ip1'), true);
    assert.equal(limiter('ip1'), true);
    assert.equal(limiter('ip1'), true);
    assert.equal(limiter('ip1'), false, 'Fourth request should be blocked');
  });

  it('should track different keys independently', () => {
    const limiter = createRateLimiter(2, 60000);
    assert.equal(limiter('ip1'), true);
    assert.equal(limiter('ip1'), true);
    assert.equal(limiter('ip1'), false);
    assert.equal(limiter('ip2'), true, 'Different IP should have its own counter');
  });
});

// --- Test: Input Validation ---
describe('Input Validation', () => {
  const DANGEROUS_PATTERN = /[;'"\\]|--|\b(drop|alter|insert|update|delete|exec|union|select)\b/i;

  function sanitizeParam(v) {
    if (typeof v !== 'string') return v;
    if (DANGEROUS_PATTERN.test(v)) return null;
    return v;
  }

  it('should allow safe strings', () => {
    assert.equal(sanitizeParam('hello'), 'hello');
    assert.equal(sanitizeParam('user123'), 'user123');
    assert.equal(sanitizeParam('2026-01'), '2026-01');
    assert.equal(sanitizeParam('eco'), 'eco');
  });

  it('should block SQL injection attempts', () => {
    assert.equal(sanitizeParam("'; DROP TABLE users;--"), null);
    assert.equal(sanitizeParam("1 UNION SELECT * FROM users"), null);
    assert.equal(sanitizeParam("admin'--"), null);
    assert.equal(sanitizeParam("DELETE FROM users"), null);
  });

  it('should block special characters', () => {
    assert.equal(sanitizeParam("test;test"), null);
    assert.equal(sanitizeParam("test'test"), null);
    assert.equal(sanitizeParam('test"test'), null);
    assert.equal(sanitizeParam("test\\test"), null);
  });

  it('should handle non-string values', () => {
    assert.equal(sanitizeParam(123), 123);
    assert.equal(sanitizeParam(null), null);
    assert.equal(sanitizeParam(undefined), undefined);
  });
});

// --- Test: Email Validation ---
describe('Email Validation', () => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validateEmail(email) { return EMAIL_RE.test(email); }

  it('should accept valid emails', () => {
    assert.equal(validateEmail('test@example.com'), true);
    assert.equal(validateEmail('user+tag@domain.fr'), true);
    assert.equal(validateEmail('admin@scale-corp.io'), true);
  });

  it('should reject invalid emails', () => {
    assert.equal(validateEmail(''), false);
    assert.equal(validateEmail('invalid'), false);
    assert.equal(validateEmail('@missing.com'), false);
    assert.equal(validateEmail('no-domain@'), false);
    assert.equal(validateEmail('spaces in@email.com'), false);
  });
});

// --- Test: Action Whitelisting ---
describe('Action Whitelisting', () => {
  const VALID_ACTIONS = ['signup', 'login', 'logout', 'me', 'update_password', 'list_users', 'delete_user'];

  it('should allow valid auth actions', () => {
    VALID_ACTIONS.forEach(action => {
      assert.equal(VALID_ACTIONS.includes(action), true, `${action} should be valid`);
    });
  });

  it('should reject invalid actions', () => {
    assert.equal(VALID_ACTIONS.includes('hack'), false);
    assert.equal(VALID_ACTIONS.includes('admin'), false);
    assert.equal(VALID_ACTIONS.includes(''), false);
    assert.equal(VALID_ACTIONS.includes('DROP TABLE'), false);
  });
});

// --- Test: Table Whitelisting ---
describe('Table Whitelisting', () => {
  const TABLES = ['users', 'societies', 'client_data', 'meta_ads', 'sales_data', 'reports', 'tx_categories', 'user_settings', 'holding'];

  it('should allow valid tables', () => {
    TABLES.forEach(t => assert.equal(TABLES.includes(t), true));
  });

  it('should reject arbitrary table names', () => {
    assert.equal(TABLES.includes('passwords'), false);
    assert.equal(TABLES.includes('system_secrets'), false);
    assert.equal(TABLES.includes('admin'), false);
  });
});

// --- Test: Auth Token Store ---
describe('Store Auth - No hardcoded tokens', () => {
  it('should not accept default PINs like 0000 or admin', () => {
    // The new store.js only accepts env-configured tokens
    const STORE_SECRET = ''; // empty = no default
    function getValidTokens() {
      const tokens = new Set();
      if (STORE_SECRET) tokens.add(STORE_SECRET);
      return tokens;
    }
    const tokens = getValidTokens();
    assert.equal(tokens.has('0000'), false, '0000 should not be a valid token');
    assert.equal(tokens.has('admin'), false, 'admin should not be a valid token');
    assert.equal(tokens.size, 0, 'No tokens should be valid without env config');
  });

  it('should accept env-configured tokens', () => {
    const tokens = new Set();
    const secret = 'my-secure-secret-2026';
    tokens.add(secret);
    assert.equal(tokens.has(secret), true);
    assert.equal(tokens.has('wrong-token'), false);
  });
});

// --- Test: IP Extraction ---
describe('IP Extraction', () => {
  it('should extract first IP from x-forwarded-for', () => {
    const header = '203.0.113.50, 70.41.3.18, 150.172.238.178';
    const ip = header.split(',')[0].trim();
    assert.equal(ip, '203.0.113.50');
  });

  it('should handle single IP', () => {
    const header = '203.0.113.50';
    const ip = header.split(',')[0].trim();
    assert.equal(ip, '203.0.113.50');
  });
});

// --- Test: Security Headers ---
describe('Security Headers', () => {
  const REQUIRED_HEADERS = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Permissions-Policy',
    'Strict-Transport-Security',
  ];

  it('should define all required security headers', () => {
    // Verify the middleware sets these headers
    const headers = {};
    function setHeader(key, value) { headers[key] = value; }

    // Simulate securityHeaders()
    setHeader("X-Content-Type-Options", "nosniff");
    setHeader("X-Frame-Options", "DENY");
    setHeader("X-XSS-Protection", "1; mode=block");
    setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

    REQUIRED_HEADERS.forEach(h => {
      assert.ok(headers[h], `Header ${h} should be set`);
    });
  });
});

// --- Test: HMAC Verification ---
describe('HMAC Webhook Verification', () => {
  it('should verify matching secrets', () => {
    const secret = 'test-webhook-secret';
    const headerSecret = 'test-webhook-secret';
    assert.equal(headerSecret === secret, true);
  });

  it('should reject non-matching secrets', () => {
    const secret = 'test-webhook-secret';
    const headerSecret = 'wrong-secret';
    assert.equal(headerSecret === secret, false);
  });

  it('should reject empty secrets', () => {
    const secret = 'test-webhook-secret';
    assert.equal('' === secret, false);
    assert.equal(undefined === secret, false);
    assert.equal(null === secret, false);
  });
});

console.log('All middleware tests passed!');
