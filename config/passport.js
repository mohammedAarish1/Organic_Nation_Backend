const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User'); // Ensure the User model is imported correctly
const Admin = require('../models/Admin');
const keys = process.env.JWT_SECRET;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = keys;

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
  User.findById(jwt_payload.user.id)
    .then(user => {
      if (user) {

        // Include the user's role in the payload
        const userWithRole = {
          id: user.id,
          email: user.email,
          role: user.role
        };

        return done(null, userWithRole);
      }
      return done(null, false);
    })
    .catch(err => console.error(err));
}));


// to authenticate the admin
passport.use('jwt-admin', new JwtStrategy(opts, (jwt_payload, done) => {
  Admin.find(jwt_payload._id)
    .then(admin => {
      if (admin && admin[0].role === 'admin') {

        // Include the admin's role in the payload
        const adminWithRole = {
          username: admin[0].username,
          role: admin[0].role
        };


        return done(null, adminWithRole);
      }
      return done(null, false);
    })
    .catch(err => console.error(err));
}));

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: "http://localhost:8000/api/auth/google/callback"
// },
//   async (accessToken, refreshToken, profile, done) => {
//     const { id, name, emails } = profile;

//     try {
//       // Check if a user with this Google ID already exists
//       let user = await User.findOne({ googleId: id });
//       if (user) {
//         return done(null, user);
//       }

//       // Check if a user with this email already exists
//       user = await User.findOne({ email: emails[0].value });
//       if (user) {
//         // Update user with googleId if email exists but googleId is not set
//         user.googleId = id;
//         await user.save();
//         return done(null, user);
//       }


//       // Create a new user with basic details and placeholder for phone number and password
//       user = new User({
//         googleId: id,
//         firstName: name.givenName,
//         lastName: name.familyName,
//         email: emails[0].value,
//         phoneNumber: '', // Placeholder for phone number
//         password: '',  // Placeholder for password
//         role: 'Customer' // Set default role for new Google sign-ups
//       });
//       await user.save();
//       return done(null, user);
//     } catch (err) {
//       // console.error('Error during Google OAuth:', err.message);
//       return done(err, false);
//     }
//   }));


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://dpzi63xcomvst.cloudfront.net/api/auth/google/callback"
  // callbackURL: "http://localhost:8000/api/auth/google/callback"
},
  async (accessToken, refreshToken, profile, done) => {
    const { id, name, emails } = profile;

    try {
      // Check if a user with this Google ID already exists
      let user = await User.findOne({ googleId: id });
      
      if (!user) {
        // If no user found with Google ID, check by email
        user = await User.findOne({ email: emails[0].value });
        
        if (user) {
          // Update user with googleId if email exists but googleId is not set
          user.googleId = id;
          await user.save();
        } else {
          // Create a new user if neither googleId nor email matches
          user = new User({
            googleId: id,
            firstName: name.givenName,
            lastName: name.familyName,
            email: emails[0].value,
            phoneNumber: '', // Placeholder for phone number
            password: '',  // Placeholder for password
            role: 'Customer' // Set default role for new Google sign-ups
          });
          await user.save();
        }
      }

      return done(null, user);
    } catch (err) {
      console.error('Error during Google OAuth:', err.message);
      return done(err, false);
    }
  }));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

// passport.deserializeUser(async (id, done) => {
//   const user = await User.findById(id);
//   done(null, user);
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await User.findById(id);
//     // Include the user's role when deserializing
//     done(null, { id: user.id, email: user.email, role: user.role });
//   } catch (err) {
//     done(err);
//   }
// });

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      // Handle case where user no longer exists in the database
      return done(null, false);
    }
    // Include the user's role when deserializing
    done(null, { id: user.id, email: user.email, role: user.role });
  } catch (err) {
    done(err);
  }
});


// Add custom middleware for role-based authentication
passport.checkRole = (roles) => {
  return (req, res, next) => {
    if (req.isAuthenticated() && roles.includes(req.user.role)) {
      return next();
    }
    res.status(403).json({ message: 'Unauthorized: Insufficient role' });
  };
};

module.exports = passport;