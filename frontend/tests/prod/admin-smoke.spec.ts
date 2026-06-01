import { expect, test } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD to run production browser smoke tests.');

async function submitTicketComment(page: import('@playwright/test').Page, comment: string, isInternal = false) {
  const commentInput = page.getByPlaceholder('Type your comment...');
  const internalCheckbox = page.getByLabel('Internal note (visible to staff only)');
  const submitButton = page.getByRole('button', { name: 'Submit' });

  if (isInternal) {
    await internalCheckbox.check();
  } else {
    await internalCheckbox.uncheck();
  }
  await commentInput.fill(comment);
  await expect(commentInput).toHaveValue(comment);
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  await expect(page.getByText(comment)).toBeVisible();
}

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

test('super admin can manage a ticket from the ticket detail page', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard|\/admin/);

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const apiBase = process.env.E2E_API_URL || 'https://api.fieldserviceit.com';
  const ticket = await page.evaluate(async ({ apiBase, suffix }) => {
    const response = await fetch(`${apiBase}/v1/tickets`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Browser smoke ticket ${suffix}`,
        description: 'Temporary browser smoke ticket for detail action coverage.',
        contactName: 'Browser Smoke',
        contactEmail: `browser-smoke-${suffix}@example.com`,
        contactPhone: '555-0123',
        priority: 'LOW',
        type: 'REQUEST',
      }),
    });
    if (!response.ok) throw new Error(`Ticket create failed: ${response.status}`);
    const body = await response.json();
    return body.data || body;
  }, { apiBase, suffix });
  expect(ticket.id).toBeTruthy();

  try {
    await page.goto(`/tickets/${ticket.id}`);
    await expect(page.getByRole('heading', { name: ticket.ticketNumber })).toBeVisible();

    await page.getByRole('button', { name: 'IN PROGRESS' }).click();
    await expect(page.getByText('IN_PROGRESS').first()).toBeVisible();

    await submitTicketComment(page, `Browser smoke comment ${suffix}`);
    await submitTicketComment(page, `Internal browser smoke note ${suffix}`, true);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('Choose files').click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles({
      name: `browser-smoke-${suffix}.txt`,
      mimeType: 'text/plain',
      buffer: Buffer.from(`browser smoke upload ${suffix}`),
    });
    await expect(page.getByText(`browser-smoke-${suffix}.txt`)).toBeVisible();

    await page.getByRole('button', { name: 'RESOLVED' }).click();
    await page.getByPlaceholder('Summarize what fixed the issue, parts used, or next steps...').fill(`Resolved by browser smoke ${suffix}`);
    await page.getByRole('button', { name: 'Resolve Ticket' }).click();
    await expect(page.getByText('RESOLVED').first()).toBeVisible();

    await page.getByRole('button', { name: 'CLOSED' }).click();
    await expect(page.getByText('CLOSED').first()).toBeVisible();
  } finally {
    await page.evaluate(async ({ apiBase, ticketId }) => {
      await fetch(`${apiBase}/v1/tickets/${ticketId}`, {
        method: 'DELETE',
        credentials: 'include',
      }).catch(() => undefined);
    }, { apiBase, ticketId: ticket.id }).catch(() => undefined);
  }
});
