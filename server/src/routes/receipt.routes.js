const express = require('express');
const router = express.Router();
const { downloadReceipt } = require('../controllers/receipt.controller');

// Download receipt PDF
router.get('/download/:orderId', downloadReceipt);

module.exports = router;
