const fs = require("fs");
const path = require("path");
const tar = require("tar");

const root = path.resolve(__dirname, "..");
const backendDir = path.join(root, "backend");
const output = path.join(__dirname, "dist-backend-source.tar.gz");

const excludes = [
  "node_modules",
  ".env",
  ".env.example",
  ".env.prod.bak",
  ".git",
  "Dockerfile",
  ".dockerignore",
  "docker-entrypoint.sh",
  "uploads",
  ".next",
];

console.log(`Creating archive from ${backendDir}...`);

tar.c(
  {
    gzip: true,
    file: output,
    portable: true,
    cwd: backendDir,
    filter: (filePath) => {
      const parts = filePath.split(/[/\\]/);
      return !parts.some(p => excludes.includes(p));
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
