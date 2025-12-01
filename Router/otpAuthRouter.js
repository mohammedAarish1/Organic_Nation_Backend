const express = require("express");
const router = express.Router();

const {
    sendOTP,
    verifyOTP,
    verifyOTPNew
} = require("../Handler/otpAuthHandler.js");

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
// for NEXT JS
router.post("/verify-otp-new", verifyOTPNew);




module.exports = router;
