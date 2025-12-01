// const { PublishCommand } = require("@aws-sdk/client-sns");
// const { snsClient } = require("../config/awsConfig");
// const jwt = require("jsonwebtoken");
const OTP = require("../models/OTP");
const User = require("../models/User");
const { generateTokens, verifyOTP, generateUniqueCode, createReferralCoupon } = require("../utility/helper");
const { default: axios } = require("axios");

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// =-=-=-= send otp using AWS =-=-=-

// const sendOTP = async (phoneNumber) => {
//   const otp = generateOTP();
//   await OTP.create({ phoneNumber, otp, createdAt: new Date() });

//   const params = {
//     Message: `Organic Nation - Your OTP is: ${otp}. Please don't share it with anyone`,
//     PhoneNumber: phoneNumber,
//     MessageAttributes: {
//       "AWS.SNS.SMS.SMSType": {
//         DataType: "String",
//         StringValue: "Transactional",
//       },
//     },
//   };

//   try {
//     // console.log("otp", otp);
//     const data = await snsClient.send(new PublishCommand(params));

//     // return data;
//   } catch (err) {
//     // console.error("Error", err);
//     throw err;
//   }
// };

// exports.sendOTP = async (req, res) => {
//   const { phoneNumber } = req.body;
//   try {
//     await sendOTP(phoneNumber);

//     res.json({ success: true, message: "OTP sent successfully" });
//   } catch (error) {
//     console.log('Error sending OTP', error.message)
//     res.status(500).json({ success: false, message: "Failed to send OTP" });
//   }
// };
// =-=-=-= send otp using AWS =-=-=- ended //


// ============= send OTP using foxglove API ==============
exports.sendOTP = async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    res
      .status(400)
      .json({ success: false, message: "Phone number is required" });
  }

  const otp = generateOTP();
  await OTP.create({ phoneNumber, otp, createdAt: new Date() });

  // ================================================ for testing ===============

  // console.log('otp', otp);
  // res.json({ success: true, message: "OTP sent successfully" });

  // ========================================== for testing ====================

  const message = `${otp} is your one-time-password for verification at Foodsbay India (Organic Nation). PLEASE DON'T SHARE IT WITH ANYONE.`;

  const params = message.replace(/ /g, "%20");
  const URL = `http://foxxsms.net/sms//submitsms.jsp?user=Foodsbay&key=${process.env.SMS_KEY}&mobile=${phoneNumber}&message=${params}&senderid=${process.env.SMS_SENDER_ID}&accusage=1&entityid=${process.env.SMS_ENTITY_ID}&tempid=${process.env.SMS_OTP_TEMP_ID}`;
  try {
    // const response=await axios.post(`http://foxxsms.net/sms//submitsms.jsp?user=Foodsbay&key=f2bf9f44deXX&mobile=${phoneNumber}&message=897543%20is%20your%20one-time-password%20for%20verification%20at%20Foodsbay%20India%20(Organic%20Nation).%20PLEASE%20DON%27T%20SHARE%20IT%20WITH%20ANYONE.&senderid=ORGNTN&accusage=1`)
    const response = await axios.post(URL);

    const responseData=response.data.trim().split(','); // converted it into an array since response.data is in text format
    const dataObj = {
      status: responseData[0], // sent or fail
      message: responseData[1], // success or invalid
      messageId: responseData[2],
      clientId: responseData[3],
      phoneNumber: responseData[4]
  };



    if(dataObj.status==='sent' && dataObj.message==='success'){

      res.json({ success: true, message: "OTP sent successfully" });
    }else{
      res.status(400).json({success:false, message:dataObj?.message})
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};





// route for verifying the OTP and creating a new user

// exports.verifyOTP = async (req, res) => {
//   const { phoneNumber, referralCode, otp } = req.body;
//   const isValid = await verifyOTP(phoneNumber, otp);

  
//   if (isValid) {
//     try {
//       // Check if user exists
//       let user;
//       user = await User.findOne({ phoneNumber });

//       if (!user) {
//         // If user doesn't exist, create a new one
//         user = new User({
//           phoneNumber,
//           email: null
//         });


//         await user.save();
//       }

//       // Generate new tokens
//       const { accessToken, refreshToken } = generateTokens(user?._id);


//       // Update refresh token in database
//       user.refreshToken = refreshToken;
//       await user.save();

//       // Set refresh token in HTTP-only cookie
//       res.cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: true,
//         sameSite: "none",
//         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//       });


//       res.status(201).json({
//         accessToken,
//         user: {
//           id: user?._id,
//           firstName: user?.firstName || '',
//           lastName: user?.lastName || '',
//           email: user?.email || '',
//           phoneNumber: user?.phoneNumber || '',
//           cart: user?.cart || [],
//           addresses: user?.addresses || [],
//         },
//       });
//     } catch (error) {
//       res
//         .status(500)
//         .json({ message: "Error creating user", error: error.message });

//     }
//   } else {
//     res.status(400).json({ success: false, message: "Invalid OTP" });
//   }
// };


exports.verifyOTP = async (req, res) => {
  const { phoneNumber, referralCode, otp } = req.body;
  const isValid = await verifyOTP(phoneNumber, otp); // Assuming verifyOTP is a function that verifies OTP.

  if (isValid) {
    try {
      // Check if the user already exists by phone number
      let user = await User.findOne({ phoneNumber });

      if (!user) {
        // If user doesn't exist, create a new user

        // Create new user with a unique referral code
        const newReferralCode = generateUniqueCode(); // Generate a unique referral code for the new user
        user = new User({
          phoneNumber,
          referralCode: newReferralCode,  // Generate a unique referral code for the new user
          email: null,  // Assuming email is optional or handled elsewhere
        });

        // Only allow referral code use for new users
        if (referralCode) {
          const referrer = await User.findOne({ referralCode, });

          if (referrer) {
            // Link the new user to the referrer
            user.referredBy = referrer.referralCode;

           // Create immediate coupon for referred user
           const referredCoupon = await createReferralCoupon(user._id, 'referred');

           user.referralCoupons.push({
             couponId: referredCoupon._id,
             type: 'referred',
             isUsed: false
           });

          } else {
            return res.status(400).json({ message: "Invalid referral code." });
          }
        }

        // Save the new user to the database
        await user.save();
      } else {
        // If the user already exists, ignore the referral code
        if (referralCode) {
          return res.status(400).json({ message: "Referral code can only be used during registration." });
        }
      }

      // Generate new tokens for the user (for both new and existing users)
      const { accessToken, refreshToken } = generateTokens(user._id);

      // Update refresh token in the database
      user.refreshToken = refreshToken;
      await user.save();

      // Set refresh token in an HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Respond with the user data and tokens
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
      console.error(error);
      res.status(500).json({ message: "Error creating user", error: error.message });
    }
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
};



// for NEXT JS
exports.verifyOTPNew = async (req, res) => {
  const { phoneNumber, referralCode, otp } = req.body;
  const isValid = await verifyOTP(phoneNumber, otp); // Assuming verifyOTP is a function that verifies OTP.

  if (isValid) {
    try {
      const formatedPhoneNumber=`+91${phoneNumber}`
      // Check if the user already exists by phone number
      let user = await User.findOne({ phoneNumber:formatedPhoneNumber });

      if (!user) {
        // If user doesn't exist, create a new user

        // Create new user with a unique referral code
        const newReferralCode = generateUniqueCode(); // Generate a unique referral code for the new user
        user = new User({
          phoneNumber:formatedPhoneNumber,
          referralCode: newReferralCode,  // Generate a unique referral code for the new user
          email: null,  // Assuming email is optional or handled elsewhere
        });

        // Only allow referral code use for new users
        if (referralCode) {
          const referrer = await User.findOne({ referralCode, });

          if (referrer) {
            // Link the new user to the referrer
            user.referredBy = referrer.referralCode;

           // Create immediate coupon for referred user
           const referredCoupon = await createReferralCoupon(user._id, 'referred');

           user.referralCoupons.push({
             couponId: referredCoupon._id,
             type: 'referred',
             isUsed: false
           });

          } else {
            return res.status(400).json({ message: "Invalid referral code." });
          }
        }

        // Save the new user to the database
        await user.save();
      } else {
        // If the user already exists, ignore the referral code
        if (referralCode) {
          return res.status(400).json({ message: "Referral code can only be used during registration." });
        }
      }

      // Generate new tokens for the user (for both new and existing users)
      const { accessToken, refreshToken } = generateTokens(user._id);

      // Update refresh token in the database
      user.refreshToken = refreshToken;
      await user.save();

      // Set refresh token in an HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge:  1 * 60 * 60 * 1000, // 7 days
      });

      // Respond with the user data and tokens
      res.status(201).json({
        success: true,
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
      console.error(error);
      res.status(500).json({ message: "Error creating user", error: error.message });
    }
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
};