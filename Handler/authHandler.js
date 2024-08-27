const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require("../utility/emailService");




// @route   POST /api/auth/signup
// @desc    Register user
exports.userSignup = async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password } = req.body;



  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }
    user = new User({ firstName, lastName, email: email.toLowerCase(), phoneNumber: phoneNumber, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });

    await sendEmail(
      email,
      "Welcome To Organic Nation",
      "signUpConfirmation",
      {
        userName: firstName,
        // Add more template variables as needed
      }
    );

  } catch (err) {
    // console.error('Error during user registration:', err.message);
    res.status(500).send('Server error');
  }
};


// @route   GET /api/auth/google/callback
// @desc    Google auth callback
exports.googleCallback = (req, res) => {
  const payload = { user: { id: req.user.id, email: req.user.email } };


  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
    if (err) {
      return res.status(500).send('Authentication failed');
    };

    const secureToken = encodeURIComponent(token);
    // Check if the user is new (doesn't have a password set)
    if (!req.user.password) {
      // New user, redirect to collect phone number
      res.redirect(`${process.env.FRONTEND_URL}/collect-phone-number?token=${secureToken}`);
    } else {
      // Existing user, redirect to dashboard or home page
      res.redirect(`${process.env.FRONTEND_URL}/?token=${secureToken}`);
    }

  });
}



// @route   POST /api/auth/google/phone
// @desc    Collect phone number and password after Google OAuth
exports.collectPhoneAndPassword = async (req, res) => {
  const { phoneNumber, password } = req.body;
  const userId = req.user.id;
  // const userId = req.session.userId;
  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.phoneNumber = '+91' + phoneNumber;
    await user.save();

    req.session.userId = null;

    await sendEmail(
      req.user?.email,
      "Welcome To Organic Nation",
      "signUpConfirmation",
      {
        userName: req.user.firstName,
        // Add more template variables as needed
      }
    );

    res.json({ msg: 'Phone number and password saved successfully' });
  } catch (err) {
    // console.error('Error saving phone number and password:', err.message);
    res.status(500).send('Server error');
  }
}



// @route   POST /api/auth/login
// @desc    Authenticate user and get token
exports.userLogin = async (req, res) => {
  const { userId, password } = req.body;


  try {

    // Determine if userId is an email or a phone number
    let query;
    if (/^\d{10}$/.test(userId)) {
      // Assuming phone numbers are 10 digits long
      query = { phoneNumber: `+91${userId}` };
    } else {
      // Otherwise treat it as an email
      query = { email: userId.toLowerCase() };
    }


    // Check if user exists
    let user = await User.findOne(query);

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials due to User Id' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials due to wrong password' });
    }

    // Return JWT token
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '20h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, msg: 'Verified' });
    });
  } catch (err) {
    // console.error('Error during login:', err.message);
    res.status(500).send('Server error');
  }
}

// @route   GET /api/auth/user/:email
// @desc    Get user data by email
exports.getUserByEmail = async (req, res) => {
  const email = req.params.email;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Return user data
    res.json(user);
  } catch (err) {
    // console.error('Error retrieving user data:', err.message);
    res.status(500).send('Server error');
  }
}

// @route GET /api/auth/user
// @desc    Get user data by token
exports.getUserByToken = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    // return user data
    res.json(user);
  } catch (err) {
    // console.error('Error retrieving user data:', err.message);
    res.status(500).send('Server Error');
  }
}





// @route   GET /api/auth/logout
// @desc    Logout user
// router.get('/logout', (req, res) => {
//   req.logout();
//   res.redirect('/');
// });



