import { expect, test } from '@playwright/test';

test.describe('PWA mobile app readiness', () => {
  test('manifest exposes installable app metadata and mobile shortcuts', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.ok()).toBe(true);

    const manifest = await response.json();
    expect(manifest.name).toBe('FieldserviceIT');
    expect(manifest.start_url).toBe('/dashboard?source=pwa');
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('portrait');
    expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    );
    expect(manifest.shortcuts.map((shortcut: { name: string }) => shortcut.name)).toEqual(
      expect.arrayContaining(['Technician Mobile', 'Tickets', 'Dispatch']),
    );
  });

  test('offline page and service worker are available', async ({ request }) => {
    const offline = await request.get('/offline.html');
    expect(offline.ok()).toBe(true);
    await expect(offline.text()).resolves.toContain('You are offline');

    const worker = await request.get('/sw.js');
    expect(worker.ok()).toBe(true);
    await expect(worker.text()).resolves.toContain('/offline.html');
  });

  test('public pages do not overflow on a technician-sized viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login');

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  });
});
