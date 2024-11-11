const Order = require("../models/Order");
const ReturnItem = require("../models/ReturnItem");
const PinCode = require('../models/PinCode.js');
const User = require("../models/User");
const Products = require("../models/Products.js");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../config/awsConfig.js");
const {
  generateInvoiceNumber,
} = require("../utility/invoiceTemplates/generateInvoiceNumber.js");
const { sendEmail } = require("../utility/emailService");
const { address, updateStock, sendOrderConfirmationMsg } = require("../utility/helper.js");

// const requireAuth = passport.authenticate('jwt', { session: false });

// @route   POST /api/orders
// @desc    Create a new order
exports.createOrder = async (req, res) => {
  const {
    // orderNo,
    firstName,
    lastName,
    userEmail,
    phoneNumber,
    addressType,
    billingAddress,
    shippingAddress,
    orderDetails,
    subTotal,
    taxAmount,
    shippingFee,
    paymentMethod,
    paymentStatus,
    receiverDetails,
    merchantTransactionId,
    couponCodeApplied,
    // orderStatus, // New field
  } = req.body;

  try {

    const user = await User.findOne({ phoneNumber: phoneNumber });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Update user information if necessary
    let updated = false;
    if (firstName !== user.firstName) {
      user.firstName = firstName;
      updated = true;
    }
    if (lastName !== user.lastName) {
      user.lastName = lastName;
      updated = true;
    }
    if (userEmail !== user.email) {
      user.email = userEmail;
      updated = true;
    }

    // Save the user if any information was updated
    if (updated) {
      await user.save();
    }

    // ======================== handling the user addresses ==================

    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }

    // Create a new address object
    const newShippingAddress = {
      addressType,
      mainAddress: shippingAddress.address || '',
      optionalAddress: shippingAddress.optionalAddress || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      pinCode: shippingAddress.pinCode || '',
      country: shippingAddress.country || 'India',
      isDefault: false, // Adjust as needed
    };


    // Find the index of the existing address with the same addressType
    const addressIndex = user.addresses.findIndex(
      addr => addr.addressType === newShippingAddress.addressType
    );

    if (addressIndex === -1) {
      // If address doesn't exist, add it as a new address
      user.addresses.push(newShippingAddress);
    } else {
      // Update the existing address
      user.addresses[addressIndex] = {
        ...user.addresses[addressIndex],
        ...newShippingAddress
      };
    }

    await user.save();

    // === handling the user addresses ending ==================

    // Generate the unique invoice number
    const invoiceNumber = await generateInvoiceNumber();


    // =========== calculating the acutal amount paid for each item ================

    // Calculate item subtotals and grand total
    const itemTotals = orderDetails.map((item) => {
      const unitPrice = item.unitPrice;
      const quantity = item.quantity;
      return {
        ...item,
        itemSubTotal: unitPrice * quantity,
      };
    });

    const grandTotal = itemTotals.reduce(
      (acc, item) => acc + item.itemSubTotal,
      0
    );

    // Calculate total discount and discount percentage
    const totalDiscount = grandTotal - subTotal;
    const discountPercentage = (totalDiscount / grandTotal) * 100;

    // Calculate actual amount paid for each item
    const orderDetailsWithAcutalAmtPaid = itemTotals.map((item) => {
      const individualItemDiscount =
        (item.unitPrice * discountPercentage) / 100;
      const actualAmountPaid =
        item.unitPrice - individualItemDiscount;
      return {
        ...item,
        actualAmountPaid: Math.round(actualAmountPaid),
      };
    });

    // =========== calculating the acutal amount paid for each item end ========



    const newOrder = new Order({
      user: user._id,
      orderNo: "ON" + Date.now(),
      userEmail,
      phoneNumber,
      shippingAddress: address(shippingAddress),
      billingAddress: address(billingAddress),
      orderDetails: orderDetailsWithAcutalAmtPaid,
      subTotal,
      taxAmount,
      shippingFee,
      paymentMethod,
      paymentStatus,
      receiverDetails,
      merchantTransactionId,
      couponCodeApplied,
      orderStatus: "active", // Set default value if not provided
      invoiceNumber,
    });

    const savedOrder = await newOrder.save();

    if (savedOrder.paymentMethod === "cash_on_delivery") {
      const orderNumber = savedOrder.orderNo;
      const customerName = firstName || '';
      const totalAmount = savedOrder.subTotal + savedOrder.shippingFee;

      savedOrder?.orderDetails.map(async (product) => {
        const productName = product['name-url'];
        const quantity = product.quantity;
        await updateStock(productName, quantity, 'add');
      })

      // send order confirmation message
      const result = await sendOrderConfirmationMsg(customerName, totalAmount, savedOrder.phoneNumber)
      //  Send order confirmation email
      await sendEmail(
        savedOrder.userEmail,
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
          orderNumber: savedOrder.orderNo,
          customerName: firstName || '',
          phoneNumber: savedOrder.phoneNumber ||'',
          email: savedOrder.userEmail,
          shippingAddress: savedOrder.shippingAddress,
          billingAddress: savedOrder.billingAddress,
          // below line will convert the orderDetails array into plain strings
          // orderDetails: savedOrder.orderDetails.map(item => `${item[0]},${item[3]},${item[2]}`).join(','),
          orderDetails: savedOrder.orderDetails.map((item, index) => `(${index + 1}) Product: ${item['name-url']}, ID: ${item.id}, Quantity: ${item.quantity}, Weight: ${item.weight}, Unit Price: ₹${item.unitPrice.toFixed(2)}, Tax: ₹${item.tax}`).join(', '),
          subTotal: savedOrder.subTotal,
          shippingFee: savedOrder.shippingFee,
          totalAmount: savedOrder.subTotal + savedOrder.shippingFee,
          paymentMethod: savedOrder.paymentMethod,
          paymentStatus: savedOrder.paymentStatus,
          // Add more template variables as needed
        }
      );
    }

    res
      .status(200)
      .json({ message: "Order placed successfully", orderId: savedOrder._id });
    // res.json(savedOrder);
  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(500).send("Server error");
  }
};

// @route   DELETE /api/orders/:orderId
// @desc    Cancel order by ID
exports.cancelOrder = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Update order status to "cancelled"
    order.orderStatus = "cancelled";
    await order.save();

    order?.orderDetails.map(async (product) => {
      const productName = product['name-url'];
      const quantity = product.quantity;

      await updateStock(productName, quantity, 'cancel');
    })

    res.json({ msg: "Order cancelled successfully" });
  } catch (err) {
    // console.error('Error cancelling order:', err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET /api/orders/user/:userEmail
// @desc    Get all orders by user email
// router.get('/user/:userEmail', async (req, res) => {
//   const userEmail = req.params.userEmail;

//   try {
//     const orders = await Order.find({ userEmail });
//     if (!orders.length) {
//       return res.status(404).json({ msg: 'No orders found for this user' });
//     }
//     res.json(orders);
//   } catch (err) {
//     console.error('Error retrieving orders:', err.message);
//     res.status(500).send('Server error');
//   }
// });

// @route   GET /api/orders/all
// @desc    Get all orders by token
exports.getAllOrders = async (req, res) => {
  // const userEmail = req.params.userEmail;
  const userId = req.user.id;

  try {
    const orders = await Order.find({ user: userId });
    if (!orders.length) {
      return res.status(404).json({ msg: "No orders found for this user" });
    }
    res.json(orders);
  } catch (err) {
    console.error("Error retrieving orders:", err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET /api/orders/:orderId
// @desc    Get single orders by order id

exports.getOrderById = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    // console.error('Error retrieving order:', err.message);

    // Check if the error is due to an invalid ObjectId
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid order ID format" });
    }

    res.status(500).send("Server error");
  }
};

// route for handling item return
exports.handleReturnItems = async (req, res) => {
  try {
    const {
      itemName,
      weight,
      // price,
      quantity,
      reason,
      returnOptions,
      accountName,
      bankName,
      accountNumber,
      ifscCode,
      invoiceNumber,
    } = req.body;
    // const images = req.files;
    const images = req.files.images || [];
    const video = req.files.video ? req.files.video[0] : null;
    const userId = req.user.id;

    // Find the order using invoiceNumber
    const order = await Order.findOne({ invoiceNumber });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the specific item in orderDetails
    const itemIndex = order.orderDetails.findIndex(
      (item) => item["name-url"] === itemName
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    // Get the ordered quantity for this item
    const orderedQuantity = order.orderDetails[itemIndex].quantity;

    // Check if returnInfo exists, if not create it
    if (!order.orderDetails[itemIndex].returnInfo) {
      order.orderDetails[itemIndex].returnInfo = {
        isItemReturned: true,
        returnedQuantity: Number(quantity),
      };
    } else {
      // Calculate new total returned quantity
      const currentReturnedQuantity =
        order.orderDetails[itemIndex].returnInfo.returnedQuantity;
      const newReturnedQuantity = currentReturnedQuantity + Number(quantity);

      // Validate if the new total return quantity exceeds the ordered quantity
      if (newReturnedQuantity > orderedQuantity) {
        return res.status(400).json({
          message: `Cannot return more items than ordered. Ordered: ${orderedQuantity}, Already returned: ${currentReturnedQuantity}, Attempting to return: ${Number(
            quantity
          )}`,
        });
      }

      // Update returnInfo
      order.orderDetails[itemIndex].returnInfo.returnedQuantity =
        newReturnedQuantity;
      order.orderDetails[itemIndex].returnInfo.isItemReturned = true;
    }

    // Create a new folder for this return using timestamp
    const folderName = `returns/${invoiceNumber.replace(
      /\//g,
      "-"
    )}-${Date.now()}/`;

    // Upload images to S3 and get their paths
    const imagePaths = await Promise.all(
      images.map(async (image, index) => {
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME_RETURN_ITEMS,
          Key: `${folderName}${index + 1}.jpg`,
          Body: image.buffer,
          ContentType: image.mimetype,
          ACL: "public-read",
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        return `https://${process.env.AWS_BUCKET_NAME_RETURN_ITEMS}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
      })
    );

    // Upload video to S3 if it exists
    let videoPath = null;
    if (video) {
      const videoParams = {
        Bucket: process.env.AWS_BUCKET_NAME_RETURN_ITEMS,
        Key: `${folderName}video/return-video.mp4`,
        Body: video.buffer,
        ContentType: video.mimetype,
        ACL: "public-read",
      };

      const videoCommand = new PutObjectCommand(videoParams);
      await s3Client.send(videoCommand);

      videoPath = `https://${process.env.AWS_BUCKET_NAME_RETURN_ITEMS}.s3.${process.env.AWS_REGION}.amazonaws.com/${videoParams.Key}`;
    }

    // Create a new return item
    const returnItem = new ReturnItem({
      user: userId,
      invoiceNumber,
      itemName,
      weight,
      // price,
      quantity,
      reason,
      returnStatus: "requested",
      returnOptions,
      images: imagePaths,
      video: videoPath, // Add video path to the return item
      bankDetails: {
        accountName,
        bankName,
        accountNumber,
        ifscCode,
      },
    });

    await updateStock(itemName, quantity, 'return');


    await sendEmail(
      req.user.email,
      "Item Return Request Confirmation",
      "returnRequestConfirmation",
      {
        customerName: order.receiverDetails?.name || "",
        orderNumber: invoiceNumber,
        itemName: itemName.replace(/-/g, " "),
        quantity: quantity,
        returnAddress: order.shippingAddress
          ? order.shippingAddress
          : order.billingAddress,
        // Add more template variables as needed
      }
    );

    await Promise.all([returnItem.save(), order.save()]);

    res.status(201).json({ message: "Return item created successfully" });
  } catch (error) {
    console.error("Error creating return item:", error);
    res
      .status(500)
      .json({ message: "Error creating return item", error: error.message });
  }
};

// @route   GET all return items for a single user
exports.getAllReturnItmes = async (req, res) => {
  const userId = req.user.id;

  try {
    const returnItems = await ReturnItem.find({ user: userId });

    if (!returnItems.length) {
      return res
        .status(404)
        .json({ msg: "No return items found for this user" });
    }
    res.status(200).json(returnItems);
  } catch (err) {
    // console.error('Error retrieving return items:', err.message);
    res.status(500).send("Server error");
  }
};

exports.cancelReturnRequest = async (req, res) => {
  try {
    const { returnId } = req.params;
    const userId = req.user.id; // Assuming you're using authentication middleware

    // Find the return document
    const returnDocument = await ReturnItem.findById(returnId);

    if (!returnDocument) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    // Verify that this return belongs to the requesting user
    if (returnDocument.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: This return request belongs to another user",
      });
    }

    // Check if the return can be cancelled (e.g., not already processed)
    if (returnDocument.returnStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel return request with status: ${returnDocument.returnStatus}`,
      });
    }

    // Find the original order
    const order = await Order.findOne({
      invoiceNumber: returnDocument.invoiceNumber,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Original order not found",
      });
    }

    // Find the specific item in the order
    const itemIndex = order.orderDetails.findIndex(
      (item) => item["name-url"] === returnDocument.itemName
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in original order",
      });
    }

    // Update the returnInfo for the item
    const currentReturnInfo = order.orderDetails[itemIndex].returnInfo;
    const newReturnedQuantity =
      currentReturnInfo.returnedQuantity - returnDocument.quantity;

    // Update returnInfo object
    order.orderDetails[itemIndex].returnInfo = {
      isItemReturned: newReturnedQuantity > 0, // Only false if no items are returned
      returnedQuantity: Math.max(0, newReturnedQuantity), // Ensure we don't go below 0
    };

    // Function to extract S3 key from URL
    const getS3KeyFromUrl = (url) => {
      const urlParts = url.split("/");
      return urlParts.slice(3).join("/"); // Gets everything after the bucket name
    };

    // Function to delete object from S3
    const deleteS3Object = async (key) => {
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME_RETURN_ITEMS,
        Key: key,
      };

      try {
        const command = new DeleteObjectCommand(deleteParams);
        await s3Client.send(command);
      } catch (error) {
        console.error(`Error deleting object from S3 (Key: ${key}):`, error);
        // Continue with the cancellation even if deletion fails
      }
    };

    // Delete images from S3
    if (returnDocument.images && returnDocument.images.length > 0) {
      await Promise.all(
        returnDocument.images.map(async (imageUrl) => {
          const key = getS3KeyFromUrl(imageUrl);
          await deleteS3Object(key);
        })
      );
    }

    // Delete video from S3
    if (returnDocument.video) {
      const videoKey = getS3KeyFromUrl(returnDocument.video);
      await deleteS3Object(videoKey);
    }

    // Save the updated order and delete the return document
    await Promise.all([order.save(), ReturnItem.findByIdAndDelete(returnId)]);

    //     // Save the updated order
    //     await order.save();

    //  // Inside your cancelReturnRequest function, after finding the return document:
    // if (returnDocument.images && returnDocument.images.length > 0) {
    //   await Promise.all(
    //     returnDocument.images.map(async (imageUrl) => {
    //       // Extract the Key from the URL
    //       // The URL format is: https://bucket-name.s3.region.amazonaws.com/folder/filename
    //       const urlParts = imageUrl.split('/');
    //       const key = urlParts.slice(3).join('/'); // Gets everything after the bucket name

    //       const deleteParams = {
    //         Bucket: process.env.AWS_BUCKET_NAME_RETURN_ITEMS,
    //         Key: key
    //       };

    //       try {
    //         const command = new DeleteObjectCommand(deleteParams);
    //         await s3Client.send(command);
    //       } catch (error) {
    //         console.error('Error deleting image from S3:', error);
    //         // Continue with the cancellation even if image deletion fails
    //       }
    //     })
    //   );
    // }

    //    // Delete the return document
    //    await ReturnItem.findByIdAndDelete(returnId);


    await updateStock(returnDocument.itemName, returnDocument.quantity, 'add');


    res.status(200).json({
      success: true,
      message: "Return request cancelled successfully",
      // updatedOrder: order
    });
  } catch (error) {
    console.error("Error cancelling return request:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling return request",
      error: error.message,
    });
  }
};



// api endopoint for recent purchases
exports.getRecentPurchases = async (req, res) => {
  try {
    // Fetch last 10 completed orders
    const orders = await Order.aggregate([
      { $match: { orderStatus: "completed" } },
      { $sort: { createdAt: -1 } },
      { $limit: 10 }
    ]);

    // Transform orders to create separate entries for each item

    const recentOrders = [];
    for (const order of orders) {

      const userPincode = order.shippingAddress.match(/\d{6}/)[0];
      const shippingAddPincodeDetails = await PinCode.findOne({ pinCode: userPincode });

      const baseOrderInfo = {
        userName: order.receiverDetails.name,
        // state: order.billingAddress.split(' ').slice(-3, -2)[0], // Extracts state name
        state: shippingAddPincodeDetails.state, // Extracts state name
        createdAt: order.createdAt,
        orderNo: order.orderNo
      };

      // Iterate over the orderDetails array and push items into the recentOrders array
      for (const item of order.orderDetails) {
        const orderItem = {
          ...baseOrderInfo,
          itemName: item['name-url'].split('-').join(' '),
          quantity: item.quantity,
          weight: item.weight,
          itemImage: `https://organic-nation-product-images.s3.amazonaws.com/Organic-Nation-Images/${item['name-url']}/front.png` // Assuming this is your image path format
        };

        recentOrders.push(orderItem);
      }
    }


    // Sort all items by creation date and limit to most recent 20
    const sortedOrders = recentOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);


    res.status(200).json(sortedOrders);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ message: "Error fetching recent orders" });
  }
}
