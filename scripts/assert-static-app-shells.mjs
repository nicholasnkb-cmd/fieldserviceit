import fs from 'fs';
import path from 'path';

const appDir = path.join(process.cwd(), 'frontend', 'src', 'app', '(app)');
const offenders = [];

walk(appDir);

if (offenders.length) {
  console.error('Forced dynamic SSR is not allowed in authenticated app shell routes unless explicitly reviewed.');
  for (const file of offenders) console.error(` - ${file}`);
  process.exit(1);
}

console.log('Static app shell guard passed.');

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/.test(text)) offenders.push(full);
  }
}
