'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void import('@sentry/nextjs').then(({ captureException }) => captureException(error));
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-gray-950">
        <main className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-gray-600">The error has been reported. Please try again.</p>
          <button className="mt-6 rounded bg-blue-700 px-4 py-2 font-medium text-white" onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
