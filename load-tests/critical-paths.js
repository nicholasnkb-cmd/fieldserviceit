import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  scenarios: {
    authenticated_reads: {
      executor: 'ramping-vus',
      exec: 'authenticatedReads',
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 10 },
        { duration: '30s', target: 30 },
        { duration: '2m', target: 30 },
        { duration: '30s', target: 0 },
      ],
    },
    login_pressure: {
      executor: 'constant-arrival-rate',
      exec: 'loginPressure',
      rate: 2,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{path:tickets}': ['p(95)<750'],
    'http_req_duration{path:assets}': ['p(95)<750'],
    'http_req_duration{path:permissions}': ['p(95)<500'],
    'http_req_duration{path:login}': ['p(95)<1000'],
  },
};

function login() {
  const response = http.post(`${baseUrl}/v1/auth/login`, JSON.stringify({
    email: __ENV.LOAD_EMAIL,
    password: __ENV.LOAD_PASSWORD,
  }), { headers: { 'Content-Type': 'application/json' }, tags: { path: 'login' } });
  const body = response.json() || {};
  return { response, token: body.accessToken || body.data?.accessToken };
}

export function setup() {
  if (!__ENV.LOAD_EMAIL || !__ENV.LOAD_PASSWORD) {
    throw new Error('LOAD_EMAIL and LOAD_PASSWORD are required');
  }
  const { response, token } = login();
  if (response.status !== 200 || !token) throw new Error(`Load-test login failed (${response.status})`);
  return { token };
}

export function authenticatedReads(data) {
  const params = { headers: { Authorization: `Bearer ${data.token}` } };
  const responses = http.batch([
    ['GET', `${baseUrl}/v1/tickets?take=25`, null, { ...params, tags: { path: 'tickets' } }],
    ['GET', `${baseUrl}/v1/cmdb/assets?take=25`, null, { ...params, tags: { path: 'assets' } }],
    ['GET', `${baseUrl}/v1/auth/me`, null, { ...params, tags: { path: 'permissions' } }],
  ]);
  check(responses[0], { 'tickets succeeds': (r) => r.status === 200 });
  check(responses[1], { 'assets succeeds': (r) => r.status === 200 });
  check(responses[2], { 'permission context succeeds': (r) => r.status === 200 });
  sleep(1);
}

export function loginPressure() {
  const { response } = login();
  check(response, { 'login accepted or throttled': (r) => [200, 429].includes(r.status) });
}
