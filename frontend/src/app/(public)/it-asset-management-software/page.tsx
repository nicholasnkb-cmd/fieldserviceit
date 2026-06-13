import type { Metadata } from 'next';
import { SeoLandingPage, type SeoLandingPageContent } from '../../../components/marketing/SeoLandingPage';

export const metadata: Metadata = {
  title: 'IT Asset Management Software with Service Context',
  description:
    'Track IT assets, owners, locations, lifecycle details, network context, service history, and related tickets in one operational CMDB workspace.',
  alternates: { canonical: '/it-asset-management-software' },
  openGraph: {
    title: 'IT Asset Management Software | FieldserviceIT',
    description: 'Connect assets, service history, tickets, network context, locations, and technician work.',
    url: '/it-asset-management-software',
    images: ['/images/fieldserviceit-social-card.png'],
  },
};

const content: SeoLandingPageContent = {
  eyebrow: 'IT asset management software',
  title: 'Give every IT asset a usable service history.',
  description:
    'FieldserviceIT connects asset records to tickets, locations, users, network context, technician work, monitoring activity, and operational history so teams can troubleshoot with context.',
  audience: 'MSPs and internal IT teams responsible for endpoints, servers, printers, switches, phones, cloud resources, sites, and device lifecycle records.',
  benefits: [
    { title: 'Connected CMDB records', body: 'Track equipment details, ownership, location, state, and relationships without isolating assets from service activity.' },
    { title: 'Ticket and maintenance history', body: 'See the incidents, requests, dispatch work, maintenance activity, and timeline associated with an asset.' },
    { title: 'Network and topology context', body: 'Relate devices to monitored network information, site records, topology views, alerts, and credential-controlled actions.' },
    { title: 'Lifecycle accountability', body: 'Preserve changes, assignments, compliance context, and administrative history as equipment moves through the organization.' },
  ],
  workflow: [
    'Create or synchronize the asset record with company, user, site, type, and lifecycle details.',
    'Connect requests, incidents, alerts, and maintenance activity to the affected equipment.',
    'Give technicians service history and network context before they investigate or visit the site.',
    'Use the resulting timeline for lifecycle decisions, reporting, replacement planning, and audit review.',
  ],
  faqs: [
    { question: 'What asset types can be tracked?', answer: 'The platform supports computers, servers, printers, switches, IP phones, cloud resources, and other operational equipment.' },
    { question: 'Can assets connect to network topology?', answer: 'Yes. The application includes network and topology modules for sites, devices, links, layouts, and shared views.' },
    { question: 'Can tickets be associated with assets?', answer: 'Yes. Asset context and service history are designed to connect directly to ticket workflows.' },
  ],
  related: [
    { href: '/msp-ticketing-software', label: 'MSP ticketing' },
    { href: '/field-service-management-software', label: 'Field service management' },
    { href: '/technician-dispatch-software', label: 'Technician dispatch' },
  ],
};

export default function ItAssetManagementSoftwarePage() {
  return <SeoLandingPage content={content} />;
}
