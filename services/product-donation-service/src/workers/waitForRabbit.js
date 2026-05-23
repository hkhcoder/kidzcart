const amqp = require("amqplib");

const INITIAL_DELAY_MS = 2000;
const MAX_DELAY_MS = 60000;

/**
 * Blocks until RabbitMQ accepts a TCP/AMQP connection. Retries with exponential backoff.
 * Use so workers only fully start consuming after the broker is up.
 */
async function waitForRabbitConnection(rabbitUrl, logLabel = "rabbitmq") {
  const url = String(rabbitUrl).trim();
  let delayMs = INITIAL_DELAY_MS;
  for (;;) {
    try {
      const conn = await amqp.connect(url);
      // eslint-disable-next-line no-console
      console.log(`[${logLabel}] RabbitMQ is up; connection established`);
      return conn;
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.log(`[${logLabel}] RabbitMQ not ready (${msg}). Retrying in ${delayMs / 1000}s…`);
      await new Promise((r) => setTimeout(r, delayMs));
      delayMs = Math.min(delayMs * 2, MAX_DELAY_MS);
    }
  }
}

module.exports = { waitForRabbitConnection };
