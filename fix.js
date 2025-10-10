// const { mongoose } = require("mongoose");
// const Order = require("./models/Order.js");
// const Products = require('./models/Products.js');
// const User = require("./models/User.js");

// // const { ObjectId } = require('mongodb');
// // const fs = require("fs");


// // // x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x= database connection  x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x //

// mongoose.connect('mongodb+srv://aayushkapoor2001:aayush1415@cluster0.sj3vvpc.mongodb.net/Organic-Nation?retryWrites=true&w=majority&appName=Cluster0')
//     .then(() => {
//         console.log('Connected to MongoDB');
//     })
//     .catch((err) => {
//         console.error('Error connecting to MongoDB', err);

//     });


// // // x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x= END x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x //





// // // x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=  for udpating a JSON file x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x
// // // let data = JSON.parse(fs.readFileSync("product_add_info.json"));

// // // // Loop through each item
// // // data = data.map(item => {
// // //   // Rename features -> whyUs
// // //   item.whyUs = item.features;
// // //   // Add new empty features
// // //   item.features = [];
// // //   return item;
// // // });

// // // // Write back to file
// // // fs.writeFileSync("updated.json", JSON.stringify(data, null, 2));

// // // x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x= END x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x=x

// // // =============== ended updating json file





// // const countDoc = async () => {
// //     const orders = await Order.countDocuments({
// //         taxAmount: { $exists: false }
// //     })
// //     console.log('kength', orders)
// //     // for (let order of orders) {
// //     //     console.log('order number', order.orderNo)
// //     // }
// // }


// // const createUpdateOrderDetails = async (productNames) => {

// //     let updatedOrderDetails = [];
// //     for (let productName of productNames) {
// //         const product = await Products.findOne({ 'name-url': productName })
// //         // console.log('product', product)
// //         const orderItem = {
// //             returnInfo: { isItemReturned: false, returnedQuantity: 0 },
// //             id: new ObjectId(product._id),
// //             'name-url': productName,
// //             quantity: 0,
// //             weight: product.weight,
// //             tax: product.tax,
// //             hsnCode: product['hsn-code'],
// //             unitPrice: product.price,
// //             actualAmountPaid: 0,
// //             _id: new ObjectId()
// //         }

// //         updatedOrderDetails.push(orderItem)
// //     }
// //     console.log('updatedOrderDetails', updatedOrderDetails)
// // }


// // const updateDoc = async () => {

// //     const orderNo = 'ON1747997994434'
// //     const updatedOrderDetails = [
// //         {
// //             returnInfo: { isItemReturned: false, returnedQuantity: 0 },
// //             id: new ObjectId('672c90fd6582a38d3147804c'),
// //             'name-url': 'Rolled-Oats',
// //             quantity: 1,
// //             weight: '600 gm',
// //             tax: 5,
// //             hsnCode: 11041200,
// //             unitPrice: 249,
// //             actualAmountPaid: 236,
// //             _id: new ObjectId('6830552af487d23a598eb40b')
// //         },
// //         {
// //             returnInfo: { isItemReturned: false, returnedQuantity: 0 },
// //             id: new ObjectId('672c90fd6582a38d3147802e'),
// //             'name-url': 'Pizza-Seasoning',
// //             quantity: 1,
// //             weight: '80 gm',
// //             tax: 5,
// //             hsnCode: '9109100',
// //             unitPrice: 149,
// //             actualAmountPaid: 142,
// //             _id: new ObjectId()
// //         },
// //         {
// //             returnInfo: { isItemReturned: false, returnedQuantity: 0 },
// //             id: new ObjectId('6815b9e5d7f80311249e72ae'),
// //             'name-url': 'Himalayan-Rock-Salt-Granules-(500g)',
// //             quantity: 1,
// //             weight: '500 gm',
// //             tax: 0,
// //             hsnCode: '25010020',
// //             unitPrice: 75,
// //             actualAmountPaid: 71,
// //             _id: new ObjectId()
// //         },
// //         {
// //             returnInfo: { isItemReturned: false, returnedQuantity: 0 },
// //             id: new ObjectId('68d12c7b10e7b1ef6d6a158c'),
// //             'name-url': 'Organic-Brown-Sugar',
// //             quantity: 1,
// //             weight: '500 gm',
// //             tax: 5,
// //             hsnCode: '17019990',
// //             unitPrice: 99,
// //             actualAmountPaid: 94,
// //             _id: new ObjectId()
// //         }
// //     ]



// //     await Order.findOneAndUpdate(
// //         { orderNo },
// //         {
// //             orderDetails: updatedOrderDetails,
// //             _lastModified: new Date()
// //         });

// //     console.log('successfully updated')
// // }


// // const updateProductTax = async () => {
// //     const updateResult = await Products.updateMany(
// //         { category: 'Seasonings & Herbs' },  // Filter for products in the 'electronics' category
// //         {
// //             $set: { tax: 5 },  // Set the new tax value
// //         }
// //     );

// //     console.log(`Matched ${updateResult.matchedCount} documents`)
// // }


// // async function updateSingleOrderNameUrl() {
// //     try {
// //         // Find the document first
// //         const order = await Order.findById('66b82654d915be1781c4703f');

// //         if (!order) {
// //             console.log('Order not found');
// //             return null;
// //         }

// //         // Update the name-url field in orderDetails array
// //         order.orderDetails.forEach(detail => {
// //             if (detail['name-url']) {
// //                 detail['name-url'] = detail['name-url'].toLowerCase();
// //             }
// //         });
// //         // Save the updated document
// //         const result = await order.save();
// //         console.log('Single document updated successfully');
// //         console.log('result', result)
// //         // return result;

// //     } catch (error) {
// //         console.error('Error updating single document:', error);
// //         throw error;
// //     }
// // }


// // async function updateAllOrdersNameUrl() {
// //     try {
// //         // Find all orders
// //         const orders = await Order.find({});
// //         console.log(`Found ${orders.length} orders to update`);

// //         let updatedCount = 0;

// //         // Process each order
// //         for (const order of orders) {
// //             let hasChanges = false;

// //             // Update name-url in each orderDetail
// //             order.orderDetails.forEach(detail => {
// //                 if (detail['name-url']) {
// //                     const original = detail['name-url'];
// //                     console.log('name', original)
// //                     //   detail['name-url'] = detail['name-url'].toLowerCase();
// //                     //   if (original !== detail['name-url']) {
// //                     //     hasChanges = true;
// //                     //   }
// //                 }
// //             });

// //             //   Save only if there are changes
// //             //   if (hasChanges) {
// //             //     await order.save();
// //             //     updatedCount++;
// //             //   }
// //         }

// //         console.log(`Updated ${updatedCount} document(s)`);
// //         // return { modifiedCount: updatedCount };

// //     } catch (error) {
// //         console.error('Error updating all documents:', error);
// //         throw error;
// //     }
// // }

// // async function updateProductNameurl() {
// //     try {
// //         // Find all orders
// //         const products = await Products.find({});
// //         console.log(`Found ${products.length} orders to update`);

// //         let updatedCount = 0;


// //         // products.forEach(p=>{
// //         //     console.log('name', p['name-url'])
// //         // })

// //         // Process each order
// //         for (const product of products) {
// //             let hasChanges = false;

// //             // Update name-url in each orderDetail

// //             if (product['name-url']) {
// //                 const original = product['name-url'];
// //                 product['name-url'] = product['name-url'].toLowerCase();
// //                 console.log('name', product['name-url'])
// //                 if (original !== product['name-url']) {
// //                     hasChanges = true;
// //                 }
// //             }


// //             //   Save only if there are changes
// //             if (hasChanges) {
// //                 await product.save();
// //                 updatedCount++;
// //             }
// //         }

// //         console.log(`Updated ${updatedCount} document(s)`);
// //         // return { modifiedCount: updatedCount };

// //     } catch (error) {
// //         console.error('Error updating all documents:', error);
// //         throw error;
// //     }
// // };



// // const updateSingleUserCart = async () => {
// //     try {
// //         const userId = '66d69d43cf5081d29f7dbc53'
// //         const user = await User.findById(userId)

// //         if (!user) {
// //             console.log('no user found')
// //             return;
// //         }

// //         // Check if user has cart and items
// //         if (!user.cart || !user.cart.items || user.cart.items.length === 0) {
// //             console.log('User has no cart items');
// //             return null;
// //         }

// //         // Prepare update operations for each cart item's productName
// //         const updateOperations = {};
// //         let hasUpdates = false;

// //         user.cart.items.forEach((item, index) => {
// //             if (item.productName) {
// //                 const lowerCaseProductName = item.productName.toLowerCase();
// //                 if (item.productName !== lowerCaseProductName) {
// //                     updateOperations[`cart.items.${index}.productName`] = lowerCaseProductName;
// //                     hasUpdates = true;
// //                 }
// //             }
// //         });

// //         if (!hasUpdates) {
// //             console.log('No productName fields need updating');
// //             return null;
// //         }


// //         // Direct update without triggering validation on entire document
// //         const result = await User.findByIdAndUpdate(
// //             userId,
// //             { $set: updateOperations },
// //             {
// //                 new: true,
// //                 // runValidators: false  // Skip validation
// //             }
// //         );

// //         console.log(`Single user updated successfully. Updated ${Object.keys(updateOperations).length} productName fields.`);
// //         // return result;

// //     } catch (error) {

// //     }
// // }


// // async function updateAllUsersProductName() {
// //     try {
// //         // Get all users with cart items
// //         const users = await User.find({
// //             'cart.items': { $exists: true, $ne: [] }
// //         }).lean();

// //         console.log(`Found ${users.length} users with cart items to check`);

// //         const bulkOperations = [];
// //         let totalUpdates = 0;

// //         users.forEach(user => {
// //             const updateOperations = {};
// //             let hasUpdates = false;

// //             if (user.cart && user.cart.items) {
// //                 user.cart.items.forEach((item, index) => {
// //                     if (item.productName) {
// //                         const lowerCaseProductName = item.productName.toLowerCase();
// //                         if (item.productName !== lowerCaseProductName) {
// //                             updateOperations[`cart.items.${index}.productName`] = lowerCaseProductName;
// //                             hasUpdates = true;
// //                             totalUpdates++;
// //                         }
// //                     }
// //                 });
// //             }

// //             if (hasUpdates) {
// //                 bulkOperations.push({
// //                     updateOne: {
// //                         filter: { _id: user._id },
// //                         update: { $set: updateOperations }
// //                     }
// //                 });
// //             }
// //         });

// //         if (bulkOperations.length === 0) {
// //             console.log('No users need productName updates');
// //             return { modifiedCount: 0, totalFieldsUpdated: 0 };
// //         }

// //         // Execute bulk update - bypasses validation
// //         const result = await User.bulkWrite(bulkOperations);
// //         console.log(`Bulk update completed: ${result.modifiedCount} user document(s) modified`);
// //         console.log(`Total productName fields updated: ${totalUpdates}`);

// //         return {
// //             modifiedCount: result.modifiedCount,
// //             totalFieldsUpdated: totalUpdates
// //         };

// //     } catch (error) {
// //         console.error('Error in bulk update:', error);
// //         throw error;
// //     }
// // }


// // const getUserCart = async () => {
// //     try {
// //         const users = await User.find({})
// //         for (let user of users) {
// //             if (user.cart.items.length !== 0) {
// //                 user.cart.items.forEach(item => {
// //                     console.log(user.phoneNumber, item.productName)
// //                 })
// //             } else {
// //                 console.log(user.phoneNumber, 'cart-is-empty')
// //             }

// //         }
// //     } catch (error) {

// //     }
// // }


// // const checkOrderURLcase = async () => {
// //     const orders = await Order.find({})

// //     for (let o of orders) {

// //         o.orderDetails.forEach(i => {
// //             if (i['name-url'] === i['name-url'].toLowerCase()) {
// //                 console.log('TRUE...', i['name-url'])
// //             } else {
// //                 console.log('FALSE', i['name-url'],o.orderNo)
// //             }
// //         })

// //     }
// // }

// // const checkProdURLcase = async () => {
// //     const products = await Products.find({})

// //     for (let p of products) {
// //         if (p['name-url'] === p['name-url'].toLowerCase()) {
// //             console.log('TRUE...', p['name-url'])
// //         } else {
// //             console.log('FALSE', p['name-url'])
// //         }
// //     }
// // }


// // const checkCartURLcase = async () => {
// //     const users = await User.find({})

// //     for (let user of users) {

// //         user.cart.items.forEach(i => {
// //             if (i.productName === i.productName.toLowerCase()) {
// //                 console.log('TRUE...', i.productName)
// //             } else {
// //                 console.log('FALSE', i.productName,i.phoneNumber)
// //             }
// //         })

// //     }
// // }



// // checkProdURLcase()
// // checkCartURLcase()
// // checkOrderURLcase()
// // // checkURLcase()
// // // getUserCart()
// // // updateAllUsersProductName()
// // // updateSingleUserCart()
// // // updateProductNameurl()

// // // updateAllOrdersNameUrl()
// // // updateSingleOrderNameUrl()
// // // updateProductTax()
// // // updateDoc()
// // // countDoc()
// // // createUpdateOrderDetails(['Italian-Seasoning', 'Pizza-Seasoning'])
// // // createUpdateOrderDetails(['Pizza-Seasoning', 'African-Peri-Peri', 'Chilli-Flakes'])
// // // createUpdateOrderDetails(['Rolled-Oats', 'Pizza-Seasoning', 'Himalayan-Rock-Salt-Granules-(500g)', 'Organic-Brown-Sugar'])
