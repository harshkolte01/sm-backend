const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ msg: 'No token' });
        }

        // Check if it's Bearer token format
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ msg: 'Token invalid' });
        }

        // Extract token (remove 'Bearer ' prefix)
        const token = authHeader.substring(7);

        if (!token) {
            return res.status(401).json({ msg: 'No token' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user info to request
        req.user = { id: decoded.userId };
        
        next();
    } catch (error) {
        // Handle token verification errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token invalid' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Token invalid' });
        }
        
        // Generic token error
        return res.status(401).json({ msg: 'Token invalid' });
    }
};

module.exports = auth;