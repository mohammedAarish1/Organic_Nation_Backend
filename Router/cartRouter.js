const express = require("express");
const router = express.Router();
const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });

const authMiddleware = require("../middleware/authMiddleware.js");

const {
    getCart,
    getCartDetails,
    addItemToCart,
    clearCart,
    deleteSingleItem,
    updateQty,
    handleCartMerge
} = require("../Handler/cartHandler.js");

// Define the route for getting products by category
router.get("/", authMiddleware, getCart);
router.post("/cart-details", getCartDetails);
router.post("/", authMiddleware, addItemToCart);
router.delete("/", authMiddleware, clearCart);
router.delete("/:productName", authMiddleware, deleteSingleItem);
router.put("/updateQuantity/:productName", authMiddleware, updateQty);
router.post("/merge", authMiddleware, handleCartMerge);


module.exports = router;
