#!/bin/bash
set -e

cd "$(dirname "$0")"
export HOSTNAME="0.0.0.0"

if [ ! -f ".next/BUILD_ID" ]; then
  echo "Production build missing; rebuilding..."
  npm run build
fi

exec node node_modules/next/dist/bin/next start
