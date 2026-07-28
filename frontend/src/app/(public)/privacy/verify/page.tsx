'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../../lib/api';

export default function VerifyPrivacyRequestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your request…');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      setMessage('The verification token is missing.');
      return;
    }
    api.post('/privacy-requests/verify', { token }, { skipAuth: true })
      .then(() => { setStatus('success'); setMessage('Your email was verified and the privacy request is ready for review.'); })
      .catch((error: any) => { setStatus('error'); setMessage(error?.message || 'The verification link is invalid or expired.'); });
  }, []);

  return (
    <main className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="text-3xl font-bold text-gray-950">Privacy request verification</h1>
      <p role="status" className={`mt-5 rounded-lg p-4 text-sm ${status === 'success' ? 'bg-green-50 text-green-800' : status === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>{message}</p>
      <Link href="/privacy" className="mt-6 inline-block font-semibold text-primary hover:underline">Return to the Privacy Policy</Link>
    </main>
  );
}
