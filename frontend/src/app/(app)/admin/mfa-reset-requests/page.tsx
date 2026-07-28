'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getListData } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';

type ResetRequest = {
  id: string;
  email: string;
  reason?: string;
  status: string;
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
};

export default function MfaResetRequestsPage() {
  const { user, authChecked } = useAuthStore();
  const router = useRouter();
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [stepUpCode, setStepUpCode] = useState('');
  const [stepUpUntil, setStepUpUntil] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.get('/auth/mfa-reset-requests/admin')
      .then((result) => setRequests(getListData(result)))
      .catch((error: any) => setMessage(error?.message || 'MFA recovery requests could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) return router.push('/login');
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(user.role)) return router.push('/dashboard');
    load();
  }, [authChecked, load, router, user]);

  async function verifyStepUp() {
    try {
      const result = await api.post('/auth/step-up', { code: stepUpCode });
      setStepUpUntil(result.expiresAt);
      setStepUpCode('');
      setMessage('Sensitive actions are unlocked for ten minutes.');
    } catch (error: any) {
      setMessage(error?.message || 'MFA verification failed.');
    }
  }

  async function review(request: ResetRequest, status: 'APPROVED' | 'DENIED') {
    const reviewNotes = window.prompt(status === 'APPROVED' ? 'Record how identity was verified' : 'Record the denial reason');
    if (!reviewNotes?.trim()) return;
    try {
      await api.patch(`/auth/mfa-reset-requests/admin/${request.id}`, { status, reviewNotes: reviewNotes.trim() });
      setMessage(`Request ${status.toLowerCase()}.`);
      load();
    } catch (error: any) {
      setMessage(error?.body?.message || error?.message || 'Review failed. Complete MFA step-up first.');
    }
  }

  if (loading) return <div className="p-8">Loading MFA recovery requests…</div>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-950">MFA Recovery Requests</h1>
      <p className="mt-1 text-sm text-gray-600">Approve resets only after completing documented identity verification. Approval revokes every active session.</p>
      <div className="mt-5 flex max-w-lg flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row">
        <label className="flex-1 text-sm font-semibold text-amber-950">Administrator MFA code<input value={stepUpCode} onChange={(event) => setStepUpCode(event.target.value)} autoComplete="one-time-code" className="mt-1 w-full rounded-md border border-amber-300 bg-white px-3 py-2" /></label>
        <button type="button" onClick={verifyStepUp} disabled={!stepUpCode} className="self-end rounded-md bg-amber-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Verify</button>
      </div>
      {stepUpUntil && <p className="mt-2 text-xs text-amber-800">Step-up active until {new Date(stepUpUntil).toLocaleTimeString()}.</p>}
      {message && <p role="status" className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}
      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50"><tr><th scope="col" className="px-4 py-3 text-left">Account</th><th scope="col" className="px-4 py-3 text-left">Request</th><th scope="col" className="px-4 py-3 text-left">Status</th><th scope="col" className="px-4 py-3 text-left">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((request) => <tr key={request.id}>
              <td className="px-4 py-3 font-semibold">{request.email}</td>
              <td className="max-w-lg whitespace-pre-wrap px-4 py-3">{request.reason || 'No reason supplied'}<br /><span className="text-xs text-gray-500">Submitted {new Date(request.createdAt).toLocaleString()}</span></td>
              <td className="px-4 py-3">{request.status}</td>
              <td className="px-4 py-3">{request.status === 'PENDING' ? <div className="flex gap-2"><button onClick={() => review(request, 'APPROVED')} className="rounded-md bg-green-700 px-3 py-1.5 font-semibold text-white">Approve</button><button onClick={() => review(request, 'DENIED')} className="rounded-md border border-red-300 px-3 py-1.5 font-semibold text-red-700">Deny</button></div> : <span className="text-xs text-gray-500">{request.reviewNotes}</span>}</td>
            </tr>)}
            {!requests.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No MFA recovery requests.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
