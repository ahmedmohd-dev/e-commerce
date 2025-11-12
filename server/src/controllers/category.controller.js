const Category = require("../models/Category");

// Public list
exports.listCategories = async (req, res) => {
  const items = await Category.find({ isActive: true }).sort("name");
  res.json(items);
};

// Admin CRUD
exports.adminListCategories = async (req, res) => {
  const items = await Category.find({}).sort("name");
  res.json(items);
};

exports.adminCreateCategory = async (req, res) => {
  const c = await Category.create(req.body);
  res.status(201).json(c);
};

exports.adminUpdateCategory = async (req, res) => {
  const c = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!c) return res.status(404).json({ message: "Not found" });
  res.json(c);
};

exports.adminDeleteCategory = async (req, res) => {
  const c = await Category.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!c) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Category disabled", category: c });
};





















