const express = require('express');
const { 
    createPost, 
    getPosts, 
    getPost, 
    editPost, 
    deletePost, 
    toggleLike 
} = require('../controllers/postsController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/posts - Create new post (protected)
router.post('/', auth, createPost);

// GET /api/posts - Get all posts (public, with pagination and filtering)
router.get('/', getPosts);

// GET /api/posts/:id - Get single post (public)
router.get('/:id', getPost);

// PUT /api/posts/:id - Edit post (protected, owner only)
router.put('/:id', auth, editPost);

// DELETE /api/posts/:id - Delete post (protected, owner only)
router.delete('/:id', auth, deletePost);

// POST /api/posts/:id/like - Toggle like on post (protected)
router.post('/:id/like', auth, toggleLike);

module.exports = router;
