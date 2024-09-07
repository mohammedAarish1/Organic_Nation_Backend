const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const multer = require('multer');

const requireAuth = passport.authenticate('jwt-admin', { session: false });





// const verifyAdminToken = async (req, res, next) => {
//     const token = req.cookies.adminToken;


//     if (!token) {
//         return res.status(401).json({ message: 'Access denied. No token provided.' });
//     }

//     try {
//         // Verify the JWT token
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const { username, role } = decoded;

//         if (role !== 'admin') {
//             return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
//         }

//         // Find the admin user
//         const admin = await Admin.findOne({ username }, { passwordHash: 0, secretKey: 0 });
//         if (!admin) {
//             return res.status(403).json({ message: 'Access denied. Invalid token.' });
//         }

//         // Attach the admin user to the request object
//         req.user = { username: admin.username };
//         next();
//     } catch (error) {
//         res.status(400).json({ message: 'Invalid token.' });
//     }
// };

// CSRF protection
// const csrfProtection = csrf({ cookie: true });

// Rate limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 requests per windowMs
});


// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });


const {
    adminLogin,
    getAdminProfile,
    getTotalOrders,
    getAllUsers,
    getAllUserQueries,
    generateInvoice,
    updateOrderStatus,
    addNewProductInDatabase
} = require("../Handler/adminHandler.js");



router.post("/login", loginLimiter, adminLogin);
router.get("/profile", requireAuth, getAdminProfile);
router.get("/orders", requireAuth, getTotalOrders);
router.get("/users", requireAuth, getAllUsers);
router.get("/queries", requireAuth, getAllUserQueries);
router.post("/orders/invoice", requireAuth, generateInvoice);
router.put("/orders/update-status", requireAuth, updateOrderStatus);
router.post("/products/add",  upload.array('images', 5), addNewProductInDatabase);


module.exports = router;
