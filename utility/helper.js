const jwt = require('jsonwebtoken');
const Products = require('../models/Products');

// Token generation utility

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
};





// to convert the address object into plain string 
const address = (obj) => {
  let result = '';
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (Array.isArray(value)) {
        result += value.flat().join(' ') + ' ';
      } else {
        result += value + ' ';
      }
    }
  }
  return result.trim();
}


// to update the stock  of a product
const updateStock = async (productName, quantity, action) => {
  let update;
  
  switch (action) {
    case 'add':
      update = { $inc: { availability: -quantity } }; // Decrease stock for a new order
      break;
    case 'cancel':
      update = { $inc: { availability: quantity } }; // Increase stock when an order is canceled
      break;
    case 'return':
      update = { $inc: { availability: quantity } }; // Increase stock for returned items
      break;
    default:
      throw new Error('Invalid action specified');
  }

  try {
    const result = await Products.findOneAndUpdate(
      { ['name-url']: productName }, // Find by product name
      update,
      { new: true, runValidators: true }
    );

    if (!result) {
      throw new Error('Product not found');
    }

    return 'Stock updated successfully'; // Return a success message
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error; // Re-throw the error for handling in the calling function
  }
};






module.exports = { generateTokens, address, updateStock };
