import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const nextDir = process.env.NEXT_DIST_DIR || '.next';
const manifest = JSON.parse(fs.readFileSync(path.join(nextDir, 'build-manifest.json'), 'utf8'));
const files = [...new Set(manifest.rootMainFiles || [])];
const gzipBytes = files.reduce((total, file) => total + zlib.gzipSync(fs.readFileSync(path.join(nextDir, file))).length, 0);
const budgetBytes = Number(process.env.SHARED_BUNDLE_BUDGET_BYTES || 120_000);

console.log(`Shared application JavaScript: ${(gzipBytes / 1024).toFixed(1)} KiB gzip (budget ${(budgetBytes / 1024).toFixed(1)} KiB).`);
if (gzipBytes > budgetBytes) {
  throw new Error(`Shared application JavaScript exceeds the bundle budget by ${gzipBytes - budgetBytes} bytes.`);
}
