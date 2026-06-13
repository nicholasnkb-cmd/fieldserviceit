'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';
import { RequireCompanyContext } from '../../../components/layout/RequireCompanyContext';

interface TicketSummary { total: number; byStatus: { status: string; _count: number }[]; byPriority: { priority: string; _count: number }[] }
interface SlaCompliance { total: number; compliant: number; rate: number }
interface TechPerf { id: string; name: string; resolvedTickets: number; avgResolutionTime: number; totalDispatches: number }
interface AssetInv { assetType: string; _count: number }
interface CustomReport {
  name: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
  total: number;
  truncated: boolean;
  generatedAt: string;
}

const customFields = [
  ['ticketNumber', 'Ticket Number'],
  ['title', 'Title'],
  ['status', 'Status'],
  ['priority', 'Priority'],
  ['type', 'Type'],
  ['category', 'Category'],
  ['location', 'Location'],
  ['createdAt', 'Created'],
  ['resolvedAt', 'Resolved'],
  ['assignedTo', 'Assigned To'],
  ['resolutionDurationMinutes', 'Resolution Time (min)'],
] as const;
const ticketStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'CANCELLED'];
const ticketPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function ReportsPage() {
  const [tab, setTab] = useState<'tickets' | 'sla' | 'technician' | 'assets' | 'custom'>('tickets');
  const [ticketSummary, setTicketSummary] = useState<TicketSummary | null>(null);
  const [sla, setSla] = useState<SlaCompliance | null>(null);
  const [techPerf, setTechPerf] = useState<TechPerf[]>([]);
  const [assetInv, setAssetInv] = useState<AssetInv[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState('');
  const [customReport, setCustomReport] = useState<CustomReport | null>(null);
  const [customForm, setCustomForm] = useState({
    name: 'Custom Ticket Report',
    fields: ['ticketNumber', 'title', 'status', 'priority', 'createdAt'],
    statuses: [] as string[],
    priorities: [] as string[],
    from: '',
    to: '',
  });
  const { user, activeCompanyContext } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && !activeCompanyContext) {
      setLoading(false);
      return;
    }
    if (tab === 'custom') {
      setLoading(false);
      api.get('/reports/preferences').then(setPreferences).catch(() => {});
      return;
    }
    setLoading(true);
    const fetches: Record<string, Promise<any>> = {
      tickets: api.get('/reports/tickets'),
      sla: api.get('/reports/sla'),
      technician: api.get('/reports/technician'),
      assets: api.get('/reports/assets'),
    };
    Promise.all([fetches[tab], api.get('/reports/preferences')]).then(([data, reportPreferences]) => {
      setPreferences(reportPreferences);
      if (tab === 'tickets') setTicketSummary(data);
      if (tab === 'sla') setSla(data);
      if (tab === 'technician') setTechPerf(data || []);
      if (tab === 'assets') setAssetInv(data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [activeCompanyContext, tab, user?.role]);

  const tabs = [
    { key: 'tickets' as const, label: 'Tickets' },
    ...(isAdmin ? [{ key: 'sla' as const, label: 'SLA Compliance' }] : []),
    ...(isAdmin ? [{ key: 'technician' as const, label: 'Technician Performance' }] : []),
    { key: 'assets' as const, label: 'Asset Inventory' },
    { key: 'custom' as const, label: 'Custom Report' },
  ];

  const toggleCustomValue = (key: 'fields' | 'statuses' | 'priorities', value: string) => {
    setCustomForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  };

  const generateCustomReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customForm.fields.length) {
      setCustomError('Select at least one report column.');
      return;
    }
    setCustomLoading(true);
    setCustomError('');
    try {
      const payload = {
        ...customForm,
        from: customForm.from || undefined,
        to: customForm.to || undefined,
      };
      setCustomReport(await api.post('/reports/custom', payload));
    } catch (error: any) {
      setCustomError(error.message || 'Could not generate the report.');
    } finally {
      setCustomLoading(false);
    }
  };

  const downloadCustomReport = () => {
    if (!customReport) return;
    const escape = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [
      customReport.columns.map((column) => escape(column.label)).join(','),
      ...customReport.rows.map((row) => customReport.columns.map((column) => escape(row[column.key] ?? '')).join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${customReport.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'custom-report'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RequireCompanyContext area="Reports">
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4 rounded-lg border bg-white p-5 shadow-sm" style={{ borderTopColor: preferences?.accentColor, borderTopWidth: preferences ? 4 : 1 }}>
        {preferences?.showCompanyLogo && preferences?.logoUrl && <img src={preferences.logoUrl} alt="" className="h-14 w-20 object-contain" />}
        <div>
          <h1 className="text-2xl font-bold">{preferences?.headerText || `${preferences?.companyName || ''} Reports`.trim() || 'Reports'}</h1>
          <p className="mt-1 text-sm text-gray-500">Default reporting period: {preferences?.defaultDateRange || '30d'} · {preferences?.pageOrientation || 'portrait'} layout</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === t.key ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : (
        <>
          {tab === 'tickets' && ticketSummary && (
            <div className="space-y-6">
              <Link href="/tickets" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold mb-2">Total Tickets: <span className="text-primary text-2xl">{ticketSummary.total}</span></h2>
              </Link>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">By Status</h3>
                  <div className="space-y-3">
                    {ticketSummary.byStatus.map((s) => (
                      <Link key={s.status} href={`/tickets?status=${s.status}`}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                        <span className="text-sm text-gray-600">{s.status}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-primary rounded" style={{ width: `${Math.max((s._count / Math.max(ticketSummary.total, 1)) * 200, 4)}px` }} />
                          <span className="text-sm font-medium w-8 text-right">{s._count}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">By Priority</h3>
                  <div className="space-y-3">
                    {ticketSummary.byPriority.map((p) => (
                      <Link key={p.priority} href={`/tickets?priority=${p.priority}`}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                        <span className="text-sm text-gray-600">{p.priority}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-orange-400 rounded" style={{ width: `${Math.max((p._count / Math.max(ticketSummary.total, 1)) * 200, 4)}px` }} />
                          <span className="text-sm font-medium w-8 text-right">{p._count}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'sla' && sla && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">SLA Compliance</h2>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <Link href="/tickets" className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors block">
                  <p className="text-3xl font-bold text-gray-900">{sla.total}</p>
                  <p className="text-sm text-gray-500">Total Resolved</p>
                </Link>
                <Link href="/tickets?status=RESOLVED" className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors block">
                  <p className="text-3xl font-bold text-green-600">{sla.compliant}</p>
                  <p className="text-sm text-green-600">Compliant</p>
                </Link>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{sla.rate.toFixed(1)}%</p>
                  <p className="text-sm text-blue-600">Compliance Rate</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'technician' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Technician</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Resolved Tickets</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Avg Resolution (min)</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Dispatches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {techPerf.map((t) => (
                    <tr key={t.id} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => router.push('/dispatch')}>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600 hover:underline">{t.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{t.resolvedTickets}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.avgResolutionTime}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.totalDispatches}</td>
                    </tr>
                  ))}
                  {techPerf.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No technician data</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'assets' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Asset Type</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assetInv.map((a) => (
                    <tr key={a.assetType} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => router.push(`/assets?assetType=${a.assetType}`)}>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600 hover:underline">{a.assetType}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{a._count}</td>
                    </tr>
                  ))}
                  {assetInv.length === 0 && <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500">No assets found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'custom' && (
            <div className="space-y-6">
              <form onSubmit={generateCustomReport} className="rounded-lg bg-white p-6 shadow">
                <div className="grid gap-5 lg:grid-cols-3">
                  <label className="text-sm font-medium text-gray-700">
                    Report name
                    <input value={customForm.name} maxLength={100} onChange={(event) => setCustomForm({ ...customForm, name: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    From
                    <input type="date" value={customForm.from} onChange={(event) => setCustomForm({ ...customForm, from: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    To
                    <input type="date" value={customForm.to} onChange={(event) => setCustomForm({ ...customForm, to: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-normal" />
                  </label>
                </div>

                <fieldset className="mt-6">
                  <legend className="text-sm font-semibold text-gray-900">Report columns</legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {customFields.map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                        <input type="checkbox" checked={customForm.fields.includes(key)} onChange={() => toggleCustomValue('fields', key)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <fieldset>
                    <legend className="text-sm font-semibold text-gray-900">Status filters</legend>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {ticketStatuses.map((status) => (
                        <label key={status} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={customForm.statuses.includes(status)} onChange={() => toggleCustomValue('statuses', status)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                          {status.replaceAll('_', ' ')}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend className="text-sm font-semibold text-gray-900">Priority filters</legend>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {ticketPriorities.map((priority) => (
                        <label key={priority} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={customForm.priorities.includes(priority)} onChange={() => toggleCustomValue('priorities', priority)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                          {priority}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {customError && <p className="mt-4 text-sm text-red-600">{customError}</p>}
                <button type="submit" disabled={customLoading}
                  className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
                  {customLoading ? 'Generating...' : 'Generate report'}
                </button>
              </form>

              {customReport && (
                <div className="overflow-hidden rounded-lg bg-white shadow">
                  <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                      <h2 className="font-semibold text-gray-900">{customReport.name}</h2>
                      <p className="text-sm text-gray-500">{customReport.total} rows{customReport.truncated ? ' (limited to 500)' : ''}</p>
                    </div>
                    <button onClick={downloadCustomReport} className="rounded-md border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Download CSV</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>{customReport.columns.map((column) => <th key={column.key} className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{column.label}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y">
                        {customReport.rows.map((row, index) => (
                          <tr key={`${row.ticketNumber || 'row'}-${index}`}>
                            {customReport.columns.map((column) => <td key={column.key} className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{String(row[column.key] ?? '')}</td>)}
                          </tr>
                        ))}
                        {!customReport.rows.length && <tr><td colSpan={customReport.columns.length} className="px-6 py-10 text-center text-sm text-gray-500">No tickets matched the selected parameters.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {preferences?.footerText && <p className="mt-8 border-t pt-4 text-center text-xs text-gray-500">{preferences.footerText}</p>}
    </div>
    </RequireCompanyContext>
  );
}
