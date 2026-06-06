'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api, getListData, getResponseMeta } from '../../../../lib/api';
import { formatDate } from '../../../../lib/utils';
import { useAuthStore } from '../../../../stores/authStore';
import { useToast } from '../../../../components/ui/Toast';

const statuses = ['', 'QUEUED', 'DIGEST_PENDING', 'SENDING', 'SENT', 'FAILED', 'BOUNCED', 'SUPPRESSED'];

function statusClass(status: string) {
  const classes: Record<string, string> = {
    SENT: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    QUEUED: 'border-blue-200 bg-blue-50 text-blue-700',
    DIGEST_PENDING: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    SENDING: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    FAILED: 'border-red-200 bg-red-50 text-red-700',
    BOUNCED: 'border-orange-200 bg-orange-50 text-orange-700',
    SUPPRESSED: 'border-gray-200 bg-gray-50 text-gray-600',
  };
  return classes[status] || classes.SUPPRESSED;
}

export default function EmailOperationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState('');
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: '100' });
    if (status) params.set('status', status);
    if (search.trim()) params.set('search', search.trim());
    try {
      const [summaryData, deliveryData] = await Promise.all([
        api.get('/notifications/email/summary'),
        api.get(`/notifications/email/deliveries?${params.toString()}`),
      ]);
      setSummary(summaryData);
      setDeliveries(getListData(deliveryData));
      setTotal(Number(getResponseMeta(deliveryData)?.total || deliveryData?.meta?.total || 0));
    } catch (err: any) {
      toast('error', err.message || 'Failed to load email operations');
    } finally {
      setLoading(false);
    }
  }, [search, status, toast]);

  useEffect(() => {
    if (!user) return;
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, [load, router, user]);

  const retry = async (id: string) => {
    setRetryingId(id);
    try {
      await api.post(`/notifications/email/deliveries/${id}/retry`, {});
      toast('success', 'Email queued for retry');
      await load();
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setRetryingId('');
    }
  };

  if (loading) return <div className="p-8">Loading email operations...</div>;

  const counts = summary?.counts || {};
  const smtpHealthy = !!summary?.smtp?.configured;
  const cards = [
    ['Queued', Number(counts.QUEUED || 0) + Number(counts.SENDING || 0), 'text-blue-700'],
    ['Digest', Number(counts.DIGEST_PENDING || 0), 'text-indigo-700'],
    ['Sent', Number(counts.SENT || 0), 'text-emerald-700'],
    ['Failed', Number(counts.FAILED || 0), 'text-red-700'],
    ['Bounced', Number(counts.BOUNCED || 0), 'text-orange-700'],
    ['Suppressed', Number(counts.SUPPRESSED || 0), 'text-gray-700'],
  ];

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Email Operations</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor queued ticket mail, retries, bounces, digests, and SMTP readiness.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <div className={`rounded-lg border p-4 ${smtpHealthy ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center gap-2">
            <Mail size={17} className={smtpHealthy ? 'text-emerald-700' : 'text-red-700'} />
            <span className="text-xs font-semibold uppercase text-gray-600">SMTP</span>
          </div>
          <div className={`mt-2 text-lg font-bold ${smtpHealthy ? 'text-emerald-700' : 'text-red-700'}`}>{smtpHealthy ? 'Ready' : 'Not configured'}</div>
          <div className="mt-1 truncate text-xs text-gray-500" title={summary?.smtp?.host || ''}>{summary?.smtp?.host || 'No host'}</div>
          <div className="mt-2 text-[11px] text-gray-500">
            Inbound {summary?.webhooks?.inboundEmailConfigured ? 'on' : 'off'} · Bounce {summary?.webhooks?.bounceWebhookConfigured ? 'on' : 'off'}
          </div>
        </div>
        {cards.map(([label, count, color]) => (
          <div key={String(label)} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase text-gray-500">{label}</div>
            <div className={`mt-2 text-2xl font-bold ${color}`}>{count}</div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-900">Delivery Log</h2>
            <p className="text-xs text-gray-500">{total} matching deliveries. Auto-refreshes every 30 seconds.</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recipient, subject, or event"
            className="h-10 min-w-0 rounded-md border border-gray-300 px-3 text-sm md:w-72"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-gray-300 px-3 text-sm">
            {statuses.map((value) => <option key={value || 'all'} value={value}>{value ? value.replaceAll('_', ' ') : 'All statuses'}</option>)}
          </select>
        </div>

        {deliveries.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No email deliveries match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{delivery.recipientName || 'Recipient'}</div>
                      <div className="text-xs text-gray-500">{delivery.recipientEmail}</div>
                    </td>
                    <td className="max-w-sm px-4 py-3">
                      <div className="truncate font-medium text-gray-800" title={delivery.subject}>{delivery.subject}</div>
                      <div className="mt-1 text-xs text-gray-500">{delivery.eventType?.replaceAll('_', ' ')}</div>
                      {delivery.errorMessage && <div className="mt-1 line-clamp-2 text-xs text-red-600" title={delivery.errorMessage}>{delivery.errorMessage}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${statusClass(delivery.status)}`}>
                        {delivery.status?.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{delivery.attempts} / {delivery.maxAttempts}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{formatDate(delivery.sentAt || delivery.updatedAt || delivery.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {delivery.status === 'FAILED' && (
                        <button type="button" onClick={() => retry(delivery.id)} disabled={retryingId === delivery.id}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                          {retryingId === delivery.id ? 'Queueing...' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
