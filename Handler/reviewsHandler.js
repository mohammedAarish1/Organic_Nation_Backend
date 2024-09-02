const Review = require('../models/Review');


// @route   POST /api/reviews
// @desc    Write a review
exports.addReview = async (req, res) => {
  const { productName, rating, review } = req.body;
  const userEmail = req.user.email;
  const firstName = req.user.firstName;
  const lastName = req.user.lastName;

console.log('user', )

  const userId = req.user.id

  try {
    const newReview = new Review({
      productName,
      rating,
      review,
      userEmail,
      userName:firstName +" "+ lastName
    });

    const savedReview = await newReview.save();
    res.json(savedReview);
  } catch (err) {
    // console.error('Error writing review:', err.message);
    res.status(500).send('Server error');
  }
}

// @route   GET /api/reviews
// @desc    Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (err) {
    // console.error('Error fetching reviews:', err.message);
    res.status(500).send('Server error');
  }
}

// @route   GET /api/reviews/average/:productName
// @desc    Get average rating of a product
exports.getAverageRating = async (req, res) => {
  const productName = req.params.productName;

  try {
    const reviews = await Review.find({ productName });
    if (reviews.length === 0) {
      return res.status(404).json({ msg: 'No reviews found for this product' });
    }

    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = Number((totalRating / reviews.length).toFixed(1));

    res.json({ productName, averageRating });
  } catch (err) {
    // console.error('Error calculating average rating:', err.message);
    res.status(500).send('Server error');
  }
}

// @route   GET /api/reviews/:productName
// @desc    Get all reviews for a particular product
exports.getSingleProductReviews = async (req, res) => {
  const productName = req.params.productName;

  try {
    const reviews = await Review.find({ productName });
    if (reviews.length === 0) {
      return res.status(404).json({ msg: 'No reviews found for this product' });
    }
    res.json(reviews);
  } catch (err) {
    // console.error('Error fetching reviews:', err.message);
    res.status(500).send('Server error');
  }
}

