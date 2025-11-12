const Order = require("../models/Order");
const ContactThread = require("../models/ContactThread");
const User = require("../models/User");
const mongoose = require("mongoose");

const buildAttachmentDocs = (urls = [], userId) =>
  (urls || [])
    .filter((url) => typeof url === "string" && url.trim() !== "")
    .map((url) => ({
      url,
      uploadedBy: userId,
    }));

const getUniqueSellersFromOrder = (order) => {
  if (!order?.items) return [];
  const map = new Map();
  for (const item of order.items) {
    const sellerId = item.product?.seller || item.seller;
    if (!sellerId) continue;
    const key = String(sellerId);
    if (!map.has(key)) {
      map.set(key, {
        sellerId,
        productNames: new Set(),
      });
    }
    map.get(key).productNames.add(item.product?.name || item.name);
  }
  return Array.from(map.entries()).map(([key, value]) => ({
    sellerId: value.sellerId,
    productNames: Array.from(value.productNames),
  }));
};

exports.getContactOverview = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    })
      .populate({ path: "items.product", select: "name seller" })
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const sellers = getUniqueSellersFromOrder(order);
    const sellerIds = sellers.map((s) => s.sellerId).filter(Boolean);
    const sellersInfo = await User.find({ _id: { $in: sellerIds } })
      .select("email sellerProfile.shopName")
      .lean();

    const threads = await ContactThread.find({
      order: orderId,
      buyer: req.user._id,
    })
      .populate("seller", "email sellerProfile.shopName")
      .lean();

    const sellersData = sellers.map((entry) => {
      const info = sellersInfo.find(
        (s) => String(s._id) === String(entry.sellerId)
      );
      const thread = threads.find(
        (t) => String(t.seller) === String(entry.sellerId)
      );
      return {
        sellerId: entry.sellerId,
        productNames: entry.productNames,
        sellerEmail: info?.email || "",
        shopName: info?.sellerProfile?.shopName || "",
        thread,
      };
    });

    res.json({
      order: {
        _id: order._id,
        status: order.status,
        createdAt: order.createdAt,
      },
      sellers: sellersData,
    });
  } catch (err) {
    console.error("Contact overview error:", err);
    res.status(500).json({ message: "Failed to load contact info" });
  }
};

exports.getContactThread = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { sellerId } = req.query;
    if (!sellerId) {
      return res.status(400).json({ message: "sellerId is required" });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    })
      .populate({ path: "items.product", select: "seller" })
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const sellerInOrder = order.items.some((item) => {
      const seller = item.product?.seller || item.seller;
      return seller && String(seller) === String(sellerId);
    });
    if (!sellerInOrder) {
      return res.status(400).json({
        message: "This seller is not associated with the order",
      });
    }

    let thread = await ContactThread.findOne({
      order: orderId,
      buyer: req.user._id,
      seller: sellerId,
    })
      .populate("seller", "email sellerProfile.shopName")
      .lean();

    if (!thread) {
      const seller = await User.findById(sellerId)
        .select("email sellerProfile.shopName")
        .lean();
      return res.json({
        sellerId,
        messages: [],
        seller: seller || null,
      });
    }

    res.json(thread);
  } catch (err) {
    console.error("Get contact thread error:", err);
    res.status(500).json({ message: "Failed to load thread" });
  }
};

exports.postContactMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      sellerId,
      message = "",
      attachments: attachmentUrls = [],
    } = req.body || {};

    if (!sellerId) {
      return res.status(400).json({ message: "sellerId is required" });
    }
    if (!message.trim() && (!attachmentUrls || attachmentUrls.length === 0)) {
      return res
        .status(400)
        .json({ message: "Message or attachments are required" });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    })
      .populate({ path: "items.product", select: "seller" })
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const sellerInOrder = order.items.some((item) => {
      const seller = item.product?.seller || item.seller;
      return seller && String(seller) === String(sellerId);
    });
    if (!sellerInOrder) {
      return res.status(400).json({
        message: "This seller is not associated with the order",
      });
    }

    const attachments = buildAttachmentDocs(attachmentUrls, req.user._id);

    const thread =
      (await ContactThread.findOne({
        order: orderId,
        buyer: req.user._id,
        seller: sellerId,
      })) ||
      (await ContactThread.create({
        order: orderId,
        buyer: req.user._id,
        seller: sellerId,
        messages: [],
      }));

    thread.messages.push({
      sender: "buyer",
      body: message,
      attachments,
    });
    await thread.save();
    await thread.populate("seller", "email sellerProfile.shopName");

    res.json(thread);
  } catch (err) {
    console.error("Post contact message error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};
