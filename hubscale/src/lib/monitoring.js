// HubScale — Error monitoring & analytics
const MAX_QUEUE = 50;
const errorQueue = [];
const eventQueue = [];

let sentryDsn = null;
let sentryProjectId = null;
let sentryKey = null;

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screen: `${screen.width}x${screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    online: navigator.onLine,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };
}

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

function sendToSentry(errorData) {
  if (!sentryKey || !sentryProjectId) return;

  const payload = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    logger: 'hubscale',
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
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${sentryKey}, sentry_client=hubscale/1.0`,
    },
    body: JSON.stringify(payload),
  }).catch(() => {}); // fire-and-forget
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

function enqueueError(entry) {
  if (errorQueue.length >= MAX_QUEUE) errorQueue.shift();
  errorQueue.push(entry);
}

export function reportError(error, context = {}) {
  const entry = {
    name: error?.name || 'Error',
    message: error?.message || String(error),
    stack: error?.stack || null,
    context,
    device: getDeviceInfo(),
  };

  enqueueError(entry);

  if (sentryKey) {
    sendToSentry(entry);
  } else {
    console.warn('[HubScale] Error:', entry.message, context);
  }
}

export function trackEvent(name, data = {}) {
  const entry = { name, data, timestamp: new Date().toISOString(), url: window.location.href };
  if (eventQueue.length >= MAX_QUEUE) eventQueue.shift();
  eventQueue.push(entry);

  if (import.meta.env.DEV) {
    console.debug('[HubScale] Event:', name, data);
  }
}

export function getErrorLog() {
  return [...errorQueue];
}

export function initMonitoring() {
  // Parse Sentry DSN if configured
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) {
    parseSentryDsn(dsn);
  }

  // Global error handler
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), {
      source: event.filename,
      line: event.lineno,
      col: event.colno,
      type: 'uncaught',
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    reportError(error, { type: 'unhandledrejection' });
  });

  // Track initial page view
  trackEvent('page_view', { path: window.location.pathname });

  if (import.meta.env.DEV) {
    console.debug('[HubScale] Monitoring initialized', sentryKey ? '(Sentry active)' : '(local only)');
  }
}
