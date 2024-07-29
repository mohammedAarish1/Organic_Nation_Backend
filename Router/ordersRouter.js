const express = require("express");
const router = express.Router();
const passport = require('passport');

const requireAuth = passport.authenticate('jwt', { session: false });

const {
    createOrder,
    cancelOrder,
    getAllOrders,
    getOrderById
} = require("../Handler/ordersHandler.js");

router.post("/", requireAuth, createOrder);
router.delete("/:orderId", requireAuth, cancelOrder);
router.get("/all", requireAuth, getAllOrders);
router.get("/:orderId", getOrderById);



module.exports = router;
