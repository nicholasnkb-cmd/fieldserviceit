const apiUrl = (process.env.DEPLOYMENT_API_URL || 'https://api.fieldserviceit.com').replace(/\/+$/, '');
const monitoringKey = process.env.MONITORING_API_KEY;

if (!monitoringKey) {
  console.log('SKIP deployment event: MONITORING_API_KEY is not configured.');
  process.exit(0);
}

const payload = {
  releaseCommit: process.env.DEPLOYMENT_RELEASE || process.env.GITHUB_SHA || 'unknown',
  component: process.env.DEPLOYMENT_COMPONENT || 'release',
  status: process.env.DEPLOYMENT_STATUS || 'STARTED',
  source: process.env.DEPLOYMENT_SOURCE || 'github-actions',
  workflowRunId: process.env.DEPLOYMENT_RUN_ID || process.env.GITHUB_RUN_ID,
  workflowUrl: process.env.DEPLOYMENT_WORKFLOW_URL,
  durationMs: process.env.DEPLOYMENT_DURATION_MS ? Number(process.env.DEPLOYMENT_DURATION_MS) : undefined,
  startedAt: process.env.DEPLOYMENT_STARTED_AT,
  completedAt: process.env.DEPLOYMENT_COMPLETED_AT,
  detail: process.env.DEPLOYMENT_DETAIL ? JSON.parse(process.env.DEPLOYMENT_DETAIL) : {},
};

for (const key of Object.keys(payload)) {
  if (payload[key] === undefined || payload[key] === '') delete payload[key];
}

const response = await fetch(`${apiUrl}/v1/monitoring/deployments`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-monitoring-key': monitoringKey,
    'User-Agent': 'FieldserviceIT-Deployment-Reporter/1.0',
  },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(20_000),
});
const body = await response.text();
if (!response.ok) throw new Error(`Deployment event API returned ${response.status}: ${body.slice(0, 500)}`);
console.log(`Recorded ${payload.component} deployment event: ${payload.status}.`);
