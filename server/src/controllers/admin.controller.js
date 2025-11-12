const User = require("../models/User");

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
const Product = require("../models/Product");
const Order = require("../models/Order");
const Dispute = require("../models/Dispute");
const {
  sendStatusUpdate,
  sendSellerStatusUpdate,
} = require("../utils/emailService");

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
  const { status } = req.body; // pending|paid|shipped|completed|cancelled
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate("user");
  if (!order) return res.status(404).json({ message: "Not found" });

  // Send status update email (non-blocking)
  try {
    const statusesToEmail = ["paid", "shipped", "delivered", "cancelled"];
    if (statusesToEmail.includes(status) && order.user?.email) {
      await sendStatusUpdate(order, status, order.user.email);
    }
  } catch (emailError) {
    console.error("Failed to send status update email:", emailError);
    // Don't fail the status update if email fails
  }

  res.json(order);
};

exports.adminVerifyTelebirr = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Not found" });
  order.paymentDetails = {
    ...(order.paymentDetails || {}),
    verifiedByAdmin: true,
    verifiedAt: new Date(),
  };
  order.status = "paid";
  await order.save();
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
