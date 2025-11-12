const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/review.controller");

// Public: Get reviews for a product
router.get("/product/:productId", getProductReviews);

// Protected: Create review
router.post("/product/:productId", auth, createReview);

// Protected: Update own review
router.put("/:reviewId", auth, updateReview);

// Protected: Delete own review
router.delete("/:reviewId", auth, deleteReview);

module.exports = router;
















