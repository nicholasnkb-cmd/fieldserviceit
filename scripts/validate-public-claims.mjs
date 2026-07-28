import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoots = [
  path.join(root, 'frontend', 'src', 'app', 'page.tsx'),
  path.join(root, 'frontend', 'src', 'app', 'LandingPageClient.tsx'),
  path.join(root, 'frontend', 'src', 'app', '(public)'),
  path.join(root, 'frontend', 'src', 'components', 'marketing'),
];
const forbidden = [
  [/\$50\s*(?:\/|per)\s*tech/gi, 'obsolete $50/technician pricing'],
  [/\$100\s*(?:\/|per)\s*tech/gi, 'obsolete $100/technician pricing'],
  [/\$150\s*(?:\/|per)\s*tech/gi, 'obsolete $150/technician pricing'],
  [/5\s+technicians?\s+free/gi, 'obsolete five-technician free plan'],
  [/15\+?\s+hours?\s+(?:per|\/)\s*week/gi, 'unsupported time-savings claim'],
  [/(?:save|saving|saves)\s+60%|60%\s+(?:cheaper|savings?)/gi, 'unsupported percentage-savings claim'],
  [/45[- ]minute\s+(?:setup|onboarding|migration)/gi, 'unsupported setup-time claim'],
  [/SOC\s*2\s+(?:certified|audit in progress)/gi, 'unsupported SOC 2 claim'],
  [/HIPAA\s+(?:compliant|BAA available)/gi, 'unsupported HIPAA claim'],
  [/more\s+RMM\s+integrations?\s+than\s+any\s+competitor/gi, 'unsupported superiority claim'],
];

function filesAt(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) =>
    filesAt(path.join(target, entry.name)),
  );
}

const failures = [];
for (const file of publicRoots.flatMap(filesAt).filter((file) => /\.(ts|tsx|md|html)$/.test(file))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const [pattern, description] of forbidden) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) failures.push(`${path.relative(root, file)}: ${description}`);
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(`PUBLIC CLAIM FAILURE ${failure}`));
  process.exit(1);
}
console.log('Public claim gate passed.');
