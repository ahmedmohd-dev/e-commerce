const Brand = require("../models/Brand");

// Public list
exports.listBrands = async (req, res) => {
  const items = await Brand.find({ isActive: true }).sort("name");
  res.json(items);
};

// Admin CRUD
exports.adminListBrands = async (req, res) => {
  const items = await Brand.find({}).sort("name");
  res.json(items);
};

exports.adminCreateBrand = async (req, res) => {
  const b = await Brand.create(req.body);
  res.status(201).json(b);
};

exports.adminUpdateBrand = async (req, res) => {
  const b = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!b) return res.status(404).json({ message: "Not found" });
  res.json(b);
};

exports.adminDeleteBrand = async (req, res) => {
  const b = await Brand.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!b) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Brand disabled", brand: b });
};





















