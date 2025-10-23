const Order = require("../models/Order");
const Product = require("../models/Product");

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
      normalizedItems.push({
        product: p._id,
        name: p.name,
        price: p.price,
        quantity: quantity,
        image: p.images?.[0] || "",
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
    const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
    res.json(orders);
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
