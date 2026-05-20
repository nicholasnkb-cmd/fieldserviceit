const fs = require("fs");
const path = require("path");
const tar = require("tar");

const root = path.resolve(__dirname, "..");
const frontendDir = path.join(root, "frontend");
const output = path.join(__dirname, "dist-frontend-source-fixed.tar.gz");

const rootExcludes = [
  "node_modules",
  ".env",
  ".env.example",
  ".env.local",
  ".env.production",
  ".git",
];

console.log(`Creating archive from ${frontendDir}...`);

tar.c(
  {
    gzip: true,
    file: output,
    portable: true,
    cwd: frontendDir,
    filter: (filePath) => {
      const parts = filePath.split(/[/\\]/);
      if (parts.length === 1) return !rootExcludes.includes(parts[0]);
      return true;
    },
  },
  ["."]
).then(() => {
  const stats = fs.statSync(output);
  console.log(`Created ${output}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
}).catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
