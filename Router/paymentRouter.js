const express = require("express");
const router = express.Router();


const {
    getPaymentDone,
    checkPaymentStatus,
    updateMerchantTransactionId,
    // handleCallback,
} = require("../Handler/paymentHandler.js");

router.post("/payment", getPaymentDone);
router.post("/status", checkPaymentStatus);
router.post("/update/transaction-id/:id", updateMerchantTransactionId);

// router.post("/callback", handleCallback);



module.exports = router;
