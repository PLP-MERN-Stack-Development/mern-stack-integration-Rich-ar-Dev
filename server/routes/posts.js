const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const { createPostValidators, updatePostValidators } = require('../validators/postValidators');
const validateRequest = require('../middleware/validateRequest');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/posts
router.get('/', postsController.getPosts);

// GET /api/posts/mine - current user's posts
router.get('/mine', auth, postsController.getMyPosts);

// Search route (placed before :id to avoid collision)
router.get('/search', postsController.searchPosts);

// POST /api/posts/:id/comments
router.post('/:id/comments', auth, postsController.addComment);

// GET /api/posts/:id
router.get('/:id', postsController.getPost);

// POST /api/posts
router.post('/', auth, upload.single('image'), createPostValidators, validateRequest, postsController.createPost);

// PUT /api/posts/:id
router.put('/:id', auth, upload.single('image'), updatePostValidators, validateRequest, postsController.updatePost);

// DELETE /api/posts/:id
router.delete('/:id', auth, postsController.deletePost);

module.exports = router;
