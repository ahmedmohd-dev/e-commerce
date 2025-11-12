const express = require("express");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/admin");
const ctrl = require("../controllers/brand.controller");

const router = express.Router();

// Public
router.get("/", ctrl.listBrands);

// Admin
router.use(auth, isAdmin);
router.get("/admin", ctrl.adminListBrands);
router.post("/admin", ctrl.adminCreateBrand);
router.put("/admin/:id", ctrl.adminUpdateBrand);
router.delete("/admin/:id", ctrl.adminDeleteBrand);

module.exports = router;





















