'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { formatDate, getStatusColor } from '../../../lib/utils';
import { useAuthStore } from '../../../stores/authStore';
import { ResponsiveTable } from '../../../components/ui/ResponsiveTable';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Pagination } from '../../../components/ui/Pagination';
import { connectSocket, disconnectSocket, onSocketEvent } from '../../../lib/socket';
import { useToast } from '../../../components/ui/Toast';
import { RequireCompanyContext } from '../../../components/layout/RequireCompanyContext';

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
  const { user, activeCompanyContext } = useAuthStore();
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
    api.get(`/tickets?${params}`)
      .then((data) => { setTickets(data.data || []); setMeta(data.meta); })
      .catch((err: any) => { setError(err.message || 'Failed to load tickets'); setTickets([]); })
      .finally(() => setLoading(false));
  }, [filter, debouncedSearch, page]);

  useEffect(() => {
    if (user && user.userType !== 'BUSINESS') { router.push('/my-tickets'); return; }
    fetchTickets();
    if (user?.role === 'SUPER_ADMIN' && !activeCompanyContext) {
      setUsers([]);
    } else {
      api.get('/users?limit=200').then((d) => setUsers(d.data || [])).catch(() => {});
    }
  }, [activeCompanyContext, user, fetchTickets, router]);

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

  if (loading) return <div className="p-8"><TableSkeleton rows={8} cols={8} /></div>;

  const techUsers = users.filter((u: any) => u.role === 'TECHNICIAN' || u.role === 'TENANT_ADMIN');

  return (
    <RequireCompanyContext area="Tickets" allowGlobal>
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tickets</h1>
          {user?.role === 'SUPER_ADMIN' && !activeCompanyContext && (
            <p className="mt-1 text-sm text-gray-500">Global view: showing tickets across all businesses and public/free users.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tickets/new" className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90">+ Create</Link>
          <Link href="/tickets/board" className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200">Board</Link>
          <button onClick={exportCsv} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200">Export CSV</button>
          <div className="flex gap-2 flex-wrap">
            {['', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
              <button key={s} onClick={() => { setFilter(s); setPage(1); setSelected(new Set()); }}
                className={`px-3 py-1 text-xs rounded-full ${filter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg text-sm">
          <span className="font-medium text-blue-700">{selected.size} selected</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs">
            <option value="">Change status...</option>
            {['ASSIGNED','IN_PROGRESS','ON_HOLD','RESOLVED','CLOSED'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>
          <button onClick={() => bulkStatus && doBulk('status', { status: bulkStatus })}
            disabled={!bulkStatus} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50">Apply</button>
          <select value={bulkUserId} onChange={(e) => setBulkUserId(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs">
            <option value="">Assign to...</option>
            {techUsers.map((u: any) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
          <button onClick={() => bulkUserId && doBulk('assign', { userId: bulkUserId })}
            disabled={!bulkUserId} className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50">Assign</button>
          <button onClick={() => { if (confirm('Delete selected tickets?')) doBulk('delete', {}); }}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700">Delete</button>
          <button onClick={() => setSelected(new Set())} className="px-3 py-1 text-gray-500 text-xs hover:text-gray-700">Clear</button>
        </div>
      )}

      <div className="mb-4">
        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search ticket number or title"
          className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <ResponsiveTable>
        <table className="w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-10 px-2 py-3">
                <input type="checkbox" checked={selected.size === tickets.length && tickets.length > 0}
                  onChange={toggleAll} className="rounded border-gray-300" />
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ticket</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Assigned</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-2 py-4">
                  <input type="checkbox" checked={selected.has(ticket.id)} onChange={() => toggleSelect(ticket.id)}
                    onClick={(e) => e.stopPropagation()} className="rounded border-gray-300" />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-primary cursor-pointer" onClick={() => router.push(`/tickets/${ticket.id}`)}>
                  {ticket.ticketNumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate cursor-pointer" onClick={() => router.push(`/tickets/${ticket.id}`)}>
                  {ticket.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{ticket.contactName || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{ticket.category || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{ticket.priority}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-500">{error ? 'Tickets could not be loaded.' : 'No tickets found.'}</td></tr>
            )}
          </tbody>
        </table>
      </ResponsiveTable>
      <Pagination page={meta.page} totalPages={meta.totalPages} onPage={setPage} />
    </div>
    </RequireCompanyContext>
  );
}
