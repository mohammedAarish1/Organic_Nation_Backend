const mongoose = require("mongoose");


const CouponDetailsSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId,ref:'Coupon', required: true },
  name: { type: String, required: true },
});

// schema for addresses
const AddressSchema = new mongoose.Schema({
  addressType: { type: String, }, // to indicate the type of address home, office etc
  mainAddress: { type: String, required: true },
  optionalAddress: { type: String, },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, required: true },
  country: { type: String, default:'India' },
  isDefault: { type: Boolean, default: false }, // To indicate the default address
});

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    firstName: { type: String, },
    lastName: { type: String,  },
    phoneNumber: { type: String, required:true },
    email: { type: String, unique: true },
    // password: { type: String },
    createdAt: { type: Date, default: Date.now },
    cart: {
      type: {
        items: [
          {
            productId: { type: String, required: true },
            quantity: { type: Number, required: true },
            productName: { type: String, required: true },
          },
        ],
        totalCartAmount: { type: Number, default: 0 }, // Total amount for the cart
        totalTaxes: { type: Number, default: 0 }, // Total tax amount for the cart
        couponCodeApplied: [CouponDetailsSchema], // New array field for coupon codes
      },
      default: {
        items: [],
        totalCartAmount: 0,
        totalTaxes: 0,
        couponCodeApplied: [],
      },
    },
    role: {
      type: String,
      default: "Customer",
    },
    addresses: [AddressSchema], // Embedding addresses
    refreshToken: { type: String, default: null },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
);


module.exports = mongoose.model("User", UserSchema);
