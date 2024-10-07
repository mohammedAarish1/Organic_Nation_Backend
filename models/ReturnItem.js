const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    invoiceNumber: {
        type: String,
        required: true,
    },
    itemName: {
        type: String,
        required: true
    },
    weight: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    returnStatus:{
        type:String,
        required:true
    },
    returnOptions: {
        type: String,
        required: true
    },
    images: [{
        type: String,
        required: true
    }],
    video:{
        type:String,
        required:true
    },
    bankDetails: {
        accountName: {
            type: String,
            required: function() { return this.returnOptions === 'refund'; }
        },
        bankName: {
            type: String,
            required: function() { return this.returnOptions === 'refund'; }
        },
        accountNumber: {
            type: String,
            required: function() { return this.returnOptions === 'refund'; }
        },
        ifscCode: {
            type: String,
            required: function() { return this.returnOptions === 'refund'; }
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const ReturnItem = mongoose.model('ReturnItem', returnItemSchema);

module.exports = ReturnItem;