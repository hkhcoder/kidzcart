#!/usr/bin/env bash
# =============================================================================
# KidzCart — frontend VM provisioner
# Installs: Node.js 20 LTS, Nginx
# Does NOT configure Nginx, install npm deps, or build Angular — see install-guide.md
# =============================================================================
set -euo pipefail

echo "==> [frontend] System update"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq

# =============================================================================
# 1. Node.js 20 LTS (needed for ng build)
# =============================================================================
echo "==> [frontend] Installing Node.js 20 LTS"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs

node -v
npm -v

# =============================================================================
# 2. Nginx
# =============================================================================
echo "==> [frontend] Installing Nginx"
apt-get install -y -qq nginx
systemctl enable nginx
# Nginx site config and proxy rules are applied manually — see install-guide.md Step 4.

echo "==> [frontend] Provisioning complete"
echo "    Node : $(node -v)"
echo "    npm  : $(npm -v)"
echo "    Nginx: installed (not yet configured)"
echo ""
echo "    Next: follow install-guide.md Step 4 to configure Nginx, build, and serve the Angular app."
