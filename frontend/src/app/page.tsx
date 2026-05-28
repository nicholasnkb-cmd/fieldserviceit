'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  HardDrive,
  Headphones,
  MapPinned,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const plans = [
  {
    name: 'Free',
    price: 0,
    summary: 'For individuals submitting and tracking their own service requests.',
    users: '1 individual',
    tickets: '50 tickets per month',
    features: ['Ticket intake', 'Email notifications', 'Public request form'],
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

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
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
    <main className="min-h-screen bg-white text-gray-950">
      <nav className={`fixed inset-x-0 top-0 z-50 transition ${scrolled ? 'bg-white/92 shadow-sm backdrop-blur' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-gray-950">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-950 text-white">
              <Wrench className="h-4 w-4" aria-hidden="true" />
            </span>
            FieldserviceIT
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/submit-ticket" className="hidden text-sm font-medium text-gray-700 hover:text-gray-950 sm:inline">
              Submit ticket
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-950">
              Sign in
            </Link>
            <Link
              href={isAuthenticated ? '/billing' : '/register'}
              className="rounded bg-gray-950 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative flex min-h-[92vh] items-end overflow-hidden">
        <Image
          src="/images/fieldservice-hero.png"
          alt="Service operations team coordinating tickets, dispatch, and asset workflows"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/82 to-white/18" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-5 pb-14 pt-28 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(340px,0.55fr)] lg:pb-20">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/80 px-3 py-1 text-sm font-medium text-gray-700 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              ITSM, dispatch, assets, and billing in one SQL-backed platform
            </p>
            <h1 className="text-5xl font-semibold tracking-normal text-gray-950 sm:text-6xl lg:text-7xl">
              FieldserviceIT
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-gray-700">
              A practical service desk for MSPs and field teams that need tickets, technician dispatch, asset context,
              reporting, and customer-facing intake without stitching five tools together.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={planHref('Starter')}
                className="inline-flex items-center justify-center gap-2 rounded bg-gray-950 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Start Starter
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/submit-ticket"
                className="inline-flex items-center justify-center rounded border border-gray-300 bg-white/80 px-6 py-3 text-sm font-semibold text-gray-900 backdrop-blur hover:bg-white"
              >
                Open customer portal
              </Link>
            </div>
          </div>

          <div className="hidden self-end rounded border border-white/70 bg-white/82 p-5 shadow-xl backdrop-blur lg:block">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <span className="text-sm font-semibold text-gray-950">Today&apos;s operations</span>
              <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Live</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                ['42', 'Open tickets'],
                ['11', 'On route'],
                ['97%', 'SLA met'],
              ].map(([value, label]) => (
                <div key={label} className="rounded border border-gray-200 bg-white p-3">
                  <div className="text-2xl font-semibold text-gray-950">{value}</div>
                  <div className="mt-1 text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {['Critical printer outage assigned', 'RMM alert converted to ticket', 'Invoice-ready time entry captured'].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white px-5 py-12 sm:px-6">
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

      <section className="px-5 py-20 sm:px-6">
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

      <section id="pricing" className="bg-gray-950 px-5 py-20 text-white sm:px-6">
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
                className={`rounded border p-6 ${plan.featured ? 'border-emerald-400 bg-white text-gray-950' : 'border-white/15 bg-white/6 text-white'}`}
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
                <Link
                  href={planHref(plan.name)}
                  className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-sm font-semibold ${
                    plan.featured ? 'bg-gray-950 text-white hover:bg-gray-800' : 'bg-white text-gray-950 hover:bg-gray-100'
                  }`}
                >
                  {plan.name === 'Business' ? 'Checkout Business' : plan.price === 0 ? 'Start free' : 'Start Starter'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
