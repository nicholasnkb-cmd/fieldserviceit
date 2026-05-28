const fs = require('fs');
const path = require('path');

const src = path.join('.next', 'static');
const dst = path.join('.next', 'standalone', '.next', 'static');

if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });

fs.readdirSync(src).forEach(f => {
  const s = path.join(src, f);
  const d = path.join(dst, f);
  if (fs.existsSync(d)) fs.rmSync(d, { recursive: true });
  fs.cpSync(s, d, { recursive: true });
});

const pub = 'public';
if (fs.existsSync(pub)) {
  const dp = path.join('.next', 'standalone', 'public');
  if (fs.existsSync(dp)) fs.rmSync(dp, { recursive: true });
  fs.cpSync(pub, dp, { recursive: true });
}

console.log('Static and public copied to standalone');
