import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const failures = [];
const productionRequired = [
  'JWT_SECRET',
];
if (process.env.NODE_ENV === 'production') {
  for (const name of productionRequired) {
    if (!process.env[name]) failures.push(`${name} must be configured in production`);
  }
  if (process.env.CREDENTIAL_ENCRYPTION_KEY && process.env.JWT_SECRET === process.env.CREDENTIAL_ENCRYPTION_KEY) {
    failures.push('CREDENTIAL_ENCRYPTION_KEY must be different from JWT_SECRET');
  }
  if (process.env.CLAMAV_REQUIRED === 'true' && !process.env.CLAMAV_HOST) {
    failures.push('CLAMAV_HOST must be set when CLAMAV_REQUIRED=true');
  }
  const backupValues = ['BACKUP_S3_ENDPOINT', 'BACKUP_S3_BUCKET', 'BACKUP_S3_ACCESS_KEY_ID', 'BACKUP_S3_SECRET_ACCESS_KEY'];
  const configuredBackupValues = backupValues.filter((name) => process.env[name]);
  if (configuredBackupValues.length > 0 && configuredBackupValues.length !== backupValues.length) {
    failures.push('Offsite backup must configure all BACKUP_S3_* connection values together');
  }
}
const monitoringKey = process.env.MONITORING_API_KEY || '';
if (monitoringKey.length < 24) {
  failures.push('MONITORING_API_KEY must be configured with at least 24 characters');
}

for (const migration of [
  'backend/src/database/migrations/029_credential_token_hardening.sql',
  'backend/src/database/migrations/031_domain_permission_enforcement.sql',
  'backend/src/database/migrations/037_login_abuse_state.sql',
  'backend/src/database/migrations/038_offsite_backup.sql',
  'backend/src/database/migrations/039_shared_rate_limit.sql',
  'backend/src/database/migrations/040_backup_retention.sql',
]) {
  if (!fs.existsSync(path.resolve(migration))) failures.push(`Missing required migration: ${migration}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Security deployment prerequisites are present.');
