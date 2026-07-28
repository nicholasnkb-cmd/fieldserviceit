'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../../../lib/api';

export default function PrivacyExportPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('This one-time export link expires after 24 hours and becomes invalid after download.');

  async function download() {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return setMessage('The export token is missing.');
    setBusy(true);
    try {
      const content = await api.post('/privacy-requests/export', { token }, { skipAuth: true });
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fieldserviceit-privacy-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage('Your export was downloaded. This link can no longer be used.');
    } catch (error: any) {
      setMessage(error?.message || 'The export link is invalid, expired, or already used.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="text-3xl font-bold text-gray-950">Secure privacy export</h1>
      <p role="status" className="mt-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">{message}</p>
      <button type="button" onClick={download} disabled={busy} className="mt-6 rounded-md bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Preparing…' : 'Download export'}</button>
      <div><Link href="/privacy" className="mt-6 inline-block font-semibold text-primary hover:underline">Privacy Policy</Link></div>
    </main>
  );
}
