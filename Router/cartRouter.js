const express = require("express");
const router = express.Router();
const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });

const authMiddleware = require("../middleware/authMiddleware.js");
const authMiddlewareNew = require("../middleware/authMiddlewareNew.js");

const {
    getCart,
    getCartDetails,
    addItemToCart,
    clearCart,
    deleteSingleItem,
    updateQty,
    handleCartMerge,
    handleCartMergeNew,
    updateQtyNew,
    deleteSingleItemNew,
    addItemToCartNew,
    getLoggedinUserCart
} = require("../Handler/cartHandler.js");

// Define the route for getting products by category
router.get("/", authMiddleware, getCart);
router.post("/cart-details", getCartDetails);
router.post("/", authMiddleware, addItemToCart);
router.delete("/", authMiddleware, clearCart);
router.delete("/:productName", authMiddleware, deleteSingleItem);
router.put("/updateQuantity/:productName", authMiddleware, updateQty);
router.post("/merge", authMiddleware, handleCartMerge);
// for Next JS
router.get("/logged-in-user", authMiddlewareNew, getLoggedinUserCart);
router.post("/add", authMiddlewareNew, addItemToCartNew);
router.post("/merge-new", authMiddlewareNew, handleCartMergeNew);
router.put("/updateQuantity-new/:productName", authMiddlewareNew, updateQtyNew);
router.delete("/remove/:productName", authMiddlewareNew, deleteSingleItemNew);




module.exports = router;
