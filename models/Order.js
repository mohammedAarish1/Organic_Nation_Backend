const mongoose = require('mongoose');


// Define the schema for order details
const OrderDetailSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, required: true },
  "name-url": { type: String, required: true },
  quantity: { type: Number, required: true },
  weight: { type: String, required: true },
  tax: { type: Number, required: true },
  hsnCode: { type: Number, required: true },
  unitPrice: { type: Number, required: true }
});




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
  // orderDetails: {
  //   type: [[String, String, Number, String]], // 2D array of [productId, quantity]
  //   required: true
  // },
  orderDetails: {
    type: [OrderDetailSchema], // Array of OrderDetailSchema objects
    required: true
  },
  subTotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  shippingFee: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  receiverDetails: {
    phoneNumber: { type: String, required: false }, // Receiver's phone number, optional
    name: { type: String, required: false } // Receiver's name, optional
  },
  merchantTransactionId: { type: String, required: true },
  orderStatus: { type: String, default: 'active' }, // Order status with default value "active"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);



