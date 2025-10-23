const express = require("express");
const auth = require("../middleware/auth");
const { createOrder, getMyOrders } = require("../controllers/order.controller");

const router = express.Router();

router.post("/", auth, createOrder);
router.get("/my", auth, getMyOrders);

module.exports = router;





