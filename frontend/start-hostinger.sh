#!/bin/bash
set -e

cd "$(dirname "$0")"
export HOSTNAME="0.0.0.0"

if [ ! -f ".next/standalone/server.js" ]; then
  echo "Standalone server missing; rebuilding..."
  npm run build
fi

exec node .next/standalone/server.js
