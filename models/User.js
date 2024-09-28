const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
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
        isCouponCodeApplied: { type: Boolean, default: false },
      },
      default: {
        items: [],
        totalCartAmount: 0,
        totalTaxes: 0,
        isCouponCodeApplied: false,
      },
    },
    role: {
      type: String,
      default: "Customer",
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
);


module.exports = mongoose.model("User", UserSchema);
