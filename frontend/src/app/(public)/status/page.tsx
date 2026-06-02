'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Database, Globe, RefreshCw, Server, TriangleAlert } from 'lucide-react';

type CheckState = {
  name: string;
  status: 'ok' | 'degraded' | 'error' | 'checking';
  detail: string;
  latencyMs?: number;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.fieldserviceit.com';

const routeChecks = [
  { name: 'Home', url: '/' },
  { name: 'Login', url: '/login' },
  { name: 'Network', url: '/network' },
  { name: 'Topology', url: '/topology' },
  { name: 'Customer Portal', url: '/customer-portal' },
];

export default function StatusPage() {
  const [checks, setChecks] = useState<CheckState[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');

  const load = async () => {
    setLoading(true);
    const next: CheckState[] = [];
    const frontend = await timedJson('/api/client-health');
    next.push({
      name: 'Frontend runtime',
      status: frontend.ok ? 'ok' : 'error',
      detail: frontend.ok ? `${frontend.body?.service || 'frontend'} online` : frontend.error,
      latencyMs: frontend.latencyMs,
    });

    const backend = await timedJson(`${apiBase}/v1/health`);
    const health = backend.body?.data || backend.body;
    next.push({
      name: 'Backend API',
      status: backend.ok && health?.status === 'ok' ? 'ok' : backend.ok ? 'degraded' : 'error',
      detail: backend.ok ? `API ${health?.status || 'responded'}` : backend.error,
      latencyMs: backend.latencyMs,
    });
    next.push({
      name: 'Database',
      status: health?.database?.status === 'ok' ? 'ok' : backend.ok ? 'degraded' : 'error',
      detail: health?.database?.status === 'ok' ? 'MySQL connection healthy' : 'Database health unavailable',
    });
    next.push({
      name: 'Monitoring worker',
      status: health?.worker?.status === 'ok' ? 'ok' : 'degraded',
      detail: health?.worker?.lastPollAt ? `Last poll ${new Date(health.worker.lastPollAt).toLocaleString()}` : 'No recent poll recorded',
    });

    const routeResults = await Promise.all(routeChecks.map(async (route) => {
      const result = await timedFetch(route.url);
      return {
        name: route.name,
        status: result.ok ? 'ok' : 'error',
        detail: result.ok ? `HTTP ${result.status}` : `${result.status || 'ERR'} ${result.error}`,
        latencyMs: result.latencyMs,
      } as CheckState;
    }));

    setChecks([...next, ...routeResults]);
    setUpdatedAt(new Date().toLocaleString());
    setLoading(false);
  };

  useEffect(() => {
    load();
    const handle = window.setInterval(load, 60000);
    return () => window.clearInterval(handle);
  }, []);

  const summary = useMemo(() => {
    if (checks.some((item) => item.status === 'error')) return { label: 'Degraded', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    if (checks.some((item) => item.status === 'degraded')) return { label: 'Partial', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { label: 'Operational', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  }, [checks]);

  return (
    <div className="bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className={`rounded-lg border ${summary.border} ${summary.bg} p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">Platform Status</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-950">FieldserviceIT Status</h1>
              <p className="mt-2 text-sm text-gray-600">Frontend, API, database, worker, and key route health.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-md border px-3 py-2 text-sm font-semibold ${summary.border} ${summary.color} bg-white`}>{summary.label}</span>
              <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {checks.map((check) => (
            <div key={check.name} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className={`rounded-md p-2 ${statusClass(check.status)}`}>
                  <StatusIcon name={check.name} status={check.status} />
                </div>
                <span className={`text-xs font-semibold uppercase ${statusText(check.status)}`}>{check.status}</span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-gray-950">{check.name}</h2>
              <p className="mt-1 min-h-10 text-sm text-gray-600">{check.detail}</p>
              {check.latencyMs !== undefined && <p className="mt-3 text-xs text-gray-400">{check.latencyMs} ms</p>}
            </div>
          ))}
        </section>

        <p className="text-sm text-gray-500">Last updated: {updatedAt || 'checking...'}</p>
      </div>
    </div>
  );
}

async function timedJson(url: string) {
  const result = await timedFetch(url);
  if (!result.ok) return { ...result, body: null };
  try {
    return { ...result, body: await result.response!.json() };
  } catch {
    return { ...result, ok: false, error: 'Invalid JSON', body: null };
  }
}

async function timedFetch(url: string) {
  const started = Date.now();
  try {
    const response = await fetch(url, { cache: 'no-store' });
    return {
      ok: response.ok,
      status: response.status,
      response,
      error: response.ok ? '' : response.statusText,
      latencyMs: Date.now() - started,
    };
  } catch (err: any) {
    return { ok: false, status: 0, response: null, error: err.message || 'Network error', latencyMs: Date.now() - started };
  }
}

function StatusIcon({ name, status }: { name: string; status: CheckState['status'] }) {
  if (status === 'error' || status === 'degraded') return <TriangleAlert size={18} />;
  if (name.includes('Database')) return <Database size={18} />;
  if (name.includes('Backend')) return <Server size={18} />;
  if (name.includes('worker')) return <Activity size={18} />;
  if (name.includes('Frontend')) return <Globe size={18} />;
  return <CheckCircle2 size={18} />;
}

function statusClass(status: CheckState['status']) {
  if (status === 'error') return 'bg-rose-100 text-rose-700';
  if (status === 'degraded') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

function statusText(status: CheckState['status']) {
  if (status === 'error') return 'text-rose-700';
  if (status === 'degraded') return 'text-amber-700';
  return 'text-emerald-700';
}
