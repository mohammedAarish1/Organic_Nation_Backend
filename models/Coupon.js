const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name:{type:String, required:true,},
  description: { type: String },
  type: { 
    type: String, 
    enum: ['percentage', 'fixed', 'bundle','referral'], 
    required: true 
  },

  value: { type: Number,default: null  }, // Amount of discount
  minOrderValue: { type: Number,default: null }, // Minimum order value required
  isReferralCoupon: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  },

  expiresAt: { type: Date, required: true,default: null }, // New field for expiration
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


// Add a method to check if coupon is expired
couponSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Add pre-save middleware to update status if expired
// couponSchema.pre('save', function(next) {
//   if (this.expiresAt < new Date()) {
//     this.status = 'expired';
//   }
//   next();
// });


module.exports = mongoose.model('Coupon', couponSchema);