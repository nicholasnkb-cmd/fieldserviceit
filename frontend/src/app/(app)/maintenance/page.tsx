'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, ClipboardCheck, Loader2, Pause, Play, Plus, RefreshCw, Search, Ticket, Wrench } from 'lucide-react';
import { api, getListData } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

type MaintenancePlan = {
  id: string;
  name: string;
  description?: string;
  companyName?: string;
  assetId?: string;
  assetName?: string;
  assetType?: string;
  location?: string;
  frequency: string;
  intervalDays?: number;
  nextDueAt: string;
  lastCompletedAt?: string;
  checklist: string[];
  assignedFirstName?: string;
  assignedLastName?: string;
  assignedEmail?: string;
  latestTicketId?: string;
  latestTicketNumber?: string;
  latestTicketStatus?: string;
  status: string;
};

const frequencies = [
  ['WEEKLY', 'Weekly'],
  ['MONTHLY', 'Monthly'],
  ['QUARTERLY', 'Quarterly'],
  ['SEMI_ANNUAL', 'Semi-annual'],
  ['ANNUAL', 'Annual'],
  ['CUSTOM', 'Custom days'],
];

const blankForm = () => ({
  name: '',
  description: '',
  assetId: '',
  location: '',
  frequency: 'MONTHLY',
  intervalDays: 30,
  nextDueAt: dateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  checklist: 'Inspect device health\nReview firmware and backups\nDocument findings',
  ticketTemplateTitle: '',
  ticketTemplateDescription: '',
  assignedToId: '',
});

export default function MaintenancePage() {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [status, setStatus] = useState('ALL');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ status, limit: '100' });
      if (query.trim()) params.set('search', query.trim());
      const [summaryRes, planRes, assetRes, userRes] = await Promise.all([
        api.get('/maintenance/summary'),
        api.get(`/maintenance/plans?${params.toString()}`),
        api.get('/assets?limit=100').catch(() => []),
        api.get('/users/options').catch(() => []),
      ]);
      setSummary(summaryRes || {});
      setPlans(getListData<MaintenancePlan>(planRes));
      setAssets(getListData(assetRes));
      setUsers(getListData(userRes));
    } catch (err: any) {
      setError(err.message || 'Failed to load recurring maintenance');
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    const handle = window.setTimeout(loadData, 250);
    return () => window.clearTimeout(handle);
  }, [loadData]);

  const metrics = [
    { label: 'Active plans', value: summary.activePlans || 0, icon: CalendarClock },
    { label: 'Due soon', value: summary.dueSoonPlans || 0, icon: ClipboardCheck },
    { label: 'Overdue', value: summary.overduePlans || 0, icon: Wrench },
    { label: 'Completed this month', value: summary.completedThisMonth || 0, icon: CheckCircle2 },
  ];

  const dueGroups = useMemo(() => ({
    overdue: plans.filter((plan) => dueState(plan) === 'Overdue').length,
    dueSoon: plans.filter((plan) => dueState(plan) === 'Due soon').length,
  }), [plans]);

  const createPlan = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post('/maintenance/plans', {
        ...form,
        assetId: form.assetId || undefined,
        assignedToId: form.assignedToId || undefined,
        location: form.location || undefined,
        ticketTemplateTitle: form.ticketTemplateTitle || undefined,
        ticketTemplateDescription: form.ticketTemplateDescription || undefined,
        checklist: form.checklist.split('\n').map((item) => item.trim()).filter(Boolean),
      });
      setForm(blankForm());
      setShowForm(false);
      setMessage('Maintenance plan created');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create maintenance plan');
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = async (plan: MaintenancePlan, body: any) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.patch(`/maintenance/plans/${plan.id}`, body);
      setMessage('Maintenance plan updated');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update maintenance plan');
    } finally {
      setSaving(false);
    }
  };

  const generateTicket = async (plan: MaintenancePlan) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result: any = await api.post(`/maintenance/plans/${plan.id}/generate-ticket`, {});
      setMessage(`Generated ticket ${result?.ticket?.ticketNumber || ''}`.trim());
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to generate maintenance ticket');
    } finally {
      setSaving(false);
    }
  };

  const completePlan = async (plan: MaintenancePlan) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/maintenance/plans/${plan.id}/complete`, { notes: 'Completed from recurring maintenance dashboard' });
      setMessage('Maintenance marked complete');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to complete maintenance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <section className="border-b border-gray-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Preventive Service</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Recurring Maintenance</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Schedule preventive maintenance, generate service tickets, assign technicians, and track completed work across assets and sites.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              <Plus size={16} />
              New plan
            </button>
            <button onClick={loadData} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between text-gray-500">
              <p className="text-sm font-medium">{label}</p>
              <Icon size={18} />
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-950">{value}</p>
          </div>
        ))}
      </section>

      {showForm && (
        <form onSubmit={createPlan} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-4">
            <input required value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Plan name" />
            <select value={form.assetId} onChange={(e) => setForm((c) => ({ ...c, assetId: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">No linked asset</option>
              {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
            <input value={form.location} onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Site or location" />
            <select value={form.assignedToId} onChange={(e) => setForm((c) => ({ ...c, assignedToId: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">Unassigned</option>
              {users.map((user) => <option key={user.id} value={user.id}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}</option>)}
            </select>
            <select value={form.frequency} onChange={(e) => setForm((c) => ({ ...c, frequency: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              {frequencies.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input type="number" min="1" value={form.intervalDays} onChange={(e) => setForm((c) => ({ ...c, intervalDays: Number(e.target.value) }))} disabled={form.frequency !== 'CUSTOM'} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-gray-100" placeholder="Interval days" />
            <input type="datetime-local" value={form.nextDueAt} onChange={(e) => setForm((c) => ({ ...c, nextDueAt: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={form.ticketTemplateTitle} onChange={(e) => setForm((c) => ({ ...c, ticketTemplateTitle: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Ticket title template" />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} className="min-h-28 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Plan description" />
            <textarea value={form.checklist} onChange={(e) => setForm((c) => ({ ...c, checklist: e.target.value }))} className="min-h-28 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Checklist, one item per line" />
          </div>
          <textarea value={form.ticketTemplateDescription} onChange={(e) => setForm((c) => ({ ...c, ticketTemplateDescription: e.target.value }))} className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Ticket description template" />
          <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving && <Loader2 className="animate-spin" size={16} />}
            Save maintenance plan
          </button>
        </form>
      )}

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">Maintenance Plans</h2>
            <p className="text-sm text-gray-500">{dueGroups.overdue} overdue, {dueGroups.dueSoon} due soon.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full border-0 text-sm outline-none" placeholder="Search plans, assets, or locations" />
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-gray-500"><Loader2 className="animate-spin" size={16} /> Loading maintenance plans...</div>
          ) : plans.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No recurring maintenance plans found.</div>
          ) : plans.map((plan) => (
            <div key={plan.id} className="p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${dueClass(plan)}`}>{dueState(plan)}</span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{plan.frequency}</span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{plan.status}</span>
                    <h3 className="truncate text-sm font-semibold text-gray-950">{plan.name}</h3>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {[plan.companyName, plan.assetName || plan.location, `Due ${formatDate(plan.nextDueAt)}`, plan.lastCompletedAt ? `Last completed ${formatDate(plan.lastCompletedAt)}` : null].filter(Boolean).join(' | ')}
                  </p>
                  {plan.description && <p className="mt-2 max-w-4xl text-sm text-gray-600">{plan.description}</p>}
                  {plan.checklist?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plan.checklist.slice(0, 4).map((item) => <span key={item} className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">{item}</span>)}
                      {plan.checklist.length > 4 && <span className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-500">+{plan.checklist.length - 4} more</span>}
                    </div>
                  )}
                  {plan.latestTicketNumber && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Ticket size={14} />
                      {plan.latestTicketNumber} {plan.latestTicketStatus ? `(${plan.latestTicketStatus})` : ''}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={saving || plan.status !== 'ACTIVE'} onClick={() => generateTicket(plan)} className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                    <Ticket size={14} />
                    Ticket
                  </button>
                  <button disabled={saving || plan.status !== 'ACTIVE'} onClick={() => completePlan(plan)} className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-40">
                    <CheckCircle2 size={14} />
                    Complete
                  </button>
                  {plan.status === 'PAUSED' ? (
                    <button disabled={saving} onClick={() => updatePlan(plan, { status: 'ACTIVE' })} className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-40">
                      <Play size={14} />
                      Resume
                    </button>
                  ) : (
                    <button disabled={saving || plan.status !== 'ACTIVE'} onClick={() => updatePlan(plan, { status: 'PAUSED' })} className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-40">
                      <Pause size={14} />
                      Pause
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function dateInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function dueState(plan: MaintenancePlan) {
  if (plan.status !== 'ACTIVE') return plan.status === 'PAUSED' ? 'Paused' : 'Archived';
  const due = new Date(plan.nextDueAt).getTime();
  const now = Date.now();
  if (due < now) return 'Overdue';
  if (due <= now + 14 * 24 * 60 * 60 * 1000) return 'Due soon';
  return 'Scheduled';
}

function dueClass(plan: MaintenancePlan) {
  const state = dueState(plan);
  if (state === 'Overdue') return 'bg-rose-50 text-rose-700';
  if (state === 'Due soon') return 'bg-amber-50 text-amber-700';
  if (state === 'Scheduled') return 'bg-emerald-50 text-emerald-700';
  return 'bg-gray-100 text-gray-600';
}
