'use client';

import { useEffect } from 'react';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { void import('@sentry/nextjs').then(({ captureException }) => captureException(error)); }, [error]);
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mt-5 text-xl font-semibold text-gray-950">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          An error occurred while loading this page. Please try again.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-gray-400 font-mono">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
