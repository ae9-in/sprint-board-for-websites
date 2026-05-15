import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') return;
  console.error('Queue Redis Error:', err);
});

export const notificationQueue = new Queue('notifications', {
  connection,
  prefix: '{sprint}',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 1000,
  },
});


export const addNotificationJob = (data) => {
  return notificationQueue.add('send-notification', data);
};
