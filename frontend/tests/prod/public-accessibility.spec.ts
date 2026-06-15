import { expect, test } from '@playwright/test';

const publicPages = [
  ['/', 'FieldserviceIT'],
  ['/about', 'A practical command center for IT service and field operations.'],
  ['/contact', 'Get help with FieldserviceIT.'],
  ['/security-overview', 'Security overview'],
  ['/privacy', 'Privacy'],
  ['/status', 'FieldserviceIT service status'],
];

for (const [path, heading] of publicPages) {
  test(`${path} has a usable document structure`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(/FieldserviceIT/);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('a:not([aria-label])').filter({ hasText: /^\s*$/ })).toHaveCount(0);
  });
}

test('homepage has no horizontal overflow on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
});

test('login form is keyboard reachable and clearly labeled', async ({ page }) => {
  await page.goto('/login');
  let reachedEmail = false;
  for (let index = 0; index < 20; index += 1) {
    await page.keyboard.press('Tab');
    reachedEmail = await page.evaluate(() => document.activeElement?.getAttribute('type') === 'email');
    if (reachedEmail) break;
  }
  expect(reachedEmail).toBe(true);
  await expect(page.getByLabel('Email')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Password')).toBeFocused();
});
