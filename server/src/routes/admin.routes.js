const express = require("express");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/admin");
const ctrl = require("../controllers/admin.controller");

const router = express.Router();

router.use(auth, isAdmin);

// Products
router.get("/products", ctrl.adminListProducts);
router.post("/products", ctrl.adminCreateProduct);
router.put("/products/:id", ctrl.adminUpdateProduct);
router.delete("/products/:id", ctrl.adminDeleteProduct);
router.delete("/products/:id/hard", ctrl.adminHardDeleteProduct);

// Orders
router.get("/orders", ctrl.adminListOrders);
router.patch("/orders/:id/status", ctrl.adminUpdateOrderStatus);
router.patch("/orders/:id/verify-telebirr", ctrl.adminVerifyTelebirr);

// Disputes
router.get("/disputes", ctrl.adminListDisputes);
router.patch("/disputes/:id", ctrl.adminUpdateDisputeStatus);

// Users
router.get("/users", ctrl.adminListUsers);
router.patch("/users/:id/role", ctrl.adminUpdateUserRole);

// Sellers
router.get("/sellers", ctrl.listSellers);
router.get("/sellers/:id/stats", ctrl.getSellerStats);
router.patch("/sellers/:id/status", ctrl.updateSellerStatus);

// Dashboard
router.get("/dashboard/overview", ctrl.adminOverviewStats);
router.get("/dashboard/recent-orders", ctrl.adminRecentOrders);
router.get("/dashboard/top-products", ctrl.adminTopProducts);

module.exports = router;
