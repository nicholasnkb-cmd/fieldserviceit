import type { Metadata } from 'next';
import { SeoLandingPage, type SeoLandingPageContent } from '../../../components/marketing/SeoLandingPage';

export const metadata: Metadata = {
  title: 'Field Service Management Software for IT Teams',
  description:
    'Coordinate service requests, technician dispatch, job status, photos, signatures, assets, and customer updates with field service management software.',
  alternates: { canonical: '/field-service-management-software' },
  openGraph: {
    title: 'Field Service Management Software | FieldserviceIT',
    description: 'Connect service desk intake with technician dispatch, field proof, assets, and customer communication.',
    url: '/field-service-management-software',
    images: ['/images/fieldserviceit-social-card.png'],
  },
};

const content: SeoLandingPageContent = {
  eyebrow: 'Field service management software',
  title: 'Connect the service desk to every technician visit.',
  description:
    'Coordinate incoming work, technician assignments, travel status, onsite notes, photos, signatures, asset history, and customer communication without splitting the job across separate tools.',
  audience: 'IT service companies, field support teams, MSPs, and internal IT groups that send technicians to customer or office locations.',
  benefits: [
    { title: 'Dispatch tied to the ticket', body: 'Keep schedule, assignment, priority, customer, site, and service details attached to the original request.' },
    { title: 'Mobile technician updates', body: 'Give technicians a focused workflow for job status, notes, photos, signatures, and work completion.' },
    { title: 'Asset and site history', body: 'Connect field work to the device, location, network context, and prior service activity that shaped the visit.' },
    { title: 'Customer communication', body: 'Preserve updates and proof of work in a shared timeline that service staff and customers can follow.' },
  ],
  workflow: [
    'Receive and triage a service request with customer, site, urgency, and affected asset context.',
    'Assign the right technician and communicate the scheduled field work.',
    'Capture onsite progress, notes, photos, signatures, parts, and completion details.',
    'Return the completed work to the service timeline for customer updates, reporting, and billing.',
  ],
  faqs: [
    { question: 'Can technicians upload field photos and signatures?', answer: 'Yes. The field-service and upload workflows support dispatch photos and signatures.' },
    { question: 'Does field work stay connected to the ticket?', answer: 'Yes. Dispatch records and technician updates are designed to remain part of the service history.' },
    { question: 'Can customers submit requests online?', answer: 'Yes. Signed-in ticket intake and customer portal workflows give customers a direct service path.' },
  ],
  related: [
    { href: '/technician-dispatch-software', label: 'Technician dispatch' },
    { href: '/msp-ticketing-software', label: 'MSP ticketing' },
    { href: '/it-asset-management-software', label: 'IT asset management' },
  ],
};

export default function FieldServiceManagementSoftwarePage() {
  return <SeoLandingPage content={content} />;
}
