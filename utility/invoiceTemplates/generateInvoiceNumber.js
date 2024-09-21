const Order = require('../../models/Order.js'); // Import the Order model



// Helper function to get the current financial year in '2024-25' format
function getFinancialYear() {
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
}



async function generateInvoiceNumber() {
    const currentFinancialYear = getFinancialYear();
  

  
    const lastOrder = await Order.findOne({
        invoiceNumber: { $regex: `^ON/${currentFinancialYear}` },
      })
        .sort({ invoiceNumber: -1 }) // Sort by invoiceNumber in descending order
        .exec();

  
    let newInvoiceNumber;
  
    if (lastOrder) {
      const lastInvoiceNumber = lastOrder.invoiceNumber;
  
      const lastNumber = parseInt(lastInvoiceNumber.split('/')[2], 10);
  
      const newNumber = (lastNumber + 1).toString().padStart(2, '0');
      newInvoiceNumber = `ON/${currentFinancialYear}/${newNumber}`;
    } else {
      newInvoiceNumber = `ON/${currentFinancialYear}/01`;
    }
  
    return newInvoiceNumber;
  }
  

module.exports = {
    generateInvoiceNumber,
};
