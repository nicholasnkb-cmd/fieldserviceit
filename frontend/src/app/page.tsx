import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';
import { PRODUCT_CATALOG } from '../config/product-catalog.generated';

export const metadata: Metadata = {
  title: 'MSP Service Operations Around Your RMM | FieldserviceIT',
  description:
    'Connect service requests, assets, technicians, field work, and RMM context in one tenant-aware operations workspace for small MSP teams.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'FieldserviceIT | MSP Service Operations Around Your RMM',
    description:
      'Keep the RMM you prefer and connect tickets, assets, dispatch, client updates, and governed actions.',
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
      name: 'Bright Mind and Bytes LLC',
      legalName: 'Bright Mind and Bytes LLC',
      alternateName: 'FieldserviceIT',
      url: 'https://fieldserviceit.com',
      email: 'sales@fieldserviceit.com',
      description: 'Service operations software for small managed service providers.',
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
      offers: PRODUCT_CATALOG.plans.map((plan) => ({
        '@type': 'Offer',
        name: plan.name,
        price: String(plan.monthlyPrice),
        priceCurrency: PRODUCT_CATALOG.currency,
      })),
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
