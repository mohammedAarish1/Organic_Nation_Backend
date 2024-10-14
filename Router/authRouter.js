const express = require("express");
const router = express.Router();
const passport = require('passport');
// const requireAuth = passport.authenticate('jwt', { session: false });
const authMiddleware = require("../middleware/authMiddleware.js");



const {
    googleCallback,
    collectPhoneAndPassword,
    getUserByEmail,
    //new 
    signup,
    login,
    refreshToken,
    logout
} = require("../Handler/authHandler.js");

// Define the route for getting products by category
// router.post("/signup", userSignup);
router.get("/google", passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get("/google/callback", passport.authenticate('google', { failureRedirect: '/' }), googleCallback);
// router.post("/google/phone", passport.authenticate('jwt', { session: false }), collectPhoneAndPassword);
router.post("/google/phone",authMiddleware, collectPhoneAndPassword);
// router.post("/login", userLogin);
router.get("/user/:email", getUserByEmail);
// router.get("/user", requireAuth, getUserByToken);



// new auth routers

router.post("/user/signup", signup);
router.post("/user/login", login);
router.post("/user/refresh", refreshToken);
router.post("/user/logout", logout);

module.exports = router;
