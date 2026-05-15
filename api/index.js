import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';

let isConnected = false;

// Validate required environment variables
const REQUIRED_ENV_VARS = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

export default async (req, res) => {
  // Check env vars on every cold start
  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('❌ Missing env vars:', missing);
    return res.status(500).json({
      success: false,
      error: {
        code: 'MISCONFIGURED',
        message: `Server misconfigured. Missing environment variables: ${missing.join(', ')}. Please add them in your Vercel project settings.`
      }
    });
  }

  // Ensure DB connection for serverless invocations
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log('✓ Vercel: MongoDB connected');
    } catch (err) {
      isConnected = false; // Allow retry on next request
      console.error('❌ Vercel: DB Connection Error:', err.message);
      return res.status(500).json({ 
        success: false,
        error: { 
          code: 'DB_CONNECTION_FAILED', 
          message: 'Database connection failed. Please verify MONGODB_URI in Vercel settings.' 
        } 
      });
    }
  }

  // Pass request to Express app
  return app(req, res);
};
