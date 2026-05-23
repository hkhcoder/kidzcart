# KidzCart — Kids Marketplace

A microservices-based e-commerce platform for kids' products with donations, achievements, and coupon rewards. Built as a learning project for DevOps students.

---

## Architecture Overview

```
Browser
  └── http://localhost:4200
        └── Nginx (frontend container)
              ├── /api/auth, /api/users, /api/orders, /api/coupon
              │     └── marketplace (Java Spring Boot :4001)
              │           └── MySQL
              ├── /api/products, /api/donations, /api/notifications
              │     └── product (Node.js :4002)
              │           ├── MongoDB
              │           ├── Redis (cache)
              │           └── RabbitMQ (async messaging)
              └── /api/achievements
                    └── achievement (.NET 8 :4006)
                          └── calls product service for donation data
```

### Services

| Service | Technology | Port | Responsibility |
|---|---|---|---|
| `frontend` | Angular 16 + Nginx | 4200 | SPA + reverse proxy |
| `marketplace` | Java 21 / Spring Boot 3 | 4001 | Auth, users, orders, coupons |
| `product` | Node.js / Express | 4002 | Products, donations, notifications |
| `coupon-worker` | Node.js | — | Async coupon generation (RabbitMQ consumer) |
| `notification-worker` | Node.js | — | Async notification storage (RabbitMQ consumer) |
| `achievement` | .NET 8 / ASP.NET Core | 4006 | Achievements, PDF certificates |
| `mysql` | MySQL 8.4 | 3306 | Auth + order data |
| `mongo` | MongoDB 7 | 27017 | Products + donations data |
| `redis` | Redis 7.4 | 6379 | Product list cache |
| `rabbitmq` | RabbitMQ 3.13 | 5672 / 15672 | Async message queue |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Git

---

## Quick Start (Local Development)

### 1. Clone the repo

```bash
git clone <repo-url>
cd kidzcart
```

### 2. Create your environment file

```bash
cp .env.example .env
```

The default values in `.env.example` work out of the box for local development. No changes needed unless you want to customise passwords.

### 3. Build and start all containers

```bash
docker compose up --build
```

First build takes a few minutes — Maven, npm, and .NET SDK all download dependencies.

### 4. Open the app

```
http://localhost:4200
```

### 5. Useful URLs while running

| URL | What it is |
|---|---|
| http://localhost:4200 | KidzCart web app |
| http://localhost:15672 | RabbitMQ management UI (admin / admin) |
| http://localhost:4001/health | Marketplace service health |
| http://localhost:4002/health | Product service health |
| http://localhost:4006/health | Achievement service health |

---

## Project Structure

```
kidzcart/
├── docker-compose.yml                  # Orchestrates all containers
├── .env.example                        # Environment variable template
├── .env                                # Your local secrets (gitignored)
│
├── frontend/
│   └── kids-marketplace-ui/
│       ├── Dockerfile                  # Multi-stage: Node build → Nginx serve
│       ├── nginx.conf                  # Reverse proxy + SPA fallback
│       └── src/                        # Angular 16 source
│
├── services/
│   ├── marketplace-service/
│   │   ├── Dockerfile                  # Multi-stage: Maven build → JRE runtime
│   │   └── src/                        # Spring Boot (auth, orders, coupons)
│   │
│   ├── achievements-service/
│   │   ├── Dockerfile                  # Multi-stage: .NET SDK build → ASP.NET runtime
│   │   └── AchievementsService/        # .NET 8 (achievements, PDF certificates)
│   │
│   └── product-donation-service/
│       ├── Dockerfile                  # Shared image for API + 2 workers
│       └── src/
│           ├── server.js               # Express API (products, donations)
│           └── workers/
│               ├── couponWorker.js     # RabbitMQ consumer → generates coupons
│               └── notificationWorker.js # RabbitMQ consumer → saves notifications
│
└── db/
    ├── kids_marketplace_mysql_init.sql # MySQL schema + seed data (auto-runs)
    ├── kids_marketplace_init.js        # MongoDB seed data (auto-runs)
    └── mongo-init.sh                   # Shell wrapper to run MongoDB seed
```

---

## How the Docker Setup Works

### Multi-stage Builds
Every Dockerfile uses two stages:
1. **Build stage** — full SDK/toolchain, compiles the app
2. **Runtime stage** — minimal image, only what's needed to run

This keeps final images small and free of build tools.

### Environment Variables
All configuration lives in `.env` at the repo root. Docker Compose automatically reads this file and substitutes `${VAR}` placeholders in `docker-compose.yml`. Each container receives only the variables it needs via the `environment:` block.

### Service Discovery
Containers talk to each other using service names as hostnames (Docker's internal DNS). For example, the product service connects to MongoDB at `mongodb://mongo:27017` — `mongo` resolves to the MongoDB container's IP automatically.

### Startup Order
Health checks on all services ensure containers start in the correct order:
```
mysql → marketplace
mongo + redis + rabbitmq + marketplace → product
product → achievement
marketplace + product + achievement → frontend
```

### Stateful Data
Four named volumes persist data across container restarts:
- `mysql-data` — MySQL databases
- `mongo-data` — MongoDB collections
- `redis-data` — Redis cache
- `rabbitmq-data` — RabbitMQ queues and messages

### Database Seeding
Both databases are seeded automatically on first start:
- **MySQL** — schema + demo users and coupons via `docker-entrypoint-initdb.d`
- **MongoDB** — products and donations via `mongo-init.sh`

---

## Common Commands

```bash
# Start everything (build if needed)
docker compose up --build

# Start in background
docker compose up -d

# Stop all containers (keep data volumes)
docker compose down

# Stop and wipe all data (fresh start)
docker compose down -v

# View logs for a specific service
docker logs kidzcart-marketplace
docker logs kidzcart-product
docker logs kidzcart-frontend

# Rebuild a single service after code changes
docker compose build marketplace
docker compose up -d marketplace

# Check container status and health
docker compose ps -a

# Remove unused volumes
docker volume prune
```

---

## Async Messaging Flow

When a user donates a product:

```
POST /donations
  └── product service saves donation to MongoDB
        └── publishes message to RabbitMQ (km.donation.coupon queue)
              ├── coupon-worker consumes → calls marketplace → creates coupon in MySQL
              └── notification-worker consumes → saves notification to MongoDB
```

---

## Production (Kubernetes)

This `docker-compose.yml` is for **local development only**.

For production deployment on Kubernetes:
- Replace `.env` secrets with Kubernetes Secrets
- Use content-hash image tags (e.g. `kidzcart/frontend:a3f9c12`) instead of `:local`
- Add `livenessProbe` and `readinessProbe` to pod specs (same concept as health checks here)
- Use managed services for stateful workloads (RDS for MySQL, Atlas for MongoDB, ElastiCache for Redis)
- TLS is terminated at the Ingress controller — containers stay HTTP internally

---

## Demo Credentials

Two demo accounts are seeded in MySQL on first start:

| Name | Email | Password |
|---|---|---|
| Amina Kids | amina@example.com | password |
| Ben Helper | ben@example.com | password |

> ⚠️ Passwords are stored in plain text in the seed data — this is a learning project only. Never do this in production.
