const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const auth = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return next(new AppError('No token', 401));
        }

        // Check if it's Bearer token format
        if (!authHeader.startsWith('Bearer ')) {
            return next(new AppError('Token invalid', 401));
        }

        // Extract token (remove 'Bearer ' prefix)
        const token = authHeader.substring(7);

        if (!token) {
            return next(new AppError('No token', 401));
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user info to request
        req.user = { id: decoded.userId };
        
        next();
    } catch (error) {
        // JWT verification errors will be handled by the error handler
        next(error);
    }
};

module.exports = auth;