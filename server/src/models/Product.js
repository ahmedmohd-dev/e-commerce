const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    isEnabled: { type: Boolean, default: false },
    price: { type: Number },
    start: { type: Date },
    end: { type: Date },
    badgeText: { type: String, default: "" },
    discountPercent: { type: Number, default: 0 },
  },
  { _id: false }
);

const metricsSchema = new mongoose.Schema(
  {
    viewCount: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    favoriteCount: { type: Number, default: 0 },
    lastViewedAt: { type: Date },
    lastPurchasedAt: { type: Date },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    description: { type: String, default: "" },
    images: [{ type: String }],
    category: { type: String, default: "" },
    brand: { type: String, default: "" },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    sale: { type: saleSchema, default: () => ({}) },
    metrics: { type: metricsSchema, default: () => ({}) },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

// Performance indexes
productSchema.index({ "metrics.purchaseCount": -1, createdAt: -1 });
productSchema.index({
  "sale.isEnabled": 1,
  "sale.start": 1,
  "sale.end": 1,
});
// Critical indexes for common queries
productSchema.index({ isActive: 1, createdAt: -1 }); // Default listing
productSchema.index({ isActive: 1, category: 1, createdAt: -1 }); // Category filtering
productSchema.index({ isActive: 1, brand: 1, createdAt: -1 }); // Brand filtering
productSchema.index({ isActive: 1, price: 1 }); // Price range queries
productSchema.index({ isActive: 1, stock: 1 }); // Stock filtering
productSchema.index({ isActive: 1, rating: -1 }); // Rating filtering
// Note: slug already has unique index from schema definition, so we don't need to add it again
productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  category: "text",
}); // Text search

module.exports = mongoose.model("Product", productSchema);
