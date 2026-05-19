'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { ToastProvider } from '../components/ui/Toast';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            id: payload.sub,
            email: payload.email,
            firstName: '',
            lastName: '',
            role: payload.role,
            userType: payload.userType || 'BUSINESS',
            companyId: payload.companyId || null,
            isActive: true,
            createdAt: new Date().toISOString(),
          });
          api.get('/users/me').then((u) => {
            if (u) setUser(u);
          }).catch(() => {
            logout();
            router.push('/login');
          });
        } catch {
          logout();
          router.push('/login');
        }
      }
    } catch {
      // localStorage not available
    }
  }, [setUser, logout, router]);

  return <ToastProvider>{children}</ToastProvider>;
}
