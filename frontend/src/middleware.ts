import { NextRequest, NextResponse } from 'next/server';
import { isPublicPath } from './lib/public-routes';

function contentSecurityPolicy(nonce: string) {
  const developmentEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentEval} https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.fieldserviceit.com https://*.amazonaws.com https://www.google-analytics.com",
    "font-src 'self' data:",
    "connect-src 'self' https://api.fieldserviceit.com wss://api.fieldserviceit.com https://www.google-analytics.com https://region1.google-analytics.com https://*.ingest.sentry.io",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  if (!isPublicPath(request.nextUrl.pathname) && !request.cookies.has('fsit_access')) {
    const login = new URL('/login', request.url);
    login.searchParams.set('returnTo', request.nextUrl.pathname);
    const redirect = NextResponse.redirect(login);
    redirect.headers.set('Content-Security-Policy', csp);
    return redirect;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: ['/((?!v1/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
