import type { Metadata } from 'next';
import { AnalyticsPreferencesButton } from '../../../components/marketing/AnalyticsPreferencesButton';
import { PRIVACY_VERSION } from '../../../lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How FieldserviceIT collects, uses, shares, retains, and protects personal information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-gray-700">
      <h1 className="text-4xl font-bold text-gray-950">Privacy Policy</h1>
      <p className="mt-4 text-sm text-gray-500">Effective and last updated: June 21, 2026 · Version {PRIVACY_VERSION}</p>
      <p className="mt-6 leading-7">This Policy describes how FieldserviceIT processes information through its websites, applications, APIs, support channels, and integrations. A business customer may separately control information placed in its workspace; requests concerning that information may need to be directed to that customer.</p>

      <div className="mt-10 space-y-8 text-sm leading-7">
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Information we process</h2>
          <p className="mt-2">We process account and contact details; authentication and session information; company, technician, customer, asset, network, location, ticket, attachment, signature, audit, and support records; PayPal subscription identifiers; integration credentials and records; device and browser information; and service diagnostics. Payment details are collected by PayPal rather than stored directly by FieldserviceIT.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-950">Sources and purposes</h2>
          <p className="mt-2">Information comes from users, customer administrators, connected providers and devices, payment and identity services, support interactions, and ordinary service operation. We use it to provide and secure the service, authenticate users, perform requested monitoring and workflows, process subscriptions, communicate about accounts and tickets, prevent abuse, troubleshoot failures, comply with law, and improve the service.</p>
        </section>

        <section id="analytics">
          <h2 className="text-xl font-semibold text-gray-950">Analytics, cookies, and email measurement</h2>
          <p className="mt-2">Essential storage and cookies support authentication, security, and user preferences. When Google Analytics is configured, it is not loaded until you allow optional analytics. It is also disabled when the browser sends a Do Not Track signal. Transactional emails may use signed links and a small image to measure delivery, opens, and clicks; these measurements can be affected by privacy proxies. You may unsubscribe from nonessential email using the link in the message.</p>
          <p className="mt-2"><AnalyticsPreferencesButton /></p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-950">AI-assisted features</h2>
          <p className="mt-2">If a customer enables AI-assisted features, prompts, conversation history, and relevant workspace results may be sent to the configured AI model provider to classify requests or generate answers. The current integration requests that the provider not store responses for model processing. Customers should not submit regulated or highly sensitive information unless their agreement and configuration permit it.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-950">When information is disclosed</h2>
          <p className="mt-2">Information may be disclosed to PayPal and to hosting, storage, email, identity, analytics, monitoring, remote-access, integration, security, support, and AI model providers as needed to operate requested features. It may also be disclosed during a business transaction, with customer direction or consent, to protect rights and security, or when legally required. FieldserviceIT does not sell personal information for money.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-950">Retention and deletion</h2>
          <p className="mt-2">Retention depends on the record type, customer configuration, contractual obligations, security and audit needs, backup cycles, and law. Configurable policies cover sessions, audit logs, error reports, network snapshots, syslog records, exports, notifications, and soft-deleted records. We delete or de-identify information when it is no longer reasonably needed, subject to backups, fraud prevention, dispute, and legal requirements.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-950">Security</h2>
          <p className="mt-2">We use access restrictions, tenant separation, encryption or hashing for credentials, audit logging, session controls, vulnerability management, backups, and other administrative, technical, and physical safeguards. No service can guarantee absolute security. Report a suspected security issue to <a className="font-semibold text-primary hover:underline" href="mailto:security@fieldserviceit.com">security@fieldserviceit.com</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-950">Privacy requests</h2>
          <p className="mt-2">Depending on applicable law, you may have rights to request access, correction, deletion, or a copy of personal information, or to object to or limit certain processing. We may verify your identity and authority before responding. If a customer controls the relevant workspace, we may refer the request to that customer. Submit requests or appeals to <a className="font-semibold text-primary hover:underline" href="mailto:privacy@fieldserviceit.com">privacy@fieldserviceit.com</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-950">Children and international use</h2>
          <p className="mt-2">The service is intended for business and professional use and is not directed to children under 13. Do not submit children’s information without appropriate authority. Customers using the service across borders are responsible for ensuring an appropriate transfer mechanism and any required notices or agreements.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-950">Changes and contact</h2>
          <p className="mt-2">We will update the date and version above when this Policy changes and will provide additional notice for material changes when appropriate. Questions may be sent to <a className="font-semibold text-primary hover:underline" href="mailto:privacy@fieldserviceit.com">privacy@fieldserviceit.com</a>.</p>
        </section>
      </div>
    </main>
  );
}
