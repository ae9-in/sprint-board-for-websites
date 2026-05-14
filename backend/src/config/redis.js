import Redis from 'ioredis';

let redisClient = null;

export async function connectRedis() {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy: () => null
  });

  redisClient.on('connect', () => {
    console.log('✓ Redis connected');
  });

  redisClient.on('error', (err) => {
    console.log('Redis error:', err.message);
  });

  try {
    await redisClient.connect();
  } catch (err) {
    console.log('Redis connection failed, will run without Redis');
  }
  return redisClient;
}

export function getRedisClient() {
  return redisClient;
}