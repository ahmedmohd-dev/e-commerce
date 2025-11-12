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
      enum: ["buyer", "seller"],
      required: true,
    },
    body: { type: String, default: "" },
    attachments: [attachmentSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const contactThreadSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

contactThreadSchema.index({ order: 1, buyer: 1, seller: 1 }, { unique: true });

module.exports = mongoose.model("ContactThread", contactThreadSchema);


