const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true,
  // },
  productName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true, maxlength: 100 },
  userEmail: { type: String, },
  userName: { type: String,  },
  phoneNumber: { type: String, required: true },

}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
