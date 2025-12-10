require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const Product = require("../models/Product");

async function buildIndexes() {
  try {
    await connectDB();

    // Wait a moment to ensure connection is fully established
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("🔄 Building database indexes...");

    // Build all indexes defined in the Product model
    await Product.createIndexes();
    console.log("✅ Product indexes created successfully");

    // List all indexes
    const indexes = await Product.collection.getIndexes();
    console.log("\n📊 Current indexes on Products collection:");
    console.log(JSON.stringify(indexes, null, 2));

    console.log("\n✅ Index building complete!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error building indexes:", err);
    process.exit(1);
  }
}

buildIndexes();
