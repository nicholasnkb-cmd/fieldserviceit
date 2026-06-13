import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const failures = [];
const monitoringKey = process.env.MONITORING_API_KEY || '';
if (monitoringKey.length < 24) {
  failures.push('MONITORING_API_KEY must be configured with at least 24 characters');
}

for (const migration of [
  'backend/src/database/migrations/029_credential_token_hardening.sql',
  'backend/src/database/migrations/031_domain_permission_enforcement.sql',
]) {
  if (!fs.existsSync(path.resolve(migration))) failures.push(`Missing required migration: ${migration}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Security deployment prerequisites are present.');
