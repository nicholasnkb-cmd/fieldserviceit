'use client';

import Link from 'next/link';
import { useAuthStore } from '../../stores/authStore';

export function TenantContextBanner() {
  const { user, activeCompanyContext } = useAuthStore();

  if (user?.role !== 'SUPER_ADMIN' || !activeCompanyContext) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
      <span className="font-semibold">Super admin view:</span> You are working inside {activeCompanyContext.name}.
      <Link href="/admin/companies" className="ml-2 font-medium underline underline-offset-2">
        Manage businesses
      </Link>
    </div>
  );
}

