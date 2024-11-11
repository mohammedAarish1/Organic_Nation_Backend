const User = require("../models/User");
const Products = require("../models/Products.js");
const Coupon = require("../models/Coupon.js");
// const jwt = require('jsonwebtoken');
// const mongoose = require('mongoose');

exports.validateCouponCode = async (req, res) => {
  const { phoneNumber, couponCode } = req.body;
  try {
    if (!phoneNumber) {
      return res.status(400).json({ error: "Please log in to apply coupon code" });
    }

    // 1. Find user
    const user = await User.findOne({ phoneNumber, });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.cart.couponCodeApplied.length !== 0) {
      return res.status(404).json({ error: "Not Applicable" });
    }

    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) {
      return res.status(400).json({ error: "Invalid coupon code" });
    }

    if (!["Friends", "Family", "Employee"].includes(user.role)) {
      return res
        .status(403)
        .json({ error: "User not authorized for this discount" });
    }

    // 2. Validate coupon 
    const validCoupon = coupon.code;
    if (validCoupon !== couponCode) {
      return res.status(400).json({ error: "Invalid coupon code" });
    }

    for (const item of user.cart.items) {
      if (item.productName.toLowerCase().includes('combo')) {
        return res.status(400).json({ error: "Coupon not applicable on combo products" });
      }
    }

    // 3. Retrieve products
    // const productIds = user.cart.items.map(item => mongoose.Types.ObjectId(item.productId));
    const productIds = user.cart.items.map((item) => item.productId);

    const products = await Products.find({ _id: { $in: productIds } });

    // 4. Calculate totals
    let subtotalIncludingTax = 0;
    let totalTax = 0;

    const updatedItems = user.cart.items.map((item) => {
      const product = products.find(
        (p) => p._id.toString() === item.productId.toString()
      );

      if (!product) {
        throw new Error(`Product not found for item ${item.productId}`);
      }

      if (
        typeof product.price !== "number" ||
        typeof product.tax !== "number"
      ) {
        throw new Error(`Invalid product data for item ${item.productId}`);
      }

      const quantity = item.quantity;
      const basePrice = product.price * quantity;
      const discountedPrice = basePrice * 0.55; // 45% discount
      const taxAmount = discountedPrice * (product.tax / (100 + product.tax)); // reverse calclulations

      subtotalIncludingTax += discountedPrice; // this will include tax
      totalTax += taxAmount;

      return;
    });

    //  prepare coupon code object
    const couponCodeInfo = { id: coupon._id, name: coupon.name };

    // 6. Update user's cart
    // user.cart.items = updatedItems;
    user.cart.totalCartAmount = Math.round(subtotalIncludingTax);
    user.cart.totalTaxes = Math.round(totalTax);
    user.cart.couponCodeApplied.push(couponCodeInfo);

    await user.save();

    // 8. Prepare response

    const response = {
      message: "Coupon Code Applied Successfully",
      couponCodeApplied: user.cart.couponCodeApplied,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in coupon validation:", error);
    res.status(500).json({
      error: error.message || "An error occurred during coupon validation",
    });
  }
};

// exports.applyPickleCouponCode = async (req, res) => {
//   try {
//     const { userEmail, couponCode } = req.body;

//     const coupon = await Coupon.findOne({ code: couponCode });

//     // Verify coupon code
//     if (!coupon) {
//       return res.status(400).json({ error: "Invalid coupon code" });
//     }

//     // Verify coupon code
//     if (couponCode !== coupon.code) {
//       return res.status(400).json({ error: "Invalid coupon code" });
//     }

//     // Find user and populate cart
//     const user = await User.findOne({ email: userEmail }).populate(
//       "cart.items.productId"
//     );
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Check if coupon is already applied
//     // if (user.isPickleCouponApplied()) {
//     //   return res.status(400).json({ error: "Coupon has already been applied" });
//     // }

//     const { cart } = user;

//     // Check if user has selected at least four pickles (considering quantity)
//     const pickleItems = cart.items.filter((item) =>
//       item.productName.includes("Pickle")
//     );
//     const totalPickleQuantity = pickleItems.reduce(
//       (sum, item) => sum + item.quantity,
//       0
//     );

//     if (totalPickleQuantity < 4) {
//       return res.status(400).json({
//         error: "Please select at least four pickles to apply the coupon",
//       });
//     }

//     // Get full product details
//     const products = await Promise.all(
//       cart.items.map((item) => Products.findById(item.productId))
//     );

//     // Prepare for discount calculation
//     const pickleProducts = products.filter((product) =>
//       product.category.includes("Pickles")
//     );
//     let discountedPickles = [];
//     let remainingPickleQuantity = 4;

//     // Sort pickle products by price (highest to lowest)
//     pickleProducts.sort((a, b) => a.price - b.price);

//     for (const pickle of pickleProducts) {
//       const cartItem = cart.items.find(
//         (item) => item.productId.toString() === pickle._id.toString()
//       );
//       const quantityToDiscount = Math.min(
//         cartItem.quantity,
//         remainingPickleQuantity
//       );

//       discountedPickles.push({
//         ...pickle.toObject(),
//         quantityDiscounted: quantityToDiscount,
//         quantityRegular: cartItem.quantity - quantityToDiscount,
//       });

//       remainingPickleQuantity -= quantityToDiscount;
//       if (remainingPickleQuantity === 0) break;
//     }

//     const pickleTotal = discountedPickles.reduce(
//       (sum, pickle) => sum + pickle.price * pickle.quantityDiscounted,
//       0
//     );
//     const discountAmount = pickleTotal - 999;
//     const discountPercentage = (discountAmount / pickleTotal) * 100;

//     // Calculate new cart totals
//     let totalCartAmount = 0;
//     let totalTaxes = 0;

//     cart.items.forEach((item) => {
//       const product = products.find(
//         (p) => p._id.toString() === item.productId.toString()
//       );
//       let itemPrice = product.price * item.quantity;
//       let discountedPrice = itemPrice;

//       if (product.category.includes("Pickles")) {
//         const discountedPickle = discountedPickles.find(
//           (p) => p._id.toString() === product._id.toString()
//         );
//         if (discountedPickle) {
//           // Apply coupon discount to the discounted quantity
//           const couponDiscountedAmount =
//             discountedPickle.price *
//             discountedPickle.quantityDiscounted *
//             (discountPercentage / 100);
//           // Apply regular product discount to the remaining quantity
//           const regularDiscountedAmount =
//             discountedPickle.price *
//             discountedPickle.quantityRegular *
//             (product.discount / 100);
//           discountedPrice =
//             itemPrice - couponDiscountedAmount - regularDiscountedAmount;
//         } else {
//           // For pickles not part of the coupon discount, apply regular product discount
//           discountedPrice = itemPrice - (itemPrice * product.discount) / 100;
//         }
//       } else {
//         // For non-pickle products, apply regular product discount
//         discountedPrice = itemPrice - (itemPrice * product.discount) / 100;
//       }

//       const taxAmount = (discountedPrice * product.tax) / (100 + product.tax);
//       totalCartAmount += discountedPrice;
//       totalTaxes += taxAmount;
//     });

//     // Apply the coupon
//     //  user.applyPickleCoupon();

//     // prepare coupon code object
//     const couponCodeInfo = { id: coupon._id, name: coupon.name };

//     // Update user's cart
//     user.cart.totalCartAmount = Math.round(totalCartAmount);
//     user.cart.totalTaxes = Math.round(totalTaxes);
//     user.cart.couponCodeApplied.push(couponCodeInfo);

//     await user.save();

//     res.json({
//       message: "Coupon applied successfully",
//       totalCartAmount: user.cart.totalCartAmount,
//       totalTaxes: user.cart.totalTaxes,
//       isCouponCodeApplied: true,
//     });
//   } catch (error) {
//     console.error("Error applying coupon:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// exports.applyPickleCouponCode = async (req, res) => {
//   const { userEmail, cart, couponCode } = req.body;
//   try {
//     // Validate coupon code
//     let user;
//     if (userEmail) {
//       user =await User.findOne({ email: userEmail });
//     }
//     const validCouponCode = process.env.PICKLE_COUPON_CODE;
//     if (couponCode !== validCouponCode) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid coupon code",
//       });
//     }

//     // Fetch full product details from database
//     const productIds = cart.map((item) => item.productId);
//     const products = await Products.find({ _id: { $in: productIds } });

//     // Create a map for easy lookup
//     const productMap = products.reduce((acc, product) => {
//       acc[product._id.toString()] = product;
//       return acc;
//     }, {});

//     let totalPickles = 0;
//     let pickleItems = [];
//     let otherItems = [];

//     // Separate pickle items and other items, count total pickles
//     cart.forEach((cartItem) => {
//       const product = productMap[cartItem.productId.toString()];
//       if (product.name.toLowerCase().includes("pickle")) {
//         totalPickles += cartItem.quantity;
//         pickleItems.push({ ...cartItem, product });
//       } else {
//         otherItems.push({ ...cartItem, product });
//       }
//     });

//     // Check if user has selected at least 4 pickles
//     if (totalPickles < 4) {
//       return res.status(400).json({
//         success: false,
//         message: "Please select at least four pickles to avail the offer",
//       });
//     }

//     const PICKLE_SET_PRICE = 999;
//     const pickleSets = Math.floor(totalPickles / 4);
//     let remainingPickles = totalPickles % 4;

//     let totalCartAmount = pickleSets * PICKLE_SET_PRICE;
//     let totalTaxes = 0;

//     // Calculate tax for pickle sets
//     const pickleSetTaxRate = 12; // Assuming 12% tax for pickle sets, adjust if necessary
//     const pickleSetTaxAmount =
//       (PICKLE_SET_PRICE * pickleSets * pickleSetTaxRate) /
//       (100 + pickleSetTaxRate);
//     totalTaxes += pickleSetTaxAmount;

//     // Process remaining pickles
//     let remainingPickleAmount = 0;
//     for (let i = 0; i < remainingPickles; i++) {
//       const pickleItem = pickleItems[i];
//       const discountedPrice =
//         pickleItem.product.price * (1 - pickleItem.product.discount / 100);
//       remainingPickleAmount += discountedPrice;
//     }
//     totalCartAmount += remainingPickleAmount;

//     // Calculate tax for remaining pickles
//     const remainingPickleTaxAmount =
//       (remainingPickleAmount * pickleSetTaxRate) / (100 + pickleSetTaxRate);
//     totalTaxes += remainingPickleTaxAmount;

//     // Process other items
//     otherItems.forEach((item) => {
//       const { product, quantity } = item;
//       const discountedPrice = product.price * (1 - product.discount / 100);
//       const itemTotal = discountedPrice * quantity;
//       totalCartAmount += itemTotal;

//       // Calculate tax
//       const preTaxAmount = itemTotal / (1 + product.tax / 100);
//       const taxAmount = itemTotal - preTaxAmount;
//       totalTaxes += taxAmount;
//     });

//     // Round the final amounts
//     totalCartAmount = Math.round(totalCartAmount * 100) / 100;
//     totalTaxes = Math.round(totalTaxes * 100) / 100;


//     if(user){
//       user.cart.totalCartAmount=Math.round(totalCartAmount)
//       user.cart.totalTaxes=Math.round(totalTaxes)
//       user.cart.isCouponCodeApplied=true

//       await user.save();
//       // console.log('user',user)
//       res.json({
//         success: true,
//         message: "Coupon applied successfully",
//         data:null
//       });
//     }else{
//       res.json({
//         success: true,
//         message: "Coupon applied successfully",
//         data: {
//           totalCartAmount,
//           totalTaxes,
//           // pickleSets,
//           // remainingPickles,
//           isCouponCodeApplied: true,
//         },
//       });
//     }

//   } catch (error) {
//     console.error("Error in applyPickleCouponCode:", error);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred while processing the coupon code",
//     });
//   }
// };

// test


exports.applyPickleCouponCode = async (req, res) => {
  try {
    const { cart, phoneNumber, couponCode } = req.body;

    // Find the coupon in the database
    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) {
      return res.status(400).json({ error: "Invalid coupon code" });
    }


    if (cart.couponCodeApplied.length !== 0) {
      return res.status(404).json({ error: "Not eligible" });
    }

    // Calculate total quantity of pickles
    // const totalQuantityOfPickles = cart.items.reduce((total, item) => {
    //   if (item.productName.toLowerCase().includes("pickle")) {
    //     return total + item.quantity;
    //   }
    //   return total;
    // }, 0);
    const totalQuantityOfPickles = cart.items.reduce((total, item) => {
      const productName = item.productName.toLowerCase();
      if (productName.includes("pickle") && !productName.includes("combo")) {
        return total + item.quantity;
      }
      return total;
    }, 0);

    if (totalQuantityOfPickles < 4) {
      return res
        .status(400)
        .json({ error: "Minimum 4 pickles required to apply this coupon" });
    }

    // Find user if userEmail is provided
    let user = null;
    if (phoneNumber) {
      user = await User.findOne({ phoneNumber: phoneNumber });
    }

    const PRICE_FOR_PICKEL_SETS = 999;
    const taxRateOnPickle = 12;
    // Get full product details and create pickle array
    const pickleArray = [];
    for (const item of cart.items) {
      const product = await Products.findOne({'name-url':item.productName});
      if (!product) {
        return res
          .status(400)
          .json({ error: `Product not found: ${item.productName}` });
      }
      if (product.category.toLowerCase().includes("pickle")) {
        pickleArray.push({
          ...product.toObject(),
          quantity: item.quantity,
        });
      }
    }

    // Sort pickle array by price in ascending order
    pickleArray.sort((a, b) => a.price - b.price);

    // Extract pickles in multiples of 4
    let discountedPickles = [];
    let remainingQuantity = Math.floor(totalQuantityOfPickles / 4) * 4;
    let totalPickleSets = remainingQuantity / 4;

    for (const pickle of pickleArray) {
      if (remainingQuantity <= 0) break;
      const quantityToAdd = Math.min(pickle.quantity, remainingQuantity);
      discountedPickles.push({
        ...pickle,
        quantity: quantityToAdd,
      });
      remainingQuantity -= quantityToAdd;
    }

    // calculate the totalAmount and totalTaxes of pickles after regular discount that included for coupon discount
    let totalPickleAmount = discountedPickles.reduce((total, product) => {
      const discountedPrice = product.price * (1 - product.discount / 100);
      return Math.round(total + discountedPrice * product.quantity);
    }, 0);

    let totalPickleTax = discountedPickles.reduce((total, product) => {
      const discountedPrice = product.price * (1 - product.discount / 100);
      const totalAmountWithTax = discountedPrice * product.quantity;

      // Calculate the amount without tax
      const amountWithoutTax = totalAmountWithTax / (1 + product.tax / 100);

      // Calculate the tax amount
      const taxAmount = totalAmountWithTax - amountWithoutTax;

      return Math.round(total + taxAmount);
    }, 0);

    // calculate the new total price charged for pickle sets and included taxes
    const priceChargedForPickles = PRICE_FOR_PICKEL_SETS * totalPickleSets;
    const taxIncludedInNewPrice =
      (priceChargedForPickles * taxRateOnPickle) / (100 + taxRateOnPickle);
    // calculate the new totalCartAmount and newTotalTaxes
    const newTotalCartAmount =
      cart.totalCartAmount - totalPickleAmount + priceChargedForPickles;
    const newTotalTaxes =
      cart.totalTaxes - totalPickleTax + taxIncludedInNewPrice;


    //  prepare coupon code object
    const couponCodeInfo = { id: coupon._id, name: coupon.name };
    cart.couponCodeApplied.push(couponCodeInfo)
    if (user) {
      user.cart.totalCartAmount = newTotalCartAmount,
        user.cart.totalTaxes = newTotalTaxes,
        user.cart.couponCodeApplied = cart.couponCodeApplied

      await user.save();
    }

    return res.json({
      success: true,
      totalCartAmount: newTotalCartAmount,
      totalTax: newTotalTaxes,
      couponCodeApplied: cart.couponCodeApplied,
      message: "Coupon applied successfully",
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// =============================== additional 10%  coupon discount =================================
exports.applyAdditionalDiscountCoupon = async (req, res) => {
  try {
    const { cart, phoneNumber, couponCode } = req.body;
    if (cart.couponCodeApplied.length !== 0) {
      return res.status(404).json({ error: "Not eligible" });
    }

    let comboProductsTotal = 0;
    let comboProductsTax = 0;

    for (const item of cart.items) {
      const productName = item.productName.toLowerCase();
      if (productName.includes("combo")) {
        const product = await Products.findOne({ 'name-url': item.productName });
        const discountAmount = Math.round(product.price * product.discount / 100);
        const priceAfterDiscount = product.price - discountAmount;

        // Calculate tax amount
        const taxAmount = priceAfterDiscount - (priceAfterDiscount / (1 + product.tax / 100));


        comboProductsTotal += priceAfterDiscount * item.quantity;
        comboProductsTax += taxAmount * item.quantity;

      }
    }


    const discountableAmount = cart.totalCartAmount - comboProductsTotal
    const discountableTax = cart.totalTaxes - comboProductsTax

    if (discountableAmount < 1299) {
      return res.status(404).json({ error: "Add Products worth  1299 or more (Excluding Combo Products)" });

    }

    // Find the coupon in the database
    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) {
      return res.status(400).json({ error: "Invalid coupon code" });
    }

    const DISCOUNT_PERCENTAGE = 10

    //calculate additional discount
    const additionalDiscount = discountableAmount * DISCOUNT_PERCENTAGE / 100
    const additionalTaxDiscount = discountableTax * DISCOUNT_PERCENTAGE / 100

    //calculate new totalcartAmount and totalTaxes
    const newTotalCartAmount = cart.totalCartAmount - additionalDiscount;
    const newTotalTaxes = cart.totalTaxes - additionalTaxDiscount;
    // Find user if userEmail is provided
    let user = null;
    if (phoneNumber) {
      user = await User.findOne({ phoneNumber, });
    }



    //  prepare coupon code object
    const couponCodeInfo = { id: coupon._id, name: coupon.name };
    cart.couponCodeApplied.push(couponCodeInfo)

    if (user) {
      user.cart.totalCartAmount = newTotalCartAmount,
        user.cart.totalTaxes = newTotalTaxes,
        user.cart.couponCodeApplied = cart.couponCodeApplied

      await user.save();
    }

    return res.json({
      success: true,
      totalCartAmount: Math.round(newTotalCartAmount),
      totalTax: Math.round(newTotalTaxes),
      couponCodeApplied: cart.couponCodeApplied,
      message: "Coupon applied successfully",
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};



