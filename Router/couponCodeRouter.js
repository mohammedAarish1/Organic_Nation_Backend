const express = require("express");
const router = express.Router();
const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });


const {
    validateCouponCode
} = require("../Handler/couponCodeHandler.js");

router.post("/coupon-code", requireAuth, validateCouponCode);




module.exports = router;
