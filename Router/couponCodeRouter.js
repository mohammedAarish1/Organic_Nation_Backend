const express = require("express");
const router = express.Router();
const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });


const {
    validateCouponCode,
    applyPickleCouponCode
} = require("../Handler/couponCodeHandler.js");

router.post("/coupon-code", requireAuth, validateCouponCode);
router.post("/pickle/coupon-code",  applyPickleCouponCode);




module.exports = router;
