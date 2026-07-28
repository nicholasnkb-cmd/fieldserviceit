'use client';

import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';

const requestTypes = [
  ['ACCESS', 'Access my information'],
  ['CORRECTION', 'Correct my information'],
  ['DELETION', 'Delete my information'],
  ['EXPORT', 'Export my information'],
  ['OPT_OUT', 'Opt out of processing'],
  ['APPEAL', 'Appeal a decision'],
] as const;

export function PrivacyRequestForm() {
  const [form, setForm] = useState({ email: '', requestType: 'ACCESS', jurisdiction: '', details: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError(false);
    try {
      await api.post('/privacy-requests', form, { skipAuth: true });
      setMessage('Your request was received. We may contact you to verify your identity.');
      setForm({ email: '', requestType: 'ACCESS', jurisdiction: '', details: '' });
    } catch (requestError: any) {
      setError(true);
      setMessage(requestError?.message || 'We could not submit the request. Email privacy@fieldserviceit.com for assistance.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5" aria-label="Privacy rights request">
      <div>
        <label htmlFor="privacy-email" className="block font-semibold text-gray-900">Email address</label>
        <input id="privacy-email" type="email" required maxLength={191} autoComplete="email" value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-950" />
      </div>
      <div>
        <label htmlFor="privacy-type" className="block font-semibold text-gray-900">Request type</label>
        <select id="privacy-type" value={form.requestType} onChange={(event) => setForm({ ...form, requestType: event.target.value })}
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-950">
          {requestTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="privacy-jurisdiction" className="block font-semibold text-gray-900">State or country <span className="font-normal text-gray-500">(optional)</span></label>
        <input id="privacy-jurisdiction" maxLength={80} value={form.jurisdiction}
          onChange={(event) => setForm({ ...form, jurisdiction: event.target.value })}
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-950" />
      </div>
      <div>
        <label htmlFor="privacy-details" className="block font-semibold text-gray-900">Details <span className="font-normal text-gray-500">(optional)</span></label>
        <textarea id="privacy-details" rows={4} maxLength={2000} value={form.details}
          onChange={(event) => setForm({ ...form, details: event.target.value })}
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-950" />
      </div>
      <p className="text-xs text-gray-600">Do not include passwords, payment details, or other sensitive information. Identity verification is required before fulfillment.</p>
      {message && <p role={error ? 'alert' : 'status'} className={error ? 'text-red-700' : 'text-green-700'}>{message}</p>}
      <button type="submit" disabled={submitting} className="w-fit rounded-md bg-primary px-4 py-2 font-semibold text-white disabled:opacity-60">
        {submitting ? 'Submitting…' : 'Submit privacy request'}
      </button>
    </form>
  );
}
