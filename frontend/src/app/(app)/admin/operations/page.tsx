'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, CheckCircle2, DatabaseBackup, Mail, RefreshCw, Rocket, ShieldAlert } from 'lucide-react';
import { api } from '../../../../lib/api';

type Notice = { id: string; title: string; message: string; noticeType: string; status: string; startsAt?: string; endsAt?: string; publishedAt?: string; updatedAt: string };
type Overview = {
  generatedAt: string;
  readiness: { score: number; status: string; actions: { name: string; severity: string; detail: string; href: string }[] };
  deployments: any[]; backups: any[]; jobs: any[]; email: any; securityAlerts: any[]; notices: Notice[];
  migrations: { applied: number; pending: string[]; failed: any[] };
};

const emptyNotice = { title: '', message: '', noticeType: 'MAINTENANCE', status: 'SCHEDULED', startsAt: '', endsAt: '', published: true };

export default function OperationsConsolePage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [notice, setNotice] = useState(emptyNotice);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get<Overview>('/admin/operations-overview').then(setOverview).catch((error) => setMessage(error.message || 'Operations overview failed to load'));
  }, []);
  useEffect(() => { load(); const timer = window.setInterval(load, 60_000); return () => window.clearInterval(timer); }, [load]);

  const publish = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try { await api.post('/admin/status-notices', notice); setNotice(emptyNotice); setMessage('Customer status notice published'); load(); }
    catch (error: any) { setMessage(error.message || 'Notice could not be published'); }
    finally { setBusy(false); }
  };
  const resolve = async (item: Notice) => { await api.patch(`/admin/status-notices/${item.id}`, { status: 'RESOLVED', published: true }); load(); };
  const cleanup = async (dryRun: boolean) => {
    const result = await api.post('/admin/companies/cleanup-abandoned', { dryRun });
    setMessage(dryRun ? `${result.count} abandoned tenant candidate(s) found` : `${result.count} abandoned tenant(s) removed`);
  };

  if (!overview) return <div className="p-8">Loading operations console...</div>;
  const cards = [
    { label: 'Readiness score', value: `${overview.readiness.score}%`, icon: Activity, ok: overview.readiness.score >= 90 },
    { label: 'Latest deployment', value: overview.deployments[0]?.status || 'No data', icon: Rocket, ok: overview.deployments[0]?.status === 'SUCCEEDED' },
    { label: 'Latest backup', value: overview.backups[0]?.status || 'No data', icon: DatabaseBackup, ok: overview.backups[0]?.status === 'COMPLETED' },
    { label: 'Migrations', value: overview.migrations.pending.length || overview.migrations.failed.length ? `${overview.migrations.pending.length} pending` : 'Current', icon: CheckCircle2, ok: !overview.migrations.pending.length && !overview.migrations.failed.length },
    { label: 'Outbound email', value: overview.email?.lastTestStatus || 'Not tested', icon: Mail, ok: overview.email?.lastTestStatus === 'PASS' },
    { label: 'Open security alerts', value: String(overview.securityAlerts.filter((item) => !item.acknowledgedAt).length), icon: ShieldAlert, ok: !overview.securityAlerts.some((item) => !item.acknowledgedAt && item.severity === 'critical') },
  ];

  return <div className="space-y-6 p-6 lg:p-8">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold text-blue-700">Platform operations</p><h1 className="text-3xl font-bold text-gray-950">Operations console</h1><p className="mt-1 text-sm text-gray-500">Deployments, uptime dependencies, backups, migrations, email, security, incidents, and customer notices.</p></div><button onClick={load} className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium"><RefreshCw className="h-4 w-4" />Refresh</button></div>
    {message && <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{message}</div>}
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">{cards.map(({ label, value, icon: Icon, ok }) => <div key={label} className="rounded border border-gray-200 bg-white p-4"><Icon className={`h-5 w-5 ${ok ? 'text-emerald-600' : 'text-amber-600'}`} /><p className="mt-3 text-xs font-medium uppercase text-gray-500">{label}</p><p className="mt-1 font-semibold text-gray-950">{value}</p></div>)}</div>
    {overview.readiness.actions.length > 0 && <section className="rounded border border-amber-200 bg-amber-50 p-5"><h2 className="font-semibold text-amber-950">Recommended admin actions</h2><div className="mt-3 grid gap-2 lg:grid-cols-2">{overview.readiness.actions.map((action) => <Link key={action.name} href={action.href} className="rounded border border-amber-200 bg-white p-3 hover:border-amber-400"><span className="flex items-center gap-2 font-medium text-gray-950"><AlertTriangle className="h-4 w-4 text-amber-600" />{action.name}</span><p className="mt-1 text-sm text-gray-600">{action.detail}</p></Link>)}</div></section>}
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded border border-gray-200 bg-white p-5"><h2 className="font-semibold text-gray-950">Recent operational events</h2><div className="mt-3 divide-y divide-gray-100">{[...overview.deployments.map((item) => ({ id: `d-${item.id}`, label: `Deployment · ${item.component}`, status: item.status, at: item.completedAt || item.createdAt })), ...overview.backups.map((item) => ({ id: `b-${item.id}`, label: 'Encrypted backup', status: item.status, at: item.completedAt }))].sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()).slice(0, 10).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{item.label}<br/><span className="text-xs text-gray-500">{item.at ? new Date(item.at).toLocaleString() : 'In progress'}</span></span><strong className={['SUCCEEDED','COMPLETED','PASS'].includes(item.status) ? 'text-emerald-700' : 'text-amber-700'}>{item.status}</strong></div>)}</div></section>
      <section className="rounded border border-gray-200 bg-white p-5"><h2 className="font-semibold text-gray-950">Customer maintenance and incident notice</h2><form onSubmit={publish} className="mt-4 space-y-3"><input required maxLength={191} placeholder="Notice title" value={notice.title} onChange={(event) => setNotice({ ...notice, title: event.target.value })} className="w-full rounded border border-gray-300 px-3 py-2"/><textarea required maxLength={4000} placeholder="What customers need to know" value={notice.message} onChange={(event) => setNotice({ ...notice, message: event.target.value })} className="min-h-24 w-full rounded border border-gray-300 px-3 py-2"/><div className="grid gap-3 sm:grid-cols-2"><select value={notice.noticeType} onChange={(event) => setNotice({ ...notice, noticeType: event.target.value })} className="rounded border border-gray-300 px-3 py-2"><option>MAINTENANCE</option><option>INCIDENT</option><option>UPDATE</option></select><select value={notice.status} onChange={(event) => setNotice({ ...notice, status: event.target.value })} className="rounded border border-gray-300 px-3 py-2"><option>SCHEDULED</option><option>INVESTIGATING</option><option>IDENTIFIED</option><option>MONITORING</option><option>RESOLVED</option></select><input type="datetime-local" value={notice.startsAt} onChange={(event) => setNotice({ ...notice, startsAt: event.target.value })} className="rounded border border-gray-300 px-3 py-2"/><input type="datetime-local" value={notice.endsAt} onChange={(event) => setNotice({ ...notice, endsAt: event.target.value })} className="rounded border border-gray-300 px-3 py-2"/></div><button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Publish notice</button></form></section>
    </div>
    <section className="rounded border border-gray-200 bg-white p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-gray-950">Published notices</h2><p className="text-sm text-gray-500">These updates appear on the public service-status page.</p></div><div className="flex gap-2"><button onClick={() => cleanup(true)} className="rounded border border-gray-300 px-3 py-2 text-sm">Preview tenant cleanup</button><button onClick={() => confirm('Remove abandoned tenants with no verified users, tickets, or assets?') && cleanup(false)} className="rounded border border-red-200 px-3 py-2 text-sm text-red-700">Run cleanup</button></div></div><div className="mt-3 divide-y divide-gray-100">{overview.notices.map((item) => <div key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div><strong>{item.title}</strong><p className="text-sm text-gray-600">{item.message}</p></div>{item.status !== 'RESOLVED' && <button onClick={() => resolve(item)} className="text-sm font-semibold text-emerald-700">Mark resolved</button>}</div>)}</div></section>
  </div>;
}
