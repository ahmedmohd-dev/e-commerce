const Product = require("../models/Product");
const Order = require("../models/Order");

const SPECIAL_SORTS = new Set(["new", "popular", "sale", "foryou"]);

// Cache for personalized recommendations (5 minute TTL)
const personalizedCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of personalizedCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      personalizedCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

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
  if (String(query.inStock).toLowerCase() === "true") {
    filters.stock = { $gt: 0 };
  }
  if (query.ratingMin) {
    const ratingValue = Number(query.ratingMin);
    if (!Number.isNaN(ratingValue) && ratingValue > 0) {
      filters.rating = { $gte: ratingValue };
    }
  }
  return filters;
}

function combineFilters(clauses = []) {
  const activeClauses = clauses.filter(Boolean);
  if (!activeClauses.length) {
    return {};
  }
  if (activeClauses.length === 1) {
    return activeClauses[0];
  }
  return { $and: activeClauses };
}

function buildSaleWindowFilter(now = new Date()) {
  return {
    $and: [
      { "sale.isEnabled": true },
      { "sale.price": { $gt: 0 } },
      {
        $or: [{ "sale.start": null }, { "sale.start": { $lte: now } }],
      },
      {
        $or: [{ "sale.end": null }, { "sale.end": { $gte: now } }],
      },
    ],
  };
}

async function buildPersonalizedClause(user) {
  if (!user?._id) return null;

  const userId = String(user._id);
  const cacheKey = `personalized_${userId}`;
  const cached = personalizedCache.get(cacheKey);

  // Return cached result if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.clause;
  }

  const orders = await Order.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(15)
    .select("items.category items.brand items.quantity createdAt")
    .lean()
    .maxTimeMS(3000); // Timeout after 3s

  if (!orders.length) {
    // Cache null result too
    personalizedCache.set(cacheKey, { clause: null, timestamp: Date.now() });
    return null;
  }

  const categoryScores = new Map();
  const brandScores = new Map();

  orders.forEach((order, index) => {
    const recencyWeight = Math.max(0.25, 1 - index * 0.08);
    (order.items || []).forEach((item) => {
      const weight = (item.quantity || 1) * recencyWeight;
      if (item.category) {
        categoryScores.set(
          item.category,
          (categoryScores.get(item.category) || 0) + weight
        );
      }
      if (item.brand) {
        brandScores.set(
          item.brand,
          (brandScores.get(item.brand) || 0) + weight * 0.8
        );
      }
    });
  });

  const topCategories = Array.from(categoryScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);
  const topBrands = Array.from(brandScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);

  if (!topCategories.length && !topBrands.length) {
    personalizedCache.set(cacheKey, { clause: null, timestamp: Date.now() });
    return null;
  }

  const orConditions = [];
  if (topCategories.length) {
    orConditions.push({ category: { $in: topCategories } });
  }
  if (topBrands.length) {
    orConditions.push({ brand: { $in: topBrands } });
  }

  if (!orConditions.length) {
    personalizedCache.set(cacheKey, { clause: null, timestamp: Date.now() });
    return null;
  }

  const clause = { $or: orConditions };
  // Cache the result
  personalizedCache.set(cacheKey, { clause, timestamp: Date.now() });
  return clause;
}

async function executeProductQuery({
  filterClauses,
  sort,
  skip,
  limit,
  lean = true,
}) {
  const finalFilter = combineFilters(filterClauses);
  const query = Product.find(finalFilter).sort(sort).skip(skip).limit(limit);
  if (lean) {
    query.lean();
  }

  // Add timeout to prevent slow queries from blocking
  query.maxTimeMS(5000);

  const [items, total] = await Promise.all([
    query.exec(),
    Product.countDocuments(finalFilter).maxTimeMS(5000), // Timeout after 5s
  ]);
  return { items, total };
}

exports.listProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit || "12", 10))
    );
    const skip = (page - 1) * limit;
    const sortParam = req.query.sort || "-createdAt";
    const baseFilters = [buildProductFilters(req.query)];
    const now = new Date();
    let payload;
    let context = { mode: sortParam };

    if (SPECIAL_SORTS.has(sortParam)) {
      switch (sortParam) {
        case "sale": {
          baseFilters.push(buildSaleWindowFilter(now));
          payload = await executeProductQuery({
            filterClauses: baseFilters,
            sort: { "sale.discountPercent": -1, createdAt: -1 },
            skip,
            limit,
          });
          context = { mode: "sale" };
          break;
        }
        case "popular": {
          payload = await executeProductQuery({
            filterClauses: baseFilters,
            sort: {
              "metrics.purchaseCount": -1,
              "metrics.viewCount": -1,
              rating: -1,
              createdAt: -1,
            },
            skip,
            limit,
          });
          context = { mode: "popular" };
          break;
        }
        case "new": {
          const recencyWindow = Number(req.query.newDays || 28);
          const threshold = new Date(Date.now() - recencyWindow * 86400000);
          baseFilters.push({ createdAt: { $gte: threshold } });
          payload = await executeProductQuery({
            filterClauses: baseFilters,
            sort: { createdAt: -1 },
            skip,
            limit,
          });
          if (!payload.total) {
            baseFilters.pop();
            payload = await executeProductQuery({
              filterClauses: baseFilters,
              sort: { createdAt: -1 },
              skip,
              limit,
            });
            context = { mode: "new", fallback: true };
          } else {
            context = { mode: "new" };
          }
          break;
        }
        case "foryou": {
          const personalizedClause = await buildPersonalizedClause(req.user);
          if (personalizedClause) {
            baseFilters.push(personalizedClause);
            payload = await executeProductQuery({
              filterClauses: baseFilters,
              sort: {
                "metrics.purchaseCount": -1,
                "metrics.viewCount": -1,
                createdAt: -1,
              },
              skip,
              limit,
            });
            context = { mode: "foryou", personalized: true };
            if (!payload.total) {
              baseFilters.pop();
            }
          }
          if (!payload || !payload.total) {
            payload = await executeProductQuery({
              filterClauses: baseFilters.slice(0, 1),
              sort: {
                "metrics.purchaseCount": -1,
                "metrics.viewCount": -1,
                createdAt: -1,
              },
              skip,
              limit,
            });
            context = { mode: "popular", fallback: "popular" };
          }
          break;
        }
        default:
          break;
      }
    }

    if (!payload) {
      payload = await executeProductQuery({
        filterClauses: baseFilters,
        sort: sortParam,
        skip,
        limit,
      });
    }

    const pages = Math.max(1, Math.ceil(payload.total / limit));

    res.json({
      items: payload.items,
      total: payload.total,
      page,
      pages,
      context,
    });
  } catch (err) {
    console.error("listProducts error:", err);
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
    Product.updateOne(
      { _id: product._id },
      {
        $inc: { "metrics.viewCount": 1 },
        $set: { "metrics.lastViewedAt": new Date() },
      }
    ).catch(() => {});
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// Search autocomplete - optimized with text index
exports.searchAutocomplete = async (req, res) => {
  try {
    const query = req.query.q || "";
    if (!query || query.length < 2) {
      return res.json([]);
    }

    // Use text search if available, fallback to regex
    let products;
    try {
      // Try text search first (faster with index)
      products = await Product.find({
        isActive: true,
        $text: { $search: query },
      })
        .select("name slug images price rating numReviews")
        .limit(8)
        .sort({ score: { $meta: "textScore" }, rating: -1, numReviews: -1 })
        .maxTimeMS(2000); // Timeout after 2s
    } catch (textSearchError) {
      // Fallback to regex if text index not available
      const searchRegex = new RegExp(query, "i");
      products = await Product.find({
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
        .sort("-rating -numReviews")
        .maxTimeMS(2000);
    }

    res.json(products);
  } catch (err) {
    console.error("searchAutocomplete error:", err);
    res.status(500).json({ message: "Search failed" });
  }
};
