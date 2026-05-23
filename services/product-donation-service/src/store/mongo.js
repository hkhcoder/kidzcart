const mongoose = require("mongoose");
const { Product } = require("../models/Product");
const { Donation } = require("../models/Donation");
const { Notification } = require("../models/Notification");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function listProducts({ category, q } = {}) {
  const filter = {};
  if (category) {
    filter.category = String(category).toLowerCase();
  }
  const qTrim = q != null ? String(q).trim() : "";
  if (qTrim) {
    const rx = new RegExp(escapeRegex(qTrim), "i");
    filter.$or = [{ name: rx }, { description: rx }];
  }
  const docs = await Product.find(filter).sort({ name: 1 }).lean();
  return docs.map(mapProduct);
}

function mapProduct(doc) {
  const out = {
    id: doc._id,
    name: doc.name,
    category: doc.category,
    price: doc.price,
    description: doc.description,
  };
  if (doc.image) {
    out.image = doc.image;
  }
  return out;
}

async function getProduct(id) {
  const doc = await Product.findById(String(id)).lean();
  if (!doc) return null;
  return mapProduct(doc);
}

/**
 * Create a product. Optional `image`: URL (https://...) or Angular asset path (e.g. assets/products/x.svg).
 * Optional `id`: custom string id; otherwise a new ObjectId string is used.
 */
async function createProduct(input = {}) {
  const name = String(input.name ?? "").trim();
  const category = String(input.category ?? "").trim().toLowerCase();
  const price = Number(input.price);
  if (!name || !category || !Number.isFinite(price) || price < 0) {
    const err = new Error("name, category, and a non-negative price are required");
    err.statusCode = 400;
    throw err;
  }
  const description = String(input.description ?? "").trim();
  const image = String(input.image ?? "").trim();
  const customId = String(input.id ?? "").trim();
  const _id = customId || String(new mongoose.Types.ObjectId());

  const exists = await Product.findById(_id).lean();
  if (exists) {
    const err = new Error("Product id already exists");
    err.statusCode = 409;
    throw err;
  }

  const doc = await Product.create({
    _id,
    name,
    category,
    price,
    description,
    ...(image ? { image } : {}),
  });
  return mapProduct(doc.toObject());
}

async function createDonation({ userId, items, note }) {
  const d = new Donation({
    userId,
    items,
    note: note || null,
    status: "approved",
  });
  await d.save();
  return d.toJSON();
}

async function listDonationsByUser(userId) {
  const docs = await Donation.find({ userId: String(userId) }).sort({ createdAt: -1 }).lean();
  return docs.map((doc) => {
    const row = { ...doc };
    row.id = row._id;
    delete row._id;
    if (row.createdAt) {
      row.createdAt = new Date(row.createdAt).toISOString();
    }
    return row;
  });
}

/**
 * Persist an in-app notification (used by the notification worker or sync fallback).
 */
async function createNotification({ userId, type, title, body, meta }) {
  const n = new Notification({
    userId: String(userId),
    type: String(type),
    title: String(title ?? "").trim() || "Notice",
    body: String(body ?? ""),
    read: false,
    meta: meta && typeof meta === "object" ? meta : {},
  });
  await n.save();
  return n.toJSON();
}

async function listNotificationsByUser(userId, { limit = 50 } = {}) {
  const docs = await Notification.find({ userId: String(userId) })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 100))
    .lean();
  return docs.map((doc) => {
    const row = { ...doc };
    row.id = row._id;
    delete row._id;
    if (row.createdAt) {
      row.createdAt = new Date(row.createdAt).toISOString();
    }
    return row;
  });
}

async function markNotificationRead(userId, notificationId) {
  const r = await Notification.updateOne(
    { _id: String(notificationId), userId: String(userId) },
    { $set: { read: true } },
  );
  return r.matchedCount > 0;
}

/** Used by notification worker to avoid duplicate rows when API already saved the notification. */
async function hasNotificationForDonation(userId, donationId) {
  if (donationId == null || donationId === "") return false;
  const n = await Notification.findOne({
    userId: String(userId),
    "meta.donationId": donationId,
  }).lean();
  return !!n;
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  createDonation,
  listDonationsByUser,
  createNotification,
  listNotificationsByUser,
  markNotificationRead,
  hasNotificationForDonation,
};
