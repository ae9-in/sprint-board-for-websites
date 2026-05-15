import Redis from 'ioredis';

let redisClient = null;

export const initRedis = async () => {
  if (process.env.REDIS_URL || process.env.NODE_ENV === 'test') {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(url, {
      maxRetriesPerRequest: null, // Required by BullMQ
      lazyConnect: true,
      keyPrefix: 'sprint:', // Isolates all keys to prevent disturbing other 'tables'
    });


    redisClient.on('error', (err) => {
      if (err.code === 'ECONNREFUSED' && process.env.NODE_ENV !== 'production') {
        // Only log once to keep the terminal clean
        if (!redisClient._loggedError) {
          console.warn('⚠️  Redis not found at 127.0.0.1:6379. Running in limited local mode (No background jobs/real-time sync).');
          redisClient._loggedError = true;
        }
        return;
      }
      console.error('Redis Client Error', err);
    });
    
    await redisClient.connect().catch(() => {
      // Catching the initial connection error to prevent process crash
    });

    
    if (redisClient.status === 'ready') {
      console.log('✓ Redis connected');
    }
  }
};

export const getRedisClient = () => redisClient;

export const getCache = async (key) => {
  if (!redisClient || redisClient.status !== 'ready') return null;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCache = async (key, value, ttlSeconds = 3600) => {
  if (!redisClient || redisClient.status !== 'ready') return;
  await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
};

export const delCache = async (key) => {
  if (!redisClient || redisClient.status !== 'ready') return;
  await redisClient.del(key);
};

export const generateCacheKey = (orgId, type, identifier = '') => {
  return `org:${orgId}:${type}${identifier ? `:${identifier}` : ''}`;
};

export default {
  initRedis,
  getRedisClient,
  getCache,
  setCache,
  delCache,
  generateCacheKey
};

