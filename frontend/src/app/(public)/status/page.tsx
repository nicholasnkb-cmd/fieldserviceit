import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Service Status',
  description: 'Current availability for the FieldserviceIT website, API, and database services.',
  alternates: { canonical: '/status' },
};

async function serviceHealth() {
  const startedAt = Date.now();
  try {
    const response = await fetch('https://api.fieldserviceit.com/v1/health', { cache: 'no-store' });
    const body = await response.json();
    const data = body?.data || body;
    return {
      available: response.ok && data?.status === 'ok',
      database: data?.database?.status === 'ok',
      latency: Date.now() - startedAt,
      checkedAt: data?.timestamp || new Date().toISOString(),
    };
  } catch {
    return { available: false, database: false, latency: Date.now() - startedAt, checkedAt: new Date().toISOString() };
  }
}

function StatusRow({ label, available, detail }: { label: string; available: boolean; detail: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-gray-200 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-semibold text-gray-950">{label}</h2>
        <p className="mt-1 text-sm text-gray-500">{detail}</p>
      </div>
      <span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
        {available ? 'Operational' : 'Service disruption'}
      </span>
    </div>
  );
}

export default async function StatusPage() {
  const health = await serviceHealth();
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Live status</p>
      <h1 className="mt-3 text-4xl font-bold text-gray-950">FieldserviceIT service status</h1>
      <p className="mt-4 text-gray-600">Live availability checks for the customer-facing application and core API services.</p>
      <div className="mt-10 border-y border-gray-200">
        <StatusRow label="Website" available detail="Public pages and application shell" />
        <StatusRow label="Application API" available={health.available} detail={`Health response in ${health.latency} ms`} />
        <StatusRow label="Database connectivity" available={health.database} detail="Core persistence health reported by the API" />
      </div>
      <p className="mt-6 text-sm text-gray-500">Last checked {new Date(health.checkedAt).toLocaleString('en-US', { timeZone: 'America/New_York' })} Eastern Time.</p>
    </div>
  );
}
