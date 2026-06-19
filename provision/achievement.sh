#!/usr/bin/env bash
# =============================================================================
# KidzCart — achievement VM provisioner
# Installs: .NET 8 SDK, Nginx
# Does NOT configure Nginx, publish, or start the application — see install-guide.md
# =============================================================================
set -euo pipefail

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
systemctl enable nginx
# Nginx site config and proxy rules are applied manually — see install-guide.md Step 3.

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
# See install-guide.md Step 3.

echo "==> [achievement] Provisioning complete"
echo "    .NET : $(dotnet --version)"
echo "    Nginx: installed (not yet configured)"
echo ""
echo "    Next: follow install-guide.md Step 3 to configure Nginx, publish, and start the service."
