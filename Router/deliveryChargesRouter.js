const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware.js");


const {
    calculateDeliveryCharges
} = require("../Handler/deliveryChargesHandler.js");

router.post("/calculate",authMiddleware, calculateDeliveryCharges);




module.exports = router;
