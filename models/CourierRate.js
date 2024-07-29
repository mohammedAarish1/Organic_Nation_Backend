const mongoose = require('mongoose');

const courierRateSchema = new mongoose.Schema({
    Classification: {
        type: String,
        required: true,
        trim: true,
    },
    CourierCharges: [{
        Weight: String,
        Rate: Number,
    }],
});

module.exports = mongoose.model('CourierRate', courierRateSchema,'courier_rates'); // courier_rates is the name of collection in mongodb