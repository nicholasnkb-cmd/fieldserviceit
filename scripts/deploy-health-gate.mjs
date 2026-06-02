const baseUrl = (process.env.HEALTH_BASE_URL || process.env.SMOKE_BASE_URL || 'https://fieldserviceit.com').replace(/\/+$/, '');
const apiUrl = (process.env.HEALTH_API_URL || process.env.SMOKE_API_URL || 'https://api.fieldserviceit.com').replace(/\/+$/, '');
const attempts = Number(process.env.HEALTH_ATTEMPTS || 6);
const delayMs = Number(process.env.HEALTH_DELAY_MS || 10000);
const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS || 20000);
const hostingerToken = process.env.HOSTINGER_API_TOKEN;
const hostingerAccount = process.env.HOSTINGER_ACCOUNT_ID || 'u209468809';

const checks = [
  { name: 'frontend home', url: `${baseUrl}/`, expect: [200] },
  { name: 'frontend login', url: `${baseUrl}/login`, expect: [200] },
  { name: 'frontend network shell', url: `${baseUrl}/network`, expect: [200] },
  { name: 'frontend topology shell', url: `${baseUrl}/topology`, expect: [200] },
  { name: 'frontend status page', url: `${baseUrl}/status`, expect: [200] },
  { name: 'frontend client health', url: `${baseUrl}/api/client-health`, expect: [200], jsonStatus: 'ok' },
  { name: 'backend health', url: `${apiUrl}/v1/health`, expect: [200], jsonStatus: 'ok' },
  { name: 'protected topology route', url: `${apiUrl}/v1/topology/summary`, expect: [401, 403] },
];

const failures = [];
const results = [];

for (const check of checks) {
  const result = await retryCheck(check);
  results.push(result);
  const ok = check.expect.includes(result.status) && (!check.jsonStatus || result.body?.status === check.jsonStatus || result.body?.data?.status === check.jsonStatus);
  if (!ok) failures.push({ ...check, result });
}

if (hostingerToken) {
  await hostingerBuildCheck('frontend build', 'fieldserviceit.com');
  await hostingerBuildCheck('backend build', 'api.fieldserviceit.com');
}

console.log(JSON.stringify({ status: failures.length ? 'failed' : 'ok', checkedAt: new Date().toISOString(), results, failures }, null, 2));
if (failures.length) process.exitCode = 1;

async function retryCheck(check) {
  let last = { status: 0, latencyMs: 0, body: null, text: '', error: 'not attempted' };
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    last = await runCheck(check);
    const expected = check.expect.includes(last.status);
    const jsonOk = !check.jsonStatus || last.body?.status === check.jsonStatus || last.body?.data?.status === check.jsonStatus;
    if (expected && jsonOk) return { name: check.name, attempt, ...last };
    if (attempt < attempts) await sleep(delayMs);
  }
  return { name: check.name, attempt: attempts, ...last };
}

async function runCheck(check) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(check.url, { signal: controller.signal });
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {}
    return {
      status: response.status,
      latencyMs: Date.now() - started,
      body,
      text: text.slice(0, 160),
      error: '',
    };
  } catch (err) {
    return { status: 0, latencyMs: Date.now() - started, body: null, text: '', error: err.message || 'request failed' };
  } finally {
    clearTimeout(timer);
  }
}

async function hostingerBuildCheck(name, website) {
  const url = `https://developers.hostinger.com/api/hosting/v1/accounts/${hostingerAccount}/websites/${website}/nodejs/builds?per_page=1`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${hostingerToken}`, Accept: 'application/json' } });
  if (!response.ok) {
    failures.push({ name, result: { status: response.status, error: response.statusText } });
    return;
  }
  const body = await response.json();
  const build = body?.data?.[0];
  results.push({ name, status: build?.state === 'completed' ? 200 : 0, buildState: build?.state || 'unknown', buildUuid: build?.uuid || null });
  if (build?.state !== 'completed') failures.push({ name, result: { status: 0, buildState: build?.state || 'unknown' } });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
