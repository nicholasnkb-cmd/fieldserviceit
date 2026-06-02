const baseUrl = (process.env.SMOKE_BASE_URL || 'https://fieldserviceit.com').replace(/\/+$/, '');
const apiUrl = (process.env.SMOKE_API_URL || 'https://api.fieldserviceit.com').replace(/\/+$/, '');
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
const expectedFrontend = process.env.SMOKE_EXPECT_FRONTEND_VERSION;
const expectedBackend = process.env.SMOKE_EXPECT_BACKEND_VERSION;
const runMutations = process.env.SMOKE_MUTATIONS === 'true';
const cookieJar = new Map();

function storeCookies(res) {
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const fallbackCookie = res.headers.get('set-cookie');
  if (fallbackCookie && setCookie.length === 0) setCookie.push(fallbackCookie);
  for (const cookie of setCookie) {
    const [pair] = cookie.split(';');
    const idx = pair.indexOf('=');
    if (idx > 0) cookieJar.set(pair.slice(0, idx), pair.slice(idx + 1));
  }
}

function cookieHeader() {
  return [...cookieJar.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
}

async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

async function expectOk(url, init) {
  const headers = new Headers(init?.headers || {});
  if (cookieJar.size > 0 && !headers.has('cookie')) headers.set('cookie', cookieHeader());
  const res = await fetch(url, { ...init, headers });
  storeCookies(res);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res;
}

function unwrap(body) {
  if (body && typeof body === 'object' && 'success' in body && 'data' in body && 'timestamp' in body) {
    return body.meta ? { data: body.data, meta: body.meta } : body.data;
  }
  return body;
}

async function expectJson(url, init) {
  const res = await expectOk(url, init);
  return unwrap(await res.json());
}

function listData(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  throw new Error('Expected list response');
}

async function expectList(name, url) {
  await check(name, async () => {
    const body = await expectJson(url);
    listData(body);
  });
}

async function expectMutationListPreserved() {
  await check('admin role permission no-op update', async () => {
    const roles = listData(await expectJson(`${apiUrl}/v1/admin/roles`));
    const editable = roles.find((role) => role?.id && Array.isArray(role.permissions));
    if (!editable) throw new Error('No role available to verify permission update');
    const permissionSlugs = editable.permissions
      .map((entry) => entry?.permission?.slug)
      .filter(Boolean);
    const updated = await expectJson(`${apiUrl}/v1/admin/roles/${editable.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionSlugs }),
    });
    if (!Array.isArray(updated?.permissions)) throw new Error('Updated role did not include permissions');
  });
}

async function runTemporaryAdminMutations() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const companyPayload = {
    name: `Smoke Test Company ${suffix}`,
    slug: `smoke-test-${suffix}`,
    domain: `smoke-${suffix}.example.com`,
  };
  let company;
  await check('admin company create', async () => {
    company = await expectJson(`${apiUrl}/v1/admin/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyPayload),
    });
    if (!company?.id) throw new Error('Company id missing');
  });

  await check('admin company edit', async () => {
    const updated = await expectJson(`${apiUrl}/v1/admin/companies/${company.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: `updated-${companyPayload.domain}` }),
    });
    if (updated?.domain !== `updated-${companyPayload.domain}`) throw new Error('Company edit did not persist');
  });

  let user;
  await check('admin user create', async () => {
    user = await expectJson(`${apiUrl}/v1/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `smoke-${suffix}@example.com`,
        password: `Smoke-${suffix}!`,
        firstName: 'Smoke',
        lastName: 'User',
        role: 'CLIENT',
        companyId: company.id,
      }),
    });
    if (!user?.id) throw new Error('User id missing');
  });

  await check('admin user edit', async () => {
    const updated = await expectJson(`${apiUrl}/v1/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'SmokeEdited' }),
    });
    if (updated?.firstName !== 'SmokeEdited') throw new Error('User edit did not persist');
  });

  await check('admin user deactivate', () => expectOk(`${apiUrl}/v1/admin/users/${user.id}`, { method: 'DELETE' }));
  await check('admin company deactivate', () => expectOk(`${apiUrl}/v1/admin/companies/${company.id}`, { method: 'DELETE' }));
}

async function runTemporaryTicketMutations() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  let ticket;
  await check('ticket create mutation', async () => {
    ticket = await expectJson(`${apiUrl}/v1/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Smoke managed ticket ${suffix}`,
        description: 'Temporary smoke ticket for status management regression coverage.',
        contactName: 'Smoke Tester',
        contactEmail: `ticket-smoke-${suffix}@example.com`,
        contactPhone: '555-0100',
        priority: 'LOW',
        type: 'REQUEST',
      }),
    });
    if (!ticket?.id) throw new Error('Ticket id missing');
  });

  await check('ticket resolve mutation', async () => {
    const resolved = await expectJson(`${apiUrl}/v1/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED', resolution: 'Resolved by production smoke.' }),
    });
    if (resolved?.status !== 'RESOLVED') throw new Error(`Expected RESOLVED, got ${resolved?.status}`);
    if (!resolved?.resolvedAt) throw new Error('Resolved timestamp missing');
  });

  await check('ticket close mutation', async () => {
    const closed = await expectJson(`${apiUrl}/v1/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED' }),
    });
    if (closed?.status !== 'CLOSED') throw new Error(`Expected CLOSED, got ${closed?.status}`);
  });

  await check('ticket delete mutation', () => expectOk(`${apiUrl}/v1/tickets/${ticket.id}`, { method: 'DELETE' }));
}

async function runTemporaryKnowledgeBaseMutations(extraHeaders = {}) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  let article;
  await check('knowledge base article create', async () => {
    article = await expectJson(`${apiUrl}/v1/knowledge-base`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify({
        title: `Smoke KB Article ${suffix}`,
        summary: 'Temporary smoke article for knowledge base coverage.',
        content: 'Steps\n1. Confirm the issue.\n2. Apply the documented fix.\n3. Verify the customer outcome.',
        category: 'Smoke Tests',
        tags: 'smoke,kb',
        status: 'DRAFT',
        visibility: 'INTERNAL',
        articleType: 'RUNBOOK',
        aiEnabled: false,
      }),
    });
    if (!article?.id) throw new Error('Knowledge article id missing');
  });

  await check('knowledge base article update', async () => {
    const updated = await expectJson(`${apiUrl}/v1/knowledge-base/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify({ status: 'PUBLISHED', aiEnabled: true }),
    });
    if (updated?.status !== 'PUBLISHED') throw new Error(`Expected PUBLISHED, got ${updated?.status}`);
    if (!updated?.aiEnabled) throw new Error('AI source flag did not persist');
  });

  await check('knowledge base article archive', () => expectOk(`${apiUrl}/v1/knowledge-base/${article.id}`, {
    method: 'DELETE',
    headers: extraHeaders,
  }));
}

async function runTemporaryAlertingMutations(extraHeaders = {}) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  await check('alerting rule create', async () => {
    const rule = await expectJson(`${apiUrl}/v1/assets/network/alert-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify({
        name: `Smoke alert rule ${suffix}`,
        metric: 'latency',
        operator: '>',
        threshold: '500',
        durationSec: 60,
        severity: 'WARNING',
      }),
    });
    if (!rule?.id) throw new Error('Alert rule id missing');
  });

  await check('alerting maintenance window create', async () => {
    const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const window = await expectJson(`${apiUrl}/v1/assets/network/maintenance-windows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify({ name: `Smoke maintenance ${suffix}`, startsAt, endsAt, suppressAlerts: true }),
    });
    if (!window?.id) throw new Error('Maintenance window id missing');
  });

  await check('alerting escalation policy create', async () => {
    const policy = await expectJson(`${apiUrl}/v1/assets/network/escalation-policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify({ name: `Smoke escalation ${suffix}`, severity: 'WARNING', firstDelayMin: 0, secondDelayMin: 5, managerDelayMin: 10 }),
    });
    if (!policy?.id) throw new Error('Escalation policy id missing');
  });
}

async function runTemporaryQuotesInvoicesMutations(extraHeaders = {}) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  let quote;
  await check('quotes invoices quote create', async () => {
    quote = await expectJson(`${apiUrl}/v1/quotes-invoices/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify({
        title: `Smoke quote ${suffix}`,
        customerName: 'Smoke Customer',
        customerEmail: `quote-smoke-${suffix}@example.com`,
        taxRate: 0,
        lines: [
          { description: 'Smoke service labor', quantity: 1, unitPrice: 25, taxable: true },
        ],
      }),
    });
    if (!quote?.id) throw new Error('Quote id missing');
  });

  await check('quotes invoices quote approve', async () => {
    const updated = await expectJson(`${apiUrl}/v1/quotes-invoices/quotes/${quote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    if (updated?.status !== 'APPROVED') throw new Error(`Expected APPROVED, got ${updated?.status}`);
  });

  await check('quotes invoices quote convert', async () => {
    const invoice = await expectJson(`${apiUrl}/v1/quotes-invoices/quotes/${quote.id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify({}),
    });
    if (!invoice?.id) throw new Error('Invoice id missing');
  });
}

await check('frontend login page', () => expectOk(`${baseUrl}/login`));
await check('frontend network page shell', () => expectOk(`${baseUrl}/network`));
await check('frontend about page', () => expectOk(`${baseUrl}/about`));
await check('frontend contact page', () => expectOk(`${baseUrl}/contact`));
await check('frontend legal disclaimer page', () => expectOk(`${baseUrl}/legal-disclaimer`));
await check('frontend knowledge base page shell', () => expectOk(`${baseUrl}/knowledge-base`));
await check('frontend alerting page shell', () => expectOk(`${baseUrl}/alerting`));
await check('frontend quotes invoices page shell', () => expectOk(`${baseUrl}/quotes-invoices`));
await check('backend health', () => expectOk(`${apiUrl}/v1/health`));

await check('protected admin plans route is registered', async () => {
  const res = await fetch(`${apiUrl}/v1/admin/plans`);
  if (![401, 403].includes(res.status)) throw new Error(`Expected 401/403, got ${res.status}`);
});

await check('protected AI route is registered', async () => {
  const res = await fetch(`${apiUrl}/v1/ai-agent/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'smoke' }),
  });
  if (![401, 403].includes(res.status)) throw new Error(`Expected 401/403, got ${res.status}`);
});

if (email && password) {
  let currentUser;
  await check('auth login', async () => {
    const res = await expectOk(`${apiUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    currentUser = unwrap(body)?.user || body?.user;
    if (!currentUser) throw new Error('No user returned');
    if (!cookieJar.has('fsit_access') || !cookieJar.has('fsit_refresh')) throw new Error('Auth cookies were not set');
  });

  await check('current user API', () => expectOk(`${apiUrl}/v1/users/me`));
  await check('effective feature API', () => expectOk(`${apiUrl}/v1/users/me/features`));
  await check('AI tools API', () => expectOk(`${apiUrl}/v1/ai-agent/tools`));
  await check('RMM providers API', () => expectOk(`${apiUrl}/v1/integrations/rmm/providers`));
  await check('ticket search API', () => expectOk(`${apiUrl}/v1/tickets?limit=1`));
  if (!(currentUser?.role === 'SUPER_ADMIN' && !currentUser?.companyId)) {
    await check('asset list API', () => expectOk(`${apiUrl}/v1/assets?limit=1`));
  }
  if (currentUser?.role === 'SUPER_ADMIN') {
    await expectList('admin users list API', `${apiUrl}/v1/admin/users?limit=5`);
    await expectList('admin companies list API', `${apiUrl}/v1/admin/companies?limit=5`);
    await expectList('admin roles list API', `${apiUrl}/v1/admin/roles`);
    await expectList('admin audit logs list API', `${apiUrl}/v1/admin/audit-logs?limit=5`);
    await expectList('admin tickets list API', `${apiUrl}/v1/admin/tickets?limit=5`);
    let companyContextHeaders = {};
    if (!currentUser?.companyId) {
      await check('asset list API with company context', async () => {
        const companies = listData(await expectJson(`${apiUrl}/v1/admin/companies?limit=5`));
        const company = companies.find((item) => item?.id && item.isActive !== false);
        if (!company) throw new Error('No active company available for asset context check');
        companyContextHeaders = { 'X-Company-Context': company.id };
        await expectOk(`${apiUrl}/v1/assets?limit=1`, { headers: { 'X-Company-Context': company.id } });
      });
    }
    await check('knowledge base list API', async () => {
      const body = await expectJson(`${apiUrl}/v1/knowledge-base?limit=5`, { headers: companyContextHeaders });
      listData(body);
    });
    await check('alerting events list API', async () => {
      const body = await expectJson(`${apiUrl}/v1/assets/network/alert-events?status=ALL`, { headers: companyContextHeaders });
      listData(body);
    });
    await check('alerting rules list API', async () => {
      const body = await expectJson(`${apiUrl}/v1/assets/network/alert-rules`, { headers: companyContextHeaders });
      listData(body);
    });
    await check('quotes invoices quotes list API', async () => {
      const body = await expectJson(`${apiUrl}/v1/quotes-invoices/quotes?limit=5`, { headers: companyContextHeaders });
      listData(body);
    });
    await check('quotes invoices invoices list API', async () => {
      const body = await expectJson(`${apiUrl}/v1/quotes-invoices/invoices?limit=5`, { headers: companyContextHeaders });
      listData(body);
    });
    await expectMutationListPreserved();
    if (runMutations) {
      await runTemporaryTicketMutations();
      await runTemporaryKnowledgeBaseMutations(companyContextHeaders);
      await runTemporaryAlertingMutations(companyContextHeaders);
      await runTemporaryQuotesInvoicesMutations(companyContextHeaders);
      await runTemporaryAdminMutations();
    } else {
      console.log('SKIP admin create/edit/deactivate mutations: set SMOKE_MUTATIONS=true to enable temporary smoke records.');
    }
  } else {
    console.log(`SKIP super admin checks: authenticated role is ${currentUser?.role || 'unknown'}.`);
  }
  if (expectedFrontend || expectedBackend) {
    await check('system readiness versions', async () => {
      const res = await expectOk(`${apiUrl}/v1/admin/system-readiness`);
      const body = await res.json();
      const data = body?.data || body;
      const deployment = data.deployment || {};
      if (expectedFrontend && deployment.frontendVersion !== expectedFrontend) {
        throw new Error(`frontendVersion expected ${expectedFrontend}, got ${deployment.frontendVersion}`);
      }
      if (expectedBackend && deployment.backendVersion !== expectedBackend) {
        throw new Error(`backendVersion expected ${expectedBackend}, got ${deployment.backendVersion}`);
      }
    });
  }
  await check('logout clears session', () => expectOk(`${apiUrl}/v1/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
} else {
  console.log('SKIP authenticated checks: set SMOKE_EMAIL and SMOKE_PASSWORD to enable them.');
}
