const Blog = require('../models/Blogs/Blog');
const Recipe = require('../models/Blogs/Recipe');
const mongoose = require('mongoose');



// Get all blogs
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find();
        if (!blogs || blogs.length === 0) {
            return res.status(404).json({ message: 'No blogs found' });
        }
        res.json(blogs);
    } catch (error) {
        // console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// Get a single blog
// Get blog by ID
exports.getSingleBlog = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid blog ID' });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json(blog);
    } catch (error) {
        // console.error('Error fetching blog by ID:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid blog ID format' });
        }
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}



// Get all recipes
exports.getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find();
        if (!recipes || recipes.length === 0) {
            return res.status(404).json({ message: 'No recipes found' });
        }
        res.json(recipes);
    } catch (error) {
        // console.error('Error fetching recipes:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}



// Get recipe by ID
exports.getSingleRecipe = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid recipe ID' });
        }

        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        res.json(recipe);
    } catch (error) {
        // console.error('Error fetching recipe by ID:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid recipe ID format' });
        }
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}


