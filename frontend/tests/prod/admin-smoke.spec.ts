import { expect, test } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD to run production browser smoke tests.');

test('super admin can open core admin data pages', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard|\/admin/);

  const pages = [
    { path: '/admin/users', heading: 'User Management', empty: 'Users could not be loaded.' },
    { path: '/admin/companies', heading: 'Company Management', empty: 'Companies could not be loaded.' },
    { path: '/admin/roles', heading: 'Role & Permission Management', empty: 'Roles could not be loaded.' },
    { path: '/admin/audit-logs', heading: 'Audit Logs', empty: 'Unable to load' },
    { path: '/tickets', heading: 'Tickets', empty: 'Failed to load tickets' },
  ];

  for (const item of pages) {
    await page.goto(item.path);
    await expect(page.getByRole('heading', { name: item.heading })).toBeVisible();
    await expect(page.getByText(item.empty)).toHaveCount(0);
  }
});
