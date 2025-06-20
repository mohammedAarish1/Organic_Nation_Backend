// const mongoose = require('mongoose');


// // schema for addresses
// const shippingAddressSchema = new mongoose.Schema({
//   mainAddress: { type: String, required: true },
//   optionalAddress: { type: String, },
//   city: { type: String, required: true },
//   state: { type: String, required: true },
//   pinCode: { type: String, required: true },
//   country: { type: String, default: 'India' },
// });

// const billingAddressSchema = new mongoose.Schema({
//   mainAddress: { type: String, },
//   optionalAddress: { type: String, },
//   city: { type: String,  },
//   state: { type: String,  },
//   pinCode: { type: String,  },
//   country: { type: String, default: 'India' },
// });


// // Define the schema for order details
// const OrderDetailSchema = new mongoose.Schema({
//   id: { type: mongoose.Schema.Types.ObjectId, required: true },
//   "name-url": { type: String, required: true },
//   quantity: { type: Number, required: true },
//   weight: { type: String, required: true },
//   tax: { type: Number, required: true },
//   hsnCode: { type: Number, required: true },
//   unitPrice: { type: Number, required: true },
//   returnInfo: {
//     isItemReturned: { type: Boolean, default: false },
//     returnedQuantity: { type: Number, default: 0 }
//   },
//   actualAmountPaid: { type: Number },  // it will include the actual amount paid for each item
// });


// const CouponDetailsSchema = new mongoose.Schema({
//   id: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
//   name: { type: String, required: true },
// });

// const OrderSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   orderNo: { type: String, required: true, unique: true },
//   userEmail: { type: String, required: true },
//   // billingAddress: { type: String, required: true },
//    billingAddress: { 
//     type:  billingAddressSchema,
//     required: true 
//   },
//   // shippingAddress: { type: String, required: true },
//   shippingAddress: { 
//     type:  shippingAddressSchema,
//     required: true 
//   },
//   orderDetails: {
//     type: [OrderDetailSchema], // Array of OrderDetailSchema objects
//     required: true
//   },
//   subTotal: { type: Number, required: true },
//   taxAmount: { type: Number, required: true },
//   shippingFee: { type: Number, required: true },
//   paymentMethod: { type: String, required: true },
//   paymentStatus: { type: String, required: true },
//   receiverDetails: {
//     phoneNumber: { type: String, required: false }, // Receiver's phone number, optional
//     name: { type: String, required: false } // Receiver's name, optional
//   },
//   merchantTransactionId: { type: String, },
//   couponCodeApplied: [CouponDetailsSchema], // New array field for coupon codes
//   // isCouponCodeApplied: { type: Boolean, default: false },
//   // isPickleCouponApplied: { type: Boolean,default: false  }, // New field and will be removed once pickle offer over
//   orderStatus: { type: String, default: 'active' }, // Order status with default value "active"
//   invoiceNumber: { type: String, required: true },
//   deliveryDate: { type: Date, default: null },
//   createdAt: { type: Date, default: Date.now }
// },
//   {
//     strict: false // This allows fields not specified in the schema (will be removed once pickle offer over)
//   }
// );

// module.exports = mongoose.model('OldOrder', OrderSchema,'orders');