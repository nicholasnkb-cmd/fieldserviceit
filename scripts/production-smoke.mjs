const baseUrl = (process.env.SMOKE_BASE_URL || 'https://fieldserviceit.com').replace(/\/+$/, '');
const apiUrl = (process.env.SMOKE_API_URL || 'https://api.fieldserviceit.com').replace(/\/+$/, '');
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
const expectedFrontend = process.env.SMOKE_EXPECT_FRONTEND_VERSION;
const expectedBackend = process.env.SMOKE_EXPECT_BACKEND_VERSION;
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

await check('frontend login page', () => expectOk(`${baseUrl}/login`));
await check('frontend network page shell', () => expectOk(`${baseUrl}/network`));
await check('frontend about page', () => expectOk(`${baseUrl}/about`));
await check('frontend contact page', () => expectOk(`${baseUrl}/contact`));
await check('frontend legal disclaimer page', () => expectOk(`${baseUrl}/legal-disclaimer`));
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
  await check('auth login', async () => {
    const res = await expectOk(`${apiUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    if (!(body?.data?.user || body?.user)) throw new Error('No user returned');
    if (!cookieJar.has('fsit_access') || !cookieJar.has('fsit_refresh')) throw new Error('Auth cookies were not set');
  });

  await check('current user API', () => expectOk(`${apiUrl}/v1/users/me`));
  await check('effective feature API', () => expectOk(`${apiUrl}/v1/users/me/features`));
  await check('AI tools API', () => expectOk(`${apiUrl}/v1/ai-agent/tools`));
  await check('RMM providers API', () => expectOk(`${apiUrl}/v1/integrations/rmm/providers`));
  await check('ticket search API', () => expectOk(`${apiUrl}/v1/tickets?limit=1`));
  await check('asset list API', () => expectOk(`${apiUrl}/v1/assets?limit=1`));
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
