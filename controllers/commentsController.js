const Comment = require('../models/Comment');
const Post = require('../models/Post');

// Create a new comment (protected)
const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;

        // Validate text
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ msg: 'Text is required' });
        }

        // Validate text length (max 300 characters for comments)
        if (text.length > 300) {
            return res.status(400).json({ msg: 'Comment must be 300 characters or less' });
        }

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Sanitize text
        const sanitizedText = text.trim();

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
        console.error('Create comment error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ msg: 'Invalid post ID' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get comments for a post (public)
const getComments = async (req, res) => {
    try {
        const { postId } = req.params;

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Get comments sorted by creation date (oldest first)
        const comments = await Comment.find({ post: postId })
            .populate('user', 'id name avatar')
            .sort({ createdAt: 1 });

        res.status(200).json(comments);

    } catch (error) {
        console.error('Get comments error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ msg: 'Invalid post ID' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

// Edit comment (protected - owner only)
const editComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        // Validate text
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ msg: 'Text is required' });
        }

        if (text.length > 300) {
            return res.status(400).json({ msg: 'Comment must be 300 characters or less' });
        }

        // Find comment
        const comment = await Comment.findById(id);
        
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Check ownership
        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied. You can only edit your own comments' });
        }

        // Update comment
        comment.text = text.trim();
        comment.edited = true;
        await comment.save();

        // Return updated comment with populated user
        const updatedComment = await Comment.findById(comment._id)
            .populate('user', 'id name avatar');

        res.status(200).json(updatedComment);

    } catch (error) {
        console.error('Edit comment error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ msg: 'Invalid comment ID' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

// Delete comment (protected - owner only)
const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;

        // Find comment
        const comment = await Comment.findById(id);
        
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Check ownership
        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied. You can only delete your own comments' });
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
        console.error('Delete comment error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ msg: 'Invalid comment ID' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = {
    createComment,
    getComments,
    editComment,
    deleteComment
};