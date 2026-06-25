'use client';

import { ANALYTICS_CONSENT_KEY } from './Analytics';

export function AnalyticsPreferencesButton() {
  const reset = () => {
    localStorage.removeItem(ANALYTICS_CONSENT_KEY);
    window.location.reload();
  };

  return <button type="button" onClick={reset} className="font-semibold text-primary hover:underline">Review analytics preference</button>;
}
