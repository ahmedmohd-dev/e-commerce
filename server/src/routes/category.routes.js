const express = require("express");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/admin");
const ctrl = require("../controllers/category.controller");

const router = express.Router();

// Public
router.get("/", ctrl.listCategories);

// Admin
router.use(auth, isAdmin);
router.get("/admin", ctrl.adminListCategories);
router.post("/admin", ctrl.adminCreateCategory);
router.put("/admin/:id", ctrl.adminUpdateCategory);
router.delete("/admin/:id", ctrl.adminDeleteCategory);

module.exports = router;





















