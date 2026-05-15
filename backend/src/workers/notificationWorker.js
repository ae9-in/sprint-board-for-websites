import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { Notification } from '../models/Notification.js';
import { emitToUser } from '../utils/socket.js';
import nodemailer from 'nodemailer';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const startNotificationWorker = () => {
  const worker = new Worker('notifications', async (job) => {
    const { userId, organizationId, type, title, message, link, email } = job.data;

    console.log(`Processing notification for user: ${userId}`);

    try {
      // 1. Save to Database
      const notification = await Notification.create({
        organizationId,
        userId,
        type,
        title,
        message,
        link,
        createdBy: 'SYSTEM'
      });

      // 2. Push via WebSocket
      emitToUser(userId, 'notification', notification);

      // 3. Send Email (if enabled and email provided)
      if (email && process.env.SMTP_HOST) {
        await transporter.sendMail({
          from: `"Sprint Board" <${process.env.SMTP_FROM}>`,
          to: email,
          subject: title,
          text: message,
          html: `<p>${message}</p><a href="${process.env.FRONTEND_URL}${link}">View details</a>`,
        });
      }
    } catch (error) {
      console.error(`Failed to process notification ${job.id}:`, error);
      throw error; // Retry via BullMQ
    }
  }, { 
    connection,
    prefix: '{sprint}' 
  });


  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed: ${err.message}`);
  });

  return worker;
};
