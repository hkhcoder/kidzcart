# KidzCart

KidzCart is a children's marketplace and donation platform built as a polyglot microservices application. Kids can browse and buy products, donate items, earn achievements, and receive discount coupons for donating.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [VM Topology](#vm-topology)
- [Port Reference](#port-reference)
- [Services](#services)
- [Databases](#databases)
- [Option A — Vagrant Setup (recommended)](#option-a--vagrant-setup-recommended)
- [Option B — Local Development Setup](#option-b--local-development-setup)
- [Restarting Services After a Reboot](#restarting-services-after-a-reboot)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The system is split across five VirtualBox VMs managed by Vagrant. Each VM has a single responsibility. All VMs share a private host-only network (`192.168.56.0/24`) and resolve each other by hostname via `vagrant-hostmanager`.

```
Browser
  └── Nginx (frontend VM :80)
        ├── /api/products, /api/donations, /api/notifications, /api/health
        │     └── Node.js API (product VM :4002)
        │           ├── MongoDB (infra VM :27017)
        │           ├── Redis   (infra VM :6379)
        │           └── RabbitMQ (infra VM :5672)
        ├── /api/auth, /api/users, /api/orders, /api/coupon
        │     └── Spring Boot API (marketplace VM :4001)
        │           └── MySQL (infra VM :3306)
        └── /api/achievements
              └── ASP.NET Core API (achievement VM :4006)
                    └── reads donations from Node.js API
```

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | Angular | 16.2 |
| Frontend language | TypeScript | 5.1 |
| Frontend server | Nginx | latest stable |
| Backend — auth / orders | Spring Boot + Java | 3.3.5 / 21 |
| Backend — products / donations | Express + Node.js | 5.2 / 20 LTS |
| Backend — achievements | ASP.NET Core + C# | 8.0 / 12 |
| Relational DB | MySQL | 8 |
| Document DB | MongoDB | 7 |
| Cache | Redis | 7 |
| Message broker | RabbitMQ | 3 |
| PDF generation | QuestPDF | community |
| VM OS | Ubuntu | 24.04 |
| VM manager | Vagrant + VirtualBox | — |

---

## VM Topology

| VM | Hostname | IP | RAM | Role |
|---|---|---|---|---|
| frontend | frontend | 192.168.56.10 | 512 MB | Angular SPA + Nginx |
| marketplace | marketplace | 192.168.56.11 | 1 GB | Java Spring Boot (auth, orders, coupons) |
| product | product | 192.168.56.12 | 768 MB | Node.js API + RabbitMQ workers |
| achievement | achievement | 192.168.56.13 | 512 MB | .NET 8 achievements + PDF certificates |
| infra | infra | 192.168.56.14 | 2 GB | MySQL + MongoDB + Redis + RabbitMQ |

---

## Port Reference

| Service | VM | IP | Port |
|---|---|---|---|
| Angular (Nginx) | frontend | 192.168.56.10 | 80 |
| Spring Boot | marketplace | 192.168.56.11 | 4001 |
| Node.js / Express | product | 192.168.56.12 | 4002 |
| ASP.NET Core (Kestrel via Nginx) | achievement | 192.168.56.13 | 4006 |
| MySQL | infra | 192.168.56.14 | 3306 |
| MongoDB | infra | 192.168.56.14 | 27017 |
| Redis | infra | 192.168.56.14 | 6379 |
| RabbitMQ AMQP | infra | 192.168.56.14 | 5672 |
| RabbitMQ Management UI | infra | 192.168.56.14 | 15672 |

---

## Services

### Marketplace Service — Java Spring Boot (port 4001)

Handles user registration, login, orders, and coupon management.

- Auth: JWT HS256, 6-hour expiry, secret shared across all services
- Databases: `kids_marketplace_auth` (users, coupons) and `kids_marketplace_order` (orders, coupons) on MySQL
- Endpoints: `POST /auth/signup`, `POST /auth/login`, `GET /users/me`, `POST /orders/checkout`, `GET /orders`, `POST /coupon/generate`, `POST /coupon/validate`
- Deployed as a WAR on Tomcat 10.1

### Product & Donation Service — Node.js (port 4002)

Handles the product catalogue, donations, notifications, and reverse-proxies auth/order calls to the Java service.

- Database: MongoDB (`kids_marketplace` db) for products, donations, notifications
- Cache: Redis for product list and detail responses (TTL 300s / 600s)
- Message broker: RabbitMQ — publishes to `km.donation.coupon` and `km.notifications` queues
- Three PM2 processes: `product-server` (HTTP API), `coupon-worker`, `notification-worker`
- Donation flow: saves donation → saves notification → optionally publishes to RabbitMQ → synchronously calls Java `/coupon/generate` → returns coupon code in the same response

### Achievements Service — .NET 8 (port 4006)

Tracks user achievements based on donation history and generates PDF certificates.

- No dedicated database — reads donations from the Node.js service
- Endpoints: `GET /achievements/me`, `GET /achievements/me/certificate` (PDF download), `GET /health`
- Runs as Kestrel on internal port 5006, exposed externally via Nginx on port 4006
- Runs as the `achievements` system user from `/opt/achievements`

### Frontend — Angular 16 SPA (port 80)

Single-page application served by Nginx. All API calls go through `/api/*` which Nginx proxies to the correct backend VM.

- Routes: `/` (home), `/auth`, `/products`, `/cart`, `/checkout`, `/donate`, `/profile`, `/achievements`
- Proxy rules configured in `provision/frontend.sh` (Vagrant) and `proxy.conf.js` (local dev)

---

## Databases

### MySQL — `kids_marketplace_auth`

| Table | Columns |
|---|---|
| users | id, name, email, password_hash, created_at |
| coupons | code, user_id, discount, used, created_at, expires_at |

### MySQL — `kids_marketplace_order`

| Table | Columns |
|---|---|
| orders | id, user_id, items_json, subtotal, discount_applied, total, coupon_code, payment_status, created_at |
| coupons | code, user_id, discount, used, created_at, expires_at |

### MongoDB — `kids_marketplace`

| Collection | Description |
|---|---|
| products | 26 seeded items across books, toys, clothes |
| donations | user donation records |
| notifications | in-app notifications |

Seed data: 2 demo users (`amina@example.com`, `ben@example.com`, password: `password`).

---

## Option A — Vagrant Setup (recommended)

This is the full multi-VM deployment. All runtimes and infrastructure are provisioned automatically.

### Prerequisites

- [VirtualBox](https://www.virtualbox.org/)
- [Vagrant](https://www.vagrantup.com/)
- vagrant-hostmanager plugin (one-time install):

```bash
vagrant plugin install vagrant-hostmanager
```

### Bring up all VMs

```bash
vagrant up
```

This provisions all 5 VMs. Wait for all to complete before proceeding.

```bash
vagrant ssh <vm-name>   # e.g. vagrant ssh marketplace
```

### Setup order

```
Step 0 — infra VM      → load MySQL schema + MongoDB seed
Step 1 — marketplace VM → build WAR → deploy to Tomcat
Step 2 — product VM    → configure .env → start PM2
Step 3 — achievement VM → publish .NET → start Kestrel
Step 4 — frontend VM   → npm install → ng build → reload Nginx
```

---

### Step 0 — infra VM: Initialise the databases

```bash
vagrant ssh infra
```

#### 0.0 Clone the repository

```bash
git clone https://github.com/hkhcoder/kidzcart.git /opt/kidzcart
```

#### 0.1 MySQL schema + seed

```bash
mysql -u admin -p'Admin@1234' < /opt/kidzcart/db/kids_marketplace_mysql_init.sql
```

Verify:

```bash
mysql -u admin -p'Admin@1234' -e "USE kids_marketplace_auth; SHOW TABLES;"
# Expected: coupons, users

mysql -u admin -p'Admin@1234' -e "USE kids_marketplace_order; SHOW TABLES;"
# Expected: coupons, orders
```

#### 0.2 MongoDB seed

```bash
mongosh "mongodb://127.0.0.1:27017/kids_marketplace" \
    --file /opt/kidzcart/db/kids_marketplace_init.js
```

Verify:

```bash
mongosh "mongodb://127.0.0.1:27017/kids_marketplace" \
    --eval "db.products.countDocuments()"
# Expected: 26
```

---

### Step 1 — marketplace VM: Deploy the Java service

```bash
vagrant ssh marketplace
```

#### 1.0 Clone the repository

```bash
git clone https://github.com/hkhcoder/kidzcart.git /opt/kidzcart
```

#### 1.1 Build the WAR

```bash
cd /opt/kidzcart/services/marketplace-service
mvn package -DskipTests
```

#### 1.2 Deploy to Tomcat

```bash
sudo rm -rf /opt/tomcat/webapps/ROOT*
sudo cp target/marketplace-service-0.0.1-SNAPSHOT.war \
        /opt/tomcat/webapps/ROOT.war
sudo chown tomcat:tomcat /opt/tomcat/webapps/ROOT.war
sudo systemctl start tomcat
```

#### 1.3 Watch the startup log

```bash
sudo tail -f /opt/tomcat/logs/catalina.out
# Wait for: Started MarketplaceApplication in [X] seconds
```

#### 1.4 Verify

```bash
curl http://localhost:4001/health
# Expected: {"ok":true,"service":"marketplace-service"}
```

---

### Step 2 — product VM: Start the Node.js service

```bash
vagrant ssh product
```

#### 2.0 Clone the repository

```bash
git clone https://github.com/hkhcoder/kidzcart.git /opt/kidzcart
```

#### 2.1 Copy the environment config

The `.env.example` file already has all VM hostnames hardcoded. Just copy it:

```bash
cp /opt/kidzcart/services/product-donation-service/.env.example \
   /opt/kidzcart/services/product-donation-service/.env
```

#### 2.2 Install dependencies

```bash
cd /opt/kidzcart/services/product-donation-service
npm install
```

#### 2.3 Create the PM2 ecosystem file

```bash
cat > /opt/kidzcart/services/product-donation-service/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'product-server',
      script: 'src/server.js',
      cwd: '/opt/kidzcart/services/product-donation-service',
      env_file: '/opt/kidzcart/services/product-donation-service/.env',
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'coupon-worker',
      script: 'src/workers/couponWorker.js',
      cwd: '/opt/kidzcart/services/product-donation-service',
      env_file: '/opt/kidzcart/services/product-donation-service/.env',
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'notification-worker',
      script: 'src/workers/notificationWorker.js',
      cwd: '/opt/kidzcart/services/product-donation-service',
      env_file: '/opt/kidzcart/services/product-donation-service/.env',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
EOF
```

#### 2.4 Start with PM2 and enable on boot

> Run all PM2 commands as `root`. PM2 saves the process list to `/root/.pm2` and the systemd startup hook must match the same user.

```bash
sudo -i
cd /opt/kidzcart/services/product-donation-service
pm2 start ecosystem.config.js

# Generate the systemd startup hook for root
pm2 startup systemd -u root --hp /root
# PM2 prints a command — copy and run it exactly as shown

# Save the process list so it restores on reboot
pm2 save
```

#### 2.5 Verify

```bash
pm2 status
curl http://localhost:4002/health
```

---

### Step 3 — achievement VM: Start the .NET service

```bash
vagrant ssh achievement
```

#### 3.0 Clone the repository

```bash
git clone https://github.com/hkhcoder/kidzcart.git /opt/kidzcart
```

#### 3.1 Publish the application

The provisioning script creates the `achievements` system user and `/opt/achievements` directory. Publish directly into it:

```bash
cd /opt/kidzcart/services/achievements-service/AchievementsService
dotnet publish AchievementsService.csproj -c Release -o /opt/achievements
sudo chown -R achievements:achievements /opt/achievements
```

#### 3.2 Enable and start the Kestrel systemd service

```bash
sudo systemctl enable --now achievements
```

#### 3.3 Verify

```bash
# Via Nginx on port 4006 (the path other VMs use)
curl http://achievement:4006/health

# Check logs
sudo journalctl -u achievements -n 30
```

---

### Step 4 — frontend VM: Build and serve the Angular app

```bash
vagrant ssh frontend
```

#### 4.0 Clone the repository

```bash
git clone https://github.com/hkhcoder/kidzcart.git /opt/kidzcart
```

#### 4.1 Install dependencies

```bash
cd /opt/kidzcart/frontend/kids-marketplace-ui
npm install
```

#### 4.2 Build for production

The frontend VM has 512 MB RAM — set the Node heap limit to avoid OOM:

```bash
node --max-old-space-size=400 \
    ./node_modules/@angular/cli/bin/ng.js build
# Output: /opt/kidzcart/frontend/kids-marketplace-ui/dist/kids-marketplace-ui/
```

#### 4.3 Reload Nginx

```bash
sudo systemctl reload nginx
```

#### 4.4 Verify

Open a browser on your host:

```
http://frontend
# or http://192.168.56.10
```

---

### Post-Setup Verification

Run these from your host to confirm all services are reachable:

```bash
# Infra
mysql -h infra -u admin -p'Admin@1234' -e "SHOW DATABASES;"
mongosh "mongodb://infra:27017/kids_marketplace" --eval "db.products.countDocuments()"
redis-cli -h infra ping
# RabbitMQ UI: http://infra:15672  (admin / admin)

# Backend services
curl http://marketplace:4001/health
curl http://product:4002/health
curl http://achievement:4006/health

# Frontend
curl http://frontend
```

---

## Option B — Local Development Setup

Run all services directly on your machine without Vagrant. You need Java 21, Node.js 20, .NET 8 SDK, MySQL 8, MongoDB 7, and optionally Redis and RabbitMQ.

### Start infrastructure (Docker)

```bash
# MySQL
docker run -d --name mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_USER=admin \
  -e MYSQL_PASSWORD=Admin@1234 \
  -p 3306:3306 mysql:8

# MongoDB
docker run -d --name mongodb -p 27017:27017 mongo:7

# Redis (optional — enables product caching)
docker run -d --name redis -p 6379:6379 redis:7-alpine

# RabbitMQ (optional — enables async coupon + notification workers)
docker run -d --name rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  rabbitmq:3-management-alpine
```

### Load the database scripts

```bash
# MySQL schema + seed
mysql -u admin -p'Admin@1234' -h 127.0.0.1 < db/kids_marketplace_mysql_init.sql

# MongoDB seed
mongosh "mongodb://127.0.0.1:27017/kids_marketplace" --file db/kids_marketplace_init.js
```

### 1. Marketplace backend (Java Spring Boot — port 4001)

```bash
cd services/marketplace-service
mvn spring-boot:run
```

Or open the project in any Java IDE and run `MarketplaceApplication.java`.

### 2. Achievements backend (.NET — port 4006)

```bash
cd services/achievements-service/AchievementsService
dotnet run
```

Or open in Visual Studio, set `AchievementsService` as the startup project, and run.

### 3. Product + donation backend (Node.js — port 4002)

Create a `.env` file in `services/product-donation-service/`:

```env
PORT=4002
MONGO_URI=mongodb://127.0.0.1:27017/kids_marketplace
REDIS_URL=redis://127.0.0.1:6379
AUTH_USER_SERVICE_URL=http://127.0.0.1:4001
MARKETPLACE_SERVICE_URL=http://127.0.0.1:4001
ACHIEVEMENTS_SERVICE_URL=http://127.0.0.1:4006
ORDER_COUPON_SERVICE_URL=http://127.0.0.1:4001
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672
```

Then start the service:

```bash
cd services/product-donation-service
npm install
npm run dev
```

### 4. Frontend (Angular — port 4200)

```bash
cd frontend/kids-marketplace-ui
npm install
npm start
```

Open `http://localhost:4200` in your browser. The dev server proxies `/api/*` to the backends automatically via `proxy.conf.js`.

---

## Restarting Services After a Reboot

```bash
# infra — all services (MySQL, MongoDB, Redis, RabbitMQ) start automatically via systemd

# marketplace
vagrant ssh marketplace
sudo systemctl start tomcat

# product
vagrant ssh product
sudo -i
pm2 resurrect   # restores saved process list

# achievement
vagrant ssh achievement
sudo systemctl start achievements nginx

# frontend — Nginx starts automatically via systemd
```

---

## Troubleshooting

### Tomcat returns 404 or 403 on health check
The health endpoint is at `/health`, not `/auth/health`:
```bash
curl http://localhost:4001/health
```

### Tomcat starts but Spring fails (datasource error)
Check that `application.properties` has the correct infra hostname and credentials, then check the Tomcat log:
```bash
cat /opt/tomcat/webapps/ROOT/WEB-INF/classes/application.properties
sudo tail -50 /opt/tomcat/logs/catalina.out
```

### npm install fails with EPROTO symlink error
VirtualBox shared folders don't support symlinks. Since the repo is now cloned to `/opt/kidzcart` (a native filesystem path), this error should not occur. If you see it, confirm you are working from `/opt/kidzcart` and not a shared folder mount.

### PM2 process keeps restarting
Check logs for the failing process:
```bash
pm2 logs product-server --lines 50
```
Confirm `.env` exists and all hostnames/ports are reachable from the product VM.

### .NET service not reachable on port 4006
Kestrel binds to the internal port 5006; Nginx proxies external traffic on 4006. Check both:
```bash
sudo systemctl status achievements nginx
sudo journalctl -u achievements -n 50
sudo ss -tlnp | grep -E '4006|5006'
sudo nginx -t
```

### Angular build fails — out of memory

The frontend VM has 512 MB RAM. If the build runs out of memory, set the Node heap limit explicitly:

```bash
node --max-old-space-size=400 \
    ./node_modules/@angular/cli/bin/ng.js build
```

### MySQL connection refused from marketplace VM
Confirm MySQL is listening on all interfaces and the admin user has remote access:
```bash
# On infra VM
sudo ss -tlnp | grep 3306
mysql -u admin -p'Admin@1234' -e "SELECT user, host FROM mysql.user WHERE user='admin';"
```
