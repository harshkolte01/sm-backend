const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { sanitizePostText } = require('../utils/sanitizer');
const { AppError } = require('../middleware/errorHandler');

// Create a new post (protected)
const createPost = async (req, res, next) => {
    try {
        const { text, image } = req.body;

        // Validate required fields
        if (!text || text.trim().length === 0) {
            return next(new AppError('Text is required', 400));
        }

        // Validate text length (max 500 characters)
        if (text.length > 500) {
            return next(new AppError('Text must be 500 characters or less', 400));
        }

        // Sanitize text for XSS protection
        const sanitizedText = sanitizePostText(text);
        if (!sanitizedText) {
            return next(new AppError('Text is required', 400));
        }

        // Create new post
        const post = new Post({
            user: req.user.id,
            text: sanitizedText,
            image: image || undefined
        });

        await post.save();

        // Populate user info and return
        const populatedPost = await Post.findById(post._id)
            .populate('user', 'id name avatar');

        res.status(201).json(populatedPost);

    } catch (error) {
        next(error);
    }
};

// Get all posts (public with pagination and filtering)
const getPosts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, userId } = req.query;
        
        // Build query
        const query = {};
        if (userId) {
            query.user = userId;
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get posts with pagination
        const posts = await Post.find(query)
            .populate('user', 'id name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Get total count for pagination info
        const total = await Post.countDocuments(query);

        res.status(200).json({
            posts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        next(error);
    }
};

// Get single post by ID (public)
const getPost = async (req, res, next) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id)
            .populate('user', 'id name avatar');

        if (!post) {
            return next(new AppError('Post not found', 404));
        }

        res.status(200).json(post);

    } catch (error) {
        next(error);
    }
};

// Edit post (protected - owner only)
const editPost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        // Validate text
        if (!text || text.trim().length === 0) {
            return next(new AppError('Text is required', 400));
        }

        if (text.length > 500) {
            return next(new AppError('Text must be 500 characters or less', 400));
        }

        // Find post
        const post = await Post.findById(id);
        
        if (!post) {
            return next(new AppError('Post not found', 404));
        }

        // Check ownership
        if (post.user.toString() !== req.user.id) {
            return next(new AppError('Access denied. You can only edit your own posts', 403));
        }

        // Sanitize and update post
        const sanitizedText = sanitizePostText(text);
        if (!sanitizedText) {
            return next(new AppError('Text is required', 400));
        }
        
        post.text = sanitizedText;
        post.edited = true;
        await post.save();

        // Return updated post with populated user
        const updatedPost = await Post.findById(post._id)
            .populate('user', 'id name avatar');

        res.status(200).json(updatedPost);

    } catch (error) {
        next(error);
    }
};

// Delete post (protected - owner only)
const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find post
        const post = await Post.findById(id);
        
        if (!post) {
            return next(new AppError('Post not found', 404));
        }

        // Check ownership
        if (post.user.toString() !== req.user.id) {
            return next(new AppError('Access denied. You can only delete your own posts', 403));
        }

        // Delete all comments associated with this post
        await Comment.deleteMany({ post: id });

        // Delete post
        await Post.findByIdAndDelete(id);

        res.status(200).json({ msg: 'Post removed' });

    } catch (error) {
        next(error);
    }
};

// Toggle like on post (protected)
const toggleLike = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find post
        const post = await Post.findById(id);
        
        if (!post) {
            return next(new AppError('Post not found', 404));
        }

        // Check if user already liked the post
        const likeIndex = post.likes.indexOf(userId);
        
        if (likeIndex > -1) {
            // Unlike - remove user from likes array
            post.likes.splice(likeIndex, 1);
        } else {
            // Like - add user to likes array
            post.likes.push(userId);
        }

        await post.save();

        res.status(200).json({
            likesCount: post.likes.length,
            liked: likeIndex === -1 // true if we just liked it
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPost,
    getPosts,
    getPost,
    editPost,
    deletePost,
    toggleLike
};