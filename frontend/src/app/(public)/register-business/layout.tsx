import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register Your Business',
  description: 'Create a FieldserviceIT company workspace for ticketing, dispatch, assets, RMM integrations, reporting, and customer service.',
  alternates: { canonical: '/register-business' },
  robots: { index: true, follow: true },
};

export default function RegisterBusinessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
