'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { ToastProvider } from '../components/ui/Toast';

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
  '/submit-ticket',
  '/track',
  '/verify-email',
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)));
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthChecked, logout } = useAuthStore();
  const pathname = usePathname();
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

    api.get('/users/me').then((u) => {
      if (active && u) setUser(u);
    }).catch((err: any) => {
      if (active && err?.status === 401) logout();
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
  }, [logout, pathname, setAuthChecked, setUser]);

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

  return <ToastProvider>{children}</ToastProvider>;
}
