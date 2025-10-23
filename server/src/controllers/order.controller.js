const Order = require("../models/Order");
const Product = require("../models/Product");

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items" });
    }
    // compute totals and ensure stock
    let itemsPrice = 0;
    const normalizedItems = [];
    for (const it of items) {
      const p = await Product.findById(it.productId || it.product);
      if (!p || !p.isActive)
        return res.status(400).json({ message: "Invalid product" });
      if (p.stock < it.qty)
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${p.name}` });
      itemsPrice += p.price * it.qty;
      normalizedItems.push({
        product: p._id,
        name: p.name,
        price: p.price,
        qty: it.qty,
        image: p.images?.[0] || "",
      });
    }
    const taxPrice = Math.round(itemsPrice * 0.05 * 100) / 100;
    const shippingPrice = itemsPrice > 100 ? 0 : 10;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    const order = await Order.create({
      user: req.user._id,
      items: normalizedItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      status: paymentMethod === "paypal" ? "pending" : "pending",
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to create order" });
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





