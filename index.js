

const express = require("express");
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
// const csrf = require('csurf');

// Load environment variables
dotenv.config();



const cors = require("cors");


app.use(cookieParser());
// const categoryRouter = require("./Router/categoryRouter.js");
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL, // Ensure this matches your frontend URL
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token']
}));


// Express session
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));


// app.use(csrf({ cookie: true }));

// referrer policy -- as suggested by phonepe team
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});



// Passport Config
require('./config/passport');

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());


const { connectToMongoDB } = require("./Database.js");

connectToMongoDB().catch(console.error);

app.use("/products", require('./Router/categoryRouter.js'));
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
app.use('/api/phonepe', require('./Router/paymentRouter.js'));
app.use('/api/admin', require('./Router/adminRouter.js'));
app.use('/api/validate/', require('./Router/couponCodeRouter.js'));
app.use('/api/delivery/feedback', require('./Router/deliveryFeedbackRouter.js'));
app.use('/api/user/profile', require('./Router/ProfileRouter.js'));
app.use('/api/main/banners', require('./Router/bannerRouter.js'));



const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



