const Redis = require("ioredis");

/** @type {Redis | null} */
let client = null;

const PREFIX = "km:products";

/**
 * Call before accepting traffic. If REDIS_URL is unset, caching stays disabled (no error).
 */
async function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    // eslint-disable-next-line no-console
    console.log("[redis] REDIS_URL not set — response caching disabled");
    return null;
  }

  const r = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });

  try {
    await r.connect();
    client = r;
    // eslint-disable-next-line no-console
    console.log("[redis] connected for product list / detail cache");
    return r;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[redis] connection failed — continuing without cache:", e.message);
    try {
      await r.quit();
    } catch {
      /* ignore */
    }
    client = null;
    return null;
  }
}

function isEnabled() {
  return client != null;
}

/**
 * @param {string} category
 * @param {string} [q]
 */
function listKey(category, q) {
  const cat = String(category || "all").toLowerCase();
  const qTrim = q != null ? String(q).trim() : "";
  const qPart = qTrim ? `q:${qTrim}` : "q:";
  return `${PREFIX}:list:${cat}:${qPart}`;
}

function idKey(id) {
  return `${PREFIX}:id:${String(id)}`;
}

async function getJson(key) {
  if (!client) return null;
  try {
    const raw = await client.get(key);
    if (raw == null) return null;
    return JSON.parse(raw);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[redis] GET", key, e.message);
    return null;
  }
}

async function setJson(key, value, ttlSeconds) {
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[redis] SET", key, e.message);
  }
}

async function delKey(key) {
  if (!client) return;
  try {
    await client.del(key);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[redis] DEL", key, e.message);
  }
}

/**
 * Invalidate all cached product lists for a category (any search query).
 * @param {string} category
 */
async function invalidateListsForCategory(category) {
  if (!client) return;
  const cat = String(category).toLowerCase();
  const pattern = `${PREFIX}:list:${cat}:*`;
  try {
    const keys = await client.keys(pattern);
    if (keys.length) {
      await client.del(...keys);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[redis] invalidate lists", pattern, e.message);
  }
}

/** Health check using the shared client (after initRedis). */
async function ping() {
  if (!client) return { ok: false, status: "disabled" };
  try {
    const pong = await client.ping();
    return { ok: pong === "PONG", status: "connected" };
  } catch (e) {
    return { ok: false, status: "error", detail: e.message };
  }
}

module.exports = {
  initRedis,
  isEnabled,
  listKey,
  idKey,
  getJson,
  setJson,
  delKey,
  invalidateListsForCategory,
  ping,
};
