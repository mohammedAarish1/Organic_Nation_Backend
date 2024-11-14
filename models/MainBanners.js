const mongoose = require("mongoose");

const mainBannerSchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    image: { type: String, required: true },
    redirectionUrl: { type: String, required: true },// URL to redirect to 
    order: { type: Number, default: 1 },
}, { timestamps: true })

module.exports = mongoose.model('MainBanner', mainBannerSchema)