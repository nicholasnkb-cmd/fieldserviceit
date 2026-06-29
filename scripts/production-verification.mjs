import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

const webUrl = (process.env.VERIFICATION_WEB_URL || "https://fieldserviceit.com").replace(/\/+$/, "");
const apiUrl = (process.env.VERIFICATION_API_URL || "https://api.fieldserviceit.com").replace(/\/+$/, "");
const email = process.env.VERIFICATION_EMAIL;
const password = process.env.VERIFICATION_PASSWORD;
const attempts = 5;

const checks = [
  ["website", `${webUrl}/`],
  ["login page", `${webUrl}/login`],
  ["status page", `${webUrl}/status`],
  ["API liveness", `${apiUrl}/v1/health/live`],
  ["API readiness", `${apiUrl}/v1/health/ready`],
];

function describe(error) {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause;
  if (cause instanceof Error) {
    const code = "code" in cause && cause.code ? ` (${cause.code})` : "";
    return `${error.message}: ${cause.message}${code}`;
  }
  return error.message;
}

async function request(name, url, init = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const started = Date.now();
    try {
      const response = await fetch(url, {
        ...init,
        headers: { "User-Agent": "FieldserviceIT-Production-Verification/1.0", ...init.headers },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      console.log(`PASS ${name}: ${Date.now() - started} ms`);
      return response;
    } catch (error) {
      if (attempt === attempts) throw new Error(`${name} failed after ${attempts} attempts: ${describe(error)}`);
      console.warn(`RETRY ${name}: ${describe(error)} (${attempt}/${attempts})`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 3_000));
    }
  }
}

for (const [name, url] of checks) await request(name, url);

if (email && password) {
  await request("administrator login", `${apiUrl}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
} else {
  console.log("SKIP administrator login: verification credentials are not configured.");
}

console.log("Production verification passed without mutating application data.");
