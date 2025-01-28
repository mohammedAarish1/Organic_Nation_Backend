// const { default: mongoose } = require('mongoose');
const Order = require('../../models/Order.js'); // Import the Order model



// Helper function to get the current financial year in '2024-25' format
function getFinancialYear() {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // Month is 0-indexed

    if (month >= 4) {
      // From April to December, financial year is current year to next year (e.g., 2024-25)
      return `${year}-${(year + 1).toString().slice(2)}`;
    } else {
      // From January to March, financial year is previous year to current year (e.g., 2023-24)
      return `${year - 1}-${year.toString().slice(2)}`;
    }
  } catch (error) {
    throw new InvoiceGenerationError('Failed to generate financial year: ' + error.message);
  }
};


async function getLastInvoiceNumber(currentFinancialYear) {
  try {
    // First, get all orders for the current financial year
    const orders = await Order.find({
      invoiceNumber: { $regex: `^ON/${currentFinancialYear}` }
    }).exec();

    if (!orders || orders.length === 0) {
      return 0;
    }

    // Extract and compare numbers numerically
    const maxNumber = Math.max(...orders.map(order => {
      const parts = order.invoiceNumber.split('/');
      return parseInt(parts[2], 10);
    }));

    return maxNumber;
  } catch (error) {
    throw error
  }
}

async function generateInvoiceNumber() {
  try {
    const currentFinancialYear = getFinancialYear();

    // Get the last invoice number using our new method
    const lastNumber = await getLastInvoiceNumber(currentFinancialYear);


    // Generate the new invoice number
    const newNumber = lastNumber + 1;
    const newInvoiceNumber = `ON/${currentFinancialYear}/${newNumber}`;

    return newInvoiceNumber;
  } catch (error) {
    throw error;
  }
}


// for droping unique index in the database
// const dropUniqueindex=async()=>{
//   try {
//     await mongoose.model('Order').collection.dropIndex('invoiceNumber_1');
//   } catch (error) {
//     if (error.code !== 27) { // Error code 27 means index doesn't exist
//       console.error('Error dropping index:', error);
//     }
//   }
// }


module.exports = {
  generateInvoiceNumber,
};
