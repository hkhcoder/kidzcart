const express = require("express");
const { listNotificationsByUser, markNotificationRead } = require("../store/mongo");

const notificationsRouter = express.Router();

notificationsRouter.get("/", async (req, res, next) => {
  try {
    const { userId, limit } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const list = await listNotificationsByUser(String(userId), { limit });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

notificationsRouter.patch("/:id/read", express.json(), async (req, res, next) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const ok = await markNotificationRead(String(userId), req.params.id);
    if (!ok) return res.status(404).json({ message: "Notification not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = { notificationsRouter };
