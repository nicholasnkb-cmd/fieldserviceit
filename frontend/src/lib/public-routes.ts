export const PUBLIC_PATHS = [
  '/', '/about', '/contact', '/forgot-password', '/legal-disclaimer', '/privacy',
  '/security-overview', '/status', '/terms', '/track', '/unsubscribe', '/login',
  '/register', '/register-business', '/reset-password', '/msp-ticketing-software',
  '/field-service-management-software', '/it-asset-management-software',
  '/technician-dispatch-software', '/topology/shared', '/verify-email',
] as const;

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)));
}
