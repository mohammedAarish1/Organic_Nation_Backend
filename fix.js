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


// const fs = require('fs');

// // Method 1: Add same fields to all records
// function addFieldsToAll() {
//   // Read the JSON file
//   const data = JSON.parse(fs.readFileSync('Organic-Nation.reviews1.json', 'utf8'));
//   console.log('data.length', data.length)
//   // Add new fields to each record
//   const updatedData = data.map(item => ({
//     ...item,
//     // Add your new fields here
//     title:'',
//     verified: true,
//     images:[],
//     hasVideo:false,
//     videoUrl:null
//   }));
//   console.log('updatedData',updatedData[0])
//   // Write back to file
//   fs.writeFileSync('updated-reviews.json', JSON.stringify(updatedData, null, 2));
//   console.log(' Successfully added fields to all records!');
// }

// addFieldsToAll()


// for reviews
// // Read your JSON file
// const fs = require('fs');

// // Function to generate random date between two dates
// function randomDate(start, end) {
//   return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
// }

// // Read the JSON file
// const data = JSON.parse(fs.readFileSync('updated-reviews.json', 'utf8'));

// // Date range
// const startDate = new Date('2025-01-01');
// const endDate = new Date('2025-12-10');

// // Add createdAt and updatedAt to each object
// const updatedData = data.map(item => {
//   const createdAt = randomDate(startDate, endDate);
//   const updatedAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000); // updatedAt within 7 days of createdAt
  
//   return {
//     ...item,
//     createdAt: { $date: createdAt.toISOString() },
//     updatedAt: { $date: updatedAt.toISOString() }
//   };
// });

// // Write back to file
// fs.writeFileSync('updated-reviews-with-dates.json', JSON.stringify(updatedData, null, 2));

// console.log('Done! Check updated-reviews-with-dates.json');



// const seotitles=[
//     {
//         name:'garlic-pickle',
//         title:'Organic Nation Garlic Pickle - Lahsun Achari Twist | Homestyle Indian Pickle | Lahsun ka Achar | Authentic Traditional Taste | No Chemical Preservatives | 250g'
//     },
//     {
//         name:'ginger-pickle',
//         title:'Organic Nation Ginger Pickle – Adrak Achari Fusion | Homestyle Indian Pickle | Authentic Traditional Taste | No Preservatives | 250g'
//     },
//     {
//         name:'green-chilli-pickle',
//         title:'Organic Nation Green Chilli Pickle – Pahadi Hari Mirch | Homestyle Indian Pickle | Authentic Traditional Taste | No Preservatives | 250g'
//     },
//     {
//         name:'lemon-pickle',
//         title:'Organic Nation Lemon Pickle– Nimbu ka achar| Homestyle Taste with Traditional Recipe | Natural & Preservative-Free | Traditional Indian Achar | Tangy & Spicy Flavour 250g'
//     },
//     {
//         name:'mango-pickle',
//         title:'Organic Nation Mango Pickle – Desi Mango Delight | Homestyle Indian Pickle | Authentic Traditional Taste | No Preservatives | 250g'
//     },
//     {
//         name:'turmeric-pickle',
//         title:'Organic Nation Turmeric Pickle – Haldi Achari Fusion | Homestyle Indian Pickle | Authentic Traditional Taste | No Preservatives | 250g'
//     },
//     {
//         name:'mixed-pickle',
//         title:'Organic Nation Mixed Pickle – Desi Mixed pickle | Homestyle Indian Pickle | Authentic Traditional Taste | No Preservatives | 250g'
//     },
//     {
//         name:'lemon-chilli-pickle',
//         title:'Organic Nation Lemon Chilli Pickle - Nimbu Mirch Twist | Homestyle Taste with Traditional Recipe | Lemon & Green Chilli Achar | Authentic Indian Taste | No Preservatives | 250g'
//     },
//     {
//         name:'hing-ka-aam-pickle',
//         title:'Organic Nation Hing Ka Aam Pickle - Hing Mango Delight | Homestyle Indian Pickle | Authentic Traditional Taste | No Preservatives | 250g'
//     },
//     {
//         name:'sweet-mango-pickle',
//         title:'Organic Nation Sweet Mango Pickle - Chatpata Mango Pickle | Traditional Aam ka Meetha Achar | Made with Homestyle Mangoes & Spices | No Preservatives 300g'
//     },
//     {
//         name:'carrot-pickle',
//         title:'Organic Nation Carrot Pickle – Gajar Achari Twist | Homestyle Indian Pickle | Authentic Traditional Taste | No Preservatives | 250g'
//     },
//     {
//         name:'stuffed-red-chilli-pickle',
//         title:'Organic Nation Stuffed Red Chilli Pickle - Bharwan Lal Mirch |Homestyle Indian Pickle | Authentic Traditional Taste | No Preservatives | 250g'
//     },
//     {
//         name:'khatta-meetha-pickle',
//         title:'Organic Nation Gobhi Gajar Shalgam Pickle | Tangy Trio | Homestyle Indian Pickle | Authentic Traditional Taste | No Preservatives | 250g'
//     },
//     {
//         name:'sweet-lemon-pickle',
//         title:'Organic Nation Sweet Lemon Pickle - Khatta Meetha Nimbu | Homestyle Taste | Traditional Indian Style | No Preservatives | Metha Nimbu Achar | 300g'
//     },
//     {
//         name:'organic-light-flora-honey',
//         title:'Organic Nation Light Flora Honey | Raw & Unprocessed Honey | Natural Wildflower | Rich in Antioxidants | No Added Sugar | original & Pure Honey 325g'
//     },
//     {
//         name:'organic-wild-forest-honey',
//         title:'Organic Nation Wild Forest Honey – Raw Unprocessed & Natural Sweetener – Sourced from Wildflowers – Rich in Antioxidants – No Added Sugar 325g'
//     },
//     {
//         name:'organic-jamun-honey',
//         title:'Organic Nation Jamun Honey – Raw, Unprocessed, Natural Sweetener – Sourced from Wildflowers – Immunity Booster – No Added Sugar 325g'
//     },
//     {
//         name:'kashmir-honey',
//         title:'Organic Nation Kashmir Honey 325g – Pure, Unprocessed & Raw | Natural Immunity Booster | No Added Sugar | Rich in Antioxidants'
//     },
//     {
//         name:'seeds-&-cranberry-muesli',
//         title:''
//     },
//     {
//         name:'hazelnut-&-cocoa-muesli',
//         title:''
//     },
//     {
//         name:'figs-&-honey-muesli',
//         title:''
//     },
//     {
//         name:'protien-muesli',
//         title:''
//     },
//     {
//         name:'seeds-&-berries-granola',
//         title:''
//     },
//     {
//         name:'nuts-&-berries-granola',
//         title:''
//     },
//     {
//         name:'chilly-flakes',
//         title:'Organic Nation Chilly Flakes 60g | Spices for Pizza, Pasta & Salads | Natural, Sun-Dried & Flavorful | No Preservatives | Spicy Seasoning for Cooking & Garnishing'
//     },
//     {
//         name:'african-peri-peri',
//         title:'Organic Nation African Peri Peri 90g  | Authentic Spice Blend | Hot & Tangy Seasoning | Natural Ingredients | Perfect for Grilling, Cooking'
//     },
//     {
//         name:'mexican-seasoning',
//         title:'Organic Nation African Peri Peri 90g | Authentic Spice Blend | Hot & Tangy Seasoning | Natural Ingredients | Perfect for Grilling, Cooking'
//     },
//     {
//         name:'chinese-seasoning',
//         title:'' 
//     },
//     {
//         name:'pizza-seasoning',
//         title:'Organic Nation Pizza Seasoning 80g | Authentic Italian Herb Blend | Natural & Aromatic | Perfect for Pizza, Pasta, Garlic Bread'
//     },
//     {
//         name:'italian-seasoning',
//         title:'Organic Nation Italian Seasoning 90g | Premium Mixed Herbs for Pasta, Pizza, Sauces & Marinades'
//     },
//     {
//         name:'Pizza-Oregano',
//         title:'Organic Nation Oregano 50g | Dried Oregano Leaves | Natural & Aromatic Herb | Perfect for Pizza, Pasta, Salads'
//     },
//     {
//         name:'mixed-herbs',
//         title:''
//     },
//     {
//         name:'salt-and-pepper',
//         title:'Organic Nation Salt and Pepper 80g | Natural Seasoning | No Additives | Perfect for Cooking'
//     },
//     {
//         name:'basil',
//         title:'Organic Nation Basil Leaves 30g (pack of 2) | Premium Sun-Dried Basil for Italian, Thai & Continental Cooking'
//     },
//     {
//         name:'oregano',
//         title:''
//     },
//     {
//         name:'parsley',
//         title:''
//     },
//     {
//         name:'rosemary',
//         title:''
//     },
//     {
//         name:'thyme',
//         title:''
//     },
//     {
//         name:'ginger-powder',
//         title:''
//     },
//     {
//         name:'red-onion-powder',
//         title:'Organic Nation Red Onion Powder 125g | Natural, Pure & Dehydrated | Flavorful Seasoning for Cooking, Marinades & Snacks'
//     },
//     {
//         name:'garlic-powder',
//         title:'Organic Nation Garlic Powder 100g | Pure & Natural Dehydrated Garlic | Flavorful Spice for Seasoning, Cooking & Marinades'
//     },
//     {
//         name:'mix-fruit-conserve',
//         title:'Organic Nation MIXED FRUIT CONSERVE - JAM - Rich in Calcium, Iron and Magnesium - Low Sugar | No Preservatives | For family and kids 340 g'
//     },
//     {
//         name:'pineapple-conserve',
//         title:'Organic Nation Pineapple Conserve | No Preservatives | Rich Fruit Spread | Pure Natural | No Added Flavours | 340g'
//     },
//     {
//         name:'strawberry-conserve',
//         title:'Organic Nation Strawberry Conserve | No Preservatives | Rich Fruit Spread | Sugar Free | Pure Natural | No Added Flavours | 340g'
//     },
//     {
//         name:'orange-marmalade',
//         title:'Organic Nation Orange Marmalade | No Preservatives | Rich Fruit Spread | Pure Natural | No Added Flavours | 340g'
//     },
//     {
//         name:'chilli-garlic-dip',
//         title:'Organic Nation Chilli Garlic Dip | Homestyle Made with Red Chillies, Garlic & Aromatic Spices | No Added Preservatives, No Artificial Flavours | Traditional Recipe, 260g'
//     },
//     {
//         name:'mango-chutney',
//         title:'Organic Nation Mango Chutney 300g | Authentic Indian Sweet & Spicy Relish | Handcrafted with Fresh Mangoes & Natural Spices | No Preservatives | Perfect for Dips, Sandwiches & Curries'
//     },
//     {
//         name:'salsa-dip',
//         title:'Organic Nation Salsa Dip | Homestyle Made with Fresh Tomatoes, Herbs & Spices | No Added Preservatives, No Artificial Flavours | Traditional Recipe, 260g'
//     },
//     {
//         name:'sweet-tomato-chutney',
//         title:'Organic Nation Sweet Tomato Chutney 300g | Sweet & Tangy Indian Dip | Natural Ingredients | No Preservatives | Perfect for Snacks, Chaats & Curries'
//     },
//     {
//         name:'schezwan-dip',
//         title:'Organic Nation Schezwan Dip | Homestyle Made with Red Chillies, Garlic & Aromatic Spices | No Added Preservatives, No Artificial Flavours | Traditional Recipe, 260g'
//     },
//     {
//         name:'tamarind-chutney',
//         title:'Organic Nation Tamarind Chutney 300g | Sweet & Tangy Indian Dip | Natural Ingredients | No Preservatives | Imli ki Chutney'
//     },
//     {
//         name:'organic-green-tea',
//         title:''
//     },
//     {
//         name:'organic-lemon-ginger-green-tea',
//         title:''
//     },
//     {
//         name:'organic-classic-tulsi-green-tea',
//         title:''
//     },
//     {
//         name:'organic-masala-tea',
//         title:''
//     },
//     {
//         name:'organic-assam-tea',
//         title:''
//     },
//     {
//         name:'kashmiri-kahwa',
//         title:''
//     },
//     {
//         name:'lemon-honey-green-tea',
//         title:''
//     },
//     {
//         name:'chamomile-tea',
//         title:''
//     },
//     {
//         name:'black-salt',
//         title:''
//     },
//     {
//         name:'himalayan-rock-salt-granules-(500g)',
//         title:'Organic Nation Himalayan Rock Salt Granules 500g | Sendha Namak for Cooking & Detox | Natural Mineral Salt | Unrefined & Chemical-Free'
//     },
//     {
//         name:'himalayan-pink-rock-salt-powder-(200g)',
//         title:'Organic Nation Himalayan Rock Salt 200g – Natural Mineral-Rich Sendha Namak for Cooking | Salt Powder | Fasting & Detox – Pure & Natural, Non-Iodised, Unprocessed Salt – No Additives or Chemicals - Sprinkler Jar'
//     },
//     {
//         name:'himalayan-pink-rock-salt-powder-(500g)',
//         title:'Organic Nation Himalayan Pink Rock Salt Powder 500g | Fine Grain Mineral Salt for Cooking & Detox | Natural Sendha Namak | Pure, Unrefined, Chemical-Free'
//     },
//     {
//         name:'black-salt',
//         title:'Organic Nation Black Salt 150g (pack of 2) | Kala Namak | Natural Digestive Salt | Stone-Ground | Rich in Minerals | Ideal for Cooking, Chaats & Salads'
//     },
//     {
//         name:'organic-brown-sugar',
//         title:'Organic Nation Brown Sugar 500g | Chemical-Free Sweetener | Ideal for Baking, Tea, Coffee'
//     },
//     {
//         name:'organic-jaggery-powder',
//         title:'Organic Nation Jaggery Powder 500g | Natural Desi Gud for Cooking & Sweetening | Chemical-Free, Unrefined Sweetener'
//     },
//     {
//         name:'sunflower-oil',
//         title:''
//     },
//     {
//         name:'mustard-oil',
//         title:''
//     },
//     {
//         name:'steel-cut-oats',
//         title:'Organic Nation Steel Cut Oats 1kg | Whole Grain Oats | Gluten-Free | Healthy Breakfast'
//     },
//     {
//         name:'rolled-oats',
//         title:'Organic Nation Rolled Oats 600g | Whole Grain | High Protein & Fibre | Gluten-Free | Healthy Breakfast | Ideal for Overnight Oats, Smoothies & Baking | Vegan & Natural'
//     },
//     {
//         name:'instant-oats',
//         title:'Organic Nation Instant Oats 600g | Whole Grain | High Protein & Fibre | Gluten-Free | Healthy Breakfast | Ideal for Overnight Oats, Smoothies & Baking | Vegan & Natural'
//     },
//     {
//         name:'veg-soya-chaap',
//         title:'Organic Nation Veg Soya Chaap | High in Protein | Delicious and Nutritious 850g'
//     },   
//     {
//         name:'veg-soya-chaap',
//         title:'Organic Nation Veg Millets Chaap, 800g'
//     },   
//     {
//         name:'mustard-oil',
//         title:'Organic Nation Mustard Oil 1 Ltr | Cold Pressed | Pure & Natural |No Chemicals | Ideal for Cooking, Frying & Baking'
//     },   
//     {
//         name:'sunflower-oil',
//         title:'Organic Nation Sunflower Oil 1 Ltr | Cold Pressed | Pure & Natural | No Chemicals | Ideal for Cooking, Frying & Baking'
//     },   
//     {
//         name:'groundnut-oil',
//         title:'Organic Nation Groundnut Oil 1 Ltr | Cold Pressed | Pure & Natural | No Chemicals | Ideal for Cooking, Frying & Baking'
//     },   
// ]

// const updatetitle=async()=>{
//   try {
//     for (const update of seotitles) {
//       const result = await Products.updateOne(
//         { 'name-url': update.name },  // Find product by 'name' field
//         { $set: { title: update.title } } // Update the 'title' field
//       );

//       if (result.modifiedCount > 0) {
//         console.log(`Updated product: ${update.name} with title: ${update.title}`);
//       } else {
//         console.log(`No updates for product: ${update.name}`);
//       }
//     }
//   } catch (error) {
//     console.error('Error updating products:', error);
//   }
// }

// updatetitle()