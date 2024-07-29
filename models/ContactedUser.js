const mongoose = require('mongoose');

const contactedUserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String },
    phoneNumber: { type: String },
    city: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ContactedUser', contactedUserSchema);