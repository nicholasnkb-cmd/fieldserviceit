'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trackProductEvent } from '../../lib/analytics';

export const ANALYTICS_CONSENT_KEY = 'fieldserviceit.analytics-consent';
type AnalyticsConsent = 'granted' | 'denied' | null;

export function Analytics() {
  const pathname = usePathname();
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;
  const [consent, setConsent] = useState<AnalyticsConsent>(null);
  const [ready, setReady] = useState(false);
  const [doNotTrack, setDoNotTrack] = useState(false);

  useEffect(() => {
    const dnt = ['1', 'yes'].includes(String(navigator.doNotTrack || '').toLowerCase());
    setDoNotTrack(dnt);
    setConsent(dnt ? 'denied' : readConsent());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!measurementId || !ready || doNotTrack || consent !== 'granted') return;
    window.gtag?.('config', measurementId, { page_path: pathname });
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/tickets') || pathname.startsWith('/assets') || pathname.startsWith('/integrations')) {
      trackProductEvent('app_page_view', { route: pathname });
    }
  }, [consent, doNotTrack, measurementId, pathname, ready]);

  const choose = (value: Exclude<AnalyticsConsent, null>) => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
    setConsent(value);
  };

  if (!measurementId || !ready || doNotTrack) return null;

  return (
    <>
      {consent === 'granted' && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
          <Script id="fieldserviceit-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${measurementId}', { send_page_view: false, anonymize_ip: true });
            `}
          </Script>
        </>
      )}
      {consent === null && (
        <aside className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-4 shadow-xl" aria-label="Analytics preference">
          <p className="text-sm font-semibold text-gray-950">Optional analytics</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">We use Google Analytics only with your permission to understand product usage and improve reliability. Declining does not affect core service features.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => choose('granted')} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">Allow analytics</button>
            <button type="button" onClick={() => choose('denied')} className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Decline</button>
            <a href="/privacy#analytics" className="px-2 py-2 text-sm font-semibold text-primary hover:underline">Learn more</a>
          </div>
        </aside>
      )}
    </>
  );
}

function readConsent(): AnalyticsConsent {
  try {
    const value = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}
