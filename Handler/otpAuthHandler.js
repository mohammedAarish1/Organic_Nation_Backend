// const { PublishCommand } = require("@aws-sdk/client-sns");
// const { snsClient } = require("../config/awsConfig");
// const jwt = require("jsonwebtoken");
const OTP = require("../models/OTP");
const User = require("../models/User");
const {generateTokens, verifyOTP} = require("../utility/helper");
const { default: axios } = require("axios");

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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
//     console.log("otp", otp);
//     // const data = await snsClient.send(new PublishCommand(params));

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
//     res.status(500).json({ success: false, message: "Failed to send OTP" });
//   }
// };

exports.sendOTP = async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    res
      .status(400)
      .json({ success: false, message: "Phone number is required" });
  }

  const otp = generateOTP();
  await OTP.create({ phoneNumber, otp, createdAt: new Date() });

  // ============ for testing 

  // console.log('otp', otp);
  // res.json({ success: true, message: "OTP sent successfully" });

  // for testing ====================

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





// routes

exports.verifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;
  const isValid = await verifyOTP(phoneNumber, otp);

  if (isValid) {
    try {
      // Check if user exists
      let user;
      user = await User.findOne({ phoneNumber });

      if (!user) {
        // If user doesn't exist, create a new one
        user = new User({
          phoneNumber,
          email:null
        });


        await user.save();
      }

      // Generate new tokens
      const { accessToken, refreshToken } = generateTokens(user?._id);


      // Update refresh token in database
      user.refreshToken = refreshToken;
      await user.save();

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });


      res.status(201).json({
        accessToken,
        user: {
          id: user?._id,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phoneNumber: user?.phoneNumber || '',
          cart: user?.cart || [],
          addresses: user?.addresses || [],
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating user", error: error.message });

    }
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
};
