const Product = require("../models/Product");

function buildProductFilters(query) {
  const filters = { isActive: true };
  if (query.search) {
    const regex = new RegExp(query.search, "i");
    filters.$or = [
      { name: regex },
      { description: regex },
      { brand: regex },
      { category: regex },
    ];
  }
  // Case-insensitive category filtering (supports both name and slug)
  if (query.category) {
    const escaped = query.category
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const categoryRegex = new RegExp(`^${escaped}$`, "i");
    filters.category = categoryRegex;
  }
  // Case-insensitive brand filtering (supports both name and slug)
  if (query.brand) {
    const escaped = query.brand.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const brandRegex = new RegExp(`^${escaped}$`, "i");
    filters.brand = brandRegex;
  }
  if (query.minPrice || query.maxPrice) {
    filters.price = {};
    if (query.minPrice) filters.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filters.price.$lte = Number(query.maxPrice);
  }
  return filters;
}

exports.listProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit || "12", 10))
    );
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "-createdAt"; // e.g., price, -price
    const filters = buildProductFilters(req.query);

    const [items, total] = await Promise.all([
      Product.find(filters).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filters),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// Search autocomplete
exports.searchAutocomplete = async (req, res) => {
  try {
    const query = req.query.q || "";
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const searchRegex = new RegExp(query, "i");
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
      ],
    })
      .select("name slug images price rating numReviews")
      .limit(8)
      .sort("-rating -numReviews");

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
};
