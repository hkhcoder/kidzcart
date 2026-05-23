require("dotenv").config();

const { generateCoupon } = require("../clients/orderCouponClient");
const { QUEUE_NAME } = require("../queue/rabbitmq");
const { waitForRabbitConnection } = require("./waitForRabbit");

const url = process.env.RABBITMQ_URL;
if (!url || !String(url).trim()) {
  // eslint-disable-next-line no-console
  console.log(
    "[coupon-worker] RABBITMQ_URL not set — worker skipped (donations still generate coupons in API).",
  );
  process.exit(0);
}

async function main() {
  const conn = await waitForRabbitConnection(url, "coupon-worker");
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE_NAME, { durable: true });
  await ch.prefetch(1);

  // eslint-disable-next-line no-console
  console.log(`Coupon worker listening on queue "${QUEUE_NAME}"`);

  ch.consume(
    QUEUE_NAME,
    async (msg) => {
      if (!msg) return;
      let data;
      try {
        data = JSON.parse(msg.content.toString());
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Invalid JSON in message, ack and drop:", e.message);
        ch.ack(msg);
        return;
      }

      const userId = data.userId;
      const discount = Number(data.discount) || 10;
      if (!userId) {
        // eslint-disable-next-line no-console
        console.error("Missing userId in message, ack and drop");
        ch.ack(msg);
        return;
      }

      try {
        const coupon = await generateCoupon({ userId, discount });
        // eslint-disable-next-line no-console
        console.log(`Coupon generated for user ${userId}:`, coupon?.code ?? coupon);
        ch.ack(msg);
      } catch (e) {
        const status = e.status;
        const requeue = status == null || status >= 500;
        // eslint-disable-next-line no-console
        console.error(`Coupon generation failed for user ${userId}:`, e.message, requeue ? "(requeue)" : "(drop)");
        ch.nack(msg, false, requeue);
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
