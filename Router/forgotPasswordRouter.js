const express = require("express");
const router = express.Router();


const {
    getEmailVerified,
    resetPassword
} = require("../Handler/forgotPasswordHandler.js");

router.post("/verify-email", getEmailVerified);
router.post("/reset-password", resetPassword);




module.exports = router;
