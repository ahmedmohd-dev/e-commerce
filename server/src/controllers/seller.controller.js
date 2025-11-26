const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const ContactThread = require("../models/ContactThread");
const mongoose = require("mongoose");
const { sendStatusUpdate } = require("../utils/emailService");
const { canSellerTransition } = require("../utils/orderStatusRules");
const {
  notifyAdmins,
  notifyUser,
  notifyUsers,
  extractSellerIdsFromOrder,
} = require("../services/notification.service");

exports.applyForSeller = async (req, res) => {
  try {
    const { shopName = "", phone = "", description = "" } = req.body || {};
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          sellerStatus: "pending",
          "sellerProfile.shopName": shopName,
          "sellerProfile.phone": phone,
          "sellerProfile.description": description,
        },
      },
      { new: true }
    );
    notifyAdmins({
      type: "seller:application",
      title: "New seller application",
      body: `${user.email || "A buyer"} applied to become a seller.`,
      link: `/admin/dashboard?tab=sellers`,
      icon: "store",
      severity: "info",
      meta: { applicantId: user._id },
    }).catch((err) =>
      console.error("Seller application notification error:", err)
    );
    return res.json(user);
  } catch (e) {
    return res.status(500).json({ message: "Failed to apply as seller" });
  }
};

exports.listMyProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const q = {
      seller: req.user._id,
    };
    if (search) {
      q.name = { $regex: search, $options: "i" };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Product.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(q),
    ]);
    const pages = Math.ceil(total / Number(limit)) || 1;
    return res.json({ items, total, page: Number(page), pages });
  } catch (e) {
    return res.status(500).json({ message: "Failed to load products" });
  }
};

exports.createMyProduct = async (req, res) => {
  try {
    const payload = req.body || {};
    payload.seller = req.user._id;
    const created = await Product.create(payload);
    return res.status(201).json(created);
  } catch (e) {
    return res.status(400).json({ message: "Failed to create product" });
  }
};

exports.updateMyProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOne({ _id: id, seller: req.user._id });
    if (!product) return res.status(404).json({ message: "Not found" });
    const updatable = [
      "name",
      "slug",
      "price",
      "description",
      "images",
      "category",
      "brand",
      "stock",
      "isActive",
    ];
    for (const key of updatable) {
      if (key in req.body) {
        product[key] = req.body[key];
      }
    }
    await product.save();
    return res.json(product);
  } catch (e) {
    return res.status(400).json({ message: "Failed to update product" });
  }
};

exports.deleteMyProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOneAndDelete({
      _id: id,
      seller: req.user._id,
    });
    if (!product) return res.status(404).json({ message: "Not found" });
    return res.json({ success: true });
  } catch (e) {
    return res.status(400).json({ message: "Failed to delete product" });
  }
};

// List orders that include this seller's products.
// Returns only the items belonging to this seller for each order.
exports.listMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const sellerId = req.user._id;

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // Aggregate orders with only items belonging to this seller
    const pipeline = [
      { $match: { "items.seller": sellerObjectId } },
      {
        $project: {
          user: 1,
          status: 1,
          createdAt: 1,
          paymentDetails: 1,
          total: 1,
          totalPrice: 1,
          amount: 1,
          subtotal: 1,
          items: {
            $filter: {
              input: "$items",
              as: "item",
              cond: {
                $eq: ["$$item.seller", sellerObjectId],
              },
            },
          },
        },
      },
      {
        $addFields: {
          sellerSubtotal: {
            $sum: {
              $map: {
                input: "$items",
                as: "item",
                in: { $multiply: ["$$item.price", "$$item.quantity"] },
              },
            },
          },
          sellerNet: {
            $sum: {
              $map: {
                input: "$items",
                as: "item",
                in: {
                  $ifNull: [
                    "$$item.sellerEarnings",
                    { $multiply: ["$$item.price", "$$item.quantity"] },
                  ],
                },
              },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
    ];

    const countPipeline = [
      { $match: { "items.seller": sellerObjectId } },
      { $count: "total" },
    ];

    const [rows, totalArr] = await Promise.all([
      Order.aggregate(pipeline),
      Order.aggregate(countPipeline),
    ]);
    const total = totalArr?.[0]?.total || 0;
    const pages = Math.ceil(total / Number(limit)) || 1;

    // Populate user email
    const userIds = rows.map((r) => r.user).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .select("email")
      .lean();
    const map = new Map(users.map((u) => [String(u._id), u]));
    const items = rows.map((r) => ({
      _id: r._id,
      user: r.user
        ? { _id: r.user, email: map.get(String(r.user))?.email }
        : null,
      status: r.status,
      createdAt: r.createdAt,
      paymentDetails: r.paymentDetails,
      items: r.items,
      subtotal: r.sellerSubtotal,
      net: r.sellerNet,
      total: r.total,
      totalPrice: r.totalPrice,
      amount: r.amount,
    }));

    return res.json({ items, total, page: Number(page), pages });
  } catch (e) {
    return res.status(500).json({ message: "Failed to load orders" });
  }
};

// Allow seller to update order payment/status for their orders
exports.sellerUpdateOrderStatus = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { orderId } = req.params;
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await Order.findById(orderId).populate("user");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.paymentDetails?.verifiedByAdmin) {
      return res
        .status(400)
        .json({ message: "Wait for admin to verify the payment first" });
    }

    const itemsForSeller = order.items.filter(
      (item) => item.seller && String(item.seller) === String(sellerId)
    );
    if (!itemsForSeller.length) {
      return res.status(403).json({ message: "Access denied" });
    }

    const allItemsBelongToSeller = order.items.every(
      (item) => !item.seller || String(item.seller) === String(sellerId)
    );

    if (!allItemsBelongToSeller && status !== order.status) {
      return res.status(403).json({
        message:
          "Cannot update overall order status because this order contains products from multiple sellers.",
      });
    }

    const { allowed, reason } = canSellerTransition(order.status, status, {
      paymentVerified: !!order.paymentDetails?.verifiedByAdmin,
    });
    if (!allowed) {
      return res.status(400).json({ message: reason || "Invalid transition" });
    }

    if (order.status === status) {
      return res.json({ success: true, order });
    }

    order.status = status;

    await order.save();

    try {
      if (order.user?.email) {
        await sendStatusUpdate(order, order.status, order.user.email);
      }
    } catch (emailErr) {
      console.error("Failed to send order status email:", emailErr);
    }

    notifyUser(order.user?._id, {
      type: "order:status",
      title: `Order updated to ${status}`,
      body: `Your order #${order._id.toString()} is now ${status}.`,
      link: `/order-tracking/${order._id}`,
      icon: "truck",
      severity: "info",
      meta: { orderId: order._id, status },
    }).catch((err) =>
      console.error("Buyer order status notification error:", err)
    );

    notifyAdmins({
      type: "order:seller-progress",
      title: "Seller updated an order",
      body: `Seller ${
        req.user._id
      } changed order #${order._id.toString()} to ${status}.`,
      link: `/admin/dashboard?order=${order._id}`,
      icon: "route",
      severity: "info",
      meta: { orderId: order._id, status, sellerId: req.user._id },
    }).catch((err) =>
      console.error("Admin order update notification error:", err)
    );

    return res.json({ success: true, order });
  } catch (error) {
    console.error("Seller update order status error:", error);
    return res.status(500).json({ message: "Failed to update order status" });
  }
};

// Update shipping status for a specific item in an order
exports.updateItemShippingStatus = async (req, res) => {
  try {
    const { orderId, itemProductId } = req.params;
    const { shippingStatus } = req.body;

    if (!["pending", "shipped", "delivered"].includes(shippingStatus)) {
      return res.status(400).json({ message: "Invalid shipping status" });
    }

    const sellerId = req.user._id;

    // Find the order and verify the item belongs to this seller
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the item and verify it belongs to this seller
    const itemIndex = order.items.findIndex(
      (item) => String(item.product) === String(itemProductId)
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    // Verify the product belongs to this seller
    const Product = require("../models/Product");
    const product = await Product.findById(itemProductId);
    if (!product || String(product.seller) !== String(sellerId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update the item's shipping status
    order.items[itemIndex].shippingStatus = shippingStatus;
    if (shippingStatus === "shipped") {
      order.items[itemIndex].shippedAt = new Date();
    }

    await order.save();

    return res.json({ success: true, order });
  } catch (e) {
    console.error("Update shipping status error:", e);
    return res
      .status(500)
      .json({ message: "Failed to update shipping status" });
  }
};

// Get seller dashboard overview stats
exports.sellerOverviewStats = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // Count seller's products (handle both ObjectId and string)
    const productsCount = await Product.countDocuments({
      $or: [
        { seller: sellerObjectId },
        { seller: sellerId },
        { seller: String(sellerId) },
      ],
    });

    console.log(
      `[Seller Stats] Products count for seller ${sellerId}:`,
      productsCount
    );

    // Get all orders containing seller's products and calculate totals
    const sellerIdStr = String(sellerId);

    // Match orders that have items with this seller (handle both ObjectId and string)
    const pipeline = [
      {
        $match: {
          $or: [
            { "items.seller": sellerObjectId },
            { "items.seller": sellerIdStr },
          ],
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          $or: [
            { "items.seller": sellerObjectId },
            { "items.seller": sellerIdStr },
            { $expr: { $eq: [{ $toString: "$items.seller" }, sellerIdStr] } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $addToSet: "$_id" },
          grossRevenue: {
            $sum: {
              $multiply: [
                { $ifNull: ["$items.price", 0] },
                { $ifNull: ["$items.quantity", 0] },
              ],
            },
          },
          netRevenue: {
            $sum: {
              $ifNull: [
                "$items.sellerEarnings",
                {
                  $multiply: [
                    { $ifNull: ["$items.price", 0] },
                    { $ifNull: ["$items.quantity", 0] },
                  ],
                },
              ],
            },
          },
          itemsShipped: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$items.shippingStatus", "shipped"] },
                    { $eq: ["$items.shippingStatus", "delivered"] },
                    { $eq: ["$items.shippingStatus", "completed"] },
                  ],
                },
                { $ifNull: ["$items.quantity", 0] },
                0,
              ],
            },
          },
          itemsPending: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $ne: [
                        { $ifNull: ["$items.shippingStatus", "pending"] },
                        "shipped",
                      ],
                    },
                    {
                      $ne: [
                        { $ifNull: ["$items.shippingStatus", "pending"] },
                        "delivered",
                      ],
                    },
                    {
                      $ne: [
                        { $ifNull: ["$items.shippingStatus", "pending"] },
                        "completed",
                      ],
                    },
                  ],
                },
                { $ifNull: ["$items.quantity", 0] },
                0,
              ],
            },
          },
        },
      },
    ];

    const statsResult = await Order.aggregate(pipeline);
    console.log(`🔍 [Seller Stats] Aggregation pipeline executed`);
    console.log(
      `🔍 [Seller Stats] Raw aggregation result:`,
      JSON.stringify(statsResult, null, 2)
    );

    const stats = statsResult[0] || {
      totalOrders: [],
      grossRevenue: 0,
      netRevenue: 0,
      itemsShipped: 0,
      itemsPending: 0,
    };

    // Debug logging
    console.log(`🔍 [Seller Stats] Seller ID: ${sellerId}`);
    console.log(`🔍 [Seller Stats] Seller ObjectId: ${sellerObjectId}`);
    console.log(`🔍 [Seller Stats] Seller ID String: ${sellerIdStr}`);
    console.log(
      `🔍 [Seller Stats] Processed stats:`,
      JSON.stringify(stats, null, 2)
    );
    console.log(`🔍 [Seller Stats] Total orders array:`, stats.totalOrders);
    console.log(
      `🔍 [Seller Stats] Total orders array length:`,
      stats.totalOrders?.length || 0
    );
    console.log(`🔍 [Seller Stats] Gross Revenue:`, stats.grossRevenue);
    console.log(`🔍 [Seller Stats] Net Revenue:`, stats.netRevenue);
    console.log(`🔍 [Seller Stats] Items Shipped:`, stats.itemsShipped);
    console.log(`🔍 [Seller Stats] Items Pending:`, stats.itemsPending);

    // Get low stock products (stock < 10)
    const lowStockProducts = await Product.find({
      seller: sellerId,
      stock: { $lt: 10 },
      isActive: { $ne: false },
    })
      .select("name stock")
      .limit(5)
      .sort({ stock: 1 });

    // Ensure we have valid numbers
    const ordersCount = Array.isArray(stats.totalOrders)
      ? stats.totalOrders.length
      : 0;
    const grossRevenue = Number(stats.grossRevenue || 0);
    const netRevenue = Number(stats.netRevenue || grossRevenue || 0);
    const itemsShipped = Number(stats.itemsShipped || 0);
    const itemsPending = Number(stats.itemsPending || 0);

    console.log(`✅ [Seller Stats] Final calculated values:`, {
      products: productsCount,
      orders: ordersCount,
      grossRevenue,
      netRevenue,
      itemsShipped,
      itemsPending,
    });

    const responseData = {
      totals: {
        products: productsCount,
        orders: ordersCount,
        revenue: netRevenue,
        grossRevenue: grossRevenue,
        netRevenue: netRevenue,
        itemsShipped: itemsShipped,
        itemsPending: itemsPending,
      },
      lowStock: lowStockProducts,
    };

    console.log(
      `📤 [Seller Stats] Sending response:`,
      JSON.stringify(responseData, null, 2)
    );

    return res.json(responseData);
  } catch (e) {
    console.error("Seller stats error:", e);
    return res.status(500).json({ message: "Failed to load stats" });
  }
};

// Get seller's recent orders (simplified version)
exports.sellerRecentOrders = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 5);
    const sellerId = req.user._id;

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const pipeline = [
      { $match: { "items.seller": sellerObjectId } },
      {
        $project: {
          user: 1,
          status: 1,
          createdAt: 1,
          items: {
            $filter: {
              input: "$items",
              as: "item",
              cond: { $eq: ["$$item.seller", sellerObjectId] },
            },
          },
        },
      },
      {
        $addFields: {
          sellerSubtotal: {
            $sum: {
              $map: {
                input: "$items",
                as: "item",
                in: { $multiply: ["$$item.price", "$$item.quantity"] },
              },
            },
          },
          sellerNet: {
            $sum: {
              $map: {
                input: "$items",
                as: "item",
                in: {
                  $ifNull: [
                    "$$item.sellerEarnings",
                    { $multiply: ["$$item.price", "$$item.quantity"] },
                  ],
                },
              },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
    ];

    const rows = await Order.aggregate(pipeline);
    const userIds = rows.map((r) => r.user).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .select("email")
      .lean();
    const map = new Map(users.map((u) => [String(u._id), u]));

    const items = rows.map((r) => ({
      _id: r._id,
      user: r.user ? { email: map.get(String(r.user))?.email } : null,
      status: r.status,
      createdAt: r.createdAt,
      subtotal: r.sellerSubtotal,
      net: r.sellerNet,
    }));

    return res.json(items);
  } catch (e) {
    console.error("Seller recent orders error:", e);
    return res.status(500).json({ message: "Failed to load recent orders" });
  }
};

// Get seller's top selling products
exports.sellerTopProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 5);
    const sellerId = req.user._id;

    // Aggregate to count how many times each product was ordered
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const pipeline = [
      { $unwind: "$items" },
      { $match: { "items.seller": sellerObjectId } },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          netRevenue: {
            $sum: {
              $ifNull: [
                "$items.sellerEarnings",
                { $multiply: ["$items.price", "$items.quantity"] },
              ],
            },
          },
        },
      },
      { $sort: { totalQuantity: -1, totalRevenue: -1 } },
      { $limit: limit },
    ];

    const items = await Order.aggregate(pipeline);
    return res.json(items);
  } catch (e) {
    console.error("Seller top products error:", e);
    return res.status(500).json({ message: "Failed to load top products" });
  }
};

// Seller contact threads - list all threads where seller is involved
exports.listMyContactThreads = async (req, res) => {
  try {
    const threads = await ContactThread.find({
      seller: req.user._id,
    })
      .populate("buyer", "email displayName")
      .populate("order", "status total totalPrice createdAt")
      .sort("-updatedAt")
      .lean();

    // Count unread messages (messages from buyer that seller hasn't seen)
    const threadsWithUnread = threads.map((thread) => {
      const unreadCount = thread.messages.filter(
        (msg) => msg.sender === "buyer"
      ).length;
      return {
        ...thread,
        unreadCount,
        lastMessage:
          thread.messages.length > 0
            ? thread.messages[thread.messages.length - 1]
            : null,
      };
    });

    res.json(threadsWithUnread);
  } catch (err) {
    console.error("List seller contact threads error:", err);
    res.status(500).json({ message: "Failed to load contact threads" });
  }
};

// Get a specific contact thread for seller
exports.getContactThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await ContactThread.findOne({
      _id: threadId,
      seller: req.user._id,
    })
      .populate("buyer", "email displayName")
      .populate("order", "status total totalPrice createdAt")
      .lean();

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    res.json(thread);
  } catch (err) {
    console.error("Get seller contact thread error:", err);
    res.status(500).json({ message: "Failed to load thread" });
  }
};

// Seller reply to buyer message
exports.replyToContactThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { message = "", attachments: attachmentUrls = [] } = req.body || {};

    if (!message.trim() && (!attachmentUrls || attachmentUrls.length === 0)) {
      return res
        .status(400)
        .json({ message: "Message or attachments are required" });
    }

    const thread = await ContactThread.findOne({
      _id: threadId,
      seller: req.user._id,
    });

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    const attachmentDocs = (attachmentUrls || [])
      .filter((url) => typeof url === "string" && url.trim() !== "")
      .map((url) => ({
        url,
        uploadedBy: req.user._id,
      }));

    thread.messages.push({
      sender: "seller",
      body: message.trim(),
      attachments: attachmentDocs,
    });
    await thread.save();

    await thread.populate("buyer", "email displayName");
    await thread.populate("order", "status total totalPrice createdAt");

    notifyUser(thread.buyer, {
      type: "contact:seller-message",
      title: "Seller replied",
      body: "The seller responded to your question.",
      link: `/orders/${thread.order}?tab=contact&thread=${thread._id}`,
      icon: "comments",
      severity: "info",
      meta: {
        threadId: thread._id,
        orderId: thread.order?._id || thread.order,
      },
    }).catch((err) => console.error("Contact notification error (buyer)", err));

    res.json(thread);
  } catch (err) {
    console.error("Seller reply error:", err);
    res.status(500).json({ message: "Failed to send reply" });
  }
};
