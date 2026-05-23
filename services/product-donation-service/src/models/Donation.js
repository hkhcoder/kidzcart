const { randomUUID } = require("crypto");
const mongoose = require("mongoose");

const donationItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
  },
  { _id: false }
);

const donationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    items: { type: [donationItemSchema], required: true },
    note: { type: String, default: null },
    status: { type: String, default: "approved", index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "donations" }
);

donationSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    if (ret.createdAt) {
      ret.createdAt = new Date(ret.createdAt).toISOString();
    }
    return ret;
  },
});

module.exports = {
  Donation: mongoose.model("Donation", donationSchema),
};
