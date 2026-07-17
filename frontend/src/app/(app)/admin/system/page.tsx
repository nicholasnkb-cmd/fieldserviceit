'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getListData } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  seatMonthlyPrice: number;
  seatAnnualPrice: number;
  trialDays: number;
  maxUsers: number;
  maxTickets: number;
  isActive: boolean;
  features: Record<string, boolean>;
}

interface Readiness {
  status: string;
  generatedAt: string;
  environment: string;
  paypalWebhookPath: string;
  checks: { name: string; status: string; detail: string }[];
  deployment?: {
    frontendVersion?: string;
    backendVersion?: string;
    backendCommit?: string;
    nodeEnv?: string;
    corsOrigin?: string | null;
    lastNetworkPoll?: { source?: string; status?: string; createdAt?: string } | null;
    lastRmmSync?: { provider?: string; status?: string; completedAt?: string; assetsCreated?: number; assetsUpdated?: number; assetsSkipped?: number; errorMessage?: string | null } | null;
  };
  migrations?: { applied: number; pending: string[]; failed: { name: string; error: string; attempts: number; lastAttemptAt: string }[] } | null;
}

interface CompanyOption { id: string; name: string }
interface UserOption { id: string; email: string; firstName: string; lastName: string; company?: { id: string; name: string } }
interface FunctionControl { key: string; label: string }
interface BillingProvider {
  key: string;
  name: string;
  configured: boolean;
  priceCount: number;
  webhookPath: string;
  isDefault: boolean;
  checks: { name: string; ok: boolean; detail: string }[];
}
interface BillingEvent {
  id: string;
  provider: string;
  eventType: string;
  status: string;
  companyId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}
interface BillingPrice {
  id: string;
  planId: string;
  planName: string;
  provider: string;
  billingInterval: string;
  component: string;
  externalPriceId: string;
}
interface DeploymentEvent {
  id: string;
  releaseCommit: string;
  component: string;
  status: string;
  workflowUrl?: string | null;
  durationMs?: number | null;
  detail?: Record<string, unknown>;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

const featureLabels: Record<string, string> = {
  tickets: 'Tickets',
  dispatch: 'Dispatch',
  assets: 'Asset and device management',
  emailNotifications: 'Email notifications',
  publicSubmit: 'Signed-in request intake',
  csvExport: 'CSV export',
  apiAccess: 'API access',
  rmmIntegration: 'RMM integrations',
  slaManagement: 'SLA management',
  workflows: 'Workflows',
  reporting: 'Reporting',
  auditLogs: 'Audit logs',
  branding: 'Custom branding',
  timeTracking: 'Time tracking',
  contracts: 'Contracts',
  kb: 'Knowledge base',
};

export default function SystemControlsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Plan>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [frontendCommit, setFrontendCommit] = useState(process.env.NEXT_PUBLIC_APP_COMMIT || 'unknown');
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [functions, setFunctions] = useState<FunctionControl[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [companyFeatures, setCompanyFeatures] = useState<Record<string, boolean>>({});
  const [userFeatures, setUserFeatures] = useState<Record<string, boolean>>({});
  const [billingProviders, setBillingProviders] = useState<BillingProvider[]>([]);
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
  const [billingPrices, setBillingPrices] = useState<BillingPrice[]>([]);
  const [deployments, setDeployments] = useState<DeploymentEvent[]>([]);
  const [testingProvider, setTestingProvider] = useState('');
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
    Promise.all([
      api.get('/admin/plans'),
      api.get('/admin/system-readiness').catch(() => null),
      api.get('/admin/companies?limit=100').catch(() => ({ data: [] })),
      api.get('/admin/users?limit=100').catch(() => ({ data: [] })),
      api.get('/admin/function-controls').catch(() => []),
      api.get('/admin/billing/providers').catch(() => []),
      api.get('/admin/billing/events?limit=12').catch(() => []),
      api.get('/admin/billing/prices').catch(() => []),
      api.get('/admin/deployments?limit=30').catch(() => []),
      fetch('/release.json', { cache: 'no-store' }).then((response) => response.ok ? response.json() : null).catch(() => null),
    ])
      .then(([data, readinessData, companyData, userData, functionData, providerData, eventData, priceData, deploymentData, releaseData]) => {
        if (readinessData) setReadiness(readinessData);
        if (releaseData?.commit || releaseData?.release) setFrontendCommit(releaseData.commit || releaseData.release);
        setCompanies(getListData<CompanyOption>(companyData));
        setUsers(getListData<UserOption>(userData));
        setFunctions(getListData<FunctionControl>(functionData));
        setBillingProviders(getListData<BillingProvider>(providerData));
        setBillingEvents(getListData<BillingEvent>(eventData));
        setDeployments(getListData<DeploymentEvent>(deploymentData));
        const prices = getListData<BillingPrice>(priceData);
        setBillingPrices(prices);
        setPriceDrafts(Object.fromEntries(prices.map((price) => [`${price.planId}:${price.provider}:${price.billingInterval}:${price.component}`, price.externalPriceId])));
        return data;
      })
      .then((data) => {
        const rows = getListData<Plan>(data);
        setPlans(rows);
        setDrafts(Object.fromEntries(rows.map((plan: Plan) => [plan.id, { ...plan, features: plan.features || {} }])));
      })
      .catch((err) => setMessage(err.message || 'Failed to load system controls'))
      .finally(() => setLoading(false));
  }, [user, router]);

  const featureKeys = useMemo(() => {
    const keys = new Set(Object.keys(featureLabels));
    plans.forEach((plan) => Object.keys(plan.features || {}).forEach((key) => keys.add(key)));
    return Array.from(keys);
  }, [plans]);

  const updateDraft = (id: string, patch: Partial<Plan>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const toggleFeature = (id: string, key: string) => {
    const current = drafts[id];
    updateDraft(id, { features: { ...current.features, [key]: !current.features?.[key] } });
  };

  const savePlan = async (id: string) => {
    const draft = drafts[id];
    setSavingId(id);
    setMessage('');
    try {
      const updated = await api.patch(`/admin/plans/${id}`, {
        description: draft.description,
        monthlyPrice: Number(draft.monthlyPrice),
        annualPrice: Number(draft.annualPrice),
        seatMonthlyPrice: Number(draft.seatMonthlyPrice),
        seatAnnualPrice: Number(draft.seatAnnualPrice),
        trialDays: Number(draft.trialDays),
        maxUsers: Number(draft.maxUsers),
        maxTickets: Number(draft.maxTickets),
        isActive: draft.isActive,
        features: draft.features,
      });
      const normalized = { ...updated, features: updated.features || {} };
      setPlans((prev) => prev.map((plan) => (plan.id === id ? normalized : plan)));
      setDrafts((prev) => ({ ...prev, [id]: normalized }));
      setMessage('System controls saved');
    } catch (err: any) {
      setMessage(err.message || 'Failed to save controls');
    } finally {
      setSavingId(null);
    }
  };

  const loadCompanyControls = async (companyId: string) => {
    setSelectedCompanyId(companyId);
    if (!companyId) return;
    const data = await api.get(`/admin/companies/${companyId}/feature-controls`);
    setCompanyFeatures(data.featureOverrides || {});
  };

  const loadUserControls = async (userId: string) => {
    setSelectedUserId(userId);
    if (!userId) return;
    const data = await api.get(`/admin/users/${userId}/feature-controls`);
    setUserFeatures(data.featureOverrides || {});
  };

  const saveCompanyControls = async () => {
    if (!selectedCompanyId) return;
    await api.patch(`/admin/companies/${selectedCompanyId}/feature-overrides`, { featureOverrides: companyFeatures });
    setMessage('Business function controls saved');
  };

  const saveUserControls = async () => {
    if (!selectedUserId) return;
    await api.patch(`/admin/users/${selectedUserId}/feature-controls`, { featureOverrides: userFeatures });
    setMessage('User function controls saved');
  };

  const testProvider = async () => {
    setTestingProvider('PAYPAL');
    setMessage('');
    try {
      const result = await api.post('/admin/billing/paypal/test', {});
      setMessage(result.detail || 'PayPal connection test completed');
    } catch (err: any) {
      setMessage(err.message || 'PayPal connection test failed');
    } finally {
      setTestingProvider('');
    }
  };

  const saveBillingPrice = async (planId: string, provider: string, billingInterval: string, component: string) => {
    const key = `${planId}:${provider}:${billingInterval}:${component}`;
    try {
      const rows = await api.post('/admin/billing/prices', { planId, interval: billingInterval, component, externalPriceId: priceDrafts[key] || '' });
      setBillingPrices(getListData<BillingPrice>(rows));
      setMessage(`${provider} ${billingInterval.toLowerCase()} ${component.toLowerCase()} price saved`);
    } catch (err: any) {
      setMessage(err.message || 'Failed to save billing price');
    }
  };

  if (loading) return <div className="p-8">Loading system controls...</div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Super Admin</p>
        <h1 className="mt-2 text-2xl font-bold">System Controls</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage plan availability, usage limits, feature flags, and billing identifiers.
        </p>
      </div>

      {message && <div className="rounded bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}

      {readiness && (
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">Production readiness</h2>
              <p className="text-sm text-gray-500">{readiness.environment} environment · webhook {readiness.paypalWebhookPath}</p>
            </div>
            <span className="w-fit rounded border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700">{readiness.status.replaceAll('_', ' ')}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ['Frontend version', readiness.deployment?.frontendVersion || 'unknown'],
              ['Frontend commit', frontendCommit],
              ['Backend version', readiness.deployment?.backendVersion || 'unknown'],
              ['Backend commit', readiness.deployment?.backendCommit || 'unknown'],
              ['Migrations applied', String(readiness.migrations?.applied ?? 'unknown')],
              ['Migrations pending / failed', readiness.migrations ? `${readiness.migrations.pending.length} / ${readiness.migrations.failed.length}` : 'unknown'],
              ['Runtime', readiness.deployment?.nodeEnv || readiness.environment],
              ['CORS origin', readiness.deployment?.corsOrigin || 'not set'],
              ['Last monitoring poll', readiness.deployment?.lastNetworkPoll ? `${readiness.deployment.lastNetworkPoll.source || 'poll'} ${readiness.deployment.lastNetworkPoll.status || ''}` : 'No poll recorded'],
              ['Last RMM sync', readiness.deployment?.lastRmmSync ? `${readiness.deployment.lastRmmSync.provider || 'RMM'} ${readiness.deployment.lastRmmSync.status || ''}` : 'No sync recorded'],
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-gray-200 bg-gray-50 p-3">
                <div className="text-xs font-medium uppercase text-gray-500">{label}</div>
                <div className="mt-1 truncate text-sm font-medium text-gray-900">{value}</div>
              </div>
            ))}
            {readiness.checks.map((check) => (
              <div key={check.name} className="rounded border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-900">{check.name}</span>
                  <span className={`rounded border px-2 py-0.5 text-xs font-medium ${check.status === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : check.status === 'critical' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{check.status}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{check.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="deployment-history" className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">Deployment history</h2>
            <p className="text-sm text-gray-500">Recent production releases, verification outcomes, durations, and rollback events.</p>
          </div>
          <span className="w-fit rounded border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">{deployments.length} events</span>
        </div>
        {deployments.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                  <th className="pb-2">Completed</th><th className="pb-2">Release</th><th className="pb-2">Component</th><th className="pb-2">Duration</th><th className="pb-2">Result</th><th className="pb-2 text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((event) => (
                  <tr key={event.id} className="border-b border-gray-100">
                    <td className="py-3 pr-3 text-gray-600">{new Date(event.completedAt || event.createdAt).toLocaleString()}</td>
                    <td className="py-3 pr-3 font-mono text-xs text-gray-800" title={event.releaseCommit}>{event.releaseCommit.slice(0, 12)}</td>
                    <td className="py-3 pr-3 capitalize text-gray-700">{event.component}</td>
                    <td className="py-3 pr-3 text-gray-600">{event.durationMs == null ? '—' : `${Math.max(1, Math.round(event.durationMs / 1000))}s`}</td>
                    <td className="py-3 pr-3"><span className={`rounded border px-2 py-0.5 text-xs font-semibold ${event.status === 'SUCCEEDED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : event.status === 'STARTED' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{event.status.replaceAll('_', ' ')}</span></td>
                    <td className="py-3 text-right">{event.workflowUrl ? <a href={event.workflowUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">Workflow</a> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="mt-4 text-sm text-gray-500">Deployment events will appear after the next production workflow completes.</p>}
      </section>

      <section className="border border-gray-200 bg-white p-5">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-lg font-semibold text-gray-950">PayPal billing</h2>
          <p className="mt-1 text-sm text-gray-500">Connection readiness, webhook routes, {billingPrices.length} price mappings, and recent synchronization events.</p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {billingProviders.map((item) => (
            <div key={item.key} className="border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-950">{item.name}{item.isDefault ? ' (default)' : ''}</h3>
                  <p className="mt-1 text-xs text-gray-500">{item.webhookPath} · {item.priceCount} mapped prices</p>
                </div>
                <button type="button" disabled={!item.configured || testingProvider === item.key} onClick={testProvider} className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 disabled:opacity-40">
                  {testingProvider === item.key ? 'Testing...' : 'Test'}
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {item.checks.map((check) => (
                  <div key={check.name} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-gray-600">{check.detail}</span>
                    <span className={check.ok ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>{check.ok ? 'Ready' : 'Missing'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead><tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500"><th className="pb-2">Plan</th><th className="pb-2">Provider</th><th className="pb-2">Cycle</th><th className="pb-2">Component</th><th className="pb-2">External price ID</th><th className="pb-2 text-right">Action</th></tr></thead>
            <tbody>
              {plans.filter((plan) => Number(plan.monthlyPrice) > 0).flatMap((plan) => billingProviders.flatMap((item) => ['MONTH', 'YEAR'].map((cycle) => {
                const component = 'BASE';
                const key = `${plan.id}:${item.key}:${cycle}:${component}`;
                return (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="py-2 pr-3 font-medium">{plan.name}</td><td className="py-2 pr-3">{item.name}</td><td className="py-2 pr-3">{cycle}</td><td className="py-2 pr-3">{component}</td>
                    <td className="py-2 pr-3"><input value={priceDrafts[key] || ''} onChange={(event) => setPriceDrafts((prev) => ({ ...prev, [key]: event.target.value }))} placeholder="price or variant ID" className="w-full border border-gray-300 px-2 py-1.5" /></td>
                    <td className="py-2 text-right"><button type="button" onClick={() => saveBillingPrice(plan.id, item.key, cycle, component)} className="border border-gray-300 px-3 py-1.5 font-medium">Save</button></td>
                  </tr>
                );
              })))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900">Recent billing events</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500"><th className="pb-2">Received</th><th className="pb-2">Provider</th><th className="pb-2">Event</th><th className="pb-2">Company</th><th className="pb-2">Status</th></tr></thead>
              <tbody>{billingEvents.map((event) => <tr key={event.id} className="border-b border-gray-100"><td className="py-2 pr-3">{new Date(event.createdAt).toLocaleString()}</td><td className="py-2 pr-3">{event.provider}</td><td className="py-2 pr-3">{event.eventType}</td><td className="py-2 pr-3">{event.companyId || 'Unresolved'}</td><td className="py-2 font-semibold">{event.status}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-950">Business, tenant, and user functions</h2>
        <p className="mt-1 text-sm text-gray-500">Turn specific application functions on or off for a business or an individual user.</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="rounded border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700">Business / tenant</label>
            <select value={selectedCompanyId} onChange={(e) => loadCompanyControls(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select business...</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
            <FeatureToggleGrid functions={functions} values={companyFeatures} onChange={setCompanyFeatures} />
            <button onClick={saveCompanyControls} disabled={!selectedCompanyId} className="mt-4 rounded bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Save business controls</button>
          </div>
          <div className="rounded border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700">User</label>
            <select value={selectedUserId} onChange={(e) => loadUserControls(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select user...</option>
              {users.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} - {item.email}</option>)}
            </select>
            <FeatureToggleGrid functions={functions} values={userFeatures} onChange={setUserFeatures} />
            <button onClick={saveUserControls} disabled={!selectedUserId} className="mt-4 rounded bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Save user controls</button>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        {plans.map((plan) => {
          const draft = drafts[plan.id];
          if (!draft) return null;
          return (
            <div key={plan.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-950">{plan.name}</h2>
                  <p className="text-sm text-gray-500">{plan.name === 'Business' ? 'Company plan' : 'Individual plan'}</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!draft.isActive}
                    onChange={(e) => updateDraft(plan.id, { isActive: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Active
                </label>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    value={draft.description || ''}
                    onChange={(e) => updateDraft(plan.id, { description: e.target.value })}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monthly price</label>
                  <input
                    type="number"
                    value={draft.monthlyPrice}
                    onChange={(e) => updateDraft(plan.id, { monthlyPrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Annual price</label>
                  <input type="number" value={draft.annualPrice || 0} onChange={(e) => updateDraft(plan.id, { annualPrice: Number(e.target.value) })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Seat / month</label>
                  <input type="number" value={draft.seatMonthlyPrice || 0} onChange={(e) => updateDraft(plan.id, { seatMonthlyPrice: Number(e.target.value) })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Seat / year</label>
                  <input type="number" value={draft.seatAnnualPrice || 0} onChange={(e) => updateDraft(plan.id, { seatAnnualPrice: Number(e.target.value) })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trial days</label>
                  <input type="number" min={0} value={draft.trialDays || 0} onChange={(e) => updateDraft(plan.id, { trialDays: Number(e.target.value) })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max users</label>
                  <input
                    type="number"
                    value={draft.maxUsers}
                    onChange={(e) => updateDraft(plan.id, { maxUsers: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max tickets</label>
                  <input
                    type="number"
                    value={draft.maxTickets}
                    onChange={(e) => updateDraft(plan.id, { maxTickets: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-gray-700">Functionalities and restrictions</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {featureKeys.map((key) => (
                    <label key={key} className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!draft.features?.[key]}
                        onChange={() => toggleFeature(plan.id, key)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      {featureLabels[key] || key}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => savePlan(plan.id)}
                  disabled={savingId === plan.id}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingId === plan.id ? 'Saving...' : 'Save controls'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeatureToggleGrid({ functions, values, onChange }: { functions: FunctionControl[]; values: Record<string, boolean>; onChange: (next: Record<string, boolean>) => void }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {functions.map((item) => (
        <label key={item.key} className="flex items-center justify-between gap-3 rounded border border-gray-200 px-3 py-2 text-sm">
          <span>{item.label}</span>
          <select
            value={values[item.key] === false ? 'off' : values[item.key] === true ? 'on' : 'inherit'}
            onChange={(e) => {
              const next = { ...values };
              if (e.target.value === 'inherit') delete next[item.key];
              else next[item.key] = e.target.value === 'on';
              onChange(next);
            }}
            className="rounded border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="inherit">Inherit</option>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
      ))}
    </div>
  );
}
