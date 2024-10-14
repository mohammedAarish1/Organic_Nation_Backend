const express = require("express");
const router = express.Router();
const passport = require('passport');

// const requireAuth = passport.authenticate('jwt', { session: false });
const authMiddleware = require("../middleware/authMiddleware.js");

const {
    addReview,
    getAllReviews,
    getAverageRating,
    getSingleProductReviews
} = require("../Handler/reviewsHandler.js");

router.post("/", authMiddleware, addReview);
router.get("/", getAllReviews);
router.get("/average/:productName", getAverageRating);
router.get("/:productName", getSingleProductReviews);


module.exports = router;
