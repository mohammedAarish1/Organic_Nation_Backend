const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User'); // Ensure the User model is imported correctly
const keys = process.env.JWT_SECRET;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = keys;

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
  User.findById(jwt_payload.user.id)
    .then(user => {
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    })
    .catch(err => console.error(err));
}));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://dpzi63xcomvst.cloudfront.net/api/auth/google/callback"
},
  async (accessToken, refreshToken, profile, done) => {
    const { id, name, emails } = profile;

    try {
      // Check if a user with this Google ID already exists
      let user = await User.findOne({ googleId: id });
      if (user) {
        return done(null, user);
      }

      // Check if a user with this email already exists
      user = await User.findOne({ email: emails[0].value });
      if (user) {
        // Update user with googleId if email exists but googleId is not set
        user.googleId = id;
        await user.save();
        return done(null, user);
      }

      // Create a new user with basic details and placeholder for phone number and password
      user = new User({
        googleId: id,
        firstName: name.givenName,
        lastName: name.familyName,
        email: emails[0].value,
        phoneNumber: '', // Placeholder for phone number
        password: '' // Placeholder for password
      });
      await user.save();
      return done(null, user);
    } catch (err) {
      console.error('Error during Google OAuth:', err.message);
      return done(err, false);
    }
  }));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;