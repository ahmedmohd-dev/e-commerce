const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not set in server/.env");
    process.exit(1);
  }

  // Add connection event listeners for better debugging
  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected successfully");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
  });

  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || "ecommerce",
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("\n📋 Troubleshooting steps:");
    console.error("1. Verify MONGODB_URI in server/.env is correct");
    console.error("2. Check MongoDB Atlas → Network Access → IP Whitelist");
    console.error("   - Add your current IP address");
    console.error(
      "   - Or use 0.0.0.0/0 for development (not recommended for production)"
    );
    console.error("3. Verify your internet connection");
    console.error("4. Check if MongoDB Atlas cluster is running\n");
    // Don't exit - let the server start but show errors on API calls
    console.warn(
      "⚠️  Server will continue but API calls will fail until MongoDB connects"
    );
  }
};

module.exports = { connectDB };
