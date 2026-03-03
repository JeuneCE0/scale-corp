// Scale Corp — Error monitoring & analytics
// Lightweight Sentry integration (no SDK dependency) + event tracking

const MAX_QUEUE = 50;
const errorQueue = [];
const eventQueue = [];

let sentryKey = null;
let sentryProjectId = null;
let analyticsEndpoint = null;

function parseSentryDsn(dsn) {
  try {
    const url = new URL(dsn);
    sentryKey = url.username;
    sentryProjectId = url.pathname.replace('/', '');
    return true;
  } catch {
    return false;
  }
}

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screen: `${screen.width}x${screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };
}

function parseStack(stack) {
  return stack.split('\n').slice(0, 10).map((line) => {
    const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/) ||
                  line.match(/at\s+(.+):(\d+):(\d+)/);
    if (!match) return { filename: line.trim(), lineno: 0, colno: 0, function: '?' };
    return match.length === 5
      ? { function: match[1], filename: match[2], lineno: +match[3], colno: +match[4] }
      : { function: '?', filename: match[1], lineno: +match[2], colno: +match[3] };
  });
}

function sendToSentry(errorData) {
  if (!sentryKey || !sentryProjectId) return;

  const payload = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    logger: 'scale-corp',
    server_name: window.location.hostname,
    environment: import.meta.env.MODE || 'production',
    request: {
      url: window.location.href,
      headers: { 'User-Agent': navigator.userAgent },
    },
    exception: {
      values: [{
        type: errorData.name || 'Error',
        value: errorData.message,
        stacktrace: errorData.stack ? { frames: parseStack(errorData.stack) } : undefined,
      }],
    },
    tags: errorData.context || {},
    extra: { device: errorData.device },
  };

  fetch(`https://sentry.io/api/${sentryProjectId}/store/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${sentryKey}, sentry_client=scale-corp/1.0`,
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export function reportError(error, context = {}) {
  const entry = {
    name: error?.name || 'Error',
    message: error?.message || String(error),
    stack: error?.stack || null,
    context,
    device: getDeviceInfo(),
  };
  if (errorQueue.length >= MAX_QUEUE) errorQueue.shift();
  errorQueue.push(entry);

  if (sentryKey) {
    sendToSentry(entry);
  } else {
    console.warn('[ScaleCorp] Error:', entry.message, context);
  }
}

export function trackEvent(name, data = {}) {
  const entry = { name, data, timestamp: new Date().toISOString(), url: window.location.href };
  if (eventQueue.length >= MAX_QUEUE) eventQueue.shift();
  eventQueue.push(entry);

  // Send to analytics endpoint if configured
  if (analyticsEndpoint) {
    fetch(analyticsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {});
  }

  if (import.meta.env.DEV) {
    console.debug('[ScaleCorp] Event:', name, data);
  }
}

export function getErrorLog() {
  return [...errorQueue];
}

export function getEventLog() {
  return [...eventQueue];
}

export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) parseSentryDsn(dsn);

  analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT || null;

  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), {
      source: event.filename,
      line: event.lineno,
      col: event.colno,
      type: 'uncaught',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    reportError(error, { type: 'unhandledrejection' });
  });

  trackEvent('page_view', { path: window.location.pathname });

  if (import.meta.env.DEV) {
    console.debug('[ScaleCorp] Monitoring initialized', sentryKey ? '(Sentry active)' : '(local only)');
  }
}
