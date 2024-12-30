const mongoose = require("mongoose");

const mainBannerSchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    // image: { type: String, required: true },
    image: {
        blur: { type: String },
        sm: { type: String },
        md: { type: String },
        lg: { type: String }
    },
    redirectionUrl: { type: String, required: true },// URL to redirect to 
    order: { type: Number, default: 1 },
}, { timestamps: true })

module.exports = mongoose.model('MainBanner', mainBannerSchema)