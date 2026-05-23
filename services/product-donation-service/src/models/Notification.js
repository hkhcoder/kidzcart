const { randomUUID } = require("crypto");
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "notifications" },
);

notificationSchema.set("toJSON", {
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
  Notification: mongoose.model("Notification", notificationSchema),
};
