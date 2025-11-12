require("dotenv").config();
const { connectDB } = require("../config/db");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

async function seedCategoriesBrands() {
  await connectDB();

  console.log("Extracting categories and brands from products...");

  const categories = await Product.distinct("category", {
    category: { $ne: "", $exists: true },
  });
  const brands = await Product.distinct("brand", {
    brand: { $ne: "", $exists: true },
  });

  console.log(`Found ${categories.length} unique categories:`, categories);
  console.log(`Found ${brands.length} unique brands:`, brands);

  // Create categories
  const catOps = categories.map((name) => ({
    updateOne: {
      filter: { slug: slugify(name) },
      update: {
        $setOnInsert: { name, slug: slugify(name), isActive: true },
      },
      upsert: true,
    },
  }));

  // Create brands
  const brOps = brands.map((name) => ({
    updateOne: {
      filter: { slug: slugify(name) },
      update: {
        $setOnInsert: { name, slug: slugify(name), isActive: true },
      },
      upsert: true,
    },
  }));

  if (catOps.length) {
    const catResult = await Category.bulkWrite(catOps);
    console.log(
      `✅ Created ${catResult.upsertedCount} new categories, updated ${catResult.modifiedCount} existing.`
    );
  } else {
    console.log("⚠️  No categories found to seed.");
  }

  if (brOps.length) {
    const brResult = await Brand.bulkWrite(brOps);
    console.log(
      `✅ Created ${brResult.upsertedCount} new brands, updated ${brResult.modifiedCount} existing.`
    );
  } else {
    console.log("⚠️  No brands found to seed.");
  }

  // Show final counts
  const finalCatCount = await Category.countDocuments();
  const finalBrCount = await Brand.countDocuments();
  console.log(
    `\n📊 Final counts: ${finalCatCount} categories, ${finalBrCount} brands.`
  );

  process.exit(0);
}

seedCategoriesBrands().catch((e) => {
  console.error("❌ Error seeding categories/brands:", e);
  process.exit(1);
});



















