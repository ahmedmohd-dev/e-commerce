const express = require("express");
const auth = require("../middleware/auth");
const { requireApprovedSeller } = require("../middleware/roles");
const ctrl = require("../controllers/seller.controller");

const router = express.Router();

// Seller application
router.post("/apply", auth, ctrl.applyForSeller);

// Seller product management (approved sellers only)
router.get("/products", auth, requireApprovedSeller, ctrl.listMyProducts);
router.post("/products", auth, requireApprovedSeller, ctrl.createMyProduct);
router.put("/products/:id", auth, requireApprovedSeller, ctrl.updateMyProduct);
router.delete(
  "/products/:id",
  auth,
  requireApprovedSeller,
  ctrl.deleteMyProduct
);

// Seller orders (approved sellers only)
router.get("/orders", auth, requireApprovedSeller, ctrl.listMyOrders);
router.put(
  "/orders/:orderId/status",
  auth,
  requireApprovedSeller,
  ctrl.sellerUpdateOrderStatus
);
router.put(
  "/orders/:orderId/items/:itemProductId/shipping",
  auth,
  requireApprovedSeller,
  ctrl.updateItemShippingStatus
);

// Seller dashboard stats
router.get(
  "/dashboard/overview",
  auth,
  requireApprovedSeller,
  ctrl.sellerOverviewStats
);
router.get(
  "/dashboard/recent-orders",
  auth,
  requireApprovedSeller,
  ctrl.sellerRecentOrders
);
router.get(
  "/dashboard/top-products",
  auth,
  requireApprovedSeller,
  ctrl.sellerTopProducts
);

module.exports = router;
