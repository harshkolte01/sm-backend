const express = require('express');
const { 
    createComment, 
    getComments, 
    editComment, 
    deleteComment 
} = require('../controllers/commentsController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/posts/:postId/comments - Create new comment (protected)
router.post('/posts/:postId/comments', auth, createComment);

// GET /api/posts/:postId/comments - Get comments for a post (public)
router.get('/posts/:postId/comments', getComments);

// PUT /api/comments/:id - Edit comment (protected, owner only)
router.put('/comments/:id', auth, editComment);

// DELETE /api/comments/:id - Delete comment (protected, owner only)
router.delete('/comments/:id', auth, deleteComment);

module.exports = router;