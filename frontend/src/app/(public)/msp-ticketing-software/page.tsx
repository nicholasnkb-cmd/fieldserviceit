import type { Metadata } from 'next';
import { SeoLandingPage, type SeoLandingPageContent } from '../../../components/marketing/SeoLandingPage';

export const metadata: Metadata = {
  title: 'MSP Ticketing Software for Service Operations',
  description:
    'Manage customer tickets, technician assignments, assets, RMM context, SLAs, and audit history with multi-tenant MSP ticketing software.',
  alternates: { canonical: '/msp-ticketing-software' },
  openGraph: {
    title: 'MSP Ticketing Software | FieldserviceIT',
    description: 'Multi-tenant ticketing, dispatch, assets, RMM context, and customer workflows for managed service providers.',
    url: '/msp-ticketing-software',
    images: ['/images/fieldserviceit-social-card.png'],
  },
};

const content: SeoLandingPageContent = {
  eyebrow: 'MSP ticketing software',
  title: 'Run customer support and field service from one MSP ticketing platform.',
  description:
    'FieldserviceIT connects ticket intake, technician work, customer communication, assets, monitoring context, billing records, and reporting across separate client workspaces.',
  audience: 'Managed service providers supporting multiple customers, sites, devices, service agreements, and technician teams.',
  benefits: [
    { title: 'Multi-tenant customer workspaces', body: 'Keep company users, tickets, assets, settings, and permissions separated while maintaining authorized platform oversight.' },
    { title: 'RMM-aware service context', body: 'Bring endpoint and network alerts into the service workflow so technicians start with useful device and site context.' },
    { title: 'SLA and queue visibility', body: 'Prioritize work, monitor service risk, and preserve assignment and resolution history across customer queues.' },
    { title: 'Customer-facing intake', body: 'Offer signed-in request submission and customer tracking paths without exposing the internal technician workspace.' },
  ],
  workflow: [
    'Capture a customer request or convert monitoring context into a service ticket.',
    'Route the work by company, site, priority, category, technician, and SLA requirements.',
    'Connect the ticket to affected assets, history, dispatch details, notes, photos, and customer updates.',
    'Close the work with an auditable timeline that supports reporting and invoice preparation.',
  ],
  faqs: [
    { question: 'Can each MSP customer have a separate workspace?', answer: 'Yes. The platform is designed around company-level tenant boundaries with role and permission controls.' },
    { question: 'Does it support RMM integrations?', answer: 'The application includes RMM integration workflows for ConnectWise, Datto, and NinjaOne providers.' },
    { question: 'Can field technicians work from the same tickets?', answer: 'Yes. Dispatch and technician-mobile workflows connect field updates to the service record.' },
  ],
  related: [
    { href: '/field-service-management-software', label: 'Field service management' },
    { href: '/it-asset-management-software', label: 'IT asset management' },
    { href: '/technician-dispatch-software', label: 'Technician dispatch' },
  ],
};

export default function MspTicketingSoftwarePage() {
  return <SeoLandingPage content={content} />;
}
