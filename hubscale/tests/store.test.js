import { describe, it, expect, beforeEach } from 'vitest';
import { store, load, remove, loadWithTTL } from '../src/lib/store.js';

describe('store.js — localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and loads data', () => {
    store('test', { name: 'Alice' });
    expect(load('test')).toEqual({ name: 'Alice' });
  });

  it('returns null for missing key', () => {
    expect(load('nonexistent')).toBeNull();
  });

  it('handles primitive values', () => {
    store('num', 42);
    expect(load('num')).toBe(42);

    store('str', 'hello');
    expect(load('str')).toBe('hello');

    store('bool', true);
    expect(load('bool')).toBe(true);
  });

  it('handles arrays', () => {
    store('arr', [1, 2, 3]);
    expect(load('arr')).toEqual([1, 2, 3]);
  });

  it('removes a key', () => {
    store('temp', 'data');
    expect(load('temp')).toBe('data');
    remove('temp');
    expect(load('temp')).toBeNull();
  });

  it('uses hs_ prefix', () => {
    store('key', 'value');
    const raw = localStorage.getItem('hs_key');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.data).toBe('value');
    expect(parsed.v).toBe(1);
    expect(parsed.ts).toBeGreaterThan(0);
  });

  it('loadWithTTL returns null for expired data', () => {
    // Store data with a manually set old timestamp
    localStorage.setItem('hs_old', JSON.stringify({ v: 1, ts: Date.now() - 100000, data: 'old' }));
    expect(loadWithTTL('old', 50000)).toBeNull();
  });

  it('loadWithTTL returns data within TTL', () => {
    store('fresh', 'data');
    expect(loadWithTTL('fresh', 86400000)).toBe('data');
  });

  it('should handle corrupted JSON in localStorage gracefully', () => {
    localStorage.setItem('hs_corrupt', 'not-json{{{');
    // load and loadWithTTL catch JSON.parse errors and return null
    expect(load('corrupt')).toBeNull();
    expect(loadWithTTL('corrupt', 86400000)).toBeNull();
  });

  it('should handle missing timestamp in stored data', () => {
    localStorage.setItem('hs_nots', JSON.stringify({ v: 1, data: 'test' }));
    // ts is undefined → Date.now() - undefined = NaN → NaN > maxAgeMs is false
    // so loadWithTTL actually returns the data (does NOT treat as expired)
    expect(loadWithTTL('nots', 86400000)).toBe('test');
  });

  it('should handle version mismatch by returning null', () => {
    localStorage.setItem('hs_oldver', JSON.stringify({ v: 999, ts: Date.now(), data: 'stale' }));
    expect(load('oldver')).toBeNull();
    expect(loadWithTTL('oldver', 86400000)).toBeNull();
  });
});
