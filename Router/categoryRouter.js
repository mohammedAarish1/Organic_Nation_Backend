const express = require("express");
const router = express.Router();
const {
  getCategories,
  getProductsByCategory,
  getProduct,
  allProducts,
} = require("../Handler/categoryHandler.js");

// Define the route for getting products by category
router.get("/", getCategories);
router.get("/all", allProducts);
router.get("/:category", getProductsByCategory);
router.get("/:category/:product", getProduct);

module.exports = router;
