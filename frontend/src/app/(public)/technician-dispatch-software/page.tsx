import type { Metadata } from 'next';
import { SeoLandingPage, type SeoLandingPageContent } from '../../../components/marketing/SeoLandingPage';

export const metadata: Metadata = {
  title: 'Technician Dispatch Software for IT Field Service',
  description:
    'Assign technicians, track field status, connect service details, collect proof of work, and keep customers updated with technician dispatch software.',
  alternates: { canonical: '/technician-dispatch-software' },
  openGraph: {
    title: 'Technician Dispatch Software | FieldserviceIT',
    description: 'Schedule and track IT field work with connected tickets, assets, status updates, photos, and signatures.',
    url: '/technician-dispatch-software',
    images: ['/images/fieldserviceit-social-card.png'],
  },
};

const content: SeoLandingPageContent = {
  eyebrow: 'Technician dispatch software',
  title: 'Send technicians into the field with the full service context.',
  description:
    'Assign work, track route and job status, share customer and asset details, capture onsite proof, and return every update to the service timeline.',
  audience: 'Dispatchers, service coordinators, field technicians, MSP teams, and IT departments managing onsite support work.',
  benefits: [
    { title: 'Assignment clarity', body: 'Give technicians the customer, site, ticket, priority, affected asset, schedule, and service notes before they leave.' },
    { title: 'Field status visibility', body: 'Track assigned, en route, onsite, and completed work so coordinators understand technician capacity and progress.' },
    { title: 'Proof of work', body: 'Collect notes, photos, signatures, parts activity, and completion details from the field workflow.' },
    { title: 'Shared service timeline', body: 'Return technician updates to the ticket so support staff, administrators, and customers have one history.' },
  ],
  workflow: [
    'Review the service request, priority, location, asset, and technician requirements.',
    'Assign and schedule the dispatch with the details needed for travel and onsite work.',
    'Track field progress and collect notes, photos, signatures, and completion evidence.',
    'Close the dispatch into the ticket timeline for customer communication, reporting, and follow-up.',
  ],
  faqs: [
    { question: 'Is there a mobile technician workflow?', answer: 'Yes. The application includes a technician-mobile workspace designed for field updates.' },
    { question: 'Can dispatch work include photos and signatures?', answer: 'Yes. Dedicated upload workflows support dispatch photos and customer signatures.' },
    { question: 'Does dispatch connect with assets and tickets?', answer: 'Yes. Dispatch is part of the broader service workflow, keeping field activity connected to the request and asset context.' },
  ],
  related: [
    { href: '/field-service-management-software', label: 'Field service management' },
    { href: '/msp-ticketing-software', label: 'MSP ticketing' },
    { href: '/it-asset-management-software', label: 'IT asset management' },
  ],
};

export default function TechnicianDispatchSoftwarePage() {
  return <SeoLandingPage content={content} />;
}
