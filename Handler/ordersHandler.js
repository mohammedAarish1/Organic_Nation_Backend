const Order = require('../models/Order');
const User = require('../models/User');
const { sendEmail } = require("../utility/emailService");

// const requireAuth = passport.authenticate('jwt', { session: false });


// @route   POST /api/orders
// @desc    Create a new order
exports.createOrder = async (req, res) => {
  const {
    orderNo,
    userEmail,
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
    orderStatus // New field
  } = req.body;

  try {
    let receiverPhoneNumber = receiverDetails?.phoneNumber;
    let receiverName = receiverDetails?.name;

    if (!receiverPhoneNumber || !receiverName) {
      // If receiver's details are not provided, use user's phone number
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      receiverPhoneNumber = user.phoneNumber;
      receiverName = `${user.firstName} ${user.lastName}`;
    }
    const userId = req.user.id;
    const newOrder = new Order({
      user: userId,
      orderNo,
      userEmail,
      billingAddress,
      shippingAddress,
      orderDetails,
      subTotal,
      taxAmount,
      shippingFee,
      paymentMethod,
      paymentStatus,
      receiverDetails: {
        phoneNumber: receiverPhoneNumber,
        name: receiverName
      },
      merchantTransactionId,
      orderStatus: orderStatus || 'active' // Set default value if not provided
    });


    const savedOrder = await newOrder.save();


    if (savedOrder.paymentMethod === 'cash_on_delivery') {

      //  Send order confirmation email
      await sendEmail(
        savedOrder.userEmail,
        "Order Confirmation",
        "orderConfirmation",
        {
          orderNumber: savedOrder.orderNo,
          customerName: receiverName,
          totalAmount: savedOrder.subTotal + savedOrder.shippingFee,
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
          customerName: receiverName,
          phoneNumber: receiverPhoneNumber,
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



    res.status(200).json({ message: "Order placed successfully", orderId: savedOrder._id });
    // res.json(savedOrder);
  } catch (err) {
    // console.error('Error creating order:', err.message);
    res.status(500).send('Server error');
  }
}



// @route   DELETE /api/orders/:orderId
// @desc    Cancel order by ID
exports.cancelOrder = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Update order status to "cancelled"
    order.orderStatus = 'cancelled';
    await order.save();

    res.json({ msg: 'Order cancelled successfully' });
  } catch (err) {
    // console.error('Error cancelling order:', err.message);
    res.status(500).send('Server error');
  }
}

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
      return res.status(404).json({ msg: 'No orders found for this user' });
    }
    res.json(orders);
  } catch (err) {
    console.error('Error retrieving orders:', err.message);
    res.status(500).send('Server error');
  }
}


// @route   GET /api/orders/:orderId
// @desc    Get single orders by order id

exports.getOrderById = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    // console.error('Error retrieving order:', err.message);

    // Check if the error is due to an invalid ObjectId
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid order ID format' });
    }

    res.status(500).send('Server error');
  }
}

