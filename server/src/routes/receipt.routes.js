const express = require("express");
const router = express.Router();
const { downloadReceipt } = require("../controllers/receipt.controller");

// Download receipt PDF (Public - no auth required)
router.get("/download/:orderId", downloadReceipt);

module.exports = router;


