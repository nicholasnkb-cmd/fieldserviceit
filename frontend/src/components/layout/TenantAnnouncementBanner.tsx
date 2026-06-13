'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

const tones: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  critical: 'border-red-200 bg-red-50 text-red-900',
};

export function TenantAnnouncementBanner() {
  const company = useAuthStore((state) => state.company);
  const banner = company?.settings?.customization?.banner;
  const storageKey = `tenant-banner-dismissed:${company?.id || 'none'}:${banner?.text || ''}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(storageKey) === 'true');
  }, [storageKey]);

  if (!banner?.enabled || !banner.text || dismissed) return null;
  return (
    <div className={`flex items-center justify-center gap-3 border-b px-4 py-2 text-sm ${tones[banner.tone] || tones.info}`}>
      <span>{banner.text}</span>
      {banner.linkUrl && (
        <a href={banner.linkUrl} className="font-semibold underline" target={banner.linkUrl.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {banner.linkLabel || 'Learn more'}
        </a>
      )}
      {banner.dismissible && (
        <button
          type="button"
          className="ml-auto font-semibold"
          aria-label="Dismiss announcement"
          onClick={() => {
            sessionStorage.setItem(storageKey, 'true');
            setDismissed(true);
          }}
        >
          Close
        </button>
      )}
    </div>
  );
}
