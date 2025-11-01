const User = require('../models/User');
const Post = require('../models/Post');

// Get user profile (public)
const getUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Find user by ID, excluding passwordHash
        const user = await User.findById(id).select('-passwordHash');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
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
        console.error('Get user error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ msg: 'Invalid user ID' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update user profile (protected - owner only)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, avatar, bio } = req.body;

        // Check if the authenticated user is the owner
        if (req.user.id !== id) {
            return res.status(403).json({ msg: 'Access denied. You can only update your own profile' });
        }

        // Find user by ID
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update fields if provided
        if (name !== undefined) user.name = name;
        if (avatar !== undefined) user.avatar = avatar;
        if (bio !== undefined) user.bio = bio;

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
        console.error('Update user error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ msg: 'Invalid user ID' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = {
    getUser,
    updateUser
};