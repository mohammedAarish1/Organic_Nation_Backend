const express = require("express");
const router = express.Router();


const {
    checkDeliveryAvailability
} = require("../Handler/pincodesHandler.js");

router.get("/check-availability/:pincode", checkDeliveryAvailability);



module.exports = router;
