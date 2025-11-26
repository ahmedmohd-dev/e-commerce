const Notification = require("../models/Notification");

const buildBaseQuery = (userId) => ({
  user: userId,
});

exports.listNotifications = async (req, res) => {
  try {
    const { limit = 20, before } = req.query;
    const query = buildBaseQuery(req.user._id);
    if (before) {
      query._id = { $lt: before };
    }
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 20, 50))
      .lean();

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.json({
      items: notifications,
      unreadCount,
      nextCursor: notifications.length
        ? notifications[notifications.length - 1]._id
        : null,
    });
  } catch (err) {
    console.error("List notifications error:", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unread = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });
    res.json({ unread });
  } catch (err) {
    res.status(500).json({ message: "Failed to load count" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification" });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notifications" });
  }
};


