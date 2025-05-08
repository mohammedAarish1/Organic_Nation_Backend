const jwt = require('jsonwebtoken');
const Products = require('../models/Products');
const OTP = require('../models/OTP');
const crypto = require('crypto');
const Coupon = require("../models/Coupon.js");
const { default: axios } = require('axios');
const { default: mongoose } = require('mongoose');
const User = require('../models/User.js');
const { sendEmail } = require('./emailService.js');

// Token generation utility


const verifyOTP = async (phoneNumber, otp) => {
  const storedOTP = await OTP.findOne({ phoneNumber, otp });
  if (!storedOTP) return false;

  const isValid = new Date() - storedOTP.createdAt < 5 * 60 * 1000;
  if (isValid) {
    await OTP.deleteOne({ _id: storedOTP._id });
  }
  return isValid;
};



const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
};





// to convert the address object into plain string 
// const address = (obj) => {
//   const { ObjectId } = mongoose.Types;
//   let result = '';

//   for (const key in obj) {
//     if (obj.hasOwnProperty(key) && key !== '_id') {  // Skip _id field
//       const value = obj[key];

//       // Check if value is an ObjectId and convert it to string if so
//       const valueToString = value instanceof ObjectId ? value.toString() : value;

//       if (Array.isArray(valueToString)) {
//         result += valueToString.flat().join(' ') + ' ';
//       } else {
//         result += valueToString + ' ';
//       }
//     }
//   }

//   return result.trim();
// }


function address(addressObj) {
  const parts = [
    addressObj.address,
    addressObj.city,
    addressObj.state,
    addressObj.pinCode,
  ];

  // Filter out empty/null values and join with commas and spaces
  return parts
    .filter(part => part && part.toString().trim() !== '')
    .join(', ');
}


// to update the stock  of a product
const updateStock = async (productName, quantity, action) => {
  let update;

  switch (action) {
    case 'add':
      update = { $inc: { availability: -quantity } }; // Decrease stock for a new order
      break;
    case 'cancel':
      update = { $inc: { availability: quantity } }; // Increase stock when an order is canceled
      break;
    case 'return':
      update = { $inc: { availability: quantity } }; // Increase stock for returned items
      break;
    default:
      throw new Error('Invalid action specified');
  }

  try {
    const result = await Products.findOneAndUpdate(
      { ['name-url']: productName }, // Find by product name
      update,
      { new: true, runValidators: true }
    );

    if (!result) {
      throw new Error('Product not found');
    }

    return 'Stock updated successfully'; // Return a success message
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error; // Re-throw the error for handling in the calling function
  }
};



const extractWeight = (description) => {
  // Remove all spaces from the description
  const cleanDesc = description.replace(/\s/g, '');

  // Regular expression to match the last number followed by 'g', 'kg', 'l', or 'ltr'
  const match = cleanDesc.match(/(\d+(?:\.\d+)?)(g|kg|l|ltr|gm)$/i);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'kg':
        return value * 1000; // Convert kg to g
      case 'g':
        return value;
      case 'gm':
        return value;
      case 'l':
      case 'ltr':
        return value * 1000; // Assume 1 liter = 1000g (for water-based products)
      default:
        return null;
    }
  }

  return null; // Return null if no match is found
}

// Function to trim all string fields in an object
const removeExtraSpaces = (obj) => {
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].trim(); // Trim leading and trailing spaces
    }
  });
  return obj;
};



const sendOrderConfirmationMsg = async (name, amount, phoneNumber) => {


  const message = `Dear ${name}, Thank you for your order! Your order for Rs. ${amount} has been successfully placed. We appreciate your trust in Organic Nation!`;
  const encodedMessage = encodeURIComponent(message);

  const URL = `http://foxxsms.net/sms//submitsms.jsp?user=Foodsbay&key=${process.env.SMS_KEY}&mobile=${phoneNumber}&message=${encodedMessage}&senderid=${process.env.SMS_SENDER_ID}&accusage=1&entityid=${process.env.SMS_ENTITY_ID}&tempid=${process.env.SMS_ORDER_CONF_TEMP_ID}`;


  try {
    const response = await axios.post(URL);

    const responseData = response.data.trim().split(','); // converted it into an array since response.data is in text format
    const dataObj = {
      status: responseData[0], // sent or fail
      message: responseData[1], // success or invalid
      messageId: responseData[2],
      clientId: responseData[3],
      phoneNumber: responseData[4]
    };



    if (dataObj.status === 'sent' && dataObj.message === 'success') {

      return true;
    } else {
      return false;
    }
  } catch (error) {
  }
};

// ========================================= referral code related functions ======================================== //

// generate unique coupon for the referrer and referred

// utils/generateReferra  lCode.js
const generateUniqueCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // Generates a 6-character referral code
}


// create a unique referral code
const createReferralCoupon = async (userId, type) => {

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7); // Set expiration to 3 days from now
  const localDate = new Date(expirationDate).toLocaleDateString('en-IN') // for showing it to the user in the format DD/MM/YYYY
  
  const coupon = new Coupon({
    code: generateUniqueCode(),
    name: `Referral ${type === 'referrer' ? 'Bonus' : 'Welcome'} Coupon`,
    description: `Get ₹100 off on all orders above ₹999 - (Valid till ${localDate})`,
    type: 'referral',
    value: 100,
    minOrderValue: 999,
    status: 'active',
    isReferralCoupon: true,
    expiresAt: expirationDate
  });

  await coupon.save();
  return coupon;
};


// Separate function to handle referral rewards
const handleReferralReward = async (userId, orderId) => {
  try {
    const user = await User.findById(userId);

    // If this user was referred by someone, give the referrer their reward
    if (user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy });

      if (!referrer) {
        console.error('Referrer not found for referral code:', user.referredBy);
        return;
      }

      // Check if referrer already got reward for this user
      const existingReward = referrer.referralCoupons.find(
        coupon => coupon.type === 'referrer' &&
          coupon.orderId?.toString() === orderId.toString()
      );

      if (!existingReward) {
        // Create coupon for referrer
        const referrerCoupon = await createReferralCoupon(referrer._id, 'referrer');

        referrer.referralCoupons.push({
          couponId: referrerCoupon._id,
          orderId: orderId,
          type: 'referrer',
          isUsed: false
        });

        await referrer.save();

        // Optionally send notification to referrer about their reward
        try {
          await sendEmail(
            referrer?.email,
            "You've Earned a Referral Reward!",
            "couponInformation",
            {
              customerName: `${referrer.fullName || ''}`.trim(),
              couponValue: '₹100',
              couponCode: referrerCoupon.code,
              minOrderValue: '₹999',
              // Add more template variables as needed
            }
          );
        } catch (emailError) {
          console.error('Error sending referral reward email:', emailError);
        }
      }
    }
  } catch (error) {
    console.error('Error handling referral reward:', error);
    throw error;
  }
};



// Function to expire coupons
const expireCoupons = async () => {
  try {
    const now = new Date();  // Get the current date/time

    // Expire coupons that are active and past their expiration date
    const expiredCoupons = await Coupon.updateMany(
      {
        status: 'active',
        expiresAt: { $lt: now }  // Expiration condition
      },
      {
        $set: { status: 'expired' }  // Update to expired
      }
    );

    // Log how many coupons were updated

  } catch (error) {
    // Log any errors that occur in the cron job
    console.error('Error expiring coupons:', error);
    // Optionally, send error to a monitoring service (e.g., Sentry, Datadog)
  }
};



// update coupon status
const updateCouponStatus = async (couponId, status) => {
  try {
      // Update the coupon status
      const coupon = await Coupon.findById(couponId);
      if (coupon) {
        coupon.status = status;
        await coupon.save();
      }
  } catch (error) {
    console.error('Error marking coupon as used:', error);
    throw error;
  }
}

// 4. Add a function to handle coupon usage 
// const markCouponAsUsed = async (couponId, userId) => {
//   try {
//     // Update the coupon status
//     const coupon = await Coupon.findById(couponId);
//     if (coupon && coupon.status === 'active') {
//       coupon.status = 'used';
//       await coupon.save();
//     }

    
//     // Update the user's referralCoupons array
//     const user = await User.findById(userId);
//     const referralCoupon = user.referralCoupons.find(
//       rc => rc.couponId.toString() === couponId.toString()
//     );
    
//     if (referralCoupon) {
//       referralCoupon.isUsed = true;
//       await user.save();
//     }
//   } catch (error) {
//     console.error('Error marking coupon as used:', error);
//     throw error;
//   }
// };


const markCouponActive = async (couponId, userId) => {
  try {
    // Update the coupon status
    const coupon = await Coupon.findById(couponId);
    if (coupon && coupon.status === 'used') {
      coupon.status = 'active';
      await coupon.save();
    }

    
    // Update the user's referralCoupons array
    const user = await User.findById(userId);
    const referralCoupon = user.referralCoupons.find(
      rc => rc.couponId.toString() === couponId.toString()
    );
    
    if (referralCoupon) {
      referralCoupon.isUsed = false;
      await user.save();
    }
  } catch (error) {
    console.error('Error marking coupon as active:', error);
    throw error;
  }
};


// =========================================  Ended ======================================== //



module.exports = {
  verifyOTP,
  generateTokens,
  address,
  updateStock,
  extractWeight,
  removeExtraSpaces,
  sendOrderConfirmationMsg,
  generateUniqueCode,
  createReferralCoupon,
  handleReferralReward,
  expireCoupons,
  updateCouponStatus,
  // markCouponAsUsed,
  markCouponActive
};
