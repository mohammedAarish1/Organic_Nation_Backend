const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name:{type:String, required:true,},
  description: { type: String },
  type: { 
    type: String, 
    enum: ['percentage', 'fixed', 'bundle'], 
    required: true 
  },
//   discountValue: { type: Number },
//   bundleDetails: {
//     category: { type: String },
//     quantity: { type: Number },
//     fixedPrice: { type: Number }
//   },
//   minPurchaseAmount: { type: Number, default: 0 },
//   maxDiscountAmount: { type: Number },
//   startDate: { type: Date, required: true },
//   endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
//   usageLimit: { type: Number, default: null },
//   usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', couponSchema);