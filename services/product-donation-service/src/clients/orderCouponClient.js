async function generateCoupon({ userId, discount }) {
  const baseUrl =
    process.env.MARKETPLACE_SERVICE_URL ||
    process.env.ORDER_COUPON_SERVICE_URL ||
    "http://localhost:4001";
  const r = await fetch(`${baseUrl}/coupon/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId, discount }),
  });
  if (!r.ok) {
    const txt = await r.text();
    const err = new Error(`Order service error (${r.status}): ${txt}`);
    err.status = r.status;
    throw err;
  }
  return await r.json();
}

module.exports = { generateCoupon };

