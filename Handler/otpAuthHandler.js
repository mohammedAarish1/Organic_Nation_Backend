const { PublishCommand } = require("@aws-sdk/client-sns");
const { snsClient } = require('../config/awsConfig');
const jwt = require('jsonwebtoken');
const OTP = require('../models/OTP');
const User = require('../models/User');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


const sendOTP = async (phoneNumber) => {
    const otp = generateOTP();
    await OTP.create({ phoneNumber, otp, createdAt: new Date() });


    const params = {
        Message: `Organic Nation - Your OTP is: ${otp}. Please don't share it with anyone`,
        PhoneNumber: phoneNumber,
        MessageAttributes: {
            'AWS.SNS.SMS.SMSType': {
                DataType: 'String',
                StringValue: 'Transactional'
            }
        }
    };

    try {
        // console.log('otp', otp)
        const data = await snsClient.send(new PublishCommand(params));

        return data;
    } catch (err) {
        // console.error("Error", err);
        throw err;
    }
};

const verifyOTP = async (phoneNumber, otp) => {
    const storedOTP = await OTP.findOne({ phoneNumber, otp });
    if (!storedOTP) return false;

    const isValid = (new Date() - storedOTP.createdAt) < 5 * 60 * 1000;
    if (isValid) {
        await OTP.deleteOne({ _id: storedOTP._id });
    }
    return isValid;
};




// routes

exports.sendOTP = async (req, res) => {
    const { phoneNumber } = req.body;
    try {
        await sendOTP(phoneNumber);

        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
}

exports.verifyOTP = async (req, res) => {
    const { phoneNumber, otp } = req.body;
    const isValid = await verifyOTP(phoneNumber, otp);


    if (isValid) {
        try {
            // Check if user exists
            let user = await User.findOne({ phoneNumber });

            if (!user) {
                // If user doesn't exist, create a new one
                return res.json({ success: true, message: 'OTP verified successfully' });
            }


            // Generate JWT token
            const payload = { user: { id: user._id } };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
                if (err) throw err;
                // res.json({ token, msg: 'Verified' });
                res.json({ success: true, message: 'OTP verified successfully', token, isNewUser: !user });

            });

            // const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
            // res.json({ success: true, message: 'OTP verified successfully', token, isNewUser: !user });
        } catch (error) {
            console.log('errr', error)
        }
    } else {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
}
