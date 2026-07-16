'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../stores/authStore';
import { connectSocket, disconnectSocket, onSocketEvent } from '../../../lib/socket';
import { formatDate } from '../../../lib/utils';
import { api } from '../../../lib/api';
import { EmptyState } from '../../../components/ui/EmptyState';
import { AlertTriangle, CalendarClock, MonitorX, ShieldAlert, TicketPlus, UsersRound } from 'lucide-react';

interface TicketSummary {
  total: number;
  byStatus: { status: string; _count: number }[];
  byPriority: { priority: string; _count: number }[];
  resolvedToday: number;
  avgResolutionTime: number;
}

interface OperationsSummary {
  overdueTickets: number;
  slaAtRisk: number;
  offlineDevices: number;
  warrantiesExpiring: number;
  highSecurityFindings: number;
  technicianWorkload: Array<{ id: string; name: string; activeTickets: number; activeDispatches: number }>;
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-500',
  ASSIGNED: 'bg-indigo-500',
  IN_PROGRESS: 'bg-yellow-500',
  ON_HOLD: 'bg-orange-500',
  RESOLVED: 'bg-emerald-500',
  CLOSED: 'bg-gray-500',
};

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-blue-500',
};

const feedDotColor = (action: string) => {
  if (action === 'COMMENT') return 'bg-blue-400';
  if (action === 'STATUS_CHANGED') return 'bg-purple-400';
  if (action === 'ASSIGNED') return 'bg-green-400';
  if (action === 'RESOLVED') return 'bg-emerald-500';
  if (action === 'HOLD') return 'bg-orange-400';
  if (action === 'CREATED') return 'bg-gray-400';
  if (action === 'ATTACHMENT') return 'bg-pink-400';
  return 'bg-gray-300';
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [operations, setOperations] = useState<OperationsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    if (user.userType === 'PUBLIC') {
      router.push('/my-tickets');
      return;
    }
    if (user.role === 'GLOBAL_TECH') {
      router.push('/tickets');
      return;
    }
  }, [user, router]);

  const fetchSummary = useCallback(() => {
    api.get('/reports/tickets')
      .then(setSummary)
      .catch(() => { /* stay on page, show empty */ })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  useEffect(() => {
    api.get('/reports/activity')
      .then(setActivity)
      .catch(() => {});
    api.get<OperationsSummary>('/reports/operations')
      .then(setOperations)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.companyId) return;
    connectSocket(user.companyId);
    const unsub1 = onSocketEvent('ticket:created', fetchSummary);
    const unsub2 = onSocketEvent('ticket:updated', fetchSummary);
    const unsub3 = onSocketEvent('ticket:deleted', fetchSummary);
    return () => { unsub1(); unsub2(); unsub3(); disconnectSocket(); };
  }, [user?.companyId, fetchSummary]);

  if (loading) return <div className="p-8">Loading...</div>;

  const total = summary?.total || 0;

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/tickets" className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow block">
          <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
          <p className="text-3xl font-bold mt-1">{total}</p>
        </Link>
        <Link href="/tickets?status=OPEN" className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow block">
          <h3 className="text-sm font-medium text-gray-500">Open Tickets</h3>
          <p className="text-3xl font-bold mt-1 text-blue-600">
            {summary?.byStatus?.find((s) => s.status === 'OPEN')?._count || 0}
          </p>
        </Link>
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-medium text-gray-500">Resolved Today</h3>
          <p className="text-3xl font-bold mt-1 text-emerald-600">{summary?.resolvedToday || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-medium text-gray-500">Avg Resolution</h3>
          <p className="text-3xl font-bold mt-1 text-purple-600">
            {summary?.avgResolutionTime ? `${summary.avgResolutionTime}m` : '-'}
          </p>
        </div>
      </div>

      {operations && (
        <section className="mb-8" aria-labelledby="operations-heading">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="operations-heading" className="text-lg font-semibold">Operations requiring attention</h2>
              <p className="text-sm text-gray-500">Live SLA, infrastructure, warranty, and security risk signals.</p>
            </div>
            <Link href="/dashboards" className="text-sm font-semibold text-primary hover:underline">Open advanced dashboards</Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'SLA overdue', value: operations.overdueTickets, href: '/tickets?status=OPEN', icon: AlertTriangle, tone: 'text-red-700 bg-red-50 border-red-200' },
              { label: 'SLA at risk', value: operations.slaAtRisk, href: '/sla', icon: CalendarClock, tone: 'text-amber-700 bg-amber-50 border-amber-200' },
              { label: 'Offline devices', value: operations.offlineDevices, href: '/network', icon: MonitorX, tone: 'text-orange-700 bg-orange-50 border-orange-200' },
              { label: 'Warranties ≤ 90d', value: operations.warrantiesExpiring, href: '/assets', icon: CalendarClock, tone: 'text-blue-700 bg-blue-50 border-blue-200' },
              { label: 'High security findings', value: operations.highSecurityFindings, href: '/security-center', icon: ShieldAlert, tone: 'text-purple-700 bg-purple-50 border-purple-200' },
            ].map(({ label, value, href, icon: Icon, tone }) => (
              <Link key={label} href={href} className={`rounded-lg border p-4 transition hover:shadow-sm ${tone}`}>
                <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{label}</span><Icon size={18} aria-hidden="true" /></div>
                <p className="mt-3 text-2xl font-bold">{value}</p>
              </Link>
            ))}
          </div>
          {operations.technicianWorkload.length > 0 && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2"><UsersRound size={18} aria-hidden="true" /><h3 className="font-semibold">Technician workload</h3></div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {operations.technicianWorkload.map((item) => (
                  <div key={item.id} className="rounded border border-gray-200 p-3">
                    <p className="truncate text-sm font-semibold text-gray-950">{item.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.activeTickets} active tickets · {item.activeDispatches} field jobs</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tickets by Status</h2>
          {total > 0 ? (
            <div className="space-y-3">
              {summary?.byStatus?.map((s) => {
                const pct = Math.round((s._count / total) * 100);
                return (
                  <Link key={s.status} href={`/tickets?status=${s.status}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${statusColors[s.status] || 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-600">{s.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${statusColors[s.status] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{s._count}</span>
                      <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={TicketPlus} title="No tickets yet" description="Create the first ticket to start tracking assignments, priorities, SLAs, and activity." actionHref="/tickets/new" actionLabel="Create ticket" />
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tickets by Priority</h2>
          {total > 0 ? (
            <div className="space-y-3">
              {summary?.byPriority?.map((p) => {
                const pct = Math.round((p._count / total) * 100);
                return (
                  <Link key={p.priority} href={`/tickets?priority=${p.priority}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${priorityColors[p.priority] || 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-600">{p.priority}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${priorityColors[p.priority] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{p._count}</span>
                      <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={TicketPlus} title="No priority data yet" description="Ticket priority reporting appears after the first service request is created." actionHref="/tickets/new" actionLabel="Create ticket" />
          )}
        </div>

        {total > 0 && (
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Status Distribution</h2>
            <div className="flex h-8 rounded-lg overflow-hidden">
              {summary?.byStatus?.map((s) => {
                const pct = Math.round((s._count / total) * 100);
                if (pct === 0) return null;
                return (
                  <div key={s.status}
                    className={`${statusColors[s.status] || 'bg-gray-400'} flex items-center justify-center text-white text-xs font-medium transition-all hover:opacity-90`}
                    style={{ width: `${pct}%` }}
                    title={`${s.status}: ${s._count} (${pct}%)`}>
                    {pct > 8 ? `${s.status.replace(/_/g, ' ')} ${pct}%` : ''}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {summary?.byStatus?.map((s) => (
                <div key={s.status} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusColors[s.status] || 'bg-gray-400'}`} />
                  <span>{s.status.replace(/_/g, ' ')}: {s._count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {activity.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {activity.map((entry: any) => (
              <Link key={entry.id} href={`/tickets/${entry.ticketId}`}
                className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${feedDotColor(entry.action)}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{entry.actor?.firstName} {entry.actor?.lastName}</span>{' '}
                    {entry.action === 'STATUS_CHANGED' ? `changed status of ${entry.ticket?.ticketNumber}`
                      : entry.action === 'CREATED' ? `created ${entry.ticket?.ticketNumber}`
                      : entry.action === 'ASSIGNED' ? `was assigned to ${entry.ticket?.ticketNumber}`
                      : entry.action === 'RESOLVED' ? `resolved ${entry.ticket?.ticketNumber}`
                      : entry.action === 'HOLD' ? `put ${entry.ticket?.ticketNumber} on hold`
                      : entry.action === 'COMMENT' ? `commented on ${entry.ticket?.ticketNumber}`
                      : entry.action === 'ATTACHMENT' ? `added file to ${entry.ticket?.ticketNumber}`
                      : `updated ${entry.ticket?.ticketNumber}`}
                  </p>
                  {entry.comment && <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.comment}</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(entry.createdAt)}</p>
                </div>
                {entry.ticket && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                    entry.ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-700'
                    : entry.ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700'
                    : entry.ticket.status === 'CLOSED' ? 'bg-gray-100 text-gray-600'
                    : 'bg-gray-100 text-gray-600'
                  }`}>{entry.ticket.status}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
