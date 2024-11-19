const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  'name-url': {
    type: String,
    required: true
  },
  weight: {
    type: String,
    required: true
  },
  grossWeight: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  'hsn-code': {
    type: String,
    required: true,
    // default: 0
  },
  category: {
    type: String,
    required: true
  },
  'category-url': {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  availability: {
    type: Number,
    required: true
  },
  img: {
    type: [String],
    required: true
  },
  // img: [{
  //   blur: String,
  //   sm: String,
  //   md: String,
  //   lg: String
  // }],
  meta: {
    buy: {
      type: Number,
      default: 0
    },
    get: {
      type: Number,
      default: 0
    },
    season_special: {
      type: Boolean,
      default: false
    },
    new_arrivals: {
      type: Boolean,
      default: false
    },
    best_seller: {
      type: Boolean,
      default: false
    },
    deal_of_the_day: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

const Products = mongoose.model('Products', productSchema);

module.exports = Products;