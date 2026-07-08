'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, FileText, FolderKanban, HardDrive, Search, ShoppingCart, Ticket, UserRound } from 'lucide-react';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { TableSkeleton } from '../../../components/ui/Skeleton';

type GenericResult = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  href?: string;
  meta?: string | null;
  createdAt?: string | null;
};

type SearchResponse = Record<string, GenericResult[]>;

const groups = [
  { key: 'pages', label: 'Pages', icon: FileText },
  { key: 'tickets', label: 'Tickets', icon: Ticket },
  { key: 'assets', label: 'Assets', icon: HardDrive },
  { key: 'users', label: 'Users', icon: UserRound },
  { key: 'articles', label: 'Knowledge Base', icon: FileText },
  { key: 'catalogItems', label: 'Catalog Items', icon: ShoppingCart },
  { key: 'catalogRequests', label: 'Catalog Requests', icon: FolderKanban },
  { key: 'companies', label: 'Companies', icon: Building2 },
] as const;

function ticketResult(item: any): GenericResult {
  return {
    id: item.id,
    title: `${item.ticketNumber}: ${item.title}`,
    subtitle: item.category || item.priority,
    description: item.status,
    href: `/tickets/${item.id}`,
    meta: item.priority,
    createdAt: item.createdAt,
  };
}

function assetResult(item: any): GenericResult {
  return {
    id: item.id,
    title: item.name,
    subtitle: [item.assetType, item.serialNumber].filter(Boolean).join(' | '),
    description: [item.status, item.location, item.ipAddress].filter(Boolean).join(' | '),
    href: `/assets?id=${encodeURIComponent(item.id)}`,
  };
}

function normalizeResults(data: SearchResponse): SearchResponse {
  return {
    ...data,
    tickets: (data.tickets || []).map(ticketResult),
    assets: (data.assets || []).map(assetResult),
  };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResponse>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setResults({});
      return;
    }
    setLoading(true);
    setError('');
    api.get<SearchResponse>(`/search?q=${encodeURIComponent(q.trim())}`)
      .then((data) => setResults(normalizeResults(data || {})))
      .catch((err) => {
        setError(err.message || 'Search failed');
        setResults({});
      })
      .finally(() => setLoading(false));
  }, [q]);

  const total = useMemo(() => groups.reduce((sum, group) => sum + (results[group.key]?.length || 0), 0), [results]);

  return (
    <div className="p-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase text-primary">Universal search</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-950">Search Results</h1>
        {q && <p className="mt-1 text-sm text-gray-500">Showing results for &ldquo;{q}&rdquo;</p>}
      </header>

      {!q || q.trim().length < 2 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <Search className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-3 text-sm font-medium text-gray-700">Enter at least 2 characters to search pages, tickets, assets, users, and records.</p>
        </div>
      ) : loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : total === 0 ? (
        <p className="rounded-lg bg-white p-6 text-sm text-gray-500">No results found for &ldquo;{q}&rdquo;.</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const items = results[group.key] || [];
            if (!items.length) return null;
            const Icon = group.icon;
            return (
              <section key={group.key} className="rounded-lg bg-white shadow">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                    <Icon size={16} className="text-primary" />
                    {group.label}
                  </h2>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{items.length}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <Link key={`${group.key}-${item.id}`} href={item.href || '#'} className="block px-4 py-3 hover:bg-gray-50">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-950">{item.title}</p>
                          {(item.subtitle || item.description) && (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                              {[item.subtitle, item.description].filter(Boolean).join(' | ')}
                            </p>
                          )}
                        </div>
                        {(item.meta || item.createdAt) && (
                          <p className="shrink-0 text-xs text-gray-500">
                            {[item.meta, item.createdAt ? formatDate(item.createdAt) : null].filter(Boolean).join(' | ')}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} cols={4} />}>
      <SearchContent />
    </Suspense>
  );
}
