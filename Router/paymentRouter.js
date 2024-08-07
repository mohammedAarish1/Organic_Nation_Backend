const express = require("express");
const router = express.Router();


const {
    getPaymentDone,
    checkPaymentStatus
} = require("../Handler/paymentHandler.js");

router.post("/payment", getPaymentDone);
router.post("/status", checkPaymentStatus);



module.exports = router;
