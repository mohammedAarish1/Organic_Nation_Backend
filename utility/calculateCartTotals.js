
// const ELIGIBLE_CATEGORIES = ['Homestyle Pickles', 'Organic Honey', 'Chutney & Dip', 'Fruit Preserves', 'Oats', 'Vegan'];

// const calculateTotals = async (cartItems) => {
//   let totalEligibleAmount = 0;
//   let totalCartAmount = 0;
//   let eligibleItems = [];


//   // Calculate amounts for each item
//   for (const product of cartItems) {
//     try {
//       // if (!product) continue;
//       const discountedPrice = product.price * (1 - product.discount / 100);
//       const itemSubtotal = discountedPrice * product.quantity;

//       totalCartAmount += itemSubtotal;
//       // Check if item is eligible for progressive discount
//       if (ELIGIBLE_CATEGORIES.includes(product.category) && product.price >= 249) {
//         totalEligibleAmount += itemSubtotal;
//         eligibleItems.push({
//           productName: product.name,
//           category: product.category,
//           amount: itemSubtotal,
//           quantity: product.quantity
//         });
//       }
//     } catch (error) {
//       console.error(`Error fetching product ${product.name}:`, error);
//     }
//   }

//   // Determine discount based on conditions
//   let discountPercentage = 0;
//   let discountType = '0%';
//   let discountAmount = 0;

//   // Check for 30% discount (cart value >= 1999)
//   if (totalCartAmount >= 1999) {
//     discountPercentage = 30;
//     discountType = '30%';
//     discountAmount = Math.round(totalCartAmount * 0.30);
//   }
//   // Check for 20% discount (eligible items >= 499)
//   else if (totalEligibleAmount >= 499) {
//     discountPercentage = 20;
//     discountType = '20%';
//     discountAmount = Math.round(totalEligibleAmount * 0.20);
//   }
//   // Check for 10% discount (eligible items >= 199)
//   else if (totalEligibleAmount >= 199) {
//     discountPercentage = 10;
//     discountType = '10%';
//     discountAmount = Math.round(totalEligibleAmount * 0.10);
//   }



//   // calculation of total tax amount
//   let totalTax = cartItems.reduce((total, product) => {
//     let discount;

//     eligibleItems.forEach(item => {
//       if (item.productName === product.name) {
//         discount = discountPercentage;
//       } else {
//         discount = product.discount
//       }
//     })
//     const discountedPrice = product.price * (1 - discount / 100);
//     const totalAmountWithTax = discountedPrice * product.quantity;

//     // Calculate the amount without tax
//     const amountWithoutTax = totalAmountWithTax / (1 + product.tax / 100);

//     // Calculate the tax amount
//     const taxAmount = totalAmountWithTax - amountWithoutTax;

//     return Math.round(total + taxAmount);
//   }, 0);
//   // calculation of total tax amount ended =======



//   return {
//     totalCartAmount,
//     totalEligibleAmount,
//     eligibleItems,
//     discountType,
//     discountPercentage,
//     discountAmount,
//     finalAmount: totalCartAmount - discountAmount,
//     totalTax,
//     progressInfo: {
//       currentEligibleAmount: totalEligibleAmount,
//       currentCartAmount: totalCartAmount,
//       nextThreshold: getNextThreshold(totalEligibleAmount, totalCartAmount),
//       nextDiscountType: getNextDiscountType(totalEligibleAmount, totalCartAmount)
//     }
//   };
// };

// const getNextThreshold = (eligibleAmount, cartAmount) => {
//   if (cartAmount >= 1999) return null;
//   if (eligibleAmount >= 499) return 1999;
//   if (eligibleAmount >= 199) return 499;
//   return 199;
// };

// const getNextDiscountType = (eligibleAmount, cartAmount) => {
//   if (cartAmount >= 1999) return null;
//   if (eligibleAmount >= 499) return '30%';
//   if (eligibleAmount >= 199) return '20%';
//   return '10%';
// };

// module.exports = { calculateTotals }


const ELIGIBLE_CATEGORIES = ['Homestyle Pickles', 'Organic Honey', 'Chutney & Dip', 'Fruit Preserves', 'Oats', 'Vegan'];

const calculateTotals = async (cartItems) => {
  let totalMRP = 0; // Total MRP (product.price * quantity)
  let totalAfterBaseDiscount = 0; // Total after applying base product discounts
  let totalEligibleMRP = 0; // MRP of eligible items only
  let eligibleItems = [];

  // Calculate MRP and base discounted totals
  for (const product of cartItems) {
    try {
      const itemMRP = product.price * product.quantity;
      const baseDiscountedPrice = product.price * (1 - product.discount / 100);
      const itemAfterBaseDiscount = baseDiscountedPrice * product.quantity;

      totalMRP += itemMRP;
      totalAfterBaseDiscount += itemAfterBaseDiscount;

      // Check if item is eligible for progressive discount
      if (ELIGIBLE_CATEGORIES.includes(product.category) && product.price >= 233) {
        totalEligibleMRP += itemMRP;
        eligibleItems.push({
          productName: product.name,
          category: product.category,
          mrp: itemMRP,
          quantity: product.quantity,
          baseDiscount: product.discount
        });
      }
    } catch (error) {
      console.error(`Error processing product ${product.name}:`, error);
    }
  }

  // Determine progressive discount tier based on total MRP
  let progressiveDiscount = 0;
  let discountType = '';
  let progressiveDiscountAmount = 0;

  if (totalMRP >= 1999) {
    progressiveDiscount = 30;
    discountType = '30% OFF';
    progressiveDiscountAmount = Math.round(totalEligibleMRP * 0.30);
  } else if (totalEligibleMRP >= 499) {
    progressiveDiscount = 20;
    discountType = '20% OFF';
    progressiveDiscountAmount = Math.round(totalEligibleMRP * 0.20);
  }

  // Calculate final amounts and tax
  let finalAmount = 0;
  let totalTax = 0;
  let totalDiscountAmount = 0;

  if (progressiveDiscount > 0) {
    // Progressive discount applies - calculate from MRP
    finalAmount = totalMRP - progressiveDiscountAmount;
    totalDiscountAmount = progressiveDiscountAmount;

    // Calculate tax on final discounted amount
    for (const product of cartItems) {
      const itemFinalPrice = product.price * (1 - progressiveDiscount / 100);
      const itemTotal = itemFinalPrice * product.quantity;
      const priceBeforeTax = itemTotal / (1 + product.tax / 100);
      const taxAmount = itemTotal - priceBeforeTax;
      totalTax += taxAmount;
    }
  } else {
    // Only base discount applies
    finalAmount = totalAfterBaseDiscount;
    totalDiscountAmount = totalMRP - totalAfterBaseDiscount;

    // Calculate tax on base discounted amount
    for (const product of cartItems) {
      const baseDiscountedPrice = product.price * (1 - product.discount / 100);
      const itemTotal = baseDiscountedPrice * product.quantity;
      const priceBeforeTax = itemTotal / (1 + product.tax / 100);
      const taxAmount = itemTotal - priceBeforeTax;
      totalTax += taxAmount;
    }
  }

  totalTax = Math.round(totalTax);
  return {
    totalCartAmount: totalMRP, // Total MRP before any discounts
    totalEligibleAmount: totalEligibleMRP,
    eligibleItems,
    discountType,
    discountPercentage: progressiveDiscount || 'Base',
    discountAmount: totalDiscountAmount,
    finalAmount: Math.round(finalAmount),
    totalTax,
    progressInfo: {
      // currentMRP: totalMRP,
      currentCartAmount: totalMRP,
      // currentEligibleMRP: totalEligibleMRP,
      currentEligibleAmount: totalEligibleMRP,
      nextThreshold: getNextThreshold(totalMRP),
      nextDiscountType: getNextDiscountType(totalMRP),
      amountToNext: getAmountToNext(totalMRP)
    }
  };
};

const getNextThreshold = (totalMRP) => {
  if (totalMRP >= 1999) return null;
  if (totalMRP >= 499) return 1999;
  return 499;
};

const getNextDiscountType = (totalMRP) => {
  if (totalMRP >= 1999) return null;
  if (totalMRP >= 499) return '30% OFF';
  return '20% OFF';
};

const getAmountToNext = (totalMRP) => {
  if (totalMRP >= 1999) return 0;
  if (totalMRP >= 499) return 1999 - totalMRP;
  return 499 - totalMRP;
};

module.exports = { calculateTotals };