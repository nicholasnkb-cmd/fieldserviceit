const axios = require("axios");
const tus = require("tus-js-client");
const fs = require("fs");
const path = require("path");

const API_TOKEN = process.env.HOSTINGER_API_TOKEN || "SSqDpeMneyXmAtJWIVh5k1xSPOrxvVSm9hx0zpcb29dfa455";
const BASE = "https://developers.hostinger.com";
const DOMAIN = "api.fieldserviceit.com";
const USERNAME = "u209468809";

async function api(method, urlPath, body) {
  const config = {
    method,
    url: BASE + urlPath,
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    timeout: 60000,
    validateStatus: s => s < 500,
  };
  if (body) {
    config.headers["Content-Type"] = "application/json";
    config.data = body;
  }
  const res = await axios(config);
  if (res.status >= 400) throw new Error(`API ${res.status}: ${JSON.stringify(res.data)}`);
  return res.data;
}

async function getUploadUrl() {
  return await api("post", "/api/hosting/v1/files/upload-urls", { username: USERNAME, domain: DOMAIN });
}

function tusUpload(filePath, uploadUrl, authToken, authRestToken) {
  return new Promise((resolve, reject) => {
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    const cleanUrl = uploadUrl.replace(/\/$/, "");
    const destUrl = `${cleanUrl}/${filename}?override=true`;
    const headers = {
      "X-Auth": authToken, "X-Auth-Rest": authRestToken,
      "upload-length": String(stats.size), "upload-offset": "0",
    };
    console.log(`Uploading ${filename} (${(stats.size/1024).toFixed(1)} KB)...`);
    axios.post(destUrl, "", { headers, timeout: 30000, validateStatus: s => s === 201 || s < 500 })
      .then(preRes => {
        if (preRes.status !== 201) throw new Error(`Pre-upload failed: ${preRes.status}`);
        const upload = new tus.Upload(fs.createReadStream(filePath), {
          uploadUrl: destUrl, retryDelays: [1000, 2000, 4000], headers,
          uploadSize: stats.size, metadata: { filename },
          onError: reject,
          onSuccess: () => { console.log("Upload complete"); resolve(); },
        });
        upload.start();
      }).catch(reject);
  });
}

async function main() {
  const archivePath = path.join(__dirname, "dist-backend-source.tar.gz");
  if (!fs.existsSync(archivePath)) { console.error("Archive not found"); process.exit(1); }

  // 1. Upload fresh archive
  const creds = await getUploadUrl();
  await tusUpload(archivePath, creds.url, creds.auth_key, creds.rest_auth_key);

  // 2. Trigger build
  // Archive contains source + pre-built dist/. Hostinger installs deps,
  // generates Prisma client, skips build (pre-built), and starts the app.
  const filename = path.basename(archivePath);
  const buildData = {
    node_version: 20,
    entry_file: "dist/main.js",
    install_command: "npm ci --omit=dev && npx prisma generate",
    build_command: null,
    output_directory: "dist",
    source_type: "archive",
    source_options: { archive_path: filename },
  };

  const build = await api("post",
    `/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/builds`,
    buildData
  );
  console.log(`Build triggered: ${build.uuid} (state: ${build.state})`);

  // 3. Poll until done
  let failed = false;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const list = await api("get",
      `/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/builds?page=1&perPage=25`
    );
    const b = list.data.find(x => x.uuid === build.uuid);
    if (!b) continue;
    if (b.state !== build.state) console.log(`State: ${b.state} (${b.updated_at})`);
    if (b.state === "completed" || b.state === "failed") {
      if (b.state === "failed") failed = true;
      try {
        const logs = await api("get",
          `/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/builds/${b.uuid}/logs?fromLine=0`
        );
        if (logs.logs) {
          console.log("\n=== Build Logs ===");
          const lines = logs.logs.split("\n");
          lines.slice(-50).forEach(l => console.log(l));
        } else {
          console.log("Logs: null");
        }
      } catch (e) {
        console.log("Logs unavailable:", e.message);
      }
      break;
    }
  }

  if (failed) { console.error("BUILD FAILED"); process.exit(1); }
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
