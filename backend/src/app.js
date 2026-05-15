import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimiter from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import sprintRoutes from './routes/sprints.js';
import dailyLogRoutes from './routes/dailyLogs.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationRoutes from './routes/notifications.js';
import sseRoutes from './routes/sse.js';
import searchRoutes from './routes/search.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to auth routes
app.use('/api/auth', rateLimiter.authLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api', sprintRoutes);
app.use('/api', dailyLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications/stream', sseRoutes);
app.use('/api/search', searchRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;