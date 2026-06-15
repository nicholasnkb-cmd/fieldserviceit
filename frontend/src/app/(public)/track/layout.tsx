import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track a Service Request',
  description: 'Check the current status and service history of a FieldserviceIT ticket.',
  alternates: { canonical: '/track' },
  robots: { index: false, follow: true },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
