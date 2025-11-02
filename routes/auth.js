const express = require('express');
const { signup, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', auth, getMe);

module.exports = router;