'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';

interface GlobalStats {
  totalUsers: number;
  totalCompanies: number;
  totalTickets: number;
  totalAssets: number;
  usersByType: { userType: string; _count: number }[];
  ticketsByStatus: { status: string; _count: number }[];
}

const adminActions = [
  { title: 'Users', href: '/admin/users', body: 'Create, deactivate, move, and assign platform roles.' },
  { title: 'Businesses', href: '/admin/companies', body: 'Create companies, manage domains, status, and invites.' },
  { title: 'Roles', href: '/admin/roles', body: 'CRUD roles and assign permission bundles.' },
  { title: 'System Controls', href: '/admin/system', body: 'Manage plans, feature flags, usage limits, and restrictions.' },
  { title: 'Permissions', href: '/admin/permissions', body: 'Audit the permission catalog used by roles.' },
  { title: 'Audit Logs', href: '/admin/audit-logs', body: 'Review cross-tenant administrative events.' },
];

export default function AdminPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
    api.get('/admin/stats').then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, [user, router]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!stats) return null;

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
    </div>
  );
}
