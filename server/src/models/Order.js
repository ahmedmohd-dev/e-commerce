const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: String,
  price: Number,
  quantity: Number,
  image: String,
  shippingStatus: {
    type: String,
    enum: ["pending", "shipped", "delivered"],
    default: "pending",
  },
  shippedAt: Date,
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  commissionRate: {
    type: Number,
    default: 0,
  },
  commissionAmount: {
    type: Number,
    default: 0,
  },
  sellerEarnings: {
    type: Number,
    default: 0,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    shippingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    paymentMethod: {
      type: String,
      enum: ["paypal", "telebirr"],
      required: true,
    },
    paymentDetails: {
      transactionId: String,
      status: String,
      verifiedByAdmin: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBySeller: { type: Boolean, default: false },
      sellerVerifiedAt: Date,
    },
    subtotal: Number,
    tax: Number,
    shipping: Number,
    total: Number,
    notes: String,
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
