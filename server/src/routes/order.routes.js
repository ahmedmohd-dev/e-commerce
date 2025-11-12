const express = require("express");
const auth = require("../middleware/auth");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  createOrderDispute,
  getOrderDispute,
  getMyDisputes,
  addDisputeMessage,
} = require("../controllers/order.controller");

const router = express.Router();

router.post("/", auth, createOrder);
router.get("/my", auth, getMyOrders);
router.get("/disputes/my", auth, getMyDisputes);
router.get("/:id", auth, getOrderById);
router.post("/:id/disputes", auth, createOrderDispute);
router.get("/:id/disputes", auth, getOrderDispute);
router.post("/:id/disputes/messages", auth, addDisputeMessage);

module.exports = router;
