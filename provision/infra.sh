#!/usr/bin/env bash
# =============================================================================
# KidzCart — infra VM provisioner
# Installs: MySQL 8, MongoDB 7, Redis 7, RabbitMQ 3 (Erlang 26)
# Configures each service to listen on 0.0.0.0 and start on boot.
# =============================================================================
set -euo pipefail

MYSQL_ADMIN_USER="admin"
MYSQL_ADMIN_PASS="Admin@1234"
PRIVATE_NET="192.168.56.%"

echo "==> [infra] System update"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq

# =============================================================================
# 1. MySQL 8
# =============================================================================
echo "==> [infra] Installing MySQL 8"
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mysql-server

# Listen on all interfaces
sed -i 's/^bind-address\s*=.*/bind-address = 0.0.0.0/' \
    /etc/mysql/mysql.conf.d/mysqld.cnf

systemctl enable --now mysql

echo "==> [infra] Creating databases and admin user"
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS kids_marketplace_auth
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS kids_marketplace_order
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${MYSQL_ADMIN_USER}'@'localhost'
  IDENTIFIED BY '${MYSQL_ADMIN_PASS}';
CREATE USER IF NOT EXISTS '${MYSQL_ADMIN_USER}'@'${PRIVATE_NET}'
  IDENTIFIED BY '${MYSQL_ADMIN_PASS}';

GRANT ALL PRIVILEGES ON kids_marketplace_auth.*  TO '${MYSQL_ADMIN_USER}'@'localhost';
GRANT ALL PRIVILEGES ON kids_marketplace_order.* TO '${MYSQL_ADMIN_USER}'@'localhost';
GRANT ALL PRIVILEGES ON kids_marketplace_auth.*  TO '${MYSQL_ADMIN_USER}'@'${PRIVATE_NET}';
GRANT ALL PRIVILEGES ON kids_marketplace_order.* TO '${MYSQL_ADMIN_USER}'@'${PRIVATE_NET}';

FLUSH PRIVILEGES;
SQL

sudo systemctl restart mysql
# =============================================================================
# 2. MongoDB 7
# =============================================================================
echo "==> [infra] Installing MongoDB 7"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc \
    | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
    | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt-get update -qq
apt-get install -y -qq mongodb-org

# Listen on all interfaces
sed -i 's/bindIp:.*/bindIp: 0.0.0.0/' /etc/mongod.conf

systemctl enable --now mongod

# =============================================================================
# 3. Redis 7
# =============================================================================
echo "==> [infra] Installing Redis 7"
apt-get install -y -qq redis-server

# Listen on all interfaces, disable protected-mode
sed -i 's/^bind .*/bind 0.0.0.0/' /etc/redis/redis.conf
sed -i 's/^protected-mode yes/protected-mode no/' /etc/redis/redis.conf

systemctl enable --now redis-server
systemctl restart redis-server

# =============================================================================
# 4. RabbitMQ 3 (with Erlang from official RabbitMQ repos)
# =============================================================================
echo "==> [infra] Installing Erlang + RabbitMQ 3"
apt-get install -y -qq curl gnupg apt-transport-https

# Team RabbitMQ's signing key
curl -1sLf "https://keys.openpgp.org/vks/v1/by-fingerprint/0A9AF2115F4687BD29803A206B73A36E6026DFCA" \
    | gpg --dearmor \
    | tee /usr/share/keyrings/com.rabbitmq.team.gpg > /dev/null

# Add official RabbitMQ apt repositories (Erlang + RabbitMQ server)
tee /etc/apt/sources.list.d/rabbitmq.list <<'EOF'
## Modern Erlang/OTP releases
deb [arch=amd64 signed-by=/usr/share/keyrings/com.rabbitmq.team.gpg] https://deb1.rabbitmq.com/rabbitmq-erlang/ubuntu/noble noble main
deb [arch=amd64 signed-by=/usr/share/keyrings/com.rabbitmq.team.gpg] https://deb2.rabbitmq.com/rabbitmq-erlang/ubuntu/noble noble main

## Latest RabbitMQ releases
deb [arch=amd64 signed-by=/usr/share/keyrings/com.rabbitmq.team.gpg] https://deb1.rabbitmq.com/rabbitmq-server/ubuntu/noble noble main
deb [arch=amd64 signed-by=/usr/share/keyrings/com.rabbitmq.team.gpg] https://deb2.rabbitmq.com/rabbitmq-server/ubuntu/noble noble main
EOF

apt-get update -qq

# Install Erlang
apt-get install -y -qq \
    erlang-base erlang-asn1 erlang-crypto erlang-eldap \
    erlang-ftp erlang-inets erlang-mnesia erlang-os-mon \
    erlang-parsetools erlang-public-key erlang-runtime-tools \
    erlang-snmp erlang-ssl erlang-syntax-tools erlang-tftp \
    erlang-tools erlang-xmerl

# Install RabbitMQ
apt-get install -y --fix-missing rabbitmq-server

rabbitmq-plugins enable rabbitmq_management
systemctl enable --now rabbitmq-server

# Create guest user with admin rights (ignore error if already exists)
rabbitmqctl add_user guest guest    || true
rabbitmqctl set_user_tags guest administrator
rabbitmqctl set_permissions -p / guest ".*" ".*" ".*"

# RabbitMQ restricts the 'guest' user to localhost-only connections by default.
# Create a dedicated 'admin' user for remote access (e.g. management UI from host).
rabbitmqctl add_user admin admin    || true
rabbitmqctl set_user_tags admin administrator
rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"

echo "==> [infra] Provisioning complete"
echo "    MySQL  : infra:3306  (user: ${MYSQL_ADMIN_USER} / ${MYSQL_ADMIN_PASS})"
echo "             Databases created. Run DB init scripts manually — see install-guide.md Step 0."
echo "    MongoDB: infra:27017"
echo "             Run seed script manually — see install-guide.md Step 0."
echo "    Redis  : infra:6379"
echo "    RabbitMQ AMQP : infra:5672"
echo "    RabbitMQ UI   : http://infra:15672  (guest/guest)"
