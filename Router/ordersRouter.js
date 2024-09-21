const express = require("express");
const router = express.Router();
const passport = require('passport');
const multer = require('multer');

const requireAuth = passport.authenticate('jwt', { session: false });
// Configure multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

const {
    createOrder,
    cancelOrder,
    getAllOrders,
    getOrderById,
    handleReturnItems,
    getAllReturnItmes,
} = require("../Handler/ordersHandler.js");

router.post("/", requireAuth, createOrder);
router.delete("/:orderId", requireAuth, cancelOrder);
router.get("/all", requireAuth, getAllOrders);
router.get("/:orderId", getOrderById);
router.post("/add-return-item", requireAuth, upload.array('images', 3), handleReturnItems)
router.get("/all/return-items", requireAuth, getAllReturnItmes)



module.exports = router;
