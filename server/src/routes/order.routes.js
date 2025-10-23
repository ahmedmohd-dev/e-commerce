const express = require("express");
const auth = require("../middleware/auth");
const {
  createOrder,
  getMyOrders,
  getOrderById,
} = require("../controllers/order.controller");

const router = express.Router();

router.post("/", auth, createOrder);
router.get("/my", auth, getMyOrders);
router.get("/:id", auth, getOrderById);

module.exports = router;
