const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendEmail } = require("../utility/emailService");
const { generateTokens, address } = require("../utility/helper");

// @route   GET /api/auth/google/callback
// @desc    Google auth callback
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;
    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Prepare user data
    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      cart: user.cart,
    };

    // Encode the data to be sent in the URL
    const encodedData = encodeURIComponent(
      JSON.stringify({
        accessToken,
        user: userData,
      })
    );

    // Check if the user is new (doesn't have a password set)
    if (!user.password) {
      // New user, redirect to collect phone number
      res.redirect(
        `${process.env.FRONTEND_URL
        }/collect-phone-number?token=${encodeURIComponent(refreshToken)}`
      );
    } else {
      // Existing user, redirect to home page
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/google/login?data=${encodedData}`
      );
    }
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(
      `${process.env.FRONTEND_URL}/register?error=Authentication failed`
    );
  }
};

// @route   POST /api/auth/google/phone
// @desc    Collect phone number and password after Google OAuth
exports.collectPhoneAndPassword = async (req, res) => {
  const { phoneNumber, password } = req.body;
  const userId = req.user._id;
  // const userId = req.session.userId;
  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    const { accessToken, refreshToken } = generateTokens(userId);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.phoneNumber = "+91" + phoneNumber;
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    req.session.userId = null;

    await sendEmail(
      req.user?.email,
      "Welcome To Organic Nation",
      "signUpConfirmation",
      {
        userName: req.user.fullName,
        // Add more template variables as needed
      }
    );

    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        cart: user.cart,
      },
    });

    // res.json({ msg: 'Phone number and password saved successfully' });
  } catch (err) {
    // console.error('Error saving phone number and password:', err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET /api/auth/user/:email
// @desc    Get user data by email
exports.getUserByEmail = async (req, res) => {
  const email = req.params.email;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Return user data
    res.json(user);
  } catch (err) {
    // console.error('Error retrieving user data:', err.message);
    res.status(500).send("Server error");
  }
};

// @route GET /api/auth/user
// @desc    Get user data by token
// exports.getUserByToken = async (req, res) => {
//   try {
//     let user = await User.findById(req.user.id).select('-password');
//     if (!user) {
//       return res.status(404).json({ msg: 'User not found' });
//     }
//     // return user data
//     res.json(user);
//   } catch (err) {
//     // console.error('Error retrieving user data:', err.message);
//     res.status(500).send('Server Error');
//   }
// }

// ================= new auth system, ===================================

// sign up endpoint
exports.signup = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: email?.toLowerCase() }, { phoneNumber }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or phone number already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token to user document
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await sendEmail(
      user.email,
      "Welcome To Organic Nation",
      "signUpConfirmation",
      {
        userName: user.fullName,
        // Add more template variables as needed
      }
    );

    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        cart: user.cart || [],
        addresses: user.addresses || [],
        referralCode:user.referralCode||'',
        referralCoupons: user.referralCoupons || []
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

// ===== login endpoint ==========
exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    // Determine if userId is email or phone
    const query = /^\d{10}$/.test(userId)
      ? { phoneNumber: `+91${userId}` }
      : { email: userId.toLowerCase() };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        cart: user.cart,
        addresses: user.addresses || [],
        referralCode:user.referralCode||'',
        referralCoupons: user.referralCoupons || []
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// token refresh endpoint ===============
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user and check if refresh token matches
    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken,
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new tokens
    const tokens = generateTokens(user._id);

    // Update refresh token in database
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Set new refresh token in HTTP-only cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // res.json({ accessToken: tokens.accessToken });
    res.json({
      accessToken: tokens.accessToken,
      user: {
        id: user._id,
        fullName: user.fullName || '',
        // lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        cart: user.cart || [],
        addresses: user.addresses || [],
        referralCode:user.referralCode||'',
        referralCoupons: user.referralCoupons || []
        // Add other necessary user fields
      },
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

// log out endpoint ============
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Find user and remove refresh token
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
      );
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error logging out", error: error.message });
  }
};


// get user 
exports.getUser = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId).select("-password -refreshToken")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }


    return res.status(200).json({ user })

  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting user", error: error.message });
  }
};


// check if a referral code (user) exist in the database 
exports.isReferralCodeExist = async (req, res) => {
  try {
    const {referralCode} = req.body;


    if (!referralCode) {
      return res.status(400).json({ message: "Referral code is required" })
    }

    const isExist=await User.findOne({ referralCode,})

    if (!isExist) {
      return res.status(201).json({exist:false, message: "Referral code does not exist" })
    }

    return res.status(200).json({exist:true, message: "Referral code exist" })
  } catch (error) {
    return res.status(500).json({ message: "Error checking referral code", error: error.message });
  }
}
