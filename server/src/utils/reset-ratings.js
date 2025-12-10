require("dotenv").config();
const { connectDB } = require("../config/db");
const Product = require("../models/Product");

async function resetRatings() {
  try {
    await connectDB();
    console.log("Connected to database");

    // Reset all products' ratings and numReviews to 0
    const result = await Product.updateMany(
      {},
      {
        $set: {
          rating: 0,
          numReviews: 0,
        },
      }
    );

    console.log(`✅ Reset ratings for ${result.modifiedCount} products`);
    console.log(`   - All ratings set to 0`);
    console.log(`   - All numReviews set to 0`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting ratings:", error);
    process.exit(1);
  }
}

resetRatings();








