const express = require("express");
const router = express.Router();


const {
    calculateDeliveryCharges
} = require("../Handler/deliveryChargesHandler.js");

router.post("/calculate", calculateDeliveryCharges);




module.exports = router;
