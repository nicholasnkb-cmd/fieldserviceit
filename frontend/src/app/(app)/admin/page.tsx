'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getListData } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';
import { formatDate, getStatusColor } from '../../../lib/utils';

interface GlobalStats {
  totalUsers: number;
  totalCompanies: number;
  totalTickets: number;
  totalAssets: number;
  usersByType: { userType: string; _count: number }[];
  ticketsByStatus: { status: string; _count: number }[];
}

interface AdminUserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userType: string;
  isActive: boolean;
  company?: { id: string; name: string } | null;
  createdAt: string;
}

interface TicketRow {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  contactName?: string;
  contactEmail?: string;
  createdAt: string;
}

const adminActions = [
  { title: 'Users', href: '/admin/users', body: 'Create, deactivate, move, and assign platform roles.' },
  { title: 'Businesses', href: '/admin/companies', body: 'Create companies, manage domains, status, and invites.' },
  { title: 'Roles', href: '/admin/roles', body: 'CRUD roles and assign permission bundles.' },
  { title: 'System Controls', href: '/admin/system', body: 'Manage plans, feature flags, usage limits, and restrictions.' },
  { title: 'Permissions', href: '/admin/permissions', body: 'Assign capabilities across system and custom roles.' },
  { title: 'Audit Logs', href: '/admin/audit-logs', body: 'Review cross-tenant administrative events.' },
];

export default function AdminPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUserRow[]>([]);
  const [recentTickets, setRecentTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
    setLoading(true);
    Promise.allSettled([
      api.get('/admin/stats'),
      api.get('/admin/users?limit=8'),
      api.get('/admin/tickets?limit=8'),
    ])
      .then(([statsResult, usersResult, ticketsResult]) => {
        if (statsResult.status === 'fulfilled') setStats(statsResult.value);
        if (usersResult.status === 'fulfilled') setRecentUsers(getListData<AdminUserRow>(usersResult.value));
        if (ticketsResult.status === 'fulfilled') setRecentTickets(getListData<TicketRow>(ticketsResult.value));

        const errors = [statsResult, usersResult, ticketsResult]
          .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
          .map((result) => result.reason?.message || 'Request failed');
        setMessage(errors.join(' ') || '');
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!stats) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Platform Control Portal</h1>
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {message || 'Unable to load super admin data.'}
        </div>
      </div>
    );
  }

  const statCards = [
    ['Users', stats.totalUsers, '/admin/users'],
    ['Businesses', stats.totalCompanies, '/admin/companies'],
    ['Tickets', stats.totalTickets, '/tickets'],
    ['Devices', stats.totalAssets, '/assets'],
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Super Admin</p>
        <h1 className="mt-2 text-2xl font-bold">Platform Control Portal</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage tenants, users, roles, permissions, plans, feature access, and global restrictions.
        </p>
      </div>

      {message && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {statCards.map(([label, value, href]) => (
          <Link key={label} href={String(href)} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-950">{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminActions.map((action) => (
          <Link key={action.href} href={action.href} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-primary/40 hover:shadow">
            <h2 className="text-base font-semibold text-gray-950">{action.title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{action.body}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Users by Type</h2>
          {stats.usersByType.map((t) => (
            <Link key={t.userType} href={`/admin/users?userType=${encodeURIComponent(t.userType)}`} className="flex items-center justify-between border-t border-gray-100 py-3 first:border-t-0 hover:bg-gray-50">
              <span className="text-sm text-gray-600">{t.userType}</span>
              <span className="text-sm font-medium">{t._count}</span>
            </Link>
          ))}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Tickets by Status</h2>
          {stats.ticketsByStatus.map((s) => (
            <Link key={s.status} href={`/tickets?status=${encodeURIComponent(s.status)}`} className="flex items-center justify-between border-t border-gray-100 py-3 first:border-t-0 hover:bg-gray-50">
              <span className="text-sm text-gray-600">{s.status}</span>
              <span className="text-sm font-medium">{s._count}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Recent Users</h2>
            <Link href="/admin/users" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">User</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Role</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Company</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentUsers.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <Link href={`/admin/users?search=${encodeURIComponent(item.email)}`} className="text-sm font-medium text-primary hover:underline">
                        {item.firstName} {item.lastName}
                      </Link>
                      <div className="text-xs text-gray-500">{item.email}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{item.userType}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{item.role}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{item.company?.name || '-'}</td>
                  </tr>
                ))}
                {recentUsers.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">No users returned.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Recent Tickets</h2>
            <Link href="/tickets" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Ticket</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Priority</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <Link href={`/tickets/${ticket.id}`} className="text-sm font-medium text-primary hover:underline">{ticket.ticketNumber}</Link>
                      <div className="max-w-xs truncate text-xs text-gray-500">{ticket.title}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{ticket.priority}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{formatDate(ticket.createdAt)}</td>
                  </tr>
                ))}
                {recentTickets.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">No tickets returned.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
