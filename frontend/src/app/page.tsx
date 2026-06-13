import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';

export const metadata: Metadata = {
  title: 'IT Service Management and Field Service Software | FieldserviceIT',
  description:
    'Run ticketing, technician dispatch, asset management, customer intake, reporting, and billing in one field service IT platform for MSPs and internal IT teams.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'FieldserviceIT | ITSM and Field Service Software',
    description:
      'One operational workspace for service tickets, field dispatch, assets, customers, reporting, and billing.',
    url: '/',
    type: 'website',
    images: [
      {
        url: '/images/fieldserviceit-social-card.png',
        alt: 'FieldserviceIT service operations workspace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FieldserviceIT | ITSM and Field Service Software',
    description: 'Ticketing, dispatch, assets, reporting, and customer service workflows in one platform.',
    images: ['/images/fieldserviceit-social-card.png'],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://fieldserviceit.com/#organization',
      name: 'FieldserviceIT',
      url: 'https://fieldserviceit.com',
      email: 'sales@fieldserviceit.com',
      description: 'IT service management and field service operations software for MSPs and internal IT teams.',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://fieldserviceit.com/#software',
      name: 'FieldserviceIT',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'IT Service Management Software',
      operatingSystem: 'Web',
      url: 'https://fieldserviceit.com',
      description:
        'A multi-tenant ITSM and field service platform for ticketing, dispatch, asset management, customer portals, reporting, and billing.',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          name: 'Starter',
          price: '29',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          name: 'Business',
          price: '79',
          priceCurrency: 'USD',
        },
      ],
      publisher: {
        '@id': 'https://fieldserviceit.com/#organization',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Who is FieldserviceIT built for?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'FieldserviceIT is built for managed service providers, internal IT teams, field technicians, and service operations teams.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does FieldserviceIT combine ticketing and field dispatch?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Teams can manage service tickets, assign technicians, track job status, and collect field notes, photos, and signatures in one workflow.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can customers submit and track service requests?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Signed-in customers can submit and track service requests while company workspaces remain separated.',
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPageClient />
    </>
  );
}
