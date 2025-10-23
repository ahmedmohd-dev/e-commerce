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

// Orders
router.get("/orders", ctrl.adminListOrders);
router.patch("/orders/:id/status", ctrl.adminUpdateOrderStatus);
router.patch("/orders/:id/verify-telebirr", ctrl.adminVerifyTelebirr);

// Users
router.get("/users", ctrl.adminListUsers);

module.exports = router;





