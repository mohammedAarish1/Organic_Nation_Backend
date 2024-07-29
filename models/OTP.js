const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // The document will be automatically deleted after 300 seconds (5 minutes)
  }
});

// Create a compound index on phoneNumber and otp for faster queries
otpSchema.index({ phoneNumber: 1, otp: 1 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;