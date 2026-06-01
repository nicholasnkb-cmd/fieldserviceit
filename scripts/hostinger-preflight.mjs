const token = process.env.HOSTINGER_API_TOKEN;
const expectedDomains = (process.env.HOSTINGER_EXPECTED_DOMAINS || '')
  .split(',')
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

if (!token) {
  console.error('HOSTINGER_API_TOKEN is required.');
  process.exit(1);
}

async function getJson(path) {
  const res = await fetch(`https://developers.hostinger.com${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${path} returned ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 300)}` : ''}`);
  }

  return res.json();
}

const websites = await getJson('/api/hosting/v1/websites');
const domains = (websites.data || [])
  .map((site) => String(site.domain || '').toLowerCase())
  .filter(Boolean);

if (domains.length === 0) {
  throw new Error('Hostinger token is valid, but no hosted websites were returned.');
}

for (const domain of expectedDomains) {
  if (!domains.includes(domain)) {
    throw new Error(`Hostinger token cannot see expected domain "${domain}". Visible domains: ${domains.join(', ')}`);
  }
}

console.log(`PASS Hostinger API token can see ${domains.length} hosted website(s).`);
