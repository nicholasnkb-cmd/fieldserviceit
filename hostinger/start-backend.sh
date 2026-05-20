#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/../backend"
exec node dist/main.js
