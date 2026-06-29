import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Overview',
  description: 'Review FieldserviceIT tenant isolation, access controls, encryption, auditing, monitoring, and responsible disclosure practices.',
  alternates: { canonical: '/security-overview' },
};

const controls = [
  ['Tenant isolation', 'Company context, role permissions, feature access, and tenant-owned data queries are explicitly enforced.'],
  ['Identity and access', 'Cookie-based sessions, optional MFA and OIDC, session management, scoped permissions, and administrative audit trails protect access.'],
  ['Credential protection', 'Integration and device credentials are encrypted before storage and remain masked during normal administration.'],
  ['Application security', 'Input validation, rate limits, secure response headers, upload validation, dependency audits, and automated authorization checks run as release gates.'],
  ['Operational monitoring', 'Health probes, first-party frontend error reporting, and security operations dashboards support incident detection.'],
  ['Data lifecycle', 'Configurable retention, encrypted backup workflows, restore-integrity checks, and soft deletion support controlled data handling.'],
];

export default function SecurityOverviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Trust center</p>
      <h1 className="mt-3 text-4xl font-bold text-gray-950">Security overview</h1>
      <p className="mt-4 max-w-3xl text-lg text-gray-600">FieldserviceIT uses layered technical and operational controls to protect service records, credentials, tenant data, and administrative activity.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {controls.map(([title, body]) => (
          <section key={title} className="border-t border-gray-300 pt-5">
            <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
          </section>
        ))}
      </div>
      <section className="mt-12 rounded-lg bg-gray-950 p-7 text-white">
        <h2 className="text-xl font-semibold">Report a security concern</h2>
        <p className="mt-2 text-sm text-gray-300">Send responsible disclosure reports with reproduction steps and impact details. Do not include customer data unless necessary.</p>
        <a href="mailto:security@fieldserviceit.com" className="mt-4 inline-block font-semibold text-blue-300 hover:text-blue-200">security@fieldserviceit.com</a>
      </section>
    </div>
  );
}
