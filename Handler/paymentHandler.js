const crypto = require("crypto");
const axios = require("axios");
const Order = require('../models/Order');
const Products = require('../models/Products.js')
const jwt = require('jsonwebtoken');
const { sendEmail } = require("../utility/emailService");
const { sendOrderConfirmationMsg, address, handleReferralReward } = require("../utility/helper.js");
const User = require("../models/User.js");
const Coupon = require("../models/Coupon.js");





const merchantId = process.env.PHONEPE_MERCHANT_ID;
const salt_key = process.env.PHONEPE_SALT_KEY;



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
                // console.error('Invalid retry token:', error);
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



        const data = {
            merchantId: merchantId,
            merchantTransactionId: paymentDetails.merchantTransactionId,
            merchantUserId: "MUID" + Date.now(),
            amount: paymentDetails.amount * 100, // multiply by 100 since it counts money in 'paise' instead of rupee
            redirectUrl: `https://dpzi63xcomvst.cloudfront.net/api/phonepe/status/?id=${paymentDetails.merchantTransactionId}`,
            // redirectUrl: `http://localhost:8000/api/phonepe/status/?id=${paymentDetails.merchantTransactionId}`,
            redirectMode: "POST",
            // callbackUrl: `https://dpzi63xcomvst.cloudfront.net/api/phonepe/callback/?id=${paymentDetails.merchantTransactionId}`,
            // callbackUrl: `https://dpzi63xcomvst.cloudfront.net/api/phonepe/callback`,
            callbackUrl: `https://webhook.site/405c80ff-1c3c-4301-8b57-bc70136f61d7`,
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
        // test url 
        // const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"

        // production url 
        const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";

        const options = {
            method: 'POST',
            url: prod_URL,
            headers: {
                // accept: 'application/json',  when move to production
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
//         // const merchantTransactionId = req.query.id;

//         // if (!merchantTransactionId) {
//         //     return res.status(400).json({ success: false, message: 'Transaction ID missing' });
//         // }

//         const order = await Order.findOne({ merchantTransactionId: merchantTransactionId });

//         if (!order) {
//             // console.error('Order not found for transaction ID:', merchantTransactionId);
//             return res.status(404).json({ success: false, message: 'Order not found' });
//         }

//         if (!verifyPhonePeSignature(req)) {
//             // console.error('Invalid signature in callback', { merchantTransactionId });
//             return res.status(403).json({ success: false, message: 'Invalid signature' });
//         }

//         const paymentData = req.body;
//         const paymentStatus = paymentData.code;

//         switch (paymentStatus) {
//             case 'PAYMENT_SUCCESS':
//                 order.paymentStatus = 'PAID';
//                 await order.save();
//                 break;
//             case 'PAYMENT_ERROR':
//             case 'PAYMENT_DECLINED':
//                 order.paymentStatus = 'FAILED';
//                 await order.save();
//                 // console.warn('Payment failed', { merchantTransactionId, status: paymentStatus });
//                 break;
//             default:
//                 order.paymentStatus = 'PENDING';
//                 await order.save();
//             // console.info('Payment in pending or unknown state', { merchantTransactionId, status: paymentStatus });
//         }

//         res.status(200).json({ success: true, message: 'Callback processed successfully' });
//     } catch (error) {
//         console.error('Error processing callback', { error: error.message, stack: error.stack });
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };

// function verifyPhonePeSignature(req) {
//     try {
//         const receivedSignature = req.headers['x-verify'];
//         const payload = JSON.stringify(req.body);
//         const computedSignature = crypto
//             .createHash('sha256')
//             .update(payload + salt_key)
//             .digest('hex') + '###' + 1;
//         return receivedSignature === computedSignature;
//     } catch (error) {
//         console.error('Error verifying signature', { error: error.message });
//         return false;
//     }
// }





exports.checkPaymentStatus = async (req, res) => {
    console.log('Received payment status check request:', req.query);
    const merchantTransactionId = req.query.id
    console.log('merchantTransactionId', merchantTransactionId)
    console.log('merchantId', merchantId)

    if (!merchantTransactionId) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment-status?error=TransactionIdMissing`);
    }

    const keyIndex = 1;
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + "###" + keyIndex;


    const options = {
        method: 'GET',
        url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
        // url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': `${merchantId}`
        }
    };

    console.log('Making request to payment service with URL:', options.url);
    console.log('Request headers:', options.headers);


    // CHECK PAYMENT STATUS
    try {
        // Simulate a network or service error
        // throw new Error('Simulated network error');


        // Fetch the order using the merchantTransactionId
        const order = await Order.findOne({ merchantTransactionId: merchantTransactionId });


        if (!order) {
            return res.redirect(`${process.env.FRONTEND_URL}/payment-status?error=OrderNotFound`);
        }

        // Generate JWT token with payment details
        const token = jwt.sign({
            number: order.phoneNumber,
            amount: order.subTotal + order.shippingFee,
            merchantTransactionId: order.merchantTransactionId
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const response = await axios.request(options);

        console.log('Payment API response:', response?.data);

        // Simulate a failure response
        // const response = {
        //     data: {
        //         success: false // Simulate a payment failure
        //     }
        // };


        if (response.data.success) {

            const orderNumber = order.orderNo || '';
            const customerName = order.receiverDetails?.name || '';
            const totalAmount = order.subTotal + order.shippingFee;


            order.paymentStatus = 'PAID';
            await order.save(); // Save the updated order
            const url = `${process.env.FRONTEND_URL}/payment-status?status=success&id=${merchantTransactionId}`

            // get the user
            const user = await User.findOne({ phoneNumber: order.phoneNumber });

            // give referral rewards to the referrer after successful order creation
            if (user?.referredBy) {
                try {
                    // Only process referral reward if:
                    // 1. It's the user's first order
                    const userOrderCount = await Order.countDocuments({
                        user: user._id,
                        orderStatus: { $ne: "cancelled" } // Don't count cancelled orders
                    });



                    if (userOrderCount === 1 && totalAmount >= 499) {
                        // Process referral reward
                        await handleReferralReward(user._id, order._id);
                    }
                } catch (referralError) {
                    // Log the error but don't fail the order creation
                    console.error('Error processing referral reward:', referralError);
                    // Optionally notify admin about the failed referral processing
                }
            }


            // update the referral coupon as used if user uses any referral coupon code
            if (order.couponCodeApplied?.length > 0) {
                for (let coupon of order.couponCodeApplied) {
                    const couponDetails = await Coupon.findById(coupon.id)
                    if (couponDetails.type === 'referral') {
                        const referralCoupon = user?.referralCoupons.find(
                            rc => rc.couponId.toString() === couponDetails._id.toString()
                        );

                        if (referralCoupon) {
                            referralCoupon.isUsed = true;
                            await user.save();
                        }
                    }
                }
            };


            // Update stock availability for each product in orderDetails
            const updateStockInDatabase = order.orderDetails?.map(async (detail) => {
                const productName = detail['name-url'];
                const orderedQuantity = detail.quantity;

                // Find the product and update its stock
                const product = await Products.findOne({ 'name-url': productName });
                if (!product) {
                    throw new Error(`Product with ID ${productName} not found`);
                }

                // Check if sufficient stock is available
                // if (product.availability < orderedQuantity) {
                //   throw new Error(`Insufficient stock for product ID ${productId}`);
                // }

                // Update the product stock
                product.availability -= orderedQuantity;
                await product.save();
            });

            // Await all stock updates
            await Promise.all(updateStockInDatabase);

            //send order confirmation message
            const result = await sendOrderConfirmationMsg(customerName, totalAmount, order.phoneNumber)

            //  Send order confirmation email
            await sendEmail(
                order.userEmail,
                "Order Confirmation",
                "orderConfirmation",
                {
                    orderNumber,
                    customerName,
                    totalAmount,
                    // Add more template variables as needed
                }
            );



            //  Send order receiving email to sales.foodsbay@gmail.com
            await sendEmail(
                'sales.foodsbay@gmail.com',
                "Received Order",
                "orderRecieved",
                {
                    orderNumber: order.orderNo || '',
                    customerName: order.receiverDetails?.name || '',
                    phoneNumber: order?.phoneNumber || '',
                    email: order.userEmail || '',
                    shippingAddress: address(order.shippingAddress),
                    billingAddress: address(order.billingAddress),
                    // below line will convert the orderDetails array into plain strings 
                    orderDetails: order.orderDetails.map(item => `Product: ${item['name-url']}, ID: ${item.id}, Quantity: ${item.quantity}, Weight: ${item.weight}, Unit Price: ₹${item.unitPrice.toFixed(2)}, Tax: ₹${item.tax}`).join(', '),
                    subTotal: order.subTotal,
                    shippingFee: order.shippingFee,
                    totalAmount: order.subTotal + order.shippingFee,
                    paymentMethod: order.paymentMethod,
                    paymentStatus: order.paymentStatus,
                    // Add more template variables as needed
                }
            );

            return res.redirect(url)
        } else {
            const url = `${process.env.FRONTEND_URL}/payment-status?status=failure&retryToken=${token}`
            return res.redirect(url)
        }
    } catch (error) {
        console.error('Error occurred while processing payment status:', error.message);
        console.error('Error stack trace:', error.stack);
        return res.redirect(`${process.env.FRONTEND_URL}/payment-status?error=InternalServerError`);
    }


}





