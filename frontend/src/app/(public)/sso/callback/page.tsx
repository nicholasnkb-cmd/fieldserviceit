'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { setSessionTokens, unwrapResponseBody } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';

function SsoCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = params.get('code');
    const returnTo = params.get('returnTo') || '/dashboard';
    if (!code) {
      setError('Single sign-on did not return a login code.');
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${apiUrl}/v1/auth/sso/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || 'Single sign-on failed');
        return unwrapResponseBody(body);
      })
      .then((data) => {
        setSessionTokens(data);
        setUser(data.user);
        router.replace(returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/dashboard');
      })
      .catch((err) => setError(err.message || 'Single sign-on failed'));
  }, [params, router, setUser]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        {error ? (
          <>
            <ShieldCheck className="mx-auto text-red-600" size={30} />
            <h1 className="mt-4 text-xl font-bold text-gray-950">Sign-in could not be completed</h1>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button onClick={() => router.replace('/login')} className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">Return to sign in</button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto animate-spin text-primary" size={30} />
            <h1 className="mt-4 text-xl font-bold text-gray-950">Completing secure sign-in</h1>
            <p className="mt-2 text-sm text-gray-600">Validating the identity provider response and creating your session.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SsoCallbackPage() {
  return <Suspense fallback={<div className="p-8 text-sm text-gray-500">Completing sign-in...</div>}><SsoCallbackContent /></Suspense>;
}
