const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const mongoose = require("mongoose");
const { sendStatusUpdate } = require("../utils/emailService");

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
    const { status, paymentVerified } = req.body || {};

    const allowedStatuses = [
      "pending",
      "paid",
      "shipped",
      "completed",
      "cancelled",
    ];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId).populate("user");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
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

    if (status && !allItemsBelongToSeller && status !== order.status) {
      return res.status(403).json({
        message:
          "Cannot update overall order status because this order contains products from multiple sellers.",
      });
    }

    let statusChanged = false;
    if (status && order.status !== status) {
      order.status = status;
      statusChanged = true;
    }

    if (typeof paymentVerified === "boolean") {
      order.paymentDetails = order.paymentDetails || {};
      order.paymentDetails.verifiedBySeller = paymentVerified;
      order.paymentDetails.sellerVerifiedAt = paymentVerified
        ? new Date()
        : null;
      if (paymentVerified && !order.paymentDetails.status) {
        order.paymentDetails.status = "verified";
      }
    }

    await order.save();

    if (statusChanged) {
      try {
        if (order.user?.email) {
          await sendStatusUpdate(order, order.status, order.user.email);
        }
      } catch (emailErr) {
        console.error("Failed to send order status email:", emailErr);
      }
    }

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

    // Count seller's products
    const productsCount = await Product.countDocuments({ seller: sellerId });

    // Get all orders containing seller's products and calculate totals
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const pipeline = [
      { $match: { "items.seller": sellerObjectId } },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerObjectId } },
      {
        $group: {
          _id: null,
          totalOrders: { $addToSet: "$_id" },
          grossRevenue: {
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
          itemsShipped: {
            $sum: {
              $cond: [
                { $eq: ["$items.shippingStatus", "shipped"] },
                "$items.quantity",
                0,
              ],
            },
          },
          itemsPending: {
            $sum: {
              $cond: [
                {
                  $ne: [
                    { $ifNull: ["$items.shippingStatus", "pending"] },
                    "shipped",
                  ],
                },
                "$items.quantity",
                0,
              ],
            },
          },
        },
      },
    ];

    const statsResult = await Order.aggregate(pipeline);
    const stats = statsResult[0] || {
      totalOrders: [],
      totalRevenue: 0,
      itemsShipped: 0,
      itemsPending: 0,
    };

    // Get low stock products (stock < 10)
    const lowStockProducts = await Product.find({
      seller: sellerId,
      stock: { $lt: 10 },
      isActive: { $ne: false },
    })
      .select("name stock")
      .limit(5)
      .sort({ stock: 1 });

    return res.json({
      totals: {
        products: productsCount,
        orders: stats.totalOrders.length,
        revenue: stats.netRevenue || stats.grossRevenue || 0,
        grossRevenue: stats.grossRevenue || 0,
        netRevenue: stats.netRevenue || stats.grossRevenue || 0,
        itemsShipped: stats.itemsShipped,
        itemsPending: stats.itemsPending,
      },
      lowStock: lowStockProducts,
    });
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
