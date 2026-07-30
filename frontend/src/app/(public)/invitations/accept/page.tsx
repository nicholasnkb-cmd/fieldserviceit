'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Invitation = {
  email: string;
  role: string;
  companyName: string;
  expiresAt: string;
  termsVersion: string;
  privacyVersion: string;
};

function AcceptInvitationContent() {
  const token = useSearchParams().get('token') || '';
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', termsAccepted: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('This invitation link is incomplete.');
      setLoading(false);
      return;
    }
    fetch(`/v1/auth/invitations/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || 'Invitation could not be loaded');
        setInvitation(body.data || body);
      })
      .catch((reason) => setError(reason.message || 'Invitation could not be loaded'))
      .finally(() => setLoading(false));
  }, [token]);

  const accept = async (event: FormEvent) => {
    event.preventDefault();
    if (!invitation) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/v1/auth/invitations/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          termsVersion: invitation.termsVersion,
          privacyVersion: invitation.privacyVersion,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join('. ') : body.message || 'Invitation could not be accepted');
      setAccepted(true);
    } catch (reason: any) {
      setError(reason.message || 'Invitation could not be accepted');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-lg p-8">Loading invitation...</main>;
  if (accepted) return (
    <main className="mx-auto my-12 max-w-lg rounded-lg border border-emerald-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-950">Welcome to {invitation?.companyName}</h1>
      <p className="mt-3 text-gray-600">Your account is ready. Sign in with {invitation?.email} and the password you just created.</p>
      <Link href="/login" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 font-semibold text-white">Sign in</Link>
    </main>
  );

  return (
    <main className="mx-auto my-12 max-w-lg rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-950">Accept company invitation</h1>
      {error && !invitation ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {invitation && (
        <>
          <p className="mt-3 text-gray-600">Join <strong>{invitation.companyName}</strong> as {invitation.role.toLowerCase().replace('_', ' ')} using <strong>{invitation.email}</strong>.</p>
          <form onSubmit={accept} className="mt-6 space-y-4">
            {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-gray-700">First name
                <input required maxLength={80} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-gray-700">Last name
                <input required maxLength={80} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
              </label>
            </div>
            <label className="block text-sm font-medium text-gray-700">Create password
              <input type="password" required minLength={15} maxLength={128} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" required checked={form.termsAccepted} onChange={(event) => setForm({ ...form, termsAccepted: event.target.checked })} className="mt-1" />
              <span>I accept the <Link href="/terms" className="text-primary underline">Terms of Service</Link> and acknowledge the <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.</span>
            </label>
            <button disabled={submitting} className="w-full rounded-md bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50">{submitting ? 'Creating account...' : 'Accept invitation'}</button>
          </form>
        </>
      )}
    </main>
  );
}

export default function AcceptInvitationPage() {
  return <Suspense fallback={<main className="mx-auto max-w-lg p-8">Loading invitation...</main>}><AcceptInvitationContent /></Suspense>;
}
