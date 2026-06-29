'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleHelp,
  ClipboardList,
  FileText,
  HardDrive,
  Headphones,
  MapPinned,
  PlugZap,
  ShieldCheck,
  Smartphone,
  Wrench,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { TrackedLink } from '../components/marketing/TrackedLink';
import { Footer } from '../components/layout/Footer';

interface LiveOperations {
  openTickets: number;
  onRoute: number;
  slaMet: number;
  activities: Array<{ label: string; occurredAt: string }>;
}

const plans = [
  {
    name: 'Free',
    price: 0,
    summary: 'For individuals submitting and tracking their own service requests.',
    users: '1 individual',
    tickets: '50 tickets per month',
    features: ['Ticket intake', 'Email notifications', 'Signed-in request form'],
  },
  {
    name: 'Starter',
    price: 29,
    summary: 'For individuals who need higher-volume support tracking and priority workflows.',
    users: '1 individual',
    tickets: 'Unlimited tickets',
    features: ['Unlimited requests', 'Priority support tracking', 'CSV exports', 'Personal service history'],
    featured: true,
  },
  {
    name: 'Business',
    price: 79,
    summary: 'The only company plan, built for MSPs and business service operations.',
    users: 'Unlimited users',
    tickets: 'Unlimited tickets',
    features: ['SLA workflows', 'RMM integrations', 'Audit logs', 'Custom branding'],
  },
];

const capabilities = [
  { title: 'Ticket operations', body: 'Capture, triage, assign, resolve, and audit requests from one queue.', icon: ClipboardList },
  { title: 'Field dispatch', body: 'Schedule technicians, update job status, collect notes, photos, and signatures.', icon: MapPinned },
  { title: 'Asset context', body: 'Connect tickets to endpoints, network devices, contracts, and service history.', icon: HardDrive },
  { title: 'Client portal', body: 'Give customers a clean place to submit and track their own service requests.', icon: Headphones },
  { title: 'Reporting', body: 'See ticket volume, SLA risk, technician load, and operational trends.', icon: BarChart3 },
  { title: 'Tenant controls', body: 'Keep companies, roles, permissions, and audit trails separated by design.', icon: ShieldCheck },
];

const useCases = [
  {
    title: 'MSP service delivery',
    body: 'Coordinate customers, technicians, tickets, assets, RMM alerts, and recurring service work from one tenant-aware workspace.',
    icon: PlugZap,
  },
  {
    title: 'Internal IT support',
    body: 'Give employees a simple request path while IT tracks SLAs, equipment history, approvals, and resolution notes.',
    icon: Headphones,
  },
  {
    title: 'Technician field work',
    body: 'Keep mobile work orders moving with assignment details, status updates, photos, signatures, and closeout notes.',
    icon: Smartphone,
  },
];

const differentiators = [
  'Ticketing, dispatch, assets, billing, and reporting share the same operational record.',
  'Customer portals and company workspaces are separated by tenant, role, and permission controls.',
  'Network, endpoint, and RMM context can flow into tickets instead of living in a separate tool.',
  'Audit trails and administrative controls support accountable service operations as teams grow.',
];

const faqs = [
  {
    question: 'Is FieldserviceIT for MSPs or internal IT teams?',
    answer: 'Both. MSPs can manage customers and field work, while internal IT teams can support users, assets, sites, and service requests.',
  },
  {
    question: 'Can customers submit and track tickets online?',
    answer: 'Yes. Signed-in customers can use request intake and customer-facing tracking as part of the service workflow.',
  },
  {
    question: 'Does the platform support assets and network context?',
    answer: 'Yes. Tickets can connect to assets, monitored equipment, RMM integrations, service history, and topology records.',
  },
];

const trustSignals = [
  { title: 'Tenant-aware controls', body: 'Company workspaces, roles, permissions, and feature access help keep customer operations separated.' },
  { title: 'Audit-ready activity', body: 'Sensitive administrative and operational changes can be preserved for review and accountability.' },
  { title: 'Credential handling', body: 'RMM, email, OIDC, and network credential workflows are designed around hidden and rotated secrets.' },
  { title: 'Production readiness checks', body: 'Health checks, regression tests, security operations, and deployment docs support disciplined releases.' },
];

export default function LandingPageClient() {
  const { isAuthenticated } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [liveOperations, setLiveOperations] = useState<LiveOperations>({
    openTickets: 0,
    onRoute: 0,
    slaMet: 100,
    activities: [],
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const loadOperations = () => {
      fetch('/v1/public/operations')
        .then((response) => response.ok ? response.json() : null)
        .then((body) => {
          const data = body?.data || body;
          if (data) setLiveOperations(data);
        })
        .catch(() => {});
    };
    loadOperations();
    const interval = window.setInterval(loadOperations, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const planHref = useMemo(
    () => (planName: string) =>
      planName === 'Free' || planName === 'Starter'
        ? `/register?plan=${encodeURIComponent(planName)}`
        : isAuthenticated
        ? `/billing?plan=${encodeURIComponent(planName)}`
        : `/register-business?plan=${encodeURIComponent(planName)}`,
    [isAuthenticated],
  );

  return (
    <>
    <main className="min-h-screen bg-white text-gray-950">
      <nav className={`fixed inset-x-0 top-0 z-50 transition ${scrolled ? 'bg-white/[0.92] shadow-sm backdrop-blur' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-gray-950">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-950 text-white">
              <Wrench className="h-4 w-4" aria-hidden="true" />
            </span>
            FieldserviceIT
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/about" className="hidden text-sm font-bold text-gray-800 hover:text-gray-950 md:inline">
              About
            </Link>
            <Link href="/contact" className="hidden text-sm font-bold text-gray-800 hover:text-gray-950 md:inline">
              Contact
            </Link>
            <a href="#features" className="hidden text-sm font-medium text-gray-700 hover:text-gray-950 lg:inline">
              Features
            </a>
            <a href="#pricing" className="hidden text-sm font-medium text-gray-700 hover:text-gray-950 lg:inline">
              Pricing
            </a>
            <Link href="/submit-ticket" className="hidden text-sm font-bold text-gray-800 hover:text-gray-950 sm:inline">
              Submit ticket
            </Link>
            <Link href="/login" className="text-sm font-bold text-gray-800 hover:text-gray-950">
              Sign in
            </Link>
            <TrackedLink
              href={isAuthenticated ? '/billing' : '/register'}
              eventName="cta_click"
              eventLabel="get_started"
              eventLocation="nav"
              className="rounded bg-gray-950 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Get started
            </TrackedLink>
          </div>
        </div>
      </nav>

      <section className="relative flex min-h-[76vh] items-end overflow-hidden">
        <Image
          src="/images/fieldservice-hero.png"
          alt="Service operations team coordinating tickets, dispatch, and asset workflows"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/[0.9] to-white/[0.35]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-5 pb-10 pt-24 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(340px,0.55fr)] lg:pb-12">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/80 px-3 py-1 text-sm font-medium text-gray-700 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              ITSM, dispatch, assets, and billing in one SQL-backed platform
            </p>
            <h1 className="text-5xl font-bold tracking-tight text-gray-950 sm:text-6xl">
              FieldserviceIT
            </h1>
            <p className="mt-4 max-w-xl text-lg font-medium leading-8 text-gray-800">
              A practical service desk for MSPs and field teams that need tickets, technician dispatch, asset context,
              reporting, and customer-facing intake without stitching five tools together.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href={isAuthenticated ? '/billing' : '/register'}
                eventName="pricing_click"
                eventLabel="get_started"
                eventLocation="hero"
                className="inline-flex items-center justify-center gap-2 rounded bg-gray-950 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TrackedLink>
              <TrackedLink
                href="/submit-ticket"
                eventName="cta_click"
                eventLabel="open_customer_portal"
                eventLocation="hero"
                className="inline-flex items-center justify-center rounded border border-gray-300 bg-white/80 px-6 py-3 text-sm font-semibold text-gray-900 backdrop-blur hover:bg-white"
              >
                Open customer portal
              </TrackedLink>
            </div>
          </div>

          <div className="hidden self-end rounded border border-white/70 bg-white/[0.82] p-5 shadow-xl backdrop-blur lg:block">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <span className="text-sm font-semibold text-gray-950">Today&apos;s operations Live</span>
              <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Live</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                [String(liveOperations.openTickets), 'Open tickets'],
                [String(liveOperations.onRoute), 'On route'],
                [`${liveOperations.slaMet}%`, 'SLA met'],
              ].map(([value, label]) => (
                <div key={label} className="rounded border border-gray-200 bg-white p-3">
                  <div className="text-2xl font-semibold text-gray-950">{value}</div>
                  <div className="mt-1 text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {(liveOperations.activities.length
                ? liveOperations.activities.map((item) => item.label)
                : ['Waiting for current operations activity']).map((item) => (
                <div key={item} className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white px-5 py-8 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {[
            ['10 min', 'to capture a request, route it, and notify the assigned technician'],
            ['1 view', 'for ticket history, assets, dispatch notes, photos, and customer context'],
            ['3 plans', 'Free and Starter for individuals, Business for companies'],
          ].map(([value, label]) => (
            <div key={value} className="border-l-2 border-emerald-500 pl-4">
              <div className="text-3xl font-semibold text-gray-950">{value}</div>
              <p className="mt-1 text-sm leading-6 text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="px-5 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-emerald-700">Operations</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-gray-950 sm:text-4xl">
              Built for repeat service work, not just ticket storage.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded border border-gray-200 bg-white p-5">
                  <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                  <h3 className="mt-5 text-base font-semibold text-gray-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50 px-5 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-700">Use cases</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-gray-950 sm:text-4xl">
                One platform for service teams that work beyond the desk.
              </h2>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                FieldserviceIT connects the front door of support with the work that happens after assignment:
                technician schedules, asset records, monitoring context, and customer communication.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
              {useCases.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded border border-gray-200 bg-white p-5">
                    <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                    <h3 className="mt-5 text-base font-semibold text-gray-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Why teams switch</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-gray-950 sm:text-4xl">
              Replace scattered handoffs with a shared service record.
            </h2>
            <div className="mt-8 grid gap-3">
              {differentiators.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded border border-gray-200 bg-white p-4">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <p className="text-sm leading-6 text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded border border-gray-200 bg-gray-950 p-6 text-white">
            <FileText className="h-6 w-6 text-emerald-300" aria-hidden="true" />
            <h3 className="mt-5 text-2xl font-semibold tracking-normal">From request to invoice-ready work.</h3>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              Capture the request, attach the asset, dispatch a technician, collect proof of work, notify the customer,
              and preserve the timeline for reporting or billing.
            </p>
            <TrackedLink
              href="/register-business"
              eventName="cta_click"
              eventLabel="register_business"
              eventLocation="workflow_summary"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded bg-white px-5 py-3 text-sm font-semibold text-gray-950 hover:bg-gray-100"
            >
              Register a business
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50 px-5 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-700">Trust and operations</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-gray-950 sm:text-4xl">
                Built with the controls service buyers expect.
              </h2>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                FieldserviceIT is positioned for operational teams that need visibility without losing control over
                customer data, credentials, permissions, and change history.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {trustSignals.map((item) => (
                <div key={item.title} className="rounded border border-gray-200 bg-white p-5">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                  <h3 className="mt-5 text-base font-semibold text-gray-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-gray-950 px-5 py-12 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase text-emerald-300">Payments</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                Choose a plan and move directly into checkout.
              </h2>
              <p className="mt-4 text-sm leading-6 text-gray-300">
                Free and Starter are for individuals. Companies have one plan: Business.
              </p>
            </div>
            <Link href="/login" className="text-sm font-medium text-gray-200 hover:text-white">
              Already have an account? Sign in
            </Link>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded border p-6 ${plan.featured ? 'border-emerald-400 bg-white text-gray-950' : 'border-white/15 bg-white/[0.06] text-white'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className={`mt-2 text-sm leading-6 ${plan.featured ? 'text-gray-600' : 'text-gray-300'}`}>{plan.summary}</p>
                  </div>
                  {plan.featured && <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">Popular</span>}
                </div>
                <div className="mt-6">
                  <span className="text-4xl font-semibold">${plan.price}</span>
                  <span className={plan.featured ? 'text-gray-500' : 'text-gray-400'}>/month</span>
                </div>
                <div className={`mt-5 space-y-2 text-sm ${plan.featured ? 'text-gray-700' : 'text-gray-200'}`}>
                  {[plan.users, plan.tickets, ...plan.features].map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <TrackedLink
                  href={planHref(plan.name)}
                  eventName="pricing_click"
                  eventLabel={`pricing_${plan.name.toLowerCase()}`}
                  eventLocation="pricing"
                  className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-sm font-semibold ${
                    plan.featured ? 'bg-gray-950 text-white hover:bg-gray-800' : 'bg-white text-gray-950 hover:bg-gray-100'
                  }`}
                >
                  {plan.name === 'Business' ? 'Checkout Business' : plan.price === 0 ? 'Start free' : 'Get started'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </TrackedLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-emerald-700">Questions</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-gray-950 sm:text-4xl">
              Answers for buyers comparing ITSM and field service tools.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {faqs.map((item) => (
              <div key={item.question} className="rounded border border-gray-200 bg-white p-5">
                <CircleHelp className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <h3 className="mt-5 text-base font-semibold text-gray-950">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 px-5 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase text-emerald-700">Explore workflows</p>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              ['/msp-ticketing-software', 'MSP ticketing software'],
              ['/field-service-management-software', 'Field service management'],
              ['/it-asset-management-software', 'IT asset management'],
              ['/technician-dispatch-software', 'Technician dispatch'],
            ].map(([href, label]) => (
              <TrackedLink
                key={href}
                href={href}
                eventName="cta_click"
                eventLabel={label}
                eventLocation="workflow_links"
                className="inline-flex items-center justify-between gap-3 rounded border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                {label}
                <ArrowRight className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              </TrackedLink>
            ))}
          </div>
        </div>
      </section>
    </main>
    <Footer />
    </>
  );
}
