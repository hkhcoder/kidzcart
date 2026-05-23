const express = require("express");
const { createDonation, listDonationsByUser, createNotification } = require("../store/mongo");
const { generateCoupon } = require("../clients/orderCouponClient");
const { publishNotificationJob, isQueueMode } = require("../queue/rabbitmq");

const donationsRouter = express.Router();

async function generateCouponSync(userId) {
  try {
    return await generateCoupon({ userId, discount: 10 });
  } catch (e) {
    return { error: e.message };
  }
}

// POST /donations
// Body: { userId: "123", items: [{ name, category }], note? }
donationsRouter.post("/", async (req, res, next) => {
  try {
    const { userId, items, note } = req.body || {};
    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "userId and items are required" });
    }

    const donation = await createDonation({ userId, items, note });

    const notifPayload = {
      userId,
      type: "donation_received",
      title: "Thanks for donating!",
      body: "Use your thank-you discount at checkout — see the code on this page after donating.",
      meta: { donationId: donation.id },
    };
    // Always save in-app notification here so the UI sees it even if the worker was down.
    try {
      await createNotification(notifPayload);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[donations] createNotification failed:", e.message);
    }
    if (isQueueMode()) {
      await publishNotificationJob(notifPayload);
    }

    // Always generate coupon in this request so the SPA gets coupon.code immediately (no worker required).
    // RabbitMQ is still used for optional notification fan-out above; coupon worker is not required for UX.
    const coupon = await generateCouponSync(userId);

    res.status(201).json({ donation, coupon });
  } catch (e) {
    next(e);
  }
});

// GET /donations?userId=123
donationsRouter.get("/", async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const list = await listDonationsByUser(String(userId));
    res.json(list);
  } catch (e) {
    next(e);
  }
});

module.exports = { donationsRouter };

