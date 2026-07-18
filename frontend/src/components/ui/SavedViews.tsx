'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookmarkPlus, Trash2 } from 'lucide-react';
import { api, getListData } from '../../lib/api';

type SavedView = { id: string; name: string; filters: Record<string, unknown>; isDefault?: boolean };

export function SavedViews({ resource, filters, onApply }: {
  resource: 'tickets' | 'assets' | 'network' | 'users' | 'dispatch';
  filters: Record<string, unknown>;
  onApply: (filters: Record<string, any>) => void;
}) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/operations/saved-views/${resource}`)
      .then((data) => setViews(getListData<SavedView>(data)))
      .catch(() => setViews([]));
  }, [resource]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const name = window.prompt('Name this view');
    if (!name?.trim()) return;
    setBusy(true);
    try {
      await api.post(`/operations/saved-views/${resource}`, { name: name.trim(), filters });
      load();
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    await api.delete(`/operations/saved-views/${resource}/${id}`);
    load();
  };

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Saved views">
      <button type="button" disabled={busy} onClick={save} className="inline-flex h-9 items-center gap-2 rounded border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
        <BookmarkPlus className="h-4 w-4" aria-hidden="true" /> Save view
      </button>
      {views.map((view) => (
        <span key={view.id} className="inline-flex h-9 items-center overflow-hidden rounded border border-blue-200 bg-blue-50 text-sm text-blue-800">
          <button type="button" onClick={() => onApply(view.filters)} className="h-full px-3 font-medium hover:bg-blue-100">{view.name}</button>
          <button type="button" onClick={() => remove(view.id)} className="h-full border-l border-blue-200 px-2 hover:bg-red-50 hover:text-red-700" aria-label={`Delete saved view ${view.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
        </span>
      ))}
    </div>
  );
}
