require("dotenv").config();

const mongoose = require("mongoose");
const { createNotification, hasNotificationForDonation } = require("../store/mongo");
const { NOTIFICATION_QUEUE_NAME } = require("../queue/rabbitmq");
const { waitForRabbitConnection } = require("./waitForRabbit");

const url = process.env.RABBITMQ_URL;
if (!url || !String(url).trim()) {
  // eslint-disable-next-line no-console
  console.log(
    "[notification-worker] RABBITMQ_URL not set — worker skipped (in-app notifications still work via API).",
  );
  process.exit(0);
}

const mongoUri =
  process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kids_marketplace";

async function main() {
  const conn = await waitForRabbitConnection(url, "notification-worker");

  await mongoose.connect(mongoUri);
  // eslint-disable-next-line no-console
  console.log("[notification-worker] MongoDB connected");
  const ch = await conn.createChannel();
  await ch.assertQueue(NOTIFICATION_QUEUE_NAME, { durable: true });
  await ch.prefetch(5);

  // eslint-disable-next-line no-console
  console.log(`Notification worker listening on queue "${NOTIFICATION_QUEUE_NAME}"`);

  ch.consume(
    NOTIFICATION_QUEUE_NAME,
    async (msg) => {
      if (!msg) return;
      let data;
      try {
        data = JSON.parse(msg.content.toString());
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Invalid JSON in notification message:", e.message);
        ch.ack(msg);
        return;
      }

      const userId = data.userId;
      const type = data.type || "generic";
      if (!userId) {
        // eslint-disable-next-line no-console
        console.error("Missing userId in notification message");
        ch.ack(msg);
        return;
      }

      try {
        const donationId = data.meta && data.meta.donationId;
        if (donationId && (await hasNotificationForDonation(userId, donationId))) {
          ch.ack(msg);
          return;
        }
        await createNotification({
          userId,
          type,
          title: data.title || "Notice",
          body: data.body || "",
          meta: data.meta,
        });
        ch.ack(msg);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to save notification:", e.message);
        ch.nack(msg, false, true);
      }
    },
    { noAck: false },
  );

  conn.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("RabbitMQ connection error:", err.message);
  });
  conn.on("close", () => {
    // eslint-disable-next-line no-console
    console.error("RabbitMQ connection closed");
    process.exit(1);
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
