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

async function request(name, url, init = {}, validate) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const started = Date.now();
    try {
      const response = await fetch(url, {
        ...init,
        headers: { "User-Agent": "FieldserviceIT-Production-Verification/1.0", ...init.headers },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (validate) await validate(response.clone());
      console.log(`PASS ${name}: ${Date.now() - started} ms`);
      return response;
    } catch (error) {
      if (attempt === attempts) throw new Error(`${name} failed after ${attempts} attempts: ${describe(error)}`);
      console.warn(`RETRY ${name}: ${describe(error)} (${attempt}/${attempts})`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 3_000));
    }
  }
}

for (const [name, url] of checks) {
  await request(name, url, {}, name === "website" || name === "login page"
    ? async (response) => {
        const html = await response.text();
        if (!html.includes("/terms") || !html.includes("/privacy") || !html.includes("FieldserviceIT")) {
          throw new Error("global footer navigation is missing from the rendered HTML");
        }
        if (!html.includes("&copy;") && !html.includes("©")) {
          throw new Error("global footer copyright is missing from the rendered HTML");
        }
      }
    : undefined);

if (email && password) {
  const loginResponse = await request("administrator login", `${apiUrl}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const login = await loginResponse.json();
  if (!login.accessToken) throw new Error("administrator login did not return an access token; check MFA and verification-account configuration");
  const authHeaders = { Authorization: `Bearer ${login.accessToken}` };
  const meResponse = await request("authenticated profile", `${apiUrl}/v1/users/me`, { headers: authHeaders });
  const me = await meResponse.json();
  if (!me?.id || !me?.email) throw new Error("authenticated profile response is incomplete");

  if (me.companyId) {
    await request("authenticated network inventory", `${apiUrl}/v1/assets?deviceCategory=NETWORK_DEVICE&limit=1`, { headers: authHeaders });
    await request("authenticated retired inventory", `${apiUrl}/v1/assets/retired?deviceCategory=NETWORK_DEVICE`, { headers: authHeaders });
    await request("authenticated operations dashboard", `${apiUrl}/v1/reports/operations`, { headers: authHeaders });
  } else {
    console.log("SKIP tenant-scoped checks: verification account has no company context.");
  }
} else {
  console.log("SKIP authenticated checks: VERIFICATION_EMAIL and VERIFICATION_PASSWORD are not configured.");
}

console.log("Production verification passed without mutating application data.");
