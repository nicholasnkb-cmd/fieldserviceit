'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, ChevronDown, ChevronUp, Circle, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { trackProductEvent } from '../../lib/analytics';

const steps = [
  { id: 'settings', label: 'Review company settings and branding', href: '/settings' },
  { id: 'users', label: 'Invite or review team members', href: '/admin/users' },
  { id: 'ticket', label: 'Create the first service ticket', href: '/tickets/new' },
  { id: 'rmm', label: 'Configure and test an RMM provider', href: '/integrations/rmm' },
  { id: 'security', label: 'Review security and access controls', href: '/admin/security-operations' },
];

export function OnboardingChecklist() {
  const pathname = usePathname();
  const { user, company, activeCompanyContext } = useAuthStore();
  const [completed, setCompleted] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const companyId = activeCompanyContext?.id || company?.id || user?.companyId || 'global';
  const storageKey = `fieldserviceit:onboarding:${companyId}:${user?.id || 'user'}`;

  const visible = user?.userType === 'BUSINESS' && ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN'].includes(user.role);

  useEffect(() => {
    if (!visible) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setCompleted(Array.isArray(saved.completed) ? saved.completed : []);
      setDismissed(Boolean(saved.dismissed));
      setCollapsed(Boolean(saved.collapsed));
    } catch {
      setDismissed(false);
    }
  }, [storageKey, visible]);

  useEffect(() => {
    if (!visible) return;
    const current = steps.find((step) => pathname === step.href || pathname.startsWith(`${step.href}/`));
    if (!current || completed.includes(current.id)) return;
    const next = [...completed, current.id];
    setCompleted(next);
    localStorage.setItem(storageKey, JSON.stringify({ completed: next, dismissed, collapsed }));
    trackProductEvent('onboarding_step_completed', { step: current.id });
  }, [collapsed, completed, dismissed, pathname, storageKey, visible]);

  const progress = useMemo(() => Math.round((completed.length / steps.length) * 100), [completed.length]);

  const saveState = (next: { dismissed?: boolean; collapsed?: boolean }) => {
    const state = {
      completed,
      dismissed: next.dismissed ?? dismissed,
      collapsed: next.collapsed ?? collapsed,
    };
    setDismissed(state.dismissed);
    setCollapsed(state.collapsed);
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  if (!visible || dismissed || completed.length === steps.length) return null;

  return (
    <section className="border-b border-blue-200 bg-blue-50 px-6 py-4" aria-labelledby="onboarding-title">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-4">
              <h2 id="onboarding-title" className="font-semibold text-blue-950">Workspace setup: {progress}% complete</h2>
              <div className="flex gap-1">
                <button onClick={() => saveState({ collapsed: !collapsed })} className="rounded p-1 text-blue-800 hover:bg-blue-100" aria-label={collapsed ? 'Expand onboarding checklist' : 'Collapse onboarding checklist'}>
                  {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
                <button onClick={() => saveState({ dismissed: true })} className="rounded p-1 text-blue-800 hover:bg-blue-100" aria-label="Dismiss onboarding checklist"><X size={18} /></button>
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full bg-blue-600" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
        {!collapsed && (
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {steps.map((step) => {
              const done = completed.includes(step.id);
              return (
                <Link key={step.id} href={step.href} className="flex items-start gap-2 rounded-md bg-white px-3 py-3 text-sm text-gray-700 shadow-sm hover:ring-1 hover:ring-blue-300">
                  {done ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={17} /> : <Circle className="mt-0.5 shrink-0 text-blue-400" size={17} />}
                  <span className={done ? 'text-gray-500 line-through' : 'font-medium'}>{step.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
