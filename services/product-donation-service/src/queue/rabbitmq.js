const amqp = require("amqplib");

const QUEUE_NAME = process.env.RABBITMQ_QUEUE_NAME || "km.donation.coupon";
const NOTIFICATION_QUEUE_NAME = process.env.RABBITMQ_NOTIFICATION_QUEUE || "km.notifications";

let connection = null;
let channel = null;

function isQueueMode() {
  return Boolean(process.env.RABBITMQ_URL && String(process.env.RABBITMQ_URL).trim());
}

async function getChannel() {
  if (!isQueueMode()) return null;
  if (channel) return channel;
  const url = process.env.RABBITMQ_URL.trim();
  connection = await amqp.connect(url);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.assertQueue(NOTIFICATION_QUEUE_NAME, { durable: true });

  const reset = () => {
    channel = null;
    connection = null;
  };
  connection.on("error", reset);
  connection.on("close", reset);
  return channel;
}

/**
 * @returns {{ ok: true } | { ok: false, reason: string, detail?: string }}
 */
async function publishDonationCouponJob({ userId, discount }) {
  if (!isQueueMode()) {
    return { ok: false, reason: "no_url" };
  }
  try {
    const ch = await getChannel();
    if (!ch) return { ok: false, reason: "no_channel" };
    const payload = Buffer.from(JSON.stringify({ userId, discount }));
    const sent = ch.sendToQueue(QUEUE_NAME, payload, { persistent: true });
    if (!sent) {
      return { ok: false, reason: "buffer_full" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "publish_error", detail: e.message };
  }
}

/**
 * @returns {{ ok: true } | { ok: false, reason: string, detail?: string }}
 */
async function publishNotificationJob({ userId, type, title, body, meta }) {
  if (!isQueueMode()) {
    return { ok: false, reason: "no_url" };
  }
  try {
    const ch = await getChannel();
    if (!ch) return { ok: false, reason: "no_channel" };
    const payload = Buffer.from(
      JSON.stringify({
        userId: String(userId),
        type: String(type),
        title: String(title ?? ""),
        body: String(body ?? ""),
        meta: meta && typeof meta === "object" ? meta : {},
      }),
    );
    const sent = ch.sendToQueue(NOTIFICATION_QUEUE_NAME, payload, { persistent: true });
    if (!sent) {
      return { ok: false, reason: "buffer_full" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "publish_error", detail: e.message };
  }
}

async function closeRabbit() {
  try {
    if (channel) await channel.close();
  } catch (_) {
    /* ignore */
  }
  try {
    if (connection) await connection.close();
  } catch (_) {
    /* ignore */
  }
  channel = null;
  connection = null;
}

/**
 * For GET /health/rabbit — best-effort channel probe (does not create duplicate long-lived connections if already up).
 */
async function healthCheck() {
  if (!isQueueMode()) {
    return { ok: false, rabbit: "disabled", hint: "Set RABBITMQ_URL to enable donation→coupon queue" };
  }
  try {
    await getChannel();
    return {
      ok: true,
      rabbit: "connected",
      queues: { coupon: QUEUE_NAME, notifications: NOTIFICATION_QUEUE_NAME },
    };
  } catch (e) {
    return { ok: false, rabbit: "error", detail: e.message };
  }
}

module.exports = {
  QUEUE_NAME,
  NOTIFICATION_QUEUE_NAME,
  isQueueMode,
  getChannel,
  publishDonationCouponJob,
  publishNotificationJob,
  closeRabbit,
  healthCheck,
};
