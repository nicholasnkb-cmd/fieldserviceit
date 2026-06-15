const targets = [
  ['website', process.env.UPTIME_WEB_URL || 'https://fieldserviceit.com/'],
  ['login', `${(process.env.UPTIME_WEB_URL || 'https://fieldserviceit.com').replace(/\/+$/, '')}/login`],
  ['status page', `${(process.env.UPTIME_WEB_URL || 'https://fieldserviceit.com').replace(/\/+$/, '')}/status`],
  ['API health', `${(process.env.UPTIME_API_URL || 'https://api.fieldserviceit.com').replace(/\/+$/, '')}/v1/health`],
  ['API readiness', `${(process.env.UPTIME_API_URL || 'https://api.fieldserviceit.com').replace(/\/+$/, '')}/v1/health/ready`],
];

let failed = false;
for (const [name, url] of targets) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FieldserviceIT-Uptime-Monitor/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    const duration = Date.now() - started;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (duration > 5000) throw new Error(`slow response (${duration} ms)`);
    console.log(`PASS ${name}: ${duration} ms`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

if (failed) process.exitCode = 1;
