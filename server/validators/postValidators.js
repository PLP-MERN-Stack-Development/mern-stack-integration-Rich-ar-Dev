const { check } = require('express-validator');

const createPostValidators = [
  check('title').notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title max 100 chars'),
  check('content').notEmpty().withMessage('Content is required'),
  check('category').notEmpty().withMessage('Category is required'),
  // author should be provided — but allow omission when request is authenticated
  // (createPost handler sets author from req.user when present)
  check('author')
    .custom((value, { req }) => {
      if (req && req.user && req.user.id) return true
      return !!value
    })
    .withMessage('Author is required'),
];

const updatePostValidators = [
  check('title').optional().isLength({ max: 100 }).withMessage('Title max 100 chars'),
  check('content').optional(),
  check('category').optional(),
];

module.exports = {
  createPostValidators,
  updatePostValidators,
};
