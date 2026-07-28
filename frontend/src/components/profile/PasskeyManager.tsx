'use client';

import { useCallback, useEffect, useState } from 'react';
import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';
import { Fingerprint, KeyRound, Loader2, Trash2 } from 'lucide-react';
import { api, getListData } from '../../lib/api';
import { formatDate } from '../../lib/utils';

type Passkey = {
  id: string;
  name: string;
  deviceType?: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt?: string;
};

export function PasskeyManager() {
  const [supported, setSupported] = useState(true);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stepUpCode, setStepUpCode] = useState('');
  const [stepUpUntil, setStepUpUntil] = useState('');

  const load = useCallback(() => {
    api.get('/auth/passkeys').then((result) => setPasskeys(getListData(result))).catch(() => setPasskeys([]));
  }, []);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    load();
  }, [load]);

  async function addPasskey() {
    setBusy('add');
    setError('');
    setMessage('');
    try {
      const ceremony = await api.post('/auth/passkeys/registration-options', {});
      const response = await startRegistration({ optionsJSON: ceremony.options });
      await api.post('/auth/passkeys/register', {
        challengeId: ceremony.challengeId,
        response,
        name: response.authenticatorAttachment === 'platform' ? 'This device' : 'Security key',
      });
      setMessage('Passkey added successfully.');
      load();
    } catch (registrationError: any) {
      setError(registrationError?.message || 'Passkey registration was canceled or failed.');
    } finally {
      setBusy('');
    }
  }

  async function verifyStrongAuthentication() {
    setBusy('step-up');
    setError('');
    try {
      const result = await api.post('/auth/step-up', { code: stepUpCode });
      setStepUpUntil(result.expiresAt || 'verified');
      setStepUpCode('');
      setMessage('Sensitive passkey changes are unlocked for 10 minutes.');
    } catch (stepUpError: any) {
      setError(stepUpError?.message || 'The authenticator or recovery code could not be verified.');
    } finally {
      setBusy('');
    }
  }

  async function rename(passkey: Passkey) {
    const name = window.prompt('Name this passkey', passkey.name);
    if (!name?.trim()) return;
    setBusy(passkey.id);
    try {
      await api.post(`/auth/passkeys/${passkey.id}/name`, { name: name.trim() });
      setMessage('Passkey renamed.');
      load();
    } catch (renameError: any) {
      setError(renameError?.message || 'Passkey could not be renamed.');
    } finally {
      setBusy('');
    }
  }

  async function remove(passkey: Passkey) {
    if (!window.confirm(`Remove “${passkey.name}”? You will no longer be able to sign in with it.`)) return;
    setBusy(passkey.id);
    try {
      await api.delete(`/auth/passkeys/${passkey.id}`);
      setMessage('Passkey removed.');
      load();
    } catch (removeError: any) {
      setError(removeError?.message || 'Passkey could not be removed.');
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-700"><Fingerprint size={21} /></div>
          <div>
            <h2 className="font-semibold text-gray-950">Passkeys</h2>
            <p className="mt-1 text-sm text-gray-600">Use device biometrics, a PIN, or a hardware security key for phishing-resistant sign-in.</p>
          </div>
        </div>
        <button type="button" onClick={addPasskey} disabled={!supported || Boolean(busy)}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          {busy === 'add' ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
          Add passkey
        </button>
      </div>
      {!supported && <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">This browser does not support WebAuthn passkeys.</p>}
      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm text-amber-900">Adding or removing a passkey requires a recent passkey, MFA, or recovery-code verification.</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="passkey-step-up-code">Authenticator or recovery code</label>
          <input id="passkey-step-up-code" value={stepUpCode} onChange={(event) => setStepUpCode(event.target.value)} autoComplete="one-time-code"
            placeholder="Authenticator or recovery code" className="min-w-0 flex-1 rounded-md border border-amber-300 bg-white px-3 py-2 text-sm" />
          <button type="button" onClick={verifyStrongAuthentication} disabled={!stepUpCode || busy === 'step-up'}
            className="rounded-md bg-amber-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Verify</button>
        </div>
        {stepUpUntil && <p className="mt-2 text-xs text-amber-800">Passkey changes unlocked{stepUpUntil === 'verified' ? '.' : ` until ${new Date(stepUpUntil).toLocaleTimeString()}.`}</p>}
      </div>
      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      <div className="mt-4 divide-y divide-gray-100 border-y border-gray-200">
        {passkeys.map((passkey) => (
          <div key={passkey.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-gray-950">{passkey.name}</p>
              <p className="mt-1 text-xs text-gray-500">
                {[passkey.backedUp ? 'Synced passkey' : 'Device-bound credential', `Added ${formatDate(passkey.createdAt)}`, passkey.lastUsedAt ? `Last used ${formatDate(passkey.lastUsedAt)}` : 'Not used yet'].join(' | ')}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => rename(passkey)} disabled={busy === passkey.id} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700">Rename</button>
              <button type="button" onClick={() => remove(passkey)} disabled={busy === passkey.id} aria-label={`Remove ${passkey.name}`} className="rounded-md border border-red-200 p-2 text-red-700"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {!passkeys.length && <p className="py-5 text-sm text-gray-500">No passkeys registered.</p>}
      </div>
    </section>
  );
}
