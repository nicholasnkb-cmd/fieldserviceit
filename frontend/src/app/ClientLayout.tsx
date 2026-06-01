'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { ToastProvider } from '../components/ui/Toast';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthChecked, logout } = useAuthStore();
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    api.get('/users/me').then((u) => {
      if (u) setUser(u);
    }).catch((err: any) => {
      if (err?.status === 401) logout();
    }).finally(() => {
      setAuthChecked(true);
    });

    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch {}
  }, [logout, setAuthChecked, setUser]);

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
