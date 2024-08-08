const express = require("express");
const router = express.Router();


const {
    getPaymentDone,
    checkPaymentStatus,
    // handleCallback,
} = require("../Handler/paymentHandler.js");

router.post("/payment", getPaymentDone);
// router.post("/callback", handleCallback);
router.post("/status", checkPaymentStatus);



module.exports = router;
