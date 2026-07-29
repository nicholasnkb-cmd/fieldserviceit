import type { Metadata } from 'next';
import Link from 'next/link';
import { TERMS_VERSION } from '../../../lib/legal';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing access to and use of FieldserviceIT.',
  alternates: { canonical: '/terms' },
};

const sections = [
  ['Eligibility and authority', 'You must be at least 18 and able to form a binding contract. If you use the service for an organization, you represent that you have authority to bind that organization.'],
  ['Accounts', 'Provide accurate information, protect account credentials, use appropriate access controls, and promptly notify us of suspected unauthorized access. You are responsible for activity performed through your accounts except to the extent caused by our breach of these Terms.'],
  ['Subscriptions, renewal, and cancellation', 'Paid subscriptions renew automatically for the selected monthly or annual billing period until canceled. Prices, billing interval, and any trial are shown before checkout. You authorize recurring charges through PayPal. You may cancel through the PayPal subscription-management page; cancellation takes effect at the end of the current paid period unless the checkout or an applicable law states otherwise. Fees already paid are nonrefundable except where required by law.'],
  ['Taxes', 'Displayed prices exclude applicable taxes unless expressly stated. You are responsible for taxes associated with your purchase, excluding taxes based on our net income. Taxes may be calculated and collected through PayPal or another documented tax process.'],
  ['Customer data and instructions', 'You retain rights in data you submit. You authorize FieldserviceIT and its subprocessors to host, process, transmit, and back up that data as needed to provide, secure, support, and improve the service. You are responsible for having a lawful basis and all required notices and permissions for data you submit.'],
  ['AI-assisted features', 'If enabled, AI-assisted features may send prompts and relevant workspace information to an identified model provider to generate a response. Outputs can be incomplete or incorrect and must be reviewed before use. Do not submit regulated or highly sensitive information unless your agreement and configuration expressly permit it.'],
  ['Monitoring and remote administration', 'Use monitoring, discovery, credential, automation, remote-access, and device-management features only on systems you are authorized to administer. Obtain required customer, employee, and end-user notices and consents. You remain responsible for approving changes and maintaining recovery procedures.'],
  ['Acceptable use', 'Do not use the service to violate law or third-party rights; access systems without authorization; distribute malware; evade security controls; harass others; send unlawful messages; or interfere with the service. We may suspend access reasonably believed to create a security, legal, or operational risk.'],
  ['Third-party services', 'PayPal and identity, hosting, email, monitoring, remote-access, integration, and AI providers are governed by their own terms. We are not responsible for third-party services outside our control.'],
  ['Service changes and availability', 'We may update the service and these Terms. Material changes will be communicated through the service or account contact information. Continued use after the effective date constitutes acceptance where permitted by law. The service may occasionally be unavailable for maintenance, security, or circumstances outside reasonable control.'],
  ['Disclaimers', 'To the maximum extent permitted by law, the service is provided “as is” and “as available.” FieldserviceIT disclaims implied warranties of merchantability, fitness for a particular purpose, noninfringement, and any guarantee that monitoring or security features will detect every event. Nothing here excludes warranties that cannot lawfully be excluded.'],
  ['Limitation of liability', 'To the maximum extent permitted by law, neither party is liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or lost profits, revenues, data, or goodwill. FieldserviceIT’s aggregate liability arising from the service will not exceed the fees paid for the service during the 12 months before the event giving rise to the claim. These limits do not apply where prohibited by law.'],
  ['Termination', 'You may stop using the service at any time and may cancel paid service through the billing portal. We may suspend or terminate access for material breach, security risk, nonpayment, or unlawful use. Provisions that by their nature should survive termination will survive.'],
  ['Governing law', 'These Terms are governed by the laws of the State of New York, without regard to conflict-of-law rules, except where applicable law requires otherwise. Before filing a claim, each party will give the other written notice and a reasonable opportunity to resolve the dispute informally.'],
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-gray-700">
      <h1 className="text-4xl font-bold text-gray-950">Terms of Service</h1>
      <p className="mt-4 text-sm text-gray-500">Effective and last updated: June 21, 2026 · Version {TERMS_VERSION}</p>
      <p className="mt-6 leading-7">These Terms govern access to and use of the FieldserviceIT websites, applications, APIs, and related services. By creating an account, purchasing a subscription, or using the service, you agree to these Terms and acknowledge the <Link className="font-semibold text-primary hover:underline" href="/privacy">Privacy Policy</Link>.</p>
      <div className="mt-10 space-y-8">
        {sections.map(([title, body]) => (
          <section key={title}>
            <h2 className="text-xl font-semibold text-gray-950">{title}</h2>
            <p className="mt-2 text-sm leading-7">{body}</p>
          </section>
        ))}
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Contact</h2>
          <p className="mt-2 text-sm leading-7">Questions or legal notices may be sent to <a className="font-semibold text-primary hover:underline" href="mailto:support@fieldserviceit.com">support@fieldserviceit.com</a>.</p>
        </section>
      </div>
    </main>
  );
}
