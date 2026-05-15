import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

// Lazily attempt to use Redis store; fall back to in-memory
function createStore() {
  if (isTest) return undefined;
  try {
    const { getRedisClient } = require('../utils/redis.js');
    const { RedisStore } = require('rate-limit-redis');
    const client = getRedisClient?.();
    if (client && client.status === 'ready') {
      return new RedisStore({ sendCommand: (...args) => client.call(...args) });
    }
  } catch (_) {
    // Redis not available — use in-memory store
  }
  return undefined;
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' }
  }
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isTest ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many API requests' }
  }
});

export const fileUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTest ? 10000 : 20,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many file uploads' }
  }
});

export default {
  authLimiter,
  apiLimiter,
  fileUploadLimiter
};