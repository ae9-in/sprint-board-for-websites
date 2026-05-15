import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './utils/socket.js';
import { initRedis } from './utils/redis.js';
import { startNotificationWorker } from './workers/notificationWorker.js';

// ─── Startup Environment Validation ──────────────────────────────────────────
const REQUIRED_ENV_VARS = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`\n❌ FATAL: Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please set them in your .env file or Vercel dashboard.\n');
  process.exit(1);
}
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

async function startServer() {
  try {
    // Initialize Database
    await connectDB();
    console.log('✓ MongoDB connected');

    // Initialize Redis
    await initRedis();

    // Initialize Real-time System
    initSocket(server);
    console.log('✓ Socket.io initialized');

    // Start Background Workers
    startNotificationWorker();
    console.log('✓ Background workers started');

    server.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });

    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please terminate any existing node processes on this port.`);
        process.exit(1);
      } else {
        console.error('Server error:', e);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}


startServer();