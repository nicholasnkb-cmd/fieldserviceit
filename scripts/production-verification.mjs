import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

const webUrl = (process.env.VERIFICATION_WEB_URL || "https://fieldserviceit.com").replace(/\/+$/, "");
const apiUrl = (process.env.VERIFICATION_API_URL || "https://api.fieldserviceit.com").replace(/\/+$/, "");
const email = process.env.VERIFICATION_EMAIL;
const password = process.env.VERIFICATION_PASSWORD;
const requireAuthenticated = process.env.REQUIRE_AUTHENTICATED_VERIFICATION === "true";
const expectedRelease = process.env.EXPECTED_RELEASE;
const attempts = 5;

function unwrap(body) {
  return body && typeof body === 'object' && 'success' in body && 'data' in body ? body.data : body;
}

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

function assertFrontendSecurityHeaders(response) {
  const csp = response.headers.get('content-security-policy') || '';
  const requiredDirectives = ["default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'"];
  const hasApplicationPolicy = requiredDirectives.every((directive) => csp.includes(directive));
  const hasHostingerPolicy = response.headers.get('platform') === 'hostinger' && csp.trim() === 'upgrade-insecure-requests';
  if (!hasApplicationPolicy && !hasHostingerPolicy) {
    throw new Error('Content-Security-Policy is missing the application policy and the expected Hostinger policy');
  }
  if (!response.headers.get('strict-transport-security')) throw new Error('Strict-Transport-Security is missing');
  if (response.headers.get('x-content-type-options') !== 'nosniff') throw new Error('X-Content-Type-Options is not nosniff');
}

function authCookieHeader(response) {
  const values = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie') || ''];
  const cookies = [];
  for (const value of values) {
    for (const match of value.matchAll(/(?:^|,\s*)(fsit_(?:access|refresh))=([^;]+)/g)) {
      cookies.push(`${match[1]}=${match[2]}`);
    }
  }
  return [...new Set(cookies)].join('; ');
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
        assertFrontendSecurityHeaders(response);
        const html = await response.text();
        if (!html.includes("/terms") || !html.includes("/privacy") || !html.includes("FieldserviceIT")) {
          throw new Error("global footer navigation is missing from the rendered HTML");
        }
        if (!html.includes("&copy;") && !html.includes("©")) {
          throw new Error("global footer copyright is missing from the rendered HTML");
        }
      }
    : undefined);
}

const frontendReleaseResponse = await request("frontend release metadata", `${webUrl}/release.json`);
const frontendRelease = await frontendReleaseResponse.json();
if (!frontendRelease?.commit) throw new Error("frontend release metadata does not contain a commit");

const backendReleaseResponse = await request("backend release metadata", `${apiUrl}/v1/health/live`);
const backendRelease = await backendReleaseResponse.json();
if (!backendRelease?.commit) throw new Error("backend health metadata does not contain a commit");
if (expectedRelease && (frontendRelease.commit !== expectedRelease || backendRelease.commit !== expectedRelease)) {
  throw new Error(`release mismatch: expected ${expectedRelease}, frontend=${frontendRelease.commit}, backend=${backendRelease.commit}`);
}

if (email && password) {
  const loginResponse = await request("administrator login", `${apiUrl}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const login = unwrap(await loginResponse.json());
  if (login.accessToken || login.refreshToken) throw new Error("administrator login exposed session tokens in the response body");
  const cookie = authCookieHeader(loginResponse);
  if (!cookie.includes('fsit_access=') || !cookie.includes('fsit_refresh=')) {
    throw new Error("administrator login did not establish secure authentication cookies; check MFA and verification-account configuration");
  }
  const authHeaders = { Cookie: cookie };
  const meResponse = await request("authenticated profile", `${apiUrl}/v1/users/me`, { headers: authHeaders });
  const me = unwrap(await meResponse.json());
  if (!me?.id || !me?.email) throw new Error("authenticated profile response is incomplete");

  if (me.companyId && ['SUPER_ADMIN', 'TENANT_ADMIN'].includes(me.role)) {
    await request("authenticated network inventory", `${apiUrl}/v1/assets?deviceCategory=NETWORK_DEVICE&limit=1`, { headers: authHeaders });
    await request("authenticated retired inventory", `${apiUrl}/v1/assets/retired?deviceCategory=NETWORK_DEVICE`, { headers: authHeaders });
    await request("authenticated operations dashboard", `${apiUrl}/v1/reports/operations`, { headers: authHeaders });
  } else if (me.companyId) {
    console.log(`SKIP permission-scoped tenant checks: verification account role ${me.role || 'unknown'} is intentionally least-privileged.`);
  } else {
    console.log("SKIP tenant-scoped checks: verification account has no company context.");
  }
} else {
  if (requireAuthenticated) {
    throw new Error("Authenticated production verification is required, but VERIFICATION_EMAIL and VERIFICATION_PASSWORD are not configured.");
  }
  console.log("SKIP authenticated checks: VERIFICATION_EMAIL and VERIFICATION_PASSWORD are not configured.");
}

console.log("Production verification passed without mutating application data.");
