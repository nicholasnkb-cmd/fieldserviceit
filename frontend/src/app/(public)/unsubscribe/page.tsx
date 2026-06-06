'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';

function UnsubscribeResult() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('This email preference link is incomplete.');
      return;
    }
    api.post(`/notifications/unsubscribe/${encodeURIComponent(token)}`, {}, { skipAuth: true })
      .then((result) => {
        setState('success');
        setMessage(`Optional notifications for ${result.email || 'this address'} have been stopped.`);
      })
      .catch((err) => {
        setState('error');
        setMessage(err.message || 'This email preference link could not be processed.');
      });
  }, [token]);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase text-primary">Email Preferences</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-950">
          {state === 'loading' ? 'Updating your preferences' : state === 'success' ? 'Preferences updated' : 'Link unavailable'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {state === 'loading' ? 'Please wait while we process this request.' : message}
        </p>
        {state === 'success' && (
          <p className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            Critical ticket status, resolution, SLA, and security messages will continue so important service updates are not missed.
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Link href="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">Sign In</Link>
          <Link href="/contact" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Contact Support</Link>
        </div>
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading email preferences...</div>}>
      <UnsubscribeResult />
    </Suspense>
  );
}
