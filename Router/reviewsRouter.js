const express = require("express");
const router = express.Router();
const passport = require('passport');
const multer = require('multer');

// const requireAuth = passport.authenticate('jwt', { session: false });
const authMiddleware = require("../middleware/authMiddleware.js");


const upload = multer({
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'images') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed for images!'), false);
      }
    } else if (file.fieldname === 'video') {
      if (!file.mimetype.startsWith('video/')) {
        return cb(new Error('Only video files are allowed for video!'), false);
      }
    }
    cb(null, true);
  }
}).fields([
  { name: 'images', maxCount: 3 },
  { name: 'video', maxCount: 1 }
]);

const {
    addReview,
    getAllReviews,
    getAverageRating,
    getSingleProductReviews
} = require("../Handler/reviewsHandler.js");

router.post("/", authMiddleware,upload, addReview);
router.get("/", getAllReviews);
router.get("/average/:productName", getAverageRating);
router.get("/:productName", getSingleProductReviews);


module.exports = router;
