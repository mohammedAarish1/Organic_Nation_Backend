const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Order = require('../models/Order');
const User = require('../models/User');
const Products = require('../models/Products.js')
const PinCode = require('../models/PinCode.js');
const ContactedUser = require('../models/ContactedUser');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const ExcelJS = require('exceljs');

const crypto = require('crypto');
const { sendEmail } = require("../utility/emailService");


// app.use(cookieParser());

const { generateInvoice } = require('../utility/invoiceTemplates/generateInvoice');
const { s3Client } = require('../config/awsConfig.js');
const ReturnItem = require('../models/ReturnItem.js');
// const path = require('path');



// Helper function to upload file to S3
async function uploadFileToS3(file) {
    const fileName = `Organic-Nation-Images/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${file.originalname}`;

    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}

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
        { expiresIn: '8h' }
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

    // res.header('Access-Control-Allow-Origin', '*');
    // res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    const { orderId } = req.body; // Assuming the order object is sent in the request body

    // Find the order by its _id
    const order = await Order.findById(orderId);

    // const user = await User.find({ email: order.userEmail })

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
        mrpTotal: order.orderDetails.reduce((total, item) => {
            let mrpTotal;
            mrpTotal = total + (item.unitPrice * item.quantity)

            return mrpTotal;

        }, 0),
        get totalDiscount() {
            // Calculate total discount using mrpTotal and subTotal
            const mrpTotal = this.mrpTotal;
            const discount = mrpTotal - this.subTotal;
            return discount;
        },
        get discountRate() {
            // Determine discount rate based on payment method and coupon code
            if(order.isPickleCouponApplied){
                return ''
            }else{
                if (order.paymentMethod === 'cash_on_delivery') {
                    return order.isCouponCodeApplied ? '45%' : '20%';
                } else if (order.paymentMethod === 'online_payment') {
                    return order.isCouponCodeApplied ? '45% + 5%' : '20% + 5%'; // 20% + 5% for non-coupon and 45% + 5% for coupon
                }
            }
           
            return '0%'; // Default value if payment method is not recognized
        },
        // discountRate:order.paymentMethod==='cash_on_delivery' ? '':'+5%',
        subTotal: order.subTotal,
        taxAmount: order.taxAmount,
        shippingFee: order.shippingFee,
        total: order.subTotal + order.shippingFee, // Total is now subtotal + shipping fee only
        transactionID: order.paymentStatus === 'pending' ? 'N/A' : order.merchantTransactionId,
        paymentMethod: order.paymentMethod.replace(/_/g, ' ').toUpperCase(),
        invoiceNumber: order.invoiceNumber

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
    const { orderId, status } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({ error: 'Order ID and status are required' });
    }

    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { orderStatus: status },
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

            await sendEmail(
                updatedOrder.userEmail,
                "Order Delivered",
                "orderDelivered",
                {
                    customerName: updatedOrder.receiverDetails.name,
                    orderNumber: updatedOrder.orderNo,
                    OrderAmount: updatedOrder.subTotal + updatedOrder.shippingFee,
                    PaymentMethod: updatedOrder.paymentMethod,


                    // Add more template variables as needed
                }
            );
        }


        res.json({ message: 'Order status updated successfully' });
    } catch (error) {


        res.status(500).json({ error: 'Internal server error' });


    }

}


// update payment status 
exports.updatePaymentStatus = async (req, res) => {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({ error: 'Order ID and Payment status are required' });
    }


    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { paymentStatus: status },
            { new: true, runValidators: true }
        );


        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        } 

        res.json({ message: 'Payment status updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });


    }

}



// add a new product in the database

exports.addNewProductInDatabase = async (req, res) => {
    try {
        const { name, weight, price, discount, tax, hsnCode, category, description, availability, ...metaFields } = req.body;
        const imageUrls = await Promise.all(req.files?.map(uploadFileToS3));


        if (imageUrls.length === 0) {
            return res.status(400).json({ error: 'No image uploaded' })
        }

        const newProduct = new Products({
            product_id: 0,
            name,
            'name-url': name.replace(/\s+/g, '-'),
            weight,
            price: parseInt(price),
            discount: parseInt(discount),
            tax: parseInt(tax),
            'hsn-code': parseInt(hsnCode),
            category,
            'category-url': category.replace(/\s+/g, '-'),
            description,
            availability: parseInt(availability),
            img: imageUrls,
            meta: {
                buy: parseInt(metaFields.buy) || 0,
                get: parseInt(metaFields.get) || 0,
                season_special: metaFields.season_special === 'true',
                new_arrivals: metaFields.new_arrivals === 'true',
                best_seller: metaFields.best_seller === 'true',
                deal_of_the_day: metaFields.deal_of_the_day === 'true'
            }
        });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// delete functinality for all the model's documents
exports.deleteDocument = async (req, res) => {
    const { collection, id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
    }

    let Model;
    switch (collection) {
        case 'orders':
            Model = Order;
            break;
        case 'users':
            Model = User;
            break;
        case 'products':
            Model = Products;
            break;
        case 'queries':
            Model = ContactedUser;
            break;
        default:
            return res.status(400).json({ message: 'Invalid collection name' });
    }

    try {
        const result = await Model.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



// generate sale report 
exports.generateSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;


        // Validate date inputs
        const start = new Date(startDate);
        const end = new Date(endDate);


        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD format.' });
        }


        // Set the time to the start and end of the day
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        // Fetch orders within the date range
        // Fetch orders within the date range
        const orders = await Order.find({
            createdAt: { $gte: start, $lte: end }
        }).populate('user');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Order Report');

        // Add headers
        worksheet.addRow([
            'Invoice Number', 'Invoice Date', 'Order Status', 'Order Id', 'Order Date',
            'Item Description', 'HSN', 'MRP', 'Discount %', 'Discount Amount',
            'Price After Discount', 'Quantity', 'Sub Total', 'Shipping Charges',
            'Invoice Amount', 'Tax Exclusive Gross', 'Total Tax Amount',
            'Cgst Rate', 'Sgst Rate', 'Utgst Rate', 'Igst Rate',
            'Cgst Tax', 'Sgst Tax', 'Igst Tax',
            'Bill From City', 'Bill From State', 'Bill From Country', 'Bill From Postal Code',
            'Ship From City', 'Ship From State', 'Ship From Country', 'Ship From Postal Code',
            'Ship To City', 'Ship To State', 'Ship To Country', 'Ship To Postal Code',
            'Payment Method', 'Bill To City', 'Bill To State', 'Bill To Country', 'Bill To Postalcode',
            'Buyer Name'
        ]);

        for (const order of orders) {
            const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-GB');
            const totalOfMrp = order.orderDetails.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
            const discountPercentage = Math.round(((totalOfMrp - order.subTotal) / totalOfMrp) * 100);

            for (const item of order.orderDetails) {
                const discountAmount = Math.round(((item.unitPrice * discountPercentage) / 100) * 100) / 100;
                const priceAfterDiscount = Math.round((item.unitPrice - discountAmount) * 100) / 100;
                const subTotal = Math.round((priceAfterDiscount * item.quantity) * 100) / 100;
                const invoiceAmount = subTotal + order.shippingFee;
                const taxExclusiveGross = Math.round(((invoiceAmount * 100) / (100 + item.tax)) * 100) / 100;
                const totalTaxAmount = Math.round((taxExclusiveGross * (item.tax / 100)) * 100) / 100;

                let cgstRate = 0, sgstRate = 0, igstRate = 0;
                if (order.shippingAddress.includes('Uttar Pradesh') || order.billingAddress.includes('Uttar Pradesh')) {
                    cgstRate = sgstRate = item.tax / 2;
                } else {
                    igstRate = item.tax;
                }

                const shippingAddPincode = order.shippingAddress.match(/\d{6}/)[0];
                const shippingAddPincodeDetails = await PinCode.findOne({ pinCode: shippingAddPincode });

                const billingAddPincode = order.billingAddress.match(/\d{6}/)[0];
                const billingAddPincodeDetails = await PinCode.findOne({ pinCode: billingAddPincode });

                const buyer = await User.findOne({ email: order.userEmail });

                worksheet.addRow([
                    order.orderNo, invoiceDate, order.orderStatus, order._id.toString(), invoiceDate,
                    item['name-url'], item.hsnCode, item.unitPrice, discountPercentage, discountAmount,
                    priceAfterDiscount, item.quantity, subTotal, order.shippingFee,
                    invoiceAmount, taxExclusiveGross, totalTaxAmount,
                    cgstRate, sgstRate, 0, igstRate,
                    cgstRate ? Math.round((totalTaxAmount / 2) * 100) / 100 : 0, sgstRate ? Math.round((totalTaxAmount / 2) * 100) / 100 : 0, igstRate ? Math.round(totalTaxAmount * 100) / 100 : 0,
                    'Noida', 'UTTAR PRADESH', 'IN', '201301',
                    'NOIDA', 'UTTAR PRADESH', 'IN', '201301',
                    shippingAddPincodeDetails ? shippingAddPincodeDetails.city : '', shippingAddPincodeDetails ? shippingAddPincodeDetails.state : '', 'IN', shippingAddPincode,
                    order.paymentMethod,
                    billingAddPincodeDetails ? billingAddPincodeDetails.city : '', billingAddPincodeDetails ? billingAddPincodeDetails.state : '', 'IN', billingAddPincode,
                    buyer ? buyer.firstName + ' ' + buyer.lastName : ''
                ]);
            }
        }

        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=OrderReport.xlsx');
        res.send(buffer);

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Error generating report', error: error.message });
    }
}



// get all returns
exports.getTotalReturns = async (req, res) => {
    try {
        const returns = await ReturnItem.find();

        if (!returns) {
            return res.status(404).json({ message: 'No returns found' });
        }

        res.json(returns);
    } catch (err) {
        res.status(500).send('Server error');
    }

};


// update return status

exports.updateReturnStatus = async (req, res) => {
    const { returnId, status } = req.body;

    if (!returnId || !status) {
        return res.status(400).json({ error: 'Return ID and status are required' });
    }

    try {
        const updatedReturnItem = await ReturnItem.findByIdAndUpdate(
            returnId,
            { returnStatus: status },
            { new: true, runValidators: true }
        );


        if (!updatedReturnItem) {
            return res.status(404).json({ error: 'Return not found' });
        }


        // if (updatedOrder.orderStatus === 'dispatched') {

        //     await sendEmail(
        //         updatedOrder.userEmail,
        //         "Order Dispatched",
        //         "orderDispatched",
        //         {
        //             customerName: updatedOrder.receiverDetails.name,
        //             orderNumber: updatedOrder.orderNo,

        //             // Add more template variables as needed
        //         }
        //     );

        // } else if (updatedOrder.orderStatus === 'completed') {

        //     await sendEmail(
        //         updatedOrder.userEmail,
        //         "Order Delivered",
        //         "orderDelivered",
        //         {
        //             customerName: updatedOrder.receiverDetails.name,
        //             orderNumber: updatedOrder.orderNo,
        //             OrderAmount: updatedOrder.subTotal + updatedOrder.shippingFee,
        //             PaymentMethod: updatedOrder.paymentMethod,


        //             // Add more template variables as needed
        //         }
        //     );
        // }


        res.json({ message: 'Return status updated successfully' });
    } catch (error) {


        res.status(500).json({ error: 'Internal server error' });


    }

}