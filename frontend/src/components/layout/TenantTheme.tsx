'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

function hexToHsl(hex?: string) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;
  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
    if (max === green) hue = (blue - red) / delta + 2;
    if (max === blue) hue = (red - green) / delta + 4;
    hue /= 6;
  }
  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

export function TenantTheme() {
  const company = useAuthStore((state) => state.company);

  useEffect(() => {
    const root = document.documentElement;
    const branding = company?.branding || {};
    if (company) root.dataset.tenantTheme = 'true';
    else delete root.dataset.tenantTheme;
    const variables: Record<string, string | null> = {
      '--primary': hexToHsl(branding.primaryColor),
      '--ring': hexToHsl(branding.primaryColor),
      '--secondary': hexToHsl(branding.secondaryColor),
      '--accent': hexToHsl(branding.accentColor),
      '--background': hexToHsl(branding.backgroundColor),
      '--card': hexToHsl(branding.surfaceColor),
      '--popover': hexToHsl(branding.surfaceColor),
      '--foreground': hexToHsl(branding.textColor),
      '--card-foreground': hexToHsl(branding.textColor),
      '--radius': branding.borderRadius === undefined ? null : `${branding.borderRadius}px`,
    };
    Object.entries(variables).forEach(([name, value]) => {
      if (value) root.style.setProperty(name, value);
      else root.style.removeProperty(name);
    });
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-tenant-favicon]');
    if (branding.faviconUrl) {
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.dataset.tenantFavicon = 'true';
        document.head.appendChild(favicon);
      }
      favicon.href = branding.faviconUrl;
    } else if (favicon) {
      favicon.remove();
    }
  }, [company]);

  return null;
}
