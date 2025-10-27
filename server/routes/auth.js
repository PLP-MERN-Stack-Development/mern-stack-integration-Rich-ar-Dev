const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// GET /api/auth - simple info
router.get('/', (req, res) => {
	res.json({
		success: true,
		message: 'Auth routes: POST /register, POST /login, GET /me (protected)'
	});
});

// GET /api/auth/me - returns current user (requires Bearer token)
router.get('/me', auth, authController.getMe);

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

module.exports = router;
