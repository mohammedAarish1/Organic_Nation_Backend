const User = require('../models/User');
const passport = require('passport');
const Products = require('../models/Products.js');


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

// @route   POST /api/cart

// @desc    Add item to cart
// exports.addItemToCart = async (req, res) => {
//   const { productId, quantity, productName } = req.body;

//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ msg: 'User not found' });
//     }

//     const itemIndex = user.cart.findIndex(item => item.productId === productId);
//     if (itemIndex > -1) {
//       user.cart[itemIndex].quantity += quantity;
//     } else {
//       user.cart.push({ productId, quantity, productName });
//     }
//     await user.save();
//     res.json(user.cart);
//   } catch (err) {
//     console.error('Error adding item to cart:', err.message);
//     res.status(500).send('Server error');
//   }
// }




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
        isCouponCodeApplied: false
      };
    }

    // Fetch product information
    const product = await Products.findById(productId);
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
    const itemIndex = user.cart.items.findIndex(item => item.productId === productId);

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
      const product = await Products.findById(item.productId);
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
    user.cart.isCouponCodeApplied = false

    // Save the updated user document
    await user.save();

    res.json(user.cart);
  } catch (err) {
    console.error('Error adding item to cart:', err.message);
    res.status(500).send('Server error');
  }
};





// @route   PUT /api/cart
// @desc    Update cart item quantity
// router.put('/', requireAuth, async (req, res) => {
//   const { productId, quantity } = req.body;

//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ msg: 'User not found' });
//     }

//     const itemIndex = user.cart.findIndex(item => item.productId === productId);
//     if (itemIndex > -1) {
//       user.cart[itemIndex].quantity = quantity;
//       await user.save();
//       res.json(user.cart);
//     } else {
//       res.status(404).json({ msg: 'Item not found in cart' });
//     }
//   } catch (err) {
//     console.error('Error updating cart item:', err.message);
//     res.status(500).send('Server error');
//   }
// });

// @route   DELETE /api/cart
// @desc    Clear cart
// exports.clearCart = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ msg: 'User not found' });
//     }

//     user.cart = [];
//     await user.save();
//     res.json(user.cart);
//   } catch (err) {
//     res.status(500).send('Server error');
//   }
// }


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

    // Save the updated user document
    await user.save();

    res.json(user.cart);
  } catch (err) {
    console.error('Error clearing cart:', err.message);
    res.status(500).send('Server error');
  }
};

// for deleting single item from the cart
// @route   DELETE /api/cart/:id
// exports.deleteSingleItem = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ msg: 'User not found' });
//     }

//     const itemId = req.params.itemId;

//     const itemIndex = user.cart.findIndex(item => item.productId === itemId);
//     if (itemIndex === -1) {
//       return res.status(404).json({ msg: 'Item not found in cart' });
//     }

//     user.cart.splice(itemIndex, 1);

//     await user.save();
//     res.json(user.cart);
//   } catch (err) {
//     console.error('Error removing item from cart:', err.message);
//     res.status(500).send('Server error');
//   }
// }


exports.deleteSingleItem = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const itemId = req.params.itemId;

    // Find the index of the item to be removed
    const itemIndex = user.cart.items.findIndex(item => item.productId === itemId);
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
      const product = await Products.findById(item.productId);
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
    user.cart.isCouponCodeApplied = false

    // Save the updated user document
    await user.save();

    res.json(user.cart);
  } catch (err) {
    console.error('Error removing item from cart:', err.message);
    res.status(500).send('Server error');
  }
};

// for updating the qty of the product 
// @route   PUT /api/cart/:id

// exports.updateQty = async (req, res) => {
//   try {
//     const { action } = req.body; // 'increase' or 'decrease'
//     if (!['increase', 'decrease'].includes(action)) {
//       return res.status(400).json({ msg: 'Invalid action. Use "increase" or "decrease".' });
//     }

//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ msg: 'User not found' });
//     }

//     const productIndex = user.cart.findIndex(item => item.productId.toString() === req.params.productId);
//     if (productIndex === -1) {
//       return res.status(404).json({ msg: 'Product not found in cart' });
//     }

//     if (action === 'increase') {
//       user.cart[productIndex].quantity += 1;
//     } else { // action === 'decrease'
//       if (user.cart[productIndex].quantity > 1) {
//         user.cart[productIndex].quantity -= 1;
//       } else {
//         // Remove the item if quantity becomes 0
//         user.cart.splice(productIndex, 1);
//       }
//     }

//     await user.save();

//     res.json(user.cart);
//   } catch (err) {
//     console.error('Error updating quantity:', err.message);
//     res.status(500).send('Server error');
//   }
// }

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

    const productIndex = user.cart.items.findIndex(item => item.productId.toString() === req.params.productId);
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
      const product = await Products.findById(item.productId);
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
    user.cart.isCouponCodeApplied = false

    // Save the updated user document
    await user.save();

    res.json(user.cart);
  } catch (err) {
    console.error('Error updating quantity:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST /api/cart/merge
// @desc    merge cart with local cart items
// exports.handleCartMerge = async (req, res) => {
//   const { localCart, replaceCart } = req.body;
//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ msg: 'User not found' });
//     }


//     if (replaceCart) {
//       // Replace server cart with local cart
//       user.cart = localCart;
//     } else {
//       // Merge local cart with server cart
//       localCart.forEach(localItem => {
//         const serverItem = user.cart.find(item => item.productId.toString() === localItem.productId);
//         if (serverItem) {
//           // If item exists in server cart, update quantity
//           serverItem.quantity += localItem.quantity;
//         } else {
//           // If item doesn't exist in server cart, add it
//           user.cart.push(localItem);
//         }
//       });
//     }

//     await user.save();
//     res.json(user.cart);
//   } catch (error) {
//     console.error('Error processing cart:', error);
//     res.status(500).json({ message: 'Error processing cart', error: error.message });
//   }
// }

exports.handleCartMerge = async (req, res) => {
  try {
    const { localCart } = req.body; // Array of items from local storage
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    let totalCartAmount = user.cart.totalCartAmount || 0;
    let totalTaxes = user.cart.totalTaxes || 0;

    for (const localItem of localCart) {
      const { productId, quantity } = localItem;
      const existingItemIndex = user.cart.items.findIndex(item => item.productId === productId);

      const product = await Products.findById(productId);
      if (!product) {
        return res.status(404).json({ msg: `Product with ID ${productId} not found` });
      }

      const discountedPrice = product.price * 0.8;
      const itemSubtotal = discountedPrice * quantity;

      // Reverse calculate tax from subtotal
      const itemTax = (product.tax / (100 + product.tax)) * itemSubtotal;

      if (existingItemIndex > -1) {
        // Update quantity if the item already exists in the user's cart
        user.cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to the user's cart
        user.cart.items.push({
          productId,
          quantity,
          productName: localItem.productName
        });
      }

      // Update totalCartAmount and totalTaxes
      totalCartAmount += itemSubtotal;
      totalTaxes += itemTax;
    }

    // Update the user's cart totals
    user.cart.totalCartAmount = Math.round(totalCartAmount);
    user.cart.totalTaxes = Math.round(totalTaxes);
    user.cart.isCouponCodeApplied = false

    // Save the updated user document
    await user.save();

    res.json(user.cart);
  } catch (err) {
    console.error('Error merging cart:', err.message);
    res.status(500).send('Server error');
  }
};