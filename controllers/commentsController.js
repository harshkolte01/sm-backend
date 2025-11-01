const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { sanitizeCommentText } = require('../utils/sanitizer');
const { AppError } = require('../middleware/errorHandler');

// Create a new comment (protected)
const createComment = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;

        // Validate text
        if (!text || text.trim().length === 0) {
            return next(new AppError('Text is required', 400));
        }

        // Validate text length (max 300 characters for comments)
        if (text.length > 300) {
            return next(new AppError('Comment must be 300 characters or less', 400));
        }

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return next(new AppError('Post not found', 404));
        }

        // Sanitize text for XSS protection
        const sanitizedText = sanitizeCommentText(text);
        if (!sanitizedText) {
            return next(new AppError('Text is required', 400));
        }

        // Create new comment
        const comment = new Comment({
            post: postId,
            user: req.user.id,
            text: sanitizedText
        });

        await comment.save();

        // Increment post comments count
        post.commentsCount = (post.commentsCount || 0) + 1;
        await post.save();

        // Populate user info and return
        const populatedComment = await Comment.findById(comment._id)
            .populate('user', 'id name avatar');

        res.status(201).json(populatedComment);

    } catch (error) {
        next(error);
    }
};

// Get comments for a post (public)
const getComments = async (req, res, next) => {
    try {
        const { postId } = req.params;

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return next(new AppError('Post not found', 404));
        }

        // Get comments sorted by creation date (oldest first)
        const comments = await Comment.find({ post: postId })
            .populate('user', 'id name avatar')
            .sort({ createdAt: 1 });

        res.status(200).json(comments);

    } catch (error) {
        next(error);
    }
};

// Edit comment (protected - owner only)
const editComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        // Validate text
        if (!text || text.trim().length === 0) {
            return next(new AppError('Text is required', 400));
        }

        if (text.length > 300) {
            return next(new AppError('Comment must be 300 characters or less', 400));
        }

        // Find comment
        const comment = await Comment.findById(id);
        
        if (!comment) {
            return next(new AppError('Comment not found', 404));
        }

        // Check ownership
        if (comment.user.toString() !== req.user.id) {
            return next(new AppError('Access denied. You can only edit your own comments', 403));
        }

        // Sanitize and update comment
        const sanitizedText = sanitizeCommentText(text);
        if (!sanitizedText) {
            return next(new AppError('Text is required', 400));
        }
        
        comment.text = sanitizedText;
        comment.edited = true;
        await comment.save();

        // Return updated comment with populated user
        const updatedComment = await Comment.findById(comment._id)
            .populate('user', 'id name avatar');

        res.status(200).json(updatedComment);

    } catch (error) {
        next(error);
    }
};

// Delete comment (protected - owner only)
const deleteComment = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find comment
        const comment = await Comment.findById(id);
        
        if (!comment) {
            return next(new AppError('Comment not found', 404));
        }

        // Check ownership
        if (comment.user.toString() !== req.user.id) {
            return next(new AppError('Access denied. You can only delete your own comments', 403));
        }

        // Get the post to decrement comments count
        const post = await Post.findById(comment.post);
        
        // Delete comment
        await Comment.findByIdAndDelete(id);

        // Decrement post comments count if post still exists
        if (post && post.commentsCount > 0) {
            post.commentsCount = post.commentsCount - 1;
            await post.save();
        }

        res.status(200).json({ msg: 'Comment removed' });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createComment,
    getComments,
    editComment,
    deleteComment
};