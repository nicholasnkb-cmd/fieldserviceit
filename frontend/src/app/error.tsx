'use client';

import { useEffect } from 'react';

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { void import('@sentry/nextjs').then(({ captureException }) => captureException(error)); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-gray-950">Something went wrong</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-gray-400 font-mono">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
