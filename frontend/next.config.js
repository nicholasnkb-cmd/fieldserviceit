const { execFileSync } = require('node:child_process');
const { version } = require('./package.json');

function gitCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: __dirname,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

const frontendVersion = process.env.FRONTEND_VERSION || process.env.APP_VERSION || version;
const frontendCommit = process.env.FRONTEND_COMMIT || process.env.GITHUB_SHA || gitCommit();

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  output: 'standalone',
  distDir: process.env.NEXT_DIST_DIR || '.next',
  outputFileTracingRoot: __dirname,
  env: {
    NEXT_PUBLIC_APP_VERSION: frontendVersion,
    NEXT_PUBLIC_APP_COMMIT: frontendCommit,
  },
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
        value: 'camera=(self), microphone=(), geolocation=(self), payment=(), usb=()',
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
          "connect-src 'self' https://api.fieldserviceit.com wss://api.fieldserviceit.com https://www.google-analytics.com https://region1.google-analytics.com https://*.ingest.sentry.io",
          'upgrade-insecure-requests',
        ].join('; '),
      },
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
