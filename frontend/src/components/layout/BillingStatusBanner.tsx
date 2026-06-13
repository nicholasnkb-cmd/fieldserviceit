'use client';

import Link from 'next/link';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

interface BillingSummary {
  entitlement?: {
    allowed: boolean;
    state: string;
    gracePeriodEndsAt?: string | null;
  };
}

export function BillingStatusBanner() {
  const { authChecked, isAuthenticated, user } = useAuthStore();
  const [summary, setSummary] = useState<BillingSummary | null>(null);

  useEffect(() => {
    if (!authChecked || !isAuthenticated || !user?.companyId) return;
    api.get('/billing/summary').then(setSummary).catch(() => {});
  }, [authChecked, isAuthenticated, user?.companyId]);

  const entitlement = summary?.entitlement;
  if (!entitlement || !['GRACE_PERIOD', 'PAST_DUE', 'UNPAID', 'CANCELED', 'INCOMPLETE'].includes(entitlement.state)) return null;

  const inGrace = entitlement.state === 'GRACE_PERIOD';
  return (
    <div className={`flex flex-col gap-3 border-b px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${inGrace ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-red-200 bg-red-50 text-red-950'}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {inGrace
            ? `Payment is past due. Service remains available through ${formatDate(entitlement.gracePeriodEndsAt)}.`
            : 'Your subscription needs attention. Billing remains available so you can restore service.'}
        </span>
      </div>
      <Link href="/billing" className="inline-flex shrink-0 items-center gap-2 font-semibold underline underline-offset-2">
        <CreditCard className="h-4 w-4" />
        Resolve billing
      </Link>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return 'the end of the grace period';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
