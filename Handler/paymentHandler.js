const crypto = require("crypto");
const axios = require("axios");

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
        const { name, number, amount } = req.body;
        if (!name || !number || !amount) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const merchantTransactionId = generateTransactionID()

        const data = {
            merchantId: process.env.PHONEPE_MERCHANT_ID,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: "MUID" + Date.now(),
            name: name,
            amount: amount * 100, // multiply by 100 since it counts money in 'paise' instead of rupee
            redirectUrl: `http://localhost:8000/api/phonepe/status/?id=${merchantTransactionId}`,
            redirectMode: "POST",
            callbackUrl: `http://localhost:8000/api/phonepe/status/?id=${merchantTransactionId}`,
            mobileNumber: number,
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        }

        const payload = JSON.stringify(data);
        const payloadMain = Buffer.from(payload).toString('base64');
        const keyIndex = 1;
        const string = payloadMain + '/pg/v1/pay' + process.env.PHONEPE_SALT_KEY;
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
            return res.json(response.data);
        } catch (error) {
            console.error('errrr', error);
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


exports.checkPaymentStatus = async (req, res) => {
    const merchantTransactionId = req.query.id
    const merchantId = process.env.PHONEPE_MERCHANT_ID
    const salt_key = process.env.PHONEPE_SALT_KEY

    const keyIndex = 1;
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + "###" + keyIndex;


    const options = {
        method: 'GET',
        url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/api/phonepe/status/${merchantId}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': `${merchantId}`
        }
    };


    // CHECK PAYMENT STATUS
    axios.request(options).then(async (response) => {
        if (response.data.success) {
            const url = `http://localhost:5173/success`
            return res.redirect(url)
        } else {
            const url = `http://localhost:5173/failure`
            return res.redirect(url)
        }
    })
        .catch((error) => {
            console.error(error);
        });
}