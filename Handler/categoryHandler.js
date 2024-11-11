const { getDb } = require("../Database.js");
const { ObjectId } = require('mongodb'); // Ensure ObjectId is imported
const Products = require('../models/Products.js')
const ProductAdditionalInfo = require('../models/ProductAdditoinalInfo.js')
const mongoose = require('mongoose');


exports.allProducts = async (req, res) => {
  try {

    const productOne = await Products.find({}).lean();


    if (productOne.length === 0) {
      console.log('No products found in the database');
    }
    res.send({ product: productOne });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
};



exports.getCategories = async (req, res) => {
  try {
    // Use Mongoose to query the database
    const categories = await Products.find({}, 'category category-url')
      .lean() // Convert to plain JavaScript objects
      .exec(); // Execute the query

    // Extract unique categories
    const categoryValues = categories.map((doc) => doc.category);
    const uniqueCategoriesSet = new Set(categoryValues);
    const uniqueCategoriesArray = Array.from(uniqueCategoriesSet);

    res.send({ message: "done", categories: uniqueCategoriesArray });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send({ message: "Error fetching categories", error: error.message });
  }
};





//  get products by category 
exports.getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    // Using Mongoose to find products by category URL
    const products = await Products.find({ 'category-url': { $regex: new RegExp(`^${category}$`, "i") } });
    // Sending response with products
    res.json({ products });
  } catch (error) {
    // Handling errors
    console.error("Error fetching products by category:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};




exports.getProduct = async (req, res) => {
  try {
    const product = req.params.product;
    // Using Mongoose to find a single product by name URL
    const singleProduct = await Products.findOne({ "name-url": product });

    // Checking if product exists
    if (!singleProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // const productAddInfo = await ProductAdditionalInfo.findOne({ "name-url": product });

    // Sending response with the found product
    res.json({ product: singleProduct });
  } catch (error) {
    // Handling errors
    console.error("Error fetching product:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


