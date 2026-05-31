import Link from 'next/link';
import { AlertTriangle, FileText, LockKeyhole, ShieldAlert } from 'lucide-react';

const sections = [
  {
    title: 'Operational platform, not professional advice',
    body: 'FieldserviceIT provides workflow, monitoring, ticketing, asset, and administrative tools. Information shown in the platform is not legal, financial, compliance, cybersecurity, or professional consulting advice.',
    icon: FileText,
  },
  {
    title: 'Customer responsibility',
    body: 'Users are responsible for the accuracy of data entered, credential handling, integration permissions, network actions, backups, change approvals, and compliance with their own policies and laws.',
    icon: LockKeyhole,
  },
  {
    title: 'Monitoring and integrations',
    body: 'Device status, SNMP results, syslog messages, RMM records, vendor API data, alerts, and vulnerability references may be delayed, incomplete, unavailable, or affected by third-party systems.',
    icon: ShieldAlert,
  },
  {
    title: 'No guarantee of uninterrupted service',
    body: 'The site and related services may experience outages, maintenance windows, provider issues, configuration errors, or other interruptions. Users should keep independent backup and recovery plans.',
    icon: AlertTriangle,
  },
];

export default function LegalDisclaimerPage() {
  return (
    <div className="bg-white text-gray-950">
      <section className="border-b border-gray-200 px-5 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-emerald-700">Legal disclaimer</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-gray-950 sm:text-5xl">
              Important information about using FieldserviceIT.
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-700">
              This disclaimer explains general limitations and user responsibilities when using the FieldserviceIT site,
              applications, monitoring features, integrations, automation, and administrative controls.
            </p>
            <p className="mt-4 text-sm leading-6 text-gray-500">Last updated: May 31, 2026</p>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="rounded border border-gray-200 bg-white p-5">
                <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <h2 className="mt-5 text-base font-semibold text-gray-950">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{section.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gray-950 px-5 py-16 text-white sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-semibold tracking-normal">Use of administrative and network actions</h2>
          <div className="mt-6 space-y-4 text-sm leading-7 text-gray-300">
            <p>
              Some features may allow authorized users to run operational actions such as syncing vendor controllers,
              changing device records, managing credentials, disabling or enabling ports, restarting equipment, creating
              alerts, or changing tenant-level settings where supported.
            </p>
            <p>
              These actions should only be used by authorized personnel with permission to administer the affected business,
              tenant, user, site, device, network, or third-party account. FieldserviceIT is not responsible for outages,
              data loss, configuration mistakes, service disruption, or unauthorized activity caused by improper use,
              incorrect credentials, third-party limitations, or inaccurate environment data.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {[
            [
              'Third-party services',
              'FieldserviceIT may connect to external systems such as vendor controllers, RMM platforms, payment providers, email services, hosting providers, or other APIs. Third-party availability, data quality, terms, pricing, rate limits, and behavior are controlled by those providers.',
            ],
            [
              'Security and credentials',
              'Credential vaulting, encryption, access controls, and audit logging reduce risk but do not eliminate all risk. Users must use strong passwords, protect privileged accounts, rotate secrets, limit permissions, and promptly revoke access when appropriate.',
            ],
            [
              'Data and compliance',
              'Users are responsible for determining whether their use of the platform satisfies internal policies, customer commitments, regulatory obligations, retention requirements, and industry-specific compliance needs.',
            ],
            [
              'Changes to this disclaimer',
              'This disclaimer may be updated as the platform changes. Continued use of FieldserviceIT after updates means the updated disclaimer applies to that use.',
            ],
          ].map(([title, body]) => (
            <div key={title} className="border-b border-gray-200 pb-8 last:border-b-0">
              <h2 className="text-xl font-semibold text-gray-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">{body}</p>
            </div>
          ))}

          <div className="rounded border border-gray-200 bg-gray-50 p-5">
            <h2 className="text-base font-semibold text-gray-950">Questions about this disclaimer?</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Contact the FieldserviceIT team for questions about platform use, security, or account administration.
            </p>
            <Link href="/contact" className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
