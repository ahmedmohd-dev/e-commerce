const express = require("express");
const {
  listProducts,
  getProductBySlug,
  searchAutocomplete,
} = require("../controllers/product.controller");
const optionalAuth = require("../middleware/optionalAuth");

const router = express.Router();

router.get("/", optionalAuth, listProducts);
router.get("/search/autocomplete", searchAutocomplete);
router.get("/:slug", getProductBySlug);

module.exports = router;
