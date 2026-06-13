'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { ToastProvider } from '../components/ui/Toast';
import { Analytics } from '../components/marketing/Analytics';
import { TenantTheme } from '../components/layout/TenantTheme';

const PUBLIC_PATHS = [
  '/',
  '/about',
  '/contact',
  '/forgot-password',
  '/legal-disclaimer',
  '/login',
  '/register',
  '/register-business',
  '/reset-password',
  '/msp-ticketing-software',
  '/field-service-management-software',
  '/it-asset-management-software',
  '/technician-dispatch-software',
  '/topology/shared',
  '/verify-email',
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)));
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, authChecked, setUser, setCompany, setAuthChecked, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const lastHydratedPath = useRef<string | null>(null);

  useEffect(() => {
    if (isPublicPath(pathname)) {
      lastHydratedPath.current = pathname;
      setAuthChecked(true);
      return;
    }

    if (lastHydratedPath.current === pathname) return;
    lastHydratedPath.current = pathname;
    let active = true;
    setAuthChecked(false);

    api.get('/users/me').then(async (u) => {
      if (active && u) setUser(u);
      try {
        const company = await api.get('/settings');
        if (active && company) setCompany(company);
      } catch {}
    }).catch(() => {
      if (active) {
        logout();
        router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
      }
    }).finally(() => {
      if (active) setAuthChecked(true);
    });

    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch {}

    return () => {
      active = false;
    };
  }, [logout, pathname, router, setAuthChecked, setCompany, setUser]);

  useEffect(() => {
    const report = (message: string, stack?: string, metadata?: Record<string, any>) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const state = useAuthStore.getState();
        const payload = JSON.stringify({
          source: 'frontend',
          message,
          stack,
          path: window.location.pathname,
          userId: state.user?.id,
          companyId: state.user?.companyId,
          metadata,
        });
        navigator.sendBeacon?.(`${apiUrl}/v1/error-reports`, new Blob([payload], { type: 'application/json' }));
      } catch {}
    };

    const onError = (event: ErrorEvent) => report(event.message, event.error?.stack, { filename: event.filename, lineno: event.lineno, colno: event.colno });
    const onRejection = (event: PromiseRejectionEvent) => report(String(event.reason?.message || event.reason || 'Unhandled promise rejection'), event.reason?.stack);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  const publicPath = isPublicPath(pathname);
  if (!publicPath && (!authChecked || !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-600">
        Verifying your session...
      </div>
    );
  }

  return (
    <ToastProvider>
      <TenantTheme />
      <Analytics />
      {children}
    </ToastProvider>
  );
}
