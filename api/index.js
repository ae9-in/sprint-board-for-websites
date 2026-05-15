import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';

let isConnected = false;

export default async (req, res) => {
  // Ensure DB connection for every serverless invocation
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log('✓ Vercel: MongoDB connected');
    } catch (err) {
      console.error('❌ Vercel: DB Connection Error:', err);
      return res.status(500).json({ 
        success: false,
        error: { code: 'DB_CONNECTION_FAILED', message: 'Database connection failed' } 
      });
    }
  }

  // Handle the request with the Express app
  return app(req, res);
};
