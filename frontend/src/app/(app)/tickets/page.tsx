'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Download, LayoutDashboard, Plus, Search, Ticket as TicketIcon, X } from 'lucide-react';
import { api, getListData, getResponseMeta } from '../../../lib/api';
import { formatDate, getStatusColor } from '../../../lib/utils';
import { useAuthStore } from '../../../stores/authStore';
import { ResponsiveTable } from '../../../components/ui/ResponsiveTable';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Pagination } from '../../../components/ui/Pagination';
import { connectSocket, disconnectSocket, onSocketEvent } from '../../../lib/socket';
import { useToast } from '../../../components/ui/Toast';
import { RequireCompanyContext } from '../../../components/layout/RequireCompanyContext';
import { SavedViews } from '../../../components/ui/SavedViews';

const statusFilters = ['', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const bulkStatuses = ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'];

function formatLabel(value: string) {
  return value ? value.replace(/_/g, ' ') : 'All';
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({ page: 1, totalPages: 1 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<any[]>([]);
  const [bulkUserId, setBulkUserId] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [error, setError] = useState('');
  const { user, activeCompanyContext, authChecked } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const status = searchParams.get('status') || '';
    setFilter(status);
  }, [searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [search]);

  const fetchTickets = useCallback(() => {
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    if (debouncedSearch) params.set('search', debouncedSearch);
    params.set('page', String(page));
    params.set('limit', '25');
    setError('');
    const endpoint = user?.role === 'SUPER_ADMIN' && !activeCompanyContext ? '/admin/tickets' : '/tickets';
    api.get(`${endpoint}?${params}`)
      .then((data) => { setTickets(getListData(data)); setMeta(getResponseMeta(data)); })
      .catch((err: any) => { setError(err.message || 'Failed to load tickets'); setTickets([]); })
      .finally(() => setLoading(false));
  }, [activeCompanyContext, filter, debouncedSearch, page, user?.role]);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) { router.push('/login'); return; }
    if (user && user.userType !== 'BUSINESS') { router.push('/my-tickets'); return; }
    fetchTickets();
    if ((user?.role === 'SUPER_ADMIN' && !activeCompanyContext) || user?.role === 'GLOBAL_TECH') {
      setUsers([]);
    } else {
      api.get('/users/options?roles=TECHNICIAN,TENANT_ADMIN').then((d) => setUsers(getListData(d))).catch(() => {});
    }
  }, [activeCompanyContext, authChecked, user, fetchTickets, router]);

  useEffect(() => {
    if (!user?.companyId) return;
    connectSocket(user.companyId);
    const unsub1 = onSocketEvent('ticket:created', fetchTickets);
    const unsub2 = onSocketEvent('ticket:updated', fetchTickets);
    const unsub3 = onSocketEvent('ticket:deleted', fetchTickets);
    return () => { unsub1(); unsub2(); unsub3(); disconnectSocket(); };
  }, [user?.companyId, fetchTickets]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === tickets.length) setSelected(new Set());
    else setSelected(new Set(tickets.map((t) => t.id)));
  };

  const doBulk = async (action: string, body: any) => {
    try {
      await api.post(`/tickets/bulk/${action}`, { ids: Array.from(selected), ...body });
      toast('success', `Bulk ${action} completed`);
      setSelected(new Set());
      fetchTickets();
    } catch (err: any) { toast('error', err.message); }
  };

  const exportCsv = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/v1/tickets/export/csv?status=${filter}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'tickets.csv'; a.click();
      URL.revokeObjectURL(url);
      toast('success', 'CSV exported');
    } catch (err: any) { toast('error', err.message); }
  };

  if (loading) return <div className="p-6 lg:p-8"><TableSkeleton rows={8} cols={8} /></div>;

  const techUsers = users.filter((u: any) => u.role === 'TECHNICIAN' || u.role === 'TENANT_ADMIN' || u.role === 'GLOBAL_TECH');

  return (
    <RequireCompanyContext area="Tickets" allowGlobal>
    <div className="space-y-6 p-6 lg:p-8">
      <SavedViews resource="tickets" filters={{ status: filter, search }} onApply={(view) => { setFilter(view.status || ''); setSearch(view.search || ''); setPage(1); }} />
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <TicketIcon size={20} />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-gray-950">Tickets</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Track, assign, export, and triage service requests.
                </p>
              </div>
            </div>
            {user?.role === 'SUPER_ADMIN' && !activeCompanyContext && (
              <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">Global view: showing tickets across all businesses and public/free users.</p>
            )}
            {user?.role === 'GLOBAL_TECH' && (
              <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">Global tech view: showing tickets from free and starter individual users.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user?.role !== 'GLOBAL_TECH' && (
              <Link href="/tickets/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                <Plus size={16} />
                Create
              </Link>
            )}
            <Link href="/tickets/board" className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <LayoutDashboard size={16} />
              Board
            </Link>
            {user?.role !== 'GLOBAL_TECH' && (
              <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Download size={16} />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((s) => (
              <button key={s || 'ALL'} onClick={() => { setFilter(s); setPage(1); setSelected(new Set()); }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {formatLabel(s)}
              </button>
            ))}
          </div>

          <div className="relative w-full xl:w-96">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search ticket number or title"
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-9 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      {selected.size > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm lg:flex-row lg:items-center lg:justify-between">
          <span className="font-semibold text-blue-800">{selected.size} selected</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
            <option value="">Change status...</option>
            {bulkStatuses.map((s) => (
              <option key={s} value={s}>{formatLabel(s)}</option>
            ))}
          </select>
          <button onClick={() => bulkStatus && doBulk('status', { status: bulkStatus })}
            disabled={!bulkStatus} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Apply</button>
          <select value={bulkUserId} onChange={(e) => setBulkUserId(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
            <option value="">Assign to...</option>
            {techUsers.map((u: any) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
          <button onClick={() => bulkUserId && doBulk('assign', { userId: bulkUserId })}
            disabled={!bulkUserId} className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">Assign</button>
          <button onClick={() => { if (confirm('Delete selected tickets?')) doBulk('delete', {}); }}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
          <button onClick={() => setSelected(new Set())} className="rounded-md px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">Clear</button>
          </div>
        </div>
      )}

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <ResponsiveTable>
        <table className="w-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-4 py-3">
                <input type="checkbox" checked={selected.size === tickets.length && tickets.length > 0}
                  onChange={toggleAll} className="rounded border-gray-300" />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Ticket</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Title</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Contact</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Category</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Priority</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Assigned</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <input type="checkbox" checked={selected.has(ticket.id)} onChange={() => toggleSelect(ticket.id)}
                    onClick={(e) => e.stopPropagation()} className="rounded border-gray-300" />
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-primary cursor-pointer" onClick={() => router.push(`/tickets/${ticket.id}`)}>
                  {ticket.ticketNumber}
                </td>
                <td className="max-w-xs px-5 py-4 text-sm text-gray-700 cursor-pointer" onClick={() => router.push(`/tickets/${ticket.id}`)}>
                  <div className="truncate font-medium text-gray-900">{ticket.title}</div>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">{ticket.contactName || '-'}</td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">{ticket.category || '-'}</td>
                <td className="whitespace-nowrap px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                    {formatLabel(ticket.status)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">{formatLabel(ticket.priority)}</td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                  {ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : '-'}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">{error ? 'Tickets could not be loaded.' : 'No tickets found.'}</td></tr>
            )}
          </tbody>
        </table>
      </ResponsiveTable>
      <Pagination page={meta.page} totalPages={meta.totalPages} onPage={setPage} />
    </div>
    </RequireCompanyContext>
  );
}
