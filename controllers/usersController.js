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

module.exports = {
    getUser,
    updateUser
};