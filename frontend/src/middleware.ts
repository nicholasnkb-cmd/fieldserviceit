import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_CACHE_PATHS = new Set([
  '/',
  '/about',
  '/contact',
  '/field-service-management-software',
  '/it-asset-management-software',
  '/legal-disclaimer',
  '/msp-ticketing-software',
  '/privacy',
  '/security-overview',
  '/status',
  '/technician-dispatch-software',
]);

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.fieldserviceit.com https://*.amazonaws.com https://www.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.fieldserviceit.com wss://api.fieldserviceit.com https://www.google-analytics.com https://region1.google-analytics.com",
  'upgrade-insecure-requests',
].join('; ');

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');

  if (PUBLIC_CACHE_PATHS.has(pathname)) {
    response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');
  } else if (!pathname.startsWith('/_next/') && !pathname.match(/\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$/)) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
