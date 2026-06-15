/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  output: 'standalone',
  distDir: process.env.NEXT_DIST_DIR || '.next',
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: `${process.env.API_PROXY_TARGET || 'http://localhost:4000'}/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.fieldserviceit.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
    ],
  },
  async headers() {
    const securityHeaders = [
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "form-action 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://*.fieldserviceit.com https://*.amazonaws.com https://www.google-analytics.com",
          "font-src 'self' data:",
          "connect-src 'self' https://api.fieldserviceit.com wss://api.fieldserviceit.com https://www.google-analytics.com https://region1.google-analytics.com",
          'upgrade-insecure-requests',
        ].join('; '),
      },
    ];

    const publicCachePaths = [
      '/',
      '/about',
      '/contact',
      '/field-service-management-software',
      '/it-asset-management-software',
      '/legal-disclaimer',
      '/msp-ticketing-software',
      '/privacy',
      '/security-overview',
      '/status',
      '/technician-dispatch-software',
    ];

    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      ...publicCachePaths.map((source) => ({
        source,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
          },
        ],
      })),
    ];
  },
};

module.exports = nextConfig;
