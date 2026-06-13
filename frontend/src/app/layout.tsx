import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClientLayout } from './ClientLayout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://fieldserviceit.com'),
  title: {
    default: 'FieldserviceIT | ITSM and Field Service Software',
    template: '%s | FieldserviceIT',
  },
  description:
    'IT service management and field service software for tickets, technician dispatch, assets, customer portals, reporting, and billing.',
  applicationName: 'FieldserviceIT',
  authors: [{ name: 'FieldserviceIT' }],
  creator: 'FieldserviceIT',
  publisher: 'FieldserviceIT',
  category: 'business software',
  keywords: [
    'IT service management software',
    'field service management software',
    'MSP ticketing software',
    'ITSM platform',
    'technician dispatch software',
    'asset management software',
    'customer service portal',
  ],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  openGraph: {
    siteName: 'FieldserviceIT',
    type: 'website',
    images: [
      {
        url: '/images/fieldserviceit-social-card.png',
        width: 1200,
        height: 630,
        alt: 'FieldserviceIT service operations software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/fieldserviceit-social-card.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111827',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
