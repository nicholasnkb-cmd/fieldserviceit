'use client';

import type React from 'react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, ClipboardList, ClipboardPen, Clock3, Download, Loader2, MapPin, Package, PenLine, RefreshCw, Route } from 'lucide-react';
import { api, getListData } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

type DispatchItem = {
  id: string;
  status: string;
  arrivedAt?: string;
  completedAt?: string;
  notes?: string;
  customerSignature?: string;
  photoUrls?: string;
  createdAt: string;
  ticket?: { id: string; ticketNumber: string; title: string; priority: string; status: string };
  technician?: { id: string; firstName: string; lastName: string };
};

const statusFlow = [
  { status: 'DISPATCHED', label: 'Assigned', icon: ClipboardPen },
  { status: 'EN_ROUTE', label: 'En route', icon: Route },
  { status: 'ON_SITE', label: 'On site', icon: MapPin },
  { status: 'COMPLETED', label: 'Complete', icon: CheckCircle2 },
];

export default function TechnicianMobilePage() {
  const [dispatches, setDispatches] = useState<DispatchItem[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [selectedId, setSelectedId] = useState('');
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState('');
  const [photoUrls, setPhotoUrls] = useState('');
  const [partUsage, setPartUsage] = useState({ partId: '', quantity: 1, notes: '' });
  const [offlinePacket, setOfflinePacket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dispatchRes, summaryRes, partsRes] = await Promise.all([
        api.get('/dispatch'),
        api.get('/dispatch/mobile/summary'),
        api.get('/inventory/parts?limit=100').catch(() => []),
      ]);
      const nextDispatches = getListData<DispatchItem>(dispatchRes);
      setDispatches(nextDispatches);
      setSummary(summaryRes || {});
      setParts(getListData(partsRes));
      if (!selectedId && nextDispatches[0]) setSelectedId(nextDispatches[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load mobile workflow');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selected = useMemo(() => dispatches.find((item) => item.id === selectedId), [dispatches, selectedId]);
  const photos = useMemo(() => parsePhotos(selected?.photoUrls), [selected?.photoUrls]);

  useEffect(() => {
    if (!selectedId) return;
    try {
      const cached = localStorage.getItem(`fsit.offlinePacket.${selectedId}`);
      setOfflinePacket(cached ? JSON.parse(cached) : null);
    } catch {
      setOfflinePacket(null);
    }
  }, [selectedId]);

  const updateStatus = async (status: string) => {
    if (!selected) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.patch(`/dispatch/${selected.id}`, { status });
      setMessage(`Status updated to ${status}`);
      await loadData();
    } catch (err: any) {
      setError(contextMessage(err.message || 'Failed to update status'));
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!selected || !notes.trim()) return;
    setSaving(true);
    try {
      await api.post(`/dispatch/${selected.id}/notes`, { notes: notes.trim() });
      setNotes('');
      setMessage('Job notes saved');
      await loadData();
    } catch (err: any) {
      setError(contextMessage(err.message || 'Failed to save notes'));
    } finally {
      setSaving(false);
    }
  };

  const savePhotos = async () => {
    if (!selected || !photoUrls.trim()) return;
    setSaving(true);
    try {
      await api.post(`/dispatch/${selected.id}/photos`, {
        photoUrls: photoUrls.split('\n').map((item) => item.trim()).filter(Boolean),
      });
      setPhotoUrls('');
      setMessage('Photo links saved');
      await loadData();
    } catch (err: any) {
      setError(contextMessage(err.message || 'Failed to save photos'));
    } finally {
      setSaving(false);
    }
  };

  const saveSignature = async () => {
    if (!selected || !signature.trim()) return;
    setSaving(true);
    try {
      await api.post(`/dispatch/${selected.id}/signature`, { signature: signature.trim() });
      setSignature('');
      setMessage('Signature captured and job completed');
      await loadData();
    } catch (err: any) {
      setError(contextMessage(err.message || 'Failed to save signature'));
    } finally {
      setSaving(false);
    }
  };

  const usePart = async () => {
    if (!selected?.ticket?.id || !partUsage.partId) return;
    setSaving(true);
    try {
      await api.post('/inventory/movements', {
        partId: partUsage.partId,
        movementType: 'USE',
        quantity: partUsage.quantity,
        ticketId: selected.ticket.id,
        notes: partUsage.notes || `Used on ${selected.ticket.ticketNumber}`,
      });
      setPartUsage({ partId: '', quantity: 1, notes: '' });
      setMessage('Part usage recorded');
      await loadData();
    } catch (err: any) {
      setError(contextMessage(err.message || 'Failed to record part usage'));
    } finally {
      setSaving(false);
    }
  };

  const cacheOfflinePacket = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const packet = await api.get(`/dispatch/${selected.id}/offline-packet`);
      localStorage.setItem(`fsit.offlinePacket.${selected.id}`, JSON.stringify(packet));
      setOfflinePacket(packet);
      setMessage('Offline job packet cached on this device');
    } catch (err: any) {
      setError(contextMessage(err.message || 'Failed to cache offline packet'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center p-6 text-sm text-gray-500"><Loader2 className="mr-2 animate-spin" size={18} /> Loading technician workflow...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
      <section className="border-b border-gray-200 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Field Operations</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-950 md:text-3xl">Technician Mobile Workflow</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">Update route status, capture job notes, record parts used, attach photo links, and collect completion sign-off from one compact workflow.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dispatch" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90">
              <Route size={16} />
              Field Service
            </Link>
            <button onClick={loadData} className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Active jobs" value={summary.activeCount || 0} icon={Clock3} />
        <Metric label="En route" value={summary.enRouteCount || 0} icon={Route} />
        <Metric label="On site" value={summary.onSiteCount || 0} icon={MapPin} />
        <Metric label="Done today" value={summary.completedToday || 0} icon={CheckCircle2} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-950">Assigned Jobs</h2>
            <p className="text-sm text-gray-500">Tap a dispatch to work the visit.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {dispatches.length === 0 ? <div className="p-4 text-sm text-gray-500">No assigned field work.</div> : dispatches.map((item) => (
              <button key={item.id} onClick={() => setSelectedId(item.id)} className={`block w-full p-4 text-left hover:bg-gray-50 ${selectedId === item.id ? 'bg-primary/5' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{item.ticket?.ticketNumber || 'Ticket'}</span>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{item.status}</span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-gray-950">{item.ticket?.title || 'Untitled job'}</p>
                    <p className="mt-1 text-xs text-gray-500">{[item.technician ? `${item.technician.firstName} ${item.technician.lastName}` : null, item.ticket?.priority, formatDate(item.createdAt)].filter(Boolean).join(' | ')}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {!selected ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">Select a job to begin.</div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">{selected.ticket?.ticketNumber}</p>
                    <h2 className="mt-1 text-xl font-bold text-gray-950">{selected.ticket?.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{selected.notes || 'No onsite notes yet.'}</p>
                  </div>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{selected.status}</span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {statusFlow.map(({ status, label, icon: Icon }) => (
                    <button key={status} disabled={saving || selected.status === status} onClick={() => updateStatus(status)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-300 px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <Panel title="Offline Packet" icon={Download}>
                  <p className="text-sm text-gray-600">
                    {offlinePacket ? `Cached ${formatDate(offlinePacket.generatedAt)} with ${offlinePacket.relatedArticles?.length || 0} related articles.` : 'No packet cached for this job yet.'}
                  </p>
                  <button onClick={cacheOfflinePacket} disabled={saving} className="mt-3 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Cache packet</button>
                  {offlinePacket?.checklist?.length > 0 && (
                    <div className="mt-3 rounded-md bg-gray-50 p-3">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500"><ClipboardList size={14} /> Checklist</div>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {offlinePacket.checklist.slice(0, 5).map((item: string) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                </Panel>

                <Panel title="Job Notes" icon={ClipboardPen}>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Work performed, diagnosis, next steps..." />
                  <button onClick={saveNotes} disabled={saving || !notes.trim()} className="mt-3 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save notes</button>
                </Panel>

                <Panel title="Parts Used" icon={Package}>
                  <select value={partUsage.partId} onChange={(e) => setPartUsage((current) => ({ ...current, partId: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                    <option value="">Select part</option>
                    {parts.map((part) => <option key={part.id} value={part.id}>{part.sku ? `${part.sku} - ` : ''}{part.name} ({Number(part.quantityOnHand || 0) - Number(part.quantityReserved || 0)} available)</option>)}
                  </select>
                  <input type="number" min="0.01" step="0.01" value={partUsage.quantity} onChange={(e) => setPartUsage((current) => ({ ...current, quantity: Number(e.target.value) }))} className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Quantity" />
                  <input value={partUsage.notes} onChange={(e) => setPartUsage((current) => ({ ...current, notes: e.target.value }))} className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Usage notes" />
                  <button onClick={usePart} disabled={saving || !partUsage.partId} className="mt-3 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Record part used</button>
                </Panel>

                <Panel title="Photos" icon={Camera}>
                  <textarea value={photoUrls} onChange={(e) => setPhotoUrls(e.target.value)} rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Paste one uploaded photo URL per line" />
                  <button onClick={savePhotos} disabled={saving || !photoUrls.trim()} className="mt-3 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Attach photos</button>
                  {photos.length > 0 && <p className="mt-2 text-xs text-gray-500">{photos.length} photo link{photos.length === 1 ? '' : 's'} attached</p>}
                </Panel>

                <Panel title="Customer Sign-Off" icon={PenLine}>
                  <input value={signature} onChange={(e) => setSignature(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Customer name or signature URL" />
                  <button onClick={saveSignature} disabled={saving || !signature.trim()} className="mt-3 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Capture and complete</button>
                  {selected.customerSignature && <p className="mt-2 truncate text-xs text-gray-500">Signed: {selected.customerSignature}</p>}
                </Panel>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between text-gray-500">
        <p className="text-sm font-medium">{label}</p>
        <Icon size={18} />
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-950">{value}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-950">
        <Icon size={17} />
        {title}
      </div>
      {children}
    </div>
  );
}

function parsePhotos(raw?: string) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function contextMessage(message: string) {
  if (message === 'No company context available') {
    return 'Select a company context before changing dispatch records.';
  }
  return message;
}
