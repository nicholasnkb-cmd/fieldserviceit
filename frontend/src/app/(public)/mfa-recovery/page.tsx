'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function MfaRecoveryPage() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api.post('/auth/mfa-reset-requests', { email, reason }, { skipAuth: true });
      setMessage(result.message || 'Your request was received.');
      setEmail('');
      setReason('');
    } catch (requestError: any) {
      setError(requestError?.message || 'The request could not be submitted.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-950">Request MFA recovery</h1>
      <p className="mt-3 text-sm text-gray-600">An administrator must verify your identity and approve the reset. Existing sessions are revoked when a reset is approved.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div><label htmlFor="recovery-email" className="block text-sm font-semibold text-gray-900">Account email</label><input id="recovery-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></div>
        <div><label htmlFor="recovery-reason" className="block text-sm font-semibold text-gray-900">What happened? <span className="font-normal text-gray-500">(optional)</span></label><textarea id="recovery-reason" maxLength={1000} rows={4} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></div>
        {message && <p role="status" className="text-sm text-green-700">{message}</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Submit recovery request'}</button>
      </form>
      <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">Return to sign in</Link>
    </main>
  );
}
