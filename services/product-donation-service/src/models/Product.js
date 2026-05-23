const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: "" },
    /** Optional: URL (https://...) or app path (e.g. assets/products/foo.svg) */
    image: { type: String, default: "" },
  },
  { collection: "products" }
);

productSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = {
  Product: mongoose.model("Product", productSchema),
};
