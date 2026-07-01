const { execFileSync } = require('node:child_process');
const { version } = require('./package.json');
const { withSentryConfig } = require('@sentry/nextjs');

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
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'fieldserviceit',
  project: process.env.SENTRY_PROJECT || 'javascript-nextjs',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  telemetry: false,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
  release: {
    name: frontendCommit,
    create: Boolean(process.env.SENTRY_AUTH_TOKEN),
    finalize: Boolean(process.env.SENTRY_AUTH_TOKEN),
  },
  treeshake: { removeDebugLogging: true },
});
