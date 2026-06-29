import dns from "node:dns";

// Hostinger publishes IPv4 and IPv6 records, but GitHub-hosted runners do not
// always have a working IPv6 route. Prefer IPv4 while retaining IPv6 fallback.
dns.setDefaultResultOrder("ipv4first");

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

function errorMessage(error) {
  if (!(error instanceof Error)) return String(error);

  const cause = error.cause;
  if (cause instanceof Error) {
    const code = "code" in cause && cause.code ? ` ${cause.code}` : "";
    return `${error.message}: ${cause.message}${code}`;
  }

  return error.message;
}

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
      const message = errorMessage(error);
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
