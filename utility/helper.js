const jwt = require('jsonwebtoken');
const Products = require('../models/Products');
const OTP = require('../models/OTP');
const { default: axios } = require('axios');
const { default: mongoose } = require('mongoose');

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
      addressObj.mainAddress,
      addressObj.optionalAddress,
      addressObj.city,
      addressObj.state,
      addressObj.pinCode,
      addressObj.country
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

module.exports = { verifyOTP, generateTokens, address, updateStock, extractWeight, removeExtraSpaces, sendOrderConfirmationMsg };
