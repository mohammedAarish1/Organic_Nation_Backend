const Review = require("../models/Review");
const User = require("../models/User");

const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../config/awsConfig.js");

// @route   POST /api/reviews
// @desc    Write a review
exports.addReview = async (req, res) => {
  try {
    const { productName, rating, title, review } = req.body;
    const images = req.files.images || [];
    const video = req.files.video ? req.files.video[0] : null;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const userEmail = user.email || "";
    const userName = user.fullName || "User";
    const phoneNumber = user.phoneNumber || "";

    let imagePaths = [];
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(
      currentDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${currentDate.getDate().toString().padStart(2, "0")}`;
    const reviewFolderId = `${user.fullName || user.phoneNumber}_${Date.now()}`;
    const basePath = `${productName}/${formattedDate}/${reviewFolderId}`;

    // const folderName = `${productName}`;
    if (images.length > 0) {
      imagePaths = await Promise.all(
        images.map(async (image, index) => {
          const params = {
            Bucket: process.env.AWS_BUCKET_REVIEW_IMAGES_VIDEOS,
            Key: `${basePath}/images/${index + 1}.jpg`,
            Body: image.buffer,
            ContentType: image.mimetype,
            ACL: "public-read",
          };

          const command = new PutObjectCommand(params);
          await s3Client.send(command);

          return `https://${process.env.AWS_BUCKET_REVIEW_IMAGES_VIDEOS}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
        })
      );
    }

    let videoUrl = null;
    if (video) {
      const videoParams = {
        Bucket: process.env.AWS_BUCKET_REVIEW_IMAGES_VIDEOS,
        Key: `${basePath}/video/review-video.mp4`,
        Body: video.buffer,
        ContentType: video.mimetype,
        ACL: "public-read",
      };

      const videoCommand = new PutObjectCommand(videoParams);
      await s3Client.send(videoCommand);

      videoUrl = `https://${process.env.AWS_BUCKET_REVIEW_IMAGES_VIDEOS}.s3.${process.env.AWS_REGION}.amazonaws.com/${videoParams.Key}`;
    }

    const newReview = new Review({
      productName,
      rating,
      title,
      review,
      userEmail,
      userName,
      phoneNumber,
      verified: true,
      images: imagePaths,
      hasVideo: videoUrl ? true : false,
      videoUrl,
    });

    const savedReview = await newReview.save();
    res.json({
      success: true,
      message: "Review added successfully",
      savedReview,
    });
  } catch (error) {
    console.error("Error writing review:", error.message);
    res.status(500).send("Server error");
  }
};

// @route   GET /api/reviews
// @desc    Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    // console.error('Error fetching reviews:', err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET /api/reviews/average/:productName
// @desc    Get average rating of a product
exports.getAverageRating = async (req, res) => {
  const productName = req.params.productName;

  try {
    const reviews = await Review.find({ productName });
    if (reviews.length === 0) {
      return res.status(404).json({ msg: "No reviews found for this product" });
    }

    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = Number((totalRating / reviews.length).toFixed(1));

    res.json({ productName, averageRating });
  } catch (err) {
    // console.error('Error calculating average rating:', err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET /api/reviews/:productName
// @desc    Get all reviews for a particular product
exports.getSingleProductReviews = async (req, res) => {
  const productName = req.params.productName;

  try {
    const reviews = await Review.find({ productName });
    if (reviews.length === 0) {
      return res.status(404).json({ msg: "No reviews found for this product" });
    }
    res.json(reviews);
  } catch (err) {
    // console.error('Error fetching reviews:', err.message);
    res.status(500).send("Server error");
  }
};
