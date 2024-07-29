const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderNo: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true },
  billingAddress: { type: String, required: true },
  shippingAddress: { type: String, required: true },
  orderDetails: {
    type: [[String, String, Number]], // 2D array of [productId, quantity]
    required: true
  },
  amountPaid: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  receiverDetails: {
    phoneNumber: { type: String, required: false }, // Receiver's phone number, optional
    name: { type: String, required: false } // Receiver's name, optional
  },
  orderStatus: { type: String, default: 'active' }, // Order status with default value "active"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
