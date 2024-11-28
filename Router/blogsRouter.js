const express = require("express");
const router = express.Router();


const {
    getAllBlogs,
    getSingleBlog,
    getAllRecipes,
    getSingleRecipe
} = require("../Handler/blogsHandler.js");

router.get("/", getAllBlogs);
router.get("/:titleUrl", getSingleBlog);
router.get("/posts", getAllRecipes);
router.get("/recipes/:titleUrl", getSingleRecipe);



module.exports = router;
