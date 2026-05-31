#!/bin/bash
echo "$(date) START.SH: Starting frontend..." >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
echo "$(date) START.SH: Node version: $(node --version)" >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
echo "$(date) START.SH: PWD: $(pwd)" >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
echo "$(date) START.SH: PORT: $PORT" >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1

if [ ! -f ".next/standalone/server.js" ]; then
  echo "$(date) START.SH: Missing .next/standalone/server.js, running npm run build..." >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
  npm run build >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
  echo "$(date) START.SH: Build exited with code $?" >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
fi

if [ ! -f ".next/standalone/server.js" ]; then
  echo "$(date) START.SH: ERROR .next/standalone/server.js still missing after build" >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
  exit 1
fi

node .next/standalone/server.js >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
echo "$(date) START.SH: Process exited with code $?" >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
