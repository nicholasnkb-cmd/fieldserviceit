'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { ToastProvider } from '../components/ui/Toast';
import { Analytics } from '../components/marketing/Analytics';
import { TenantTheme } from '../components/layout/TenantTheme';
import { MobileAppInstallPrompt } from '../components/layout/MobileAppInstallPrompt';
import { isPublicPath } from '../lib/public-routes';
import { AppQueryProvider } from '../components/providers/AppQueryProvider';
import { Footer } from '../components/layout/Footer';

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
    const onApiError = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      report(detail.message || 'API request failed', undefined, {
        kind: 'api',
        status: detail.status,
        method: detail.method,
        endpoint: detail.endpoint,
        online: navigator.onLine,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('fieldserviceit:api-error', onApiError);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('fieldserviceit:api-error', onApiError);
    };
  }, []);

  const publicPath = isPublicPath(pathname);
  const content = !publicPath && (!authChecked || !user) ? (
    <div className="flex flex-1 items-center justify-center bg-gray-50 text-sm text-gray-600">
      Verifying your session...
    </div>
  ) : children;

  return (
    <AppQueryProvider>
      <ToastProvider>
        <TenantTheme />
        <Analytics />
        <MobileAppInstallPrompt />
        <div className="flex min-h-screen flex-col">
          <div className="flex flex-1 flex-col">{content}</div>
          <Footer compact={!publicPath} />
        </div>
      </ToastProvider>
    </AppQueryProvider>
  );
}
