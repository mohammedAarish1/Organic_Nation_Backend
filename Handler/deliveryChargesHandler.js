// routes/deliveryCharges.js
const PinCode = require('../models/PinCode');
const CourierRate = require('../models/CourierRate');
const jwt = require('jsonwebtoken');


exports.calculateDeliveryCharges = async (req, res) => {
    try {
        const { pinCode, weight } = req.body;

        // Check if a token is provided
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
            // If a token is provided, try to verify it
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // If verification succeeds, return the stored charges
                return res.json({ deliveryCharge: decoded.deliveryCharge });
            } catch (error) {
                // If verification fails, proceed to recalculate (token might be expired)
                console.log('Token verification failed, recalculating charges');
            }
        }


        // Find the zone for the given pincode
        const pincodeData = await PinCode.findOne({ pinCode });
        if (!pincodeData) {
            return res.status(404).json({ error: 'Pincode not found' });
        }

        // Find the courier rates for the zone
        const courierRates = await CourierRate.findOne({ Classification: pincodeData.zone });

        if (!courierRates) {
            return res.status(404).json({ error: 'Courier rates not found for this zone' });
        }

        // Find the appropriate rate for the given weight
        const rate = courierRates.CourierCharges.find(charge => {
            const chargeWeight = parseInt(charge.Weight.split(' ')[0]);
            return weight <= chargeWeight;
        });

        if (!rate) {
            return res.status(400).json({ error: 'Weight exceeds maximum limit' });
        }


        const deliveryChargeToken = jwt.sign({ deliveryCharge: rate.Rate }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // res.json({ deliveryCharge: rate.Rate });
        res.json({ token: deliveryChargeToken, deliveryCharge: rate.Rate });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}
