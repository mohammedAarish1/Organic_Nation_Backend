const Products = require("../models/Products");
const User = require("../models/User");

exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }

    res.json({
      success: true,
      message: "Added to wishlist",
      wishlist: user.wishlist,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding to wishlist", error: error.message });
  }
};

exports.getAllWishlist = async (req, res) => {
  try { 
    const user = await User.findById(req.user._id).populate({
      path: "wishlist",
      select: "name img price discount weight name-url category-url",
    });

    const products = await Products.find({
      "name-url": { $in: user.wishlist },
    });

    res.json({
      wishlist: user.wishlist || [],
      wishlistProducts: products || [],
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching wishlist", error: error.message });
  }
};

// exports.getWishlistProductDetail=async(req,res)=>{
//     try {
//     const user = await User.findById(req.user._id);
//     if(!user){
//         res.status(404).json('User not found')
//     }
//     const products= await Products.find({'name-url':{$in:user.wishlist}})
//     res.json({ wishlist: products || [] });

//     } catch (error) {

//     }
// }

exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    await user.save();
    const products = await Products.find({
      "name-url": { $in: user.wishlist },
    });
    res.json({
      success: true,
      message: "Removed from wishlist",
      wishlist: user.wishlist || [],
      wishlistProducts: products || [],
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing from wishlist", error: error.message });
  }
};

exports.clearWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = [];
    await user.save();

    res.json({success:true, message: "Wishlist cleared" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error clearing wishlist", error: error.message });
  }
};
