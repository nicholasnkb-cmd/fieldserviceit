'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Loader2, MessageSquare, RefreshCw, Search, Star, Upload } from 'lucide-react';
import { api, getListData } from '../../../lib/api';
import { formatDate, getStatusColor } from '../../../lib/utils';

type Ticket = {
  id: string;
  ticketNumber: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  resolution?: string;
  assignedTo?: { firstName: string; lastName: string };
  timeline?: any[];
  attachments?: any[];
};

export default function CustomerPortalPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [summary, setSummary] = useState<any>({});
  const [feedback, setFeedback] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [evidenceLinks, setEvidenceLinks] = useState('');
  const [signOff, setSignOff] = useState({ signOffName: '', rating: 5, comment: '', approved: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (query.trim()) params.set('search', query.trim());
      if (status) params.set('status', status);
      const [ticketRes, summaryRes, feedbackRes] = await Promise.all([
        api.get(`/tickets?${params.toString()}`),
        api.get('/customer-portal/summary'),
        api.get('/customer-portal/feedback'),
      ]);
      const nextTickets = getListData<Ticket>(ticketRes);
      setTickets(nextTickets);
      setSummary(summaryRes || {});
      setFeedback(getListData(feedbackRes));
      if (!selectedId && nextTickets[0]) setSelectedId(nextTickets[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer portal');
    } finally {
      setLoading(false);
    }
  }, [query, selectedId, status]);

  useEffect(() => {
    const handle = window.setTimeout(loadData, 250);
    return () => window.clearTimeout(handle);
  }, [loadData]);

  const selected = useMemo(() => tickets.find((ticket) => ticket.id === selectedId), [selectedId, tickets]);
  const selectedFeedback = useMemo(() => feedback.find((item) => item.ticketId === selectedId), [feedback, selectedId]);

  const sendMessage = async () => {
    if (!selected || !message.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/customer-portal/tickets/${selected.id}/message`, {
        message,
        evidenceLinks: evidenceLinks.split('\n').map((item) => item.trim()).filter(Boolean),
      });
      setMessage('');
      setEvidenceLinks('');
      setNotice('Message sent to the service team');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSaving(false);
    }
  };

  const saveFeedback = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/customer-portal/tickets/${selected.id}/feedback`, signOff);
      setNotice('Sign-off and rating saved');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save sign-off');
    } finally {
      setSaving(false);
    }
  };

  const metrics = [
    { label: 'Open requests', value: summary.openRequests || 0, icon: MessageSquare },
    { label: 'Pending sign-off', value: summary.pendingApprovals || 0, icon: ClipboardCheck },
    { label: 'Signed off', value: summary.signedOff || 0, icon: CheckCircle2 },
    { label: 'Avg rating', value: summary.averageRating ? Number(summary.averageRating).toFixed(1) : '0.0', icon: Star },
  ];

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center p-6 text-sm text-gray-500"><Loader2 className="mr-2 animate-spin" size={18} /> Loading customer portal...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <section className="border-b border-gray-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Customer Experience</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Customer Portal</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Review ticket history, send updates and evidence, sign off on completed work, and rate service quality.
            </p>
          </div>
          <button onClick={loadData} className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

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

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="space-y-3 border-b border-gray-200 p-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">Ticket Activity</h2>
              <p className="text-sm text-gray-500">Your visible requests and service history.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex flex-1 items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
                <Search size={16} className="text-gray-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full border-0 text-sm outline-none" placeholder="Search tickets" />
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">All</option>
                {['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {tickets.length === 0 ? <div className="p-4 text-sm text-gray-500">No customer-visible tickets found.</div> : tickets.map((ticket) => (
              <button key={ticket.id} onClick={() => setSelectedId(ticket.id)} className={`block w-full p-4 text-left hover:bg-gray-50 ${selectedId === ticket.id ? 'bg-primary/5' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{ticket.ticketNumber}</span>
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-gray-950">{ticket.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{[ticket.priority, ticket.assignedTo ? `Assigned to ${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : null, formatDate(ticket.createdAt)].filter(Boolean).join(' | ')}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {!selected ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">Select a ticket to view portal actions.</div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">{selected.ticketNumber}</p>
                    <h2 className="mt-1 text-xl font-bold text-gray-950">{selected.title}</h2>
                    <p className="mt-2 text-sm text-gray-600">{selected.description || 'No description provided.'}</p>
                  </div>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${getStatusColor(selected.status)}`}>{selected.status}</span>
                </div>
                {selected.resolution && (
                  <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <p className="font-semibold">Resolution</p>
                    <p className="mt-1">{selected.resolution}</p>
                  </div>
                )}
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-950">
                    <Upload size={17} />
                    Message and Evidence
                  </div>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Add a customer-visible update for the service team" />
                  <textarea value={evidenceLinks} onChange={(e) => setEvidenceLinks(e.target.value)} rows={3} className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Optional evidence links, one per line" />
                  <button onClick={sendMessage} disabled={saving || !message.trim()} className="mt-3 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Send update</button>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-950">
                    <ClipboardCheck size={17} />
                    Completion Sign-Off
                  </div>
                  {selectedFeedback && (
                    <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                      Signed by {selectedFeedback.signOffName || 'customer'} with {selectedFeedback.rating}/5 rating.
                    </div>
                  )}
                  <input value={signOff.signOffName} onChange={(e) => setSignOff((current) => ({ ...current, signOffName: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Your name" />
                  <select value={signOff.rating} onChange={(e) => setSignOff((current) => ({ ...current, rating: Number(e.target.value) }))} className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                    {[5, 4, 3, 2, 1].map((item) => <option key={item} value={item}>{item} star{item === 1 ? '' : 's'}</option>)}
                  </select>
                  <textarea value={signOff.comment} onChange={(e) => setSignOff((current) => ({ ...current, comment: e.target.value }))} rows={3} className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Optional feedback" />
                  <button onClick={saveFeedback} disabled={saving} className="mt-3 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve and rate</button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white">
                <div className="border-b border-gray-200 p-4">
                  <h2 className="text-lg font-semibold text-gray-950">Visible Activity</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {(selected.timeline || []).filter((entry) => entry.action !== 'COMMENT' || !entry.isInternal).slice(0, 10).map((entry) => (
                    <div key={entry.id} className="p-4">
                      <p className="text-sm font-semibold text-gray-950">{entry.action}</p>
                      {entry.comment && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{entry.comment}</p>}
                      <p className="mt-1 text-xs text-gray-500">{formatDate(entry.createdAt)}</p>
                    </div>
                  ))}
                  {(!selected.timeline || selected.timeline.length === 0) && <div className="p-4 text-sm text-gray-500">No visible activity yet.</div>}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
