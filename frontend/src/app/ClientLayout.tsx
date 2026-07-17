'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ToastProvider } from '../components/ui/Toast';
import { TenantTheme } from '../components/layout/TenantTheme';
import { isPublicPath } from '../lib/public-routes';
import { Footer } from '../components/layout/Footer';

const Analytics = dynamic(() => import('../components/marketing/Analytics').then((module) => module.Analytics), { ssr: false });
const MobileAppInstallPrompt = dynamic(() => import('../components/layout/MobileAppInstallPrompt').then((module) => module.MobileAppInstallPrompt), { ssr: false });
const AuthenticatedClientShell = dynamic(() => import('./AuthenticatedClientShell').then((module) => module.AuthenticatedClientShell), {
  ssr: false,
  loading: () => <div className="flex flex-1 items-center justify-center bg-gray-50 text-sm text-gray-600">Verifying your session...</div>,
});

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicPath = isPublicPath(pathname);
  const content = publicPath ? children : <AuthenticatedClientShell>{children}</AuthenticatedClientShell>;

  return (
    <ToastProvider>
      <TenantTheme />
      <Analytics />
      <MobileAppInstallPrompt />
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col">{content}</div>
        <Footer compact={!publicPath} />
      </div>
    </ToastProvider>
  );
}
