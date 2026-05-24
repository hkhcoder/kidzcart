# KidzCart — DevOps Lecture Slide Deck

---

## SLIDE 1 — What is KidzCart?

A **polyglot microservices** children's marketplace and donation platform.

**What kids can do:**
- Browse and buy products (books, toys, clothes)
- Donate items to other families
- Earn achievement certificates for donating
- Receive discount coupons as a thank-you for donating

**Why it's great for DevOps learning:**
- 4 different tech stacks in one project
- 4 different infrastructure components
- Real-world patterns: async messaging, caching, JWT auth, PDF generation

---

## SLIDE 2 — Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Angular + TypeScript | 16.2 / 5.1 |
| Frontend server | Nginx | latest stable |
| Auth / Orders | Spring Boot + Java | 3.3.5 / 21 |
| Products / Donations | Express + Node.js | 5.2 / 20 LTS |
| Achievements | ASP.NET Core + C# | 8.0 / 12 |
| Relational DB | MySQL | 8 |
| Document DB | MongoDB | 7 |
| Cache | Redis | 7 |
| Message broker | RabbitMQ | 3 |

---

## SLIDE 3 — Services and Ports

| Service | Tech | Port |
|---|---|---|
| Angular SPA (Nginx) | Angular 16 | **80** |
| Marketplace Service | Spring Boot / Java 21 | **4001** |
| Product & Donation Service | Node.js / Express 5 | **4002** |
| Achievement Service | ASP.NET Core 8 | **4006** |
| MySQL | — | **3306** |
| MongoDB | — | **27017** |
| Redis | — | **6379** |
| RabbitMQ AMQP | — | **5672** |
| RabbitMQ Management UI | — | **15672** |

> Achievement service: Kestrel binds internally on **5006**, Nginx proxies external traffic on **4006**.

---

## SLIDE 4 — Architecture Flow Diagram

```mermaid
flowchart LR
  subgraph Client
    Browser
  end

  subgraph "Frontend :80"
    Nginx["Nginx\nAngular SPA + Reverse Proxy"]
  end

  subgraph "Marketplace Service :4001"
    Marketplace["Spring Boot / Java 21\n/auth /users /orders /coupon"]
  end

  subgraph "Product & Donation Service :4002"
    ProductAPI["Node.js / Express 5\n/products /donations /notifications"]
    CouponWorker["Coupon Worker"]
    NotificationWorker["Notification Worker"]
  end

  subgraph "Achievement Service :4006"
    Achievement[".NET 8\n/achievements"]
  end

  subgraph Infrastructure
    MySQL[(MySQL :3306)]
    Mongo[(MongoDB :27017)]
    Redis[(Redis :6379)]
    RabbitMQ[(RabbitMQ :5672)]
  end

  Browser --> Nginx
  Nginx -->|"/api/products /api/donations\n/api/notifications"| ProductAPI
  Nginx -->|"/api/auth /api/users\n/api/orders /api/coupon"| Marketplace
  Nginx -->|"/api/achievements"| Achievement

  Marketplace <--> MySQL
  ProductAPI <--> Mongo
  ProductAPI <--> Redis
  ProductAPI --> RabbitMQ

  RabbitMQ --> CouponWorker
  RabbitMQ --> NotificationWorker
  CouponWorker -->|"POST /coupon/generate"| Marketplace
  NotificationWorker <--> Mongo

  Achievement -->|"GET /donations?userId="| ProductAPI
  ProductAPI -->|"proxy /auth /orders /coupon"| Marketplace
```

---

## SLIDE 5 — Marketplace Service (Java)

**Responsibilities:** User registration, login, orders, coupon lifecycle.

**Config file:** `services/marketplace-service/src/main/resources/application.properties`

```properties
server.port=4001

spring.datasource.url=jdbc:mysql://infra:3306/kids_marketplace_auth
spring.datasource.username=admin
spring.datasource.password=Admin@1234

spring.jpa.hibernate.ddl-auto=none

jwt.secret=kids-marketplace-local-dev-secret-min-32b!
jwt.issuer=kids-marketplace
jwt.audience=kids-marketplace
```

**API Endpoints:**
```
POST /auth/signup       → register user, returns JWT
POST /auth/login        → login, returns JWT
GET  /users/me          → current user profile
POST /coupon/generate   → create coupon { userId, discount }
POST /coupon/validate   → validate coupon { code, userId }
POST /orders/checkout   → place order
GET  /orders?userId=    → list orders
GET  /health
```

---

## SLIDE 6 — MySQL Schema

Two databases, one connection. Java uses `catalog` in `@Table` to switch between them.

```
kids_marketplace_auth
├── users    (id, name, email, password_hash, created_at)
└── coupons  (code, user_id, discount, used, created_at, expires_at)

kids_marketplace_order
├── orders   (id, user_id, items_json, subtotal, discount_applied,
│             total, coupon_code, payment_status, created_at)
└── coupons  (code, user_id, discount, used, created_at, expires_at)
```

**Init script:** `db/kids_marketplace_mysql_init.sql`

**Seed data:** 2 demo users — `amina@example.com` / `ben@example.com` (password: `password`)

---

## SLIDE 7 — Product & Donation Service (Node.js)

**Responsibilities:** Product catalogue, donations, notifications, Redis caching, RabbitMQ publishing, and reverse-proxying auth/order calls to Java.

**Config file:** `services/product-donation-service/.env`

```dotenv
PORT=4002
MONGO_URI=mongodb://infra:27017/kids_marketplace
REDIS_URL=redis://infra:6379
REDIS_CACHE_TTL_LIST=300
REDIS_CACHE_TTL_ONE=600
AUTH_USER_SERVICE_URL=http://marketplace:4001
MARKETPLACE_SERVICE_URL=http://marketplace:4001
ORDER_COUPON_SERVICE_URL=http://marketplace:4001
ACHIEVEMENTS_SERVICE_URL=http://achievement:4006
RABBITMQ_URL=amqp://admin:admin@infra:5672
RABBITMQ_QUEUE_NAME=km.donation.coupon
RABBITMQ_NOTIFICATION_QUEUE=km.notifications
```

**3 processes (PM2):**
```
product-server       → src/server.js             HTTP API on :4002
coupon-worker        → src/workers/couponWorker.js
notification-worker  → src/workers/notificationWorker.js
```

---

## SLIDE 8 — MongoDB Schema

**Database:** `kids_marketplace`

```
products
├── _id, name, category (books|toys|clothes), price, description, image
└── Indexes: category, name

donations
├── _id, userId, items[ {name, category} ], note, status, createdAt
└── Indexes: userId, status

notifications
├── _id, userId, type, title, body, read, meta, createdAt
└── Indexes: userId, type, read
```

**Init script:** `db/kids_marketplace_init.js`

**Seed data:** 26 products across books, toys, clothes

---

## SLIDE 9 — Redis Caching

**Purpose:** Cache product list and detail responses to reduce MongoDB load.

**Key pattern:**
```
km:products:list:{category}:{q}   TTL: 300s
km:products:id:{id}               TTL: 600s
```

**Cache flow:**
```
GET /products
  → Check Redis
    ├── HIT  → return JSON  (X-Cache: HIT)
    └── MISS → query MongoDB → store in Redis → return JSON  (X-Cache: MISS)
```

**Cache invalidation:** POST /products deletes all list keys for that category.

**Graceful degradation:** If `REDIS_URL` is not set, caching is silently disabled. Service continues normally with `X-Cache: BYPASS`.

---

## SLIDE 10 — Achievement Service (.NET)

**Responsibilities:** Track achievements based on donation count, generate PDF certificates.

**Config file:** `services/achievements-service/AchievementsService/appsettings.json`

```json
{
  "DonationsApi": {
    "BaseUrl": "http://product:4002"
  },
  "JWT_SECRET": "kids-marketplace-local-dev-secret-min-32b!",
  "JWT_ISSUER": "kids-marketplace",
  "JWT_AUDIENCE": "kids-marketplace",
  "Urls": "http://127.0.0.1:5006"
}
```

**No dedicated database.** Calls Node.js to get donation data:
```
GET http://product:4002/donations?userId={id}
```

**API Endpoints:**
```
GET /achievements/me              → achievements + certificate data (JWT required)
GET /achievements/me/certificate  → PDF download (JWT required)
GET /health
```

---

## SLIDE 11 — JWT Authentication (Shared Secret)

**All three backend services share the same JWT secret.**

```
Secret:    kids-marketplace-local-dev-secret-min-32b!
Issuer:    kids-marketplace
Audience:  kids-marketplace
Algorithm: HS256
Expiry:    6 hours
```

**Flow:**
```
1. User → POST /auth/login → Java Marketplace Service
2. Java validates credentials against MySQL
3. Java issues a signed JWT
4. Client sends JWT in every request:
   Authorization: Bearer <token>
5. Node.js and .NET validate the JWT signature locally
   — no call back to Java needed per request
```

**Where the secret lives:**
- Java: `application.properties` → `jwt.secret`
- Node.js: `.env` → `JWT_SECRET`
- .NET: `appsettings.json` → `JWT_SECRET`

---

## SLIDE 12 — Frontend: Angular SPA

**Routes:**
```
/               → Home
/auth           → Login / Register
/products       → Product catalogue
/products/:id   → Product detail
/cart           → Shopping cart
/checkout       → Checkout          (auth required)
/donate         → Donate items      (auth required)
/profile        → User profile      (auth required)
/achievements   → Achievements      (auth required)
```

**All API calls go through `/api/*`. Nginx strips the prefix and routes to the correct backend:**

```
/api/products, /api/donations, /api/notifications  → Node.js :4002
/api/auth, /api/users, /api/orders, /api/coupon    → Java :4001
/api/achievements                                  → .NET :4006
```

**Dev proxy config:** `frontend/kids-marketplace-ui/proxy.conf.js` — same rules, targets `127.0.0.1`.

---

## SLIDE 13 — Donation Flow (Async Messaging)

```
User → POST /donations
         ↓
    Node.js API
    ├── 1. Save donation → MongoDB
    ├── 2. Save notification → MongoDB  (always, synchronous)
    ├── 3. Publish → RabbitMQ: km.notifications  (async fan-out)
    ├── 4. Call POST /coupon/generate → Java API  (synchronous)
    │         → Java writes coupon to MySQL
    │         → coupon code returned to user immediately
    └── 5. Publish → RabbitMQ: km.donation.coupon  (async backup)
         ↓
    Return { donation, coupon } to user

    Meanwhile (async workers on product service):
    ├── Coupon Worker consumes km.donation.coupon
    │       → POST /coupon/generate → Java (backup/retry path)
    └── Notification Worker consumes km.notifications
            → saves notification to MongoDB (with deduplication)
```

**RabbitMQ Queues:**
| Queue | Name | Durable |
|---|---|---|
| Donation coupon | `km.donation.coupon` | Yes |
| Notifications | `km.notifications` | Yes |

---

## SLIDE 14 — Buy a Product: End-to-End Flow

```
1. GET /api/products
   Browser → Nginx → Node.js :4002
   Node.js → Redis (cache check)
     ├── HIT  → return cached JSON
     └── MISS → MongoDB → cache → return JSON

2. POST /api/orders/checkout
   Browser → Nginx → Java :4001
   Java → validate JWT
   Java → check coupon in MySQL (if provided)
   Java → calculate total = subtotal - discount
   Java → INSERT into MySQL orders table
   Java → return { orderId, total, paymentStatus: "PAID_MOCK" }
```

---

## SLIDE 15 — Key DevOps Concepts in KidzCart

| Concept | Where you see it |
|---|---|
| Service discovery | Hostnames in config files (`infra`, `marketplace`) |
| Configuration management | `.env`, `application.properties`, `appsettings.json` |
| Reverse proxy | Nginx routes `/api/*` to correct backend |
| Health checks | `/health`, `/health/db`, `/health/redis`, `/health/rabbit` |
| Async messaging | RabbitMQ queues for coupon + notification workers |
| Caching | Redis for product responses with TTL |
| Shared secrets | JWT secret across 3 services |
| Graceful degradation | Redis and RabbitMQ optional — service works without them |
| Polyglot persistence | MySQL for relational, MongoDB for documents |

---

*End of slide deck — 15 slides*
