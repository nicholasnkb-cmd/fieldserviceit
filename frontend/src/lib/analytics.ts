'use client';

export type MarketingEvent =
  | 'cta_click'
  | 'pricing_click'
  | 'seo_landing_cta'
  | 'contact_click';

export type ProductEvent =
  | 'app_page_view'
  | 'onboarding_step_completed'
  | 'rmm_test'
  | 'rmm_sync'
  | 'rmm_configuration_saved';

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

export function trackProductEvent(event: ProductEvent, properties: EventProperties = {}) {
  if (typeof window === 'undefined' || navigator.doNotTrack === '1') return;
  const detail = { event, page_path: window.location.pathname, ...properties };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(detail);
  window.gtag?.('event', event, properties);
  window.dispatchEvent(new CustomEvent('fieldserviceit:product', { detail }));
}
