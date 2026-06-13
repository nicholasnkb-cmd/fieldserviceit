'use client';

import { useCallback, useEffect, useState } from 'react';
import { Clock3, KeyRound, Link2, ShieldCheck } from 'lucide-react';
import { api } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [form, setForm] = useState({
    requestType: 'PERMISSION',
    permissionSlug: '',
    roleId: '',
    resourceType: 'TICKET',
    resourceId: '',
    relationshipName: 'viewer',
    requestedMinutes: 60,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => api.get('/access-requests/mine').then(setRequests).catch((error) => toast('error', error.message)), [toast]);
  useEffect(() => { load(); }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/access-requests', form);
      setForm((current) => ({ ...current, permissionSlug: '', roleId: '', resourceId: '', reason: '' }));
      toast('success', 'Access request submitted');
      await load();
    } catch (error: any) {
      toast('error', error.message || 'Unable to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const TypeIcon = form.requestType === 'PERMISSION' ? KeyRound : form.requestType === 'ROLE' ? ShieldCheck : Link2;

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-950">Access Requests</h1>
        <p className="mt-1 text-sm text-gray-600">Request temporary permissions, a role, or access to a specific resource.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <form onSubmit={submit} className="space-y-4 border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2"><TypeIcon className="h-5 w-5" /><h2 className="font-semibold">New request</h2></div>
          <div className="grid grid-cols-3 gap-2">
            {['PERMISSION', 'ROLE', 'RELATIONSHIP'].map((type) => (
              <button key={type} type="button" onClick={() => setForm({ ...form, requestType: type })}
                className={`h-10 border px-2 text-xs font-semibold ${form.requestType === type ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-300 bg-white text-gray-700'}`}>
                {type}
              </button>
            ))}
          </div>
          {form.requestType === 'PERMISSION' && (
            <>
              <input required value={form.permissionSlug} onChange={(event) => setForm({ ...form, permissionSlug: event.target.value })} placeholder="Permission slug, e.g. invoices.approve" className="h-10 w-full border border-gray-300 px-3 text-sm" />
              <label className="block text-sm text-gray-700">Duration: {form.requestedMinutes} minutes
                <input type="range" min="15" max="480" step="15" value={form.requestedMinutes} onChange={(event) => setForm({ ...form, requestedMinutes: Number(event.target.value) })} className="mt-2 w-full" />
              </label>
            </>
          )}
          {form.requestType === 'ROLE' && <input required value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })} placeholder="Role ID" className="h-10 w-full border border-gray-300 px-3 text-sm" />}
          {form.requestType === 'RELATIONSHIP' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input required value={form.resourceType} onChange={(event) => setForm({ ...form, resourceType: event.target.value })} placeholder="Resource type" className="h-10 border border-gray-300 px-3 text-sm" />
              <input required value={form.resourceId} onChange={(event) => setForm({ ...form, resourceId: event.target.value })} placeholder="Resource ID" className="h-10 border border-gray-300 px-3 text-sm" />
              <select value={form.relationshipName} onChange={(event) => setForm({ ...form, relationshipName: event.target.value })} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                <option value="viewer">Viewer</option><option value="editor">Editor</option><option value="approver">Approver</option><option value="owner">Owner</option>
              </select>
            </div>
          )}
          <textarea required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Business reason" rows={4} className="w-full border border-gray-300 p-3 text-sm" />
          <button disabled={submitting} className="h-10 bg-gray-950 px-4 text-sm font-semibold text-white disabled:bg-gray-400">{submitting ? 'Submitting...' : 'Submit request'}</button>
        </form>

        <section className="border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2"><Clock3 className="h-5 w-5" /><h2 className="font-semibold">Request history</h2></div>
          <div className="mt-4 space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="border border-gray-200 p-3 text-sm">
                <div className="flex justify-between gap-3"><strong>{request.requestType}</strong><span className={request.status === 'APPROVED' ? 'text-emerald-700' : request.status === 'REJECTED' ? 'text-red-700' : 'text-amber-700'}>{request.status}</span></div>
                <p className="mt-1 text-gray-600">{request.permissionSlug || request.roleId || `${request.relationshipResourceType}:${request.relationshipResourceId}`}</p>
                <p className="mt-2 text-xs text-gray-500">{new Date(request.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!requests.length && <p className="text-sm text-gray-500">No access requests yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
