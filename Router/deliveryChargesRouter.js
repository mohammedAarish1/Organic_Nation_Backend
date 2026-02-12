const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware.js");


const {
    calculateDeliveryCharges,
    calculateCODCharges,
    calculateCODChargesNew
} = require("../Handler/deliveryChargesHandler.js");
const authMiddlewareNew = require("../middleware/authMiddlewareNew.js");

router.post("/calculate",authMiddleware, calculateDeliveryCharges);
router.post("/calculate/cod-charges",authMiddleware, calculateCODCharges);


// for next js
router.post("/calculate-new",authMiddlewareNew, calculateDeliveryCharges);
router.post("/calculate/cod-charges-new",authMiddlewareNew, calculateCODChargesNew);



module.exports = router;
