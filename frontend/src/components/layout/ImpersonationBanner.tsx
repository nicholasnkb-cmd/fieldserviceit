'use client';

import { useEffect, useState } from 'react';
import { LogOut, UserRoundSearch } from 'lucide-react';
import { api } from '../../lib/api';

const SESSION_KEY = 'fsit.impersonationSession';
const TARGET_KEY = 'fsit.impersonationTarget';

export function ImpersonationBanner() {
  const [sessionId, setSessionId] = useState('');
  const [target, setTarget] = useState<any>(null);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem(SESSION_KEY) || '';
    let storedTarget: any = null;
    try { storedTarget = JSON.parse(localStorage.getItem(TARGET_KEY) || 'null'); } catch {}
    if (storedTarget?.expiresAt && new Date(storedTarget.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TARGET_KEY);
      return;
    }
    setSessionId(id);
    setTarget(storedTarget);
  }, []);

  if (!sessionId) return null;

  const endSession = async () => {
    setEnding(true);
    try {
      await api.post(`/admin/permissions/impersonation/${sessionId}/end`, {});
    } finally {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TARGET_KEY);
      window.location.assign('/admin/permissions');
    }
  };

  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b border-red-300 bg-red-50 px-4 py-2 text-sm text-red-950">
      <div className="flex min-w-0 items-center gap-2">
        <UserRoundSearch className="h-4 w-4 shrink-0" />
        <span className="truncate"><strong>Impersonation active:</strong> {target?.email || target?.firstName || 'support user'} · expires {target?.expiresAt ? new Date(target.expiresAt).toLocaleTimeString() : 'soon'}</span>
      </div>
      <button type="button" onClick={endSession} disabled={ending} title="End impersonation" className="inline-flex h-8 shrink-0 items-center gap-2 border border-red-300 bg-white px-3 font-semibold text-red-800 disabled:opacity-50">
        <LogOut className="h-4 w-4" />
        End
      </button>
    </div>
  );
}
