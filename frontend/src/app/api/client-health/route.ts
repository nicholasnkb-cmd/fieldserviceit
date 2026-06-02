import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'frontend',
    timestamp: new Date().toISOString(),
    version: process.env.FRONTEND_VERSION || process.env.APP_VERSION || process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
    runtime: 'next',
  });
}
