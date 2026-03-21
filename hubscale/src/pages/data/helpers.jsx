import React from 'react';
import { T } from '../../lib/theme.js';

export function EvoBadge({ value, invert }) {
  const isPositive = invert ? value < 0 : value > 0;
  const color = isPositive ? T.green : T.red;
  const arrow = value > 0 ? '↑' : '↓';
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color, marginLeft: 6,
      padding: '1px 5px', borderRadius: 4, background: color + '15',
      whiteSpace: 'nowrap',
    }}>{arrow}{Math.abs(value)}%</span>
  );
}

export function MarginBar({ ratio }) {
  const color = ratio > 30 ? T.green : ratio > 10 ? T.orange : T.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 70 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: T.border, overflow: 'hidden', minWidth: 28 }}>
        <div style={{ height: '100%', width: `${Math.min(Math.max(ratio, 0), 100)}%`, background: color, borderRadius: 2, transition: 'width .5s ease' }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{ratio}%</span>
    </div>
  );
}
