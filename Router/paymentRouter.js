const express = require("express");
const router = express.Router();


const {
    getPaymentDone,
    checkPaymentStatus,
    handleCallback,
} = require("../Handler/paymentHandler.js");

router.post("/payment", getPaymentDone);
router.post("/status", checkPaymentStatus);
router.post("/callback", handleCallback);



module.exports = router;
