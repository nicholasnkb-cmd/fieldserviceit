#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
echo "Starting frontend..."
exec node .next/standalone/server.js
