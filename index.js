

const express = require("express");
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Load environment variables
dotenv.config();



const cors = require("cors");



// const categoryRouter = require("./Router/categoryRouter.js");
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Ensure this matches your frontend URL
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Express session
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));


// Passport Config
require('./config/passport');

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());


const { connectToMongoDB } = require("./Database.js");

connectToMongoDB().catch(console.error);

app.use("/category", require('./Router/categoryRouter.js'));
app.use('/api/auth', require('./Router/authRouter.js'));
app.use('/api/orders', require('./Router/ordersRouter.js'));
app.use('/api/cart', require('./Router/cartRouter.js'));
app.use('/api/reviews', require('./Router/reviewsRouter.js'));
app.use('/api/delivery', require('./Router/pincodesRouter.js'));
app.use('/api/otp-auth', require('./Router/otpAuthRouter.js'));
app.use('/api/forgot-password', require('./Router/forgotPasswordRouter.js'));
app.use('/api/user-query', require('./Router/contactedUserRouter.js'));
app.use('/api/blogs', require('./Router/blogsRouter.js'));
app.use('/api/recipes', require('./Router/recipesRouter.js'));
app.use('/api/delivery-charges', require('./Router/deliveryChargesRouter.js'));



const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



