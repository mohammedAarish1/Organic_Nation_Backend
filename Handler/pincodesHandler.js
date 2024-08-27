const PinCode = require('../models/PinCode');

exports.checkDeliveryAvailability = async (req, res) => {
    try {
        const pinCode = req.params.pincode;



        const pinCodeData = await PinCode.findOne({ pinCode });
        if (pinCodeData) {
            res.json({
                available: true,
                message: `Delivery is available for ${pinCodeData.city}, ${pinCodeData.state}.`,
                data: {
                    city: pinCodeData.city,
                    state: pinCodeData.state
                }
            });
        } else {
            res.json({
                available: false,
                message: 'Delivery is not available for this pin code.'
            });
        }
    } catch (error) {
        // console.error('Error checking pin code availability:', error);
        res.status(500).json({
            error: 'An error occurred while checking availability.'
        });
    }
}
