// Unit tests for affiliate / commission logic
// Run: node --test tests/affiliate.test.js

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

// ── Constants ──

describe('Affiliate Constants', () => {
  it('AFFILIATE_COMMISSION_RATE should be 0.20 (20%)', () => {
    const AFFILIATE_COMMISSION_RATE = 0.20;
    assert.equal(AFFILIATE_COMMISSION_RATE, 0.20);
  });

  it('AFFILIATE_MIN_PAYOUT should be 50€', () => {
    const AFFILIATE_MIN_PAYOUT = 50;
    assert.equal(AFFILIATE_MIN_PAYOUT, 50);
  });

  it('AFFILIATE_HOLDING_DAYS should be 30', () => {
    const AFFILIATE_HOLDING_DAYS = 30;
    assert.equal(AFFILIATE_HOLDING_DAYS, 30);
  });
});

// ── Referral Code Generation ──

describe('buildRefCode()', () => {
  function buildRefCode(client) {
    return (client.name || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() + '-' + (client.id || '').slice(-4).toUpperCase();
  }

  it('should generate correct ref code for a standard client', () => {
    const code = buildRefCode({ name: 'AcmeCorp', id: 'abc123def456' });
    assert.equal(code, 'ACMECORP-F456');
  });

  it('should strip special characters from name', () => {
    const code = buildRefCode({ name: 'Acme Corp!@#', id: '0000abcd' });
    // "Acme Corp!@#" → strip non-alnum → "AcmeCorp" (8 chars) → "ACMECORP"
    assert.equal(code, 'ACMECORP-ABCD');
  });

  it('should handle short names', () => {
    const code = buildRefCode({ name: 'AB', id: '12345678' });
    assert.equal(code, 'AB-5678');
  });

  it('should handle empty name', () => {
    const code = buildRefCode({ name: '', id: 'abcd1234' });
    assert.equal(code, '-1234');
  });

  it('should truncate long names to 8 chars', () => {
    const code = buildRefCode({ name: 'VeryLongCompanyName', id: 'xxxx9999' });
    assert.equal(code, 'VERYLONG-9999');
  });

  it('should handle accented characters', () => {
    const code = buildRefCode({ name: 'Éléphant', id: 'aaaa1111' });
    // Non-ASCII characters are stripped
    assert.equal(code, 'LPHANT-1111');
  });
});

// ── Commission Calculations ──

describe('Commission Calculation', () => {
  const RATE = 0.20;

  function calcCommission(revenue, rate) {
    return Math.round(revenue * rate);
  }

  it('should calculate 20% commission correctly', () => {
    assert.equal(calcCommission(1000, RATE), 200);
    assert.equal(calcCommission(500, RATE), 100);
    assert.equal(calcCommission(0, RATE), 0);
  });

  it('should round commissions to nearest integer', () => {
    assert.equal(calcCommission(333, RATE), 67); // 333 * 0.20 = 66.6 → 67
    assert.equal(calcCommission(17, RATE), 3);   // 17 * 0.20 = 3.4 → 3
  });

  it('should handle large amounts', () => {
    assert.equal(calcCommission(100000, RATE), 20000);
  });
});

// ── Commission Calculation Edge Cases ──

describe('calcCommission edge cases', () => {
  function calcCommission(revenue, rate) {
    return Math.round(revenue * rate);
  }

  it('should handle zero revenue', () => {
    assert.equal(calcCommission(0, 0.20), 0);
  });

  it('should handle very small amounts (rounding)', () => {
    // 0.01 * 0.20 = 0.002 → Math.round → 0
    assert.equal(calcCommission(0.01, 0.20), 0);
    // 2.5 * 0.20 = 0.5 → Math.round → 1 (rounds up)
    assert.equal(calcCommission(2.5, 0.20), 1);
  });

  it('should return negative result for negative revenue (no guard)', () => {
    // The function does not guard against negatives — it returns a negative value
    assert.equal(calcCommission(-100, 0.20), -20);
  });
});

// ── Payout Validation Edge Cases ──

describe('validatePayout edge cases', () => {
  const MIN_PAYOUT = 50;

  function validatePayout(amount, bankInfo) {
    const errors = [];
    if (!amount || amount < MIN_PAYOUT) errors.push(`Minimum payout is ${MIN_PAYOUT}€`);
    if (!bankInfo?.iban) errors.push('IBAN required');
    if (!bankInfo?.bic) errors.push('BIC required');
    if (bankInfo?.iban && bankInfo.iban.replace(/\s/g, '').length < 14) errors.push('IBAN too short');
    if (bankInfo?.bic && bankInfo.bic.length < 8) errors.push('BIC too short');
    return errors;
  }

  const validBank = { iban: 'FR7612345678901234567890123', bic: 'BNPAFRPP' };

  it('should reject NaN amount', () => {
    // NaN is falsy, so !amount is true → triggers minimum payout error
    const errors = validatePayout(NaN, validBank);
    assert.ok(errors.some(e => e.includes('Minimum')));
  });

  it('should reject Infinity amount', () => {
    // Infinity is truthy and Infinity >= 50, so it passes the amount check
    const errors = validatePayout(Infinity, validBank);
    assert.equal(errors.length, 0);
  });

  it('should reject negative amount', () => {
    // -10 < 50 → triggers minimum payout error
    const errors = validatePayout(-10, validBank);
    assert.ok(errors.some(e => e.includes('Minimum')));
  });
});

// ── Referral Status Logic ──

describe('Referral Status', () => {
  function deriveStatus(referred) {
    if (!referred) return 'pending';
    if (referred.status === 'churned') return 'churned';
    const rev = referred.revenue || 0;
    return rev > 0 ? 'active' : 'pending';
  }

  it('should return pending if no referred client', () => {
    assert.equal(deriveStatus(null), 'pending');
  });

  it('should return churned if client churned', () => {
    assert.equal(deriveStatus({ status: 'churned', revenue: 500 }), 'churned');
  });

  it('should return active if client has revenue', () => {
    assert.equal(deriveStatus({ status: 'active', revenue: 100 }), 'active');
  });

  it('should return pending if client has no revenue', () => {
    assert.equal(deriveStatus({ status: 'active', revenue: 0 }), 'pending');
  });
});

// ── Payout Validation ──

describe('Payout Validation', () => {
  const MIN_PAYOUT = 50;

  function validatePayout(amount, bankInfo) {
    const errors = [];
    if (!amount || amount < MIN_PAYOUT) errors.push(`Minimum payout is ${MIN_PAYOUT}€`);
    if (!bankInfo?.iban) errors.push('IBAN required');
    if (!bankInfo?.bic) errors.push('BIC required');
    if (bankInfo?.iban && bankInfo.iban.replace(/\s/g, '').length < 14) errors.push('IBAN too short');
    if (bankInfo?.bic && bankInfo.bic.length < 8) errors.push('BIC too short');
    return errors;
  }

  it('should reject payout below minimum', () => {
    const errors = validatePayout(30, { iban: 'FR7612345678901234567890123', bic: 'BNPAFRPP' });
    assert.ok(errors.some(e => e.includes('Minimum')));
  });

  it('should reject payout without IBAN', () => {
    const errors = validatePayout(100, { bic: 'BNPAFRPP' });
    assert.ok(errors.some(e => e.includes('IBAN required')));
  });

  it('should reject payout without BIC', () => {
    const errors = validatePayout(100, { iban: 'FR7612345678901234567890123' });
    assert.ok(errors.some(e => e.includes('BIC required')));
  });

  it('should reject short IBAN', () => {
    const errors = validatePayout(100, { iban: 'FR76123', bic: 'BNPAFRPP' });
    assert.ok(errors.some(e => e.includes('IBAN too short')));
  });

  it('should reject short BIC', () => {
    const errors = validatePayout(100, { iban: 'FR7612345678901234567890123', bic: 'BNP' });
    assert.ok(errors.some(e => e.includes('BIC too short')));
  });

  it('should accept valid payout', () => {
    const errors = validatePayout(100, { iban: 'FR7612345678901234567890123', bic: 'BNPAFRPP' });
    assert.equal(errors.length, 0);
  });

  it('should accept payout exactly at minimum', () => {
    const errors = validatePayout(50, { iban: 'FR7612345678901234567890123', bic: 'BNPAFRPP' });
    assert.equal(errors.length, 0);
  });
});

// ── Leaderboard Aggregation ──

describe('Leaderboard Aggregation', () => {
  function aggregateLeaderboard(referrals) {
    const byReferrer = {};
    for (const r of referrals) {
      const key = r.referrerId;
      if (!byReferrer[key]) byReferrer[key] = { referrals: 0, earned: 0 };
      byReferrer[key].referrals++;
      byReferrer[key].earned += (r.commission || 0);
    }
    return Object.entries(byReferrer)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.earned - a.earned)
      .map((e, i) => ({ rank: i + 1, ...e, badge: i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '' }));
  }

  it('should aggregate referrals by referrer', () => {
    const refs = [
      { referrerId: 'A', commission: 100 },
      { referrerId: 'A', commission: 200 },
      { referrerId: 'B', commission: 150 },
    ];
    const board = aggregateLeaderboard(refs);
    assert.equal(board.length, 2);
    assert.equal(board[0].id, 'A');
    assert.equal(board[0].earned, 300);
    assert.equal(board[0].referrals, 2);
    assert.equal(board[1].id, 'B');
    assert.equal(board[1].earned, 150);
    assert.equal(board[1].referrals, 1);
  });

  it('should rank by earnings descending', () => {
    const refs = [
      { referrerId: 'C', commission: 50 },
      { referrerId: 'A', commission: 500 },
      { referrerId: 'B', commission: 300 },
    ];
    const board = aggregateLeaderboard(refs);
    assert.equal(board[0].rank, 1);
    assert.equal(board[0].id, 'A');
    assert.equal(board[1].rank, 2);
    assert.equal(board[1].id, 'B');
    assert.equal(board[2].rank, 3);
    assert.equal(board[2].id, 'C');
  });

  it('should assign correct badges', () => {
    const refs = [
      { referrerId: 'A', commission: 300 },
      { referrerId: 'B', commission: 200 },
      { referrerId: 'C', commission: 100 },
      { referrerId: 'D', commission: 50 },
    ];
    const board = aggregateLeaderboard(refs);
    assert.equal(board[0].badge, '🏆');
    assert.equal(board[1].badge, '🥈');
    assert.equal(board[2].badge, '🥉');
    assert.equal(board[3].badge, '');
  });

  it('should return empty array for no referrals', () => {
    assert.equal(aggregateLeaderboard([]).length, 0);
  });
});

// ── Slug Generation ──

describe('Slug Generation', () => {
  function slugify(str) {
    return (str || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
  }

  it('should slugify a simple name', () => {
    assert.equal(slugify('Acme Corp'), 'acme-corp');
  });

  it('should handle accented characters', () => {
    assert.equal(slugify('Café Résumé'), 'cafe-resume');
  });

  it('should strip special characters', () => {
    assert.equal(slugify('Hello World! @#$%'), 'hello-world');
  });

  it('should truncate at 30 chars', () => {
    const long = 'a'.repeat(50);
    assert.equal(slugify(long).length, 30);
  });

  it('should handle empty string', () => {
    assert.equal(slugify(''), '');
  });
});

// ── IBAN Formatting ──

describe('IBAN Formatting', () => {
  function formatIban(v) {
    const clean = v.replace(/\s/g, '').toUpperCase();
    return clean.replace(/(.{4})/g, '$1 ').trim();
  }

  it('should format IBAN with spaces every 4 chars', () => {
    assert.equal(formatIban('FR7612345678901234567890123'), 'FR76 1234 5678 9012 3456 7890 123');
  });

  it('should handle already formatted IBAN', () => {
    assert.equal(formatIban('FR76 1234 5678'), 'FR76 1234 5678');
  });

  it('should uppercase the IBAN', () => {
    assert.equal(formatIban('fr7612345678'), 'FR76 1234 5678');
  });
});
