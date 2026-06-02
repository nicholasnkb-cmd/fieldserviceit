'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, CalendarClock, CheckCircle2, Clock3, Filter, Mail, Plus, RefreshCw, ShieldCheck, Ticket } from 'lucide-react';
import { api, getListData } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../components/ui/Toast';
import { useAuthStore } from '../../../stores/authStore';

type Asset = { id: string; name?: string; hostname?: string; assetType?: string };
type AlertEvent = {
  id: string;
  title: string;
  details?: string;
  status: string;
  severity?: string;
  assetName?: string;
  assetHostname?: string;
  ticketId?: string;
  ticketNumber?: string;
  metric?: string;
  triggeredAt: string;
  resolvedAt?: string | null;
};
type AlertRule = {
  id: string;
  name: string;
  assetId?: string | null;
  assetName?: string;
  metric: string;
  operator: string;
  threshold?: string;
  durationSec?: number;
  severity: string;
  enabled: boolean | number;
  notifyEmail?: string;
};
type MaintenanceWindow = { id: string; name: string; assetId?: string; startsAt: string; endsAt: string; suppressAlerts: boolean | number };
type EscalationPolicy = { id: string; name: string; severity: string; firstDelayMin: number; secondDelayMin: number; managerDelayMin: number; enabled: boolean | number };

const emptyRule = {
  name: 'High utilization',
  assetId: '',
  metric: 'bandwidth',
  operator: '>',
  threshold: '80',
  durationSec: 300,
  severity: 'WARNING',
  notifyEmail: '',
};
const emptyMaintenance = { name: 'Planned maintenance', assetId: '', startsAt: '', endsAt: '', suppressAlerts: true };
const emptyEscalation = { name: 'Critical escalation', severity: 'CRITICAL', firstDelayMin: 0, secondDelayMin: 15, managerDelayMin: 30, enabled: true };

function severityClass(severity?: string) {
  const value = String(severity || '').toUpperCase();
  if (value === 'CRITICAL') return 'border-red-200 bg-red-50 text-red-700';
  if (value === 'WARNING') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function statusClass(status?: string) {
  const value = String(status || '').toUpperCase();
  if (value === 'RESOLVED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value === 'ACKNOWLEDGED') return 'border-indigo-200 bg-indigo-50 text-indigo-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function assetLabel(asset: Asset) {
  return asset.name || asset.hostname || asset.id;
}

export default function AlertingPage() {
  const { toast } = useToast();
  const { user, activeCompanyContext } = useAuthStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [escalations, setEscalations] = useState<EscalationPolicy[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [maintenanceForm, setMaintenanceForm] = useState(emptyMaintenance);
  const [escalationForm, setEscalationForm] = useState(emptyEscalation);

  const needsCompanyContext = user?.role === 'SUPER_ADMIN' && !activeCompanyContext?.id;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [eventData, ruleData, windowData, escalationData, assetData, summaryData] = await Promise.all([
        api.get(`/assets/network/alert-events?status=${statusFilter}`),
        api.get('/assets/network/alert-rules'),
        api.get('/assets/network/maintenance-windows'),
        api.get('/assets/network/escalation-policies'),
        api.get('/assets?limit=100'),
        api.get('/assets/network/monitoring/summary').catch(() => null),
      ]);
      setEvents(getListData<AlertEvent>(eventData));
      setRules(getListData<AlertRule>(ruleData));
      setWindows(getListData<MaintenanceWindow>(windowData));
      setEscalations(getListData<EscalationPolicy>(escalationData));
      setAssets(getListData<Asset>(assetData));
      setSummary(summaryData);
    } catch (err: any) {
      setError(err?.body?.message || err?.message || 'Advanced alerting could not be loaded.');
      setEvents([]);
      setRules([]);
      setWindows([]);
      setEscalations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (needsCompanyContext) {
      setLoading(false);
      setError('Select a company context from the top bar to manage alerting.');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, needsCompanyContext]);

  const metrics = useMemo(() => {
    const active = events.filter((event) => event.status === 'ACTIVE').length;
    const acknowledged = events.filter((event) => event.status === 'ACKNOWLEDGED').length;
    const critical = events.filter((event) => String(event.severity).toUpperCase() === 'CRITICAL').length;
    return {
      active: summary?.activeAlerts ?? active,
      acknowledged,
      critical,
      rules: summary?.activeAlertRules ?? rules.filter((rule) => Boolean(rule.enabled)).length,
      windows: windows.filter((item) => new Date(item.endsAt).getTime() >= Date.now()).length,
    };
  }, [events, rules, summary, windows]);

  const updateEventStatus = async (event: AlertEvent, status: 'ACKNOWLEDGED' | 'RESOLVED' | 'ACTIVE') => {
    try {
      await api.patch(`/assets/network/alert-events/${event.id}`, { status });
      toast('success', status === 'RESOLVED' ? 'Alert resolved' : status === 'ACKNOWLEDGED' ? 'Alert acknowledged' : 'Alert reopened');
      await load();
    } catch (err: any) {
      toast('error', err?.body?.message || err?.message || 'Alert could not be updated');
    }
  };

  const createRule = async () => {
    if (!ruleForm.name.trim()) {
      toast('error', 'Rule name is required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/assets/network/alert-rules', { ...ruleForm, assetId: ruleForm.assetId || undefined });
      toast('success', 'Alert rule created');
      setRuleForm(emptyRule);
      await load();
    } catch (err: any) {
      toast('error', err?.body?.message || err?.message || 'Alert rule could not be created');
    } finally {
      setSaving(false);
    }
  };

  const createMaintenanceWindow = async () => {
    if (!maintenanceForm.startsAt || !maintenanceForm.endsAt) {
      toast('error', 'Start and end time are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/assets/network/maintenance-windows', { ...maintenanceForm, assetId: maintenanceForm.assetId || undefined });
      toast('success', 'Maintenance window scheduled');
      setMaintenanceForm(emptyMaintenance);
      await load();
    } catch (err: any) {
      toast('error', err?.body?.message || err?.message || 'Maintenance window could not be created');
    } finally {
      setSaving(false);
    }
  };

  const createEscalation = async () => {
    setSaving(true);
    try {
      await api.post('/assets/network/escalation-policies', escalationForm);
      toast('success', 'Escalation policy created');
      setEscalationForm(emptyEscalation);
      await load();
    } catch (err: any) {
      toast('error', err?.body?.message || err?.message || 'Escalation policy could not be created');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Monitoring Response</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">Advanced Alerting</h1>
              <p className="mt-1 text-sm text-gray-500">Acknowledge incidents, define rules, schedule maintenance windows, and manage escalation paths.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                <option value="ACTIVE">Active</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
                <option value="ALL">All alerts</option>
              </select>
              <button onClick={load} disabled={needsCompanyContext} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Active alerts', metrics.active, AlertTriangle, 'text-red-600'],
              ['Acknowledged', metrics.acknowledged, ShieldCheck, 'text-indigo-600'],
              ['Critical', metrics.critical, Bell, 'text-red-600'],
              ['Enabled rules', metrics.rules, Filter, 'text-blue-600'],
              ['Future windows', metrics.windows, CalendarClock, 'text-emerald-600'],
            ].map(([label, value, Icon, color]: any) => (
              <div key={label} className="rounded-md border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="space-y-5">
          {error && <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}

          <section className="rounded-md border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Alert Events</h2>
                <p className="text-xs text-gray-500">{loading ? 'Loading alerts...' : `${events.length} alerts shown`}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {events.map((event) => (
                <div key={event.id} className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(event.status)}`}>{event.status}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${severityClass(event.severity)}`}>{event.severity || 'INFO'}</span>
                        {event.ticketNumber && <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"><Ticket className="h-3 w-3" /> {event.ticketNumber}</span>}
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">{event.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{event.details || 'No alert details provided.'}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                        <span>{event.assetName || event.assetHostname || 'Unassigned asset'}</span>
                        <span>{event.metric || 'monitoring'}</span>
                        <span>Triggered {formatDate(event.triggeredAt)}</span>
                        {event.resolvedAt && <span>Resolved {formatDate(event.resolvedAt)}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.status !== 'ACKNOWLEDGED' && event.status !== 'RESOLVED' && (
                        <button onClick={() => updateEventStatus(event, 'ACKNOWLEDGED')} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Acknowledge</button>
                      )}
                      {event.status !== 'RESOLVED' && (
                        <button onClick={() => updateEventStatus(event, 'RESOLVED')} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">Resolve</button>
                      )}
                      {event.status === 'RESOLVED' && (
                        <button onClick={() => updateEventStatus(event, 'ACTIVE')} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Reopen</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!loading && events.length === 0 && <div className="px-4 py-10 text-center text-sm text-gray-500">No alert events match this filter.</div>}
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Alert Rules</h2>
              <p className="text-xs text-gray-500">Company-wide and device-specific thresholds that create alerts and tickets.</p>
            </div>
            <div className="divide-y divide-gray-100">
              {rules.map((rule) => (
                <div key={rule.id} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${severityClass(rule.severity)}`}>{rule.severity}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{rule.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{rule.name}</p>
                    <p className="text-xs text-gray-500">{rule.assetName || 'All monitored devices'}: {rule.metric} {rule.operator} {rule.threshold || '-'}</p>
                  </div>
                  {rule.notifyEmail && <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Mail className="h-3 w-3" /> {rule.notifyEmail}</span>}
                </div>
              ))}
              {!loading && rules.length === 0 && <div className="px-4 py-8 text-sm text-gray-500">No alert rules configured.</div>}
            </div>
          </section>
        </main>

        <aside className="space-y-5">
          <section className="rounded-md border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Create Alert Rule</h2>
            <div className="mt-3 grid gap-3">
              <input value={ruleForm.name} onChange={(event) => setRuleForm({ ...ruleForm, name: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Rule name" />
              <select value={ruleForm.assetId} onChange={(event) => setRuleForm({ ...ruleForm, assetId: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">All monitored devices</option>
                {assets.map((asset) => <option key={asset.id} value={asset.id}>{assetLabel(asset)}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <select value={ruleForm.metric} onChange={(event) => setRuleForm({ ...ruleForm, metric: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="status">Status</option>
                  <option value="latency">Latency</option>
                  <option value="packet_loss">Packet loss</option>
                  <option value="bandwidth">Bandwidth</option>
                  <option value="cpu">CPU</option>
                  <option value="memory">Memory</option>
                  <option value="temperature">Temperature</option>
                  <option value="interface_errors">Interface errors</option>
                </select>
                <input value={ruleForm.operator} onChange={(event) => setRuleForm({ ...ruleForm, operator: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input value={ruleForm.threshold} onChange={(event) => setRuleForm({ ...ruleForm, threshold: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={ruleForm.severity} onChange={(event) => setRuleForm({ ...ruleForm, severity: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <input type="number" value={ruleForm.durationSec} onChange={(event) => setRuleForm({ ...ruleForm, durationSec: Number(event.target.value) })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Duration sec" />
              </div>
              <input value={ruleForm.notifyEmail} onChange={(event) => setRuleForm({ ...ruleForm, notifyEmail: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Notify email" />
              <button onClick={createRule} disabled={saving || needsCompanyContext} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                <Plus className="h-4 w-4" /> Create rule
              </button>
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Maintenance Window</h2>
            <div className="mt-3 grid gap-3">
              <input value={maintenanceForm.name} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, name: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <select value={maintenanceForm.assetId} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, assetId: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">All monitored devices</option>
                {assets.map((asset) => <option key={asset.id} value={asset.id}>{assetLabel(asset)}</option>)}
              </select>
              <input type="datetime-local" value={maintenanceForm.startsAt} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, startsAt: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input type="datetime-local" value={maintenanceForm.endsAt} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, endsAt: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={maintenanceForm.suppressAlerts} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, suppressAlerts: event.target.checked })} className="rounded border-gray-300" />
                Suppress alert noise
              </label>
              <button onClick={createMaintenanceWindow} disabled={saving || needsCompanyContext} className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <CalendarClock className="h-4 w-4" /> Schedule window
              </button>
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Escalation Policy</h2>
            <div className="mt-3 grid gap-3">
              <input value={escalationForm.name} onChange={(event) => setEscalationForm({ ...escalationForm, name: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <select value={escalationForm.severity} onChange={(event) => setEscalationForm({ ...escalationForm, severity: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" value={escalationForm.firstDelayMin} onChange={(event) => setEscalationForm({ ...escalationForm, firstDelayMin: Number(event.target.value) })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input type="number" value={escalationForm.secondDelayMin} onChange={(event) => setEscalationForm({ ...escalationForm, secondDelayMin: Number(event.target.value) })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input type="number" value={escalationForm.managerDelayMin} onChange={(event) => setEscalationForm({ ...escalationForm, managerDelayMin: Number(event.target.value) })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <button onClick={createEscalation} disabled={saving || needsCompanyContext} className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <Clock3 className="h-4 w-4" /> Add policy
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {escalations.slice(0, 4).map((policy) => (
                <div key={policy.id} className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <div className="font-medium text-gray-800">{policy.name}</div>
                  <div>{policy.severity}: {policy.firstDelayMin}/{policy.secondDelayMin}/{policy.managerDelayMin} min</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Upcoming Windows</h2>
            <div className="mt-3 space-y-2">
              {windows.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <div className="font-medium text-gray-800">{item.name}</div>
                  <div>{formatDate(item.startsAt)} to {formatDate(item.endsAt)}</div>
                  <div>{item.suppressAlerts ? 'Suppress alerts' : 'Notify only'}</div>
                </div>
              ))}
              {!loading && windows.length === 0 && <div className="text-sm text-gray-500">No maintenance windows scheduled.</div>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
