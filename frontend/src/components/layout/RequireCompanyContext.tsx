'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function RequireCompanyContext({ children, area, allowGlobal = false }: { children: React.ReactNode; area: string; allowGlobal?: boolean }) {
  const { user, activeCompanyContext } = useAuthStore();

  if (user?.role === 'SUPER_ADMIN' && !activeCompanyContext && !allowGlobal) {
    return (
      <div className="p-8">
        <div className="mx-auto flex min-h-[360px] max-w-xl flex-col items-center justify-center rounded border border-gray-200 bg-white px-6 py-10 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded border border-blue-100 bg-blue-50 text-blue-700">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold text-gray-950">Select a business first</h1>
          <p className="mt-2 text-sm text-gray-500">
            {area} is tenant-specific. Choose a company from the top bar to view that business space, or stay in Global admin for platform settings.
          </p>
          <Link href="/admin/companies" className="mt-5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            Open company management
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
