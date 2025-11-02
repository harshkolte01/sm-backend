const User = require('../models/User');
const Post = require('../models/Post');
const { sanitizeName, sanitizeBio } = require('../utils/sanitizer');
const { AppError } = require('../middleware/errorHandler');

// Get user profile (public)
const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find user by ID, excluding passwordHash
        const user = await User.findById(id).select('-passwordHash');
        
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // Get recent post count for this user
        const postCount = await Post.countDocuments({ user: id });

        // Return public user info
        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            createdAt: user.createdAt,
            postCount
        });

    } catch (error) {
        next(error);
    }
};

// Update user profile (protected - owner only)
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, avatar, bio } = req.body;

        // Check if the authenticated user is the owner
        if (req.user.id !== id) {
            return next(new AppError('Access denied. You can only update your own profile', 403));
        }

        // Find user by ID
        const user = await User.findById(id);
        
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // Sanitize and update fields if provided
        if (name !== undefined) {
            const sanitizedName = sanitizeName(name);
            if (!sanitizedName) {
                return next(new AppError('Name cannot be empty', 400));
            }
            user.name = sanitizedName;
        }
        if (avatar !== undefined) user.avatar = avatar;
        if (bio !== undefined) {
            user.bio = sanitizeBio(bio);
        }

        // Save updated user
        await user.save();

        // Return updated user info (excluding passwordHash)
        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });

    } catch (error) {
        next(error);
    }
};

// Get user's posts (protected - only own posts visible on profile)
const getUserPosts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // For profile posts, user can only see their own posts
        // If not authenticated or not viewing own profile, return empty
        if (!req.user || req.user.id !== id) {
            return res.status(200).json({
                posts: [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 0,
                    pages: 0
                }
            });
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get user's posts with pagination
        const posts = await Post.find({ user: id })
            .populate('user', 'id name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Get total count for pagination info
        const total = await Post.countDocuments({ user: id });

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

module.exports = {
    getUser,
    updateUser,
    getUserPosts
};