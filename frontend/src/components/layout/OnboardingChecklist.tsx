'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronDown, ChevronUp, Circle, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

type SetupStep = { id: string; label: string; href: string; complete: boolean };

export function OnboardingChecklist() {
  const { user, company, activeCompanyContext } = useAuthStore();
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const companyId = activeCompanyContext?.id || company?.id || user?.companyId || 'global';
  const storageKey = `fieldserviceit:onboarding:${companyId}:${user?.id || 'user'}`;
  const visible = user?.userType === 'BUSINESS' && ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN'].includes(user.role) && Boolean(activeCompanyContext?.id || user?.companyId);

  useEffect(() => {
    if (!visible) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setDismissed(Boolean(saved.dismissed));
      setCollapsed(Boolean(saved.collapsed));
    } catch { setDismissed(false); }
    api.get<{ steps: SetupStep[] }>('/operations/workspace-setup')
      .then((data) => setSteps(Array.isArray(data.steps) ? data.steps : []))
      .catch(() => setSteps([]));
  }, [storageKey, visible]);

  const completed = useMemo(() => steps.filter((step) => step.complete).length, [steps]);
  const progress = steps.length ? Math.round((completed / steps.length) * 100) : 0;
  const saveState = (next: { dismissed?: boolean; collapsed?: boolean }) => {
    const state = { dismissed: next.dismissed ?? dismissed, collapsed: next.collapsed ?? collapsed };
    setDismissed(state.dismissed);
    setCollapsed(state.collapsed);
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  if (!visible || dismissed || !steps.length || completed === steps.length) return null;

  return (
    <section className="border-b border-blue-200 bg-blue-50 px-6 py-4" aria-labelledby="onboarding-title">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-4">
              <h2 id="onboarding-title" className="font-semibold text-blue-950">Workspace setup: {progress}% complete</h2>
              <div className="flex gap-1">
                <button onClick={() => saveState({ collapsed: !collapsed })} className="rounded p-1 text-blue-800 hover:bg-blue-100" aria-label={collapsed ? 'Expand onboarding checklist' : 'Collapse onboarding checklist'}>{collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
                <button onClick={() => saveState({ dismissed: true })} className="rounded p-1 text-blue-800 hover:bg-blue-100" aria-label="Dismiss onboarding checklist"><X size={18} /></button>
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100" role="progressbar" aria-label="Workspace setup progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full bg-blue-600 motion-safe:transition-[width]" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
        {!collapsed && <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{steps.map((step) => (
          <Link key={step.id} href={step.href} className="flex min-h-11 items-start gap-2 rounded-md bg-white px-3 py-3 text-sm text-gray-700 shadow-sm hover:ring-1 hover:ring-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            {step.complete ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={17} /> : <Circle className="mt-0.5 shrink-0 text-blue-400" size={17} />}
            <span className={step.complete ? 'text-gray-500 line-through' : 'font-medium'}>{step.label}</span>
          </Link>
        ))}</div>}
      </div>
    </section>
  );
}
