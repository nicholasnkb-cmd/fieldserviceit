import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FieldserviceIT',
    short_name: 'FieldserviceIT',
    description: 'IT service management and field service operations software.',
    id: '/',
    start_url: '/dashboard?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#111827',
    categories: ['business', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icon-192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Technician Mobile',
        short_name: 'Mobile',
        description: 'Open the field technician workflow.',
        url: '/technician-mobile?source=pwa',
        icons: [{ src: '/apple-icon', sizes: '180x180', type: 'image/png' }],
      },
      {
        name: 'Tickets',
        short_name: 'Tickets',
        description: 'Review and update service tickets.',
        url: '/tickets?source=pwa',
        icons: [{ src: '/apple-icon', sizes: '180x180', type: 'image/png' }],
      },
      {
        name: 'Dispatch',
        short_name: 'Dispatch',
        description: 'Manage field service dispatches.',
        url: '/dispatch?source=pwa',
        icons: [{ src: '/apple-icon', sizes: '180x180', type: 'image/png' }],
      },
    ],
    screenshots: [
      {
        src: '/images/fieldserviceit-social-card.png',
        sizes: '1200x630',
        type: 'image/png',
        form_factor: 'wide',
      },
    ],
  };
}
