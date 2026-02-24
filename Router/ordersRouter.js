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
router.post("/add-return-item", authMiddleware, upload, handleReturnItems)
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
router.post('/add-to-wishlist-new/:productId',authMiddlewareNew,addToWishlist);
router.get('/all/wish-list-new',authMiddlewareNew,getAllWishlist) // for array of product id's
router.delete('/wish-list/remove-new/:productId',authMiddlewareNew,removeFromWishlist)
router.delete('/wish-list-new/clear',authMiddlewareNew,clearWishlist)


module.exports = router;
