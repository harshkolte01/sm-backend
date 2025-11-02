const express = require('express');
const { getUser, updateUser, getUserPosts } = require('../controllers/usersController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id - Get user profile (public)
router.get('/:id', getUser);

// PUT /api/users/:id - Update user profile (protected, owner only)
router.put('/:id', auth, updateUser);

// GET /api/users/:id/posts - Get user's posts (protected, own posts only)
router.get('/:id/posts', auth, getUserPosts);

module.exports = router;