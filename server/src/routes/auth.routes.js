const express = require("express");
const auth = require("../middleware/auth");
const { getProfile, register } = require("../controllers/auth.controller");

const router = express.Router();

router.get("/profile", auth, getProfile);
router.post("/register", register); // Public endpoint for registration

module.exports = router;
