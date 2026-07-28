import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'product', 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

function validateCatalog(value) {
  if (value.currency !== 'USD') throw new Error('Only the currently supported USD catalog is allowed.');
  if (!Array.isArray(value.plans) || value.plans.length === 0) throw new Error('Catalog must contain plans.');
  const unique = (field) => new Set(value.plans.map((plan) => plan[field])).size === value.plans.length;
  for (const field of ['id', 'slug', 'name', 'sortOrder']) {
    if (!unique(field)) throw new Error(`Plan ${field} values must be unique.`);
  }
  for (const plan of value.plans) {
    for (const field of ['monthlyPrice', 'annualPrice', 'seatMonthlyPrice', 'seatAnnualPrice', 'trialDays']) {
      if (!Number.isFinite(plan[field]) || plan[field] < 0) throw new Error(`${plan.name}.${field} must be non-negative.`);
    }
    if (!['INDIVIDUAL', 'COMPANY'].includes(plan.audience)) throw new Error(`${plan.name} has an invalid audience.`);
  }
}

validateCatalog(catalog);

const banner = '// Generated from product/catalog.json by scripts/sync-product-catalog.mjs. Do not edit directly.\n';
const serialized = JSON.stringify(catalog, null, 2);
const outputs = [
  path.join(root, 'backend', 'src', 'config', 'product-catalog.generated.ts'),
  path.join(root, 'frontend', 'src', 'config', 'product-catalog.generated.ts'),
];
const expected = `${banner}export const PRODUCT_CATALOG = ${serialized} as const;\n`;
const shouldWrite = process.argv.includes('--write');
let drift = false;

for (const output of outputs) {
  if (shouldWrite) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, expected);
    console.log(`Updated ${path.relative(root, output)}`);
    continue;
  }
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== expected) {
    console.error(`PRODUCT CATALOG DRIFT: ${path.relative(root, output)}`);
    drift = true;
  }
}

if (drift) {
  console.error('Run: node scripts/sync-product-catalog.mjs --write');
  process.exit(1);
}
console.log(`Product catalog is valid and synchronized (${catalog.plans.length} plans).`);
