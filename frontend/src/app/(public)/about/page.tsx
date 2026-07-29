import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, ClipboardCheck, Network, ShieldCheck, UsersRound, Wrench, type LucideIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Our IT Service Management Platform',
  description:
    'Learn how FieldserviceIT helps MSPs and internal IT teams manage tickets, field technicians, assets, networks, customers, and audit-ready operations.',
  alternates: {
    canonical: '/about',
  },
};

const principles = [
  {
    title: 'Built around real operations',
    body: 'FieldserviceIT is designed for the daily rhythm of service desks, field technicians, MSP teams, and internal IT groups.',
    icon: Wrench,
  },
  {
    title: 'Tenant-aware by design',
    body: 'Businesses, users, roles, assets, tickets, integrations, and audit records are separated so each organization can run its own workspace.',
    icon: Building2,
  },
  {
    title: 'Network and endpoint context',
    body: 'Tickets can connect to monitored equipment, RMM integrations, config history, alerts, and site-level infrastructure records.',
    icon: Network,
  },
  {
    title: 'Control with accountability',
    body: 'Role controls, super admin oversight, favorites, audit logging, and feature toggles help keep the platform manageable as it grows.',
    icon: ShieldCheck,
  },
];

const audiences: Array<{ title: string; body: string; icon: LucideIcon }> = [
  {
    title: 'MSPs',
    body: 'Manage customers, sites, tickets, technicians, alerts, and business controls from one place.',
    icon: UsersRound,
  },
  {
    title: 'Internal IT',
    body: 'Support employees, devices, networks, vendors, and locations with a shared operating record.',
    icon: ClipboardCheck,
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white text-gray-950">
      <section className="border-b border-gray-200 px-5 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-emerald-700">About FieldserviceIT</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-gray-950 sm:text-5xl">
              A practical command center for IT service and field operations.
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-700">
              FieldserviceIT brings ticketing, dispatch, asset tracking, customer intake, network monitoring, integrations,
              and business administration into one workspace for teams that need to move quickly without losing accountability.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register-business"
                className="inline-flex items-center justify-center gap-2 rounded bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Register a business
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            ['Multi-tenant', 'Independent workspaces for each business, with super admin visibility where authorized.'],
            ['Operations-first', 'Tickets, dispatch, assets, billing, monitoring, and reporting built around service workflows.'],
            ['Audit-ready', 'Controls and history for sensitive changes, credentials, integrations, and user actions.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded border border-gray-200 bg-white p-5">
              <h2 className="text-base font-semibold text-gray-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-950 px-5 py-16 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-emerald-300">What we care about</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">Less tool-hopping. More useful context.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {principles.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded border border-white/15 bg-white/[0.06] p-5">
                  <Icon className="h-5 w-5 text-emerald-300" aria-hidden="true" />
                  <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-300">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Who it serves</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-gray-950">
              Teams responsible for keeping technology working.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {audiences.map(({ title, body, icon: Icon }) => {
              return (
                <div key={title} className="rounded border border-gray-200 p-5">
                  <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                  <h3 className="mt-5 text-base font-semibold text-gray-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
