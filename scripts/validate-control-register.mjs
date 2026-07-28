import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolveRoot = (value) => path.resolve(root, value);
const register = JSON.parse(fs.readFileSync(resolveRoot('compliance/control-register.json'), 'utf8'));
const allowed = new Set(['operating', 'needs-evidence', 'planned', 'not-applicable']);
const failures = [];
const ids = new Set();

for (const [index, control] of (register.controls || []).entries()) {
  const label = control.id || `index ${index}`;
  if (!control.id || ids.has(control.id)) failures.push(`${label}: control ID is missing or duplicated`);
  ids.add(control.id);
  for (const field of ['title', 'ownerRole', 'frequency', 'status']) {
    if (!String(control[field] || '').trim()) failures.push(`${label}: ${field} is required`);
  }
  if (!allowed.has(control.status)) failures.push(`${label}: invalid status ${control.status}`);
  if (!Array.isArray(control.evidence) || !control.evidence.length) failures.push(`${label}: evidence is required`);
  for (const evidence of control.evidence || []) {
    if (!fs.existsSync(resolveRoot(evidence))) failures.push(`${label}: evidence path does not exist: ${evidence}`);
  }
}

const vendors = JSON.parse(fs.readFileSync(resolveRoot('compliance/vendor-register.json'), 'utf8'));
for (const vendor of vendors.vendors || []) {
  for (const field of ['service', 'purpose', 'data', 'criticality', 'contractReview', 'securityReview', 'exitPlan']) {
    if (!String(vendor[field] || '').trim()) failures.push(`vendor ${vendor.service || 'unknown'}: ${field} is required`);
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Control register passed: ${ids.size} controls and ${(vendors.vendors || []).length} vendors.`);
