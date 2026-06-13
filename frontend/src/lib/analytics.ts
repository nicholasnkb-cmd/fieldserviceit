'use client';

export type MarketingEvent =
  | 'cta_click'
  | 'pricing_click'
  | 'seo_landing_cta'
  | 'contact_click';

type EventProperties = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackMarketingEvent(event: MarketingEvent, properties: EventProperties = {}) {
  if (typeof window === 'undefined') return;

  const detail = {
    event,
    page_path: window.location.pathname,
    ...properties,
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(detail);
  window.dispatchEvent(new CustomEvent('fieldserviceit:marketing', { detail }));
}
