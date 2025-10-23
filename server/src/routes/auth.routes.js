const express = require("express");
const auth = require("../middleware/auth");
const { getProfile } = require("../controllers/auth.controller");

const router = express.Router();

router.get("/profile", auth, getProfile);

module.exports = router;





