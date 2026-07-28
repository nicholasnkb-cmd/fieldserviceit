import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const publicPages = [
  ['/', 'FieldserviceIT'],
  ['/about', 'A practical command center for IT service and field operations.'],
  ['/contact', 'Get help with FieldserviceIT.'],
  ['/security-overview', 'Security overview'],
  ['/privacy', 'Privacy'],
  ['/mfa-recovery', 'Request MFA recovery'],
  ['/status', 'FieldserviceIT service status'],
];

for (const [path, heading] of publicPages) {
  test(`${path} has a usable document structure`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(/FieldserviceIT/);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('contentinfo')).toContainText(`© ${new Date().getFullYear()} FieldserviceIT`);
    await expect(page.getByRole('navigation', { name: 'Footer navigation' })).toBeVisible();
    await expect(page.locator('a:not([aria-label])').filter({ hasText: /^\s*$/ })).toHaveCount(0);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test('production responses enforce the security header baseline', async ({ page }) => {
  const response = await page.goto('/login');
  expect(response).not.toBeNull();
  const headers = response!.headers();
  const csp = headers['content-security-policy'] || '';
  for (const directive of ["default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'"]) {
    expect(csp).toContain(directive);
  }
  expect(headers['strict-transport-security']).toContain('max-age=');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
});

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

test('public navigation exposes a keyboard-visible skip link', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveAttribute('href', '#main-content');
});
