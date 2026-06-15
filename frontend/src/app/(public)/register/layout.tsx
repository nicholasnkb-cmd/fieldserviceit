import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create an Individual Account',
  description: 'Create a FieldserviceIT account to submit, track, and manage personal service requests.',
  alternates: { canonical: '/register' },
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
