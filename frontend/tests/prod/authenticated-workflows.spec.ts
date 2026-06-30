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
});
