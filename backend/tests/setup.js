// Set env vars for tests IMMEDIATELY
process.env.JWT_SECRET = 'test-secret-123';
process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import RedisMock from 'ioredis-mock';

// Mock Redis and BullMQ BEFORE other imports
jest.unstable_mockModule('ioredis', () => ({
  default: RedisMock,
  __esModule: true
}));

jest.unstable_mockModule('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job' }),
    on: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
  __esModule: true
}));

// Now import the rest
const { MongoMemoryServer } = await import('mongodb-memory-server');
const mongoose = (await import('mongoose')).default;
const { initRedis } = await import('../src/utils/redis.js');

let mongod;

beforeAll(async () => {
  // Initialize Redis Mock
  await initRedis();
  
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
