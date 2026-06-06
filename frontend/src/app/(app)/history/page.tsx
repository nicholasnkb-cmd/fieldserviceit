'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Clock, History } from 'lucide-react';
import { readRecentPages, type RecentPage } from '../../../lib/navigation';
import { useAuthStore } from '../../../stores/authStore';

export default function HistoryPage() {
  const { user } = useAuthStore();
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);

  useEffect(() => {
    if (user?.id) setRecentPages(readRecentPages(user.id));
  }, [user?.id]);

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <History className="text-primary" size={24} />
        <div>
          <h1 className="text-2xl font-bold">Recent Pages</h1>
          <p className="text-sm text-gray-500">Pages you recently opened in FieldserviceIT.</p>
        </div>
      </div>

      {recentPages.length === 0 ? (
        <p className="text-gray-500">Your recently visited pages will appear here.</p>
      ) : (
        <div className="divide-y divide-gray-200 border-y border-gray-200 bg-white">
          {recentPages.map((page) => (
            <Link
              key={page.path}
              href={page.path}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">{page.label}</div>
                <div className="truncate text-xs text-gray-500">{page.path}</div>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                <Clock size={14} />
                {new Date(page.visitedAt).toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
