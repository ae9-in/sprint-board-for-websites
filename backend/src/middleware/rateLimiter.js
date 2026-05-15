import rateLimit, { MemoryStore } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../utils/redis.js';

const isTest = process.env.NODE_ENV === 'test';

class SafeRedisProxy {
  constructor(prefix) {
    this.prefix = prefix;
    this.memoryStore = new MemoryStore();
    this.redisStore = null;
    this.initOptions = null;
  }

  init(options) {
    this.initOptions = options;
    this.memoryStore.init(options);
  }

  _tryInitRedis() {
    const client = getRedisClient();
    if (!this.redisStore && client && client.status === 'ready') {
      try {
        this.redisStore = new RedisStore({
          sendCommand: (...args) => client.call(...args),
          prefix: `rl:${this.prefix}:`,
        });
        if (this.initOptions) {
          this.redisStore.init(this.initOptions);
        }
      } catch (e) {
        this.redisStore = null;
      }
    }
    return this.redisStore;
  }

  async increment(key) {
    const store = this._tryInitRedis();
    if (store) {
      try { return await store.increment(key); } catch (e) {}
    }
    return this.memoryStore.increment(key);
  }

  async decrement(key) {
    const store = this._tryInitRedis();
    if (store) {
      try { return await store.decrement(key); } catch (e) {}
    }
    return this.memoryStore.decrement(key);
  }

  async resetKey(key) {
    const store = this._tryInitRedis();
    if (store) {
      try { return await store.resetKey(key); } catch (e) {}
    }
    return this.memoryStore.resetKey(key);
  }
}

// We let express-rate-limit handle the memory part by not providing a store 
// if Redis isn't ready, but in a way that doesn't crash.
const createStore = (name) => {
  if (isTest) return undefined;
  return new SafeRedisProxy(name);
};



export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('auth'),
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
  }
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isTest ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('api'),
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many API requests' }
  }
});

export const fileUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTest ? 10000 : 20,
  store: createStore('upload'),
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