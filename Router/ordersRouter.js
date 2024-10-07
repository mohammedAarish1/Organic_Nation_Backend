const express = require("express");
const router = express.Router();
const passport = require('passport');
const multer = require('multer');

const requireAuth = passport.authenticate('jwt', { session: false });
// Configure multer for handling file uploads
// const upload = multer({ storage: multer.memoryStorage() });

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
    createOrder,
    cancelOrder,
    getAllOrders,
    getOrderById,
    handleReturnItems,
    getAllReturnItmes,
    cancelReturnRequest,
} = require("../Handler/ordersHandler.js");

router.post("/", requireAuth, createOrder);
router.delete("/:orderId", requireAuth, cancelOrder);
router.get("/all", requireAuth, getAllOrders);
router.get("/:orderId", getOrderById);
router.post("/add-return-item", requireAuth, upload, handleReturnItems)
router.get("/all/return-items", requireAuth, getAllReturnItmes)
router.delete('/cancel-return/:returnId', requireAuth, cancelReturnRequest);



module.exports = router;
