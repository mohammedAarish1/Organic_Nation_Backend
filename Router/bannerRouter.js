const express = require("express");
const router = express.Router();
const passport = require('passport');
const multer = require('multer');

const requireAuth = passport.authenticate('jwt-admin', { session: false });

// Configure multer with file filter
// const upload = multer({
//     storage: multer.memoryStorage(),
//     limits: {
//         fileSize: 5 * 1024 * 1024,
//     },
//     fileFilter: (req, file, cb) => {
//         if (file.mimetype.startsWith('image/')) {
//             cb(null, true);
//         } else {
//             cb(new Error('Not an image! Please upload only images.'), false);
//         }
//     }
// });


const {
    getAllMainBanners,
    addNewBanner,
    deleteBanner
} = require("../Handler/bannerHandler.js");
const { upload, handleMulterError } = require("../middleware/upload.js");



router.get("/", getAllMainBanners);
router.post("/add", requireAuth, upload.single('image'), addNewBanner);
// router.post("/add", requireAuth, upload.single('image'), handleMulterError, addNewBanner);
router.delete("/delete/:bannerId", requireAuth, deleteBanner);

module.exports = router;
