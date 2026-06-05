'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BadgeCheck,
  ClipboardList,
  Download,
  KeyRound,
  Monitor,
  Network,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  UserPlus,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { api, getListData, getResponseMeta } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { useAuthStore } from '../../../stores/authStore';
import { ResponsiveTable } from '../../../components/ui/ResponsiveTable';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Pagination } from '../../../components/ui/Pagination';
import { useToast } from '../../../components/ui/Toast';

type CatalogItem = {
  id: string;
  requestType: string;
  name: string;
  shortDescription?: string;
  description?: string;
  category: string;
  icon?: string;
  defaultPriority: string;
  estimatedFulfillment?: string;
  requiresApproval: boolean;
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  FULFILLED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const typeMeta: Record<string, { label: string; description: string; icon: LucideIcon; color: string }> = {
  ALL: { label: 'All', description: 'Everything users can request', icon: ShoppingCart, color: 'bg-gray-900 text-white' },
  SERVICE: { label: 'Services', description: 'Support, onboarding, changes, and help', icon: Wrench, color: 'bg-blue-600 text-white' },
  SOFTWARE: { label: 'Software', description: 'Licenses, SaaS seats, and installs', icon: Download, color: 'bg-teal-600 text-white' },
  HARDWARE: { label: 'Hardware', description: 'Devices, accessories, and replacements', icon: Monitor, color: 'bg-orange-500 text-white' },
  ACCESS: { label: 'Access', description: 'VPN, apps, groups, MFA, and accounts', icon: KeyRound, color: 'bg-violet-600 text-white' },
  OTHER: { label: 'Other', description: 'General requests and special cases', icon: ClipboardList, color: 'bg-slate-600 text-white' },
};

const iconMap: Record<string, LucideIcon> = {
  'badge-check': BadgeCheck,
  'clipboard-list': ClipboardList,
  download: Download,
  'key-round': KeyRound,
  monitor: Monitor,
  network: Network,
  package: Package,
  'shield-check': ShieldCheck,
  'user-plus': UserPlus,
  wrench: Wrench,
};

export default function CatalogRequestsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({ page: 1, totalPages: 1 });

  const fetchItems = useCallback(() => {
    setItemsLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== 'ALL') params.set('requestType', typeFilter);
    if (search.trim()) params.set('search', search.trim());
    api.get(`/catalog-requests/items?${params}`)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => toast('error', 'Failed to load service catalog'))
      .finally(() => setItemsLoading(false));
  }, [typeFilter, search, toast]);

  const fetchRequests = useCallback(() => {
    setRequestsLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(page));
    params.set('limit', '25');
    api.get(`/catalog-requests?${params}`)
      .then((data) => { setRequests(getListData(data)); setMeta(getResponseMeta(data)); })
      .catch(() => toast('error', 'Failed to load request history'))
      .finally(() => setRequestsLoading(false));
  }, [statusFilter, page, toast]);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchItems();
  }, [user, router, fetchItems]);

  useEffect(() => {
    if (!user) return;
    fetchRequests();
  }, [user, fetchRequests]);

  const categoryCounts = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      acc[item.requestType] = (acc[item.requestType] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  if (!user) return null;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Service Catalog</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Request services, software, hardware, and access</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Choose from approved catalog items, submit the business reason, and track approval or fulfillment from the same workspace.
            </p>
          </div>
          <Link href="/catalog-requests/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
            <ShoppingCart size={17} />
            Custom Request
          </Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Object.entries(typeMeta).map(([type, metaItem]) => {
          const Icon = metaItem.icon;
          const active = typeFilter === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`rounded-lg border p-4 text-left transition ${active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${metaItem.color}`}>
                <Icon size={18} />
              </span>
              <span className="mt-3 block text-sm font-bold text-gray-950">{metaItem.label}</span>
              <span className="mt-1 block text-xs text-gray-500">{type === 'ALL' ? `${items.length} available items` : `${categoryCounts[type] || 0} available items`}</span>
            </button>
          );
        })}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-gray-950">Catalog</h2>
          <div className="relative sm:w-80">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm"
              placeholder="Search catalog..."
            />
          </div>
        </div>

        {itemsLoading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const Icon = iconMap[item.icon || ''] || typeMeta[item.requestType]?.icon || ClipboardList;
              return (
                <article key={item.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${typeMeta[item.requestType]?.color || typeMeta.OTHER.color}`}>
                      <Icon size={19} />
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{item.requestType}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-950">{item.name}</h3>
                  <p className="mt-2 min-h-12 text-sm text-gray-600">{item.shortDescription || item.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-600">{item.category}</span>
                    {item.estimatedFulfillment && <span className="rounded-md bg-blue-50 px-2 py-1 font-medium text-blue-700">{item.estimatedFulfillment}</span>}
                    <span className={`rounded-md px-2 py-1 font-medium ${item.requiresApproval ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                      {item.requiresApproval ? 'Approval required' : 'Fast-track'}
                    </span>
                  </div>
                  <Link
                    href={`/catalog-requests/new?catalogItemId=${item.id}`}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                  >
                    Request this
                  </Link>
                </article>
              );
            })}
            {items.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
                No catalog items match your filters.
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-gray-950">Request History</h2>
          <div className="flex flex-wrap gap-2">
            {['', 'PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED'].map((status) => (
              <button
                key={status || 'ALL'}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusFilter === status ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {status || 'All'}
              </button>
            ))}
          </div>
        </div>

        {requestsLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : (
          <>
            <ResponsiveTable>
              <table className="w-full overflow-hidden rounded-lg bg-white shadow">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/catalog-requests/${request.id}`)}>
                      <td className="px-6 py-4 text-sm text-gray-700">{typeMeta[request.requestType]?.label || request.requestType}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{request.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{request.itemName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{request.quantity || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{request.priority}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[request.status] || ''}`}>{request.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(request.createdAt)}</td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">No catalog requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </ResponsiveTable>
            <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} onPage={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
