/**
 * Centralized error handler middleware
 * Catches all errors and returns consistent JSON responses
 */

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Invalid ID format';
        error = { message, statusCode: 400 };
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        error = { 
            message: 'Validation Error', 
            statusCode: 400,
            errors 
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token invalid';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token invalid';
        error = { message, statusCode: 401 };
    }

    // Custom application errors
    if (err.statusCode) {
        error = {
            message: err.message,
            statusCode: err.statusCode,
            errors: err.errors
        };
    }

    // Default to 500 server error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server Error';

    const response = { msg: message };
    
    // Add errors array if present
    if (error.errors && error.errors.length > 0) {
        response.errors = error.errors;
    }

    res.status(statusCode).json(response);
};

// Custom error class for application-specific errors
class AppError extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    errorHandler,
    AppError
};