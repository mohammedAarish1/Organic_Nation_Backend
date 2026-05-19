const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
// const csrf = require('csurf');

// Load environment variables
dotenv.config({ override: false });

const cors = require("cors");


// app.use(cors({
//   origin: process.env.FRONTEND_URL, // Ensure this matches your frontend URL
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token']
// }));


// Parse the comma-separated domains from environment variable
// const allowedOrigins = process.env.FRONTEND_URL
//   ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
//   : ['https://organicnation.co.in'];


const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      process.env.FOODSBAY_URL,
      process.env.FRONTEND_URL_NEXT_JS,
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200,
};

// Handle preflight FIRST — before everything else
app.options('*', cors(corsOptions));

app.use(cors(corsOptions));


// app.use(
//   cors({
//     origin: [
//       process.env.FRONTEND_URL,
//       process.env.ADMIN_URL,
//       process.env.FOODSBAY_URL,
//       process.env.FRONTEND_URL_NEXT_JS,
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "CSRF-Token",
//       "X-Requested-With",
//       "Accept",
//     ],
//     optionsSuccessStatus: 200,
//   }),
// );

// app.options('*', cors());
app.set("trust proxy", 1); // for handling the 'X-Forwarded-For' error because of express-rate-limiter

app.use(cookieParser());

app.use("/api/orders", require("./Router/ordersRouter.js"));

app.use(express.json());


// Express session
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  }),
);

// app.use(csrf({ cookie: true }));

// referrer policy -- as suggested by phonepe team
app.use((req, res, next) => {
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Passport Config
require("./config/passport");

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

const { connectToMongoDB } = require("./Database.js");

connectToMongoDB().catch(console.error);

app.use("/products", require("./Router/categoryRouter.js"));
app.use("/api/auth", require("./Router/authRouter.js"));
// app.use("/api/orders", require("./Router/ordersRouter.js"));
app.use("/api/cart", require("./Router/cartRouter.js"));
app.use("/api/reviews", require("./Router/reviewsRouter.js"));
app.use("/api/delivery", require("./Router/pincodesRouter.js"));
app.use("/api/otp-auth", require("./Router/otpAuthRouter.js"));
app.use("/api/forgot-password", require("./Router/forgotPasswordRouter.js"));
app.use("/api/user-query", require("./Router/contactedUserRouter.js"));
app.use("/api/blogs", require("./Router/blogsRouter.js"));
app.use("/api/recipes", require("./Router/recipesRouter.js"));
app.use("/api/delivery-charges", require("./Router/deliveryChargesRouter.js"));
app.use("/api/phonepe", require("./Router/paymentRouter.js"));
app.use("/api/admin", require("./Router/adminRouter.js"));
app.use("/api/validate/", require("./Router/couponCodeRouter.js"));
app.use(
  "/api/delivery/feedback",
  require("./Router/deliveryFeedbackRouter.js"),
);
app.use("/api/user/profile", require("./Router/ProfileRouter.js"));
app.use("/api/main/banners", require("./Router/bannerRouter.js"));
app.use("/api", require("./Router/newsletterRouter.js"));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
