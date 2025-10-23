const express = require("express");
const auth = require("../middleware/auth");
const { submitTelebirr } = require("../controllers/payment.controller");

const router = express.Router();

router.post("/telebirr/submit", auth, submitTelebirr);

module.exports = router;





