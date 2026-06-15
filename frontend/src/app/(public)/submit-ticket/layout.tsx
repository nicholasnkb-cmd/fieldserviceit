import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submit a Service Request',
  description: 'Submit an IT or field service request and receive a ticket number for tracking.',
  alternates: { canonical: '/submit-ticket' },
  robots: { index: false, follow: true },
};

export default function SubmitTicketLayout({ children }: { children: React.ReactNode }) {
  return children;
}
