'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, KeyRound, Loader2, Plus, RefreshCw, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { api, getListData } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { RequireCompanyContext } from '../../../components/layout/RequireCompanyContext';

type Finding = {
  id: string;
  title: string;
  description?: string;
  severity: string;
  category: string;
  status: string;
  companyId: string;
  companyName?: string;
  assetName?: string;
  userEmail?: string;
  ownerEmail?: string;
  remediation?: string;
  dueAt?: string;
  resolvedAt?: string;
  updatedAt?: string;
};

const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const categories = ['ACCESS', 'DEVICE', 'CREDENTIAL', 'AUDIT', 'NETWORK', 'POLICY'];
const statuses = ['OPEN', 'IN_PROGRESS', 'ACCEPTED_RISK', 'RESOLVED'];

const blankForm = () => ({
  companyId: '',
  title: '',
  description: '',
  severity: 'MEDIUM',
  category: 'POLICY',
  assetId: '',
  userId: '',
  assignedToId: '',
  remediation: '',
  dueAt: '',
});

export default function SecurityCenterPage() {
  const [summary, setSummary] = useState<any>({});
  const [findings, setFindings] = useState<Finding[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [accessReview, setAccessReview] = useState<any[]>([]);
  const [devicePosture, setDevicePosture] = useState<any[]>([]);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [status, setStatus] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'findings' | 'access' | 'devices' | 'audit'>('findings');
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
      const params = new URLSearchParams({ status, severity, limit: '100' });
      if (query.trim()) params.set('search', query.trim());
      const [summaryRes, findingsRes, eventsRes, accessRes, deviceRes, usersRes] = await Promise.all([
        api.get('/security-center/summary'),
        api.get(`/security-center/findings?${params.toString()}`),
        api.get(`/security-center/events?limit=50${query.trim() ? `&search=${encodeURIComponent(query.trim())}` : ''}`),
        api.get('/security-center/access-review'),
        api.get('/security-center/device-posture'),
        api.get('/users/options').catch(() => []),
      ]);
      setSummary(summaryRes || {});
      setFindings(getListData(findingsRes));
      setEvents(getListData(eventsRes));
      setAccessReview(getListData(accessRes));
      setDevicePosture(getListData(deviceRes));
      setTenantUsers(getListData(usersRes));
    } catch (err: any) {
      setError(err.message || 'Failed to load security center');
    } finally {
      setLoading(false);
    }
  }, [query, severity, status]);

  useEffect(() => {
    const handle = window.setTimeout(loadData, 250);
    return () => window.clearTimeout(handle);
  }, [loadData]);

  const users = tenantUsers;
  const assets = useMemo(() => devicePosture.filter((item) => !form.companyId || item.companyId === form.companyId), [devicePosture, form.companyId]);

  const metrics = [
    { label: 'Risk score', value: `${summary.riskScore ?? 100}/100`, icon: ShieldCheck },
    { label: 'Compliance', value: `${summary.complianceRate ?? 0}%`, icon: CheckCircle2 },
    { label: 'Open findings', value: summary.openFindings || 0, icon: AlertTriangle },
    { label: 'Stale credentials', value: summary.credentials?.stale || 0, icon: KeyRound },
  ];

  const createFinding = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post('/security-center/findings', {
        ...form,
        companyId: form.companyId || undefined,
        assetId: form.assetId || undefined,
        userId: form.userId || undefined,
        assignedToId: form.assignedToId || undefined,
        dueAt: form.dueAt || undefined,
      });
      setForm(blankForm());
      setShowForm(false);
      setMessage('Security finding created');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create finding');
    } finally {
      setSaving(false);
    }
  };

  const updateFinding = async (finding: Finding, body: any) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.patch(`/security-center/findings/${finding.id}`, body);
      setMessage('Finding updated');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update finding');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequireCompanyContext area="Security Center">
    <div className="space-y-6 p-6">
      <section className="border-b border-gray-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Governance</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Compliance and Security Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Review user access, device compliance, audit activity, credential posture, and security findings across the business.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              <Plus size={16} />
              New finding
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

      <section className="grid gap-4 xl:grid-cols-3">
        <InsightCard title="Users" icon={UserCheck} items={[
          ['Total', summary.users?.total || 0],
          ['Unverified', summary.users?.unverified || 0],
          ['Stale login', summary.users?.stale || 0],
        ]} />
        <InsightCard title="Devices" icon={ShieldCheck} items={[
          ['Total', summary.devices?.total || 0],
          ['Non-compliant', summary.devices?.nonCompliant || 0],
          ['Unmanaged', summary.devices?.unmanaged || 0],
        ]} />
        <InsightCard title="Audit" icon={ClipboardList} items={[
          ['Events 7d', summary.audit?.eventsLast7Days || 0],
          ['Sessions 7d', summary.audit?.sessionsLast7Days || 0],
          ['Critical findings', summary.findingsBySeverity?.CRITICAL || 0],
        ]} />
      </section>

      {showForm && (
        <form onSubmit={createFinding} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-4">
            <input required value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Finding title" />
            <select value={form.severity} onChange={(e) => setForm((c) => ({ ...c, severity: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              {severities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={form.assetId} onChange={(e) => setForm((c) => ({ ...c, assetId: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">No linked asset</option>
              {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
            <select value={form.userId} onChange={(e) => setForm((c) => ({ ...c, userId: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">No linked user</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.email}</option>)}
            </select>
            <select value={form.assignedToId} onChange={(e) => setForm((c) => ({ ...c, assignedToId: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">Unassigned</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.email}</option>)}
            </select>
            <input type="date" value={form.dueAt} onChange={(e) => setForm((c) => ({ ...c, dueAt: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} className="min-h-24 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Description" />
            <textarea value={form.remediation} onChange={(e) => setForm((c) => ({ ...c, remediation: e.target.value }))} className="min-h-24 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Remediation steps" />
          </div>
          <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving && <Loader2 className="animate-spin" size={16} />}
            Save finding
          </button>
        </form>
      )}

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['findings', 'access', 'devices', 'audit'] as const).map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === item ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {item === 'findings' ? 'Findings' : item === 'access' ? 'Access Review' : item === 'devices' ? 'Device Posture' : 'Audit Events'}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full border-0 text-sm outline-none" placeholder="Search security records" />
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="ALL">All statuses</option>
              {statuses.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
            </select>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="ALL">All severities</option>
              {severities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 p-4 text-sm text-gray-500"><Loader2 className="animate-spin" size={16} /> Loading security center...</div>
        ) : tab === 'findings' ? (
          <FindingsList findings={findings} saving={saving} onUpdate={updateFinding} />
        ) : tab === 'access' ? (
          <SimpleList empty="No users available for access review." rows={accessReview.map((item) => ({
            id: item.id,
            title: item.email,
            badge: item.role,
            detail: [item.companyName, item.reviewReason, item.lastLoginAt ? `Last login ${formatDate(item.lastLoginAt)}` : 'Never logged in'].filter(Boolean).join(' | '),
          }))} />
        ) : tab === 'devices' ? (
          <SimpleList empty="No devices available for posture review." rows={devicePosture.map((item) => ({
            id: item.id,
            title: item.name,
            badge: item.complianceStatus || 'UNKNOWN',
            detail: [item.companyName, item.enrollmentStatus, item.complianceReasons, item.lastCheckInAt ? `Last check-in ${formatDate(item.lastCheckInAt)}` : 'No check-in'].filter(Boolean).join(' | '),
          }))} />
        ) : (
          <SimpleList empty="No audit events found." rows={events.map((item) => ({
            id: item.id,
            title: item.action,
            badge: item.resourceType || 'Audit',
            detail: [item.companyName, item.actorEmail, item.createdAt ? formatDate(item.createdAt) : null].filter(Boolean).join(' | '),
          }))} />
        )}
      </section>
    </div>
    </RequireCompanyContext>
  );
}

function InsightCard({ title, icon: Icon, items }: { title: string; icon: any; items: Array<[string, any]> }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-950">{title}</h2>
        <Icon size={18} className="text-gray-500" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {items.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-lg font-bold text-gray-950">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FindingsList({ findings, saving, onUpdate }: { findings: Finding[]; saving: boolean; onUpdate: (finding: Finding, body: any) => void }) {
  if (findings.length === 0) return <div className="p-4 text-sm text-gray-500">No security findings found.</div>;
  return (
    <div className="divide-y divide-gray-100">
      {findings.map((finding) => (
        <div key={finding.id} className="p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${severityClass(finding.severity)}`}>{finding.severity}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{finding.category}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{finding.status.replaceAll('_', ' ')}</span>
                <h3 className="truncate text-sm font-semibold text-gray-950">{finding.title}</h3>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {[finding.companyName, finding.assetName, finding.userEmail, finding.ownerEmail ? `Owner ${finding.ownerEmail}` : null, finding.dueAt ? `Due ${formatDate(finding.dueAt)}` : null].filter(Boolean).join(' | ')}
              </p>
              {finding.description && <p className="mt-2 max-w-4xl text-sm text-gray-600">{finding.description}</p>}
              {finding.remediation && <p className="mt-2 text-sm text-gray-500">Remediation: {finding.remediation}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={saving || finding.status === 'IN_PROGRESS'} onClick={() => onUpdate(finding, { status: 'IN_PROGRESS' })} className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-40">Start</button>
              <button disabled={saving || finding.status === 'ACCEPTED_RISK'} onClick={() => onUpdate(finding, { status: 'ACCEPTED_RISK' })} className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-40">Accept risk</button>
              <button disabled={saving || finding.status === 'RESOLVED'} onClick={() => onUpdate(finding, { status: 'RESOLVED' })} className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-40">Resolve</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SimpleList({ rows, empty }: { rows: Array<{ id: string; title: string; badge: string; detail: string }>; empty: string }) {
  if (rows.length === 0) return <div className="p-4 text-sm text-gray-500">{empty}</div>;
  return (
    <div className="divide-y divide-gray-100">
      {rows.map((row) => (
        <div key={row.id} className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{row.badge}</span>
                <p className="truncate text-sm font-semibold text-gray-950">{row.title}</p>
              </div>
              <p className="mt-1 text-xs text-gray-500">{row.detail}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function severityClass(severity: string) {
  if (severity === 'CRITICAL') return 'bg-rose-50 text-rose-700';
  if (severity === 'HIGH') return 'bg-orange-50 text-orange-700';
  if (severity === 'MEDIUM') return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
}
