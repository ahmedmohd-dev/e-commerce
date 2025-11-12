const express = require("express");
const {
  listProducts,
  getProductBySlug,
  searchAutocomplete,
} = require("../controllers/product.controller");

const router = express.Router();

router.get("/", listProducts);
router.get("/search/autocomplete", searchAutocomplete);
router.get("/:slug", getProductBySlug);

module.exports = router;
