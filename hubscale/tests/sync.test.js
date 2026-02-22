import { describe, it, expect, vi } from 'vitest';
import { broadcast, subscribe } from '../src/lib/sync.js';

describe('sync.js — BroadcastChannel multi-tab sync', () => {
  it('subscribe returns an unsubscribe function', () => {
    const cb = vi.fn();
    const unsub = subscribe('test-key', cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('broadcast does not throw', () => {
    expect(() => broadcast('test-key', { foo: 'bar' })).not.toThrow();
  });
});
