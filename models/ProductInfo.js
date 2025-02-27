const mongoose = require('mongoose');

// Combined schema for product and product info
const productInfoSchema = new mongoose.Schema({
  "name-url": {
    type: String,
    required: true
  },
  productInfo: [
    {
      title: {
        type: String,
        required: true
      },
      content: {
        type: mongoose.Schema.Types.Mixed, // Allows flexibility in data structure (can be a string or an array)
        required: true
      }
    }
  ] // An array of product info objects
});

// Create a model from the schema
const ProductInfo = mongoose.model('ProductInfo', productInfoSchema);

// Export the model
module.exports = ProductInfo;
