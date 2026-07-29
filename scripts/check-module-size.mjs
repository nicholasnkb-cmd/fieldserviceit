import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoots = ['backend/src', 'frontend/src'];
const warningLimit = 800;
const hardLimit = 1200;
const legacyCaps = new Map([
  ['backend/src/database/database.service.ts', 2940],
  ['backend/src/modules/cmdb/services/cmdb.service.ts', 1880],
  ['backend/src/modules/admin/services/admin.service.ts', 1820],
  ['backend/src/database/migrations/migrations.service.ts', 1550],
  ['frontend/src/app/(app)/network/NetworkPageClient.tsx', 1600],
  ['frontend/src/app/(app)/admin/permissions/page.tsx', 1500],
]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return /\.(ts|tsx)$/.test(entry.name) ? [target] : [];
  });
}

const failures = [];
const warnings = [];
for (const sourceRoot of sourceRoots) {
  for (const file of walk(path.join(root, sourceRoot))) {
    const relative = path.relative(root, file).replaceAll('\\', '/');
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
    const cap = legacyCaps.get(relative) || hardLimit;
    if (lines > cap) failures.push(`${relative}: ${lines} lines exceeds cap ${cap}`);
    else if (lines > warningLimit) warnings.push(`${relative}: ${lines} lines`);
  }
}

for (const warning of warnings) console.warn(`MODULE SIZE WARNING ${warning}`);
if (failures.length) {
  for (const failure of failures) console.error(`MODULE SIZE FAILURE ${failure}`);
  process.exit(1);
}
console.log(`Module size gate passed with ${warnings.length} decomposition candidate(s).`);
