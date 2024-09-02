const User = require('../models/User');
const Products = require('../models/Products.js');
// const jwt = require('jsonwebtoken');
// const mongoose = require('mongoose');




exports.validateCouponCode = async (req, res) => {
    const { userEmail, couponCode } = req.body;
    try {
        // 1. Find user
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!['Friends', 'Family', 'Employee'].includes(user.role)) {
            return res.status(403).json({ error: 'User not authorized for this discount' });
        }

        // 2. Validate coupon
        const validCoupon = process.env.COUPON_CODE;
        if (validCoupon !== couponCode) {
            return res.status(400).json({ error: 'Invalid coupon code' });
        }

        // 3. Retrieve products
        // const productIds = user.cart.items.map(item => mongoose.Types.ObjectId(item.productId));
        const productIds = user.cart.items.map(item => item.productId);

        const products = await Products.find({ _id: { $in: productIds } });

        // 4. Calculate totals
        let subtotalIncludingTax = 0;
        let totalTax = 0;

        const updatedItems = user.cart.items.map(item => {
            const product = products.find(p => p._id.toString() === item.productId.toString());

            if (!product) {
                throw new Error(`Product not found for item ${item.productId}`);
            }

            if (typeof product.price !== 'number' || typeof product.tax !== 'number') {
                throw new Error(`Invalid product data for item ${item.productId}`);
            }

            const quantity = item.quantity;
            const basePrice = product.price * quantity;
            const discountedPrice = basePrice * 0.55; // 45% discount
            const taxAmount = discountedPrice * (product.tax / (100 + product.tax));  // reverse calclulations

           


            subtotalIncludingTax += discountedPrice;  // this will include tax
            totalTax += taxAmount;


            return
           
        });

       

        // 6. Update user's cart
        // user.cart.items = updatedItems;
        user.cart.totalCartAmount = Math.round(subtotalIncludingTax);
        user.cart.totalTaxes = Math.round(totalTax);
        user.cart.isCouponCodeApplied = true

        await user.save();

      


        // 8. Prepare response

        const response = {
            message: 'Coupon Code Applied Successfully'
        }

        res.json(response);
    } catch (error) {
        console.error('Error in coupon validation:', error);
        res.status(500).json({ error: error.message || 'An error occurred during coupon validation' });
    }
}