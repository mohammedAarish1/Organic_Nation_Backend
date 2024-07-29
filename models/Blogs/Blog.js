const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: {
        type: [String],
        required: true
    },
    recent: { type: Boolean, default: true },
    author: { type: String, required: true },
    image: { type: String, required: true },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Blog', blogSchema);