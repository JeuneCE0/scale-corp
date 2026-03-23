// HubScale — Analytics & Tracking
// Supports Google Analytics 4, Meta Pixel, and UTM parameter tracking.
// All IDs are configured via environment variables (VITE_ prefix).

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

// ---------------------------------------------------------------------------
// UTM parameter capture — store on first visit for attribution
// ---------------------------------------------------------------------------

export function captureUtmParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const utm = {};
    let hasUtm = false;

    for (const key of utmKeys) {
      const val = params.get(key);
      if (val) {
        utm[key] = val;
        hasUtm = true;
      }
    }

    if (hasUtm) {
      utm.landed_at = new Date().toISOString();
      utm.landing_url = window.location.pathname;
      localStorage.setItem('hs_utm', JSON.stringify(utm));
    }
  } catch {
    // Silent fail — analytics should never break the app
  }
}

export function getStoredUtm() {
  try {
    const raw = localStorage.getItem('hs_utm');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Google Analytics 4
// ---------------------------------------------------------------------------

let gaLoaded = false;

export function initGA() {
  if (!GA_ID || gaLoaded) return;
  gaLoaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    send_page_view: false, // We'll send manually on route changes
  });
}

export function trackPageView(path) {
  if (!GA_ID || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path || window.location.pathname,
    page_location: window.location.href,
  });
}

export function trackEvent(eventName, params = {}) {
  if (!GA_ID || !window.gtag) return;
  window.gtag('event', eventName, params);
}

// ---------------------------------------------------------------------------
// Meta Pixel (Facebook)
// ---------------------------------------------------------------------------

let metaLoaded = false;

export function initMetaPixel() {
  if (!META_PIXEL_ID || metaLoaded) return;
  metaLoaded = true;

  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

export function metaTrack(eventName, params = {}) {
  if (!META_PIXEL_ID || !window.fbq) return;
  window.fbq('track', eventName, params);
}

// ---------------------------------------------------------------------------
// Conversion tracking helpers
// ---------------------------------------------------------------------------

export function trackSignup(plan) {
  trackEvent('sign_up', { method: 'email', plan });
  metaTrack('CompleteRegistration', { content_name: plan });
}

export function trackCheckoutStart(plan, value) {
  trackEvent('begin_checkout', { currency: 'EUR', value, items: [{ item_name: plan }] });
  metaTrack('InitiateCheckout', { content_name: plan, currency: 'EUR', value });
}

export function trackPurchase(plan, value) {
  trackEvent('purchase', { currency: 'EUR', value, items: [{ item_name: plan }] });
  metaTrack('Purchase', { content_name: plan, currency: 'EUR', value });
}

// ---------------------------------------------------------------------------
// Init all analytics — call once at app startup
// ---------------------------------------------------------------------------

export function initAnalytics() {
  captureUtmParams();
  initGA();
  initMetaPixel();
}
