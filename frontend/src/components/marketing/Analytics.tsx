'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { trackProductEvent } from '../../lib/analytics';

export function Analytics() {
  const pathname = usePathname();
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    if (navigator.doNotTrack === '1') return;
    if (measurementId && window.gtag) window.gtag('config', measurementId, { page_path: pathname });
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/tickets') || pathname.startsWith('/assets') || pathname.startsWith('/integrations')) {
      trackProductEvent('app_page_view', { route: pathname });
    }
  }, [measurementId, pathname]);

  if (!measurementId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="fieldserviceit-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
