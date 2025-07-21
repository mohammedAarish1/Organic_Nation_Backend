const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware.js");


const {
    calculateDeliveryCharges,
    calculateCODCharges
} = require("../Handler/deliveryChargesHandler.js");

router.post("/calculate",authMiddleware, calculateDeliveryCharges);
router.post("/calculate/cod-charges",authMiddleware, calculateCODCharges);




module.exports = router;
