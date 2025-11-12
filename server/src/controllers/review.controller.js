const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "email")
      .sort("-createdAt");
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a review
exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    // Check if user has purchased this product (optional verification)
    const hasPurchased = await Order.findOne({
      user: userId,
      "items.product": productId,
      status: { $in: ["paid", "shipped", "completed"] },
    });

    // Create review
    const review = await Review.create({
      product: productId,
      user: userId,
      rating,
      comment: comment || "",
      isVerified: !!hasPurchased, // Mark as verified if user purchased
    });

    await review.populate("user", "email");

    // Update product rating
    await updateProductRating(productId);

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.rating = rating;
    review.comment = comment || "";
    await review.save();

    await review.populate("user", "email");

    // Update product rating
    await updateProductRating(review.product);

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const productId = review.product;
    await review.deleteOne();

    // Update product rating
    await updateProductRating(productId);

    res.json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to update product rating
async function updateProductRating(productId) {
  const reviews = await Review.find({ product: productId });
  const numReviews = reviews.length;

  if (numReviews === 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      numReviews: 0,
    });
    return;
  }

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / numReviews;

  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    numReviews,
  });
}
