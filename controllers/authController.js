const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sanitizeName } = require('../utils/sanitizer');
const { AppError } = require('../middleware/errorHandler');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// Signup controller
const signup = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return next(new AppError('Name, email, and password are required', 400));
        }

        // Sanitize name
        const sanitizedName = sanitizeName(name);
        if (!sanitizedName) {
            return next(new AppError('Name is required', 400));
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new AppError('Invalid email format', 400));
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError('User already exists with this email', 400));
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create new user
        const user = new User({
            name: sanitizedName,
            email,
            passwordHash
        });

        await user.save();

        // Generate JWT token
        const token = generateToken(user._id);

        // Respond with token and user info (excluding passwordHash)
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            }
        });

    } catch (error) {
        next(error);
    }
};

// Login controller
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return next(new AppError('Email and password are required', 400));
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return next(new AppError('Invalid credentials', 400));
        }

        // Compare password with hash
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return next(new AppError('Invalid credentials', 400));
        }

        // Generate JWT token
        const token = generateToken(user._id);

        // Respond with token and user info (excluding passwordHash)
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    login
};