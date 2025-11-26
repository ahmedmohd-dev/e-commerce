const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Dispute = require("../models/Dispute");
const {
  sendDisputeUpdate,
  sendStatusUpdate,
  sendSellerStatusUpdate,
} = require("../utils/emailService");
const {
  canAdminTransition,
  isTerminalStatus,
} = require("../utils/orderStatusRules");
const {
  notifyUser,
  notifyUsers,
  notifyAdmins,
  extractSellerIdsFromOrder,
} = require("../services/notification.service");

exports.listSellers = async (req, res) => {
  try {
    const { status } = req.query; // optional filter
    const q = { role: { $in: ["buyer", "seller"] } };
    if (status) q.sellerStatus = status;
    const users = await User.find(q)
      .sort({ createdAt: -1 })
      .select("-firebaseUid");
    return res.json(users);
  } catch (e) {
    return res.status(500).json({ message: "Failed to load sellers" });
  }
};

exports.updateSellerStatus = async (req, res) => {
  try {
    const { status } = req.body; // "pending" | "approved" | "rejected"
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldStatus = user.sellerStatus;
    user.sellerStatus = status;
    if (status === "approved") {
      user.role = "seller";
    } else if (status === "rejected") {
      // demote to buyer if not admin
      if (user.role !== "admin") user.role = "buyer";
    }
    await user.save();

    // Send email notification if status changed to approved or rejected
    if (
      (status === "approved" || status === "rejected") &&
      oldStatus !== status &&
      user.email
    ) {
      try {
        await sendSellerStatusUpdate(user, status);
      } catch (emailErr) {
        console.error("Failed to send seller status email:", emailErr);
        // Don't fail the request if email fails
      }
    }

    notifyUser(user._id, {
      type: "seller:status",
      title: `Seller application ${status}`,
      body:
        status === "approved"
          ? "Congratulations! You can now access the seller center."
          : status === "rejected"
          ? "Your seller application was rejected. Please review admin feedback."
          : "Your seller application is under review.",
      link: status === "approved" ? "/seller" : "/profile",
      icon: "store",
      severity: status === "approved" ? "success" : "warning",
      meta: { status },
    }).catch((err) => console.error("Seller status notification error:", err));

    return res.json(user);
  } catch (e) {
    return res.status(400).json({ message: "Failed to update seller status" });
  }
};

// Get seller stats for admin
exports.getSellerStats = async (req, res) => {
  try {
    const sellerId = req.params.id;
    const mongoose = require("mongoose");

    // Count products
    const productsCount = await Product.countDocuments({
      seller: sellerId,
    });

    // Calculate revenue and orders
    const pipeline = [
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "prod",
        },
      },
      { $unwind: "$prod" },
      {
        $match: {
          "prod.seller": new mongoose.Types.ObjectId(sellerId),
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $addToSet: "$_id" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
    ];

    const statsResult = await Order.aggregate(pipeline);
    const stats = statsResult[0] || {
      totalOrders: [],
      totalRevenue: 0,
    };

    return res.json({
      products: productsCount,
      orders: stats.totalOrders.length,
      revenue: stats.totalRevenue,
    });
  } catch (e) {
    console.error("Get seller stats error:", e);
    return res.status(500).json({ message: "Failed to load seller stats" });
  }
};

// Products CRUD
exports.adminListProducts = async (req, res) => {
  const items = await Product.find({}).sort("-createdAt");
  res.json(items);
};

exports.adminCreateProduct = async (req, res) => {
  const p = await Product.create(req.body);
  res.status(201).json(p);
};

exports.adminUpdateProduct = async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!p) return res.status(404).json({ message: "Not found" });
  res.json(p);
};

exports.adminDeleteProduct = async (req, res) => {
  const p = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!p) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Product hidden", product: p });
};

// Hard delete (permanent)
exports.adminHardDeleteProduct = async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Product deleted" });
};

// Orders management
exports.adminListOrders = async (req, res) => {
  const q = {};
  if (req.query.status) q.status = req.query.status;
  const items = await Order.find(q)
    .sort("-createdAt")
    .populate("user", "email");
  res.json(items);
};

exports.adminUpdateOrderStatus = async (req, res) => {
  const { status } = req.body; // pending|paid|processing|shipped|completed|cancelled
  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }
  const order = await Order.findById(req.params.id).populate("user");
  if (!order) return res.status(404).json({ message: "Not found" });

  const { allowed, reason } = canAdminTransition(order.status, status);
  if (!allowed) {
    return res.status(400).json({ message: reason || "Invalid status change" });
  }

  if (order.status === status) {
    return res.json(order);
  }

  order.status = status;

  const requiresVerification = [
    "paid",
    "processing",
    "shipped",
    "completed",
  ].includes(status);
  if (requiresVerification) {
    order.paymentDetails = order.paymentDetails || {};
    order.paymentDetails.verifiedByAdmin = true;
    order.paymentDetails.verifiedAt =
      order.paymentDetails.verifiedAt || new Date();
  }

  await order.save();

  // Send status update email (non-blocking)
  try {
    const statusesToEmail = [
      "paid",
      "processing",
      "shipped",
      "completed",
      "cancelled",
    ];
    if (statusesToEmail.includes(status) && order.user?.email) {
      await sendStatusUpdate(order, status, order.user.email);
    }
  } catch (emailError) {
    console.error("Failed to send status update email:", emailError);
    // Don't fail the status update if email fails
  }

  notifyUser(order.user?._id, {
    type: "order:status",
    title: `Order moved to ${status}`,
    body: `Your order #${order._id.toString()} is now ${status}.`,
    link: `/order-tracking/${order._id}`,
    icon: "truck",
    severity: status === "completed" ? "success" : "info",
    meta: { orderId: order._id, status },
  }).catch((err) =>
    console.error("Buyer notification error (admin status)", err)
  );

  const sellerIds = extractSellerIdsFromOrder(order);
  if (sellerIds.length) {
    notifyUsers(sellerIds, {
      type: "order:status-admin",
      title: `Order ${order._id.toString()} updated`,
      body: `Admin moved this order to ${status}.`,
      link: `/seller?tab=orders&order=${order._id}`,
      icon: "route",
      severity: "info",
      meta: { orderId: order._id, status },
    }).catch((err) =>
      console.error("Seller notification error (admin status)", err)
    );
  }

  res.json(order);
};

exports.adminVerifyTelebirr = async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user");
  if (!order) return res.status(404).json({ message: "Not found" });
  if (isTerminalStatus(order.status)) {
    return res
      .status(400)
      .json({ message: "Locked orders cannot be re-verified" });
  }
  const verifiableStatuses = ["pending", "paid", "processing"];
  if (!verifiableStatuses.includes(order.status)) {
    return res.status(400).json({
      message: "Order is already in fulfillment. Verification skipped.",
    });
  }
  order.paymentDetails = {
    ...(order.paymentDetails || {}),
    verifiedByAdmin: true,
    verifiedAt: new Date(),
  };
  if (order.status === "pending") {
    order.status = "paid";
  }
  await order.save();

  try {
    if (order.user?.email) {
      await sendStatusUpdate(order, order.status, order.user.email);
    }
  } catch (err) {
    console.error("Failed to send payment verification email:", err);
  }

  notifyUser(order.user?._id, {
    type: "order:verified",
    title: "Payment verified",
    body: `Your order #${order._id.toString()} was verified by admin.`,
    link: `/order-tracking/${order._id}`,
    icon: "badge-check",
    severity: "success",
    meta: { orderId: order._id },
  }).catch((error) =>
    console.error("Buyer notification error (telebirr)", error)
  );

  const sellerIds = extractSellerIdsFromOrder(order);
  if (sellerIds.length) {
    notifyUsers(sellerIds, {
      type: "order:verified",
      title: "Order cleared to process",
      body: `Order #${order._id.toString()} is now verified. You can proceed.`,
      link: `/seller?tab=orders&order=${order._id}`,
      icon: "clipboard-check",
      severity: "success",
      meta: { orderId: order._id },
    }).catch((error) =>
      console.error("Seller notification error (telebirr)", error)
    );
  }

  res.json({ message: "Telebirr verified", order });
};

exports.adminListDisputes = async (req, res) => {
  try {
    const { status } = req.query || {};
    const query = status ? { status } : {};

    const disputes = await Dispute.find(query)
      .sort("-createdAt")
      .populate("order", "status total totalPrice amount createdAt")
      .populate("buyer", "email")
      .populate("seller", "email");

    res.json(disputes);
  } catch (e) {
    console.error("List disputes error:", e);
    res.status(500).json({ message: "Failed to load disputes" });
  }
};

exports.adminUpdateDisputeStatus = async (req, res) => {
  try {
    const {
      status,
      resolution,
      adminNotes,
      message,
      attachments: attachmentUrls = [],
    } = req.body || {};
    const allowed = ["open", "accepted", "rejected", "resolved"];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // Store old status for email notification
    const oldStatus = dispute.status;

    if (status) dispute.status = status;
    if (resolution !== undefined) dispute.resolution = resolution;
    if (adminNotes !== undefined) dispute.adminNotes = adminNotes;

    const attachmentDocs = (attachmentUrls || [])
      .filter((url) => typeof url === "string" && url.trim() !== "")
      .map((url) => ({
        url,
        uploadedBy: req.user?._id,
      }));

    if (
      (message && message.trim().length > 0) ||
      (attachmentDocs && attachmentDocs.length > 0)
    ) {
      dispute.messages.push({
        sender: "admin",
        body: message || "",
        attachments: attachmentDocs,
      });
      if (attachmentDocs.length) {
        dispute.attachments.push(...attachmentDocs);
      }
    }

    await dispute.save();

    const order = await Order.findById(dispute.order)
      .select("items user")
      .lean();
    const sellerIds = extractSellerIdsFromOrder(order);

    const hasStatusChange = status && status !== oldStatus;
    const hasMessage = message && message.trim().length > 0;

    // Send email notification to buyer if there's an update
    try {
      if (hasStatusChange || hasMessage) {
        const buyer = await User.findById(dispute.buyer).select("email").lean();
        const orderForEmail = await Order.findById(dispute.order).lean();

        if (buyer?.email && orderForEmail) {
          let updateType = "message";
          if (hasStatusChange) {
            if (status === "accepted") updateType = "accepted";
            else if (status === "rejected") updateType = "rejected";
            else if (status === "resolved") updateType = "resolved";
          }

          await sendDisputeUpdate(
            dispute,
            orderForEmail,
            buyer.email,
            updateType,
            hasMessage ? message : undefined
          );
        }
      }
    } catch (emailErr) {
      console.error("Failed to send dispute update email:", emailErr);
      // Don't fail the request if email fails
    }

    notifyUser(dispute.buyer, {
      type: "dispute:update",
      title: hasStatusChange
        ? `Dispute ${status || "updated"}`
        : "New dispute message",
      body: hasStatusChange
        ? `Admin updated your dispute to ${status}.`
        : "Admin replied to your dispute.",
      link: `/disputes?order=${dispute.order}`,
      icon: "life-ring",
      severity: hasStatusChange ? "info" : "warning",
      meta: { disputeId: dispute._id, orderId: dispute.order, status },
    }).catch((err) => console.error("Buyer dispute notification error:", err));

    if (sellerIds.length) {
      notifyUsers(sellerIds, {
        type: "dispute:update",
        title: "Dispute updated",
        body: hasStatusChange
          ? `Admin set dispute to ${status}.`
          : "Admin added a message to the dispute.",
        link: `/seller?tab=disputes&order=${dispute.order}`,
        icon: "balance-scale",
        severity: "warning",
        meta: { disputeId: dispute._id, orderId: dispute.order, status },
      }).catch((err) =>
        console.error("Seller dispute notification error:", err)
      );
    }

    res.json(dispute);
  } catch (e) {
    console.error("Update dispute error:", e);
    res.status(500).json({ message: "Failed to update dispute" });
  }
};

// Users
exports.adminListUsers = async (req, res) => {
  const users = await User.find({})
    .select("email role createdAt")
    .sort("-createdAt");
  res.json(users);
};

exports.adminUpdateUserRole = async (req, res) => {
  const { role } = req.body; // 'admin' or 'user'
  if (!role || !["admin", "user"].includes(role))
    return res.status(400).json({ message: "Invalid role" });
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select("email role createdAt");
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
};

// Dashboard stats
exports.adminOverviewStats = async (req, res) => {
  const [productsCount, usersCount, orders] = await Promise.all([
    Product.countDocuments({}),
    User.countDocuments({}),
    Order.find({})
      .select(
        "status total totalPrice amount createdAt items.commissionAmount items.sellerEarnings"
      )
      .lean(),
  ]);

  const ordersCount = orders.length;
  const statusCounts = orders.reduce((acc, o) => {
    const s = o.status || "unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const totalRevenue = orders.reduce((sum, o) => {
    const t = o.totalPrice ?? o.total ?? o.amount ?? 0;
    return sum + Number(t || 0);
  }, 0);

  const totalCommission = orders.reduce((sum, o) => {
    const commission = (o.items || []).reduce(
      (inner, item) => inner + Number(item?.commissionAmount || 0),
      0
    );
    return sum + commission;
  }, 0);

  const totalNetToSellers = orders.reduce((sum, o) => {
    const net = (o.items || []).reduce(
      (inner, item) =>
        inner +
        Number(
          item?.sellerEarnings ??
            Math.max(
              0,
              (item?.price || 0) * (item?.quantity || 0) -
                Number(item?.commissionAmount || 0)
            )
        ),
      0
    );
    return sum + net;
  }, 0);

  res.json({
    totals: {
      revenue: totalRevenue,
      orders: ordersCount,
      users: usersCount,
      products: productsCount,
      commission: Math.round(totalCommission * 100) / 100,
      sellerNet: Math.round(totalNetToSellers * 100) / 100,
    },
    statuses: statusCounts,
  });
};

exports.adminRecentOrders = async (req, res) => {
  const items = await Order.find({})
    .sort("-createdAt")
    .limit(Number(req.query.limit || 5))
    .select("orderNo total totalPrice amount status createdAt")
    .populate("user", "email");
  res.json(items);
};

exports.adminTopProducts = async (req, res) => {
  const limit = Number(req.query.limit || 5);
  const items = await Product.find({ isActive: { $ne: false } })
    .sort({ sold: -1, stock: -1, createdAt: -1 })
    .limit(limit)
    .select("name price category stock sold");
  res.json(items);
};
