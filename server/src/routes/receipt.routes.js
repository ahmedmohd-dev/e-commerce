const express = require("express");
const router = express.Router();
const { downloadReceipt, downloadReceiptProtected } = require("../controllers/receipt.controller");
const { auth } = require("../middleware/auth");

// Download receipt PDF (Public - no auth required)
router.get("/download/:orderId", downloadReceipt);

// Download receipt PDF (Protected - requires authentication)
router.get("/download-protected/:orderId", auth, downloadReceiptProtected);

module.exports = router;


