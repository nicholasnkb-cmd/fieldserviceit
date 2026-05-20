const axios = require("axios");
const tus = require("tus-js-client");
const fs = require("fs");
const path = require("path");

const API_TOKEN = process.env.HOSTINGER_API_TOKEN || "SSqDpeMneyXmAtJWIVh5k1xSPOrxvVSm9hx0zpcb29dfa455";
const BASE = "https://developers.hostinger.com";
const DOMAIN = "fieldserviceit.com";
const USERNAME = "u209468809";
const ARCHIVE = path.join(__dirname, "dist-frontend-source-fixed.tar.gz");

function log(label, data) {
  const str = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  console.log(`[${label}] ${str}`);
}

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
  if (res.status >= 400) {
    throw new Error(`API ${method} ${urlPath} returned ${res.status}: ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

async function getUploadUrl() {
  const data = await api("post", "/api/hosting/v1/files/upload-urls", { username: USERNAME, domain: DOMAIN });
  log("UPLOAD_CREDS", { url: data.url });
  return data;
}

function tusUpload(filePath, uploadUrl, authToken, authRestToken) {
  return new Promise((resolve, reject) => {
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    const cleanUrl = uploadUrl.replace(/\/$/, "");
    const destUrl = `${cleanUrl}/${filename}?override=true`;
    const headers = {
      "X-Auth": authToken,
      "X-Auth-Rest": authRestToken,
      "upload-length": String(stats.size),
      "upload-offset": "0",
    };

    log("TUS_START", `Uploading ${filename} (${(stats.size / 1024).toFixed(1)} KB) to ${destUrl}`);

    // Pre-create upload
    axios.post(destUrl, "", { headers, timeout: 30000, validateStatus: s => s === 201 || s < 500 })
      .then(preRes => {
        if (preRes.status !== 201) {
          throw new Error(`Pre-upload failed: ${preRes.status}`);
        }
        const upload = new tus.Upload(fs.createReadStream(filePath), {
          uploadUrl: destUrl,
          retryDelays: [1000, 2000, 4000],
          headers,
          uploadSize: stats.size,
          metadata: { filename },
          onError: reject,
          onSuccess: () => {
            log("TUS_DONE", `Uploaded ${filename}`);
            resolve({ url: upload.url, filename });
          },
        });
        upload.start();
      })
      .catch(reject);
  });
}

async function fetchBuildSettings() {
  const filename = path.basename(ARCHIVE);
  const data = await api("get", `/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/builds/settings/from-archive?archive_path=${encodeURIComponent(filename)}`);
  log("BUILD_SETTINGS", data);
  return data;
}

async function triggerBuild(buildSettings) {
  const filename = path.basename(ARCHIVE);
  const buildData = {
    ...buildSettings,
    node_version: buildSettings?.node_version || 20,
    source_type: "archive",
    source_options: { archive_path: filename },
  };
  const data = await api("post", `/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/builds`, buildData);
  log("BUILD_TRIGGERED", data);
  return data;
}

async function listDeployments() {
  const data = await api("get", `/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/builds`);
  log("DEPLOYMENTS", data);
  return data;
}

async function main() {
  // 1. Validate archive
  if (!fs.existsSync(ARCHIVE)) {
    console.error(`Archive not found: ${ARCHIVE}`);
    process.exit(1);
  }

  // 2. Get upload credentials
  const creds = await getUploadUrl();

  // 3. Upload archive
  await tusUpload(ARCHIVE, creds.url, creds.auth_key, creds.rest_auth_key);

  // 4. Fetch build settings
  let buildSettings;
  try {
    buildSettings = await fetchBuildSettings();
  } catch (e) {
    log("WARN", `Build settings fetch failed: ${e.message}. Using defaults.`);
    buildSettings = {
      node_version: 20,
      entry_file: ".next/standalone/server.js",
      install_command: "npm ci",
      build_command: "npm run build",
      start_command: "npm run start -- -p $PORT",
    };
  }

  // 5. Trigger build
  await triggerBuild(buildSettings);

  // 6. Show deployments
  console.log("\n=== Deployment Status ===");
  await listDeployments();
}

main().catch(e => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
