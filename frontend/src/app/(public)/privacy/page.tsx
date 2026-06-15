import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How FieldserviceIT handles account, service request, operational, analytics, and integration data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold text-gray-950">Privacy</h1>
      <p className="mt-4 text-gray-600">This summary explains the main categories of information processed by FieldserviceIT and the operational reasons for processing them.</p>
      <div className="mt-10 space-y-8 text-sm leading-7 text-gray-700">
        <section><h2 className="text-xl font-semibold text-gray-950">Information processed</h2><p className="mt-2">Account details, company configuration, service requests, attachments, asset and integration records, audit activity, support communications, and limited technical diagnostics may be processed to deliver the service.</p></section>
        <section><h2 className="text-xl font-semibold text-gray-950">Analytics and diagnostics</h2><p className="mt-2">Product usage events and error reports may be collected to understand feature adoption, investigate failures, and improve reliability. Analytics are disabled when no measurement ID is configured and respect browser Do Not Track settings.</p></section>
        <section><h2 className="text-xl font-semibold text-gray-950">Data sharing</h2><p className="mt-2">Information is shared only with infrastructure, payment, email, identity, monitoring, or integration providers needed to operate requested features, or when legally required.</p></section>
        <section><h2 className="text-xl font-semibold text-gray-950">Retention and security</h2><p className="mt-2">Tenant controls, encryption, access restrictions, auditing, backup procedures, and configurable retention policies are used to protect and manage stored information.</p></section>
        <section><h2 className="text-xl font-semibold text-gray-950">Requests</h2><p className="mt-2">For privacy questions or account data requests, contact <a className="font-semibold text-primary hover:underline" href="mailto:privacy@fieldserviceit.com">privacy@fieldserviceit.com</a>.</p></section>
      </div>
    </div>
  );
}
