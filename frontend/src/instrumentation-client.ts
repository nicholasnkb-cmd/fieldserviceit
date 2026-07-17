function reportClientError(message: string, stack?: string, metadata?: Record<string, unknown>) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const payload = JSON.stringify({
      source: 'frontend',
      message,
      stack,
      path: window.location.pathname,
      metadata: {
        ...metadata,
        release: process.env.NEXT_PUBLIC_APP_COMMIT || 'unknown',
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
    });
    navigator.sendBeacon?.(`${apiUrl}/v1/error-reports`, new Blob([payload], { type: 'application/json' }));
  } catch {}
}

window.addEventListener('error', (event) => {
  reportClientError(event.message, event.error?.stack, { filename: event.filename, lineno: event.lineno, colno: event.colno });
});

window.addEventListener('unhandledrejection', (event) => {
  reportClientError(String(event.reason?.message || event.reason || 'Unhandled promise rejection'), event.reason?.stack);
});

window.addEventListener('fieldserviceit:api-error', (event) => {
  const detail = (event as CustomEvent).detail || {};
  reportClientError(detail.message || 'API request failed', undefined, {
    kind: 'api', status: detail.status, method: detail.method, endpoint: detail.endpoint,
    online: navigator.onLine,
  });
});

export function onRouterTransitionStart(href: string, navigationType: string) {
  performance.mark(`route:${navigationType}:${href}`);
}
