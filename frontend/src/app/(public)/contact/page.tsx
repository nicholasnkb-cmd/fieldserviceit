import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, Headphones, Mail, MapPin, ShieldQuestion } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Sales and Support',
  description:
    'Contact FieldserviceIT for sales, business onboarding, billing, integrations, platform support, or security questions.',
  alternates: {
    canonical: '/contact',
  },
};

const contactOptions = [
  {
    title: 'Sales and business setup',
    body: 'Questions about onboarding a company workspace, plans, tenant controls, or billing.',
    href: 'mailto:sales@fieldserviceit.com',
    label: 'sales@fieldserviceit.com',
    icon: Building2,
  },
  {
    title: 'Support',
    body: 'Help with login, tickets, monitoring, integrations, users, or day-to-day platform behavior.',
    href: 'mailto:support@fieldserviceit.com',
    label: 'support@fieldserviceit.com',
    icon: Headphones,
  },
  {
    title: 'Security and legal',
    body: 'Report security concerns, responsible disclosure items, or legal questions related to platform use.',
    href: 'mailto:security@fieldserviceit.com',
    label: 'security@fieldserviceit.com',
    icon: ShieldQuestion,
  },
];

export default function ContactPage() {
  return (
    <div className="bg-white text-gray-950">
      <section className="border-b border-gray-200 px-5 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Contact us</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-gray-950 sm:text-5xl">
              Get help with FieldserviceIT.
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-700">
              Reach the right team for platform support, business onboarding, billing, integrations, monitoring, or security questions.
            </p>
          </div>
          <div className="rounded border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 text-emerald-700" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold text-gray-950">Fastest contact path</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Email support with your account email, business name, affected page, and any error message you see.
                </p>
                <a
                  href="mailto:support@fieldserviceit.com"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Email support
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {contactOptions.map((option) => {
            const Icon = option.icon;
            return (
              <a
                key={option.title}
                href={option.href}
                className="rounded border border-gray-200 bg-white p-5 transition hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <h2 className="mt-5 text-base font-semibold text-gray-950">{option.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{option.body}</p>
                <span className="mt-4 block text-sm font-semibold text-emerald-700">{option.label}</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="bg-gray-950 px-5 py-16 text-white sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-300">Before you write</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">Helpful details speed up a fix.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Account context', 'Your login email, business name, and whether you are a super admin, admin, technician, or customer.'],
              ['Problem context', 'The page URL, time it happened, browser, device, screenshots, and exact error text.'],
              ['Integration context', 'Vendor name, controller type, affected tenant or site, and whether the issue is test, sync, or live action related.'],
              ['Urgency context', 'Whether production service, customer access, billing, or monitoring alerts are affected.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded border border-white/15 bg-white/[0.06] p-5">
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 rounded border border-gray-200 bg-gray-50 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <MapPin className="mt-1 h-5 w-5 text-emerald-700" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-gray-950">Need to submit a service request?</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Customers can use the public ticket form instead of emailing support.
              </p>
            </div>
          </div>
          <Link
            href="/submit-ticket"
            className="inline-flex items-center justify-center rounded bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Submit ticket
          </Link>
        </div>
      </section>
    </div>
  );
}
