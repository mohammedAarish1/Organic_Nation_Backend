const express = require("express");
const router = express.Router();
const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });


const {
    getCart,
    addItemToCart,
    clearCart,
    deleteSingleItem,
    updateQty,
    handleCartMerge
} = require("../Handler/cartHandler.js");

// Define the route for getting products by category
router.get("/", requireAuth, getCart);
router.post("/", requireAuth, addItemToCart);
router.delete("/", requireAuth, clearCart);
router.delete("/:itemId", requireAuth, deleteSingleItem);
router.put("/updateQuantity/:productId", requireAuth, updateQty);
router.post("/merge", requireAuth, handleCartMerge);


module.exports = router;
