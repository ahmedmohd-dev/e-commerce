const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    displayName: { type: String, default: "" },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
      index: true,
    },
    sellerStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
      index: true,
    },
    sellerProfile: {
      shopName: { type: String, default: "" },
      phone: { type: String, default: "" },
      description: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
