const mongoose = require('mongoose');

const DeliveryFeedbackSchema = new mongoose.Schema({
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true,
  // },
  invoiceNumber: { type: String, required: true },
  selectedOption: { type: String, required: true },
  comments: { type: String,  },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },

}, { timestamps: true });

module.exports = mongoose.model('DeliveryFeedback', DeliveryFeedbackSchema);
