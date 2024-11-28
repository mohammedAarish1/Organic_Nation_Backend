const User = require('../models/User');
// const passport = require('passport');
const Products = require('../models/Products.js');
const { updateCouponStatus } = require('../utility/helper.js');


// Middleware to protect routes
// const requireAuth = passport.authenticate('jwt', { session: false });

// @route   GET /api/cart
// @desc    Get user's cart
exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user.cart);
  } catch (err) {
    console.error('Error retrieving cart:', err.message);
    res.status(500).send('Server error');
  }
}






exports.addItemToCart = async (req, res) => {
  const { productId, quantity, productName } = req.body;

  try {
    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Initialize cart if it doesn't exist
    if (!user.cart) {
      user.cart = {
        items: [],
        totalCartAmount: 0,
        totalTaxes: 0,
        // isCouponCodeApplied: false
        couponCodeApplied: []
      };
    }

    // making referral code active again if user add a new product after using the coupon code 
    if (user.referralCoupons.length > 0) {
      for (let coupon of user.referralCoupons) {
        if(!coupon.isUsed){
          await updateCouponStatus(coupon.couponId, 'active')
        }
      }
    }

    // Fetch product information
    const product = await Products.findOne({ 'name-url': productName });
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Calculate price after 20% discount
    const discountedPrice = product.price * (1 - product.discount / 100);

    // Calculate subtotal (including tax) for the product
    const itemSubtotal = discountedPrice * quantity;

    // Reverse calculate to find the tax amount from the subtotal
    const itemTax = (product.tax / (100 + product.tax)) * itemSubtotal;

    // Find if the item already exists in the cart
    const itemIndex = user.cart.items.findIndex(item => item.productName === productName);

    if (itemIndex > -1) {
      // Update quantity if item already exists in cart
      user.cart.items[itemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      user.cart.items.push({
        productId,
        productName,
        quantity
      });
    }

    // Recalculate total cart amount and total taxes
    let totalCartAmount = 0;
    let totalTaxes = 0;

    // Iterate over each item in the cart to recalculate the totals
    for (const item of user.cart.items) {
      const product = await Products.findOne({ 'name-url': item.productName })
      const discountedPrice = product.price * (1 - product.discount / 100);
      const itemSubtotal = discountedPrice * item.quantity;

      // Reverse calculate tax from subtotal
      const itemTax = (product.tax / (100 + product.tax)) * itemSubtotal;

      totalCartAmount += itemSubtotal;
      totalTaxes += itemTax;
    }

    // Update the user's cart totals
    user.cart.totalCartAmount = Math.round(totalCartAmount);
    user.cart.totalTaxes = Math.round(totalTaxes);
    // user.cart.isCouponCodeApplied = false
    user.cart.couponCodeApplied = []

    // Save the updated user document
    await user.save();

    res.json(user.cart);
  } catch (err) {
    console.error('Error adding item to cart:', err.message);
    res.status(500).send('Server error');
  }
};







exports.clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Clear the cart items and reset totalCartAmount and totalTaxes
    user.cart.items = [];
    user.cart.totalCartAmount = 0;
    user.cart.totalTaxes = 0;
    // user.cart.isCouponCodeApplied = false
    user.cart.couponCodeApplied = []



  // making referral code active again if user add a new product after using the coupon code 
  // if (user.referralCoupons.length > 0) {
  //   for (let coupon of user.referralCoupons) {
  //     if (coupon.isUsed) {
  //       await markCouponActive(coupon.couponId, user._id)
  //     }
  //   }
  // }

    // Save the updated user document
    await user.save();

    res.json(user.cart);
  } catch (err) {
    console.error('Error clearing cart:', err.message);
    res.status(500).send('Server error');
  }
};




exports.deleteSingleItem = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const productName = req.params.productName;

    // Find the index of the item to be removed
    const itemIndex = user.cart.items.findIndex(item => item.productName === productName);
    if (itemIndex === -1) {
      return res.status(404).json({ msg: 'Item not found in cart' });
    }

    // Remove the item from the cart
    user.cart.items.splice(itemIndex, 1);

    // Recalculate total cart amount and total taxes
    let totalCartAmount = 0;
    let totalTaxes = 0;

    // Iterate over each remaining item in the cart to recalculate the totals
    for (const item of user.cart.items) {
      const product = await Products.findOne({ 'name-url': item.productName });
      const discountedPrice = product.price * (1 - product.discount / 100);
      const itemSubtotal = discountedPrice * item.quantity;

      // Reverse calculate tax from subtotal
      const itemTax = (product.tax / (100 + product.tax)) * itemSubtotal;

      totalCartAmount += itemSubtotal;
      totalTaxes += itemTax;
    }

    // Update the user's cart totals
    user.cart.totalCartAmount = Math.round(totalCartAmount);
    user.cart.totalTaxes = Math.round(totalTaxes);
    // user.cart.isCouponCodeApplied = false
    user.cart.couponCodeApplied = []



  // making referral code active again if user add a new product after using the coupon code 
  if (user.referralCoupons.length > 0) {
    for (let coupon of user.referralCoupons) {
      if(!coupon.isUsed){
        await updateCouponStatus(coupon.couponId, 'active')
      }
    }
  }

    // Save the updated user document
    await user.save();

    res.json(user.cart);
  } catch (err) {
    console.error('Error removing item from cart:', err.message);
    res.status(500).send('Server error');
  }
};



exports.updateQty = async (req, res) => {
  try {
    const { action } = req.body; // 'increase' or 'decrease'
    if (!['increase', 'decrease'].includes(action)) {
      return res.status(400).json({ msg: 'Invalid action. Use "increase" or "decrease".' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const productIndex = user.cart.items.findIndex(item => item.productName.toString() === req.params.productName);
    if (productIndex === -1) {
      return res.status(404).json({ msg: 'Product not found in cart' });
    }

    if (action === 'increase') {
      user.cart.items[productIndex].quantity += 1;
    } else { // action === 'decrease'
      if (user.cart.items[productIndex].quantity > 1) {
        user.cart.items[productIndex].quantity -= 1;
      } else {
        // Remove the item if quantity becomes 0
        user.cart.items.splice(productIndex, 1);
      }
    }

    // Recalculate total cart amount and total taxes
    let totalCartAmount = 0;
    let totalTaxes = 0;

    // Iterate over each item in the cart to recalculate the totals
    for (const item of user.cart.items) {
      const product = await Products.findOne({ 'name-url': item.productName });
      const discountedPrice = product.price * (1 - product.discount / 100);
      const itemSubtotal = discountedPrice * item.quantity;

      // Reverse calculate tax from subtotal
      const itemTax = (product.tax / (100 + product.tax)) * itemSubtotal;

      totalCartAmount += itemSubtotal;
      totalTaxes += itemTax;
    }
    // Update the user's cart totals
    user.cart.totalCartAmount = Math.round(totalCartAmount);
    user.cart.totalTaxes = Math.round(totalTaxes);
    // user.cart.isCouponCodeApplied = false
    user.cart.couponCodeApplied = []


  // making referral code active again if user add a new product after using the coupon code 
  if (user.referralCoupons.length > 0) {
    for (let coupon of user.referralCoupons) {
      if(!coupon.isUsed){
        await updateCouponStatus(coupon.couponId, 'active')
      }
    }
  }

    // Save the updated user document
    await user.save();
    res.json(user.cart);
  } catch (err) {
    console.error('Error updating quantity:', err.message);
    res.status(500).send('Server error');
  }
};




exports.handleCartMerge = async (req, res) => {
  try {
    const { cart } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    user.cart.items = cart.items,
      user.cart.totalCartAmount = cart.totalCartAmount,
      user.cart.totalTaxes = cart.totalTaxes,
      user.cart.couponCodeApplied = cart.couponCodeApplied

    user.save()


    res.json(user.cart);
  } catch (error) {
    console.error('Error merging cart:', err.message);
    res.status(500).send('Server error');
  }
}