#!/bin/bash
echo "$(date) START.SH: Starting frontend..." >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
echo "$(date) START.SH: Node version: $(node --version)" >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
echo "$(date) START.SH: PWD: $(pwd)" >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
echo "$(date) START.SH: PORT: $PORT" >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
node .next/standalone/server.js >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
echo "$(date) START.SH: Process exited with code $?" >> /home/u209468809/domains/fieldserviceit.com/backend.log 2>&1
