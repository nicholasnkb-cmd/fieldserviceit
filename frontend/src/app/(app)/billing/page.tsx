'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleDollarSign,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { api, getListData } from '../../../lib/api';
import { PRIVACY_VERSION, TERMS_VERSION } from '../../../lib/legal';
import { useAuthStore } from '../../../stores/authStore';

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
  features: Record<string, boolean>;
  sortOrder: number;
}

interface Subscription {
  id: string;
  status: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  billingInterval?: 'MONTH' | 'YEAR';
  seatQuantity?: number;
  gracePeriodEndsAt?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialEndsAt?: string | null;
  plan?: Plan | null;
}

interface Invoice {
  id: string;
  number?: string | null;
  amountPaid: number;
  currency: string;
  status: string;
  paid: boolean;
  pdfUrl?: string | null;
  hostedUrl?: string | null;
  createdAt: string;
}

interface Provider {
  key: string;
  name: string;
  configured: boolean;
  priceCount: number;
  isDefault: boolean;
}

const featureLabels: Record<string, string> = {
  apiAccess: 'API access',
  assets: 'Asset management',
  auditLogs: 'Audit logs',
  branding: 'Custom branding',
  contracts: 'Contracts',
  csvExport: 'CSV exports',
  dispatch: 'Technician dispatch',
  emailNotifications: 'Email notifications',
  kb: 'Knowledge base',
  publicSubmit: 'Public ticket intake',
  reporting: 'Reporting',
  rmmIntegration: 'RMM integrations',
  slaManagement: 'SLA management',
  tickets: 'Ticket operations',
  timeTracking: 'Time tracking',
  workflows: 'Workflow automation',
};

export default function BillingPage() {
  const { user, company } = useAuthStore();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [interval, setInterval] = useState<'MONTH' | 'YEAR'>('MONTH');
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const autoCheckoutStarted = useRef(false);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [plansData, current, providerData] = await Promise.all([
        api.get('/plans'),
        api.get('/billing/current-plan').catch(() => null),
        api.get('/billing/providers').catch(() => []),
      ]);
      setPlans(getListData<Plan>(plansData).filter((plan) => plan.name === 'Business'));
      setSubscription(current || null);
      const availableProviders = getListData<Provider>(providerData).filter((item) => item.configured);
      setProviders(availableProviders);
      setInterval(current?.billingInterval === 'YEAR' ? 'YEAR' : 'MONTH');
      setSeats(Math.max(1, Number(current?.seatQuantity || 1)));

      setLoadingInvoices(true);
      try {
        setInvoices((await api.get('/billing/invoices')) || []);
      } catch {
        setInvoices([]);
      } finally {
        setLoadingInvoices(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!user.companyId) {
      router.push('/settings');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') setNotice('PayPal checkout completed. Subscription activation may take a moment while PayPal sends confirmation.');
    if (params.get('canceled') === '1') setNotice('PayPal checkout was canceled. Your subscription was not changed.');
    loadBilling();
  }, [loadBilling, router, user]);

  const handleCheckout = useCallback(async (planId: string) => {
    setCheckoutPlanId(planId);
    setError('');
    try {
      const data = await api.post('/billing/checkout', {
        planId,
        interval,
        seats,
        useTrial: true,
        termsAccepted,
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
        successUrl: `${window.location.origin}/billing?success=1&provider=paypal`,
        cancelUrl: `${window.location.origin}/billing?canceled=1&provider=paypal`,
      });
      if (!data.url) throw new Error('Checkout session did not return a redirect URL');
      window.location.assign(data.url);
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout session');
      setCheckoutPlanId(null);
    }
  }, [interval, seats, termsAccepted]);

  useEffect(() => {
    if (loading || !termsAccepted || autoCheckoutStarted.current || plans.length === 0) return;
    const requestedPlanName = new URLSearchParams(window.location.search).get('plan');
    if (!requestedPlanName) return;

    const requestedPlan = plans.find((plan) => plan.name.toLowerCase() === requestedPlanName.toLowerCase());
    if (!requestedPlan || subscription?.plan?.id === requestedPlan.id) return;

    autoCheckoutStarted.current = true;
    handleCheckout(requestedPlan.id);
  }, [handleCheckout, loading, plans, subscription?.plan?.id, termsAccepted]);

  const handlePortal = async () => {
    setOpeningPortal(true);
    setError('');
    try {
      const data = await api.post('/billing/portal', {});
      if (!data.url) throw new Error('Billing portal did not return a redirect URL');
      window.location.assign(data.url);
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal');
      setOpeningPortal(false);
    }
  };

  const currentPlan = subscription?.plan || null;
  const selectedPlan = plans[0] || null;
  const selectedBasePrice = Number(interval === 'YEAR' ? selectedPlan?.annualPrice : selectedPlan?.monthlyPrice) || 0;
  const selectedSeatPrice = Number(interval === 'YEAR' ? selectedPlan?.seatAnnualPrice : selectedPlan?.seatMonthlyPrice) || 0;
  const selectedTotal = selectedBasePrice + Math.max(0, seats - 1) * selectedSeatPrice;
  const enabledFeatures = useMemo(
    () => Object.entries(currentPlan?.features || {}).filter(([, enabled]) => enabled),
    [currentPlan],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading billing...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">Account</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-950">Billing and subscription</h1>
          <p className="mt-1 text-sm text-gray-600">Manage the plan, payment method, and invoices for {company?.name || 'your company'}.</p>
        </div>
        {(subscription?.providerCustomerId || subscription?.providerSubscriptionId) && (
          <button
            type="button"
            onClick={handlePortal}
            disabled={openingPortal}
            className="inline-flex items-center justify-center gap-2 rounded bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {openingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Manage payment
          </button>
        )}
      </div>

      {notice && <div className="mt-6 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
      {error && <div className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {providers.length === 0 && (
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          PayPal checkout is not fully configured yet. Add PayPal credentials, webhook ID, and plan mappings in System Controls.
        </div>
      )}
      {subscription?.status === 'INCOMPLETE' && (
        <div className="mt-6 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          PayPal checkout has started. Finish approval in PayPal, then return here; subscription status will update after the verified webhook arrives.
        </div>
      )}

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="border-l-2 border-emerald-500 pl-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Current plan</p>
          <p className="mt-2 text-xl font-semibold text-gray-950">{currentPlan?.name || 'No active plan'}</p>
          <p className="mt-1 text-sm text-gray-600">{formatStatus(subscription?.status)}</p>
        </div>
        <div className="border-l-2 border-gray-300 pl-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Subscription price</p>
          <p className="mt-2 text-xl font-semibold text-gray-950">
            {currentPlan ? formatMoney((subscription?.billingInterval === 'YEAR' ? currentPlan.annualPrice : currentPlan.monthlyPrice) * 100, 'usd') : 'Not subscribed'}
          </p>
          <p className="mt-1 text-sm text-gray-600">{currentPlan ? `${subscription?.billingInterval === 'YEAR' ? 'Annual' : 'Monthly'} recurring subscription` : 'Choose the Business plan to start checkout'}</p>
        </div>
        <div className="border-l-2 border-gray-300 pl-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Next renewal</p>
          <p className="mt-2 text-xl font-semibold text-gray-950">{formatDate(subscription?.currentPeriodEnd)}</p>
          <p className="mt-1 text-sm text-gray-600">Managed through PayPal</p>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">Company plan</h2>
            <p className="mt-1 text-sm text-gray-600">One workspace for service operations, field work, and customer support.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-y border-gray-200 bg-white px-4 py-5 md:grid-cols-3">
          <div>
            <label className="text-sm font-semibold text-gray-800">Billing cycle</label>
            <div className="mt-2 grid grid-cols-2 border border-gray-300">
              {(['MONTH', 'YEAR'] as const).map((value) => (
                <button key={value} type="button" onClick={() => setInterval(value)} className={`px-3 py-2 text-sm font-medium ${interval === value ? 'bg-gray-950 text-white' : 'bg-white text-gray-700'}`}>
                  {value === 'MONTH' ? 'Monthly' : 'Annual'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="billing-seats" className="text-sm font-semibold text-gray-800">Team seats</label>
            <input id="billing-seats" type="number" min={1} max={10000} value={seats} onChange={(event) => setSeats(Math.max(1, Number(event.target.value || 1)))} className="mt-2 w-full border border-gray-300 px-3 py-2 text-sm" />
            <p className="mt-1 text-xs text-gray-500">First seat included; additional seats use the plan add-on.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Payment provider</p>
            <div className="mt-2 border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900">PayPal</div>
            <p className="mt-1 text-xs text-gray-500">Checkout and subscription management are handled securely by PayPal.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.72fr_1fr]">
          {plans.map((plan) => {
            const isCurrent = currentPlan?.id === plan.id;
            return (
              <div key={plan.id} className={`rounded border p-6 ${isCurrent ? 'border-emerald-400 bg-emerald-50/30' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-950">{plan.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{plan.description}</p>
                  </div>
                  {isCurrent && <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">Current</span>}
                </div>
                <div className="mt-6">
                  <span className="text-4xl font-semibold text-gray-950">${selectedTotal.toFixed(0)}</span>
                  <span className="text-sm text-gray-500">/{interval === 'YEAR' ? 'year' : 'month'}</span>
                  {plan.trialDays > 0 && <p className="mt-2 text-sm font-medium text-emerald-700">{plan.trialDays}-day trial for eligible new subscriptions</p>}
                </div>
                <div className="mt-5 grid gap-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-emerald-700" />Unlimited users</div>
                  <div className="flex items-center gap-2"><ReceiptText className="h-4 w-4 text-emerald-700" />Unlimited tickets</div>
                  <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-700" />Tenant and audit controls</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isCurrent || checkoutPlanId === plan.id || providers.length === 0 || !termsAccepted}
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                >
                  {checkoutPlanId === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleDollarSign className="h-4 w-4" />}
                  {isCurrent ? (subscription?.status === 'INCOMPLETE' ? 'Checkout pending' : 'Current plan') : providers.length === 0 ? 'PayPal checkout not configured' : 'Continue with PayPal'}
                </button>
              </div>
            );
          })}

          <div className="rounded border border-gray-200 bg-white p-6">
            <h3 className="text-base font-semibold text-gray-950">Included capabilities</h3>
            <p className="mt-1 text-sm text-gray-600">
              {currentPlan ? `Features enabled for ${currentPlan.name}.` : 'Capabilities included with the Business plan.'}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(enabledFeatures.length > 0
                ? enabledFeatures
                : Object.entries(plans[0]?.features || {}).filter(([, enabled]) => enabled)
              ).map(([key]) => (
                <div key={key} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  {featureLabels[key] || humanize(key)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
          <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
          <span>I agree to the <a href="/terms" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">Terms of Service</a>, including recurring billing, and acknowledge the <a href="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">Privacy Policy</a>. The subscription renews at the selected interval until canceled; taxes may apply.</span>
        </label>
      </section>

      <section className="mt-12 border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">Invoice history</h2>
            <p className="mt-1 text-sm text-gray-600">The latest transactions reported by PayPal.</p>
          </div>
          <FileText className="h-5 w-5 text-gray-400" />
        </div>

        {loadingInvoices ? (
          <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="mt-5 border-y border-gray-200 py-8 text-center">
            <ReceiptText className="mx-auto h-6 w-6 text-gray-400" />
            <p className="mt-3 text-sm font-medium text-gray-900">No invoices yet</p>
            <p className="mt-1 text-sm text-gray-500">Completed PayPal transactions will appear here.</p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                  <th className="pb-3 pr-4 font-semibold">Invoice</th>
                  <th className="pb-3 pr-4 font-semibold">Issued</th>
                  <th className="pb-3 pr-4 font-semibold">Amount</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Documents</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100">
                    <td className="py-4 pr-4 font-medium text-gray-950">{invoice.number || invoice.id}</td>
                    <td className="py-4 pr-4 text-gray-600">{formatDate(invoice.createdAt)}</td>
                    <td className="py-4 pr-4 text-gray-700">{formatMoney(invoice.amountPaid, invoice.currency)}</td>
                    <td className="py-4 pr-4">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${invoice.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {invoice.paid ? 'Paid' : formatStatus(invoice.status)}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="inline-flex items-center gap-3">
                        {invoice.hostedUrl && <a href={invoice.hostedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800">View <ExternalLink className="h-3.5 w-3.5" /></a>}
                        {invoice.pdfUrl && <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-950">PDF <ArrowUpRight className="h-3.5 w-3.5" /></a>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-4 border-t border-gray-200 pt-8 sm:grid-cols-3">
        <div className="flex items-start gap-3"><CreditCard className="mt-0.5 h-5 w-5 text-emerald-700" /><div><h2 className="text-sm font-semibold">Secure checkout</h2><p className="mt-1 text-sm leading-6 text-gray-600">Payment details are entered and stored by PayPal.</p></div></div>
        <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-5 w-5 text-emerald-700" /><div><h2 className="text-sm font-semibold">Subscription control</h2><p className="mt-1 text-sm leading-6 text-gray-600">Update payment methods and cancellation settings in the billing portal.</p></div></div>
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" /><div><h2 className="text-sm font-semibold">Webhook synchronized</h2><p className="mt-1 text-sm leading-6 text-gray-600">Plan status follows verified payment and subscription events.</p></div></div>
      </section>
    </div>
  );
}

function formatMoney(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(Number(amount || 0) / 100);
}

function formatDate(value?: string | null) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatStatus(value?: string | null) {
  if (!value) return 'Not active';
  return humanize(value.toLowerCase());
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());
}
