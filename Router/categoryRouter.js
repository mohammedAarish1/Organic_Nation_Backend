const express = require("express");
const router = express.Router();
const {
  getCategories,
  getProductsByCategory,
  getProduct,
  allProducts,
  getSingleProductAllInfo
} = require("../Handler/categoryHandler.js");

// Define the route for getting products by category
router.get("/all", allProducts);
router.get("/:category", getProductsByCategory);
router.get("/:category/:product", getProduct);
router.get("/product/details/:name", getSingleProductAllInfo);
router.get("/", getCategories);

module.exports = router;
