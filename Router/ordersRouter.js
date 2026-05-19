const express = require("express");
const router = express.Router();
const multer = require('multer');


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


// ✅ middleware wrapper for multer
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ 
        success: false,
        message: err.code === 'LIMIT_FILE_SIZE' 
          ? 'File too large. Maximum size is 15MB' 
          : err.message 
      });
    }
    if (err) {
      return res.status(400).json({ 
        success: false,
        message: err.message  // "Only image files are allowed" etc.
      });
    }
    next();
  });
};


const {
  // createOrder,
  cancelOrder,
  getAllOrders,
  getOrderById,
  handleReturnItems,
  getAllReturnItmes,
  cancelReturnRequest,
  getRecentPurchases,
  addNewOrder,
  getLastIncompleteOrder,
  handleReOrderReCompletion,
} = require("../Handler/ordersHandler.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const { addToWishlist, getAllWishlist, removeFromWishlist,  clearWishlist } = require("../Handler/wishlistHandler.js");
const authMiddlewareNew = require("../middleware/authMiddlewareNew.js");

// router.post("/", authMiddleware, createOrder);
router.post("/", authMiddleware, addNewOrder);
router.delete("/:orderId", authMiddleware, cancelOrder);
router.get("/all", authMiddleware, getAllOrders);
router.get("/:orderId", getOrderById);
router.post("/add-return-item", authMiddleware, uploadMiddleware, handleReturnItems)
router.get("/all/return-items", authMiddleware, getAllReturnItmes)
router.delete('/cancel-return/:returnId', authMiddleware, cancelReturnRequest);
router.get('/last/incomplete-order', authMiddleware, getLastIncompleteOrder);
router.post('/recomplete-order', authMiddleware, handleReOrderReCompletion); // when use changes the payment method and complete his order

// for recent purchase notification
router.get('/recent/purchases', getRecentPurchases);

// wishlist
router.post('/add-to-wishlist/:productId',authMiddleware,addToWishlist)
router.get('/all/wish-list',authMiddleware,getAllWishlist) // for array of product id's
// router.get('/all/wish-list/products',authMiddleware,getWishlistProductDetail) // for full products
router.delete('/wish-list/remove/:productId',authMiddleware,removeFromWishlist)
router.delete('/wish-list/clear',authMiddleware,clearWishlist)


// for Next js
// router.get("/all/new", authMiddlewareNew, getAllOrders);
// router.post('/add-to-wishlist-new/:productId',authMiddlewareNew,addToWishlist);
router.get('/all/wish-list-new',authMiddlewareNew,getAllWishlist) // for array of product id's
router.delete('/wish-list/remove-new/:productId',authMiddlewareNew,removeFromWishlist)
router.delete('/wish-list-new/clear',authMiddlewareNew,clearWishlist)


module.exports = router;
