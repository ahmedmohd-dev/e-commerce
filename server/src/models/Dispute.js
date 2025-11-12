const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      required: true,
    },
    body: { type: String, default: "" },
    attachments: [attachmentSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const disputeSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    details: String,
    status: {
      type: String,
      enum: ["open", "accepted", "rejected", "resolved"],
      default: "open",
      index: true,
    },
    resolution: String,
    adminNotes: String,
    attachments: [attachmentSchema],
    messages: [messageSchema],
  },
  { timestamps: true }
);

disputeSchema.index({ order: 1 }, { unique: true });

module.exports = mongoose.model("Dispute", disputeSchema);
