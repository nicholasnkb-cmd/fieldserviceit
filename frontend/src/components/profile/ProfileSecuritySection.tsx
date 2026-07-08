'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Laptop, Loader2, LogOut, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
import { api, getListData } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { MfaSetupCard } from '../security/MfaSetupCard';

type Session = {
  id: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: string;
  lastSeenAt?: string;
  expiresAt: string;
  revokedAt?: string;
  current: boolean;
  active: boolean;
};

export function ProfileSecuritySection() {
  const [mfa, setMfa] = useState<any>({ enabled: false, recoveryCodesRemaining: 0 });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [setup, setSetup] = useState<any>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [mfaResult, sessionResult] = await Promise.all([
        api.get('/auth/mfa/status'),
        api.get('/auth/sessions'),
      ]);
      setMfa(mfaResult);
      setSessions(getListData(sessionResult));
    } catch (err: any) {
      setError(err.message || 'Security settings could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const beginSetup = async () => {
    setBusy('setup');
    setError('');
    setMessage('');
    try {
      setSetup(await api.post('/auth/mfa/setup', {}));
      setRecoveryCodes([]);
      setCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const confirmSetup = async () => {
    setBusy('confirm');
    setError('');
    setMessage('');
    try {
      const result = await api.post('/auth/mfa/confirm', { code });
      setRecoveryCodes(result.recoveryCodes || []);
      setSetup(null);
      setCode('');
      setMessage('Multi-factor authentication is now active');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const disableMfa = async () => {
    setBusy('disable');
    setError('');
    setMessage('');
    try {
      await api.post('/auth/mfa/disable', { code, password });
      setCode('');
      setPassword('');
      setMessage('Multi-factor authentication was disabled');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const revoke = async (session: Session) => {
    setBusy(session.id);
    setError('');
    setMessage('');
    try {
      await api.delete(`/auth/sessions/${session.id}`);
      setMessage(session.current ? 'This session was revoked' : 'Device session revoked');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const revokeOthers = async () => {
    setBusy('others');
    setError('');
    setMessage('');
    try {
      await api.post('/auth/sessions/revoke-others', {});
      setMessage('Other device sessions were revoked');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <section className="rounded-lg bg-white p-6 shadow">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-md ${mfa.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-950">Authenticator MFA</h2>
              <p className="mt-1 text-sm text-gray-600">
                {mfa.enabled ? `Active with ${mfa.recoveryCodesRemaining} recovery codes remaining.` : 'Not configured for this account.'}
              </p>
            </div>
          </div>
          <button onClick={beginSetup} disabled={Boolean(busy)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <KeyRound size={16} />
            {mfa.enabled ? 'Rotate authenticator' : 'Set up MFA'}
          </button>
        </div>

        {setup && (
          <div className="mt-5 max-w-xl space-y-4 rounded-md border border-blue-200 bg-blue-50 p-4">
            <MfaSetupCard secret={setup.secret} otpauthUri={setup.otpauthUri} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code"
                className="min-w-0 flex-1 rounded-md border border-blue-300 px-3 py-2 text-center font-mono text-lg outline-none focus:border-primary" placeholder="000000" />
              <button onClick={confirmSetup} disabled={busy === 'confirm'}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy === 'confirm' && <Loader2 className="animate-spin" size={16} />}
                Confirm
              </button>
            </div>
          </div>
        )}

        {recoveryCodes.length > 0 && (
          <div className="mt-5 max-w-xl">
            <p className="mb-2 text-sm font-semibold text-gray-900">New one-time recovery codes</p>
            <div className="grid grid-cols-2 gap-2 rounded-md bg-gray-950 p-4 font-mono text-sm text-white">
              {recoveryCodes.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
        )}

        {mfa.enabled && !setup && (
          <div className="mt-5 grid max-w-xl gap-2 sm:grid-cols-2">
            <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Authenticator code" />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)}
              className="min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Current password" />
            <button onClick={disableMfa} disabled={!code || !password || busy === 'disable'}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50 sm:col-span-2">
              Disable MFA
            </button>
          </div>
        )}
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">Active devices</h2>
            <p className="mt-1 text-sm text-gray-600">Access tokens are checked against these revocable sessions.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="rounded-md border border-gray-300 p-2 text-gray-600" title="Refresh sessions">
              <RefreshCw size={17} />
            </button>
            <button onClick={revokeOthers} disabled={busy === 'others'}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50">
              <LogOut size={16} />
              Sign out other devices
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin" size={16} /> Loading sessions...</div>
        ) : (
          <div className="mt-4 divide-y divide-gray-100 border-y border-gray-200">
            {sessions.map((session) => (
              <div key={session.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="mt-0.5 text-gray-500">
                    {session.deviceInfo?.match(/Android|iOS/) ? <Smartphone size={19} /> : <Laptop size={19} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-950">{session.deviceInfo || 'Unknown device'}</p>
                      {session.current && <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Current</span>}
                      {!session.active && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">Inactive</span>}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {[session.ipAddress, `Last seen ${formatDate(session.lastSeenAt || session.createdAt)}`, `Expires ${formatDate(session.expiresAt)}`].filter(Boolean).join(' | ')}
                    </p>
                  </div>
                </div>
                {session.active && (
                  <button onClick={() => revoke(session)} disabled={busy === session.id}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 disabled:opacity-50">
                    Revoke
                  </button>
                )}
              </div>
            ))}
            {sessions.length === 0 && <div className="py-5 text-sm text-gray-500">No sessions found.</div>}
          </div>
        )}
      </section>
    </div>
  );
}
