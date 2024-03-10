const { getDb } = require("../Database.js");

exports.getCategories = async (req, res) => {
  try {
    const db = await getDb();
    const categories = await db
      .collection("Products")
      .find(
        {},
        {
          projection: {
            _id: 0,
            category: 1,
            "category-url": 1,
          },
        }
      )
      .toArray();

    const categoryValues = categories.map((doc) => doc.category);
    const uniqueCategoriesSet = new Set(categoryValues);
    const uniqueCategoriesArray = Array.from(uniqueCategoriesSet);

    res.send({ message: "done", categories: uniqueCategoriesArray });
  } catch (error) {
    console.log("Error", error);
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    // console.log(category);
    const db = await getDb();
    const categories = await db
      .collection("Products")
      .find({ "category-url": { $regex: new RegExp(`^${category}$`, "i") } })
      .toArray();

    res.send({ products: categories });
  } catch (error) {
    console.log("Error", error);
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = req.params.product;
    const db = await getDb();
    const productOne = await db
      .collection("Products")
      .find({
        "name-url": product,
      })
      .toArray();
    res.send({ product: productOne });
  } catch (error) {
    console.log("Error", error);
  }
};

exports.allProducts = async (req, res) => {
  try {
    const product = req.params.product;
    const db = await getDb();
    const productOne = await db.collection("Products").find({}).toArray();
    res.send({ product: productOne });
  } catch (error) {
    console.log("Error", error);
  }
};
