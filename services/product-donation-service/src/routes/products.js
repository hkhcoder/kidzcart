const express = require("express");
const { listProducts, getProduct, createProduct } = require("../store/mongo");
const redis = require("../cache/redis");

const productsRouter = express.Router();

/** Cache TTLs (seconds) */
const TTL_LIST = Number(process.env.REDIS_CACHE_TTL_LIST || 300);
const TTL_ONE = Number(process.env.REDIS_CACHE_TTL_ONE || 600);

// POST /products  { name, category, price, description?, image?, id? }
productsRouter.post("/", async (req, res, next) => {
  try {
    const created = await createProduct(req.body);
    await redis.invalidateListsForCategory(created.category);
    await redis.invalidateListsForCategory("all");
    res.status(201).json(created);
  } catch (e) {
    const code = e.statusCode || 500;
    if (code >= 400 && code < 500) {
      return res.status(code).json({ message: e.message });
    }
    next(e);
  }
});

// GET /products?category=books&q=abc
productsRouter.get("/", async (req, res, next) => {
  try {
    const { category, q } = req.query;
    const key = redis.listKey(category, q);

    if (redis.isEnabled()) {
      const cached = await redis.getJson(key);
      if (cached != null) {
        res.setHeader("X-Cache", "HIT");
        return res.json(cached);
      }
    }

    const list = await listProducts({ category, q });

    if (redis.isEnabled()) {
      await redis.setJson(key, list, TTL_LIST);
    }
    res.setHeader("X-Cache", redis.isEnabled() ? "MISS" : "BYPASS");
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// GET /products/:id
productsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const key = redis.idKey(id);

    if (redis.isEnabled()) {
      const cached = await redis.getJson(key);
      if (cached != null) {
        res.setHeader("X-Cache", "HIT");
        return res.json(cached);
      }
    }

    const p = await getProduct(id);
    if (!p) return res.status(404).json({ message: "Product not found" });

    if (redis.isEnabled()) {
      await redis.setJson(key, p, TTL_ONE);
    }
    res.setHeader("X-Cache", redis.isEnabled() ? "MISS" : "BYPASS");
    res.json(p);
  } catch (e) {
    next(e);
  }
});

module.exports = { productsRouter };
