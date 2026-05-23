#!/usr/bin/env bash
# =============================================================================
# KidzCart — marketplace VM provisioner
# Installs: Java 21, Maven 3, Tomcat 10.1
# Configures: Tomcat on port 4001, systemd service
# Does NOT build or deploy the application — see install-guide.md
# =============================================================================
set -euo pipefail

TOMCAT_VERSION="10.1.55"
TOMCAT_USER="tomcat"
TOMCAT_HOME="/opt/tomcat"
TOMCAT_PORT="4001"

echo "==> [marketplace] System update"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq

# =============================================================================
# 1. Java 21
# =============================================================================
echo "==> [marketplace] Installing Java 21"
apt-get install -y -qq openjdk-21-jdk
java -version

# =============================================================================
# 2. Maven 3
# =============================================================================
echo "==> [marketplace] Installing Maven"
apt-get install -y -qq maven
mvn -version

# =============================================================================
# 3. Tomcat 10.1
# =============================================================================
echo "==> [marketplace] Installing Tomcat ${TOMCAT_VERSION}"

# Dedicated system user
useradd -m -U -d "${TOMCAT_HOME}" -s /bin/false "${TOMCAT_USER}" || true

# Download and extract
cd /tmp
curl -fsSL \
    "https://archive.apache.org/dist/tomcat/tomcat-10/v${TOMCAT_VERSION}/bin/apache-tomcat-${TOMCAT_VERSION}.tar.gz" \
    -o "apache-tomcat-${TOMCAT_VERSION}.tar.gz"

mkdir -p "${TOMCAT_HOME}"
tar -xzf "apache-tomcat-${TOMCAT_VERSION}.tar.gz" \
    -C "${TOMCAT_HOME}" --strip-components=1

chown -R "${TOMCAT_USER}:${TOMCAT_USER}" "${TOMCAT_HOME}"
chmod -R u+x "${TOMCAT_HOME}/bin"

# Change HTTP connector port from 8080 → 4001
sed -i "s/port=\"8080\"/port=\"${TOMCAT_PORT}\"/" \
    "${TOMCAT_HOME}/conf/server.xml"

# =============================================================================
# 4. Tomcat systemd service
# =============================================================================
echo "==> [marketplace] Creating Tomcat systemd service"

JAVA_HOME_PATH=$(readlink -f /usr/bin/java | sed 's|/bin/java||')

tee /etc/systemd/system/tomcat.service <<EOF
[Unit]
Description=Apache Tomcat 10 — KidzCart marketplace-service
After=network.target

[Service]
Type=forking
User=${TOMCAT_USER}
Group=${TOMCAT_USER}
Environment="JAVA_HOME=${JAVA_HOME_PATH}"
Environment="CATALINA_HOME=${TOMCAT_HOME}"
Environment="CATALINA_BASE=${TOMCAT_HOME}"
Environment="CATALINA_PID=${TOMCAT_HOME}/temp/tomcat.pid"
ExecStart=${TOMCAT_HOME}/bin/startup.sh
ExecStop=${TOMCAT_HOME}/bin/shutdown.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable tomcat
# Note: Tomcat is enabled but NOT started — the WAR must be deployed first.
# See install-guide.md Step 2 for build and deploy instructions.

echo "==> [marketplace] Provisioning complete"
echo "    Java   : $(java -version 2>&1 | head -1)"
echo "    Maven  : $(mvn -version 2>&1 | head -1)"
echo "    Tomcat : ${TOMCAT_HOME}  (port ${TOMCAT_PORT}, service: tomcat)"
echo ""
echo "    Next: follow install-guide.md Step 2 to build and deploy the WAR."
