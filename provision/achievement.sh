#!/usr/bin/env bash
# =============================================================================
# KidzCart — achievement VM provisioner
# Installs: .NET 8 SDK, Nginx
# Configures: Nginx as reverse proxy skeleton for Kestrel on port 4006
# Does NOT publish or start the application — see install-guide.md
# =============================================================================
set -euo pipefail

KESTREL_PORT="4006"
KESTREL_INTERNAL_PORT="5006"

echo "==> [achievement] System update"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq

# =============================================================================
# 1. .NET 8 SDK
# =============================================================================
echo "==> [achievement] Installing .NET 8 SDK"
wget -q https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb \
    -O /tmp/packages-microsoft-prod.deb
dpkg -i /tmp/packages-microsoft-prod.deb
rm /tmp/packages-microsoft-prod.deb

apt-get update -qq
apt-get install -y -qq dotnet-sdk-8.0

dotnet --version

# =============================================================================
# 2. Nginx (reverse proxy in front of Kestrel)
# =============================================================================
echo "==> [achievement] Installing Nginx"
apt-get install -y -qq nginx

# Configure Nginx to proxy port 4006 → Kestrel on localhost:4006
# Kestrel binds to 127.0.0.1:4006; Nginx accepts external traffic.
tee /etc/nginx/sites-available/achievements <<EOF
server {
    listen ${KESTREL_PORT};
    server_name achievement;

    location / {
        proxy_pass         http://127.0.0.1:${KESTREL_INTERNAL_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/achievements \
       /etc/nginx/sites-enabled/achievements
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable --now nginx
# Note: Nginx is running but will return 502 until Kestrel is started.
# See install-guide.md Step 4 for publish and start instructions.

# =============================================================================
# 3. Dedicated system user + publish directory
# =============================================================================
echo "==> [achievement] Creating achievements system user and publish directory"

useradd --system --no-create-home --shell /usr/sbin/nologin achievements || true
mkdir -p /opt/achievements
chown achievements:achievements /opt/achievements

# =============================================================================
# 4. Kestrel systemd service unit (disabled until app is published)
# =============================================================================
echo "==> [achievement] Creating Kestrel systemd service unit"

tee /etc/systemd/system/achievements.service <<'EOF'
[Unit]
Description=KidzCart Achievements Service (ASP.NET Core / Kestrel)
After=network.target

[Service]
WorkingDirectory=/opt/achievements
ExecStart=/usr/bin/dotnet /opt/achievements/AchievementsService.dll
Restart=always
RestartSec=5
KillSignal=SIGINT
SyslogIdentifier=achievements-service
User=achievements
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
# Service is registered but NOT enabled/started — the app must be published first.
# See install-guide.md Step 4.

echo "==> [achievement] Provisioning complete"
echo "    .NET : $(dotnet --version)"
echo "    Nginx: listening on port ${KESTREL_PORT} (proxying to Kestrel)"
echo ""
echo "    Next: follow install-guide.md Step 4 to publish and start the service."
