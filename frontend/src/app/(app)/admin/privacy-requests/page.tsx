'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getListData } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';

type PrivacyRequest = {
  id: string;
  email: string;
  requestType: string;
  jurisdiction?: string;
  details?: string;
  status: string;
  identityVerifiedAt?: string;
  verifiedAt?: string;
  resolutionNotes?: string;
  legalHoldAt?: string;
  legalHoldReason?: string;
  deletionApprovedAt?: string;
  dueAt: string;
  createdAt: string;
};

const statuses = ['RECEIVED', 'VERIFYING', 'IN_REVIEW', 'COMPLETED', 'DENIED', 'CANCELED'];

export default function PrivacyRequestsAdminPage() {
  const { user, authChecked } = useAuthStore();
  const router = useRouter();
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [stepUpCode, setStepUpCode] = useState('');
  const [stepUpUntil, setStepUpUntil] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/privacy-requests/admin')
      .then((result) => setRequests(getListData<PrivacyRequest>(result)))
      .catch((error: any) => setMessage(error?.message || 'Privacy requests could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) return router.push('/login');
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(user.role)) return router.push('/dashboard');
    load();
  }, [authChecked, load, router, user]);

  async function update(request: PrivacyRequest, status: string) {
    const identityVerified = Boolean(request.identityVerifiedAt) || (status === 'COMPLETED' && window.confirm('Confirm that this requester’s identity has been verified.'));
    if (status === 'COMPLETED' && !identityVerified) return;
    const resolutionNotes = status === 'DENIED'
      ? window.prompt('Enter the reason for denial. This is stored in the audit record.', request.resolutionNotes || '')
      : request.resolutionNotes || '';
    if (status === 'DENIED' && !resolutionNotes) return;
    setMessage('');
    const deletionApproved = status === 'COMPLETED' && request.requestType === 'DELETION'
      ? window.confirm('Approve this deletion for the fulfillment queue? This cannot proceed while a legal hold is active.')
      : false;
    if (status === 'COMPLETED' && request.requestType === 'DELETION' && !deletionApproved) return;
    try {
      await api.patch(`/privacy-requests/admin/${request.id}`, { status, identityVerified, resolutionNotes, deletionApproved });
      setMessage('Privacy request updated.');
      load();
    } catch (error: any) {
      setMessage(error?.message || 'Privacy request could not be updated.');
    }
  }

  async function verifyStepUp() {
    try {
      const result = await api.post('/auth/step-up', { code: stepUpCode });
      setStepUpUntil(result.expiresAt);
      setStepUpCode('');
      setMessage('Sensitive privacy actions are unlocked for ten minutes.');
    } catch (error: any) {
      setMessage(error?.message || 'MFA verification failed.');
    }
  }

  async function toggleLegalHold(request: PrivacyRequest) {
    const legalHold = !request.legalHoldAt;
    const legalHoldReason = legalHold ? window.prompt('Enter the legal hold reason') : 'Legal hold released';
    if (legalHold && !legalHoldReason?.trim()) return;
    try {
      await api.patch(`/privacy-requests/admin/${request.id}`, {
        status: request.status,
        legalHold,
        legalHoldReason: legalHoldReason?.trim(),
      });
      setMessage(legalHold ? 'Legal hold applied.' : 'Legal hold released.');
      load();
    } catch (error: any) {
      setMessage(error?.message || 'Legal hold could not be updated.');
    }
  }

  async function downloadEvidence(request: PrivacyRequest) {
    try {
      const evidence = await api.get(`/privacy-requests/admin/${request.id}/evidence`);
      const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `privacy-evidence-${request.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      setMessage(error?.message || 'Evidence could not be exported.');
    }
  }

  if (loading) return <div className="p-8">Loading privacy requests…</div>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-950">Privacy Requests</h1>
      <p className="mt-1 text-sm text-gray-600">Track verified access, correction, deletion, export, opt-out, and appeal requests.</p>
      <div className="mt-5 flex max-w-lg flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row">
        <label className="flex-1 text-sm font-semibold text-amber-950">Administrator MFA code<input value={stepUpCode} onChange={(event) => setStepUpCode(event.target.value)} autoComplete="one-time-code" className="mt-1 w-full rounded-md border border-amber-300 bg-white px-3 py-2" /></label>
        <button type="button" onClick={verifyStepUp} disabled={!stepUpCode} className="self-end rounded-md bg-amber-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Verify</button>
      </div>
      {stepUpUntil && <p className="mt-2 text-xs text-amber-800">Step-up active until {new Date(stepUpUntil).toLocaleTimeString()}.</p>}
      {message && <p role="status" className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}
      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50"><tr>
            <th scope="col" className="px-4 py-3 text-left">Requester</th>
            <th scope="col" className="px-4 py-3 text-left">Type</th>
            <th scope="col" className="px-4 py-3 text-left">Received / due</th>
            <th scope="col" className="px-4 py-3 text-left">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-3"><strong>{request.email}</strong><br /><span className="text-gray-500">{request.jurisdiction || 'Jurisdiction not supplied'}</span></td>
                <td className="px-4 py-3">{request.requestType.replaceAll('_', ' ')}{request.details && <details className="mt-1"><summary className="cursor-pointer text-primary">Details</summary><p className="max-w-md whitespace-pre-wrap py-2">{request.details}</p></details>}{request.legalHoldAt && <span className="mt-1 block text-xs font-semibold text-red-700">Legal hold: {request.legalHoldReason}</span>}</td>
                <td className="px-4 py-3">{new Date(request.createdAt).toLocaleDateString()}<br /><span className={new Date(request.dueAt) < new Date() ? 'font-semibold text-red-700' : 'text-gray-500'}>Due {new Date(request.dueAt).toLocaleDateString()}</span></td>
                <td className="px-4 py-3"><label className="sr-only" htmlFor={`status-${request.id}`}>Status for {request.email}</label><select id={`status-${request.id}`} value={request.status} onChange={(event) => update(request, event.target.value)} className="rounded-md border border-gray-300 px-2 py-1">{statuses.map((status) => <option key={status}>{status}</option>)}</select>{request.identityVerifiedAt && <span className="mt-1 block text-xs text-green-700">Identity verified</span>}<div className="mt-2 flex flex-col gap-1"><button type="button" onClick={() => toggleLegalHold(request)} className="text-left text-xs font-semibold text-primary hover:underline">{request.legalHoldAt ? 'Release legal hold' : 'Apply legal hold'}</button><button type="button" onClick={() => downloadEvidence(request)} className="text-left text-xs font-semibold text-primary hover:underline">Export evidence</button></div></td>
              </tr>
            ))}
            {!requests.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No privacy requests.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
