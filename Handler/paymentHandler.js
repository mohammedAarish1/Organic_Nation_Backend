const crypto = require("crypto");
const axios = require("axios");




const merchantId = 'PGTESTPAYUAT86';
const salt_key = '96434309-7796-489d-8924-ab56988a6076';

// generate random Transaction Id
const generateTransactionID = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000);
    const merchantPrefix = 'T';
    const transactionID = `${merchantPrefix}${timestamp}${randomNum}`;
    return transactionID;
}

// payment route
exports.getPaymentDone = async (req, res) => {
    try {
        const { number, amount } = req.body;
        if (!number || !amount) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const merchantTransactionId = generateTransactionID()

        const data = {
            merchantId: merchantId,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: "MUID" + Date.now(),
            amount: amount * 100, // multiply by 100 since it counts money in 'paise' instead of rupee
            redirectUrl: `https://dpzi63xcomvst.cloudfront.net/api/phonepe/status/?id=${merchantTransactionId}`,
            redirectMode: "POST",
            callbackUrl: `https://dpzi63xcomvst.cloudfront.net/api/phonepe/callback/?id=${merchantTransactionId}`,
            mobileNumber: number,
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

// exports.handleCallback = async (req, res) => {
//     try {
//         // Input validation
//         // const errors = validationResult(req);
//         // if (!errors.isEmpty()) {
//         //     logger.warn('Invalid callback data received', { errors: errors.array() });
//         //     return res.status(400).json({ success: false, message: 'Invalid input' });
//         // }

//         const merchantTransactionId = req.query.id;
//         console.log('id', merchantTransactionId)
//         const paymentData = req.body;

//         // logger.info('Received callback for transaction', { merchantTransactionId, paymentData });

//         // Verify the callback authenticity
//         if (!verifyPhonePeSignature(req)) {
//             // logger.error('Invalid signature in callback', { merchantTransactionId });
//             return res.status(403).json({ success: false, message: 'Invalid signature' });
//         }

//         // Process the payment status
//         const paymentStatus = paymentData.code;
//         // await updatePaymentStatus(merchantTransactionId, paymentStatus, paymentData);

//         // if (paymentStatus === 'PAYMENT_SUCCESS') {
//         //     await processSuccessfulPayment(merchantTransactionId);
//         //     logger.info('Payment successful', { merchantTransactionId });
//         // } else if (paymentStatus === 'PAYMENT_ERROR' || paymentStatus === 'PAYMENT_DECLINED') {
//         //     await handleFailedPayment(merchantTransactionId);
//         //     logger.warn('Payment failed', { merchantTransactionId, status: paymentStatus });
//         // } else {
//         //     logger.info('Payment in pending or unknown state', { merchantTransactionId, status: paymentStatus });
//         // }

//         console.log(paymentStatus)

//         // Respond to PhonePe
//         res.status(200).json({ success: true, message: 'Callback processed successfully' });
//     } catch (error) {
//         // logger.error('Error processing callback', { error: error.message, stack: error.stack });
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };

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





exports.checkPaymentStatus = async (req, res) => {
    const merchantTransactionId = req.query.id
    // const merchantId = merchantId
    // const salt_key = salt_key

    const keyIndex = 1;
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + "###" + keyIndex;


    const options = {
        method: 'GET',
        url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': `${merchantId}`
        }
    };


    // CHECK PAYMENT STATUS


    try {
        const response = await axios.request(options);
        if (response.data.success) {
            const url = `${process.env.FRONTEND_URL}/payment-status?status=success&id=${merchantTransactionId}`
            return res.redirect(url)
        } else {
            const url = `${process.env.FRONTEND_URL}/payment-status?status=failure&id=${merchantTransactionId}`
            return res.redirect(url)
        }
    } catch (error) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment-status?error=InternalServerError`);
    }


}