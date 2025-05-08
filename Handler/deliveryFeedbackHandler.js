const DeliveryFeedback = require('../models/DeliveryFeedback');
const Order = require('../models/Order');
const User = require('../models/User')



// @route   POST /api/reviews
// @desc    Write a review
exports.addDeliveryFeedback = async (req, res) => {

  const { selectedOption, comments, invoiceNumber} = req.body;


  const order = await Order.findOne({invoiceNumber});  // Assuming you have a User model

  if (!order) {
    return res.status(404).send('order not found');
  }


  const userName = order.userName;
  const userEmail = order.userEmail;

  // Fetch the full user object


  try {
    const newDeliveryFeedback = new DeliveryFeedback({
        invoiceNumber,
        selectedOption,
        comments,
        userName,
      userEmail,
    });

    const savedfeedback = await newDeliveryFeedback.save();
    res.status(200).json({message:'Saved Successfully'});
  } catch (err) {
    // console.error('Error writing review:', err.message);
    res.status(500).send('Server error');
  }
}

// @route   GET /api/reviews
// @desc    Get all reviews
// exports.getAllReviews = async (req, res) => {
//   try {
//     const reviews = await Review.find();
//     res.json(reviews);
//   } catch (err) {
//     // console.error('Error fetching reviews:', err.message);
//     res.status(500).send('Server error');
//   }
// }

  

