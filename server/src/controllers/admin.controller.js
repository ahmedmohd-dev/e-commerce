const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

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
  );
  if (!order) return res.status(404).json({ message: "Not found" });
  res.json(order);
};

exports.adminVerifyTelebirr = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Not found" });
  order.paymentResult = {
    ...(order.paymentResult || {}),
    verifiedByAdmin: true,
    verifiedAt: new Date(),
  };
  order.status = "paid";
  await order.save();
  res.json({ message: "Telebirr verified", order });
};

// Users
exports.adminListUsers = async (req, res) => {
  const users = await User.find({})
    .select("email role createdAt")
    .sort("-createdAt");
  res.json(users);
};





