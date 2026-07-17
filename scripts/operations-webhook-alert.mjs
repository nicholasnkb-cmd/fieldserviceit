const webhookUrl = process.env.OPERATIONS_ALERT_WEBHOOK_URL;
if (!webhookUrl) {
  console.log('SKIP operations webhook: OPERATIONS_ALERT_WEBHOOK_URL is not configured.');
  process.exit(0);
}

const title = process.env.ALERT_TITLE || 'FieldserviceIT production alert';
const message = process.env.ALERT_MESSAGE || 'An automated production check needs attention.';
const runUrl = process.env.ALERT_RUN_URL;
const text = `${title}\n${message}${runUrl ? `\n${runUrl}` : ''}`;
const url = new URL(webhookUrl);
const payload = url.hostname.includes('office.com') || url.hostname.includes('office365.com')
  ? { '@type': 'MessageCard', '@context': 'https://schema.org/extensions', summary: title, themeColor: 'B60205', title, text, potentialAction: runUrl ? [{ '@type': 'OpenUri', name: 'Open workflow run', targets: [{ os: 'default', uri: runUrl }] }] : [] }
  : { text };

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(15_000),
});
if (!response.ok) throw new Error(`Operations webhook returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
console.log('Operations webhook alert delivered.');
