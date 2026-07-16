'use client';

import dynamic from 'next/dynamic';

const NetworkPageClient = dynamic(() => import('./NetworkPageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[520px] items-center justify-center bg-gray-50 px-6 text-sm text-gray-600">
      Loading network workspace...
    </div>
  ),
});

export default function NetworkPage() {
  return <NetworkPageClient />;
}
