const errorHandler = (err, req, res, next) => {
    // Log error for debugging (in production, use proper logging service)
    if (process.env.NODE_ENV !== 'test') {
        console.error('Error:', {
            name: err.name,
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
            path: req.path,
            method: req.method
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: Object.values(err.errors).map(e => ({
                field: e.path,
                message: e.message,
                value: e.value
            }))
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0];
        return res.status(409).json({
            error: 'DUPLICATE_KEY',
            message: `${field || 'Resource'} already exists`,
            field
        });
    }

    // Mongoose cast error
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'INVALID_ID',
            message: `Invalid ${err.path}: ${err.value}`,
            field: err.path
        });
    }

    // MongoDB connection error
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
        return res.status(503).json({
            error: 'DATABASE_UNAVAILABLE',
            message: 'Database connection error, please try again later'
        });
    }

    // JWT errors (if using authentication)
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'INVALID_TOKEN',
            message: 'Invalid authentication token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'TOKEN_EXPIRED',
            message: 'Authentication token has expired'
        });
    }

    // Custom application errors
    if (err.isOperational) {
        return res.status(err.status || 400).json({
            error: err.error || 'APPLICATION_ERROR',
            message: err.message
        });
    }

    // Default error (don't leak error details in production)
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(err.status || 500).json({
        error: err.error || 'INTERNAL_SERVER_ERROR',
        message: isDevelopment ? err.message : 'Something went wrong',
        ...(isDevelopment && { stack: err.stack })
    });
};

// Custom error class for operational errors
class AppError extends Error {
    constructor(message, status = 400, error = 'APPLICATION_ERROR') {
        super(message);
        this.status = status;
        this.error = error;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = errorHandler;
module.exports.AppError = AppError;
