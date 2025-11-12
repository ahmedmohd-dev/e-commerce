const express = require("express");
const auth = require("../middleware/auth");
const {
  getContactOverview,
  getContactThread,
  postContactMessage,
} = require("../controllers/contact.controller");

const router = express.Router();

router.use(auth);

router.get("/order/:orderId", getContactOverview);
router.get("/order/:orderId/thread", getContactThread);
router.post("/order/:orderId/messages", postContactMessage);

module.exports = router;


