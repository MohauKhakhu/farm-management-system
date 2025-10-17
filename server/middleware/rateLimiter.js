const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('redis');
const logger = require('../utils/logger');

let rateLimiter;

// Try to use Redis if available, otherwise fall back to memory
const initializeRateLimiter = () => {
  if (process.env.REDIS_URL) {
    try {
      const redisClient = redis.createClient({
        url: process.env.REDIS_URL
      });

      redisClient.on('error', (err) => {
        logger.error('Redis client error:', err);
        // Fall back to memory rate limiter
        rateLimiter = new RateLimiterMemory({
          keyPrefix: 'middleware',
          points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
          duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900, // 15 minutes
        });
      });

      redisClient.connect().then(() => {
        rateLimiter = new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: 'middleware',
          points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
          duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900, // 15 minutes
        });
        logger.info('Rate limiter initialized with Redis');
      });
    } catch (error) {
      logger.error('Failed to initialize Redis rate limiter:', error);
      // Fall back to memory
      rateLimiter = new RateLimiterMemory({
        keyPrefix: 'middleware',
        points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900,
      });
    }
  } else {
    rateLimiter = new RateLimiterMemory({
      keyPrefix: 'middleware',
      points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900,
    });
    logger.info('Rate limiter initialized with memory store');
  }
};

// Initialize rate limiter
initializeRateLimiter();

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.ip;
    await rateLimiter.consume(key);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: secs
    });
  }
};

// Strict rate limiter for auth endpoints
const authRateLimiter = new RateLimiterMemory({
  keyPrefix: 'auth',
  points: 5, // 5 attempts
  duration: 900, // per 15 minutes
  blockDuration: 900, // block for 15 minutes
});

const authRateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.ip;
    await authRateLimiter.consume(key);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Too many authentication attempts',
      retryAfter: secs
    });
  }
};

module.exports = {
  rateLimiter: rateLimiterMiddleware,
  authRateLimiter: authRateLimiterMiddleware
};