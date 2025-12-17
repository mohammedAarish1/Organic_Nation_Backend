const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    // user: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    //   required: true,
    // },
    productName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, maxlength: 50 },
    review: { type: String, maxlength: 500 },
    userEmail: { type: String },
    userName: { type: String },
    phoneNumber: { type: String, required: true },
    verified: { type: Boolean, default: true }, // Assuming verified is true by default
    images: { type: [String], default: [] }, // Default images
    hasVideo: { type: Boolean, default: false },
    videoUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", ReviewSchema);
