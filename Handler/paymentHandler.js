const crypto = require("crypto");
const axios = require("axios");
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');






const merchantId = 'PGTESTPAYUAT86';
const salt_key = '96434309-7796-489d-8924-ab56988a6076';



// payment route
exports.getPaymentDone = async (req, res) => {
    try {

        // Extract data from request body or query
        const { retryToken, number, amount, merchantTransactionId } = req.body;
        let paymentDetails;

        if (retryToken) {
            try {
                // Decode JWT token to get payment details
                const decoded = jwt.verify(retryToken, process.env.JWT_SECRET);
                paymentDetails = {
                    number: decoded.number,
                    amount: decoded.amount,
                    merchantTransactionId: decoded.merchantTransactionId
                };
            } catch (error) {
                console.error('Invalid retry token:', error);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid retry token'
                });
            }
        } else {
            // Validate request body if no retryToken
            if (!number || !amount || !merchantTransactionId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields"
                });
            }
            paymentDetails = { number, amount, merchantTransactionId };
        }


        // const { number, amount, merchantTransactionId } = req.body;
        // if (!number || !amount || !merchantTransactionId) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Missing required fields"
        //     });
        // }


        const data = {
            merchantId: merchantId,
            merchantTransactionId: paymentDetails.merchantTransactionId,
            merchantUserId: "MUID" + Date.now(),
            amount: paymentDetails.amount * 100, // multiply by 100 since it counts money in 'paise' instead of rupee
            // redirectUrl: `https://dpzi63xcomvst.cloudfront.net/api/phonepe/status/?id=${paymentDetails.merchantTransactionId}`,
            redirectMode: "POST",
            callbackUrl: `https://dpzi63xcomvst.cloudfront.net/api/phonepe/callback/?id=${paymentDetails.merchantTransactionId}`,
            mobileNumber: paymentDetails.number,
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        }

        const payload = JSON.stringify(data);
        const payloadMain = Buffer.from(payload).toString('base64');
        const keyIndex = 1;
        const string = payloadMain + '/pg/v1/pay' + salt_key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + '###' + keyIndex;

        // change this URL with production URL
        const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"

        const options = {
            method: 'POST',
            url: prod_URL,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: payloadMain
            }
        };


        try {
            const response = await axios.request(options);
            // return res.redirect(response.data.data.instrumentResponse.redirectInfo.url)
            return res.json(response.data);
        } catch (error) {
            console.error('initiate errrr', error);
            res.status(error.response?.status || 500).json({
                success: false,
                message: error.message,
                data: error.response?.data
            });
        }

    } catch (error) {
        res.status(500).send({
            message: error.message,
            success: false
        })
    }
}



// callback function 

exports.handleCallback = async (req, res) => {
    try {
        // Input validation
        // const errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //     logger.warn('Invalid callback data received', { errors: errors.array() });
        //     return res.status(400).json({ success: false, message: 'Invalid input' });
        // }

        const merchantTransactionId = req.query.id;


        // Fetch the order using the merchantTransactionId
        const order = await Order.findOne({ merchantTransactionId: merchantTransactionId });


        if (!order) {
            console.error('Order not found for transaction ID:', merchantTransactionId);
            return res.redirect(`${process.env.FRONTEND_URL}/payment-status?error=OrderNotFound`);
        }

        const paymentData = req.body;
        console.log(paymentData)

        if (paymentData) {
            order.paymentStatus = 'PAID';
            await order.save(); // Save the updated order

        }

        // logger.info('Received callback for transaction', { merchantTransactionId, paymentData });

        // Verify the callback authenticity
        // if (!verifyPhonePeSignature(req)) {
        //     // logger.error('Invalid signature in callback', { merchantTransactionId });
        //     return res.status(403).json({ success: false, message: 'Invalid signature' });
        // }

        // Process the payment status
        // const paymentStatus = paymentData.code;
        // await updatePaymentStatus(merchantTransactionId, paymentStatus, paymentData);

        // if (paymentStatus === 'PAYMENT_SUCCESS') {
        //     await processSuccessfulPayment(merchantTransactionId);
        //     logger.info('Payment successful', { merchantTransactionId });
        // } else if (paymentStatus === 'PAYMENT_ERROR' || paymentStatus === 'PAYMENT_DECLINED') {
        //     await handleFailedPayment(merchantTransactionId);
        //     logger.warn('Payment failed', { merchantTransactionId, status: paymentStatus });
        // } else {
        //     logger.info('Payment in pending or unknown state', { merchantTransactionId, status: paymentStatus });
        // }

        // console.log(paymentStatus)

        // Respond to PhonePe
        // res.status(200).json({ success: true, message: 'Callback processed successfully' });
    } catch (error) {
        console.log('err', error)
        // logger.error('Error processing callback', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// function verifyPhonePeSignature(req) {
//     try {
//         const receivedSignature = req.headers['x-verify'];
//         const salt = salt_key; // Ensure this is securely stored
//         const payload = JSON.stringify(req.body);

//         const computedSignature = crypto
//             .createHash('sha256')
//             .update(payload + salt)
//             .digest('hex') + '###' + 1; // Assuming key index is 1

//         return receivedSignature === computedSignature;
//     } catch (error) {
//         // logger.error('Error verifying signature', { error: error.message });
//         return false;
//     }
// }

// Middleware for input validation
// exports.validateCallback = [
//     body('code').isString(),
//     body('merchantId').isString(),
//     body('transactionId').isString(),
//     body('amount').isInt(),
//     // Add more validations as per PhonePe's callback structure
// ];





// exports.checkPaymentStatus = async (req, res) => {
//     const merchantTransactionId = req.query.id
//     // const merchantId = merchantId
//     // const salt_key = salt_key


//     if (!merchantTransactionId) {
//         return res.redirect(`${process.env.FRONTEND_URL}/payment-status?error=TransactionIdMissing`);
//     }

//     const keyIndex = 1;
//     const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
//     const sha256 = crypto.createHash('sha256').update(string).digest('hex');
//     const checksum = sha256 + "###" + keyIndex;


//     const options = {
//         method: 'GET',
//         url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
//         headers: {
//             accept: 'application/json',
//             'Content-Type': 'application/json',
//             'X-VERIFY': checksum,
//             'X-MERCHANT-ID': `${merchantId}`
//         }
//     };


//     // CHECK PAYMENT STATUS


//     try {
//         // Simulate a network or service error
//         // throw new Error('Simulated network error');


//         // Fetch the order using the merchantTransactionId
//         const order = await Order.findOne({ merchantTransactionId: merchantTransactionId });


//         if (!order) {
//             console.error('Order not found for transaction ID:', merchantTransactionId);
//             return res.redirect(`${process.env.FRONTEND_URL}/payment-status?error=OrderNotFound`);
//         }

//         // Generate JWT token with payment details
//         const token = jwt.sign({
//             number: order.receiverDetails.phoneNumber,
//             amount: order.subTotal + order.shippingFee,
//             merchantTransactionId: order.merchantTransactionId
//         }, process.env.JWT_SECRET, { expiresIn: '1h' });

//         const response = await axios.request(options);

//         // Simulate a failure response
//         // const response = {
//         //     data: {
//         //         success: false // Simulate a payment failure
//         //     }
//         // };

//         if (response.data.success) {
//             order.paymentStatus = 'PAID';
//             await order.save(); // Save the updated order
//             const url = `${process.env.FRONTEND_URL}/payment-status?status=success&id=${merchantTransactionId}`
//             return res.redirect(url)
//         } else {
//             const url = `${process.env.FRONTEND_URL}/payment-status?status=failure&retryToken=${token}`
//             return res.redirect(url)
//         }
//     } catch (error) {
//         return res.redirect(`${process.env.FRONTEND_URL}/payment-status?error=InternalServerError`);
//     }


// }