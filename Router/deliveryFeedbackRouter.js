const express = require("express");
const router = express.Router();
const passport = require('passport');

// const requireAuth = passport.authenticate('jwt', { session: false });

const {
    addDeliveryFeedback,
   
} = require("../Handler/deliveryFeedbackHandler.js");
const authMiddleware = require("../middleware/authMiddleware.js");

router.post("/", authMiddleware, addDeliveryFeedback);



module.exports = router;
