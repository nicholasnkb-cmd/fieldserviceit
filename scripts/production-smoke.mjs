const baseUrl = (process.env.SMOKE_BASE_URL || 'https://fieldserviceit.com').replace(/\/+$/, '');
const apiUrl = (process.env.SMOKE_API_URL || 'https://api.fieldserviceit.com').replace(/\/+$/, '');
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;

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
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res;
}

await check('frontend login page', () => expectOk(`${baseUrl}/login`));
await check('frontend network page shell', () => expectOk(`${baseUrl}/network`));
await check('backend health', () => expectOk(`${apiUrl}/v1/health`));

if (email && password) {
  let token = '';
  await check('auth login', async () => {
    const res = await expectOk(`${apiUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    token = body?.data?.accessToken || body?.accessToken;
    if (!token) throw new Error('No access token returned');
  });

  const auth = { Authorization: `Bearer ${token}` };
  await check('current user API', () => expectOk(`${apiUrl}/v1/users/me`, { headers: auth }));
  await check('RMM providers API', () => expectOk(`${apiUrl}/v1/integrations/rmm/providers`, { headers: auth }));
  await check('ticket search API', () => expectOk(`${apiUrl}/v1/tickets?limit=1`, { headers: auth }));
  await check('asset list API', () => expectOk(`${apiUrl}/v1/assets?limit=1`, { headers: auth }));
} else {
  console.log('SKIP authenticated checks: set SMOKE_EMAIL and SMOKE_PASSWORD to enable them.');
}
