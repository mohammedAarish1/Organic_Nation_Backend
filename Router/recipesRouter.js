const express = require("express");
const router = express.Router();


const {
    getAllRecipes,
    getSingleRecipe
} = require("../Handler/blogsHandler.js");

router.get("/", getAllRecipes);
router.get("/:id", getSingleRecipe);



module.exports = router;
