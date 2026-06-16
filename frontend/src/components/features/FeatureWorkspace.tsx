'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  Layers3,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { api, getListData } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

type Metric = {
  label: string;
  value: string;
  tone?: 'green' | 'amber' | 'red' | 'blue';
};

type Workflow = {
  title: string;
  detail: string;
  action: string;
  href?: string;
};

type FeatureWorkspaceProps = {
  moduleKey: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  secondaryAction?: string;
  secondaryActionHref?: string;
  metrics: Metric[];
  workflows: Workflow[];
  recordsTitle: string;
  recordsHint: string;
  apiSources?: Array<'tickets' | 'assets' | 'users'>;
  automationItems: string[];
};

const toneClasses: Record<NonNullable<Metric['tone']>, string> = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  red: 'border-rose-200 bg-rose-50 text-rose-800',
  blue: 'border-sky-200 bg-sky-50 text-sky-800',
};

function recordLabel(record: any) {
  return record?.ticketNumber || record?.name || record?.email || record?.title || record?.id || 'Record';
}

function recordSubtext(record: any) {
  const parts = [
    record?.status,
    record?.priority,
    record?.assetType,
    record?.role,
    record?.location,
  ].filter(Boolean);
  return parts.join(' · ') || 'Ready for workflow action';
}

function recordHref(record: any) {
  if (record?.ticketNumber && record?.id) return `/tickets/${record.id}`;
  if (record?.assetType && record?.id) return '/assets';
  if (record?.email && record?.id) return '/admin/users';
  return '';
}

export function FeatureWorkspace({
  moduleKey,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction = 'Review queue',
  secondaryActionHref,
  metrics,
  workflows,
  recordsTitle,
  recordsHint,
  apiSources = ['tickets'],
  automationItems,
}: FeatureWorkspaceProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('Active');
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM' });
  const { user, activeCompanyContext } = useAuthStore();

  const loadData = useCallback(() => {
    setLoading(true);
    const status = mode.toUpperCase();

    return Promise.all([
      api.get(`/operations/${moduleKey}/items?status=${encodeURIComponent(status)}&limit=25`).catch(() => []),
      ...apiSources.map((source) => {
        if (source === 'assets') return api.get('/assets?limit=6').catch(() => []);
        if (source === 'users') return api.get('/users/options').catch(() => []);
        const endpoint = user?.role === 'SUPER_ADMIN' && !activeCompanyContext ? '/admin/tickets?limit=6' : '/tickets?limit=6';
        return api.get(endpoint).catch(() => []);
      }),
    ])
      .then((responses) => {
        setItems(getListData(responses[0]));
        setRecords(responses.slice(1).flatMap((response) => getListData(response)).slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, [activeCompanyContext, apiSources, mode, moduleKey, user?.role]);

  useEffect(() => {
    let mounted = true;
    loadData().finally(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, [loadData]);

  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(needle));
  }, [query, records]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(needle));
  }, [items, query]);

  const createItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.post('/operations/items', {
        moduleKey,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        status: mode.toUpperCase(),
      });
      setForm({ title: '', description: '', priority: 'MEDIUM' });
      setShowCreate(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    try {
      await api.patch(`/operations/items/${id}`, { status });
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <section className="border-b border-gray-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              <Plus size={16} />
              {primaryAction}
            </button>
            {secondaryActionHref ? (
              <Link href={secondaryActionHref} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <SlidersHorizontal size={16} />
                {secondaryAction}
              </Link>
            ) : (
              <button type="button" onClick={() => setMode('Review')} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <SlidersHorizontal size={16} />
                {secondaryAction}
              </button>
            )}
          </div>
        </div>
      </section>

      {showCreate && (
        <form onSubmit={createItem} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 lg:grid-cols-[1fr_1fr_160px_auto]">
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Work item title"
          />
          <input
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Notes or next step"
          />
          <select
            value={form.priority}
            onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <button disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Save
          </button>
        </form>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`rounded-lg border p-4 ${toneClasses[metric.tone || 'blue']}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{metric.label}</p>
              <Gauge size={18} />
            </div>
            <p className="mt-3 text-2xl font-bold">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">{recordsTitle}</h2>
              <p className="text-sm text-gray-500">{recordsHint}</p>
            </div>
            <div className="flex gap-2">
              {['Active', 'Planned', 'Review'].map((item) => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    mode === item ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="border-b border-gray-200 p-4">
            <label className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full border-0 text-sm outline-none"
                placeholder="Search work items and linked records"
              />
            </label>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading workspace records...</div>
            ) : filteredItems.length === 0 && filteredRecords.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No workspace records found yet.</div>
            ) : (
              <>
                {filteredItems.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Workspace</span>
                        <p className="truncate text-sm font-semibold text-gray-950">{item.title}</p>
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500">{[item.status, item.priority, item.description].filter(Boolean).join(' · ')}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {['ACTIVE', 'PLANNED', 'REVIEW', 'DONE'].map((status) => (
                        <button
                          key={status}
                          disabled={saving || item.status === status}
                          onClick={() => updateStatus(item.id, status)}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredRecords.map((record) => {
                  const href = recordHref(record);
                  const content = (
                    <>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">Linked</span>
                          <p className="truncate text-sm font-semibold text-gray-950">{recordLabel(record)}</p>
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-500">{recordSubtext(record)}</p>
                      </div>
                      <div className="hidden text-xs text-gray-500 sm:block">
                        {record?.updatedAt || record?.createdAt ? formatDate(record.updatedAt || record.createdAt) : 'No date'}
                      </div>
                    </>
                  );
                  return href ? (
                    <Link key={`${record.id}-${recordLabel(record)}`} href={href} className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50">
                      {content}
                    </Link>
                  ) : (
                    <div key={`${record.id}-${recordLabel(record)}`} className="flex items-center justify-between gap-4 p-4">
                      {content}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-950">Workflow Controls</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {workflows.map((workflow) => (
                <div key={workflow.title} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-950">{workflow.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{workflow.detail}</p>
                    </div>
                    {workflow.href ? (
                      <Link href={workflow.href} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50" title={workflow.action}>
                        <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <button type="button" onClick={() => setShowCreate(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50" title={workflow.action}>
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-950">Automation Readiness</h2>
              <RefreshCw size={18} className="text-gray-400" />
            </div>
            <div className="mt-4 space-y-3">
              {automationItems.map((item, index) => {
                const Icon = index % 3 === 0 ? CheckCircle2 : index % 3 === 1 ? Clock3 : AlertTriangle;
                return (
                  <div key={item} className="flex items-start gap-3">
                    <Icon size={17} className={index % 3 === 2 ? 'mt-0.5 text-amber-500' : 'mt-0.5 text-emerald-600'} />
                    <p className="text-sm text-gray-600">{item}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Link href="/tickets" className="rounded-lg border border-gray-200 bg-white p-3 text-center text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <FileText className="mx-auto mb-2" size={18} />
              Tickets
            </Link>
            <Link href="/assets" className="rounded-lg border border-gray-200 bg-white p-3 text-center text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <Layers3 className="mx-auto mb-2" size={18} />
              Assets
            </Link>
            <Link href="/admin/audit-logs" className="rounded-lg border border-gray-200 bg-white p-3 text-center text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <ShieldCheck className="mx-auto mb-2" size={18} />
              Audit
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
