'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { AppQueryProvider } from '../components/providers/AppQueryProvider';

export function AuthenticatedClientShell({ children }: { children: React.ReactNode }) {
  const { user, authChecked, setUser, setCompany, setAuthChecked, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const lastHydratedPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastHydratedPath.current === pathname) return;
    lastHydratedPath.current = pathname;
    let active = true;
    setAuthChecked(false);

    api.get('/users/me').then(async (currentUser) => {
      if (active && currentUser) setUser(currentUser);
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

    return () => { active = false; };
  }, [logout, pathname, router, setAuthChecked, setCompany, setUser]);

  return (
    <AppQueryProvider>
      {!authChecked || !user ? (
        <div className="flex flex-1 items-center justify-center bg-gray-50 text-sm text-gray-600">Verifying your session...</div>
      ) : children}
    </AppQueryProvider>
  );
}
