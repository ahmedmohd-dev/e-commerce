require("dotenv").config();
const { connectDB } = require("../config/db");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");

async function migrateProductsCategoryBrand() {
  await connectDB();

  console.log("Fetching all categories and brands...");
  const categories = await Category.find({ isActive: true });
  const brands = await Brand.find({ isActive: true });

  const categoryMap = new Map();
  const brandMap = new Map();

  // Create maps: normalized name/slug -> official name
  categories.forEach((cat) => {
    const normalized = cat.name.toLowerCase().trim();
    categoryMap.set(normalized, cat.name);
    // Also map slug to name
    categoryMap.set(cat.slug.toLowerCase(), cat.name);
  });

  brands.forEach((brand) => {
    const normalized = brand.name.toLowerCase().trim();
    brandMap.set(normalized, brand.name);
    // Also map slug to name
    brandMap.set(brand.slug.toLowerCase(), brand.name);
  });

  console.log(
    `Found ${categories.length} categories and ${brands.length} brands`
  );

  // Get all products
  const products = await Product.find({});
  console.log(`Processing ${products.length} products...`);

  let updatedCount = 0;
  let categoryFixed = 0;
  let brandFixed = 0;

  for (const product of products) {
    let needsUpdate = false;
    const updates = {};

    // Normalize and match category
    if (product.category) {
      const normalized = product.category.toLowerCase().trim();
      const matchedName = categoryMap.get(normalized);
      if (matchedName && matchedName !== product.category) {
        updates.category = matchedName;
        needsUpdate = true;
        categoryFixed++;
      } else if (!matchedName) {
        // Try to match by similar name (fuzzy)
        const found = categories.find(
          (c) => c.name.toLowerCase().trim() === normalized
        );
        if (found) {
          updates.category = found.name;
          needsUpdate = true;
          categoryFixed++;
        }
      }
    }

    // Normalize and match brand
    if (product.brand) {
      const normalized = product.brand.toLowerCase().trim();
      const matchedName = brandMap.get(normalized);
      if (matchedName && matchedName !== product.brand) {
        updates.brand = matchedName;
        needsUpdate = true;
        brandFixed++;
      } else if (!matchedName) {
        // Try to match by similar name (fuzzy)
        const found = brands.find(
          (b) => b.name.toLowerCase().trim() === normalized
        );
        if (found) {
          updates.brand = found.name;
          needsUpdate = true;
          brandFixed++;
        }
      }
    }

    if (needsUpdate) {
      await Product.updateOne({ _id: product._id }, { $set: updates });
      updatedCount++;
    }
  }

  console.log(`\n✅ Migration complete:`);
  console.log(`   - ${updatedCount} products updated`);
  console.log(`   - ${categoryFixed} categories normalized`);
  console.log(`   - ${brandFixed} brands normalized`);

  // Show summary of current product category/brand distribution
  const catDist = await Product.aggregate([
    { $match: { category: { $ne: "", $exists: true } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const brDist = await Product.aggregate([
    { $match: { brand: { $ne: "", $exists: true } } },
    { $group: { _id: "$brand", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log(`\n📊 Current product distribution:`);
  console.log(
    `   Categories:`,
    catDist.map((c) => `${c._id} (${c.count})`).join(", ")
  );
  console.log(
    `   Brands:`,
    brDist.map((b) => `${b._id} (${b.count})`).join(", ")
  );

  process.exit(0);
}

migrateProductsCategoryBrand().catch((e) => {
  console.error("❌ Error migrating products:", e);
  process.exit(1);
});



















