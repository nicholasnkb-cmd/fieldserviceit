'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { setSessionTokens, unwrapResponseBody } from '../../../lib/api';

type LoginMode = 'password' | 'mfa' | 'enroll' | 'recovery';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<LoginMode>('password');
  const [challengeToken, setChallengeToken] = useState('');
  const [setup, setSetup] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [ssoProviders, setSsoProviders] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuthStore();
  const router = useRouter();

  const loadSsoProviders = (value = '') => {
    if (typeof fetch !== 'function') return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const query = value.trim() ? `?email=${encodeURIComponent(value.trim())}` : '';
    fetch(`${apiUrl}/v1/auth/sso/providers${query}`, { credentials: 'include' })
      .then((response) => response.ok ? response.json() : [])
      .then((body) => {
        const data = unwrapResponseBody(body);
        setSsoProviders(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadSsoProviders();
  }, []);

  const request = async (endpoint: string, body: any) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${apiUrl}/v1${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const responseBody = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(responseBody.message || 'Sign in failed');
    return unwrapResponseBody(responseBody);
  };

  const completeLogin = (data: any) => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setSessionTokens(data);
    setUser(data.user);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'enroll') {
        const result = await request('/auth/mfa/challenge/confirm', { challengeToken, code });
        completeLogin(result);
        setRecoveryCodes(result.recoveryCodes || []);
        setMode('recovery');
        return;
      }

      const result = await request('/auth/login', {
        email,
        password,
        ...(mode === 'mfa' ? { mfaCode: code } : {}),
      });
      if (result.mfaRequired) {
        setChallengeToken(result.challengeToken);
        setCode('');
        setMode('mfa');
        return;
      }
      if (result.mfaEnrollmentRequired) {
        setChallengeToken(result.challengeToken);
        const enrollment = await request('/auth/mfa/challenge/setup', { challengeToken: result.challengeToken });
        setSetup(enrollment);
        setCode('');
        setMode('enroll');
        return;
      }
      completeLogin(result);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startSso = async (providerId: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await request(`/auth/sso/${providerId}/start`, { redirectPath: '/dashboard' });
      window.location.assign(result.authorizationUrl);
    } catch (err: any) {
      setError(err.message || 'Single sign-on could not be started');
      setLoading(false);
    }
  };

  if (mode === 'recovery') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 py-12">
        <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-600" size={28} />
            <div>
              <h1 className="text-xl font-bold text-gray-950">MFA is active</h1>
              <p className="text-sm text-gray-500">Store these one-time recovery codes securely.</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-md bg-gray-950 p-4 font-mono text-sm text-white">
            {recoveryCodes.map((item) => <span key={item}>{item}</span>)}
          </div>
          <button onClick={() => router.push('/dashboard')} className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">
            Continue to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-md space-y-7 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            {mode === 'password' ? <KeyRound size={22} /> : <ShieldCheck size={22} />}
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-950">FieldserviceIT</h1>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'password' && 'Sign in to your account'}
            {mode === 'mfa' && 'Enter your authenticator or recovery code'}
            {mode === 'enroll' && 'Secure this account with an authenticator app'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {mode === 'password' && (
            <>
              <label className="block text-sm font-medium text-gray-700">
                Email
                <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} onBlur={() => loadSsoProviders(email)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Password
                <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </label>
            </>
          )}

          {mode === 'enroll' && setup && (
            <div className="space-y-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              <p>In your authenticator app, add an account using this setup key:</p>
              <p className="break-all rounded bg-white px-3 py-2 font-mono font-semibold">{setup.secret}</p>
              <p className="text-xs text-blue-700">The app should use TOTP, 6 digits, and a 30-second period.</p>
            </div>
          )}

          {(mode === 'mfa' || mode === 'enroll') && (
            <label className="block text-sm font-medium text-gray-700">
              {mode === 'mfa' ? 'Authenticator or recovery code' : 'Authenticator code'}
              <input required autoFocus inputMode="numeric" autoComplete="one-time-code" value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </label>
          )}

          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {loading && <Loader2 className="animate-spin" size={16} />}
            {mode === 'password' ? 'Sign in' : mode === 'mfa' ? 'Verify and sign in' : 'Enable MFA'}
          </button>
          {mode !== 'password' && (
            <button type="button" onClick={() => { setMode('password'); setCode(''); setError(''); }}
              className="w-full text-sm font-medium text-gray-500 hover:text-gray-800">
              Use a different account
            </button>
          )}
        </form>

        {mode === 'password' && (
          <>
            {ssoProviders.length > 0 && (
              <div className="space-y-2 border-t border-gray-200 pt-5">
                {ssoProviders.map((provider) => (
                  <button key={provider.id} onClick={() => startSso(provider.id)} disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    <ShieldCheck size={16} />
                    Continue with {provider.name}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2 border-t border-gray-200 pt-5 text-center text-sm">
              <Link href="/register" className="block text-primary hover:underline">Create a public account</Link>
              <Link href="/forgot-password" className="block text-primary hover:underline">Forgot password?</Link>
              <Link href="/track" className="block text-primary hover:underline">Track a ticket</Link>
              <Link href="/register-business" className="block text-primary hover:underline">Register your company</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
