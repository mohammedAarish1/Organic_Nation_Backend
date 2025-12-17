// const { getDb } = require("../Database.js");
// const { ObjectId } = require('mongodb'); // Ensure ObjectId is imported
const Products = require("../models/Products.js");
const Review = require("../models/Review.js");
const productSeoData = require("../utility/seo/data.js");
const ProductInfo = require("../models/ProductInfo.js");
const ProductAdditionalInfo = require("../models/ProductAdditionalInfo.js");
// const ProductAdditionalInfo = require('../models/ProductAdditoinalInfo.js')
// const mongoose = require('mongoose');

exports.allProducts = async (req, res) => {
  try {
    const products = await Products.find({ isActive: true }).lean();

    if (products.length === 0) {
      console.log("No products found in the database");
    }

    // const filteredProducts = products.filter(product => product.category !== 'Organic Tea' && product.category !== 'Breakfast Cereals')    // separate the categories and category-url
    const categoryList = products.map((product) => ({
      category: product.category,
      categoryUrl: product["category-url"],
    }));

    // filter out the unique categories
    const uniqueCategoriesList = categoryList.filter(
      (product, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.category === product.category &&
            t.categoryUrl === product.categoryUrl
        )
    );

    // add the 'All' category
    const finalCategoryList = [
      { category: "All", categoryUrl: "All" },
      ...uniqueCategoriesList,
    ];

    res.status(200).json({ products, categoryList: finalCategoryList });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    // Use Mongoose to query the database
    const categories = await Products.find({}, "category category-url")
      .lean() // Convert to plain JavaScript objects
      .exec(); // Execute the query

    // Extract unique categories
    const categoryValues = categories.map((doc) => doc.category);
    const uniqueCategoriesSet = new Set(categoryValues);
    const uniqueCategoriesArray = Array.from(uniqueCategoriesSet);

    res.send({ message: "done", categories: uniqueCategoriesArray });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error fetching categories", error: error.message });
  }
};

//  get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    let products;
    if (category === "all") {
      products = await Products.find({});
    } else {
      // Using Mongoose to find products by category URL
      products = await Products.find({
        "category-url": { $regex: new RegExp(`^${category}$`, "i") },
      });
    }

    // const filteredProducts = products.filter(product => product.category !== 'Organic Tea' && product.category !== 'Breakfast Cereals')    // separate the categories and category-url
    const filteredProducts = products.filter((product) => product.isActive); // separate the categories and category-url

    const productsWithReviews = await Promise.all(
      filteredProducts.map(async (product) => {
        const productObj = product.toObject ? product.toObject() : product;

        const reviews = await Review.find({
          productName: productObj["name-url"],
        }).sort({ createdAt: -1 });

        let averageRating = 0;
        let totalReviews = reviews.length;

        if (totalReviews > 0) {
          const totalRating = reviews.reduce(
            (acc, review) => acc + review.rating,
            0
          );
          averageRating = (totalRating / totalReviews).toFixed(1);
        }

        return {
          ...productObj,
          reviewsAndRating: {
            averageRating,
            totalReviews,
          },
        };
      })
    );

    // Sending response with products
    res.status(200).json(productsWithReviews);
  } catch (error) {
    // Handling errors
    console.error("Error fetching products by category:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = req.params.product;
    // Using Mongoose to find a single product by name URL
    const singleProduct = await Products.findOne({ "name-url": product });

    // Checking if product exists
    if (!singleProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // const productAddInfo = await ProductAdditionalInfo.findOne({ "name-url": product });

    // Sending response with the found product
    res.json({ product: singleProduct });
  } catch (error) {
    // Handling errors
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSingleProductAllInfo = async (req, res) => {
  try {
    const name = req.params.name;
    if (!name) {
      return res.status(400).json({ error: "Product name is required" });
    }
    // fetch the product from the database
    const singleProduct = await Products.findOne({ "name-url": name });

    // Checking if product exists
    if (!singleProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // fetch all the reviews from the database for that single product
    const reviews = await Review.find({ productName: name }).sort({
      createdAt: -1,
    });

    let averageRating;
    if (reviews.length > 0) {
      // calculate the average rating of the product
      const totalRating = reviews.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      averageRating = Number((totalRating / reviews.length).toFixed(1));
    }

    // const productInfo = await ProductInfo.findOne({ "name-url": name });
    const productInfo = await ProductAdditionalInfo.findOne({
      "name-url": name,
    });
    // get seo data for this product
    const seoData = productSeoData[name];
    const data = {
      details: singleProduct,
      reviews: reviews.length > 0 ? reviews : [],
      averageRating,
      seoData,
      productInfo,
    };

    // Sending response with the found product
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
