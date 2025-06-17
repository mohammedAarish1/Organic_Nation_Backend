const express = require("express");
const router = express.Router();


const { handleNewsletterSubscription } = require("../Handler/newsletterHandler.js");

router.post("/add/newsletter/subscription", handleNewsletterSubscription);



module.exports = router;
