const targets = [
  ["website", process.env.UPTIME_WEB_URL || "https://fieldserviceit.com/"],
  [
    "login",
    `${(process.env.UPTIME_WEB_URL || "https://fieldserviceit.com").replace(/\/+$/, "")}/login`,
  ],
  [
    "status page",
    `${(process.env.UPTIME_WEB_URL || "https://fieldserviceit.com").replace(/\/+$/, "")}/status`,
  ],
  [
    "API health",
    `${(process.env.UPTIME_API_URL || "https://api.fieldserviceit.com").replace(/\/+$/, "")}/v1/health`,
  ],
  [
    "API readiness",
    `${(process.env.UPTIME_API_URL || "https://api.fieldserviceit.com").replace(/\/+$/, "")}/v1/health/ready`,
  ],
];

let failed = false;
const maxAttempts = 3;

for (const [name, url] of targets) {
  let passed = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const started = Date.now();
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "FieldserviceIT-Uptime-Monitor/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      const duration = Date.now() - started;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (duration > 5000) throw new Error(`slow response (${duration} ms)`);
      console.log(
        `PASS ${name}: ${duration} ms (attempt ${attempt}/${maxAttempts})`,
      );
      passed = true;
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === maxAttempts) {
        console.error(`FAIL ${name}: ${message} (${maxAttempts} attempts)`);
      } else {
        console.warn(
          `RETRY ${name}: ${message} (attempt ${attempt}/${maxAttempts})`,
        );
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  if (!passed) failed = true;
}

if (failed) process.exitCode = 1;
