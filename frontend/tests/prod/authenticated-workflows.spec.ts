import { expect, test } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe('critical authenticated workflows', () => {
  test.skip(!email || !password, 'E2E credentials are not configured');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Password').fill(password!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test('ticket creation form is reachable and validates required fields', async ({ page }) => {
    await page.goto('/tickets/new');
    await expect(page.getByRole('heading', { level: 1, name: 'Create Ticket' })).toBeVisible();
    await expect(page.getByText('Title *', { exact: true })).toBeVisible();
    await expect(page.getByText('Contact Email *', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Create Ticket' }).click();
    await expect(page.getByText('Title is required')).toBeVisible();
  });

  test('dispatch workspace and creation controls are reachable', async ({ page }) => {
    await page.goto('/dispatch');
    await expect(page.getByRole('heading', { level: 1, name: 'Field Service' })).toBeVisible();
    await page.getByRole('button', { name: 'New Dispatch' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Dispatch Technician' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dispatch', exact: true })).toBeVisible();
  });

  for (const route of ['/dashboard', '/tickets', '/assets', '/network']) {
    test(`${route} is responsive, branded, and retains the global footer`, async ({ page }, testInfo) => {
      await page.setViewportSize(testInfo.project.name.includes('mobile')
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 });
      await page.goto(route);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Footer navigation' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
      await expect(page.getByText(/© 2026 FieldserviceIT/)).toBeVisible();
      const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
      expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
      await testInfo.attach(`${route.slice(1)}-${testInfo.project.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });
  }
});
