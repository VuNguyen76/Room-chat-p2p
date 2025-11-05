// Simple in-memory rate limiter
// For production, use Redis-based solution like express-rate-limit with Redis store

class RateLimiter {
    constructor(windowMs = 60000, maxRequests = 100) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.requests = new Map();

        // Cleanup old entries every minute (skip in test environment)
        if (process.env.NODE_ENV !== 'test') {
            this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
        }
    }

    cleanup() {
        const now = Date.now();
        for (const [key, data] of this.requests.entries()) {
            if (now - data.resetTime > this.windowMs) {
                this.requests.delete(key);
            }
        }
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    check(identifier) {
        const now = Date.now();
        const data = this.requests.get(identifier);

        if (!data || now - data.resetTime > this.windowMs) {
            // New window
            this.requests.set(identifier, {
                count: 1,
                resetTime: now
            });
            return { allowed: true, remaining: this.maxRequests - 1 };
        }

        if (data.count >= this.maxRequests) {
            // Rate limit exceeded
            return {
                allowed: false,
                remaining: 0,
                retryAfter: Math.ceil((data.resetTime + this.windowMs - now) / 1000)
            };
        }

        // Increment count
        data.count++;
        return { allowed: true, remaining: this.maxRequests - data.count };
    }
}

// Create rate limiters for different endpoints
const apiLimiterInstance = new RateLimiter(60000, 100); // 100 requests per minute
const createRoomLimiterInstance = new RateLimiter(60000, 10); // 10 room creations per minute

const rateLimitMiddleware = (limiter, identifier = 'ip') => {
    return (req, res, next) => {
        // Get identifier (IP address or user ID)
        const id = identifier === 'ip'
            ? req.ip || req.connection.remoteAddress
            : req.user?.id || req.ip;

        const result = limiter.check(id);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', limiter.maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remaining || 0);

        if (!result.allowed) {
            res.setHeader('X-RateLimit-Reset', result.retryAfter);
            return res.status(429).json({
                error: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later',
                retryAfter: result.retryAfter
            });
        }

        next();
    };
};

// Cleanup function for tests
const cleanup = () => {
    apiLimiterInstance.destroy();
    createRoomLimiterInstance.destroy();
};

module.exports = {
    apiLimiter: rateLimitMiddleware(apiLimiterInstance),
    createRoomLimiter: rateLimitMiddleware(createRoomLimiterInstance),
    cleanup
};
