'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  maxUsers: number;
  maxTickets: number;
  stripePriceId?: string;
  isActive: boolean;
  features: Record<string, boolean>;
}

const featureLabels: Record<string, string> = {
  tickets: 'Tickets',
  dispatch: 'Dispatch',
  assets: 'Asset and device management',
  emailNotifications: 'Email notifications',
  publicSubmit: 'Public request intake',
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
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
    api.get('/admin/plans')
      .then((data) => {
        const rows = data || [];
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
        maxUsers: Number(draft.maxUsers),
        maxTickets: Number(draft.maxTickets),
        stripePriceId: draft.stripePriceId || '',
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
                  <label className="block text-sm font-medium text-gray-700">Stripe price ID</label>
                  <input
                    value={draft.stripePriceId || ''}
                    onChange={(e) => updateDraft(plan.id, { stripePriceId: e.target.value })}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
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
