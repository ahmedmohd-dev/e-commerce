const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    icon: { type: String, default: "" },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info",
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);


