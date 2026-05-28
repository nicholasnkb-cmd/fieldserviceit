'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  maxUsers: number;
  maxTickets: number;
  features: Record<string, boolean>;
  sortOrder: number;
}

export default function BillingPage() {
  const { user, company } = useAuthStore();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const autoCheckoutStarted = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (!user.companyId) { router.push('/settings'); return; }
    Promise.all([
      api.get('/plans'),
      api.get('/billing/current-plan').catch(() => null),
    ]).then(([plansData, current]) => {
      setPlans((plansData.data || []).filter((plan: Plan) => plan.name === 'Business'));
      setCurrentPlan(current?.plan || null);
      setLoadingInvoices(true);
      api.get('/billing/invoices').then((inv: any) => setInvoices(inv || [])).catch(() => {}).finally(() => setLoadingInvoices(false));
    }).catch(() => setError('Failed to load plans')).finally(() => setLoading(false));
  }, [user, router]);

  const handleUpgrade = useCallback(async (planId: string) => {
    setCheckoutPlanId(planId);
    try {
      const data = await api.post('/billing/checkout', {
        planId,
        successUrl: `${window.location.origin}/billing?success=1`,
        cancelUrl: `${window.location.origin}/billing?canceled=1`,
      });
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout session');
      setCheckoutPlanId(null);
    }
  }, []);

  useEffect(() => {
    if (loading || autoCheckoutStarted.current || plans.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const requestedPlanName = params.get('plan');
    if (!requestedPlanName) return;

    const requestedPlan = plans.find((plan) => plan.name.toLowerCase() === requestedPlanName.toLowerCase());
    if (!requestedPlan || requestedPlan.monthlyPrice === 0 || currentPlan?.id === requestedPlan.id) return;

    autoCheckoutStarted.current = true;
    handleUpgrade(requestedPlan.id);
  }, [loading, plans, currentPlan, handleUpgrade]);

  const handlePortal = async () => {
    try {
      const data = await api.post('/billing/portal', {});
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading plans...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing & Plans</h1>
        <p className="text-gray-500 mt-1">Manage your subscription plan</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-6">{error}</div>}

      {currentPlan && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-blue-600 font-medium">Current Plan</span>
              <p className="text-lg font-semibold text-blue-900">{currentPlan.name}</p>
            </div>
            <button onClick={handlePortal} className="text-sm text-blue-600 hover:underline">
              Manage billing
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan?.id === plan.id;
          const isFree = plan.monthlyPrice === 0;
          return (
            <div
              key={plan.id}
              className={`border rounded-lg p-6 flex flex-col ${isCurrent ? 'border-primary ring-2 ring-primary' : 'border-gray-200'}`}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold">${plan.monthlyPrice}</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>

              {plan.maxUsers > 0 && <p className="text-sm text-gray-600">Up to {plan.maxUsers} users</p>}
              {plan.maxTickets > 0 && <p className="text-sm text-gray-600">Up to {plan.maxTickets} tickets/mo</p>}
              {plan.maxUsers < 0 && <p className="text-sm text-gray-600">Unlimited users</p>}
              {plan.maxTickets < 0 && <p className="text-sm text-gray-600">Unlimited tickets</p>}

              <div className="mt-4 space-y-2 flex-1">
                {Object.entries(plan.features).map(([key, enabled]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className={enabled ? 'text-green-500' : 'text-gray-300'}>
                      {enabled ? '✓' : '×'}
                    </span>
                    <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                {isCurrent ? (
                  <button disabled className="w-full py-2 px-4 bg-gray-100 text-gray-400 rounded text-sm font-medium cursor-not-allowed">
                    Current plan
                  </button>
                ) : isFree ? (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className="w-full py-2 px-4 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
                  >
                    {currentPlan ? 'Downgrade' : 'Get started'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={checkoutPlanId === plan.id}
                    className="w-full py-2 px-4 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
                  >
                    {checkoutPlanId === plan.id ? 'Opening checkout...' : currentPlan ? 'Upgrade' : 'Subscribe'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {invoices.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Invoice History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Invoice</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{inv.number}</td>
                    <td className="py-3 pr-4 text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">${(inv.amountPaid / 100).toFixed(2)} {inv.currency?.toUpperCase()}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${inv.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {inv.paid ? 'Paid' : inv.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
