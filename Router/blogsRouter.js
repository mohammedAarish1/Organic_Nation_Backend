const express = require("express");
const router = express.Router();


const {
    getAllBlogs,
    getSingleBlog,
    getAllRecipes,
    getSingleRecipe
} = require("../Handler/blogsHandler.js");

router.get("/", getAllBlogs);
router.get("/:id", getSingleBlog);
router.get("/posts", getAllRecipes);
router.get("/:id", getSingleRecipe);



module.exports = router;
