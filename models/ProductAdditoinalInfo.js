const mongoose = require('mongoose');
const { Schema } = mongoose;

const contentSchema = new Schema({
  subTitle: { type: String, default: '' },
  subContent: { type: String, required: true }
});

const productInfoSchema = new Schema({
  title: { type: String, required: true },
  content: [contentSchema]
});

const faqSchema = new Schema({
  title: { type: String, required: true },
  content: [String]
});

const productAdditionalInfoSchema = new Schema({
  'name-url': { type: String, required: true },
  productInfo: [productInfoSchema],
  faqs: [faqSchema]
});

const ProductAdditionalInfo = mongoose.model('ProductAdditionalInfo', productAdditionalInfoSchema, 'product-additional-info');

module.exports = ProductAdditionalInfo;