import { expect, test } from '@playwright/test';

const pages = [
  { path: '/login', name: 'login-page.png', heading: 'FieldserviceIT' },
  { path: '/about', name: 'about-page.png', heading: 'A practical command center for IT service and field operations.' },
  { path: '/privacy', name: 'privacy-page.png', heading: 'Privacy' },
];

test.describe('public visual baselines', () => {
  for (const item of pages) {
    test(`${item.path} matches its desktop baseline`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
      await page.goto(item.path, { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { level: 1, name: item.heading })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Footer navigation' })).toBeVisible();
      await expect(page).toHaveScreenshot(item.name, {
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
        // Chromium font rasterization differs slightly between Windows baseline generation and Linux CI.
        // Five percent still catches material layout/color changes while tolerating the measured 4% text-only variance.
        maxDiffPixelRatio: 0.05,
      });
    });
  }
});
