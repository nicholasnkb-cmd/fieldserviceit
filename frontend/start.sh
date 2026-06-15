#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
echo "Starting frontend..."
exec node node_modules/next/dist/bin/next start
