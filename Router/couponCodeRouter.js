const express = require("express");
const router = express.Router();
const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });
const authMiddleware = require("../middleware/authMiddleware.js");


const {
    validateCouponCode,
    applyPickleCouponCode,
    applyAdditionalDiscountCoupon,
    getSingleCouponUsingId,
    applyReferralCodeDiscount,
    getSingleCouponUsingCode
    // picklecoupon
} = require("../Handler/couponCodeHandler.js");

router.get('/:couponId',authMiddleware, getSingleCouponUsingId);
router.get('/coupon/:code',authMiddleware, getSingleCouponUsingCode);
router.post("/family/coupon-code",  validateCouponCode);
router.post("/pickle/coupon-code",  applyPickleCouponCode);
router.post("/additional/coupon/discount",  applyAdditionalDiscountCoupon);
router.post("/referral/coupon/discount", authMiddleware, applyReferralCodeDiscount);


module.exports = router;
