const express = require('express');
const {
    createPost,
    getPosts,
    getPost,
    editPost,
    deletePost,
    toggleLike,
    uploadImage,
    deleteImage,
    serveImage
} = require('../controllers/postsController');
const auth = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

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

// POST /api/posts/upload-image - Upload image (protected)
router.post('/upload-image', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new (require('../middleware/errorHandler').AppError)('File size too large. Maximum size is 5MB', 400));
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new (require('../middleware/errorHandler').AppError)('Unexpected field name. Use "image" as field name', 400));
      }
      return next(new (require('../middleware/errorHandler').AppError)('File upload error: ' + err.message, 400));
    }
    uploadImage(req, res, next);
  });
});

// DELETE /api/posts/delete-image/:fileName - Delete image (protected)
router.delete('/delete-image/:fileName', auth, deleteImage);

// GET /api/posts/image/:fileName - Serve image from MinIO (public)
router.get('/image/:fileName', serveImage);

module.exports = router;
