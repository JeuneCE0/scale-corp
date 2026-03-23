import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './components/ui.jsx';
import { initMonitoring } from './lib/monitoring.js';
import { initAnalytics } from './lib/analytics.js';

// Initialize error monitoring
initMonitoring();

// Initialize analytics (GA4, Meta Pixel, UTM capture)
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="Erreur application">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Web Vitals monitoring
function reportVital(metric) {
  if (typeof window.__HS_VITALS === 'undefined') window.__HS_VITALS = {};
  window.__HS_VITALS[metric.name] = { value: Math.round(metric.value), rating: metric.rating };
  // Send to analytics endpoint when backend is ready:
  // fetch('/api/vitals', { method: 'POST', body: JSON.stringify(metric) });
}

try {
  const po = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        reportVital({ name: 'LCP', value: entry.startTime, rating: entry.startTime < 2500 ? 'good' : entry.startTime < 4000 ? 'needs-improvement' : 'poor' });
      }
      if (entry.entryType === 'first-input') {
        const fid = entry.processingStart - entry.startTime;
        reportVital({ name: 'FID', value: fid, rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor' });
      }
      if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
        reportVital({ name: 'CLS', value: entry.value, rating: entry.value < 0.1 ? 'good' : entry.value < 0.25 ? 'needs-improvement' : 'poor' });
      }
    }
  });
  po.observe({ type: 'largest-contentful-paint', buffered: true });
  po.observe({ type: 'first-input', buffered: true });
  po.observe({ type: 'layout-shift', buffered: true });
} catch {}

