const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

// GET /api/categories
router.get('/', categoriesController.getCategories);

// POST /api/categories
router.post('/', categoriesController.createCategory);

module.exports = router;
