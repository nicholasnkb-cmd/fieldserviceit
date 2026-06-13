import {
  ArrowRight,
  Check,
  CircleHelp,
  ClipboardCheck,
  FileClock,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { TrackedLink } from './TrackedLink';

export type SeoLandingPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  audience: string;
  benefits: Array<{ title: string; body: string }>;
  workflow: string[];
  faqs: Array<{ question: string; answer: string }>;
  related: Array<{ href: string; label: string }>;
};

export function SeoLandingPage({ content }: { content: SeoLandingPageContent }) {
  return (
    <div className="bg-white text-gray-950">
      <section className="border-b border-gray-200 px-5 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-emerald-700">{content.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl lg:text-6xl">{content.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-700">{content.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href="/register-business"
                eventName="seo_landing_cta"
                eventLabel={`register_business_${content.eyebrow}`}
                eventLocation="hero"
                className="inline-flex items-center justify-center gap-2 rounded bg-gray-950 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Start a business workspace
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TrackedLink>
              <TrackedLink
                href="/contact"
                eventName="contact_click"
                eventLabel={`contact_sales_${content.eyebrow}`}
                eventLocation="hero"
                className="inline-flex items-center justify-center rounded border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Contact sales
              </TrackedLink>
            </div>
          </div>
          <div className="border-l-2 border-emerald-500 pl-5">
            <p className="text-sm font-semibold text-gray-950">Designed for</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">{content.audience}</p>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-emerald-700">Core capabilities</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">Keep service context attached to the work.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {content.benefits.map((benefit) => (
              <div key={benefit.title} className="rounded border border-gray-200 p-5">
                <ClipboardCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <h3 className="mt-5 text-base font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{benefit.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-950 px-5 py-16 text-white sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1fr]">
          <div>
            <FileClock className="h-6 w-6 text-emerald-300" aria-hidden="true" />
            <p className="mt-5 text-sm font-semibold uppercase text-emerald-300">Connected workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">Move from intake to accountable resolution.</h2>
          </div>
          <ol className="grid gap-3">
            {content.workflow.map((step, index) => (
              <li key={step} className="flex gap-4 border-b border-white/15 pb-4 text-sm leading-6 text-gray-200">
                <span className="font-semibold text-emerald-300">{String(index + 1).padStart(2, '0')}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-gray-50 px-5 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          {[
            {
              title: 'Tenant isolation',
              body: 'Company records and workflows stay scoped through tenant, role, and permission controls.',
              icon: LockKeyhole,
            },
            {
              title: 'Audit history',
              body: 'Sensitive operational and administrative changes can be preserved in an accountable timeline.',
              icon: ShieldCheck,
            },
            {
              title: 'Operational ownership',
              body: 'Tickets, assets, dispatch updates, customer notes, and reports remain in one shared record.',
              icon: Check,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title}>
                <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <h2 className="mt-4 text-base font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-emerald-700">Frequently asked questions</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">What teams usually ask before switching.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {content.faqs.map((faq) => (
              <div key={faq.question} className="rounded border border-gray-200 p-5">
                <CircleHelp className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <h3 className="mt-5 text-base font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-sm font-semibold text-gray-950">Explore related workflows</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              {content.related.map((item) => (
                <TrackedLink
                  key={item.href}
                  href={item.href}
                  eventName="cta_click"
                  eventLabel={item.label}
                  eventLocation="related_pages"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </TrackedLink>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
