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

async function statusNotices() {
  try {
    const response = await fetch('https://api.fieldserviceit.com/v1/status/notices', { cache: 'no-store' });
    const body = await response.json();
    const data = body?.data || body;
    return Array.isArray(data) ? data : [];
  } catch { return []; }
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
  const [health, notices] = await Promise.all([serviceHealth(), statusNotices()]);
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
      {notices.length > 0 && <section className="mt-10" aria-labelledby="service-updates-title">
        <h2 id="service-updates-title" className="text-2xl font-bold text-gray-950">Maintenance and incident updates</h2>
        <div className="mt-4 space-y-3">{notices.map((notice: any) => <article key={notice.id} className={`rounded border p-5 ${notice.status === 'RESOLVED' ? 'border-emerald-200 bg-emerald-50' : notice.noticeType === 'INCIDENT' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-gray-950">{notice.title}</h3><span className="rounded bg-white px-2 py-1 text-xs font-semibold text-gray-700">{String(notice.status).replaceAll('_', ' ')}</span></div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{notice.message}</p>
          <p className="mt-3 text-xs text-gray-500">Updated {new Date(notice.updatedAt).toLocaleString('en-US', { timeZone: 'America/New_York' })} Eastern Time</p>
        </article>)}</div>
      </section>}
      <p className="mt-6 text-sm text-gray-500">Last checked {new Date(health.checkedAt).toLocaleString('en-US', { timeZone: 'America/New_York' })} Eastern Time.</p>
    </div>
  );
}
