const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Order = require("../models/Order");
const User = require("../models/User");
const Products = require("../models/Products.js");
const ContactedUser = require("../models/ContactedUser");
const MainBanners = require("../models/MainBanners");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const ExcelJS = require("exceljs");

const { sendEmail } = require("../utility/emailService");

// app.use(cookieParser());

const {
  generateInvoice,
} = require("../utility/invoiceTemplates/generateInvoice");
const { s3Client } = require("../config/awsConfig.js");
const ReturnItem = require("../models/ReturnItem.js");
const { address, updateStock } = require("../utility/helper.js");
const { processImage } = require("../utility/processImage.js");
const {
  generateInvoiceNumber,
} = require("../utility/invoiceTemplates/generateInvoiceNumber.js");
// const path = require('path');

// Helper function to get count and handle potential errors
const getCount = async (model) => {
  try {
    const count = await model.countDocuments({});
    return count;
  } catch (error) {
    throw new Error(
      `Error fetching count from ${model.modelName}: ${error.message}`
    );
  }
};

// Helper function to upload file to S3
// const uploadToS3 = async (file, productName) => {
//     const sanitizedProductName = productName.replace(/\s+/g, '-');

//     const params = {
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: `Organic-Nation-Images/${sanitizedProductName}/${file.originalname}`,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//         ACL: 'public-read'
//     };

//     // return s3.upload(params).promise();
//     await s3Client.send(new PutObjectCommand(params));
//     return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/Organic-Nation-Images/${sanitizedProductName}/${file.originalname}`;
// };

// Helper to delete file from S3
// const deleteFromS3 = async (imageUrls) => {

//     imageUrls.forEach(async (imageUrl) => {
//         // Extract the key from the URL
//         const key = imageUrl.split('.com/')[1];

//         // Define the parameters for the delete operation
//         const params = {
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: key
//         };

//         // Create the DeleteObjectCommand
//         const deleteCommand = new DeleteObjectCommand(params);

//         // Send the delete command using the S3 client
//         try {
//             await s3Client.send(deleteCommand);
//         } catch (error) {
//             throw error; // Rethrow the error if needed
//         }
//     })

// };

const deleteFromS3 = async (imageUrls) => {
  // Use Object.entries() to loop over the key-value pairs of imageUrls
  for (const [size, imageUrl] of Object.entries(imageUrls)) {
    if (size === "_id") {
      // Skip the '_id' key if it's not an image URL
      continue;
    }

    try {
      // Extract the key from the URL (after the domain name)
      const s3Key = imageUrl.split(".com/")[1]; // Get the key part after '.com/'

      // Define the parameters for the delete operation
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME, // Make sure this is set in your environment variables
        Key: s3Key, // The key to delete
      };

      // Create the DeleteObjectCommand
      const deleteCommand = new DeleteObjectCommand(params);

      // Send the delete command using the S3 client
      await s3Client.send(deleteCommand);
    } catch (error) {
      // Optionally rethrow or handle the error
      throw error; // Rethrow or handle the error as needed
    }
  }
};

// Helper function to upload file to S3
// async function uploadFileToS3(file) {
//     const fileName = `Organic-Nation-Images/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${file.originalname}`;

//     const uploadParams = {
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: fileName,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//         ACL: 'public-read',
//     };

//     await s3Client.send(new PutObjectCommand(uploadParams));
//     return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
// }

// Creating a new admin
// const createAdmin = async (username, password, secretKey) => {
//   try {
//     const admin = new Admin({
//       username,
//       passwordHash: password, // Will be hashed automatically
//       secretKey
//     });
//     await admin.save();
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
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if the user exists and credentials are correct
  // if (username !== adminUser.username || secretKey !== adminUser.secretKey) {
  //     return res.status(401).json({ message: 'Invalid credentials' });
  // }

  const isValid = await verifyAdmin(username, password, secretKey);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Verify password
  // const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash);
  // if (!isPasswordValid) {
  //     return res.status(401).json({ message: 'Invalid credentials' });
  // }

  // Generate a JWT token
  const token = jwt.sign(
    { username: username, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  // Set httpOnly cookie with the JWT token
  // res.cookie('adminToken', token, {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'development',
  //     sameSite: 'strict',
  //     maxAge: 3600000 // 1 hour
  // });

  res.json({ message: "Login successful", token, success: true });
};

// admin data
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findOne(
      { username: req.user.username },
      { passwordHash: 0, secretKey: 0 }
    );
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json(admin);
  } catch (error) {
    // console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: "Error fetching admin profile" });
  }
};

// get the number of documents from the db
exports.getResourceCounts = async (req, res) => {
  try {
    const [orderCount, productCount, returnCount, queryCount, userCount] =
      await Promise.all([
        getCount(Order),
        getCount(Products),
        getCount(ReturnItem),
        getCount(ContactedUser),
        getCount(User),
      ]);

    // Send response with the counts
    res.status(200).json({
      success: true,
      resourcesCount: {
        orderCount,
        productCount,
        returnCount,
        queryCount,
        userCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics.",
      error: error.message,
    });
  }
};

exports.getResources = async (req, res) => {
  try {
    const { type } = req.query;

    if (!["products", "orders", "returns", "users", "queries"].includes(type)) {
      return res.status(400).json({ error: "Invalid resource type" });
    }

    switch (type) {
      case "products":
        const products = await Products.find().lean();
        if (products.length === 0) {
          res
            .status(400)
            .json({ message: "No products found in the database" });
        }
        return res.status(200).json({ type, list: products });
      case "orders":
        const orders = await Order.find().lean();
        if (orders.length === 0) {
          res
            .status(400)
            .json({ message: "No products found in the database" });
        }
        return res.status(200).json({ type, list: orders });
      case "users":
        const users = await User.find().lean();
        if (users.length === 0) {
          res
            .status(400)
            .json({ message: "No products found in the database" });
        }
        return res.status(200).json({ type, list: users });
      case "queries":
        const queries = await ContactedUser.find().lean();
        if (queries.length === 0) {
          res
            .status(400)
            .json({ message: "No products found in the database" });
        }
        return res.status(200).json({ type, list: queries });
      case "returns":
        const returns = await ReturnItem.find().lean();
        if (returns.length === 0) {
          res
            .status(400)
            .json({ message: "No products found in the database" });
        }
        return res.status(200).json({ type, list: returns });

      default:
        return res.status(400).json({ error: "Invalid resource type" });
    }
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
};

// get all orders
// exports.getTotalOrders = async (req, res) => {
//     try {
//         const orders = await Order.find();

//         if (!orders) {
//             return res.status(404).json({ message: 'No orders found' });
//         }

//         res.json(orders);
//     } catch (err) {
//         res.status(500).send('Server error');
//     }

// };
// get all users
// exports.getAllUsers = async (req, res) => {
//     try {
//         const users = await User.find().select('-password');

//         if (!users) {
//             return res.status(404).json({ message: 'No orders found' });
//         }

//         res.json(users);
//     } catch (err) {
//         // console.error('Error fetching users:', err.message);
//         res.status(500).send('Server error');
//     }

// };
// get all user queries
// exports.getAllUserQueries = async (req, res) => {
//     try {
//         const queries = await ContactedUser.find();

//         if (!queries) {
//             return res.status(404).json({ message: 'No orders found' });
//         }

//         res.json(queries);
//     } catch (err) {
//         // console.error('Error fetching queries:', err.message);
//         res.status(500).send('Server error');
//     }

// };

// generate invoice

exports.generateInvoice = async (req, res) => {
  // res.header('Access-Control-Allow-Origin', '*');
  // res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  const { orderId } = req.body; // Assuming the order object is sent in the request body

  // Find the order by its _id
  const order = await Order.findById(orderId);

  // const user = await User.find({ email: order.userEmail })

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const billingAddress = address(order.shippingAddress);
  const shippingAddress = address(order.shippingAddress);
  // Prepare the order data for the invoice

  const invoiceData = {
    orderNo: order.orderNo,
    createdAt: order.createdAt,
    receiverName: order.userName,
    receiverPhone: "Contact Number: " + order.phoneNumber,
    receiverEmail: "Email: " + order.userEmail,
    billingAddress,
    shippingAddress,
    orderDetails: order.orderDetails.map((item, index) => {
      // Calculate unit price excluding tax
      const unitPriceExclTax = item.unitPrice / (1 + item.tax / 100);
      // Determine tax type and tax rate based on location
      const isUP =
        order.shippingAddress?.state.toLowerCase() === "uttar pradesh";
      const taxType = isUP ? ["CGST", "SGST"] : ["IGST"];
      const taxRate = isUP ? item.tax / 2 : item.tax;

      // Calculate tax amounts
      const taxAmount = unitPriceExclTax * (item.tax / 100);
      const taxAmountSplit = isUP ? taxAmount / 2 : taxAmount;

      return {
        serialNo: index + 1,
        description:
          item["name-url"].replace(/-/g, " ").toUpperCase() + " " + item.weight,
        hsnCode: "HSN Code:" + " " + item.hsnCode,
        name: item["name-url"],
        weight: item.weight,
        unitPrice: unitPriceExclTax,
        quantity: item.quantity,
        netAmount: unitPriceExclTax * item.quantity,
        taxRate: isUP ? `${taxRate}% + ${taxRate}%` : `${taxRate}%`, // Show split rates if UP
        taxType: isUP ? taxType.join(" & ") : taxType[0], // Combine CGST and SGST if UP
        CGST: isUP ? taxAmountSplit * item.quantity : 0, // Show CGST amount if UP
        SGST: isUP ? taxAmountSplit * item.quantity : 0, // Show SGST amount if UP
        IGST: !isUP ? taxAmount * item.quantity : 0, // Show IGST amount if not in UP
        totalAmount:
          unitPriceExclTax * item.quantity +
          (isUP
            ? taxAmountSplit * item.quantity * 2
            : taxAmount * item.quantity), // Total amount including tax
      };
    }),
    mrpTotal: order.orderDetails.reduce((total, item) => {
      let mrpTotal;
      mrpTotal = total + item.unitPrice * item.quantity;

      return mrpTotal;
    }, 0),
    get totalDiscount() {
      // Calculate total discount using mrpTotal and subTotal
      const mrpTotal = this.mrpTotal + (order.CODCharge || 0);
      const discount = mrpTotal - this.subTotal;
      return discount;
    },
    // get discountRate() {
    //     // Determine discount rate based on payment method and coupon code
    //     if(order.isPickleCouponApplied){
    //         return ''
    //     }else{
    //         if (order.paymentMethod === 'cash_on_delivery') {
    //             return order.isCouponCodeApplied ? '45%' : '20%';
    //         } else if (order.paymentMethod === 'online_payment') {
    //             return order.isCouponCodeApplied ? '45% + 5%' : '20% + 5%'; // 20% + 5% for non-coupon and 45% + 5% for coupon
    //         }
    //     }

    //     return '0%'; // Default value if payment method is not recognized
    // },
    // discountRate:order.paymentMethod==='cash_on_delivery' ? '':'+5%',
    subTotal: order.subTotal,
    taxAmount: order.taxAmount,
    shippingFee: order.shippingFee,
    total: order.subTotal + order.shippingFee, // Total is now subtotal + shipping fee only
    transactionID:
      order.paymentStatus === "pending" ? "N/A" : order.merchantTransactionId,
    paymentMethod: order.paymentMethod.replace(/_/g, " ").toUpperCase(),
    invoiceNumber: order.invoiceNumber,
  };

  if (order.CODCharge) {
    invoiceData.CODCharge = order.CODCharge;
  }
  // const invoicePath = path.join(__dirname, 'invoices', `${order.orderNo}.pdf`);

  try {
    await generateInvoice(invoiceData, res);
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Error generating invoice");
  }
};

// update order status

// exports.updateOrderStatus = async (req, res) => {
//     const { orderId, status, deliveryDate } = req.body;

//     if (!orderId || !status) {
//         return res.status(400).json({ error: 'Order ID and status are required' });
//     }

//     try {
//         const updatedOrder = await Order.findByIdAndUpdate(
//             orderId,
//             {
//                 orderStatus: status,
//                 deliveryDate: deliveryDate || null
//             },
//             { new: true, runValidators: false }
//         );

//         if (!updatedOrder) {
//             return res.status(404).json({ error: 'Order not found' });
//         }

//         if (updatedOrder.orderStatus === 'dispatched') {

//             await sendEmail(
//                 updatedOrder.userEmail,
//                 "Order Dispatched",
//                 "orderDispatched",
//                 {
//                     customerName: updatedOrder.receiverDetails.name,
//                     orderNumber: updatedOrder.orderNo,

//                     // Add more template variables as needed
//                 }
//             );

//         } else if (updatedOrder.orderStatus === 'completed') {

//             await sendEmail(
//                 updatedOrder.userEmail,
//                 "Order Delivered",
//                 "orderDelivered",
//                 {
//                     customerName: updatedOrder.receiverDetails.name,
//                     orderNumber: updatedOrder.orderNo,
//                     OrderAmount: updatedOrder.subTotal + updatedOrder.shippingFee,
//                     PaymentMethod: updatedOrder.paymentMethod,

//                     // Add more template variables as needed
//                 }
//             );
//         }

//         res.json({ updatedOrder, message: 'Order status updated successfully' });
//     } catch (error) {

//         res.status(500).json({ error: 'Internal server error' });

//     }

// }

// update payment status
// exports.updatePaymentStatus = async (req, res) => {
//     const { orderId, status } = req.body;

//     if (!orderId || !status) {
//         return res.status(400).json({ error: 'Order ID and Payment status are required' });
//     }

//     try {
//         const updatedOrder = await Order.findByIdAndUpdate(
//             orderId,
//             { paymentStatus: status },
//             { new: true, runValidators: true }
//         );

//         if (!updatedOrder) {
//             return res.status(404).json({ error: 'Order not found' });
//         }

//         res.json({ updatedOrder, message: 'Payment status updated successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });

//     }

// }

exports.updateStatus = async (req, res) => {
  const { id, collection, field, status, additionalData = {} } = req.body;

  if (!id || !field || !status || !collection) {
    return res
      .status(400)
      .json({ error: "ID, field, and status are required" });
  }

  let Model;
  switch (collection) {
    case "Orders":
      Model = Order;
      break;
    case "Payment":
      Model = Order;
      break;
    case "Users":
      Model = User;
      break;
    case "Products":
      Model = Products;
      break;
    case "Queries":
      Model = ContactedUser;
      break;
    case "Returns":
      Model = ReturnItem;
      break;
    default:
      return res.status(400).json({ message: "Invalid collection name" });
  }

  try {
    const updatedDocument = await Model.findByIdAndUpdate(
      id,
      {
        [field]: status, // Dynamically update the specified field (e.g., 'orderStatus', 'paymentStatus')
        ...additionalData, // Any additional data (like deliveryDate, etc.)
      },
      { new: true, runValidators: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (collection === "Orders") {
      if (updatedDocument.orderStatus === "dispatched") {
        await sendEmail(
          updatedDocument.userEmail,
          "Order Dispatched",
          "orderDispatched",
          {
            customerName: updatedDocument.userName,
            orderNumber: updatedDocument.orderNo,

            // Add more template variables as needed
          }
        );
      } else if (updatedDocument.orderStatus === "completed") {
        await sendEmail(
          updatedDocument.userEmail,
          "Order Delivered",
          "orderDelivered",
          {
            customerName: updatedDocument.userName,
            orderNumber: updatedDocument.orderNo,
            OrderAmount: updatedDocument.subTotal + updatedDocument.shippingFee,
            PaymentMethod: updatedDocument.paymentMethod,

            // Add more template variables as needed
          }
        );
      }
    }
    res.status(200).json({
      data: updatedDocument,
      collection,
      message: "Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
// update user status
// exports.updateUserStatus = async (req, res) => {
//     const { userId } = req.params
//     const { status } = req.body;
//     if (!userId && !status) {
//         return res.status(400).json({ error: 'user ID and status are required' });
//     };

//     try {
//         const updatedUser = await User.findByIdAndUpdate(
//             userId,
//             {
//                 role: status,
//             },
//             { new: true, runValidators: false }
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ error: 'User not found' });
//         };

//         res.status(200).json({ updatedUser, message: 'Status Updated successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }

// }

// add a new product in the database
exports.addNewProductInDatabase = async (req, res) => {
  try {
    const {
      name,
      weight,
      grossWeight,
      price,
      discount,
      tax,
      hsnCode,
      category,
      description,
      availability,
      ...metaFields
    } = req.body;

    let imageUrls;
    // Upload new images if any
    if (req.files?.length > 0) {
      const sizes = [
        { width: 320, prefix: "sm" },
        { width: 640, prefix: "md" },
        { width: 960, prefix: "lg" },
      ];
      const bucket = process.env.AWS_BUCKET_NAME;
      const newFolder = name.replace(/\s+/g, "-");
      const key = `products/${newFolder}`;
      try {
        // const uploadPromises = req.files.map(file =>
        //     uploadToS3(file, name)
        // );
        imageUrls = await Promise.all(
          req.files.map((file) => {
            return processImage(sizes, bucket, key, file);
          })
        );
        // imageUrls = await Promise.all(uploadPromises);
      } catch (uploadError) {
        await session.abortTransaction();
        throw new Error("Image upload failed: " + uploadError.message);
      }
    } else {
      return res.status(401).json({
        success: false,
        message: "At lease one image is required",
      });
    }

    const newProduct = new Products({
      product_id: Math.random(),
      name,
      "name-url": name.replace(/\s+/g, "-").toLowerCase(),
      weight,
      grossWeight,
      price: parseInt(price),
      discount: parseInt(discount),
      tax: parseInt(tax),
      "hsn-code": parseInt(hsnCode),
      category,
      "category-url": category.replace(/\s+/g, "-"),
      description,
      availability: parseInt(availability),
      img: imageUrls,
      meta: {
        buy: parseInt(metaFields.buy) || 0,
        get: parseInt(metaFields.get) || 0,
        season_special: metaFields.season_special === "true",
        new_arrivals: metaFields.new_arrivals === "true",
        best_seller: metaFields.best_seller === "true",
        deal_of_the_day: metaFields.deal_of_the_day === "true",
      },
    });
    await newProduct.save();
    res
      .status(201)
      .json({ success: true, message: "Product Added Successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// delete functinality for all the model's documents
exports.deleteDocument = async (req, res) => {
  const { collection, id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }

  let Model;
  switch (collection) {
    case "Orders":
      Model = Order;
      break;
    case "Users":
      Model = User;
      break;
    case "Products":
      Model = Products;
      break;
    case "Queries":
      Model = ContactedUser;
      break;
    case "Returns":
      Model = ReturnItem;
      break;
    case "Banners":
      Model = MainBanners;
      break;
    default:
      return res.status(400).json({ message: "Invalid collection name" });
  }

  try {
    const result = await Model.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.status(200).json({
      data: result,
      collection,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// generate sale report (old)

// exports.generateSalesReport = async (req, res) => {
//     try {
//         const { startDate, endDate } = req.body;

//         // Validate date inputs
//         const start = new Date(startDate);
//         const end = new Date(endDate);

//         if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//             return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD format.' });
//         }

//         // Set the time to the start and end of the day
//         start.setHours(0, 0, 0, 0);
//         end.setHours(23, 59, 59, 999);

//         // Fetch orders within the date range
//         // Fetch orders within the date range
//         const orders = await Order.find({
//             createdAt: { $gte: start, $lte: end }
//         }).populate('user');

//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Order Report');

//         // Add headers
//         worksheet.addRow([
//             'Invoice Number', 'Invoice Date', 'Order Status', 'Order Id', 'Order Date',
//             'Item Description', 'Item Returned', 'HSN', 'MRP', 'Discount %', 'Discount Amount',
//             'Price After Discount', 'Quantity', 'Sub Total', 'Shipping Charges',
//             'Invoice Amount', 'Tax Exclusive Gross', 'Total Tax Amount',
//             'Cgst Rate', 'Sgst Rate', 'Utgst Rate', 'Igst Rate',
//             'Cgst Tax', 'Sgst Tax', 'Igst Tax',
//             'Bill From City', 'Bill From State', 'Bill From Country', 'Bill From Postal Code',
//             'Ship From City', 'Ship From State', 'Ship From Country', 'Ship From Postal Code',
//             'Ship To City', 'Ship To State', 'Ship To Country', 'Ship To Postal Code',
//             'Payment Method', 'Bill To City', 'Bill To State', 'Bill To Country', 'Bill To Postalcode',
//             'Buyer Name'
//         ]);

//         for (const order of orders) {
//             const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-GB');
//             const totalOfMrp = order.orderDetails.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
//             const discountPercentage = Math.round(((totalOfMrp - order.subTotal) / totalOfMrp) * 100);

//             for (const item of order.orderDetails) {
//                 const discountAmount = Math.round(((item.unitPrice * discountPercentage) / 100) * 100) / 100;
//                 const priceAfterDiscount = Math.round((item.unitPrice - discountAmount) * 100) / 100;
//                 const subTotal = Math.round((priceAfterDiscount * item.quantity) * 100) / 100;
//                 const invoiceAmount = subTotal + order.shippingFee;
//                 const taxExclusiveGross = Math.round(((invoiceAmount * 100) / (100 + item.tax)) * 100) / 100;
//                 const totalTaxAmount = Math.round((taxExclusiveGross * (item.tax / 100)) * 100) / 100;

//                 let cgstRate = 0, sgstRate = 0, igstRate = 0;
//                 if (order.shippingAddress.state.toLowerCase() === 'uttar pradesh' || order.billingAddress.state.toLowerCase() === 'uttar pradesh') {
//                     cgstRate = sgstRate = item.tax / 2;
//                 } else {
//                     igstRate = item.tax;
//                 }

//                 const buyer = await User.findOne({ email: order.userEmail.toLowerCase() });

//                 worksheet.addRow([
//                     order.invoiceNumber, invoiceDate, order.orderStatus, order._id.toString(), invoiceDate,
//                     item['name-url'], item.returnInfo.isItemReturned ? 'Yes' : 'No', item.hsnCode, item.unitPrice, discountPercentage, discountAmount,
//                     priceAfterDiscount, item.quantity, subTotal, order.shippingFee,
//                     invoiceAmount, taxExclusiveGross, totalTaxAmount,
//                     cgstRate, sgstRate, 0, igstRate,
//                     cgstRate ? Math.round((totalTaxAmount / 2) * 100) / 100 : 0, sgstRate ? Math.round((totalTaxAmount / 2) * 100) / 100 : 0, igstRate ? Math.round(totalTaxAmount * 100) / 100 : 0,
//                     'Noida', 'UTTAR PRADESH', 'IN', '201301',
//                     'NOIDA', 'UTTAR PRADESH', 'IN', '201301',
//                     order.shippingAddress?.city || '', order.shippingAddress?.state || '', 'IN', order.shippingAddress?.pinCode || '',
//                     order.paymentMethod,
//                     order.billingAddress.city || '', order.billingAddress.state || '', 'IN', order.billingAddress?.pinCode || '',
//                     buyer ? buyer.firstName + ' ' + buyer.lastName : ''
//                 ]);
//             }
//         }

//         // Generate Excel file
//         const buffer = await workbook.xlsx.writeBuffer();

//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         res.setHeader('Content-Disposition', 'attachment; filename=OrderReport.xlsx');
//         res.send(buffer);

//     } catch (error) {
//         console.error('Error generating report:', error);
//         res.status(500).json({ message: 'Error generating report', error: error.message });
//     }
// }

// generate sale report (new)
exports.generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // Validate date inputs
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid date format. Please use YYYY-MM-DD format.",
      });
    }

    // Set the time to the start and end of the day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Fetch orders within the date range
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
    }).populate("user");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Order Report");

    // Add headers
    worksheet.addRow([
      "Invoice Number",
      "Invoice Date",
      "Order Status",
      "Order Id",
      "Order Date",
      "Item Description",
      "Item Returned",
      "HSN",
      "MRP",
      "Discount %",
      "Discount Amount",
      "Price After Discount",
      "Quantity",
      "Sub Total",
      "Shipping Charges",
      "Invoice Amount",
      "Tax Exclusive Gross",
      "Total Tax Amount",
      "Cgst Rate",
      "Sgst Rate",
      "Utgst Rate",
      "Igst Rate",
      "Cgst Tax",
      "Sgst Tax",
      "Igst Tax",
      "Bill From City",
      "Bill From State",
      "Bill From Country",
      "Bill From Postal Code",
      "Ship From City",
      "Ship From State",
      "Ship From Country",
      "Ship From Postal Code",
      "Ship To City",
      "Ship To State",
      "Ship To Country",
      "Ship To Postal Code",
      "Payment Method",
      "Bill To City",
      "Bill To State",
      "Bill To Country",
      "Bill To Postalcode",
      "Buyer Name",
    ]);

    for (const order of orders) {
      const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-GB");
      const totalOfMrp = order.orderDetails.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );
      const discountPercentage = Math.round(
        ((totalOfMrp - order.subTotal) / totalOfMrp) * 100
      );
      const buyer = await User.findOne({
        email: order.userEmail.toLowerCase(),
      });

      // Process each item in the order
      order.orderDetails.forEach((item, index) => {
        const discountAmount =
          Math.round(((item.unitPrice * discountPercentage) / 100) * 100) / 100;
        const priceAfterDiscount =
          Math.round((item.unitPrice - discountAmount) * 100) / 100;
        const subTotal =
          Math.round(priceAfterDiscount * item.quantity * 100) / 100;

        // Only include shipping fee in the invoice amount for the first item
        const shippingFee = index === 0 ? order.shippingFee : 0;
        const invoiceAmount = subTotal + shippingFee;

        const taxExclusiveGross =
          Math.round(((invoiceAmount * 100) / (100 + item.tax)) * 100) / 100;
        const totalTaxAmount =
          Math.round(taxExclusiveGross * (item.tax / 100) * 100) / 100;

        let cgstRate = 0,
          sgstRate = 0,
          igstRate = 0;
        if (
          order.shippingAddress.state.toLowerCase() === "uttar pradesh" ||
          order.shippingAddress.state.toLowerCase() === "uttar pradesh"
        ) {
          cgstRate = sgstRate = item.tax / 2;
        } else {
          igstRate = item.tax;
        }

        worksheet.addRow([
          order.invoiceNumber,
          invoiceDate,
          order.orderStatus,
          order._id.toString(),
          invoiceDate,
          item["name-url"],
          item.returnInfo.isItemReturned ? "Yes" : "No",
          item.hsnCode,
          item.unitPrice,
          discountPercentage,
          discountAmount,
          priceAfterDiscount,
          item.quantity,
          subTotal,
          shippingFee, // Only show shipping fee for first item
          invoiceAmount,
          taxExclusiveGross,
          totalTaxAmount,
          cgstRate,
          sgstRate,
          0,
          igstRate,
          cgstRate ? Math.round((totalTaxAmount / 2) * 100) / 100 : 0,
          sgstRate ? Math.round((totalTaxAmount / 2) * 100) / 100 : 0,
          igstRate ? Math.round(totalTaxAmount * 100) / 100 : 0,
          "Noida",
          "UTTAR PRADESH",
          "IN",
          "201301",
          "NOIDA",
          "UTTAR PRADESH",
          "IN",
          "201301",
          order.shippingAddress?.city || "",
          order.shippingAddress?.state || "",
          "IN",
          order.shippingAddress?.pinCode || "",
          order.paymentMethod,
          order.shippingAddress.city || "",
          order.shippingAddress.state || "",
          "IN",
          order.shippingAddress?.pinCode || "",
          buyer ? buyer.fullName : "",
        ]);
      });
    }

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=OrderReport.xlsx"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating report:", error);
    res
      .status(500)
      .json({ message: "Error generating report", error: error.message });
  }
};

// export all users details

exports.generateUsersReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // Validate date inputs
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid date format. Please use YYYY-MM-DD format.",
      });
    }

    // Set the time to the start and end of the day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const users = await User.find({
      createdAt: { $gte: start, $lte: end },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("User Report");

    // Add headers
    worksheet.addRow(["Date", "Name", "Email", "Phone Number"]);

    for (const user of users) {
      const date = new Date(user.createdAt).toLocaleDateString("en-GB");
      worksheet.addRow([date, user.fullName, user.email, user.phoneNumber]);
    }

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=UserReport.xlsx"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating report:", error);
    res
      .status(500)
      .json({ message: "Error generating report", error: error.message });
  }
};

// get all returns
// exports.getTotalReturns = async (req, res) => {
//     try {
//         const returns = await ReturnItem.find();

//         if (!returns) {
//             return res.status(404).json({ message: 'No returns found' });
//         }

//         res.json(returns);
//     } catch (err) {
//         res.status(500).send('Server error');
//     }

// };

// update return status

// exports.updateReturnStatus = async (req, res) => {
//     const { returnId, status } = req.body;

//     if (!returnId || !status) {
//         return res.status(400).json({ error: 'Return ID and status are required' });
//     }

//     try {
//         const updatedReturnItem = await ReturnItem.findByIdAndUpdate(
//             returnId,
//             { returnStatus: status },
//             { new: true, runValidators: true }
//         );

//         if (!updatedReturnItem) {
//             return res.status(404).json({ error: 'Return not found' });
//         }

//         res.json({ data: updatedReturnItem, message: 'Return status updated successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });

//     }

// }

// edit or modify the existing product data
// exports.updateProductData = async (req, res) => {
//     // Start mongoose session for transaction
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const productId = req.params.id;
//         const updateData = req.body;

//         // Validate productId
//         if (!mongoose.Types.ObjectId.isValid(productId)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid product ID format'
//             });
//         }

//         // Find the existing product
//         const existingProduct = await Products.findById(productId).session(session);
//         if (!existingProduct) {
//             await session.abortTransaction();
//             return res.status(404).json({
//                 success: false,
//                 message: 'Product not found'
//             });
//         }

//         let newImageUrls = [];
//         // Handle image uploads if there are any new images
//         if (req.files?.length > 0) {
//             try {
//                 const uploadPromises = req.files.map(file => uploadToS3(file, updateData.name || existingProduct.name));
//                 const uploadResults = await Promise.all(uploadPromises);
//                 newImageUrls = uploadResults;
//             } catch (uploadError) {
//                 await session.abortTransaction();
//                 throw new Error('Image upload failed: ' + uploadError.message);
//             }
//         }

//         // Prepare the update object with type checking and validation
//         const productUpdate = {
//             name: updateData.name?.trim(),
//             'name-url': updateData.name?.trim().replace(/\s+/g, '-'),
//             weight: updateData.weight?.trim(),
//             price: parseFloat(updateData.price) || existingProduct.price,
//             discount: parseFloat(updateData.discount) || existingProduct.discount,
//             tax: parseFloat(updateData.tax) || existingProduct.tax,
//             'hsn-code': updateData.hsnCode?.trim(),
//             category: updateData.category?.trim(),
//             'category-url': updateData.category?.trim().replace(/\s+/g, '-'),
//             description: updateData.description?.trim(),
//             availability: updateData.availability || existingProduct.availability,
//             // img: [...(updateData.deleteImages ? [] : existingProduct.img), ...newImageUrls],
//             img: [...existingProduct.img, ...newImageUrls],
//             meta: {
//                 buy: parseInt(updateData.buy) || 0,
//                 get: parseInt(updateData.get) || 0,
//                 season_special: updateData.season_special === 'true' || updateData.season_special === true,
//                 new_arrivals: updateData.new_arrivals === 'true' || updateData.new_arrivals === true,
//                 best_seller: updateData.best_seller === 'true' || updateData.best_seller === true,
//                 deal_of_the_day: updateData.deal_of_the_day === 'true' || updateData.deal_of_the_day === true
//             }
//         };

//         // If deleteImages is true, delete old images from S3
//         //   if (updateData.deleteImages === 'true' && existingProduct.img.length > 0) {
//         //     try {
//         //       const deletePromises = existingProduct.img.map(imageUrl => deleteFromS3(imageUrl));
//         //       await Promise.all(deletePromises);
//         //     } catch (deleteError) {
//         //       await session.abortTransaction();
//         //       throw new Error('Failed to delete old images: ' + deleteError.message);
//         //     }
//         //   }

//         // Update the product with optimistic concurrency control
//         const updatedProduct = await Products.findOneAndUpdate(
//             {
//                 _id: productId,
//                 updatedAt: existingProduct.updatedAt // Ensure no concurrent updates
//             },
//             productUpdate,
//             {
//                 new: true,
//                 runValidators: true,
//                 session
//             }
//         );

//         if (!updatedProduct) {
//             await session.abortTransaction();
//             return res.status(409).json({
//                 success: false,
//                 message: 'Product was updated by another request. Please refresh and try again.'
//             });
//         }

//         // Commit the transaction
//         await session.commitTransaction();

//         res.json({
//             success: true,
//             message: 'Product updated successfully',
//             product: updatedProduct
//         });

//     } catch (error) {
//         await session.abortTransaction();

//         console.error('Error updating product:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating product',
//             error: error.message
//         });
//     } finally {
//         session.endSession();
//     }
// }

// route for updating product data
exports.updateProductData = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const productId = req.params.id;
    const updateData = req.body;
    const existingImages = JSON.parse(updateData.existingImages || "[]");
    const removedImages = JSON.parse(updateData.removedImages || "[]");

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    // Find the existing product
    const existingProduct = await Products.findById(productId).session(session);
    if (!existingProduct) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Handle image management
    let finalImageUrls = [...existingImages]; // Start with existing images that weren't removed

    // Delete removed images from S3
    if (removedImages.length > 0) {
      try {
        const deletePromises = removedImages.map((imageUrls) =>
          deleteFromS3(imageUrls)
        );
        await Promise.all(deletePromises);
      } catch (deleteError) {
        await session.abortTransaction();
        throw new Error("Failed to delete old images: " + deleteError.message);
      }
    }

    // Upload new images if any
    if (req.files?.length > 0) {
      const sizes = [
        { width: 320, prefix: "sm" },
        { width: 640, prefix: "md" },
        { width: 1020, prefix: "lg" },
      ];
      const bucket = process.env.AWS_BUCKET_NAME;
      const newFolder = existingProduct.name.replace(/\s+/g, "-");
      const key = `products/${newFolder}`;
      try {
        // const uploadPromises = req.files.map(file =>
        //     uploadToS3(file, updateData.name || existingProduct.name)
        // );
        const newImageUrls = await Promise.all(
          req.files.map((file) => {
            return processImage(sizes, bucket, key, file);
          })
        );
        finalImageUrls = [...finalImageUrls, ...newImageUrls];
      } catch (uploadError) {
        await session.abortTransaction();
        throw new Error("Image upload failed: " + uploadError.message);
      }
    }

    // Prepare the update object, only including fields that are provided
    const productUpdate = {};

    // Helper function to set field if it exists in updateData
    const setIfExists = (field, value, transform = (x) => x) => {
      if (value !== undefined && value !== null && value !== "") {
        productUpdate[field] = transform(value);
      }
    };

    // Basic fields
    setIfExists("name", updateData.name?.trim());
    if (productUpdate.name) {
      // handle the name-url in case of the pickles
      if (productUpdate.name.toLowerCase().includes("pickle")) {
        let nameUrl = productUpdate.name
          .match(/\(([^)]+)\)/)[1]
          .replace(/\s+/g, "-");
        productUpdate["name-url"] = nameUrl.toLowerCase();
      } else {
        // it the product is other than pickle, update the name-url
        productUpdate["name-url"] = productUpdate.name
          .replace(/\s+/g, "-")
          .toLowerCase();
      }
    }

    setIfExists("weight", updateData.weight?.trim());
    setIfExists("grossWeight", updateData.grossWeight?.trim());
    setIfExists("price", updateData.price, parseFloat);
    setIfExists("discount", updateData.discount, parseFloat);
    setIfExists("tax", updateData.tax, parseFloat);
    setIfExists("hsn-code", updateData.hsnCode?.trim());
    setIfExists("category", updateData.category?.trim());
    if (productUpdate.category) {
      productUpdate["category-url"] = productUpdate.category.replace(
        /\s+/g,
        "-"
      );
    }

    setIfExists("description", updateData.description?.trim());
    setIfExists("availability", updateData.availability, parseInt);
    setIfExists("isActive", updateData.isActive);

    // Always update images array if there are any changes
    if (finalImageUrls.length > 0 || removedImages.length > 0) {
      productUpdate.img = finalImageUrls;
    }

    // Meta fields - only update if any meta field is provided
    const metaFields = [
      "buy",
      "get",
      "season_special",
      "new_arrivals",
      "best_seller",
      "deal_of_the_day",
    ];
    const hasMetaUpdates = metaFields.some(
      (field) => updateData[field] !== undefined
    );

    if (hasMetaUpdates) {
      productUpdate.meta = {
        ...existingProduct.meta, // Keep existing meta values
        buy:
          updateData.buy !== undefined
            ? parseInt(updateData.buy) || 0
            : existingProduct.meta.buy,
        get:
          updateData.get !== undefined
            ? parseInt(updateData.get) || 0
            : existingProduct.meta.get,
        season_special:
          updateData.season_special !== undefined
            ? updateData.season_special === "true" ||
              updateData.season_special === true
            : existingProduct.meta.season_special,
        new_arrivals:
          updateData.new_arrivals !== undefined
            ? updateData.new_arrivals === "true" ||
              updateData.new_arrivals === true
            : existingProduct.meta.new_arrivals,
        best_seller:
          updateData.best_seller !== undefined
            ? updateData.best_seller === "true" ||
              updateData.best_seller === true
            : existingProduct.meta.best_seller,
        deal_of_the_day:
          updateData.deal_of_the_day !== undefined
            ? updateData.deal_of_the_day === "true" ||
              updateData.deal_of_the_day === true
            : existingProduct.meta.deal_of_the_day,
      };
    }

    // If no fields to update, return success without making database call
    if (Object.keys(productUpdate).length === 0) {
      await session.commitTransaction();
      return res.json({
        success: true,
        message: "No fields to update",
        product: existingProduct,
      });
    }

    // Update the product with optimistic concurrency control
    const updatedProduct = await Products.findOneAndUpdate(
      {
        _id: productId,
        updatedAt: existingProduct.updatedAt,
      },
      productUpdate,
      {
        new: true,
        runValidators: true,
        session,
      }
    );

    if (!updatedProduct) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message:
          "Product was updated by another request. Please refresh and try again.",
      });
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Product updated successfully",
      // product: updatedProduct
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// update invoice number
exports.updateInvoiceNumber = async (req, res) => {
  const { orderId } = req.params; // Get the order ID from the URL params
  const { invoiceNumber } = req.body; // Get the new invoice number from the request body

  if (!invoiceNumber) {
    return res.status(400).json({ error: "Invoice number is required" });
  }
  try {
    // Step 1: Check if the invoice number already exists (except for the current order)
    const existingInvoice = await Order.findOne({
      invoiceNumber,
      _id: { $ne: orderId },
    });
    if (existingInvoice) {
      return res.status(400).json({ error: "Invoice number already exists" });
    }

    // Step 2: Find the order by ID and update the invoice number
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { invoiceNumber },
      { new: true, runValidators: true } // Return updated document and validate
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Invoice number updated successfully",
      // updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while updating the invoice number",
      details: error.message,
    });
  }
};

// API for optimizing website images (internal usage)

// for product images ---

// exports.handleOptimizinImages = async (req, res) => {
//     try {
//         if (!req.files || req.files.length === 0) {
//             return res.status(400).json({ error: 'No files uploaded' });
//         }
//         const productId = req.body.productId || Date.now().toString(); // Fallback if no productId provided

//         const processedImages = await Promise.all(
//             req.files.map(file => {
//                 return processImage(file, productId);
//             })
//         );

//         const updatedProduct = await Products.findOneAndUpdate(
//             { ['name-url']: productId }, // Query criteria
//             { img: processedImages }, // Fields to update
//             { new: true } // Return the updated document
//         );

//         if (!updatedProduct) {
//             throw new Error("Product not found");
//         }

//         // Return the processed image paths
//         res.json({
//             success: true,
//             imagePaths: processedImages
//         });

//     } catch (error) {
//         console.error('Upload error:', error);
//         res.status(500).json({
//             error: 'Failed to process images',
//             details: error.message
//         });
//     }
// }

// for banners

// exports.handleOptimizingBannerImages = async (req, res) => {
//     try {
//         if (!req.files || req.files.length === 0) {
//             return res.status(400).json({ error: 'No files uploaded' });
//         }
//         const bannerId = req.body.productId || Date.now().toString(); // Fallback if no productId provided
//         const processedImages = await Promise.all(
//             req.files.map(file => {
//                 return processImage(file, bannerId);
//             })
//         );

//         const finalProcessed=processedImages[0]

//         const updatedProduct = await MainBanners.findOneAndUpdate(
//             { _id: bannerId }, // Query criteria
//             { image: finalProcessed }, // Fields to update
//             { new: true } // Return the updated document
//         );

//         if (!updatedProduct) {
//             throw new Error("Product not found");
//         }

//         // Return the processed image paths
//         res.json({
//             success: true,
//             imagePaths: finalProcessed
//         });

//     } catch (error) {
//         console.error('Upload error:', error);
//         res.status(500).json({
//             error: 'Failed to process images',
//             details: error.message
//         });
//     }
// }

// API for optimizing website images (internal usage) ended--

// APi for sending bulk emails

// exports.sendBulkEmail = async (req, res) => {
//     try {
//         const data = req.body;
//         const { subject, emailBody } = data;

//         const emails = ['iammdaarish@gmail.com', 'aarish.foodsbay@gmail.com', 'foodsbayindiafbi@gmail.com'];

//         const results = {
//             successful: [],
//             failed: [],
//             total: emails.length
//         };

//         // Sequential sending with individual error handling
//         for (let email of emails) {
//             try {
//                 console.log('Sending email to:', email);

//                 const result = await sendEmail(
//                     email,
//                     subject,
//                     "bulkEmail",
//                     {
//                         emailBody
//                     }
//                 );

//                 console.log('resultwa', result)

//                 // results.successful.push(email);
//                 console.log(`✓ Email sent successfully to: ${email}`);

//                 // Add delay between emails to avoid rate limiting
//                 await new Promise(resolve => setTimeout(resolve, 100)); // 1 second delay

//             } catch (emailError) {
//                 console.error(`✗ Failed to send email to ${email}:`, emailError.message);
//                 results.failed.push({
//                     email: email,
//                     error: emailError.message
//                 });
//             }
//         }

//         console.log('Bulk email sending completed:', results);

//         res.status(200).json({ message: 'Email Sent Successfully' })

//     } catch (error) {
//         console.log('error email sending', error)
//         res.status(500).json({
//             error: 'An error occurred while ssending the email',
//             details: error.message,
//         });
//     }

// }

exports.handleCustomOrderCreation = async (req, res) => {
  try {
    const data = req.body;
    const {
      email,
      name,
      phoneNumber,
      address,
      pinCode,
      city,
      state,
      products,
      shippingFee,
      CODCharge,
      paymentMethod,
      paymentStatus,
    } = data;
    let user;

    // 1. check and register the user
    if (phoneNumber) {
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser) {
        user = existingUser;
      } else {
        const newuser = new User({
          fullName: name,
          phoneNumber,
          email, // Assuming email is optional or handled elsewhere
          addresses: [
            {
              addressType: "Home",
              address,
              pinCode,
              city,
              state,
            },
          ],
        });
        user = await newuser.save();
      }
    }

    // 2. define the variables
    let orderDetails = [];
    let subTotal = 0;
    let taxAmount = 0;
    // 3. generate the invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // 4. calculation of sub total, order details, tax amount
    for (let product of products) {
      const fullProduct = await Products.findOne({ name: product.productName });
      if (fullProduct) {
        const totalBeforeDiscount = fullProduct.price * product.quantity;
        const totalDiscount = (totalBeforeDiscount * product.discount) / 100;
        // const discount = (fullProduct.price * product.discount) / 100;
        const actualAmountPaid = totalBeforeDiscount - totalDiscount;
        const tax =
          (actualAmountPaid * fullProduct.tax) / (100 + fullProduct.tax);
        subTotal += actualAmountPaid;
        taxAmount += tax;
        const productWithInfo = {
          id: fullProduct._id,
          "name-url": fullProduct["name-url"],
          quantity: product.quantity,
          weight: fullProduct.weight,
          tax: fullProduct.tax,
          hsnCode: fullProduct["hsn-code"],
          unitPrice: fullProduct.price,
          returnInfo: {
            isItemReturned: false,
            returnedQuantity: 0,
          },
          actualAmountPaid,
        };

        orderDetails.push(productWithInfo);
      }
    }

    // 5. creation of a new order
    const newOrder = new Order({
      user: user._id,
      orderNo: "ON" + Date.now(),
      userEmail: user.email,
      userName: user.fullName,
      phoneNumber: user.phoneNumber,
      shippingAddress: {
        address,
        pinCode,
        city,
        state,
      },
      orderDetails,
      subTotal: Math.round(subTotal + shippingFee + CODCharge),
      taxAmount: Math.round(taxAmount),
      shippingFee,
      CODCharge,
      paymentMethod,
      paymentStatus: paymentStatus.toUpperCase(),
      merchantTransactionId: "",
      couponCodeApplied: [],
      orderStatus: "active",
      invoiceNumber,
    });

    const savedOrder = await newOrder.save();

    // 6. updating the stock
    savedOrder?.orderDetails.map(async (product) => {
      const productName = product["name-url"];
      const quantity = product.quantity;
      await updateStock(productName, quantity, "add");
    });

    // 7. sending the response
    res
      .status(200)
      .json({ success: true, message: "Order Created Successfully" });
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while creating  the order",
      details: error.message,
    });
  }
};

exports.sendBulkEmail = async (req, res) => {
  try {
    const data = req.body;
    const { subject, emailBody } = data;

    const emails = [
      "iammdaarish@gmail.com",
      "aarish.foodsbay@gmail.com",
      "foodsbayindiafbi@gmail.com",
      "bolayo4428@hiepth.com",
      "",
    ];

    const results = {
      successful: [],
      failed: [],
      total: emails.length,
    };

    // console.log(`Starting bulk email send to ${emails.length} recipients`);

    // Sequential sending with individual error handling
    for (let email of emails) {
      try {
        // console.log('Sending email to:', email);

        const result = await sendEmail(email, subject, "bulkEmail", {
          emailBody,
        });

        // console.log('Email result for', email, ':', result);

        // FIXED: Actually push to successful array
        results.successful.push({
          email: email,
          messageId: result.MessageId || result.messageId || "N/A",
        });

        // console.log(`✓ Email sent successfully to: ${email}`);

        // Add delay between emails to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000)); // FIXED: Changed to 1 second
      } catch (emailError) {
        // console.log('emailError', emailError)
        // console.error(`✗ Failed to send email to ${email}:`, emailError.message);
        results.failed.push({
          email: email,
          error: emailError.message,
        });

        // FIXED: Don't break the loop, continue to next email
        continue;
      }
    }

    // console.log('Bulk email sending completed:', results);

    // FIXED: Return detailed results instead of generic message
    res.status(200).json({
      success: true,
      message: "Bulk email process completed",
      results: {
        totalEmails: results.total,
        successfulSends: results.successful.length,
        failedSends: results.failed.length,
        successRate: `${(
          (results.successful.length / results.total) *
          100
        ).toFixed(2)}%`,
        successful: results.successful,
        failed: results.failed,
      },
    });
  } catch (error) {
    // console.log('Error in bulk email sending:', error);
    res.status(500).json({
      success: false,
      error: "An error occurred while sending the bulk emails",
      details: error.message,
    });
  }
};


// foodsbay B2B queries form handling
exports.handleb2bformSubmission=async(req,res)=>{
  try {
const data=req.body;
  const result=  await sendEmail(
            "info@foodsbay.com",
            "Foodsbay Query",
            "foodsbayQuery",
            {
              name:data.name.toUpperCase(),
              company:data.company|| 'NA',
              phoneNumber:data.phone,
              email:data.email || 'NA',
              businessType:data.business || 'NA',
              products:data.products || 'NA',
              message:data.message,
              // Add more template variables as needed
            },
          );
          res.status(200).json({success:true})
  } catch (error) {
    throw error
  }
}