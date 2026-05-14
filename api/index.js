import 'dotenv/config';
import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';

let cachedConnection = null;

export default async (req, res) => {
  if (!cachedConnection) {
    try {
      cachedConnection = await connectDB();
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err);
    }
  }
  return app(req, res);
};
