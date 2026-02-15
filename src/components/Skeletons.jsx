import React from "react";
import { C } from "../shared.jsx";

const shimmerKeyframes = `
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;

const shimmerBg = {
  background: `linear-gradient(90deg, rgba(255,255,255,.03) 25%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.03) 75%)`,
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.8s ease-in-out infinite',
};

const glassBase = {
  borderRadius: 14,
  border: '1px solid var(--sc-w06)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

export function SkeletonStyles() {
  return <style>{shimmerKeyframes}</style>;
}

export function SkeletonCard({ width, height = 120, style }) {
  return (
    <div style={{
      ...glassBase,
      ...shimmerBg,
      height,
      width: width || '100%',
      padding: 14,
      ...style,
    }}>
      <div style={{ ...shimmerBg, height: 10, width: '40%', borderRadius: 4, marginBottom: 10, background: 'var(--sc-w04)' }} />
      <div style={{ ...shimmerBg, height: 22, width: '60%', borderRadius: 4, marginBottom: 8, background: 'var(--sc-w04)' }} />
      <div style={{ ...shimmerBg, height: 8, width: '80%', borderRadius: 4, background: 'var(--sc-w04)' }} />
    </div>
  );
}

export function SkeletonKPI({ style }) {
  return (
    <div style={{
      ...glassBase,
      ...shimmerBg,
      padding: '16px 18px',
      flex: '1 1 130px',
      minWidth: 120,
      ...style,
    }}>
      <div style={{ height: 9, width: '50%', borderRadius: 3, marginBottom: 8, background: 'var(--sc-w04)' }} />
      <div style={{ height: 28, width: '40%', borderRadius: 4, marginBottom: 6, background: 'var(--sc-w06)' }} />
      <div style={{ height: 8, width: '65%', borderRadius: 3, background: 'var(--sc-w04)' }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, style }) {
  return (
    <div style={{ ...glassBase, padding: 14, ...style }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--sc-w06)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} style={{ ...shimmerBg, height: 10, flex: 1, borderRadius: 3 }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} style={{
              ...shimmerBg,
              height: c === 0 ? 12 : 10,
              flex: 1,
              borderRadius: 3,
              opacity: 0.6 + Math.random() * 0.4,
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div>
      <SkeletonStyles />
      {/* KPI row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[0,1,2,3,4].map(i => <SkeletonKPI key={i} />)}
      </div>
      {/* Cards row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <SkeletonCard style={{ flex: '2 1 300px' }} height={200} />
        <SkeletonCard style={{ flex: '1 1 200px' }} height={200} />
      </div>
      {/* Table */}
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
