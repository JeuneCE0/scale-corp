import { describe, it, expect } from 'vitest';
import { fmt, fK, pct, clamp, pf, uid, curMonth, monthLabel, ago } from '../src/lib/utils.js';

describe('fmt — French number formatting', () => {
  it('formats small numbers', () => {
    expect(fmt(0)).toMatch(/^0$/);
    expect(fmt(123)).toMatch('123');
  });

  it('formats large numbers with separator', () => {
    const result = fmt(1234567);
    // French uses non-breaking space as separator
    expect(result.replace(/\s/g, '')).toBe('1234567');
  });

  it('rounds floating points', () => {
    expect(fmt(99.7)).toMatch('100');
  });

  it('handles null/undefined', () => {
    expect(fmt(null)).toMatch('0');
    expect(fmt(undefined)).toMatch('0');
  });
});

describe('fK — compact formatting', () => {
  it('returns raw number for < 1000', () => {
    expect(fK(500)).toBe('500');
  });

  it('formats thousands as K', () => {
    expect(fK(1200)).toBe('1.2K');
  });

  it('removes trailing .0', () => {
    expect(fK(2000)).toBe('2K');
  });

  it('formats millions as M', () => {
    expect(fK(1500000)).toBe('1.5M');
  });
});

describe('pct — percentage', () => {
  it('calculates percentage', () => {
    expect(pct(50, 200)).toBe(25);
  });

  it('returns 0 when denominator is 0', () => {
    expect(pct(50, 0)).toBe(0);
  });
});

describe('clamp', () => {
  it('clamps within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('pf — parseFloat safe', () => {
  it('parses valid numbers', () => {
    expect(pf('123.45')).toBe(123.45);
  });

  it('returns 0 for invalid', () => {
    expect(pf('')).toBe(0);
    expect(pf('abc')).toBe(0);
    expect(pf(null)).toBe(0);
  });
});

describe('uid — unique ID', () => {
  it('generates unique strings', () => {
    const a = uid();
    const b = uid();
    expect(a).not.toBe(b);
    expect(typeof a).toBe('string');
    expect(a.length).toBeGreaterThan(5);
  });
});

describe('curMonth', () => {
  it('returns YYYY-MM format', () => {
    const m = curMonth();
    expect(m).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe('monthLabel', () => {
  it('formats month label', () => {
    expect(monthLabel('2026-01')).toBe('Jan 2026');
    expect(monthLabel('2025-12')).toBe('Déc 2025');
  });

  it('handles empty input', () => {
    expect(monthLabel('')).toBe('');
    expect(monthLabel(null)).toBe('');
  });
});

describe('ago — relative time', () => {
  it('returns "à l\'instant" for recent', () => {
    expect(ago(new Date().toISOString())).toBe("à l'instant");
  });

  it('returns minutes', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(ago(d)).toMatch(/il y a \d+min/);
  });

  it('returns hours', () => {
    const d = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(ago(d)).toMatch(/il y a \d+h/);
  });

  it('returns days', () => {
    const d = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    expect(ago(d)).toMatch(/il y a \d+j/);
  });
});
