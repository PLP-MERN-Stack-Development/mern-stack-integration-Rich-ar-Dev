const Category = require('../models/Category');

// GET /api/categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    // If DB is unreachable in development, return a small fallback list so the client can function.
    console.error('Categories fetch failed:', err.message || err);
    if (process.env.NODE_ENV !== 'production') {
      const fallback = [
        { _id: 'cat-dev-1', name: 'General' },
        { _id: 'cat-dev-2', name: 'Announcements' },
        { _id: 'cat-dev-3', name: 'Tech' },
      ];
      return res.json({ success: true, data: fallback });
    }
    next(err);
  }
};

// POST /api/categories
exports.createCategory = async (req, res, next) => {
  try {
    const existing = await Category.findOne({ name: req.body.name });
    if (existing) return res.status(400).json({ success: false, error: 'Category already exists' });

    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};
