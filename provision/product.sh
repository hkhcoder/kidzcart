#!/usr/bin/env bash
# =============================================================================
# KidzCart — product VM provisioner
# Installs: Node.js 20 LTS, PM2
# Does NOT install app dependencies or start the service — see install-guide.md
# =============================================================================
set -euo pipefail

echo "==> [product] System update"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq

# =============================================================================
# 1. Node.js 20 LTS
# =============================================================================
echo "==> [product] Installing Node.js 20 LTS"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs

node -v
npm -v

# =============================================================================
# 2. PM2
# =============================================================================
echo "==> [product] Installing PM2"
npm install -g pm2

pm2 -v

echo "==> [product] Provisioning complete"
echo "    Node : $(node -v)"
echo "    npm  : $(npm -v)"
echo "    PM2  : $(pm2 -v)"
echo ""
echo "    Next: follow install-guide.md Step 3 to configure and start the service."
