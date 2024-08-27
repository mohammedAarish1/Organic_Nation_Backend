const User = require('../models/User');
const passport = require('passport');

// Middleware to protect routes
const requireAuth = passport.authenticate('jwt', { session: false });

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
exports.addItemToCart = async (req, res) => {
  // below productName is added by aarish 
  const { productId, quantity, productName } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const itemIndex = user.cart.findIndex(item => item.productId === productId);
    if (itemIndex > -1) {
      user.cart[itemIndex].quantity += quantity;
    } else {
      user.cart.push({ productId, quantity, productName });
    }
    await user.save();
    res.json(user.cart);
  } catch (err) {
    console.error('Error adding item to cart:', err.message);
    res.status(500).send('Server error');
  }
}

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
exports.clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.cart = [];
    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).send('Server error');
  }
}

// for deleting single item from the cart
// @route   DELETE /api/cart/:id
exports.deleteSingleItem = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const itemId = req.params.itemId;

    const itemIndex = user.cart.findIndex(item => item.productId === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ msg: 'Item not found in cart' });
    }

    user.cart.splice(itemIndex, 1);

    await user.save();
    res.json(user.cart);
  } catch (err) {
    console.error('Error removing item from cart:', err.message);
    res.status(500).send('Server error');
  }
}


// for updating the qty of the product 
// @route   PUT /api/cart/:id

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

    const productIndex = user.cart.findIndex(item => item.productId.toString() === req.params.productId);
    if (productIndex === -1) {
      return res.status(404).json({ msg: 'Product not found in cart' });
    }

    if (action === 'increase') {
      user.cart[productIndex].quantity += 1;
    } else { // action === 'decrease'
      if (user.cart[productIndex].quantity > 1) {
        user.cart[productIndex].quantity -= 1;
      } else {
        // Remove the item if quantity becomes 0
        user.cart.splice(productIndex, 1);
      }
    }

    await user.save();

    res.json(user.cart);
  } catch (err) {
    console.error('Error updating quantity:', err.message);
    res.status(500).send('Server error');
  }
}


// @route   POST /api/cart/merge
// @desc    merge cart with local cart items
exports.handleCartMerge = async (req, res) => {
  const { localCart, replaceCart } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }


    if (replaceCart) {
      // Replace server cart with local cart
      user.cart = localCart;
    } else {
      // Merge local cart with server cart
      localCart.forEach(localItem => {
        const serverItem = user.cart.find(item => item.productId.toString() === localItem.productId);
        if (serverItem) {
          // If item exists in server cart, update quantity
          serverItem.quantity += localItem.quantity;
        } else {
          // If item doesn't exist in server cart, add it
          user.cart.push(localItem);
        }
      });
    }

    await user.save();
    res.json(user.cart);
  } catch (error) {
    console.error('Error processing cart:', error);
    res.status(500).json({ message: 'Error processing cart', error: error.message });
  }
}
