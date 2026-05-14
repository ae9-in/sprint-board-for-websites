# Sprint Board - Project Lifecycle Management Platform

## Quick Start

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Database
- MongoDB: mongodb+srv://jishnu:jishnu123@cluster0.mt6agn4.mongodb.net/?appName=Cluster0
- Database name: sprint-board (created automatically)

## API Endpoints

### Auth
- POST /api/auth/signup - Create organization & admin user
- POST /api/auth/login - User login
- POST /api/auth/refresh - Refresh token
- POST /api/auth/logout - Logout
- POST /api/auth/invite/send - Send team invite (admin)
- POST /api/auth/invite/accept - Accept invite

### Projects
- GET /api/projects - List projects
- POST /api/projects - Create project (admin)
- GET /api/projects/:id - Get project with stages
- PATCH /api/projects/:id - Update project
- DELETE /api/projects/:id - Soft delete project (admin)
- POST /api/projects/:id/stages/:type/approve - Approve stage (admin)
- POST /api/projects/:id/stages/:type/reject - Reject stage (admin)

### Tasks
- GET /api/projects/:id/tasks - List tasks
- POST /api/projects/:id/tasks - Create task
- PATCH /api/projects/:id/tasks/:id - Update task
- PATCH /api/projects/:id/tasks/:id/status - Update status
- DELETE /api/projects/:id/tasks/:id - Delete task
- POST /api/projects/:id/tasks/:id/comments - Add comment

### Sprints
- GET /api/projects/:id/sprints - List sprints
- POST /api/projects/:id/sprints - Create sprint
- POST /api/projects/:id/sprints/start - Start sprint

### Daily Logs
- GET /api/projects/:id/daily-logs - List logs
- POST /api/projects/:id/daily-logs - Submit log
- GET /api/projects/:id/daily-logs/my - My logs

### Dashboard
- GET /api/dashboard/admin - Admin stats (admin)
- GET /api/dashboard/user - User stats

### Notifications
- GET /api/notifications - List notifications
- GET /api/notifications/unread-count - Unread count
- PATCH /api/notifications/:id/read - Mark read

### SSE
- GET /api/notifications/stream - Real-time notifications

## Features Implemented
- Multi-tenant organization management
- JWT authentication with refresh tokens
- Role-based access control (SUPER_ADMIN, USER)
- 8-stage project workflow
- Sprint board with drag-and-drop
- Daily work logging
- Real-time notifications via SSE
- Dashboard metrics with MongoDB aggregations