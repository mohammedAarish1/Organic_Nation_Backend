const express = require("express");
const router = express.Router();


const {
    saveContactedUser
} = require("../Handler/contactedUserHandler.js");

router.post("/submit-contact-details", saveContactedUser );



module.exports = router;
