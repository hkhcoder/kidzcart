require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

const { createMountedProxy } = require("./proxy");
const { initRedis } = require("./cache/redis");
const { productsRouter } = require("./routes/products");
const { donationsRouter } = require("./routes/donations");
const { notificationsRouter } = require("./routes/notifications");

const upstream = {
  auth: process.env.AUTH_USER_SERVICE_URL || "http://127.0.0.1:4001",
  achievements: process.env.ACHIEVEMENTS_SERVICE_URL || "http://127.0.0.1:4006",
  order: process.env.MARKETPLACE_SERVICE_URL || process.env.ORDER_COUPON_SERVICE_URL || "http://127.0.0.1:4001",
};

const app = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(morgan("dev"));

// Reverse-proxy to .NET auth and order/coupon services (same port as SPA API base).
// Do NOT use express.json() before these routes — it consumes the body stream and the
// proxy forwards an empty body to upstream (login/signup break with 400/401).
app.use("/auth", createMountedProxy(upstream.auth));
app.use("/users", createMountedProxy(upstream.auth));
app.use("/achievements", createMountedProxy(upstream.achievements));
app.use("/orders", createMountedProxy(upstream.order));
app.use("/coupon", createMountedProxy(upstream.order));

app.get("/health", (_req, res) =>
  res.json({
    ok: true,
    service: "kidzcart-api",
    targets: {
      ...upstream,
      productsDonations: "this process (MongoDB)",
    },
  }),
);
app.get("/health/db", (_req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.status(ok ? 200 : 503).json({ ok, mongo: ok ? "connected" : "disconnected" });
});

app.get("/health/redis", async (_req, res) => {
  const redis = require("./cache/redis");
  if (!redis.isEnabled()) {
    return res.json({ ok: false, redis: "disabled", hint: "Set REDIS_URL to enable caching" });
  }
  const result = await redis.ping();
  if (result.ok) {
    return res.json({ ok: true, redis: result.status });
  }
  return res.status(503).json({ ok: false, redis: result.status, detail: result.detail });
});

app.get("/health/rabbit", async (_req, res) => {
  const rabbit = require("./queue/rabbitmq");
  const result = await rabbit.healthCheck();
  if (result.ok) {
    return res.json(result);
  }
  if (result.rabbit === "disabled") {
    return res.json(result);
  }
  return res.status(503).json(result);
});

app.use("/products", express.json(), productsRouter);
app.use("/donations", express.json(), donationsRouter);
app.use("/notifications", notificationsRouter);

// Must match frontend `proxy.conf.js` (/api/products, /api/donations → :4002)
const port = Number(process.env.PORT || 4002);
const mongoUri =
  process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kids_marketplace";

mongoose
  .connect(mongoUri)
  .then(async () => {
    // eslint-disable-next-line no-console
    console.log("MongoDB connected");
    await initRedis();
    app.listen(port, "0.0.0.0", () => {
      // eslint-disable-next-line no-console
      console.log(
        `KidzCart API on :${port} (products/donations + proxy → marketplace Java :4001, achievements :4006)`,
      );
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
