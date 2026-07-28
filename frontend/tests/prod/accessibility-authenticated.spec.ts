import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const routes = ['/dashboard', '/profile', '/profile/MFA', '/my-tickets'];

test.describe('authenticated WCAG 2.2 AA assurance', () => {
  test.skip(!email || !password, 'E2E credentials are not configured');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Password').fill(password!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).not.toHaveURL(/\/login$/);
  });

  for (const route of routes) {
    test(`${route} has no automated WCAG 2.2 A/AA violations`, async ({ page }, testInfo) => {
      await page.goto(route);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByRole('contentinfo')).toContainText(`© ${new Date().getFullYear()} FieldserviceIT`);
      await expect(page.getByRole('navigation', { name: 'Footer navigation' })).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      await testInfo.attach(`axe-${route.replaceAll('/', '-') || 'home'}`, {
        body: JSON.stringify({ url: page.url(), passes: results.passes.length, violations: results.violations }, null, 2),
        contentType: 'application/json',
      });
    });

    test(`${route} reflows at a 320 CSS-pixel viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(route);
      const width = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(width.content).toBeLessThanOrEqual(width.viewport + 1);
    });
  }

  test('security settings expose labeled passkey, MFA, recovery, and session controls', async ({ page }) => {
    await page.goto('/profile/MFA');
    await expect(page.getByRole('heading', { level: 1, name: 'MFA and Sessions' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Passkeys' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Authenticator MFA' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Active devices' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add passkey' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out other devices' })).toBeVisible();
  });

  test('keyboard focus reaches the skip link, authentication fields, and submit action', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('href', '#main-content');
    for (let attempt = 0; attempt < 20 && !(await page.getByLabel('Email').evaluate((element) => element === document.activeElement)); attempt += 1) {
      await page.keyboard.press('Tab');
    }
    await expect(page.getByLabel('Email')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password')).toBeFocused();
  });
});
