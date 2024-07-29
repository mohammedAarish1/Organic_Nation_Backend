const mongoose = require('mongoose');

const pinCodeSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    trim: true,
    min: 6,
    max: 6,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  zone: {
    type: String,
    required: true,
    trim: true,
  },
});

module.exports = mongoose.model('PinCode', pinCodeSchema);