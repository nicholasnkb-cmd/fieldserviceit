const token = process.env.HOSTINGER_API_TOKEN;
const domain = (process.env.HOSTINGER_DOMAIN || 'api.fieldserviceit.com').trim().toLowerCase();
const restart = String(process.env.HOSTINGER_RESTART || 'false').toLowerCase() === 'true';
const waitForBuild = String(process.env.HOSTINGER_WAIT_FOR_BUILD || 'false').toLowerCase() === 'true';
const buildNotBefore = Date.parse(process.env.HOSTINGER_BUILD_NOT_BEFORE || '') || 0;
const expectedCommit = String(process.env.HOSTINGER_EXPECTED_COMMIT || '').trim();
const healthUrl = (process.env.HOSTINGER_HEALTH_URL || `https://${domain}/v1/health/live`).trim();

if (!token) {
  console.error('HOSTINGER_API_TOKEN is required.');
  process.exit(1);
}

async function hostinger(path, init = {}) {
  const response = await fetch(`https://developers.hostinger.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    signal: AbortSignal.timeout(20_000),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${path} returned ${response.status}: ${body.slice(0, 300)}`);
  }
  return body ? JSON.parse(body) : {};
}

function safeLogTail(value) {
  return String(value || '')
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\b([A-Z][A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|KEY))=\S+/g, '$1=[redacted]')
    .split(/\r?\n/)
    .slice(-100)
    .join('\n');
}

const websites = await hostinger('/api/hosting/v1/websites');
const website = (websites.data || []).find((entry) => String(entry.domain || '').toLowerCase() === domain);
if (!website?.username) {
  throw new Error(`Hostinger account does not expose a Node.js website for ${domain}.`);
}

const username = encodeURIComponent(website.username);
const encodedDomain = encodeURIComponent(domain);
const basePath = `/api/hosting/v1/accounts/${username}/websites/${encodedDomain}/nodejs`;
async function recentBuilds() {
  const builds = await hostinger(`${basePath}/builds?per_page=10`);
  return (builds.data || []).map(({ uuid, state, created_at, updated_at }) => ({
    uuid, state, created_at, updated_at,
  })).sort((left, right) => Date.parse(right.created_at || 0) - Date.parse(left.created_at || 0));
}

let recent = await recentBuilds();

console.log(`Hostinger Node.js website: ${domain}`);
console.log(`Recent builds: ${JSON.stringify(recent)}`);

let latest = recent[0];
if (waitForBuild) {
  const terminalStates = new Set(['completed', 'complete', 'success', 'succeeded', 'failed', 'cancelled', 'canceled']);
  for (let attempt = 1; attempt <= 90; attempt += 1) {
    recent = await recentBuilds();
    latest = recent.find((build) => Date.parse(build.created_at || 0) >= buildNotBefore) || null;
    if (latest && terminalStates.has(String(latest.state).toLowerCase())) break;
    console.log(`Waiting for a Hostinger build created after ${new Date(buildNotBefore).toISOString()} (attempt ${attempt}/90).`);
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  if (!latest || Date.parse(latest.created_at || 0) < buildNotBefore) {
    throw new Error('Hostinger did not create the expected Node.js build before the timeout.');
  }
  if (!terminalStates.has(String(latest.state).toLowerCase())) {
    throw new Error(`Hostinger build ${latest.uuid} did not finish before the timeout (state: ${latest.state}).`);
  }
  console.log(`Hostinger build ${latest.uuid} finished with state ${latest.state}.`);
}
if (latest?.state === 'failed') {
  const logs = await hostinger(`${basePath}/builds/${encodeURIComponent(latest.uuid)}/logs`);
  console.error('Latest failed build log tail:');
  console.error(safeLogTail(logs.logs));
}

if (restart) {
  await hostinger(`${basePath}/server/restart`, { method: 'POST' });
  console.log(`Restart requested for ${domain}.`);

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, attempt === 1 ? 5_000 : 10_000));
    try {
      const response = await fetch(healthUrl, {
        headers: { 'User-Agent': 'FieldserviceIT-Hostinger-Recovery/1.0' },
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) {
        if (expectedCommit) {
          const contentType = response.headers.get('content-type') || '';
          const body = contentType.includes('json') ? await response.json() : {};
          const actualCommit = body?.commit || body?.data?.commit;
          if (actualCommit !== expectedCommit) {
            console.warn(`Health attempt ${attempt} is serving ${actualCommit || 'an unknown release'}, expected ${expectedCommit}.`);
            continue;
          }
        }
        console.log(`PASS production health recovered on attempt ${attempt}.`);
        process.exit(0);
      }
      console.warn(`Health attempt ${attempt} returned HTTP ${response.status}.`);
    } catch (error) {
      console.warn(`Health attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`${domain} did not become healthy after the Hostinger restart.`);
}

if (latest?.state === 'failed') process.exitCode = 1;
