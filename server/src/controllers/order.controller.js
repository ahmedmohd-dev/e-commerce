const Order = require("../models/Order");
const Product = require("../models/Product");
const Dispute = require("../models/Dispute");
const { sendOrderConfirmation } = require("../utils/emailService");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, paymentDetails } = req.body;

    console.log("Order creation request:", {
      items,
      shippingAddress,
      paymentMethod,
      user: req.user,
    });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    // compute totals and ensure stock
    let itemsPrice = 0;
    const normalizedItems = [];
    const commissionRateRaw = process.env.SELLER_COMMISSION_RATE;
    let commissionRate = Number.isFinite(Number(commissionRateRaw))
      ? Number(commissionRateRaw)
      : 0.1;
    if (commissionRate < 0) commissionRate = 0;
    if (commissionRate > 1) commissionRate = 1;

    for (const it of items) {
      const productId = it.productId || it.product;
      const quantity = it.qty || it.quantity;

      if (!productId || !quantity) {
        return res
          .status(400)
          .json({ message: "Product ID and quantity are required" });
      }

      const p = await Product.findById(productId);
      if (!p || !p.isActive) {
        return res.status(400).json({ message: "Invalid product" });
      }

      if (p.stock < quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${p.name}` });
      }

      itemsPrice += p.price * quantity;
      const itemSubtotal = p.price * quantity;
      const itemCommissionAmount =
        Math.round(itemSubtotal * commissionRate * 100) / 100;
      const itemSellerEarnings =
        Math.round((itemSubtotal - itemCommissionAmount) * 100) / 100;
      normalizedItems.push({
        product: p._id,
        name: p.name,
        price: p.price,
        quantity: quantity,
        image: p.images?.[0] || "",
        seller: p.seller || null,
        commissionRate,
        commissionAmount: itemCommissionAmount,
        sellerEarnings: itemSellerEarnings,
      });
    }

    const taxPrice = Math.round(itemsPrice * 0.1 * 100) / 100; // 10% tax as per frontend
    const shippingPrice = 0; // Free shipping as per frontend
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    const order = await Order.create({
      user: req.user._id,
      items: normalizedItems,
      shippingAddress,
      paymentMethod,
      paymentDetails: paymentDetails || {},
      subtotal: itemsPrice,
      tax: taxPrice,
      shipping: shippingPrice,
      total: totalPrice,
      status: "pending",
    });

    console.log("Order created successfully:", order._id);

    // Send confirmation email (non-blocking)
    try {
      const user = await User.findById(req.user._id);
      if (user?.email) {
        await sendOrderConfirmation(order, user.email);
      }
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json(order);
  } catch (err) {
    console.error("Order creation error:", err);
    res
      .status(500)
      .json({ message: "Failed to create order", error: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort("-createdAt")
      .lean();

    const orderIds = orders.map((o) => o._id);
    const disputes = await Dispute.find({ order: { $in: orderIds } })
      .lean()
      .exec();
    const disputeMap = new Map(disputes.map((d) => [String(d.order), d]));

    const enriched = orders.map((o) => ({
      ...o,
      dispute: disputeMap.get(String(o._id)) || null,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the order belongs to the user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

exports.createOrderDispute = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    const {
      reason,
      details,
      attachments: attachmentUrls = [],
    } = req.body || {};

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "Reason is required" });
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if order is already completed/delivered - disputes should be for pending issues
    if (order.status === "completed" || order.status === "delivered") {
      return res.status(400).json({
        message: "Cannot create dispute for completed or delivered orders",
      });
    }

    const existing = await Dispute.findOne({ order: orderId });
    if (existing) {
      return res.status(400).json({
        message: `A dispute already exists for this order (Status: ${existing.status})`,
      });
    }

    // Extract unique seller IDs from order items
    // When using .lean(), ObjectIds are converted to strings, so we need to handle both
    const sellerIds = Array.from(
      new Set(
        (order.items || [])
          .map((item) => item.seller)
          .filter((seller) => seller != null) // Filter out null/undefined
          .map((seller) => {
            // Convert to ObjectId - handles both string and ObjectId
            try {
              return seller instanceof mongoose.Types.ObjectId
                ? seller
                : new mongoose.Types.ObjectId(seller);
            } catch (err) {
              console.error("Invalid seller ID:", seller, err);
              return null;
            }
          })
          .filter((id) => id != null) // Remove any failed conversions
      )
    );

    const attachmentDocs = (attachmentUrls || [])
      .filter((url) => typeof url === "string" && url.trim() !== "")
      .map((url) => ({
        url,
        uploadedBy: req.user._id,
      }));

    const initialMessageBody = details?.trim() || reason;
    const initialMessage =
      initialMessageBody || attachmentDocs.length > 0
        ? {
            sender: "buyer",
            body: initialMessageBody,
            attachments: attachmentDocs,
          }
        : null;

    const dispute = await Dispute.create({
      order: orderId,
      buyer: req.user._id,
      seller: sellerIds.length === 1 ? sellerIds[0] : undefined,
      reason,
      details,
      attachments: attachmentDocs,
      messages: initialMessage ? [initialMessage] : [],
    });

    res.status(201).json(dispute);
  } catch (err) {
    console.error("Create dispute error:", err);
    // Provide more specific error messages
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message:
          "Validation error: " +
          Object.values(err.errors)
            .map((e) => e.message)
            .join(", "),
      });
    }
    if (err.code === 11000) {
      return res.status(400).json({
        message: "A dispute already exists for this order",
      });
    }
    res.status(500).json({
      message: err.message || "Failed to create dispute. Please try again.",
    });
  }
};

exports.getOrderDispute = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    const dispute = await Dispute.findOne({ order: orderId })
      .populate("messages.attachments.uploadedBy", "email")
      .lean();
    res.json(dispute || null);
  } catch (err) {
    console.error("Get dispute error:", err);
    res.status(500).json({ message: "Failed to fetch dispute" });
  }
};

// List all disputes created by the current user (buyer)
exports.getMyDisputes = async (req, res) => {
  try {
    const items = await Dispute.find({ buyer: req.user._id })
      .sort("-createdAt")
      .populate("order", "status total totalPrice amount createdAt")
      .lean();
    res.json(items);
  } catch (err) {
    console.error("Get my disputes error:", err);
    res.status(500).json({ message: "Failed to fetch disputes" });
  }
};

// Append a buyer message (and optional attachments) to an existing dispute
exports.addDisputeMessage = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    const { message = "", attachments: attachmentUrls = [] } = req.body || {};

    if (!message.trim() && (!attachmentUrls || attachmentUrls.length === 0)) {
      return res.status(400).json({
        message: "Message or attachments are required",
      });
    }

    const dispute = await Dispute.findOne({
      order: orderId,
      buyer: req.user._id,
    });
    if (!dispute) {
      return res
        .status(404)
        .json({ message: "No dispute found for this order" });
    }

    const attachmentDocs = (attachmentUrls || [])
      .filter((url) => typeof url === "string" && url.trim() !== "")
      .map((url) => ({
        url,
        uploadedBy: req.user._id,
      }));

    dispute.messages.push({
      sender: "buyer",
      body: message,
      attachments: attachmentDocs,
    });
    if (attachmentDocs.length) {
      dispute.attachments.push(...attachmentDocs);
    }
    await dispute.save();

    await dispute.populate("messages.attachments.uploadedBy", "email");

    res.json(dispute);
  } catch (err) {
    console.error("Add dispute message error:", err);
    res.status(500).json({ message: "Failed to add message" });
  }
};
