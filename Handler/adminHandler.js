const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const Admin = require('../models/Admin');
const Order = require('../models/Order');
const User = require('../models/User');
const ContactedUser = require('../models/ContactedUser');
const fs = require('fs');
const { sendEmail } = require("../utility/emailService");

// app.use(cookieParser());

const { generateInvoice } = require('../utility/invoiceTemplates/generateInvoice');
const path = require('path');

// CSRF protection
// const csrfProtection = csrf({ cookie: true });



// Rate limiting
// const loginLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 5 // limit each IP to 5 requests per windowMs
// });


// Creating a new admin
// const createAdmin = async (username, password, secretKey) => {
//   try {
//     const admin = new Admin({
//       username,
//       passwordHash: password, // Will be hashed automatically
//       secretKey
//     });
//     await admin.save();
//     console.log('Admin created successfully');
//   } catch (error) {
//     console.error('Error creating admin:', error);
//   }
// };

// Verifying admin credentials


const verifyAdmin = async (username, password, secretKey) => {
    try {
        const admin = await Admin.findOne({ username, secretKey });
        if (!admin) {
            return false;
        }
        return await admin.comparePassword(password);
    } catch (error) {
        // console.error('Error verifying admin:', error);
        return false;
    }
};

// admin login 
exports.adminLogin = async (req, res) => {
    const { username, password, secretKey } = req.body;


    // Check if all required fields are provided
    if (!username || !password || !secretKey) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if the user exists and credentials are correct
    // if (username !== adminUser.username || secretKey !== adminUser.secretKey) {
    //     return res.status(401).json({ message: 'Invalid credentials' });
    // }

    const isValid = await verifyAdmin(username, password, secretKey);
    if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }


    // Verify password
    // const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash);
    // if (!isPasswordValid) {
    //     return res.status(401).json({ message: 'Invalid credentials' });
    // }

    // Generate a JWT token
    const token = jwt.sign(
        { username: username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Set httpOnly cookie with the JWT token
    // res.cookie('adminToken', token, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === 'development',
    //     sameSite: 'strict',
    //     maxAge: 3600000 // 1 hour
    // });


    // Generate CSRF token
    // csrf({ cookie: true })(req, res, () => { });

    // console.log('csrfToken', req.csrfToken())

    res.json({ message: 'Login successful', token });
}

// admin data 
exports.getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findOne({ username: req.user.username }, { passwordHash: 0, secretKey: 0 });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json(admin);
    } catch (error) {
        // console.error('Error fetching admin profile:', error);
        res.status(500).json({ message: 'Error fetching admin profile' });
    }
};


// get all orders
exports.getTotalOrders = async (req, res) => {
    try {
        const orders = await Order.find();

        if (!orders) {
            return res.status(404).json({ message: 'No orders found' });
        }

        res.json(orders);
    } catch (err) {
        res.status(500).send('Server error');
    }

};
// get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');

        if (!users) {
            return res.status(404).json({ message: 'No orders found' });
        }

        res.json(users);
    } catch (err) {
        // console.error('Error fetching users:', err.message);
        res.status(500).send('Server error');
    }

};
// get all user queries
exports.getAllUserQueries = async (req, res) => {
    try {
        const queries = await ContactedUser.find();

        if (!queries) {
            return res.status(404).json({ message: 'No orders found' });
        }

        res.json(queries);
    } catch (err) {
        // console.error('Error fetching queries:', err.message);
        res.status(500).send('Server error');
    }

};







// generate invoice
exports.generateInvoice = async (req, res) => {

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    const { orderId } = req.body; // Assuming the order object is sent in the request body
    // console.log('orderid', orderId)

    // Find the order by its _id
    const order = await Order.findById(orderId);


    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }



    // Prepare the order data for the invoice

    const invoiceData = {
        orderNo: order.orderNo,
        createdAt: order.createdAt,
        receiverName: order.receiverDetails.name,
        receiverPhone: 'Contact Number: ' + order.receiverDetails.phoneNumber,
        receiverEmail: 'Email: ' + order.userEmail,
        billingAddress: order.billingAddress,
        shippingAddress: order.shippingAddress,
        orderDetails: order.orderDetails.map((item, index) => {
            // Calculate unit price excluding tax
            const unitPriceExclTax = item.unitPrice / (1 + item.tax / 100);

            // Determine tax type and tax rate based on location
            const isUP = order.shippingAddress.includes('Uttar Pradesh') || order.billingAddress.includes('Uttar Pradesh');
            const taxType = isUP ? ['CGST', 'SGST'] : ['IGST'];
            const taxRate = isUP ? item.tax / 2 : item.tax;

            // Calculate tax amounts
            const taxAmount = unitPriceExclTax * (item.tax / 100);
            const taxAmountSplit = isUP ? taxAmount / 2 : taxAmount;

            return {
                serialNo: index + 1,
                description: item['name-url'].replace(/-/g, ' ') + " " + item.weight,
                hsnCode: 'HSN Code:' + ' ' + item.hsnCode,
                name: item['name-url'],
                weight: item.weight,
                unitPrice: unitPriceExclTax,
                quantity: item.quantity,
                netAmount: unitPriceExclTax * item.quantity,
                taxRate: isUP ? `${taxRate}% + ${taxRate}%` : `${taxRate}%`, // Show split rates if UP
                taxType: isUP ? taxType.join(' & ') : taxType[0], // Combine CGST and SGST if UP
                CGST: isUP ? taxAmountSplit * item.quantity : 0, // Show CGST amount if UP
                SGST: isUP ? taxAmountSplit * item.quantity : 0, // Show SGST amount if UP
                IGST: !isUP ? taxAmount * item.quantity : 0, // Show IGST amount if not in UP
                totalAmount: unitPriceExclTax * item.quantity + (isUP ? taxAmountSplit * item.quantity * 2 : taxAmount * item.quantity) // Total amount including tax
            };
        }),
        subTotal: order.subTotal,
        taxAmount: order.taxAmount,
        shippingFee: order.shippingFee,
        total: order.subTotal + order.shippingFee, // Total is now subtotal + shipping fee only
        transactionID: order.paymentStatus === 'pending' ? 'N/A' : order.merchantTransactionId,
        paymentMethod: order.paymentMethod.replace(/_/g, ' ').toUpperCase(),

    };



    // const invoicePath = path.join(__dirname, 'invoices', `${order.orderNo}.pdf`);

    try {
        await generateInvoice(invoiceData, res);
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Error generating invoice');
    }
};


// update order status

exports.updateOrderStatus = async (req, res) => {
    const { orderId, orderStatus } = req.body;

    if (!orderId || !orderStatus) {
        return res.status(400).json({ error: 'Order ID and status are required' });
    }

    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { orderStatus: orderStatus },
            { new: true, runValidators: true }
        );


        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }


        if (updatedOrder.orderStatus === 'dispatched') {

            await sendEmail(
                updatedOrder.userEmail,
                "Order Dispatched",
                "orderDispatched",
                {
                    customerName: updatedOrder.receiverDetails.name,
                    orderNumber: updatedOrder.orderNo,

                    // Add more template variables as needed
                }
            );

        } else if (updatedOrder.orderStatus === 'completed') {

            // await sendEmail(
            //     'sales.foodsbay@gmail.com',
            //     "Received Order",
            //     "orderRecieved",
            //     {
            //       orderNumber: savedOrder.orderNo,
            //       customerName: receiverName,
            //       phoneNumber: receiverPhoneNumber,
            //       email: savedOrder.userEmail,
            //       shippingAddress: savedOrder.shippingAddress,
            //       billingAddress: savedOrder.billingAddress,
            //       // below line will convert the orderDetails array into plain strings 
            //       // orderDetails: savedOrder.orderDetails.map(item => `${item[0]},${item[3]},${item[2]}`).join(','),
            //       orderDetails: savedOrder.orderDetails.map((item, index) => `(${index + 1}) Product: ${item['name-url']}, ID: ${item.id}, Quantity: ${item.quantity}, Weight: ${item.weight}, Unit Price: ₹${item.unitPrice.toFixed(2)}, Tax: ₹${item.tax}`).join(', '),
            //       subTotal: savedOrder.subTotal,
            //       shippingFee: savedOrder.shippingFee,
            //       totalAmount: savedOrder.subTotal + savedOrder.shippingFee,
            //       paymentMethod: savedOrder.paymentMethod,
            //       paymentStatus: savedOrder.paymentStatus,
            //       // Add more template variables as needed
            //     }
            //   );


        }


        res.json({ message: 'Order status updated successfully' });
    } catch (error) {

        console.error('Error updating order status:', error);
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });


    }

}
