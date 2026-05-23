#!/usr/bin/env bash
# =============================================================================
# KidzCart — frontend VM provisioner
# Installs: Node.js 20 LTS, Nginx
# Configures: Nginx with API proxy rules pointing to backend VMs
# Does NOT install npm deps or build Angular — see install-guide.md
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

# Full Nginx site config with API proxy rules.
# The Angular dist folder does not exist yet — Nginx will return 404 for static
# files until the app is built. The proxy rules are ready immediately.
tee /etc/nginx/sites-available/kidzcart <<'EOF'
server {
    listen 80;
    server_name frontend;

    root /opt/kidzcart/frontend/kids-marketplace-ui/dist/kids-marketplace-ui;
    index index.html;

    # Angular routing — serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # /api/products  /api/donations  /api/notifications  /api/health → product VM
    location ~ ^/api/(products|donations|notifications|health) {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://product:4002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # /api/auth  /api/users  /api/orders  /api/coupon → marketplace VM
    location ~ ^/api/(auth|users|orders|coupon) {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://marketplace:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # /api/achievements → achievement VM
    location /api/achievements {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://achievement:4006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/kidzcart \
       /etc/nginx/sites-enabled/kidzcart
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable --now nginx
# Note: Nginx is running but will serve 404 until Angular is built.
# See install-guide.md Step 5 for npm install and ng build instructions.

echo "==> [frontend] Provisioning complete"
echo "    Node : $(node -v)"
echo "    npm  : $(npm -v)"
echo "    Nginx: listening on port 80"
echo ""
echo "    Next: follow install-guide.md Step 5 to build and serve the Angular app."
